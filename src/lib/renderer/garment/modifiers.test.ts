import { describe, expect, it } from "vitest";
import type { GarmentLayer, GarmentRecipe } from "./types";
import { trainMarkup } from "./modifiers";
import { GARMENT_ASSETS } from "./registry";

const sourceAsset = GARMENT_ASSETS.find(
  (asset) =>
    asset.role === "material-master" && asset.coverage.fabric === "lace",
);
const lowerAsset = GARMENT_ASSETS.find(
  (asset) =>
    asset.role === "lower-silhouette" && asset.coverage.silhouette === "empire",
);

function renderedTrain(train: GarmentRecipe["train"] = "cathedral") {
  if (!sourceAsset || !lowerAsset)
    throw new Error("train fixture assets missing");
  const lowerLayer: GarmentLayer = {
    asset: lowerAsset,
    region: "lower",
    joinY: lowerAsset.anchors.waistY,
    sourceJoinY: lowerAsset.anchors.waistY,
  };
  const recipe = {
    view: "full",
    color: "ivory",
    topStyle: "longSleeve",
    neckline: "high",
    silhouette: "empire",
    waistline: "natural",
    fabric: "lace",
    train,
    details: [],
    status: "ready",
    markup: "",
    viewBox: { x: 0, y: 0, width: 360, height: 640 },
    logicalBounds: { x: 0, y: 0, width: 360, height: 640 },
    layers: [lowerLayer],
    textures: [],
    assetIds: [],
    resolvedFields: [],
    missingFields: [],
    warnings: [],
  } satisfies GarmentRecipe;
  return trainMarkup(
    recipe,
    "train-test",
    { asset: sourceAsset, sourceIndex: 0 },
    lowerLayer,
  );
}

describe("trainMarkup", () => {
  it("replaces the native lower with one continuous source mapping", () => {
    const result = renderedTrain("chapel");

    expect(result.replacedRegion).toBe("lower");
    expect(result.content).toContain('data-layer="train"');
    expect(result.content).toContain('data-composition="unified-lower"');
    expect(result.content).toContain('data-layer="train-cloth-unified"');
    expect(result.content).not.toContain('data-source-window="near-hem"');
  });

  it("maps the complete source lower to the final train edge", () => {
    const result = renderedTrain();
    const frame =
      result.content.match(/<svg data-layer="train-cloth-frame"[^>]+>/)?.[0] ??
      "";
    const viewBox =
      frame
        .match(/viewBox="([^"]+)"/)?.[1]
        ?.split(" ")
        .map(Number) ?? [];
    const sourceBottom = (viewBox[1] ?? 0) + (viewBox[3] ?? 0);

    expect(result.content).toContain('data-layer="train-cloth-unified"');
    expect(result.content).not.toContain('data-layer="train-attachment"');
    expect(result.content).not.toContain('data-layer="train-fold"');
    expect(result.content).toContain('data-source-window="join-to-hem"');
    expect(sourceBottom).toBeCloseTo(555.2, 1);
  });

  it("keeps train lengths distinct while none has no train markup", () => {
    const heights = (["sweep", "chapel", "cathedral"] as const).map((train) => {
      const result = renderedTrain(train);
      const frame =
        result.content.match(
          /<svg data-layer="train-cloth-frame"[^>]+>/,
        )?.[0] ?? "";
      return Number(frame.match(/height="([^"]+)"/)?.[1] ?? 0);
    });

    expect(heights[0]).toBeLessThan(heights[1] ?? 0);
    expect(heights[1]).toBeLessThan(heights[2] ?? 0);
    expect(renderedTrain("none")).toEqual({ definitions: "", content: "" });
  });
});
