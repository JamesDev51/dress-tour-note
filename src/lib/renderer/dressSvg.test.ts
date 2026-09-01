import { describe, expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import { dressSvgMarkup } from "./dressSvg";

const dress: Dress = {
  id: "dress-svg",
  tourId: "tour-svg",
  shopId: "shop-svg",
  order: 0,
  label: "Dress SVG",
  topStyle: "strap",
  neckline: "sweetheart",
  silhouette: "empire",
  waistline: "unknown",
  fabric: "lace",
  color: "ivory",
  train: "unknown",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("dress SVG person composition", () => {
  it("inlines the raster person base and removes the geometric body", () => {
    const personDataUrl = "data:image/webp;base64,person-base";
    const svg = dressSvgMarkup(dress, personDataUrl, undefined, false);

    expect(svg).toContain(`href="${personDataUrl}"`);
    expect(svg).not.toContain('cy="70" r="42"');
    expect(svg).not.toContain("M151 116Q180 137 209 116");
  });

  it("keeps the optional face clipped above the same raster base", () => {
    const personDataUrl = "data:image/webp;base64,person-base";
    const faceDataUrl = "data:image/webp;base64,face";
    const svg = dressSvgMarkup(dress, personDataUrl, faceDataUrl, true);

    expect(svg).toContain(`href="${personDataUrl}"`);
    expect(svg).toContain(`href="${faceDataUrl}"`);
    expect(svg).toContain('clip-path="url(#face-dress-svg)"');
  });
});
