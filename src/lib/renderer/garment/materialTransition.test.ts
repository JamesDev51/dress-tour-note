import { describe, expect, it } from "vitest";
import type { Dress, LowerFabricStart } from "../../../types/domain";
import { buildGarmentArtworkMarkup, resolveGarmentRecipe } from "./core";

function record(patch: Partial<Dress> = {}): Dress {
  return {
    id: "material-transition",
    tourId: "tour",
    shopId: "shop",
    order: 0,
    label: "레이스에서 쉬폰으로",
    topStyle: "strapless",
    neckline: "sweetheart",
    silhouette: "mermaid",
    waistline: "natural",
    fabric: "mikadoSatin",
    upperFabric: "lace",
    lowerFabric: "organzaChiffon",
    color: "ivory",
    train: "none",
    details: [],
    quickTags: [],
    memo: "",
    isFavorite: false,
    createdAt: "",
    updatedAt: "",
    ...patch,
  };
}

function parse(markup: string) {
  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document;
}

describe("regional material transition", () => {
  it("keeps old records and an explicit waist transition identical", () => {
    const old = resolveGarmentRecipe(record(), "full", "same");
    const waist = resolveGarmentRecipe(
      record({ lowerFabricStart: "waist" }),
      "full",
      "same",
    );
    const withoutNamespace = (markup: string) =>
      markup.replaceAll(/garment-same-\d+-/g, "garment-same-");
    expect(withoutNamespace(waist.markup)).toBe(withoutNamespace(old.markup));
    expect(
      parse(old.markup).querySelector('[data-layer="material-transition"]'),
    ).toBeNull();
  });

  it("moves only the fabric boundary while preserving the selected waist and skirt geometry", () => {
    const base = resolveGarmentRecipe(record());
    let previousY = 0;
    for (const lowerFabricStart of ["hip", "thigh", "knee"] as const) {
      const result = resolveGarmentRecipe(record({ lowerFabricStart }));
      expect(result.layers).toEqual(base.layers);
      expect(result.logicalBounds).toEqual(base.logicalBounds);
      const document = parse(result.markup);
      const extension = document.querySelector(
        '[data-material-section="upper-extension"]',
      );
      expect(extension).not.toBeNull();
      expect(extension?.getAttribute("data-material")).toBe("lace");
      expect(extension?.getAttribute("data-lower-fabric-start")).toBe(
        lowerFabricStart,
      );
      const y = Number(extension?.getAttribute("data-transition-y"));
      expect(y).toBeGreaterThan(previousY);
      expect(y).toBeGreaterThan(base.layers[0].joinY!);
      expect(y).toBeLessThan(base.layers[0].asset.anchors.hemY!);
      previousY = y;
      const lower = document.querySelector('[data-material-section="lower"]');
      expect(lower?.getAttribute("data-material")).toBe("organzaChiffon");
      expect(lower?.getAttribute("data-transition-y")).toBe(String(y));
      for (const region of [extension, lower]) {
        const id = region
          ?.getAttribute("clip-path")
          ?.match(/url\(#([^)]+)\)/)?.[1];
        const boundary = document.getElementById(id!);
        expect(boundary?.querySelector("path")?.getAttribute("d")).toContain(
          "Q",
        );
        // The fabric continues to use the selected skirt's measured alpha mask.
        expect(
          region
            ?.querySelector("[data-mask-asset-id]")
            ?.getAttribute("data-mask-asset-id"),
        ).toBe(base.layers[0].asset.assetId);
      }
    }
  });

  it.each(["hip", "thigh", "knee"] as const)(
    "uses the same %s fabric boundary for full, upper and embedded PDF artwork",
    (lowerFabricStart) => {
      const full = resolveGarmentRecipe(
        record({ lowerFabricStart }),
        "full",
        "fabric",
      );
      const upper = resolveGarmentRecipe(
        record({ lowerFabricStart }),
        "upper",
        "fabric",
      );
      const embedded = buildGarmentArtworkMarkup(full, {
        namespace: "fabric",
        assetHrefs: new Map(
          [...full.layers, ...full.textures].map(({ asset }) => [
            asset.assetId,
            "data:image/webp;base64,AA==",
          ]),
        ),
      });
      const paths = [full.markup, upper.markup, embedded].map((markup) =>
        [
          ...parse(markup).querySelectorAll("[data-material-boundary] path"),
        ].map((path) => path.getAttribute("d")),
      );
      expect(paths[0]).toHaveLength(2);
      expect(paths[1]).toEqual(paths[0]);
      expect(paths[2]).toEqual(paths[0]);
      expect(embedded).not.toContain('href="/assets/');
    },
  );

  it.each([
    { lowerFabric: "lace" as const },
    { upperFabric: "unknown" as const },
    { lowerFabric: "unknown" as const },
  ])(
    "ignores a material start when materials are equal or unresolved: %j",
    (patch) => {
      const result = resolveGarmentRecipe(
        record({ ...patch, lowerFabricStart: "knee" }),
      );
      expect(
        parse(result.markup).querySelector(
          '[data-layer="material-transition"]',
        ),
      ).toBeNull();
      expect(
        result.textures.some(
          (texture) => texture.materialSection === "upper-extension",
        ),
      ).toBe(false);
    },
  );

  it.each([
    { upperFabric: "mikadoSatin", lowerFabric: "lace" },
    { upperFabric: "lace", lowerFabric: "mikadoSatin" },
    { upperFabric: "floral3D", lowerFabric: "organzaChiffon" },
  ] as const)(
    "extends the upper material even when one selected fabric is the native base: %j",
    (materials) => {
      const result = resolveGarmentRecipe(
        record({ ...materials, lowerFabricStart: "thigh" }),
      );
      const extension = parse(result.markup).querySelector(
        '[data-material-section="upper-extension"]',
      );
      expect(extension?.getAttribute("data-material")).toBe(
        materials.upperFabric,
      );
      expect(
        result.textures.find(
          ({ materialSection }) => materialSection === "upper-extension",
        )?.asset.coverage.fabric,
      ).toBe(materials.upperFabric);
    },
  );

  it.each([
    "aLine",
    "ballGown",
    "mermaid",
    "fitAndFlare",
    "sheath",
    "empire",
  ] as const)(
    "clips extended fabric to the %s skirt for all transition positions",
    (silhouette) => {
      for (const lowerFabricStart of [
        "hip",
        "thigh",
        "knee",
      ] satisfies LowerFabricStart[]) {
        const result = resolveGarmentRecipe(
          record({ silhouette, lowerFabricStart }),
        );
        const document = parse(result.markup);
        const extension = document.querySelector(
          '[data-material-section="upper-extension"]',
        );
        expect(extension).not.toBeNull();
        expect(
          extension?.querySelector('[data-region="lower-body"]'),
        ).not.toBeNull();
        const ids = [...document.querySelectorAll("[id]")].map(
          (node) => node.id,
        );
        expect(new Set(ids).size).toBe(ids.length);
        for (const [, id] of result.markup.matchAll(/url\(#([^)]+)\)/g))
          expect(document.getElementById(id), id).not.toBeNull();
      }
    },
  );
});
