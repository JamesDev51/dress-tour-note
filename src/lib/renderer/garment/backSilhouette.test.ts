import { describe, expect, it } from "vitest";
import type { Dress } from "../../../types/domain";
import { dressSvgMarkup } from "../dressSvg";
import { resolveGarmentRecipe } from "./core";

const dress: Dress = {
  id: "back-silhouette",
  tourId: "tour",
  shopId: "shop",
  order: 1,
  label: "뒤태 기록",
  topStyle: "longSleeve",
  neckline: "high",
  silhouette: "aLine",
  waistline: "natural",
  backStyle: "openBack",
  fabric: "mikadoSatin",
  color: "ivory",
  train: "none",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-16T00:00:00.000Z",
  updatedAt: "2026-09-16T00:00:00.000Z",
};

const unsupported = [
  "mermaid",
  "ballGown",
  "fitAndFlare",
  "sheath",
  "empire",
  "teaLength",
] as const;

describe("back silhouette artwork", () => {
  it.each(unsupported)(
    "does not claim an A-line image resolves %s",
    (silhouette) => {
      // Given a recorded silhouette with no matching rear photograph.
      const current = { ...dress, silhouette };
      // When the rear artwork is resolved.
      const result = resolveGarmentRecipe(current, "back");
      // Then it reports no match without an image or a resolved silhouette.
      expect(result.status).toBe("unavailable");
      expect(result.reason).toBe("no-match");
      expect(result.layers).toHaveLength(0);
      expect(result.assetIds).toHaveLength(0);
      expect(result.resolvedFields).not.toContain("silhouette");
    },
  );

  it.each(["mermaid", "ballGown"] as const)(
    "renders canonical %s geometry when prepared artwork is unavailable",
    (silhouette) => {
      // Given a prepared rear result with no matching photograph.
      const current = { ...dress, silhouette };
      const preparedArtwork = resolveGarmentRecipe(current, "back");
      // When the composed preview is rendered.
      const svg = dressSvgMarkup(current, undefined, false, "back", "visual", {
        preparedArtwork,
      });
      // Then the selected silhouette is drawn by the canonical renderer.
      expect(svg).toContain(`data-profile="${silhouette}"`);
      expect(svg).toContain(`data-shape="${silhouette}"`);
      expect(svg).not.toContain('data-layer="prepared-placeholder"');
      expect(svg).not.toContain('data-layer="prepared-garment"');
    },
  );

  it("keeps an unknown silhouette unresolved without fabricating A-line artwork", () => {
    // Given known rear construction but an unrecorded silhouette.
    const current: Dress = { ...dress, silhouette: "unknown" };
    // When the rear artwork is resolved.
    const result = resolveGarmentRecipe(current, "back");
    // Then no photograph or silhouette is invented.
    expect(result.status).toBe("partial");
    expect(result.assetIds).toHaveLength(0);
    expect(result.resolvedFields).not.toContain("silhouette");
  });

  it("preserves the placeholder for an unknown partial silhouette", () => {
    // Given an unresolved rear silhouette.
    const current: Dress = { ...dress, silhouette: "unknown" };
    const preparedArtwork = resolveGarmentRecipe(current, "back");
    // When the preview is rendered.
    const svg = dressSvgMarkup(current, undefined, false, "back", "visual", {
      preparedArtwork,
    });
    // Then its explicit unknown placeholder remains.
    expect(svg).toContain('data-layer="prepared-placeholder"');
    expect(svg).not.toContain('data-layer="prepared-garment"');
  });

  it("preserves authored A-line back construction", () => {
    // Given the silhouette supported by the rear photograph.
    // When rear artwork is resolved.
    const result = resolveGarmentRecipe(dress, "back");
    // Then the existing photograph and opening construction remain usable.
    expect(result.status).toBe("ready");
    expect(result.assetIds.length).toBeGreaterThan(0);
    expect(result.markup).toContain('data-layer="back-opening-mask"');
  });
});
