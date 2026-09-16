import { describe, expect, it } from "vitest";
import { resolveGarmentRecipe } from "./core";
import type { Dress } from "../../../types/domain";

function dress(overrides: Partial<Dress> = {}): Dress {
  return {
    id: "unknown-state-dress",
    tourId: "unknown-state-tour",
    shopId: "unknown-state-shop",
    order: 1,
    label: "미확인 드레스",
    topStyle: "longSleeve",
    neckline: "high",
    silhouette: "mermaid",
    waistline: "natural",
    backStyle: "unknown",
    fabric: "lace",
    color: "ivory",
    train: "none",
    details: [],
    quickTags: [],
    memo: "",
    isFavorite: false,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("unknown front selections", () => {
  it("renders a labelled form reference from quick-record core fields", () => {
    // Given a fresh quick record with the three core fields and optional fields unrecorded.
    const current = dress({
      topStyle: "offShoulder",
      neckline: "sweetheart",
      silhouette: "aLine",
      waistline: "unknown",
      fabric: "unknown",
      color: "unknown",
      train: "unknown",
    });

    // When the front views are resolved.
    const full = resolveGarmentRecipe(current, "full");
    const upper = resolveGarmentRecipe(current, "upper");

    // Then the recorded form is visible while optional gaps stay explicit.
    expect(full.status).toBe("partial");
    expect(full.layers.length).toBeGreaterThan(0);
    expect(full.missingFields).toEqual(
      expect.arrayContaining(["waistline", "fabric", "color", "train"]),
    );
    expect(full.markup).toContain('data-reference-mode="form"');
    expect(full.markup).toContain('data-layer="garment-image"');
    expect(upper.status).toBe("partial");
    expect(upper.layers.length).toBeGreaterThan(0);
    expect(upper.markup).toContain('data-reference-mode="form"');
  });

  it("keeps a known fabric in the partial form reference when color is unknown", () => {
    // Given a quick record completed with a known fabric in the detail panel.
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "offShoulder",
        neckline: "sweetheart",
        silhouette: "aLine",
        fabric: "lace",
        color: "unknown",
      }),
    );

    // Then the selected material source is actually composed into the image.
    expect(result.status).toBe("partial");
    expect(result.textures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          asset: expect.objectContaining({
            coverage: expect.objectContaining({ fabric: "lace" }),
          }),
        }),
      ]),
    );
    expect(result.markup).toContain('data-material="lace"');
  });

  it("leaves the back image unresolved while back construction is unrecorded", () => {
    // Given a fresh quick record with no material, color, or back construction.
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "offShoulder",
        neckline: "sweetheart",
        silhouette: "aLine",
        fabric: "unknown",
        color: "unknown",
        backStyle: "unknown",
      }),
      "back",
    );

    // Then the rear image stays unresolved instead of inventing a back style.
    expect(result.status).toBe("partial");
    expect(result.layers).toHaveLength(0);
    expect(result.assetIds).toHaveLength(0);
    expect(result.warnings).toContain("back-construction-unknown");
  });

  it("keeps the known mermaid lower and material for every recorded fabric when top is unknown", () => {
    // Given a dress with a known mermaid silhouette and an unresolved top.
    const fabrics = [
      "mikadoSatin",
      "lace",
      "subtleBeaded",
      "ornateBeaded",
      "tulle",
      "organzaChiffon",
      "glitterBeaded",
      "floral3D",
    ] as const;

    // When the saved record is resolved for each known fabric.
    const results = fabrics.map((fabric) =>
      resolveGarmentRecipe(
        dress({ topStyle: "unknown", neckline: "sweetheart", fabric }),
      ),
    );

    // Then the unresolved upper does not erase the known lower/material region.
    expect(results.every((result) => result.status === "partial")).toBe(true);
    expect(
      results.every(
        (result) =>
          result.layers.length === 1 &&
          result.layers[0]?.region === "lower" &&
          result.assetIds.includes(
            "lower-mermaid-strapless-sweetheart-mikado-natural-key-v1",
          ),
      ),
    ).toBe(true);
    expect(
      results.every(
        (result) => !result.markup.includes('data-region="upper-body"'),
      ),
    ).toBe(true);
    expect(results[1]?.assetIds).toContain(
      "longHigh-aLine-longSleeve-high-ivory-lace-natural-none-v2",
    );
  });

  it("omits the unresolved neckline upper instead of painting the source high collar", () => {
    // Given a known long-sleeve top with an unresolved neckline.
    const result = resolveGarmentRecipe(
      dress({ topStyle: "longSleeve", neckline: "unknown" }),
    );

    // When the full front composition is resolved.
    // Then the known lower/material remains and no high-neck upper is selected.
    expect(result.status).toBe("partial");
    expect(result.layers).toHaveLength(1);
    expect(result.layers[0]?.region).toBe("lower");
    expect(result.textures).toHaveLength(1);
    expect(result.textures[0]?.region).toBe("lower");
    expect(result.markup).not.toContain('data-region="upper-body"');
    expect(result.markup).not.toContain('data-neckline="high"');
  });
});
