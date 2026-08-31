import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import koreanFontUrl from '@fontsource/noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff2?url';
import { getTourSnapshot, patchTour } from '../../db/repositories';
import type { Dress, Shop } from '../../types/domain';
import type { ExportOptions, ExportProgress } from '../../types/portable';
import { blobToDataUrl, toArrayBuffer } from '../image/processFace';
import { backStyleOptions, optionLabel, summarizeDress } from '../dress/options';
import { dressSvgToJpeg } from '../renderer/dressSvg';
import {
  buildPortableBundle,
  PORTABLE_MANIFEST_FILE_NAME,
  serializePortableBundle,
} from './portable';

const A4: [number, number] = [595.28, 841.89];
const margin = 42;

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = [...text];
  const lines: string[] = [];
  let line = '';
  for (const ch of words) {
    const next = line + ch;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawTextLines(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size = 10,
  maxWidth = 500,
  lineHeight = 16,
  color = rgb(0.25, 0.22, 0.21),
) {
  for (const line of wrap(font, text, size, maxWidth)) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

function footer(page: PDFPage, font: PDFFont, index: number, total: number, portable: boolean) {
  page.drawText(`${index} / ${total}`, {
    x: 500,
    y: 24,
    size: 8,
    font,
    color: rgb(0.55, 0.52, 0.5),
  });
  page.drawText(
    portable ? '그드레스 · 이 PDF는 웹에서 다시 불러올 수 있습니다.' : '그드레스 · 보기 전용 PDF',
    { x: margin, y: 24, size: 7, font, color: rgb(0.62, 0.59, 0.57) },
  );
}

function dressLabel(dress: Dress, shop: Shop) {
  return `${shop.name} · ${dress.label}`;
}

export async function exportPortablePdf(
  tourId: string,
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void,
) {
  const portable = options.mode === 'portable';
  const includeFace = portable && options.includeFace;

  onProgress?.({ step: 'prepare', percent: 5, label: '데이터 준비' });
  const snapshot = await getTourSnapshot(tourId);
  if (!snapshot.dresses.length) throw new Error('드레스를 한 벌 이상 기록해 주세요.');

  const bundle = buildPortableBundle(snapshot, includeFace);
  const face = bundle.assets[0];
  const faceData = face ? await blobToDataUrl(face.blob) : undefined;

  onProgress?.({ step: 'render', percent: 15, label: '드레스 이미지 생성' });
  const rendered = new Map<string, Uint8Array>();
  for (let index = 0; index < snapshot.dresses.length; index += 1) {
    const dress = snapshot.dresses[index];
    rendered.set(dress.id, await dressSvgToJpeg(dress, faceData, includeFace, 600, 1067));
    onProgress?.({
      step: 'render',
      percent: 15 + Math.round(((index + 1) / snapshot.dresses.length) * 40),
      label: `드레스 이미지 ${index + 1}/${snapshot.dresses.length}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  onProgress?.({ step: 'assemble', percent: 60, label: 'PDF 조립' });
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await fetch(koreanFontUrl).then((response) => {
    if (!response.ok) throw new Error('한글 폰트를 불러오지 못했어요.');
    return response.arrayBuffer();
  });
  const font = await pdf.embedFont(fontBytes, { subset: true });
  pdf.setTitle(`${snapshot.tour.title} - 그드레스`);
  pdf.setSubject(portable ? '복원 가능한 드레스투어 기록' : '보기 전용 드레스투어 기록');
  pdf.setCreator('그드레스');

  const favorites = snapshot.dresses.filter((dress) => dress.isFavorite);
  const totalPages = 1 + snapshot.dresses.length + (favorites.length ? 1 : 0);
  let pageIndex = 1;
  let page = pdf.addPage(A4);
  page.drawText('그드레스', { x: margin, y: 775, size: 13, font, color: rgb(0.66, 0.37, 0.33) });
  page.drawText(snapshot.tour.title, { x: margin, y: 730, size: 28, font, color: rgb(0.13, 0.12, 0.12) });
  let y = 690;
  y = drawTextLines(
    page,
    font,
    `${snapshot.tour.brideName ? `신부 ${snapshot.tour.brideName} · ` : ''}${snapshot.tour.tourDate || '날짜 미입력'}`,
    margin,
    y,
    11,
    500,
    18,
    rgb(0.45, 0.42, 0.4),
  );
  y -= 14;
  page.drawText(`드레스샵 ${snapshot.shops.length}곳`, { x: margin, y, size: 12, font });
  page.drawText(`드레스 ${snapshot.dresses.length}벌`, { x: 190, y, size: 12, font });
  page.drawText(`후보 ${favorites.length}벌`, { x: 330, y, size: 12, font });
  y -= 50;
  page.drawText('SHOP LIST', { x: margin, y, size: 9, font, color: rgb(0.66, 0.37, 0.33) });
  y -= 26;
  for (const shop of snapshot.shops) {
    const count = snapshot.dresses.filter((dress) => dress.shopId === shop.id).length;
    page.drawText(`${shop.order + 1}. ${shop.name}`, { x: margin, y, size: 12, font });
    page.drawText(`${count}벌`, { x: 470, y, size: 10, font, color: rgb(0.5, 0.47, 0.45) });
    y -= 28;
  }
  footer(page, font, pageIndex, totalPages, portable);
  pageIndex += 1;

  for (const dress of snapshot.dresses) {
    const shop = snapshot.shops.find((candidate) => candidate.id === dress.shopId);
    if (!shop) throw new Error('드레스샵 연결 정보가 손상됐어요.');

    page = pdf.addPage(A4);
    page.drawText(dressLabel(dress, shop), { x: margin, y: 790, size: 16, font, color: rgb(0.18, 0.16, 0.15) });
    if (dress.isFavorite) page.drawText('♥ 후보', { x: 485, y: 790, size: 9, font, color: rgb(0.72, 0.36, 0.32) });

    const jpg = await pdf.embedJpg(rendered.get(dress.id)!);
    const dimensions = jpg.scaleToFit(245, 435);
    page.drawImage(jpg, { x: margin, y: 320, width: dimensions.width, height: dimensions.height });

    const styleX = 320;
    let styleY = 730;
    page.drawText('STYLE', { x: styleX, y: styleY, size: 9, font, color: rgb(0.66, 0.37, 0.33) });
    styleY -= 24;
    styleY = drawTextLines(page, font, summarizeDress(dress).join(' · ') || '형태 기록 없음', styleX, styleY, 10, 230, 17);
    styleY -= 10;

    if (dress.backStyle && dress.backStyle !== 'unknown') {
      page.drawText('BACK', { x: styleX, y: styleY, size: 9, font, color: rgb(0.66, 0.37, 0.33) });
      styleY -= 22;
      styleY = drawTextLines(page, font, optionLabel(backStyleOptions, dress.backStyle), styleX, styleY, 9, 230, 16);
      styleY -= 10;
    }
    if (dress.details.length) {
      page.drawText('DETAIL', { x: styleX, y: styleY, size: 9, font, color: rgb(0.66, 0.37, 0.33) });
      styleY -= 22;
      styleY = drawTextLines(page, font, dress.details.join(' · '), styleX, styleY, 9, 230, 16);
      styleY -= 10;
    }
    if (dress.quickTags.length) {
      page.drawText('평가', { x: styleX, y: styleY, size: 9, font, color: rgb(0.66, 0.37, 0.33) });
      styleY -= 22;
      styleY = drawTextLines(page, font, dress.quickTags.join(' · '), styleX, styleY, 9, 230, 16);
      styleY -= 10;
    }
    if (dress.rating) {
      page.drawText(`별점 ${'★'.repeat(dress.rating)}${'☆'.repeat(5 - dress.rating)}`, { x: styleX, y: styleY, size: 9, font });
      styleY -= 26;
    }
    page.drawText('MEMO', { x: styleX, y: styleY, size: 9, font, color: rgb(0.66, 0.37, 0.33) });
    styleY -= 22;
    drawTextLines(page, font, dress.memo || '메모 없음', styleX, styleY, 9, 230, 16, rgb(0.38, 0.35, 0.33));
    footer(page, font, pageIndex, totalPages, portable);
    pageIndex += 1;
  }

  if (favorites.length) {
    page = pdf.addPage(A4);
    page.drawText('MY FAVORITES', { x: margin, y: 780, size: 11, font, color: rgb(0.66, 0.37, 0.33) });
    page.drawText('최종 후보 모아보기', { x: margin, y: 740, size: 24, font });
    let favoriteY = 690;
    for (const dress of favorites) {
      const shop = snapshot.shops.find((candidate) => candidate.id === dress.shopId);
      if (!shop) continue;
      page.drawText(`♥ ${shop.name} · ${dress.label}`, { x: margin, y: favoriteY, size: 12, font, color: rgb(0.3, 0.26, 0.24) });
      favoriteY -= 20;
      favoriteY = drawTextLines(page, font, summarizeDress(dress).slice(0, 3).join(' · '), margin + 18, favoriteY, 8, 490, 14, rgb(0.52, 0.49, 0.47));
      favoriteY -= 14;
    }
    footer(page, font, pageIndex, totalPages, portable);
  }

  if (portable) {
    onProgress?.({ step: 'attach', percent: 90, label: '복원 데이터 첨부' });
    const serialized = await serializePortableBundle(bundle);
    await pdf.attach(serialized.manifestBytes, PORTABLE_MANIFEST_FILE_NAME, {
      mimeType: 'application/json',
      description: '그드레스 복원 매니페스트',
    });
    await pdf.attach(serialized.tourBytes, serialized.manifest.tourAttachment, {
      mimeType: 'application/json',
      description: '그드레스 투어 원본 데이터',
    });
    if (serialized.faceBytes && serialized.manifest.faceAttachment) {
      const faceRef = bundle.payload.assets[0];
      await pdf.attach(serialized.faceBytes, serialized.manifest.faceAttachment, {
        mimeType: faceRef.mimeType,
        description: '로컬 얼굴 이미지',
      });
    }
    onProgress?.({ step: 'verify', percent: 96, label: '복원 데이터 무결성 확인' });
  } else {
    onProgress?.({ step: 'attach', percent: 94, label: '보기 전용 PDF 마무리' });
  }

  const bytes = await pdf.save();
  await patchTour(tourId, { lastExportedAt: new Date().toISOString() });
  onProgress?.({ step: 'done', percent: 100, label: '완료' });
  return new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareBlob(blob: Blob, fileName: string, title: string) {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
  const file = new File([blob], fileName, { type: 'application/pdf' });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], title });
  return true;
}
