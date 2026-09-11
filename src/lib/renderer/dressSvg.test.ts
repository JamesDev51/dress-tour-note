import { describe, expect, it, vi } from "vitest";
import { FABRICS, SILHOUETTES, type Dress } from "../../types/domain";
import { fabricOptions, optionLabel } from "../dress/options";
import { dressSvgMarkup, dressSvgToJpeg } from "./dressSvg";

const dress: Dress = {
  id: "dress-svg",
  tourId: "tour-svg",
  shopId: "shop-svg",
  order: 0,
  label: "Dress SVG",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "mermaid",
  waistline: "natural",
  backStyle: "buttonBack",
  fabric: "lace",
  color: "ivory",
  train: "chapel",
  details: ["buttons"],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("dress memory sketch", () => {
  it("renders every unknown field as neutral and explicitly unrecorded", () => {
    const unknownDress: Dress = {
      ...dress,
      topStyle: "unknown",
      neckline: "unknown",
      silhouette: "unknown",
      waistline: "unknown",
      backStyle: "unknown",
      fabric: "unknown",
      color: "unknown",
      train: "unknown",
      details: [],
    };

    const svg = dressSvgMarkup(unknownDress);

    expect(svg).toContain('data-renderer="memory-sketch"');
    expect(svg).toContain('data-state="unknown"');
    expect(svg).toContain("미기록");
    expect(svg).not.toContain('data-shape="strapless"');
    expect(svg).not.toContain('data-shape="straight"');
  });

  it.each([
    ["full", ["상의", "네크라인", "실루엣", "허리선", "트레인", "색상"], true],
    ["upper", ["상의", "네크라인", "허리선", "색상"], false],
    ["back", ["등 디자인", "실루엣", "트레인", "색상"], true],
  ] as const)(
    "renders the requested %s view and only its field set",
    (view, expectedFields, showsAnnotations) => {
      const svg = dressSvgMarkup(dress, undefined, false, view);

      expect(svg).toContain(`data-view="${view}"`);
      expect(
        [...svg.matchAll(/data-field="([^"]+)"/g)].map((match) => match[1]),
      ).toEqual(expectedFields);
      expect(svg.includes('data-layer="fabric-swatch"')).toBe(showsAnnotations);
      expect(svg.includes('data-layer="detail-badge"')).toBe(showsAnnotations);
    },
  );

  it("always excludes face bytes and transforms from the back view", () => {
    const svg = dressSvgMarkup(
      {
        ...dress,
        faceTransform: { x: 0.5, y: -0.25, scale: 1.2, rotation: 8 },
      },
      "data:image/webp;base64,private-face",
      true,
      "back",
    );

    expect(svg).not.toContain("private-face");
    expect(svg).not.toContain('data-layer="face"');
    expect(svg).not.toContain("face-transform");
  });

  it("shows fabric as a separate swatch without a tiled garment pattern", () => {
    const svg = dressSvgMarkup(dress);

    expect(svg).toContain('data-layer="fabric-swatch"');
    expect(svg).toContain("레이스");
    expect(svg).not.toContain("<pattern");
    expect(svg).not.toContain("patternUnits");
    expect(svg).not.toContain("mix-blend-mode");
  });

  it("labels unsupported notes with their dress category", () => {
    const svg = dressSvgMarkup({
      ...dress,
      customOptions: {
        neckline: "목선을 따라 작은 꽃잎이 이어짐",
        fabric: "빛에 따라 잔잔하게 반짝임",
      },
    });

    expect(svg).toContain("네크라인 · 비슷하지만 달라요");
    expect(svg).toContain("소재 · 비슷하지만 달라요");
  });

  it("renders a face only when explicitly enabled on an eligible view", () => {
    const face = "data:image/webp;base64,explicit-face";

    expect(dressSvgMarkup(dress, face)).not.toContain(face);
    expect(dressSvgMarkup(dress, face, true, "upper")).toContain(face);
  });

  it.each([
    ["topStyle", "strapless", ["neckline", "silhouette"]],
    ["neckline", "sweetheart", ["topStyle", "silhouette"]],
    ["silhouette", "mermaid", ["topStyle", "neckline"]],
  ] as const)(
    "keeps %s known while the other two core shape fields stay unknown",
    (knownField, knownValue, unknownFields) => {
      const partialDress: Dress = {
        ...dress,
        topStyle: "unknown",
        neckline: "unknown",
        silhouette: "unknown",
        [knownField]: knownValue,
      };

      const svg = dressSvgMarkup(partialDress);

      expect(svg).toContain(`data-shape="${knownValue}"`);
      expect(svg).not.toContain('data-state="unknown" data-renderer');
      for (const field of unknownFields) {
        expect(partialDress[field]).toBe("unknown");
      }
      expect(
        (svg.match(/data-state="unknown"/g) ?? []).length,
      ).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(SILHOUETTES)(
    "presents silhouette %s without inferring another form",
    (silhouette) => {
      const svg = dressSvgMarkup({ ...dress, silhouette });

      if (silhouette === "unknown") {
        expect(svg).toContain('data-field="실루엣" data-state="unknown"');
        expect(svg).not.toContain('data-shape="unknown"');
      } else {
        expect(svg).toContain(`data-shape="${silhouette}"`);
      }
    },
  );

  it.each(FABRICS)(
    "presents material %s as a distinct separate swatch",
    (fabric) => {
      const svg = dressSvgMarkup({ ...dress, fabric });

      expect(svg).toContain('data-layer="fabric-swatch"');
      expect(svg).toContain(`data-material="${fabric}"`);
      expect(svg).toContain(
        fabric === "unknown" ? "미기록" : optionLabel(fabricOptions, fabric),
      );
      expect(svg).not.toContain("<pattern");
    },
  );

  it.each([
    ["spaghetti", "high", "sheath", "tulle"],
    ["oneShoulder", "illusion", "teaLength", "glitterBeaded"],
  ] as const)(
    "presents expanded legacy choices and their category-labelled exception notes",
    (topStyle, neckline, silhouette, fabric) => {
      const svg = dressSvgMarkup({
        ...dress,
        topStyle,
        neckline,
        silhouette,
        fabric,
        customOptions: {
          top: "원래 기록과 조금 다름",
          silhouette: "기억한 볼륨이 더 작음",
        },
      });

      expect(svg).toContain(`data-shape="${topStyle}"`);
      expect(svg).toContain(`data-shape="${neckline}"`);
      expect(svg).toContain(`data-shape="${silhouette}"`);
      expect(svg).toContain(`data-material="${fabric}"`);
      expect(svg).toContain("상의 · 비슷하지만 달라요");
      expect(svg).toContain("실루엣 · 비슷하지만 달라요");
    },
  );

  it("passes the canonical SVG into the JPEG encoder and returns its bytes", async () => {
    let svgBlob: Blob | undefined;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob: Blob) => {
        svgBlob = blob;
        return "blob:memory-sketch";
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({
        fillStyle: "",
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: (callback: BlobCallback) =>
        callback(
          new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
            type: "image/jpeg",
          }),
        ),
    });

    const jpeg = await dressSvgToJpeg(
      dress,
      undefined,
      false,
      600,
      1067,
      "back",
    );

    expect([...jpeg]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
    const capturedSvgBlob = svgBlob;
    if (!capturedSvgBlob)
      throw new Error("SVG blob was not passed to the encoder");
    const svgSource = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error);
      reader.readAsText(capturedSvgBlob);
    });
    expect(svgSource).toBe(dressSvgMarkup(dress, undefined, false, "back"));
  });
});
