import { describe, expect, it } from "vitest";
import { FABRICS, type Dress, type Fabric } from "../../../types/domain";
import { resolveGarmentRecipe } from "./core";

function dress(
  overrides: Partial<Dress> & {
    upperFabric?: Fabric;
    lowerFabric?: Fabric;
  } = {},
): Dress {
  return {
    id: "mixed-materials",
    tourId: "tour",
    shopId: "shop",
    order: 1,
    label: "혼합 소재",
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
    ...overrides,
  };
}

describe("independent upper and lower materials", () => {
  it("does not put the lace upper photograph underneath a separate sheer A-line skirt", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "longSleeve",
        neckline: "high",
        upperFabric: "lace",
        lowerFabric: "organzaChiffon",
      }),
    );
    const lower = result.layers.find(({ region }) => region === "lower");
    expect(lower?.asset.coverage.fabric).toBe("mikadoSatin");
  });

  it.each([
    ["strapless", "sweetheart"],
    ["longSleeve", "illusion"],
  ] as const)(
    "keeps the %s/%s upper material boundary identical in full and upper crops",
    (topStyle, neckline) => {
      const paths = (["full", "upper"] as const).map((view) => {
        const result = resolveGarmentRecipe(
          dress({
            topStyle,
            neckline,
            upperFabric: "lace",
            lowerFabric: "organzaChiffon",
          }),
          view,
        );
        const document = new DOMParser().parseFromString(
          result.markup,
          "image/svg+xml",
        );
        const texture = document.querySelector(
          '[data-layer="material-texture"][data-region="upper-body"]',
        );
        const id = texture
          ?.getAttribute("clip-path")
          ?.match(/url\(#([^)]+)\)/)?.[1];
        const clip = document.getElementById(id!);
        return [...(clip?.querySelectorAll("path") ?? [])].map((path) =>
          path.getAttribute("d"),
        );
      });
      expect(paths[0].length).toBeGreaterThan(0);
      expect(paths[1]).toEqual(paths[0]);
    },
  );

  it.each(["full", "upper"] as const)(
    "keeps both chosen materials in %s without a full-photo shortcut",
    (view) => {
      const materials = FABRICS.filter((fabric) => fabric !== "unknown");
      const pairs = materials.flatMap((upper) =>
        materials
          .filter((lower) => lower !== upper)
          .map((lower) => [upper, lower] as const),
      );
      const tops = [
        ["longSleeve", "high"],
        ["strapless", "sweetheart"],
        ["offShoulder", "illusion"],
        ["strap", "square"],
      ] as const;
      for (const [upperFabric, lowerFabric] of pairs)
        for (const [topStyle, neckline] of tops)
          for (const silhouette of ["aLine", "mermaid"] as const) {
            const record = dress({
              upperFabric,
              lowerFabric,
              topStyle,
              neckline,
              silhouette,
            });
            const before = JSON.stringify(record);
            const result = resolveGarmentRecipe(record, view);
            const context = `${topStyle}/${neckline}/${silhouette}/${upperFabric}/${lowerFabric}/${view}`;
            expect(result.status, context).toBe("ready");
            expect(
              result.layers.map(({ region }) => region),
              context,
            ).toEqual(["lower", "upper"]);
            for (const region of ["upper", "lower"] as const) {
              const selected = region === "upper" ? upperFabric : lowerFabric;
              const layer = result.layers.find(
                (layer) => layer.region === region,
              )!;
              expect(
                layer.asset.coverage.fabric === selected ||
                  result.textures.some(
                    (texture) =>
                      texture.region === region &&
                      texture.maskAssetId === layer.asset.assetId &&
                      texture.asset.coverage.fabric === selected,
                  ),
                context,
              ).toBe(true);
            }
            expect(JSON.stringify(record)).toBe(before);
          }
    },
  );

  it("can complete the material record with two overrides while the common field is unknown", () => {
    const result = resolveGarmentRecipe(
      dress({
        fabric: "unknown",
        upperFabric: "lace",
        lowerFabric: "organzaChiffon",
      }),
    );
    expect(result.status).toBe("ready");
    expect(result.missingFields).not.toContain("fabric");
  });

  it("keeps an explicitly unknown upper unresolved while preserving the known skirt material", () => {
    const result = resolveGarmentRecipe(
      dress({
        fabric: "lace",
        upperFabric: "unknown",
        lowerFabric: "organzaChiffon",
      }),
    );
    expect(result.status).toBe("partial");
    expect(result.missingFields).toContain("fabric");
    expect(result.textures.some((texture) => texture.region === "upper")).toBe(
      false,
    );
    expect(
      result.textures.some(
        (texture) =>
          texture.region === "lower" &&
          texture.asset.coverage.fabric === "organzaChiffon",
      ),
    ).toBe(true);
  });
});
