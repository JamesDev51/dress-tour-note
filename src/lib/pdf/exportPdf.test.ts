// @vitest-environment node

import { readFile } from "node:fs/promises";
import { PDFDocument, PDFPage } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Dress, LocalAsset, TourSnapshot } from "../../types/domain";

const { getTourSnapshot, patchTour, dressSvgToJpeg } = vi.hoisted(() => ({
  getTourSnapshot: vi.fn(),
  patchTour: vi.fn(),
  dressSvgToJpeg: vi.fn(),
}));

vi.mock("../../db/repositories", () => ({ getTourSnapshot, patchTour }));
vi.mock("../renderer/dressSvg", () => ({ dressSvgToJpeg }));
vi.mock("../image/processFace", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../image/processFace")>();
  return {
    ...original,
    blobToDataUrl: vi.fn().mockResolvedValue("data:image/webp;base64,ZmFjZQ=="),
  };
});

import { exportPortablePdf } from "./exportPdf";

const now = "2026-09-04T00:00:00.000Z";
const faceAsset: LocalAsset = {
  id: "face-1",
  tourId: "tour-1",
  kind: "face",
  mimeType: "image/webp",
  blob: new Blob(["face"], { type: "image/webp" }),
  width: 2,
  height: 2,
  byteLength: 4,
  sha256: "0282d9b79f42c74c1550b20ff2dd16aafc3fe5d8ae9a00b2f66996d0ae882775",
  createdAt: now,
};

function dress(overrides: Partial<Dress> = {}): Dress {
  return {
    id: "dress-1",
    tourId: "tour-1",
    shopId: "shop-1",
    order: 0,
    label: "Dress 01",
    topStyle: "offShoulder",
    neckline: "sweetheart",
    silhouette: "aLine",
    waistline: "natural",
    backStyle: "buttonBack",
    fabric: "lace",
    color: "ivory",
    train: "chapel",
    details: ["floral", "buttons"],
    quickTags: ["신부 픽", "편함"],
    rating: 5,
    memo: "기억 메모",
    isFavorite: true,
    faceTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function snapshot(record = dress(), assets: LocalAsset[] = []): TourSnapshot {
  return {
    tour: {
      id: "tour-1",
      title: "PDF 레이아웃 테스트",
      status: "draft",
      faceAssetId: assets[0]?.id,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    },
    shops: [
      {
        id: "shop-1",
        tourId: "tour-1",
        name: "테스트 브라이덜",
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    dresses: [record],
    assets,
  };
}

function minimalDress(): Dress {
  return dress({
    topStyle: "unknown",
    neckline: "unknown",
    silhouette: "unknown",
    waistline: "unknown",
    backStyle: undefined,
    fabric: "unknown",
    color: "unknown",
    train: "unknown",
    details: [],
    quickTags: [],
    rating: undefined,
    memo: "",
    isFavorite: false,
    faceTransform: undefined,
    customOptions: undefined,
  });
}

function maximalKoreanDress(): Dress {
  const note = "비슷하지만 다른 부분을 자세히 기록한 한국어 설명"
    .repeat(4)
    .slice(0, 80);
  return dress({
    details: ["corset", "draping", "pearl", "floral"],
    quickTags: ["신부 픽", "편함", "상체 예쁨"],
    customOptions: {
      top: note,
      neckline: note,
      silhouette: note,
      fabric: note,
      color: note,
      waistline: note,
      backStyle: note,
      train: note,
      details: note,
    },
    memo: "긴 메모도 페이지 아래에서 잘리지 않고 다음 장으로 이어집니다."
      .repeat(30)
      .slice(0, 1000),
  });
}

function drawnText(calls: readonly (readonly [string, ...unknown[]])[]) {
  return calls.map(([text]) => text);
}

describe("visual PDF export", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const jpeg = await readFile("public/og/dress-note-share.jpg");
    dressSvgToJpeg.mockResolvedValue(new Uint8Array(jpeg));
    const font = await readFile("src/assets/pretendard-pdf-static.ttf");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(font, { status: 200 })),
    );
  });

  it("uses a static TrueType font for portable Korean text", async () => {
    // Given the PDF-only font bytes bundled for export
    const font = await readFile("src/assets/pretendard-pdf-static.ttf");
    const tableCount = font.readUInt16BE(4);
    const tableTags = Array.from({ length: tableCount }, (_, index) =>
      font.toString("ascii", 12 + index * 16, 16 + index * 16),
    );

    // When the sfnt table directory is inspected
    const signature = font.subarray(0, 4);

    // Then it is a static glyf font rather than the variable WOFF2 that broke full embedding
    expect([...signature]).toEqual([0, 1, 0, 0]);
    expect(tableTags).toContain("glyf");
    expect(tableTags).not.toContain("fvar");
  });

  it("renders bounded full, upper, and back panels while never passing a face to back", async () => {
    // Given a recoverable export with an explicitly included local face
    getTourSnapshot.mockResolvedValue(snapshot(dress(), [faceAsset]));

    // When the PDF is exported
    const blob = await exportPortablePdf("tour-1", {
      mode: "portable",
      includeFace: true,
    });

    // Then every memory-sketch view is rendered and the back view is face-free
    expect(dressSvgToJpeg.mock.calls.map((call) => call[5])).toEqual([
      "full",
      "upper",
      "back",
    ]);
    expect(dressSvgToJpeg.mock.calls.map((call) => call[2])).toEqual([
      true,
      true,
      false,
    ]);
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(4);
  });

  it("draws a full memory sketch on every favorites summary page", async () => {
    // Given one favorite dress with an already rendered full sketch
    getTourSnapshot.mockResolvedValue(snapshot());
    const drawImage = vi.spyOn(PDFPage.prototype, "drawImage");

    // When its view-only PDF is exported
    await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: false,
    });

    // Then three comparison panels plus one favorites full sketch are drawn within A4 bounds
    expect(drawImage).toHaveBeenCalledTimes(4);
    const favoriteOptions = drawImage.mock.calls[3]?.[1];
    expect(favoriteOptions).toMatchObject({ x: 42, y: 326 });
    expect(
      (favoriteOptions?.x ?? 0) + (favoriteOptions?.width ?? 0),
    ).toBeLessThanOrEqual(553.28);
    expect(
      (favoriteOptions?.y ?? 0) + (favoriteOptions?.height ?? 0),
    ).toBeLessThanOrEqual(790);
  });

  it("keeps a minimal unknown record inside printable bounds with explicit missing values", async () => {
    // Given a minimal dress with no optional fields or favorite state
    getTourSnapshot.mockResolvedValue(snapshot(minimalDress()));
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");

    // When the view-only PDF is exported
    const blob = await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: false,
    });

    // Then every text operation remains printable and missing terms stay explicit
    const texts = drawnText(drawText.mock.calls);
    expect(texts).toContain("미기록");
    expect(
      drawText.mock.calls.every(([, options]) =>
        Boolean(
          typeof options?.x === "number" &&
          options.x >= 42 &&
          options.x <= 553.28 &&
          typeof options.y === "number" &&
          options.y >= 24 &&
          options.y <= 790,
        ),
      ),
    ).toBe(true);
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBe(3);
  });

  it("preserves maximal Korean note and memo text across bounded continuation pages", async () => {
    // Given the maximal Korean fixture at every persisted length boundary
    const maximal = maximalKoreanDress();
    getTourSnapshot.mockResolvedValue(snapshot(maximal));
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");

    // When the visual PDF is exported
    const blob = await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: false,
    });

    // Then the draw operations contain every character and never cross the footer boundary
    const normalized = drawnText(drawText.mock.calls)
      .join("")
      .replaceAll(" ", "");
    expect(normalized).toContain(
      maximal.customOptions?.details?.replaceAll(" ", ""),
    );
    expect(normalized).toContain(maximal.memo.replaceAll(" ", ""));
    expect(
      drawText.mock.calls.every(
        ([, options]) => typeof options?.y === "number" && options.y >= 24,
      ),
    ).toBe(true);
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
  });

  it("excludes a stored face from every view-only panel and privacy label", async () => {
    // Given a stored face that is not authorized for a view-only export
    getTourSnapshot.mockResolvedValue(snapshot(dress(), [faceAsset]));
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");

    // When the view-only PDF is exported
    await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: true,
    });

    // Then all three render calls exclude the face and the visual page states that outcome
    expect(dressSvgToJpeg.mock.calls.map((call) => call[2])).toEqual([
      false,
      false,
      false,
    ]);
    expect(drawnText(drawText.mock.calls)).toContain(
      "얼굴 사진은 보이는 스케치와 복원 데이터에 포함되지 않습니다.",
    );
  });

  it("adds continuation pages instead of clipping maximal Korean notes and memo", async () => {
    // Given every exception note at its 80-character boundary and a 1,000-character memo
    getTourSnapshot.mockResolvedValue(snapshot(maximalKoreanDress()));

    // When the view-only PDF is exported
    const blob = await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: false,
    });

    // Then the visual/detail/favorites content expands to bounded continuation pages
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
  });
});
