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
import type { Dress, DressOptionCategory, Shop } from "../../types/domain";
import type { ExportOptions, ExportProgress } from "../../types/portable";
import { blobToDataUrl, toArrayBuffer } from "../image/processFace";
import {
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  summarizeDress,
  topStyleOptions,
  trainOptions,
  waistlineOptions,
} from "../dress/options";
import { dressRenderTokens } from "../dress/renderTokens";
import { dressSvgToJpeg, type DressSketchView } from "../renderer/dressSvg";
import {
  buildPortableBundle,
  PORTABLE_MANIFEST_FILE_NAME,
  serializePortableBundle,
} from "./portable";
import { appendPortableTrailer } from "./portableTrailer";

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
  "back",
] as const satisfies readonly DressSketchView[];
const exceptionCategories = [
  "top",
  "neckline",
  "silhouette",
  "fabric",
  "color",
  "waistline",
  "backStyle",
  "train",
  "details",
] as const satisfies readonly DressOptionCategory[];
const sketchViewLabels: Readonly<Record<DressSketchView, string>> = {
  full: "전체",
  upper: "상체",
  back: "뒤태",
};
const categoryLabels: Readonly<Record<DressOptionCategory, string>> = {
  top: "상의 디자인",
  neckline: "네크라인",
  silhouette: "실루엣",
  fabric: "소재",
  color: "색상",
  waistline: "허리선",
  backStyle: "등 디자인",
  train: "트레인",
  details: "디테일",
};

type TextBlock = {
  readonly label: string;
  readonly text: string;
};

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
  return `${shop.name} · ${dress.label}`;
}

function hexColor(value: string) {
  const normalized = value.startsWith("#") ? value.slice(1) : value;
  return rgb(
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  );
}

function dressTermBlocks(dress: Dress): readonly TextBlock[] {
  return [
    {
      label: categoryLabels.top,
      text: optionLabel(topStyleOptions, dress.topStyle),
    },
    {
      label: categoryLabels.neckline,
      text: optionLabel(necklineOptions, dress.neckline),
    },
    {
      label: categoryLabels.silhouette,
      text: optionLabel(silhouetteOptions, dress.silhouette),
    },
    {
      label: categoryLabels.fabric,
      text: optionLabel(fabricOptions, dress.fabric),
    },
    {
      label: categoryLabels.color,
      text: optionLabel(colorOptions, dress.color),
    },
    {
      label: categoryLabels.waistline,
      text: optionLabel(waistlineOptions, dress.waistline),
    },
    {
      label: categoryLabels.backStyle,
      text: optionLabel(backStyleOptions, dress.backStyle),
    },
    {
      label: categoryLabels.train,
      text: optionLabel(trainOptions, dress.train),
    },
    {
      label: categoryLabels.details,
      text: dress.details.length
        ? dress.details
            .map((detail) => optionLabel(detailOptions, detail))
            .join(" · ")
        : "미기록",
    },
  ];
}

function exceptionBlocks(dress: Dress): readonly TextBlock[] {
  return exceptionCategories.flatMap((category) => {
    const note = dress.customOptions?.[category];
    return note
      ? [
          {
            label: `${categoryLabels[category]} · 비슷하지만 달라요`,
            text: note,
          },
        ]
      : [];
  });
}

function drawDetailHeader(
  page: PDFPage,
  font: PDFFont,
  label: string,
  continuation: boolean,
) {
  page.drawText(label, {
    x: margin,
    y: 790,
    size: 15,
    font,
    color: pdfColors.inkHeading,
  });
  page.drawText(continuation ? "상세 기록 · 계속" : "상세 기록", {
    x: margin,
    y: 758,
    size: 9,
    font,
    color: pdfColors.accent,
  });
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
    drawDetailHeader(page, font, label, true);
    flow = { page, y: 726 };
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
  view: DressSketchView,
  x: number,
) {
  const width = 155;
  const height = 276;
  page.drawText(sketchViewLabels[view], {
    x,
    y: 728,
    size: 9,
    font,
    color: pdfColors.accent,
  });
  page.drawRectangle({
    x,
    y: 432,
    width,
    height,
    borderWidth: 0.75,
    borderColor: pdfColors.border,
  });
  page.drawImage(image, {
    x: x + 1,
    y: 433,
    width: width - 2,
    height: height - 2,
  });
}

export async function exportPortablePdf(
  tourId: string,
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void,
) {
  const portable = options.mode === "portable";
  const includeFace = portable && options.includeFace;

  onProgress?.({ step: "prepare", percent: 5, label: "데이터 준비" });
  const snapshot = await getTourSnapshot(tourId);
  if (!snapshot.dresses.length)
    throw new Error("드레스를 한 벌 이상 기록해 주세요.");

  const bundle = buildPortableBundle(snapshot, includeFace);
  const face = bundle.assets[0];
  const faceData = face ? await blobToDataUrl(face.blob) : undefined;

  onProgress?.({ step: "render", percent: 15, label: "드레스 이미지 생성" });
  const rendered = new Map<string, Uint8Array>();
  for (let index = 0; index < snapshot.dresses.length; index += 1) {
    const dress = snapshot.dresses[index];
    for (const view of sketchViews) {
      rendered.set(
        `${dress.id}:${view}`,
        await dressSvgToJpeg(
          dress,
          faceData,
          includeFace && view !== "back",
          360,
          640,
          view,
        ),
      );
    }
    onProgress?.({
      step: "render",
      percent: 15 + Math.round(((index + 1) / snapshot.dresses.length) * 40),
      label: `드레스 이미지 ${index + 1}/${snapshot.dresses.length}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  onProgress?.({ step: "assemble", percent: 60, label: "PDF 조립" });
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
      snapshot.dresses.flatMap((dress) =>
        sketchViews.map(async (view) => {
          const key = `${dress.id}:${view}`;
          const renderedJpg = rendered.get(key);
          if (!renderedJpg) throw new Error("드레스 이미지가 손상됐어요.");
          return [key, await pdf.embedJpg(renderedJpg)] as const;
        }),
      ),
    ),
  );
  pdf.setTitle(`${snapshot.tour.title} - 드레스노트`);
  pdf.setSubject(
    portable ? "복원 가능한 드레스투어 기록" : "보기 전용 드레스투어 기록",
  );
  pdf.setCreator("드레스노트");

  const favorites = snapshot.dresses.filter((dress) => dress.isFavorite);
  let page = pdf.addPage(A4);
  page.drawText("드레스노트", {
    x: margin,
    y: 775,
    size: 13,
    font,
    color: pdfColors.accent,
  });
  page.drawText(snapshot.tour.title, {
    x: margin,
    y: 730,
    size: 28,
    font,
    color: pdfColors.inkStrong,
  });
  let y = 690;
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
  y -= 14;
  page.drawText(`드레스샵 ${snapshot.shops.length}곳`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  page.drawText(`드레스 ${snapshot.dresses.length}벌`, {
    x: 190,
    y,
    size: 12,
    font,
  });
  page.drawText(`후보 ${favorites.length}벌`, { x: 330, y, size: 12, font });
  y -= 50;
  page.drawText("SHOP LIST", {
    x: margin,
    y,
    size: 9,
    font,
    color: pdfColors.accent,
  });
  y -= 26;
  for (const shop of snapshot.shops) {
    const count = snapshot.dresses.filter(
      (dress) => dress.shopId === shop.id,
    ).length;
    page.drawText(`${shop.order + 1}. ${shop.name}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    page.drawText(`${count}벌`, {
      x: 470,
      y,
      size: 10,
      font,
      color: pdfColors.inkSoft,
    });
    y -= 28;
  }
  for (const dress of snapshot.dresses) {
    const shop = shopsById.get(dress.shopId);
    if (!shop) throw new Error("드레스샵 연결 정보가 손상됐어요.");

    page = pdf.addPage(A4);
    page.drawText(dressLabel(dress, shop), {
      x: margin,
      y: 790,
      size: 16,
      font,
      color: pdfColors.inkHeading,
    });
    if (dress.isFavorite)
      page.drawText("♥ 후보", {
        x: 485,
        y: 790,
        size: 9,
        font,
        color: pdfColors.favorite,
      });

    sketchViews.forEach((view, index) => {
      const image = embeddedJpegs.get(`${dress.id}:${view}`);
      if (!image) throw new Error("드레스 이미지가 손상됐어요.");
      drawSketchPanel(page, font, image, view, margin + index * 170);
    });
    page.drawText("기록을 바탕으로 만든 드레스 기억 스케치", {
      x: margin,
      y: 402,
      size: 9,
      font,
      color: pdfColors.inkMuted,
    });
    page.drawText(
      includeFace
        ? "얼굴 사진은 전체·상체에만 포함되며 뒤태에는 포함되지 않습니다."
        : "얼굴 사진은 보이는 스케치와 복원 데이터에 포함되지 않습니다.",
      {
        x: margin,
        y: 382,
        size: 8,
        font,
        color: pdfColors.inkLight,
      },
    );
    page.drawRectangle({
      x: margin,
      y: 314,
      width: 511,
      height: 48,
      color: pdfColors.surface,
    });
    page.drawCircle({
      x: margin + 25,
      y: 338,
      size: 14,
      color: hexColor(dressRenderTokens.garmentColor[dress.color]),
      borderColor: hexColor(dressRenderTokens.garmentEdge[dress.color]),
      borderWidth: 1,
    });
    page.drawText("소재 스와치", {
      x: margin + 50,
      y: 345,
      size: 8,
      font,
      color: pdfColors.accent,
    });
    page.drawText(optionLabel(fabricOptions, dress.fabric), {
      x: margin + 50,
      y: 327,
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
      282,
      8,
      511,
      14,
    );

    page = pdf.addPage(A4);
    const label = dressLabel(dress, shop);
    drawDetailHeader(page, font, label, false);
    let flow: DetailFlow = { page, y: 726 };
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
    favorites.forEach((dress, index) => {
      const shop = shopsById.get(dress.shopId);
      if (!shop) return;
      page = pdf.addPage(A4);
      page.drawText(index === 0 ? "MY FAVORITES" : "MY FAVORITES · 계속", {
        x: margin,
        y: 790,
        size: 10,
        font,
        color: pdfColors.accent,
      });
      page.drawText(`♥ ${shop.name} · ${dress.label}`, {
        x: margin,
        y: 746,
        size: 18,
        font,
        color: pdfColors.favoriteInk,
      });
      const fullSketch = embeddedJpegs.get(`${dress.id}:full`);
      if (!fullSketch) throw new Error("드레스 이미지가 손상됐어요.");
      page.drawImage(fullSketch, {
        x: margin,
        y: 326,
        width: 210,
        height: 373,
      });
      const summaryX = 280;
      page.drawText("후보 결정 요약", {
        x: summaryX,
        y: 690,
        size: 9,
        font,
        color: pdfColors.accent,
      });
      let favoriteY = drawTextLines(
        page,
        font,
        summarizeDress(dress).slice(0, 3).join(" · ") || "형태 기록 없음",
        summaryX,
        665,
        9,
        273,
        15,
        pdfColors.summary,
      );
      favoriteY -= 12;
      favoriteY = drawTextLines(
        page,
        font,
        `별점 ${dress.rating ? `${dress.rating} / 5` : "미기록"}`,
        summaryX,
        favoriteY,
        9,
        273,
        15,
      );
      favoriteY -= 12;
      favoriteY = drawTextLines(
        page,
        font,
        `태그 ${dress.quickTags.length ? dress.quickTags.join(" · ") : "미기록"}`,
        summaryX,
        favoriteY,
        9,
        273,
        15,
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
        8,
        273,
        14,
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
    onProgress?.({ step: "attach", percent: 90, label: "복원 데이터 첨부" });
    const serialized = await serializePortableBundle(bundle);
    portableSerialized = serialized;
    await pdf.attach(serialized.manifestBytes, PORTABLE_MANIFEST_FILE_NAME, {
      mimeType: "application/json",
      description: "드레스노트 복원 매니페스트",
    });
    await pdf.attach(serialized.tourBytes, serialized.manifest.tourAttachment, {
      mimeType: "application/json",
      description: "드레스노트 투어 원본 데이터",
    });
    if (serialized.faceBytes && serialized.manifest.faceAttachment) {
      const faceRef = bundle.payload.assets[0];
      await pdf.attach(
        serialized.faceBytes,
        serialized.manifest.faceAttachment,
        {
          mimeType: faceRef.mimeType,
          description: "로컬 얼굴 이미지",
        },
      );
    }
    onProgress?.({
      step: "verify",
      percent: 96,
      label: "복원 데이터 무결성 확인",
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
