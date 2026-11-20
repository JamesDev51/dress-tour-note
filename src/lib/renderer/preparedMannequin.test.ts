import { describe, expect, it } from "vitest";
import { dressSvgMarkup } from "./dressSvg";
import { resolveGarmentRecipe } from "./garment";
import { preparedArtworkVerticalBounds } from "./dressSvgSupport";
import type { Dress } from "../../types/domain";

const dress: Dress = {
  id: "mannequin",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "드레스",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  waistline: "unknown",
  train: "unknown",
  fabric: "mikadoSatin",
  color: "ivory",
  backStyle: "openBack",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-16",
  updatedAt: "2026-09-16",
};

describe("completed mannequin composition", () => {
  it("resolves current records without retired fields", () => {
    const artwork = resolveGarmentRecipe(dress, "full");
    expect(artwork.status).toBe("ready");
    expect(artwork.missingFields).not.toContain("waistline");
    expect(artwork.missingFields).not.toContain("train");
  });
  it.each(["full", "back"] as const)(
    "fits the visible figure in %s",
    (view) => {
      const artwork = resolveGarmentRecipe(dress, view);
      const svg = dressSvgMarkup(dress, undefined, false, view, "visual", {
        preparedArtwork: artwork,
      });
      const transform = svg.match(
        /data-layer="figure" transform="translate\(([-.\d]+) ([-.\d]+)\) scale\(([-.\d]+)\)"/,
      );
      const bounds = preparedArtworkVerticalBounds(artwork, true);
      const scale = Number(transform?.[3]);
      const top = Number(transform?.[2]) + bounds.top * scale;
      const bottom = Number(transform?.[2]) + bounds.bottom * scale;
      expect((bottom - top) / 500).toBeGreaterThanOrEqual(0.85);
      expect((bottom - top) / 500).toBeLessThanOrEqual(0.94);
      expect(top).toBeGreaterThan(0);
      expect(bottom).toBeLessThan(500);
      expect(svg.indexOf('data-layer="mannequin"')).toBeLessThan(
        svg.indexOf('data-layer="prepared-garment"'),
      );
      expect(svg).toContain('data-layer="head"');
      expect(svg).toContain('data-layer="arms"');
    },
  );
  it.each(["full", "back"] as const)(
    "preserves the short skirt's visible legs and feet in %s",
    (view) => {
      const value: Dress = { ...dress, silhouette: "teaLength" };
      const artwork = resolveGarmentRecipe(value, view);
      const svg = dressSvgMarkup(value, undefined, false, view, "visual", {
        preparedArtwork: artwork,
      });
      expect(svg).toContain('data-layer="lower-legs"');
      expect(svg).toContain('data-layer="mannequin-feet"');
      expect(
        preparedArtworkVerticalBounds(artwork, true).bottom,
      ).toBeGreaterThan(550);
    },
  );
  it("excludes short-skirt legs from the upper crop", () => {
    const value: Dress = { ...dress, silhouette: "teaLength" };
    const artwork = resolveGarmentRecipe(value, "upper");
    const svg = dressSvgMarkup(value, undefined, false, "upper", "visual", {
      preparedArtwork: artwork,
    });
    expect(svg).not.toContain('data-layer="lower-legs"');
  });
  it.each(["full", "upper", "back"] as const)(
    "keeps annotated %s anatomy below the heading and before labels",
    (view) => {
      const artwork = resolveGarmentRecipe(dress, view);
      const svg = dressSvgMarkup(dress, undefined, false, view, "annotated", {
        preparedArtwork: artwork,
      });
      const matrix = svg.match(
        /data-layer="figure" transform="translate\(([-.\d]+) ([-.\d]+)\) scale\(([-.\d]+)\)"/,
      );
      const scale = Number(matrix?.[3]);
      const offsetX = Number(matrix?.[1]);
      const offsetY = Number(matrix?.[2]);
      const bounds = preparedArtworkVerticalBounds(artwork, true);
      const center = view === "upper" ? 180 : 135;
      const halfWidth = view === "upper" ? 112 : 180;
      expect(offsetY + bounds.top * scale).toBeCloseTo(72, 1);
      expect(offsetX + (center - halfWidth) * scale).toBeCloseTo(16, 1);
      expect(offsetX + (center + halfWidth) * scale).toBeCloseTo(240, 1);
    },
  );
  it("enlarges the completed garment itself at unchanged width", () => {
    const value: Dress = { ...dress, topStyle: "longSleeve", neckline: "high" };
    const artwork = resolveGarmentRecipe(value, "full");
    const svg = dressSvgMarkup(value, undefined, false, "full", "visual", {
      preparedArtwork: artwork,
    });
    const scale = Number(
      svg.match(
        /data-layer="figure" transform="translate\([-.\d]+ [-.\d]+\) scale\(([-.\d]+)\)"/,
      )?.[1],
    );
    expect(scale / 0.7).toBeGreaterThan(1.15);
    expect(svg).toContain('viewBox="0 0 320 500"');
  });
  it("does not mark retired custom notes as unrendered active choices", () => {
    const value: Dress = {
      ...dress,
      customOptions: { waistline: "legacy", train: "legacy" },
    };
    expect(resolveGarmentRecipe(value, "full").status).toBe("ready");
  });
  it("registers opt-in face transforms with the prepared head and excludes back faces", () => {
    const value = {
      ...dress,
      faceTransform: { x: 0.2, y: -0.3, scale: 1.1, rotation: 8 },
    };
    const artwork = resolveGarmentRecipe(value, "full");
    const svg = dressSvgMarkup(
      value,
      "data:image/webp;base64,private",
      true,
      "full",
      "visual",
      { preparedArtwork: artwork },
    );
    expect(svg).toContain('data-layer="face-registration"');
    expect(svg).toContain("rotate(8 135 117)");
    const back = dressSvgMarkup(
      value,
      "data:image/webp;base64,private",
      true,
      "back",
      "visual",
      { preparedArtwork: resolveGarmentRecipe(value, "back") },
    );
    expect(back).not.toContain("private");
    expect(back).not.toContain('data-layer="face-registration"');
  });
});
