import { describe, expect, it } from "vitest";
import type { Dress } from "../../../types/domain";
import { resolveGarmentRecipe } from "./core";
import { upperSelectionForLayer } from "./markupParts";
import { findUpperAsset, findUpperFamilyAsset } from "./registry";

const baseline: Dress = {
  id: "slit-full-record",
  tourId: "tour",
  shopId: "shop",
  order: 1,
  label: "full artwork slit",
  topStyle: "longSleeve",
  neckline: "high",
  silhouette: "aLine",
  fabric: "mikadoSatin",
  waistline: "natural",
  color: "ivory",
  train: "none",
  backStyle: "unknown",
  details: ["slit"],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
};

describe("garment source masking", () => {
  it.each(["aLine", "ballGown"] as const)(
    "keeps native sweetheart hips out of the selected %s upper comparison",
    (silhouette) => {
      const record: Dress = {
        ...baseline,
        topStyle: "strapless",
        neckline: "sweetheart",
        silhouette,
        fabric: "lace",
        details: [],
      };
      const clips = (["full", "upper"] as const).map((view) => {
        const artwork = resolveGarmentRecipe(record, view);
        const document = new DOMParser().parseFromString(
          artwork.markup,
          "image/svg+xml",
        );
        const upper = document.querySelector(
          '[data-layer="garment-image"][data-region="upper-body"]',
        );
        const clipId = upper
          ?.getAttribute("clip-path")
          ?.match(/^url\(#(.+)\)$/)?.[1];
        return document
          .getElementById(clipId!)
          ?.querySelector("path")
          ?.getAttribute("d");
      });

      expect(clips[0]).toBeTruthy();
      expect(clips[1]).toBe(clips[0]);
    },
  );

  it("retains generic illusion-yoke instructions for the artwork composition", () => {
    const asset = findUpperFamilyAsset("strap")!;
    const selection = upperSelectionForLayer(
      { asset, region: "upper", neckline: "illusion" },
      "generic-illusion",
    );

    expect(selection?.yoke).toEqual({
      maskId: expect.any(String),
      opacity: expect.any(Number),
    });
    expect(selection?.defs).toContain(`id="${selection?.yoke?.maskId}"`);
    expect(selection?.yoke?.opacity).toBeGreaterThan(0);
    expect(selection?.yoke?.opacity).toBeLessThan(1);
  });

  it("leaves a photographed illusion yoke in the native matched asset", () => {
    const asset = findUpperAsset("longSleeve", "illusion")!;
    const selection = upperSelectionForLayer(
      { asset, region: "upper", neckline: "illusion" },
      "native-illusion",
    );

    expect(selection).toBeDefined();
    expect(selection?.yoke).toBeUndefined();
  });

  it.each([
    { topStyle: "longSleeve", neckline: "high", silhouette: "aLine" },
    { topStyle: "offShoulder", neckline: "illusion", silhouette: "aLine" },
    { topStyle: "strapless", neckline: "sweetheart", silhouette: "mermaid" },
  ] as const)(
    "cuts the recorded slit from the full $topStyle/$neckline/$silhouette photograph",
    (selection) => {
      const artwork = resolveGarmentRecipe({ ...baseline, ...selection });
      const document = new DOMParser().parseFromString(
        artwork.markup,
        "image/svg+xml",
      );
      const image = document.querySelector(
        '[data-layer="garment-image"][data-region="full-body"]',
      );
      const slit = document.querySelector('mask[data-detail="slit"]');

      expect(image).not.toBeNull();
      expect(slit).not.toBeNull();
      expect(image?.getAttribute("mask")).toBe(`url(#${slit?.id})`);
      expect(image?.getAttribute("style")).toContain(`mask:url(#${slit?.id})`);
      // The slit mask preserves the source above the skirt opening.
      expect(slit?.querySelector("rect")?.getAttribute("fill")).toBe("white");
      const start = slit
        ?.querySelector("path")
        ?.getAttribute("d")
        ?.match(/^M188 ([\d.]+)/);
      expect(Number(start?.[1])).toBeGreaterThan(artwork.layers[0]!.joinY!);
    },
  );
});
