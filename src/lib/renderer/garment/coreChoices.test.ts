import { describe, expect, it } from "vitest";
import { FABRICS, SILHOUETTES, type Dress } from "../../../types/domain";
import { UPPER_PRESETS } from "../../dress/upperPresets";
import { resolveGarmentRecipe } from "./core";
import { UPPER_CHOICE_VIEW_BOX, upperPreviewArtwork } from "./upperPreview";

const blank: Dress = {
  id: "test",
  tourId: "tour",
  shopId: "shop",
  order: 1,
  label: "기본 기록",
  topStyle: "unknown",
  neckline: "unknown",
  silhouette: "unknown",
  fabric: "unknown",
  waistline: "unknown",
  color: "unknown",
  train: "unknown",
  backStyle: "unknown",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
};

describe("core-only visual reconstruction", () => {
  it("shows the recorded strapless sweetheart shape in its choice thumbnail", () => {
    const thumbnail = upperPreviewArtwork(
      "strapless",
      "sweetheart",
      "sweetheart-choice",
    );
    const upper = thumbnail.layers.find(
      ({ region }) => region === "upper" || region === "full",
    );

    expect(upper?.asset.coverage.topStyle).toBe("strapless");
    expect(upper?.asset.coverage.neckline).toBe("sweetheart");
    expect(thumbnail.markup).toContain(
      'data-region="upper-body" data-asset-id="lower-mermaid-strapless-sweetheart-mikado-natural-key-v1"',
    );
  });

  it.each(UPPER_PRESETS)(
    "uses the full composition and shared neck-to-wrist crop for $id comparisons",
    (preset) => {
      const record = {
        ...blank,
        topStyle: preset.topStyle,
        neckline: preset.neckline,
        silhouette: "aLine" as const,
        fabric: "lace" as const,
      };
      const full = resolveGarmentRecipe(record, "full");
      const upper = resolveGarmentRecipe(record, "upper");
      expect(upper.layers).toEqual(full.layers);
      expect(upper.textures).toEqual(full.textures);
      expect(upper.viewBox).toEqual(UPPER_CHOICE_VIEW_BOX);
    },
  );
  it.each(UPPER_PRESETS)(
    "composes $id across all seven silhouettes and eight surfaces",
    (preset) => {
      for (const silhouette of SILHOUETTES.filter(
        (value) => value !== "unknown",
      )) {
        for (const fabric of FABRICS.filter((value) => value !== "unknown")) {
          const record = {
            ...blank,
            topStyle: preset.topStyle,
            neckline: preset.neckline,
            silhouette,
            fabric,
          };
          const before = JSON.stringify(record);
          const result = resolveGarmentRecipe(record, "full");
          const context = `${preset.id}/${silhouette}/${fabric}`;
          expect(result.status, context).toBe("partial");
          expect(
            result.layers.some(
              ({ region }) => region === "upper" || region === "full",
            ),
            context,
          ).toBe(true);
          expect(
            result.layers.some(
              ({ region }) => region === "lower" || region === "full",
            ),
            context,
          ).toBe(true);
          expect(result.missingFields, context).toEqual(
            expect.arrayContaining(["waistline", "color", "train"]),
          );
          expect(result.resolvedFields, context).toEqual(
            expect.arrayContaining([
              "topStyle",
              "neckline",
              "silhouette",
              "fabric",
            ]),
          );
          expect(result.markup, context).not.toMatch(/NaN|undefined/);
          expect(JSON.stringify(record), context).toBe(before);
          if (result.textures.length > 0) {
            expect(result.markup, context).toContain('mask="url(#');
            expect(
              result.textures.every(({ maskAssetId }) =>
                result.layers.some(
                  ({ asset }) => asset.assetId === maskAssetId,
                ),
              ),
              context,
            ).toBe(true);
          }
        }
      }
    },
  );
  it.each(UPPER_PRESETS)(
    "uses the same composition for the $id thumbnail with the common wrist crop",
    (preset) => {
      const thumbnail = upperPreviewArtwork(
        preset.topStyle,
        preset.neckline,
        preset.id,
      );
      const full = resolveGarmentRecipe(
        {
          ...blank,
          topStyle: preset.topStyle,
          neckline: preset.neckline,
          silhouette: "aLine",
          fabric: "mikadoSatin",
          waistline: "natural",
          color: "pureWhite",
          train: "none",
        },
        "full",
      );
      expect(thumbnail.assetIds).toEqual(full.assetIds);
      expect(thumbnail.color).toBe(full.color);
      expect(thumbnail.layers).toEqual(full.layers);
      expect(thumbnail.textures).toEqual(full.textures);
      expect(thumbnail.viewBox).toEqual(UPPER_CHOICE_VIEW_BOX);
      expect(thumbnail.markup).toContain('data-coordinate-frame="garment"');
      expect(thumbnail.markup).toContain('data-layer="mannequin-body"');
      expect(thumbnail.markup).toContain('data-arm="left"');
      expect(thumbnail.markup).toContain('data-arm="right"');
      expect(thumbnail.markup.indexOf('data-layer="mannequin"')).toBeLessThan(
        thumbnail.markup.indexOf('data-layer="garment-composition"'),
      );
      expect(thumbnail.markup).not.toContain('data-layer="head"');
      expect(thumbnail.markup).toContain('viewBox="60 60 240 200"');
      expect(thumbnail.markup).not.toContain('viewBox="100 66 160 154"');
    },
  );
});
