import { describe, expect, it } from "vitest";
import type { GarmentLayer, GarmentRecipe } from "./types";
import { trainMarkup } from "./modifiers";
import { GARMENT_ASSETS } from "./registry";
import { resolveGarmentRecipe } from "./core";
import type { Dress } from "../../../types/domain";

const shortDress: Dress = {
  id: "short-train",
  tourId: "audit",
  shopId: "audit",
  order: 1,
  label: "",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "teaLength",
  fabric: "mikadoSatin",
  waistline: "natural",
  color: "ivory",
  train: "chapel",
  backStyle: "openBack",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
};

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
  it.each(["mikadoSatin", "lace"] as const)(
    "preserves a short front hem with a separate rear train in %s",
    (fabric) => {
      for (const train of ["sweep", "chapel", "cathedral"] as const)
        for (const waistline of [
          "natural",
          "basque",
          "drop",
          "empire",
        ] as const) {
          const result = resolveGarmentRecipe({
            ...shortDress,
            fabric,
            train,
            waistline,
          });
          const document = new DOMParser().parseFromString(
            result.markup,
            "image/svg+xml",
          );
          const front = document.querySelector(
            '[data-layer="garment-image"][data-region="lower-body"], [data-layer="garment-image"][data-region="full-body"]',
          );
          const rear = document.querySelector(
            '[data-layer="train"][data-composition="rear-train-behind-short-front"]',
          );
          const opening = document.querySelector(
            '[data-mask-purpose="short-front-opening"]',
          );
          const context = `${fabric}/${train}/${waistline}`;

          expect(front, context).not.toBeNull();
          expect(rear, context).not.toBeNull();
          expect(opening?.getAttribute("fill"), context).toBe("black");
          expect(
            document.querySelector('[data-layer="garment-composition"]')
              ?.firstElementChild,
            context,
          ).toBe(rear);
          const frame = rear?.querySelector('[data-layer="train-cloth-frame"]');
          expect(
            Number(frame?.getAttribute("y")) +
              Number(frame?.getAttribute("height")),
            context,
          ).toBeGreaterThan(552);
          const back = resolveGarmentRecipe(
            { ...shortDress, fabric, train, waistline },
            "back",
          );
          const backDocument = new DOMParser().parseFromString(
            back.markup,
            "image/svg+xml",
          );
          const backFrame = backDocument.querySelector(
            '[data-layer="train-cloth-frame"]',
          );
          expect(
            Number(backFrame?.getAttribute("y")) +
              Number(backFrame?.getAttribute("height")),
            context,
          ).toBe(
            Number(frame?.getAttribute("y")) +
              Number(frame?.getAttribute("height")),
          );
        }
    },
  );

  it("cuts the selected slit through the replacement train cloth", () => {
    const result = resolveGarmentRecipe({
      ...shortDress,
      silhouette: "aLine",
      fabric: "lace",
      details: ["slit"],
    });
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    const cut = document.querySelector('[data-layer="train-slit-cut"]');
    const mask = cut?.getAttribute("mask")?.match(/url\(#([^)]+)\)/)?.[1];

    expect(cut?.querySelector('[data-layer="train"]')).not.toBeNull();
    expect(
      mask &&
        document.getElementById(mask)?.querySelector('path[fill="black"]'),
    ).toBeTruthy();
  });

  it("clips photographed source sleeves before stretching the skirt into a train", () => {
    const result = renderedTrain();
    const document = new DOMParser().parseFromString(
      `<svg>${result.definitions}${result.content}</svg>`,
      "image/svg+xml",
    );
    const cloth = document.querySelector('[data-layer="train-cloth-unified"]');
    const source =
      cloth?.tagName === "use" ? cloth : cloth?.querySelector("use");
    const clipId = source
      ?.getAttribute("clip-path")
      ?.match(/url\(#(.+)\)/)?.[1];
    expect(clipId).toBeTruthy();
    expect(clipId).toContain("source-body");
    const clip = document.getElementById(clipId!);
    expect(clip?.tagName).toBe("clipPath");
    expect(clip?.querySelector("path")?.getAttribute("d")).toBeTruthy();
  });

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
    expect(sourceBottom).toBeCloseTo(lowerAsset!.anchors.hemY!, 1);
  });

  it("fits the chosen material to the skirt before extending a train", () => {
    const result = renderedTrain("chapel");
    const document = new DOMParser().parseFromString(
      `<svg>${result.definitions}${result.content}</svg>`,
      "image/svg+xml",
    );
    const cloth = document.querySelector('[data-layer="train-cloth-frame"]');
    const target = document.querySelector('[data-layer="train-target-frame"]');

    expect(cloth?.getAttribute("viewBox")).toBe(
      target?.getAttribute("viewBox"),
    );
    expect(
      cloth?.querySelector('[data-renderer="photo-lower-warp"]'),
    ).not.toBeNull();
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
