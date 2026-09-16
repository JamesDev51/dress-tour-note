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

  it("registers a waist bow knot on the selected waist seam", () => {
    const result = resolveGarmentRecipe(dress({ details: ["waistBow"] }));

    expect(result.markup).toContain('data-anchor="waist-knot"');
    expect(result.markup).toContain('data-anchor-y="170.2"');
    expect(result.markup).toContain("translate(130.4 140.28)");
  });

  it("marks the slit as a constructed opening with a material cutout", () => {
    const result = resolveGarmentRecipe(dress({ details: ["slit"] }));

    expect(result.markup).toContain('data-renderer="constructed-slit"');
    expect(result.markup).toContain('data-detail="slit"');
  });
});
