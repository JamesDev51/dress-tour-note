import { describe, expect, it } from "vitest";
import {
  FABRICS,
  NECKLINES,
  SILHOUETTES,
  TOP_STYLES,
  type Dress,
} from "../../../types/domain";
import { resolveGarmentRecipe } from "./core";

const baseline: Dress = {
  id: "combination-audit",
  tourId: "audit-tour",
  shopId: "audit-shop",
  order: 1,
  label: "조합 검사",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  fabric: "mikadoSatin",
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

describe("exhaustive front selection contracts (4,032 combinations)", () => {
  it("renders the transparent illusion yoke across non-native tops and materials", () => {
    for (const topStyle of [
      "strap",
      "spaghetti",
      "wideStrap",
      "oneShoulder",
      "shortSleeve",
    ] as const)
      for (const fabric of FABRICS.filter((value) => value !== "unknown")) {
        const result = resolveGarmentRecipe({
          ...baseline,
          topStyle,
          fabric,
          neckline: "illusion",
        });
        const document = new DOMParser().parseFromString(
          result.markup,
          "image/svg+xml",
        );
        const yoke = document.querySelector('[data-layer="illusion-yoke"]');
        const context = `${topStyle}/${fabric}`;

        expect(yoke, context).not.toBeNull();
        expect(yoke?.getAttribute("opacity"), context).toBe("0.36");
        const use = yoke?.querySelector("use");
        const sourceId = use?.getAttribute("href")?.slice(1);
        expect(
          sourceId && document.getElementById(sourceId),
          context,
        ).not.toBeNull();
        expect(use?.getAttribute("data-material"), context).toBe(fabric);
        for (const name of ["mask", "clip-path"]) {
          const id = yoke?.getAttribute(name)?.match(/url\(#([^)]+)\)/)?.[1];
          expect(id && document.getElementById(id), context).not.toBeNull();
        }
      }
  });

  it("preserves native illusion artwork without adding a second yoke", () => {
    for (const topStyle of [
      "strapless",
      "offShoulder",
      "halter",
      "longSleeve",
    ] as const) {
      const result = resolveGarmentRecipe({
        ...baseline,
        topStyle,
        neckline: "illusion",
      });
      expect(result.markup, topStyle).not.toContain(
        'data-layer="illusion-yoke"',
      );
      expect(result.layers[0]?.asset.coverage.neckline, topStyle).toBe(
        "illusion",
      );
    }
  });

  it.each(TOP_STYLES.filter((value) => value !== "unknown"))(
    "preserves %s, neckline, skirt and material in full and upper views",
    (topStyle) => {
      for (const neckline of NECKLINES.filter((value) => value !== "unknown"))
        for (const silhouette of SILHOUETTES.filter(
          (value) => value !== "unknown",
        ))
          for (const fabric of FABRICS.filter((value) => value !== "unknown")) {
            const record = {
              ...baseline,
              topStyle,
              neckline,
              silhouette,
              fabric,
            };
            const before = JSON.stringify(record);
            for (const view of ["full", "upper"] as const) {
              const context = `${topStyle}/${neckline}/${silhouette}/${fabric}/${view}`;
              const result = resolveGarmentRecipe(record, view);
              const upper = result.layers.find(
                ({ region }) => region === "upper" || region === "full",
              );
              const lower = result.layers.find(
                ({ region }) => region === "lower" || region === "full",
              );

              expect(result.status, context).toBe("ready");
              expect(upper?.asset.coverage.topStyle, context).toBe(topStyle);
              expect(
                upper?.region === "full"
                  ? upper.asset.coverage.neckline
                  : upper?.neckline,
                context,
              ).toBe(neckline);
              expect(lower?.asset.coverage.silhouette, context).toBe(
                silhouette,
              );
              if (upper && upper.asset.coverage.neckline !== neckline)
                expect(result.markup, context).toContain(
                  `data-neckline="${neckline}"`,
                );
              for (const layer of result.layers) {
                if (layer.asset.coverage.fabric !== fabric)
                  expect(
                    result.textures.some(
                      (texture) =>
                        texture.region === layer.region &&
                        texture.maskAssetId === layer.asset.assetId &&
                        texture.asset.coverage.fabric === fabric,
                    ),
                    context,
                  ).toBe(true);
              }
              expect(result.markup, context).not.toMatch(/NaN|undefined/);
            }
            expect(JSON.stringify(record)).toBe(before);
          }
    },
  );
});
