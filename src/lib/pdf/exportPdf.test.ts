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
import { snapshotDressLook } from "../dress/styling";
import { inspectPortableTrailer } from "./portableTrailer";
import { dressTermBlocks } from "./dressTextBlocks";

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
    memoryCue: "기".repeat(80),
    likedReason: "좋".repeat(160),
    concern: "아".repeat(160),
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
      vi.fn(async () => new Response(font, { status: 200 })),
    );
  });

  it.each([
    [undefined, "상체 소재", "치마 소재"],
    ["waist", "상체 소재", "치마 소재"],
    ["hip", "위쪽 소재", "골반부터"],
    ["thigh", "위쪽 소재", "허벅지부터"],
    ["knee", "위쪽 소재", "무릎부터"],
  ] as const)(
    "labels mixed-material starts in PDF text for %s",
    (lowerFabricStart, upperLabel, lowerLabel) => {
      const value = dress({
        upperFabric: "lace",
        lowerFabric: "organzaChiffon",
        lowerFabricStart,
      });
      expect(dressTermBlocks(value)).toEqual(
        expect.arrayContaining([
          { label: upperLabel, text: "레이스" },
          { label: lowerLabel, text: "망사·쉬폰" },
        ]),
      );
      expect(
        dressTermBlocks({ ...value, lowerFabric: "lace" }).filter(({ label }) =>
          label.includes("소재"),
        ),
      ).toEqual([{ label: "소재", text: "레이스" }]);
    },
  );

  it("exports the active face-free front views and distinct upper/skirt materials without retired labels", async () => {
    getTourSnapshot.mockResolvedValue(
      snapshot(
        dress({
          upperFabric: "lace",
          lowerFabric: "organzaChiffon",
          lowerFabricStart: "thigh",
          backStyle: "vBack",
          backClosure: "laceUp",
          color: "champagne",
          train: "cathedral",
          details: ["detachableSleeve", "backBow", "sequin"],
          quickTags: ["편함", "무거움", "신부 픽"],
        }),
        [faceAsset],
      ),
    );
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");
    const output = await exportPortablePdf("tour-1", {
      mode: "portable",
      includeFace: true,
    });
    expect(dressSvgToJpeg.mock.calls.map((call) => call[5])).toEqual([
      "full",
      "upper",
    ]);
    expect(
      dressSvgToJpeg.mock.calls.every((call) => !call[1] && !call[2]),
    ).toBe(true);
    expect(
      dressSvgToJpeg.mock.calls.every((call) => call[6]?.mode === "visual"),
    ).toBe(true);
    const text = drawnText(drawText.mock.calls).join(" ");
    for (const retired of [
      "얼굴",
      "뒷모습",
      "등 파임",
      "등 뒤 여밈",
      "샴페인",
      "뒤로 끌리는 길이",
      "탈부착",
      "편함",
      "무거움",
    ])
      expect(text).not.toContain(retired);
    expect(text).toContain("위쪽 소재");
    expect(
      drawnText(drawText.mock.calls).filter(
        (line) => line === "제작 · 할미눈나 (@halminunna)",
      ),
    ).toHaveLength(1);
    expect(text).toContain("허벅지부터");
    expect(
      dressSvgToJpeg.mock.calls.every(
        (call) => call[0].lowerFabricStart === "thigh",
      ),
    ).toBe(true);
    const restored = await inspectPortableTrailer(
      new Uint8Array(await output.arrayBuffer()),
    );
    expect(restored?.payload.schemaVersion).toBe(5);
    expect(restored?.payload.includeFace).toBe(false);
    expect(restored?.payload.tour.faceAssetId).toBeUndefined();
    expect(restored?.assetBytes.size).toBe(0);
    expect(restored?.payload.dresses[0]).toMatchObject({
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
      lowerFabricStart: "thigh",
    });
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

  it("wraps a long cover title and paginates shop rows within printable bounds", async () => {
    const data = snapshot(minimalDress());
    data.tour.title = "드레스투어의 모든 순간을 오래 기억하려고 적어 둔 제목"
      .repeat(2)
      .slice(0, 50);
    data.shops = Array.from({ length: 30 }, (_, order) => ({
      ...data.shops[0]!,
      id: order === 0 ? "shop-1" : `shop-${order + 1}`,
      order,
      name:
        `브라이덜 ${order + 1} ` +
        "드레스 상담과 선택을 함께 기록한 샵 이름".repeat(2).slice(0, 35),
    }));
    getTourSnapshot.mockResolvedValue(data);
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");
    const output = await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: false,
    });
    const coverPage = drawText.mock.contexts[0];
    const coverCalls = drawText.mock.calls.filter(
      (_, index) => drawText.mock.contexts[index] === coverPage,
    );
    expect(
      coverCalls.every(([text, options]) => {
        const font = options?.font;
        return (
          font &&
          options?.size &&
          (options.x ?? 0) + font.widthOfTextAtSize(text, options.size) <=
            553.28 &&
          (options.y ?? 0) >= 24
        );
      }),
    ).toBe(true);
    expect(drawnText(drawText.mock.calls)).toContain("방문한 드레스샵 · 계속");
    expect(
      (await PDFDocument.load(await output.arrayBuffer())).getPageCount(),
    ).toBeGreaterThan(3);
  });

  it("renders bounded full and upper panels without any face feature", async () => {
    // Given an old record with a stored face and a retired include flag
    getTourSnapshot.mockResolvedValue(snapshot(dress(), [faceAsset]));

    // When the PDF is exported
    const blob = await exportPortablePdf("tour-1", {
      mode: "portable",
      includeFace: true,
    });

    // Then only current front views are rendered and all face data is excluded
    expect(dressSvgToJpeg.mock.calls.map((call) => call[5])).toEqual([
      "full",
      "upper",
    ]);
    expect(dressSvgToJpeg.mock.calls.map((call) => call[2])).toEqual([
      false,
      false,
    ]);
    expect(
      dressSvgToJpeg.mock.calls.map((call) => call[6]?.preparedArtwork?.view),
    ).toEqual(["full", "upper"]);
    expect(dressSvgToJpeg.mock.calls.map((call) => call[3] / call[4])).toEqual([
      3 / 4,
      6 / 5,
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

    // Then two front panels plus one favorites full sketch are drawn within A4 bounds
    expect(drawImage).toHaveBeenCalledTimes(3);
    const favoriteOptions = drawImage.mock.calls[2]?.[1];
    expect(
      drawImage.mock.calls.map(([, options]) =>
        Number((options!.width! / options!.height!).toFixed(2)),
      ),
    ).toEqual([0.75, 1.2, 0.75]);
    expect(favoriteOptions?.x).toBe(42);
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
    const content = normalized.replaceAll(
      "테스트브라이덜·1번째·Dress01·기본연출·대표연출상세기록·계속",
      "",
    );
    expect(content).toContain(
      maximal.customOptions?.details?.replaceAll(" ", ""),
    );
    expect(content).toContain(maximal.memo.replaceAll(" ", ""));
    expect(content.split(maximal.memoryCue ?? "")).toHaveLength(3);
    expect(content.split(maximal.likedReason ?? "")).toHaveLength(3);
    expect(content.split(maximal.concern ?? "")).toHaveLength(3);
    expect(
      drawnText(drawText.mock.calls).filter((text) => text === "기억할 특징"),
    ).toHaveLength(2);
    expect(
      drawnText(drawText.mock.calls).filter((text) => text === "좋았던 점"),
    ).toHaveLength(2);
    expect(
      drawnText(drawText.mock.calls).filter((text) => text === "아쉬운 점"),
    ).toHaveLength(2);
    expect(
      drawText.mock.calls.every(
        ([, options]) => typeof options?.y === "number" && options.y >= 24,
      ),
    ).toBe(true);
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
  });

  it("excludes stored faces and retired face copy from view-only output", async () => {
    // Given a stored face that is not authorized for a view-only export
    getTourSnapshot.mockResolvedValue(snapshot(dress(), [faceAsset]));
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");

    // When the view-only PDF is exported
    await exportPortablePdf("tour-1", {
      mode: "viewOnly",
      includeFace: true,
    });

    // Then current render calls exclude the face without exposing a retired feature
    expect(dressSvgToJpeg.mock.calls.map((call) => call[2])).toEqual([
      false,
      false,
    ]);
    expect(drawnText(drawText.mock.calls).join(" ")).not.toContain("얼굴");
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

  it("renders every styling with unique view keys and summarizes only the representative", async () => {
    const base = dress({ memoryCue: "기본 연출 기억" });
    base.stylingVariants = [
      {
        id: "look-1",
        label: "어깨 감쌈",
        createdAt: now,
        updatedAt: now,
        snapshot: snapshotDressLook({
          ...base,
          topStyle: "longSleeve",
          memoryCue: "대표 연출 기억",
          memo: "긴 소매 메모",
        }),
      },
    ];
    base.preferredStylingId = "look-1";
    getTourSnapshot.mockResolvedValue(snapshot(base, [faceAsset]));
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");
    const drawImage = vi.spyOn(PDFPage.prototype, "drawImage");
    const progress = vi.fn();
    const blob = await exportPortablePdf(
      "tour-1",
      { mode: "portable", includeFace: false },
      progress,
    );
    expect(
      dressSvgToJpeg.mock.calls.map((call) => [call[0].topStyle, call[5]]),
    ).toEqual([
      ["offShoulder", "full"],
      ["offShoulder", "upper"],
      ["longSleeve", "full"],
      ["longSleeve", "upper"],
    ]);
    const namespaces = dressSvgToJpeg.mock.calls.map(
      (call) => call[6].namespace,
    );
    expect(new Set(namespaces).size).toBe(4);
    expect(namespaces).toContain("pdf-dress-1-base-full");
    expect(namespaces).toContain("pdf-dress-1-look-1-full");
    expect(
      dressSvgToJpeg.mock.calls.every((call) => !call[1] && !call[2]),
    ).toBe(true);
    expect(drawImage).toHaveBeenCalledTimes(5);
    const texts = drawnText(drawText.mock.calls);
    expect(texts.filter((text) => text === "기본 연출 기억")).toHaveLength(1);
    expect(texts.filter((text) => text === "대표 연출 기억")).toHaveLength(2);
    expect(texts).toContain("드레스 1벌");
    expect(texts).toContain("후보 1벌");
    expect(texts.some((text) => text.includes("어깨 감쌈 · 대표 연출"))).toBe(
      true,
    );
    expect(progress).toHaveBeenCalledWith({
      step: "render",
      percent: 55,
      label: "연출 이미지 2/2",
    });
    const restored = await inspectPortableTrailer(
      new Uint8Array(await blob.arrayBuffer()),
    );
    expect(restored?.payload.schemaVersion).toBe(2);
    expect(
      restored?.payload.dresses[0].stylingVariants?.[0].snapshot.memo,
    ).toBe("긴 소매 메모");
    expect(restored?.payload.dresses[0].preferredStylingId).toBe("look-1");
    expect(restored?.assetBytes.size).toBe(0);
  });

  it("keeps maximum-length shop, dress and look names above the PDF panels", async () => {
    const base = dress({ label: "드".repeat(50) });
    base.stylingVariants = [
      {
        id: "look-long",
        label: "연".repeat(30),
        createdAt: now,
        updatedAt: now,
        snapshot: snapshotDressLook(base),
      },
    ];
    base.preferredStylingId = "look-long";
    const data = snapshot(base);
    data.shops[0].name = "샵".repeat(50);
    getTourSnapshot.mockResolvedValue(data);
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");
    await exportPortablePdf("tour-1", { mode: "viewOnly", includeFace: false });
    const titleCalls = drawText.mock.calls.filter(([text]) =>
      /[드샵연]{2}/.test(text),
    );
    expect(titleCalls.length).toBeGreaterThan(1);
    expect(
      titleCalls.every(
        ([text, options]) =>
          options?.font &&
          options.size &&
          (options.x ?? 0) +
            options.font.widthOfTextAtSize(text, options.size) <=
            553.28 &&
          (options.y ?? 0) >= 54,
      ),
    ).toBe(true);
    const favoritePage =
      drawText.mock.contexts[
        drawText.mock.calls.findIndex(([text]) => text === "후보 드레스")
      ];
    const favoriteTitles = titleCalls.filter(
      (call) =>
        drawText.mock.contexts[drawText.mock.calls.indexOf(call)] ===
        favoritePage,
    );
    expect(
      favoriteTitles.every(([, options]) => (options?.y ?? 0) >= 720),
    ).toBe(true);
  }, 15000);
});
