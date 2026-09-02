import { describe, expect, it } from "vitest";
import { dressForPresentation } from "../../lib/dress/options";
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

describe("dress SVG fashion illustration", () => {
  const personDataUrl = "data:image/webp;base64,illustrated-person";

  it("composes the dress over the raster illustration base", () => {
    const svg = dressSvgMarkup(dress, personDataUrl, undefined, false);

    expect(svg).toContain("드레스 패션 일러스트");
    expect(svg).toContain('data-layer="raster-mannequin"');
    expect(svg).toContain('data-layer="hip-mask"');
    expect(svg).toContain(
      'data-layer="dress-fit" transform="translate(0 -18)"',
    );
    expect(svg).toContain('data-layer="bust-shaping"');
    expect(svg).toContain("L150 258 C146 242");
    expect(svg).not.toContain('data-layer="head-mask"');
    expect(svg).toContain(`href="${personDataUrl}"`);
    expect(svg).toContain('fill="url(#g-dress-svg)"');
    expect(svg).not.toContain('data-layer="articulated-mannequin"');
  });

  it("keeps the optional face inside a portrait medallion", () => {
    const faceDataUrl = "data:image/webp;base64,face";
    const svg = dressSvgMarkup(dress, personDataUrl, faceDataUrl, true);

    expect(svg).toContain(`href="${faceDataUrl}"`);
    expect(svg).toContain('mask="url(#face-mask-dress-svg)"');
    expect(svg).not.toContain('data-layer="head-mask"');
    expect(svg).not.toContain('stroke="#eadfda"');
  });

  it("clips the selected fabric artwork across the dress and sleeves", () => {
    const fabricDataUrl = "data:image/webp;base64,lace-texture";
    const svg = dressSvgMarkup(
      { ...dress, topStyle: "longSleeve" },
      personDataUrl,
      undefined,
      false,
      fabricDataUrl,
    );

    expect(svg).toContain(`href="${fabricDataUrl}"`);
    expect(svg).toContain('width="108" height="108"');
    expect(svg).toContain('data-layer="fabric-texture"');
    expect(svg).toContain('fill="url(#p-dress-svg)"');
  });

  it("adds visible bead highlights for ornate beadwork", () => {
    const svg = dressSvgMarkup(
      { ...dress, fabric: "ornateBeaded" },
      personDataUrl,
      undefined,
      false,
      "data:image/webp;base64,beads",
    );

    expect(svg).toContain('data-layer="fabric-accent"');
    expect(svg).toContain('id="b-dress-svg"');
  });

  it("keeps subtle bead highlights sparse", () => {
    const svg = dressSvgMarkup(
      { ...dress, fabric: "subtleBeaded" },
      personDataUrl,
      undefined,
      false,
      "data:image/webp;base64,subtle-beads",
    );

    expect(svg).toContain('width="44" height="44"');
    expect(svg).toContain('data-layer="fabric-accent" opacity=".52"');
  });

  it("models a mermaid dress through hips, thighs, knees, and flare", () => {
    const svg = dressSvgMarkup(
      { ...dress, silhouette: "mermaid" },
      personDataUrl,
      undefined,
      false,
    );

    expect(svg).toContain('data-silhouette="mermaid"');
    expect(svg).toContain('data-layer="hip-shaping"');
    expect(svg).toContain('data-flare="fishtail"');
  });

  it("does not render retired train, waistline, or detail effects", () => {
    const legacyDress: Dress = {
      ...dress,
      topStyle: "spaghetti",
      neckline: "high",
      silhouette: "fitAndFlare",
      waistline: "basque",
      backStyle: "bowBack",
      fabric: "glitterBeaded",
      train: "chapel",
      details: ["waistBow", "buttons"],
    };
    const svg = dressSvgMarkup(legacyDress, personDataUrl, undefined, false);

    expect(svg).not.toContain("M180 470 C240 500");
    expect(svg).not.toContain("M148 252L180 274");
    expect(svg).not.toContain("M0 0C-18-18");
    expect(svg).not.toContain('<circle cx="180" cy="205"');
  });

  it("lets long sleeves cover the mannequin through the hands", () => {
    const svg = dressSvgMarkup(
      { ...dress, topStyle: "longSleeve" },
      personDataUrl,
      undefined,
      false,
    );

    expect(svg).toContain("M151 170 Q124 164 109 190");
    expect(svg).toContain("L70 349 Q78 363 94 356");
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain("M72 343 Q81 357 93 350");
  });

  it("projects legacy choices before renderer switches run", () => {
    const legacyDress: Dress = {
      ...dress,
      topStyle: "spaghetti",
      neckline: "high",
      silhouette: "fitAndFlare",
      fabric: "glitterBeaded",
    };
    expect(dressSvgMarkup(legacyDress, personDataUrl, undefined, false)).toBe(
      dressSvgMarkup(
        dressForPresentation(legacyDress),
        personDataUrl,
        undefined,
        false,
      ),
    );
  });
});
