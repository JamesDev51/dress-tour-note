import { describe, expect, it } from "vitest";
import { FABRICS, SILHOUETTES, type Dress } from "../../../types/domain";
import { resolveGarmentRecipe } from "./core";

const base: Dress = {
  id: "waist-material",
  tourId: "tour",
  shopId: "shop",
  order: 1,
  label: "허리와 소재",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  fabric: "lace",
  waistline: "natural",
  color: "ivory",
  train: "none",
  backStyle: "unknown",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
};

describe("material composition at adjusted waists", () => {
  it.each(SILHOUETTES.filter((value) => value !== "unknown"))(
    "keeps the %s skirt and its material in the same join-to-hem frame",
    (silhouette) => {
      for (const fabric of FABRICS.filter(
        (value) => value !== "unknown" && value !== "mikadoSatin",
      )) {
        for (const waistline of ["basque", "drop", "empire"] as const) {
          const result = resolveGarmentRecipe({
            ...base,
            silhouette,
            fabric,
            waistline,
          });
          const document = new DOMParser().parseFromString(
            result.markup,
            "image/svg+xml",
          );
          const lower = document.querySelector(
            '[data-layer="lower-join-frame"]',
          );
          if (!lower) continue; // The empire source already has an empire join.
          const material = document.querySelector(
            '[data-layer="material-join-frame"]',
          );

          expect(
            material,
            `${silhouette}/${fabric}/${waistline}`,
          ).not.toBeNull();
          for (const attribute of ["x", "y", "width", "height", "viewBox"]) {
            expect(
              material?.getAttribute(attribute),
              `${silhouette}/${fabric}/${waistline}/${attribute}`,
            ).toBe(lower.getAttribute(attribute));
          }
          expect(
            material?.querySelector('[data-renderer="photo-lower-warp"]'),
            `${silhouette}/${fabric}/${waistline} retains the measured skirt warp`,
          ).not.toBeNull();
        }
      }
    },
  );

  it.each(SILHOUETTES.filter((value) => value !== "unknown"))(
    "preserves the %s material shape across all three train lengths",
    (silhouette) => {
      for (const fabric of FABRICS.filter(
        (value) => value !== "unknown" && value !== "mikadoSatin",
      )) {
        for (const train of ["sweep", "chapel", "cathedral"] as const) {
          const result = resolveGarmentRecipe({
            ...base,
            silhouette,
            fabric,
            train,
          });
          const document = new DOMParser().parseFromString(
            result.markup,
            "image/svg+xml",
          );
          const cloth = document.querySelector(
            '[data-layer="train-cloth-frame"]',
          );
          const target = document.querySelector(
            '[data-layer="train-target-frame"]',
          );

          expect(
            cloth?.getAttribute("viewBox"),
            `${silhouette}/${fabric}/${train}`,
          ).toBe(target?.getAttribute("viewBox"));
          expect(
            cloth?.querySelector('[data-renderer="photo-lower-warp"]'),
            `${silhouette}/${fabric}/${train} fits the material before extension`,
          ).not.toBeNull();
        }
      }
    },
  );
});
