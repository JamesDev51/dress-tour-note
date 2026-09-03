import { describe, expect, it } from "vitest";
import { dressForPresentation } from "../../lib/dress/options";
import type { Dress } from "../../types/domain";
import type { DressLayerAssets } from "../image/dressLayers";
import { dressSvgMarkup } from "./dressSvg";

const dress: Dress = {
  id: "dress-svg",
  tourId: "tour-svg",
  shopId: "shop-svg",
  order: 0,
  label: "Dress SVG",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "mermaid",
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

const assets: DressLayerAssets = {
  structure: "data:image/webp;base64,structure",
  shadow: "data:image/webp;base64,shadow",
  highlight: "data:image/webp;base64,highlight",
  mermaidVolume: "data:image/webp;base64,mermaid-volume",
};
const personDataUrl = "data:image/webp;base64,illustrated-person";

describe("dress raster layer composition", () => {
  it("composes raster garment parts over the mannequin without a white body mask", () => {
    const svg = dressSvgMarkup(dress, personDataUrl, assets, undefined, false);

    expect(svg).toContain('data-layer="raster-mannequin"');
    expect(svg).toContain('data-renderer="complete-structure"');
    expect(svg).toContain('data-layer="raster-dress-structure"');
    expect(svg).toContain('data-layer="raster-volume-shadow"');
    expect(svg).not.toContain('data-layer="hip-mask"');
    expect(svg).not.toContain("<path data-silhouette");
  });

  it("uses one prebuilt structure asset for the complete dress combination", () => {
    const svg = dressSvgMarkup(dress, personDataUrl, assets, undefined, false);

    expect(svg).toContain('data-layer="raster-dress-structure"');
    expect(svg).toContain('mask="url(#structure-mask-dress-svg)"');
    expect(svg).not.toContain('mask="url(#bodice-mask-dress-svg)"');
    expect(svg).not.toContain('mask="url(#skirt-mask-dress-svg)"');
  });

  it("keeps the optional face inside its feathered mask", () => {
    const faceDataUrl = "data:image/webp;base64,face";
    const svg = dressSvgMarkup(dress, personDataUrl, assets, faceDataUrl, true);

    expect(svg).toContain(`href="${faceDataUrl}"`);
    expect(svg).toContain('mask="url(#face-mask-dress-svg)"');
    expect(svg).not.toContain('stroke="#eadfda"');
  });

  it("uses the selected texture at its fabric-specific tile scale", () => {
    const texture = "data:image/webp;base64,lace-texture";
    const svg = dressSvgMarkup(
      dress,
      personDataUrl,
      assets,
      undefined,
      false,
      texture,
    );

    expect(svg).toContain(`href="${texture}"`);
    expect(svg).toContain('width="96" height="96"');
    expect(svg).toContain('fill="url(#p-dress-svg)"');
    expect(svg).toContain('style="mix-blend-mode:multiply"');
  });

  it("uses the complete structure without separate photographic overlays", () => {
    const svg = dressSvgMarkup(
      { ...dress, topStyle: "shortSleeve" },
      personDataUrl,
      assets,
      undefined,
      false,
    );

    expect(svg).toContain("data:image/webp;base64,structure");
    expect(svg).not.toContain("raster-silhouette-appearance");
    expect(svg).not.toContain("raster-top-appearance");
  });

  it("adds a distinct dense accent for ornate beadwork", () => {
    const svg = dressSvgMarkup(
      { ...dress, fabric: "ornateBeaded" },
      personDataUrl,
      assets,
      undefined,
      false,
      "data:image/webp;base64,beads",
    );

    expect(svg).toContain('data-layer="fabric-accent"');
    expect(svg).toContain('width="46" height="46"');
    expect(svg).toContain('opacity="0.38"');
  });

  it("keeps subtle beadwork sparser than ornate beadwork", () => {
    const svg = dressSvgMarkup(
      { ...dress, fabric: "subtleBeaded" },
      personDataUrl,
      assets,
      undefined,
      false,
      "data:image/webp;base64,subtle-beads",
    );

    expect(svg).toContain('width="110" height="110"');
    expect(svg).toContain('opacity="0.56"');
  });

  it("adds the raster mermaid volume layer for the fitted silhouette", () => {
    const svg = dressSvgMarkup(dress, personDataUrl, assets, undefined, false);
    expect(svg).toContain('data-layer="raster-mermaid-volume"');
  });

  it("adds the raster under-bust seam for the empire silhouette", () => {
    const svg = dressSvgMarkup(
      { ...dress, silhouette: "empire" },
      personDataUrl,
      {
        ...assets,
        mermaidVolume: undefined,
        empireVolume: "data:image/webp;base64,empire-volume",
      },
      undefined,
      false,
    );

    expect(svg).toContain('data-layer="raster-empire-volume"');
  });

  it("includes sleeves inside the selected complete structure", () => {
    const svg = dressSvgMarkup(
      { ...dress, topStyle: "longSleeve" },
      personDataUrl,
      assets,
      undefined,
      false,
    );

    expect(svg).toContain('data-layer="raster-dress-structure"');
    expect(svg).not.toContain('data-layer="raster-top"');
  });

  it("does not emit retired geometric garment effects", () => {
    const svg = dressSvgMarkup(dress, personDataUrl, assets, undefined, false);
    expect(svg).not.toContain('data-layer="bust-shaping"');
    expect(svg).not.toContain('data-layer="hip-shaping"');
    expect(svg).not.toContain('data-layer="halter-collar"');
  });

  it("does not emit a separate top layer for strapless dresses", () => {
    const svg = dressSvgMarkup(dress, personDataUrl, assets, undefined, false);
    expect(svg).not.toContain('data-layer="raster-top"');
  });

  it("projects legacy choices before raster layer composition", () => {
    const legacyDress: Dress = {
      ...dress,
      topStyle: "spaghetti",
      neckline: "high",
      silhouette: "fitAndFlare",
      fabric: "glitterBeaded",
    };
    expect(
      dressSvgMarkup(legacyDress, personDataUrl, assets, undefined, false),
    ).toBe(
      dressSvgMarkup(
        dressForPresentation(legacyDress),
        personDataUrl,
        assets,
        undefined,
        false,
      ),
    );
  });
});
