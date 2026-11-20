import { describe, expect, it } from "vitest";
import type { Dress } from "../../../types/domain";
import { resolveGarmentRecipe } from "./core";

function dress(overrides: Partial<Dress> = {}): Dress {
  return {
    id: "detail-overlay-test",
    tourId: "tour-1",
    shopId: "shop-1",
    order: 1,
    label: "detail overlay test",
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

describe("detail overlay construction", () => {
  it("renders pearls as shaded scattered embroidery rather than a button row", () => {
    const result = resolveGarmentRecipe(dress({ details: ["pearl"] }));
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    const pearls = [...document.querySelectorAll("[data-pearl]")];
    const xs = pearls.map((pearl) => Number(pearl.getAttribute("cx")));
    expect(pearls.length).toBeGreaterThan(30);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(50);
    expect(pearls.every((pearl) => Number(pearl.getAttribute("r")) < 2)).toBe(
      true,
    );
    expect(
      document.querySelector('radialGradient[data-finish="pearl-lustre"]'),
    ).not.toBeNull();
  });

  it("renders sequins as dense flat reflective discs with facets and glints", () => {
    const result = resolveGarmentRecipe(dress({ details: ["sequin"] }));
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    expect(
      document.querySelectorAll("[data-sequin] ellipse").length,
    ).toBeGreaterThan(50);
    expect(
      document.querySelectorAll("[data-sequin-facet]").length,
    ).toBeGreaterThan(50);
    expect(
      document.querySelectorAll("[data-sequin-glint]").length,
    ).toBeGreaterThan(5);
  });

  it("shows several overlapping shaded fabric folds for draping", () => {
    const result = resolveGarmentRecipe(dress({ details: ["draping"] }));
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    expect(
      document.querySelectorAll("[data-cloth-fold]").length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      document.querySelector('linearGradient[data-finish="cloth-fold"]'),
    ).not.toBeNull();
  });

  it("uses a photographic floral applique cluster instead of one small emblem", () => {
    const result = resolveGarmentRecipe(dress({ details: ["floral"] }));
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    expect(
      document.querySelectorAll(
        '[data-detail="floral"] use[data-layer="detail-photo"]',
      ).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it.each(["pearl", "sequin", "draping", "floral"] as const)(
    "attaches %s to the retained bodice instead of painting over an open neckline",
    (detail) => {
      const result = resolveGarmentRecipe(
        dress({ topStyle: "strapless", neckline: "v", details: [detail] }),
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );
      const attachment = document.querySelector(
        `[data-embellishment="${detail}"]`,
      );
      const id = attachment
        ?.getAttribute("mask")
        ?.match(/url\(#([^)]+)\)/)?.[1];
      expect(id).toBeTruthy();
      const mask = document.getElementById(id!);
      expect(
        mask?.querySelector('use[data-source="retained-bodice"]'),
      ).not.toBeNull();
    },
  );

  it.each(["slit", "overskirt"] as const)(
    "does not invent a skirt for %s while the silhouette is unrecorded",
    (detail) => {
      const result = resolveGarmentRecipe(
        dress({ silhouette: "unknown", details: [detail] }),
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );

      expect(result.layers.every(({ region }) => region === "upper")).toBe(
        true,
      );
      expect(document.querySelector(`[data-detail="${detail}"]`)).toBeNull();
      expect(document.querySelector('[data-layer="detail-photo"]')).toBeNull();
    },
  );

  it("uses a photographic cloth layer for overskirt construction", () => {
    const result = resolveGarmentRecipe(dress({ details: ["overskirt"] }));

    expect(result.markup).toContain('data-renderer="photo-overskirt"');
    expect(result.markup).toContain(
      'data-layer="detail-photo" data-detail="overskirt"',
    );
    expect(result.markup).toContain('clip-path="url(#');
  });

  it("uses photographic material for draping and sheer construction", () => {
    const draping = resolveGarmentRecipe(dress({ details: ["draping"] }));
    const sheer = resolveGarmentRecipe(dress({ details: ["sheer"] }));

    expect(draping.markup).toContain('data-renderer="photo-draping"');
    expect(draping.markup).toContain('data-detail="draping"');
    expect(sheer.markup).toContain('data-renderer="photo-sheer"');
    expect(sheer.markup).toContain('data-detail="sheer"');
  });

  it.each(["draping", "sheer"] as const)(
    "bounds the %s photograph to its defined clip in the upper view",
    (detail) => {
      const result = resolveGarmentRecipe(
        dress({ details: [detail, "slit", "overskirt"] }),
        "upper",
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );
      const photo = document.querySelector(
        `[data-layer="detail-photo"][data-detail="${detail}"]`,
      );
      expect(photo).not.toBeNull();
      const clipId = photo
        ?.getAttribute("clip-path")
        ?.match(/^url\(#(.+)\)$/)?.[1];
      expect(clipId).toBeTruthy();
      const clip = document.getElementById(clipId!);
      expect(clip?.tagName).toBe("clipPath");
      expect(clip?.querySelector("path")).not.toBeNull();
      expect(document.querySelector('[data-detail="slit"]')).toBeNull();
      expect(document.querySelector('[data-detail="overskirt"]')).toBeNull();
    },
  );

  it.each(["openBack", "vBack", "illusionBack"] as const)(
    "keeps a front sheer detail from painting over the recorded %s",
    (backStyle) => {
      const result = resolveGarmentRecipe(
        dress({ backStyle, details: ["sheer"] }),
        "back",
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );
      expect(document.querySelector('[data-detail="sheer"]')).toBeNull();
      expect(
        document.querySelector('[data-layer="back-opening-mask"]'),
      ).not.toBeNull();
      expect(
        document
          .querySelector('[data-layer="back-construction"]')
          ?.getAttribute("data-shape"),
      ).toBe(
        backStyle === "illusionBack"
          ? "illusion"
          : backStyle === "vBack"
            ? "v"
            : "open",
      );
      for (const [, id] of result.markup.matchAll(/url\(#([^)]*)\)/g)) {
        expect(
          document.getElementById(id),
          `missing SVG reference: ${id}`,
        ).not.toBeNull();
      }
    },
  );

  it("registers a waist bow knot on the selected waist seam", () => {
    const result = resolveGarmentRecipe(dress({ details: ["waistBow"] }));

    expect(result.markup).toContain('data-anchor="waist-knot"');
    expect(result.markup).toContain('data-anchor-y="170.2"');
    expect(result.markup).toContain("translate(130.4 140.28)");
  });

  it.each([
    { topStyle: "strapless", neckline: "unknown" },
    { topStyle: "unknown", neckline: "high" },
    { topStyle: "unknown", neckline: "unknown" },
  ] as const)(
    "does not float upper details above a lower-only record: %j",
    (selection) => {
      const upperDetails = [
        "detachableSleeve",
        "sheer",
        "draping",
        "corset",
        "pearl",
        "sequin",
        "floral",
      ] as const;
      const result = resolveGarmentRecipe(
        dress({
          ...selection,
          silhouette: "mermaid",
          details: [...upperDetails, "overskirt"],
        }),
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );
      expect(result.status).toBe("partial");
      expect(result.layers.every(({ region }) => region === "lower")).toBe(
        true,
      );
      for (const detail of upperDetails) {
        expect(document.querySelector(`[data-detail="${detail}"]`)).toBeNull();
      }
      expect(
        document.querySelector('[data-detail="overskirt"]'),
      ).not.toBeNull();
    },
  );

  it.each(["full", "upper", "back"] as const)(
    "keeps selected detachable sleeves when the %s record has an upper layer",
    (view) => {
      const result = resolveGarmentRecipe(
        dress({
          topStyle: "strapless",
          neckline: "sweetheart",
          backStyle: "openBack",
          details: ["detachableSleeve"],
        }),
        view,
      );
      expect(
        result.layers.some(
          ({ region }) => region === "upper" || region === "full",
        ),
      ).toBe(true);
      expect(result.markup).toContain('data-detail="detachableSleeve"');
    },
  );

  it.each(["unknown", "strapless", "longSleeve"] as const)(
    "attaches detachable sleeve roots inside the retained %s rear bodice",
    (topStyle) => {
      const result = resolveGarmentRecipe(
        dress({
          topStyle,
          silhouette: "empire",
          waistline: "basque",
          train: "sweep",
          backStyle: "corsetBack",
          details: ["detachableSleeve"],
        }),
        "back",
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );
      const sleeves = document.querySelectorAll(
        '[data-detail="detachableSleeve"] path',
      );
      expect(sleeves).toHaveLength(2);
      for (const sleeve of sleeves) {
        const root = sleeve.getAttribute("d")?.match(/^M([\d.]+) ([\d.]+)/);
        expect(root).not.toBeNull();
        expect(Number(root![1])).toBeGreaterThanOrEqual(148);
        expect(Number(root![1])).toBeLessThanOrEqual(212);
        expect(Number(root![2])).toBeGreaterThanOrEqual(127);
        expect(Number(root![2])).toBeLessThanOrEqual(171);
      }
    },
  );

  it("marks the slit as a constructed opening with a material cutout", () => {
    const result = resolveGarmentRecipe(dress({ details: ["slit"] }));

    expect(result.markup).toContain('data-renderer="constructed-slit"');
    expect(result.markup).toContain('data-detail="slit"');
  });
});
