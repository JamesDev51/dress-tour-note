import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import koreanFontUrl from "../../assets/pretendard-pdf-static.ttf?url";
import { getTourSnapshot, patchTour } from "../../db/repositories";
import type { Dress, Shop } from "../../types/domain";
import type { ExportOptions, ExportProgress } from "../../types/portable";
import { toArrayBuffer } from "../image/processFace";
import { activeAppearance, materialLabel } from "../dress/activeOptions";
import {
  getDressLooks,
  getPreferredStylingId,
  resolveDressLook,
} from "../dress/styling";
import { previewAspectRatio } from "../renderer/previewFrame";
import { dressSvgToJpeg, type DressSketchView } from "../renderer/dressSvg";
import {
  buildGarmentArtworkMarkup,
  prepareGarmentArtwork,
  type GarmentArtworkResult,
  type GarmentAsset,
} from "../renderer/garment";
import {
  buildPortableBundle,
  PORTABLE_MANIFEST_FILE_NAME,
  serializePortableBundle,
} from "./portable";
import { appendPortableTrailer } from "./portableTrailer";
import {
  dressTermBlocks,
  exceptionBlocks,
  recallBlocks,
  type TextBlock,
} from "./dressTextBlocks";

const A4: [number, number] = [595.28, 841.89];
const margin = 42;
const bottomContentY = 54;
const pdfColors = {
  accent: rgb(0.66, 0.37, 0.33),
  border: rgb(0.88, 0.84, 0.82),
  favorite: rgb(0.72, 0.36, 0.32),
  favoriteInk: rgb(0.3, 0.26, 0.24),
  ink: rgb(0.25, 0.22, 0.21),
  inkDetail: rgb(0.3, 0.27, 0.25),
  inkFaint: rgb(0.62, 0.59, 0.57),
  inkHeading: rgb(0.18, 0.16, 0.15),
  inkLight: rgb(0.55, 0.52, 0.5),
  inkMuted: rgb(0.45, 0.42, 0.4),
  inkSoft: rgb(0.5, 0.47, 0.45),
  inkStrong: rgb(0.13, 0.12, 0.12),
  summary: rgb(0.52, 0.49, 0.47),
  surface: rgb(0.98, 0.96, 0.95),
} as const;
const sketchViews = [
  "full",
  "upper",
] as const satisfies readonly DressSketchView[];
const sketchViewLabels = { full: "전체", upper: "상체" } as const;

type DetailFlow = {
  page: PDFPage;
  y: number;
};

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const paragraphStart = lines.length;
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
        continue;
      }
      let fragment = "";
      for (const character of [...word]) {
        const nextFragment = fragment + character;
        if (fragment && font.widthOfTextAtSize(nextFragment, size) > maxWidth) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment = nextFragment;
        }
      }
      line = fragment;
    }
    if (line) lines.push(line);
    if (!words.length) lines.push("");
    if (lines.length - paragraphStart >= 2) {
      const lastIndex = lines.length - 1;
      const previousIndex = lastIndex - 1;
      const lastLine = lines[lastIndex] ?? "";
      const previousWords = (lines[previousIndex] ?? "").split(" ");
      const movedWord = previousWords.pop();
      if (
        movedWord &&
        previousWords.length > 0 &&
        font.widthOfTextAtSize(lastLine, size) < maxWidth * 0.3 &&
        font.widthOfTextAtSize(`${movedWord} ${lastLine}`, size) <= maxWidth
      ) {
        lines[previousIndex] = previousWords.join(" ");
        lines[lastIndex] = `${movedWord} ${lastLine}`;
      }
    }
  }
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
  color = pdfColors.ink,
) {
  for (const line of wrap(font, text, size, maxWidth)) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

function footer(
  page: PDFPage,
  font: PDFFont,
  index: number,
  total: number,
  portable: boolean,
) {
  if (index === 1) {
    page.drawText("제작 · 할미눈나 (@halminunna)", {
      x: margin,
      y: 41,
      size: 9,
      font,
      color: pdfColors.inkMuted,
    });
  }
  page.drawText(`${index} / ${total}`, {
    x: 500,
    y: 24,
    size: 8,
    font,
    color: pdfColors.inkLight,
  });
  page.drawText(
    portable
      ? "드레스노트 · 이 PDF는 웹에서 다시 불러올 수 있습니다."
      : "드레스노트 · 보기 전용 PDF",
    { x: margin, y: 24, size: 7, font, color: pdfColors.inkFaint },
  );
}

function dressLabel(dress: Dress, shop: Shop) {
  return `${shop.name} · ${dress.order + 1}번째 · ${dress.label}`;
}

function headingSize(font: PDFFont, label: string, maxSize: number) {
  let size = Math.min(maxSize, (511 * 2.95) / font.widthOfTextAtSize(label, 1));
  while (wrap(font, label, size, 511).length > 3) size -= 0.25;
  return size;
}

function drawBoundedHeading(page: PDFPage, font: PDFFont, label: string) {
  return drawTextLines(
    page,
    font,
    label,
    margin,
    790,
    headingSize(font, label, 15),
    511,
    16,
    pdfColors.inkHeading,
  );
}

function drawDetailHeader(
  page: PDFPage,
  font: PDFFont,
  label: string,
  continuation: boolean,
) {
  const headingEnd = drawBoundedHeading(page, font, label);
  const subtitleY = Math.min(758, headingEnd - 6);
  page.drawText(continuation ? "상세 기록 · 계속" : "상세 기록", {
    x: margin,
    y: subtitleY,
    size: 9,
    font,
    color: pdfColors.accent,
  });
  return subtitleY - 32;
}

function drawFlowBlocks(
  pdf: PDFDocument,
  font: PDFFont,
  label: string,
  initial: DetailFlow,
  blocks: readonly TextBlock[],
): DetailFlow {
  let flow = initial;
  const nextPage = () => {
    const page = pdf.addPage(A4);
    flow = { page, y: drawDetailHeader(page, font, label, true) };
  };

  for (const block of blocks) {
    const lines = wrap(font, block.text, 9, 500);
    if (flow.y - 22 - Math.min(lines.length, 2) * 15 < bottomContentY)
      nextPage();
    flow.page.drawText(block.label, {
      x: margin,
      y: flow.y,
      size: 8,
      font,
      color: pdfColors.accent,
    });
    flow.y -= 19;
    for (const line of lines) {
      if (flow.y < bottomContentY) nextPage();
      flow.page.drawText(line || " ", {
        x: margin,
        y: flow.y,
        size: 9,
        font,
        color: pdfColors.inkDetail,
      });
      flow.y -= 15;
    }
    flow.y -= 11;
  }
  return flow;
}

function drawSketchPanel(
  page: PDFPage,
  font: PDFFont,
  image: PDFImage,
  view: (typeof sketchViews)[number],
  x: number,
) {
  const width = 247;
  const imageWidth = width - 2;
  const imageHeight = imageWidth / previewAspectRatio[view];
  const top = 708;
  page.drawText(sketchViewLabels[view], {
    x,
    y: 728,
    size: 9,
    font,
    color: pdfColors.accent,
  });
  page.drawRectangle({
    x,
    y: top - imageHeight - 2,
    width,
    height: imageHeight + 2,
    borderWidth: 0.75,
    borderColor: pdfColors.border,
  });
  page.drawImage(image, {
    x: x + 1,
    y: top - imageHeight - 1,
    width: imageWidth,
    height: imageHeight,
  });
}

function artworkAssets(artwork: GarmentArtworkResult): readonly GarmentAsset[] {
  return [
    ...artwork.layers.map(({ asset }) => asset),
    ...artwork.textures.map(({ asset }) => asset),
    ...(artwork.detailAssets ?? []),
  ].filter(
    (asset, index, assets) =>
      assets.findIndex((candidate) => candidate.assetId === asset.assetId) ===
      index,
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    chunks.push(
      String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)),
    );
  return btoa(chunks.join(""));
}

async function embedRemainingGarmentAssets(
  artwork: GarmentArtworkResult,
  namespace: string,
): Promise<GarmentArtworkResult> {
  if (!artwork.markup.includes('href="/assets/garment/')) return artwork;
  const loaded = await Promise.all(
    artworkAssets(artwork).map(async (asset) => {
      if (!asset.path.startsWith("/assets/garment/"))
        throw new Error("드레스 이미지 경로가 올바르지 않아요.");
      const response = await fetch(asset.path);
      if (!response.ok)
        throw new Error("드레스 이미지를 PDF에 포함하지 못했어요.");
      return [
        asset.assetId,
        `data:image/webp;base64,${bytesToBase64(
          new Uint8Array(await response.arrayBuffer()),
        )}`,
      ] as const;
    }),
  );
  const hrefs = new Map(loaded);
  return {
    ...artwork,
    markup: buildGarmentArtworkMarkup(artwork, {
      namespace,
      assetHrefs: hrefs,
    }),
  };
}

function assertEmbeddedGarmentArtwork(markup: string): void {
  if (markup.includes('href="/assets/garment/'))
    throw new Error("드레스 이미지를 PDF에 포함하지 못했어요.");
}

export async function exportPortablePdf(
  tourId: string,
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void,
) {
  const portable = options.mode === "portable";

  onProgress?.({ step: "prepare", percent: 5, label: "데이터 준비" });
  const snapshot = await getTourSnapshot(tourId);
  if (!snapshot.dresses.length)
    throw new Error("드레스를 한 벌 이상 기록해 주세요.");

  const bundle = buildPortableBundle(snapshot, false);
  const looks = snapshot.dresses.flatMap((dress) =>
    getDressLooks(dress).map((look) => ({
      dress: activeAppearance(resolveDressLook(dress, look.id)),
      label: dress.stylingVariants?.length ? look.label : undefined,
      id: look.id,
      key: JSON.stringify([dress.id, look.id]),
      preferred: getPreferredStylingId(dress) === look.id,
    })),
  );

  onProgress?.({ step: "render", percent: 15, label: "드레스 이미지 생성" });
  const rendered = new Map<string, Uint8Array>();
  const artworkStates = new Map<string, "ready" | "partial" | "unavailable">();
  for (let index = 0; index < looks.length; index += 1) {
    const look = looks[index];
    const { dress } = look;
    for (const view of sketchViews) {
      const artworkNamespace = `pdf-${dress.id}-${look.id}-${view}`;
      const prepared = await prepareGarmentArtwork(dress, {
        view,
        embedAssets: true,
        namespace: artworkNamespace,
      });
      const artwork = await embedRemainingGarmentAssets(
        prepared,
        artworkNamespace,
      );
      assertEmbeddedGarmentArtwork(artwork.markup);
      artworkStates.set(`${look.key}:${view}`, artwork.status);
      const pixelWidth = 480;
      rendered.set(
        `${look.key}:${view}`,
        await dressSvgToJpeg(
          dress,
          undefined,
          false,
          pixelWidth,
          pixelWidth / previewAspectRatio[view],
          view,
          {
            preparedArtwork: artwork,
            namespace: artworkNamespace,
            mode: "visual",
          },
        ),
      );
    }
    onProgress?.({
      step: "render",
      percent: 15 + Math.round(((index + 1) / looks.length) * 40),
      label: `연출 이미지 ${index + 1}/${looks.length}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  onProgress?.({ step: "assemble", percent: 60, label: "PDF 만드는 중" });
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await fetch(koreanFontUrl).then((response) => {
    if (!response.ok) throw new Error("한글 폰트를 불러오지 못했어요.");
    return response.arrayBuffer();
  });
  const font = await pdf.embedFont(fontBytes, { subset: false });
  const shopsById = new Map(
    snapshot.shops.map((shop) => [shop.id, shop] as const),
  );
  const embeddedJpegs = new Map(
    await Promise.all(
      looks.flatMap((look) =>
        sketchViews.map(async (view) => {
          const key = `${look.key}:${view}`;
          const renderedJpg = rendered.get(key);
          if (!renderedJpg) throw new Error("드레스 이미지가 손상됐어요.");
          return [key, await pdf.embedJpg(renderedJpg)] as const;
        }),
      ),
    ),
  );
  pdf.setTitle(`${snapshot.tour.title} - 드레스노트`);
  pdf.setSubject(
    portable ? "백업용 드레스투어 기록" : "보기 전용 드레스투어 기록",
  );
  pdf.setCreator("드레스노트");

  const favorites = looks.filter(
    ({ dress, preferred }) => dress.isFavorite && preferred,
  );
  let page = pdf.addPage(A4);
  page.drawText("드레스노트", {
    x: margin,
    y: 775,
    size: 13,
    font,
    color: pdfColors.accent,
  });
  page.drawLine({
    start: { x: margin, y: 755 },
    end: { x: margin + 48, y: 755 },
    thickness: 2,
    color: pdfColors.accent,
  });
  let y =
    drawTextLines(
      page,
      font,
      snapshot.tour.title,
      margin,
      724,
      26,
      511,
      34,
      pdfColors.inkStrong,
    ) - 16;
  y = drawTextLines(
    page,
    font,
    `${snapshot.tour.brideName ? `신부 ${snapshot.tour.brideName} · ` : ""}${snapshot.tour.tourDate || "날짜 미입력"}`,
    margin,
    y,
    11,
    500,
    18,
    pdfColors.inkMuted,
  );
  y -= 20;
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: 511,
    height: 48,
    color: pdfColors.surface,
  });
  page.drawText(`드레스샵 ${snapshot.shops.length}곳`, {
    x: margin + 16,
    y,
    size: 13,
    font,
  });
  page.drawText(`드레스 ${snapshot.dresses.length}벌`, {
    x: 190,
    y,
    size: 12,
    font,
  });
  page.drawText(`후보 ${favorites.length}벌`, { x: 360, y, size: 12, font });
  y -= 50;
  page.drawText("방문한 드레스샵", {
    x: margin,
    y,
    size: 10,
    font,
    color: pdfColors.accent,
  });
  y -= 26;
  for (const shop of snapshot.shops) {
    const count = snapshot.dresses.filter(
      (dress) => dress.shopId === shop.id,
    ).length;
    const shopLabel = `${shop.order + 1}. ${shop.name}`;
    const rowHeight = wrap(font, shopLabel, 12, 430).length * 18 + 12;
    if (y - rowHeight < bottomContentY) {
      page = pdf.addPage(A4);
      page.drawText("방문한 드레스샵 · 계속", {
        x: margin,
        y: 775,
        size: 13,
        font,
        color: pdfColors.accent,
      });
      y = 735;
    }
    page.drawText(`${count}벌`, {
      x: 510,
      y,
      size: 10,
      font,
      color: pdfColors.inkSoft,
    });
    y = drawTextLines(page, font, shopLabel, margin, y, 12, 430, 18) - 12;
  }
  for (const look of looks) {
    const { dress } = look;
    const shop = shopsById.get(dress.shopId);
    if (!shop) throw new Error("드레스샵 연결 정보가 손상됐어요.");

    page = pdf.addPage(A4);
    const label = [
      dressLabel(dress, shop),
      look.label,
      look.label && look.preferred && "대표 연출",
    ]
      .filter(Boolean)
      .join(" · ");
    drawBoundedHeading(page, font, label);
    if (dress.isFavorite)
      page.drawText("♥ 후보", {
        x: 485,
        y: 744,
        size: 9,
        font,
        color: pdfColors.favorite,
      });

    sketchViews.forEach((view, index) => {
      const image = embeddedJpegs.get(`${look.key}:${view}`);
      if (!image) throw new Error("드레스 이미지가 손상됐어요.");
      drawSketchPanel(page, font, image, view, margin + index * 264);
    });
    const dressArtworkStatuses = sketchViews.map(
      (view) => artworkStates.get(`${look.key}:${view}`) ?? "unavailable",
    );
    if (dressArtworkStatuses.includes("unavailable")) {
      page.drawText(
        "이미지를 만들지 못한 부분은 기록한 특징을 간단한 그림으로 표시했어요.",
        {
          x: margin,
          y: 255,
          size: 9,
          font,
          color: pdfColors.inkMuted,
        },
      );
    }
    page.drawRectangle({
      x: margin,
      y: 202,
      width: 511,
      height: 48,
      color: pdfColors.surface,
    });
    page.drawText("소재", {
      x: margin + 16,
      y: 233,
      size: 8,
      font,
      color: pdfColors.accent,
    });
    page.drawText(materialLabel(dress), {
      x: margin + 16,
      y: 215,
      size: 10,
      font,
      color: pdfColors.ink,
    });
    drawTextLines(
      page,
      font,
      dressTermBlocks(dress)
        .map(({ label, text }) => `${label} ${text}`)
        .join(" · "),
      margin,
      170,
      8,
      511,
      14,
    );

    page = pdf.addPage(A4);
    let flow: DetailFlow = {
      page,
      y: drawDetailHeader(page, font, label, false),
    };
    flow = drawFlowBlocks(pdf, font, label, flow, recallBlocks(dress));
    flow = drawFlowBlocks(pdf, font, label, flow, dressTermBlocks(dress));
    flow = drawFlowBlocks(pdf, font, label, flow, exceptionBlocks(dress));
    flow = drawFlowBlocks(pdf, font, label, flow, [
      {
        label: "태그",
        text: dress.quickTags.length ? dress.quickTags.join(" · ") : "미기록",
      },
      {
        label: "별점",
        text: dress.rating ? `${dress.rating} / 5` : "미기록",
      },
      { label: "메모", text: dress.memo || "미기록" },
    ]);
  }

  if (favorites.length) {
    favorites.forEach((look, index) => {
      const { dress } = look;
      const shop = shopsById.get(dress.shopId);
      if (!shop) return;
      page = pdf.addPage(A4);
      page.drawText(index === 0 ? "후보 드레스" : "후보 드레스 · 계속", {
        x: margin,
        y: 790,
        size: 10,
        font,
        color: pdfColors.accent,
      });
      const favoriteLabel = [
        `♥ ${dressLabel(dress, shop)}`,
        look.label,
        look.label && "대표 연출",
      ]
        .filter(Boolean)
        .join(" · ");
      const favoriteLabelSize = headingSize(font, favoriteLabel, 14);
      drawTextLines(
        page,
        font,
        favoriteLabel,
        margin,
        756,
        favoriteLabelSize,
        511,
        18,
        pdfColors.favoriteInk,
      );
      const fullSketch = embeddedJpegs.get(`${look.key}:full`);
      if (!fullSketch) throw new Error("드레스 이미지가 손상됐어요.");
      const favoriteWidth = 210;
      const favoriteHeight = favoriteWidth / previewAspectRatio.full;
      const favoriteBottom = 699 - favoriteHeight;
      page.drawImage(fullSketch, {
        x: margin,
        y: favoriteBottom,
        width: favoriteWidth,
        height: favoriteHeight,
      });
      const favoriteArtworkStatus = artworkStates.get(`${dress.id}:full`);
      if (favoriteArtworkStatus && favoriteArtworkStatus !== "ready") {
        page.drawText(
          favoriteArtworkStatus === "partial"
            ? "일부 기록만 반영했어요."
            : "이미지를 만들지 못해 기록한 특징을 간단한 그림으로 표시했어요.",
          {
            x: margin,
            y: favoriteBottom - 17,
            size: 8,
            font,
            color: pdfColors.inkLight,
          },
        );
      }
      const summaryX = 280;
      page.drawText("후보 결정 요약", {
        x: summaryX,
        y: 690,
        size: 10,
        font,
        color: pdfColors.accent,
      });
      let favoriteY = drawTextLines(
        page,
        font,
        dressTermBlocks(dress)
          .slice(0, 4)
          .map(({ text }) => text)
          .join(" · "),
        summaryX,
        665,
        10,
        273,
        16,
        pdfColors.summary,
      );
      for (const block of recallBlocks(dress)) {
        favoriteY -= 9;
        favoriteY = drawTextLines(
          page,
          font,
          block.label,
          summaryX,
          favoriteY,
          9,
          273,
          14,
          pdfColors.accent,
        );
        favoriteY = drawTextLines(
          page,
          font,
          block.text,
          summaryX,
          favoriteY,
          10,
          273,
          16,
        );
      }
      favoriteY -= 12;
      favoriteY = drawTextLines(
        page,
        font,
        `별점 ${dress.rating ? `${dress.rating} / 5` : "미기록"}`,
        summaryX,
        favoriteY,
        10,
        273,
        16,
      );
      favoriteY -= 12;
      favoriteY = drawTextLines(
        page,
        font,
        `태그 ${dress.quickTags.length ? dress.quickTags.join(" · ") : "미기록"}`,
        summaryX,
        favoriteY,
        10,
        273,
        16,
      );
      favoriteY -= 12;
      const boundedMemo =
        dress.memo.length > 240 ? `${dress.memo.slice(0, 239)}…` : dress.memo;
      drawTextLines(
        page,
        font,
        `메모 ${boundedMemo || "미기록"}`,
        summaryX,
        favoriteY,
        9,
        273,
        15,
        pdfColors.inkMuted,
      );
    });
  }

  const visualPages = pdf.getPages();
  visualPages.forEach((visualPage, index) =>
    footer(visualPage, font, index + 1, visualPages.length, portable),
  );

  let portableSerialized:
    Awaited<ReturnType<typeof serializePortableBundle>> | undefined;

  if (portable) {
    onProgress?.({ step: "attach", percent: 90, label: "백업 기록 담는 중" });
    const serialized = await serializePortableBundle(bundle);
    portableSerialized = serialized;
    await pdf.attach(serialized.manifestBytes, PORTABLE_MANIFEST_FILE_NAME, {
      mimeType: "application/json",
      description: "드레스노트 백업 정보",
    });
    await pdf.attach(serialized.tourBytes, serialized.manifest.tourAttachment, {
      mimeType: "application/json",
      description: "드레스노트 투어 원본 데이터",
    });
    onProgress?.({
      step: "verify",
      percent: 96,
      label: "백업 기록 확인 중",
    });
  } else {
    onProgress?.({
      step: "attach",
      percent: 94,
      label: "보기 전용 PDF 마무리",
    });
  }

  const savedBytes = await pdf.save();
  const bytes = portableSerialized
    ? appendPortableTrailer(savedBytes, portableSerialized)
    : savedBytes;
  await patchTour(tourId, { lastExportedAt: new Date().toISOString() });
  onProgress?.({ step: "done", percent: 100, label: "완료" });
  return new Blob([toArrayBuffer(bytes)], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareBlob(blob: Blob, fileName: string, title: string) {
  if (
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  )
    return false;
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], title });
  return true;
}
