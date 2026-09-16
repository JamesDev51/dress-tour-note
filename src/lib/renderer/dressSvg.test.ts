import { describe, expect, it, vi } from "vitest";
import { FABRICS, SILHOUETTES, type Dress } from "../../types/domain";
import { fabricOptions, optionLabel } from "../dress/options";
import { resolveGarmentRecipe } from "./garment";
import { dressSvgMarkup, dressSvgToJpeg } from "./dressSvg";

const dress: Dress = {
  id: "dress-svg",
  tourId: "tour-svg",
  shopId: "shop-svg",
  order: 0,
  label: "Dress SVG",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "mermaid",
  waistline: "natural",
  backStyle: "buttonBack",
  fabric: "lace",
  color: "ivory",
  train: "chapel",
  details: ["buttons"],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("dress memory sketch", () => {
  it("places a prepared garment fragment in the existing visual frame", () => {
    const supported = {
      ...dress,
      topStyle: "longSleeve" as const,
      neckline: "high" as const,
      silhouette: "aLine" as const,
      fabric: "mikadoSatin" as const,
      train: "none" as const,
      details: [],
    };
    const artwork = resolveGarmentRecipe(supported, "full", "bridge-test");
    const svg = dressSvgMarkup(supported, undefined, false, "full", "visual", {
      preparedArtwork: artwork,
    });

    expect(artwork.status).toBe("ready");
    expect(svg).toContain('data-garment-state="ready"');
    expect(svg).toContain('data-layer="prepared-garment"');
    expect(svg).toContain('transform="translate(65.5 -5.845) scale(.7)"');
    expect(svg).toContain("garment-bridge-test-");
    expect(svg).not.toContain('data-layer="mannequin-body"');
    expect(svg).not.toContain('data-layer="arms"');
    expect(svg).not.toContain('data-layer="head"');
    expect(svg).not.toContain("<text");
  });

  it("centers prepared full artwork and its placeholder in the visual frame", () => {
    const supported = {
      ...dress,
      topStyle: "longSleeve" as const,
      neckline: "high" as const,
      silhouette: "aLine" as const,
      fabric: "mikadoSatin" as const,
      train: "none" as const,
      details: [],
    };
    const artwork = resolveGarmentRecipe(supported, "full", "center-test");
    const visual = dressSvgMarkup(
      supported,
      undefined,
      false,
      "full",
      "visual",
      { preparedArtwork: artwork },
    );
    const placeholderDress = {
      ...supported,
      topStyle: "unknown" as const,
      neckline: "unknown" as const,
      color: "unknown" as const,
    };
    const placeholderArtwork = resolveGarmentRecipe(
      placeholderDress,
      "full",
      "center-placeholder-test",
    );
    const visualPlaceholder = dressSvgMarkup(
      placeholderDress,
      undefined,
      false,
      "full",
      "visual",
      { preparedArtwork: placeholderArtwork },
    );
    const visualWithFace = dressSvgMarkup(
      supported,
      "data:image/webp;base64:center-face",
      true,
      "full",
      "visual",
      { preparedArtwork: artwork },
    );
    const visualPlaceholderWithFace = dressSvgMarkup(
      placeholderDress,
      "data:image/webp;base64:center-placeholder-face",
      true,
      "full",
      "visual",
      { preparedArtwork: placeholderArtwork },
    );
    const backArtwork = resolveGarmentRecipe(
      supported,
      "back",
      "back-center-test",
    );
    const visualBack = dressSvgMarkup(
      supported,
      undefined,
      false,
      "back",
      "visual",
      { preparedArtwork: backArtwork },
    );
    const backPlaceholderDress = {
      ...supported,
      backStyle: "unknown" as const,
      color: "unknown" as const,
    };
    const backPlaceholderArtwork = resolveGarmentRecipe(
      backPlaceholderDress,
      "back",
      "back-placeholder-center-test",
    );
    const visualBackPlaceholder = dressSvgMarkup(
      backPlaceholderDress,
      undefined,
      false,
      "back",
      "visual",
      { preparedArtwork: backPlaceholderArtwork },
    );

    expect(visual).toContain('transform="translate(65.5 -5.845) scale(.7)"');
    expect(visualPlaceholder).toContain(
      'transform="translate(37.6 -4.1) scale(.68)"',
    );
    expect(visualWithFace).toContain(
      '<ellipse cx="135" cy="116" rx="28" ry="32"',
    );
    expect(visualWithFace).toContain(
      'transform="translate(65.5 -5.6) scale(.7)"',
    );
    expect(visualPlaceholderWithFace).toContain(
      'transform="translate(37.6 -4.1) scale(.68)"',
    );
    expect(visualPlaceholderWithFace).toContain(
      '<ellipse cx="180" cy="116" rx="28" ry="32"',
    );
    expect(visualBack).toContain('transform="translate(52 -37.98) scale(.8)"');
    expect(visualBackPlaceholder).toContain(
      'transform="translate(39.9026 -.0065) scale(.6672)"',
    );
    expect(visual).not.toContain('transform="translate(36 -58) scale(.7)"');
    expect(visualPlaceholder).not.toContain(
      'transform="translate(65.5 -58) scale(.7)"',
    );
  });

  it("balances full-frame vertical bounds for long, short, and native gowns", () => {
    const render = (overrides: Partial<Dress>, namespace: string) => {
      const value = { ...dress, ...overrides };
      const artwork = resolveGarmentRecipe(value, "full", namespace);
      return dressSvgMarkup(value, undefined, false, "full", "visual", {
        preparedArtwork: artwork,
      });
    };
    const figureTransform = (svg: string) =>
      svg.match(/data-layer="figure" transform="([^"]+)"/)?.[1];
    const renderBack = (overrides: Partial<Dress>, namespace: string) => {
      const value = { ...dress, ...overrides };
      const artwork = resolveGarmentRecipe(value, "back", namespace);
      return dressSvgMarkup(value, undefined, false, "back", "visual", {
        preparedArtwork: artwork,
      });
    };

    expect(
      figureTransform(
        render(
          {
            silhouette: "aLine",
            fabric: "lace",
            train: "chapel",
          },
          "vertical-chapel",
        ),
      ),
    ).toBe("translate(65.5 -31.92) scale(.7)");
    expect(
      figureTransform(
        render(
          {
            topStyle: "longSleeve",
            neckline: "high",
            silhouette: "aLine",
            fabric: "mikadoSatin",
            train: "none",
          },
          "vertical-native",
        ),
      ),
    ).toBe("translate(65.5 -5.845) scale(.7)");
    expect(
      figureTransform(
        render(
          {
            silhouette: "teaLength",
            fabric: "mikadoSatin",
            train: "none",
          },
          "vertical-tea",
        ),
      ),
    ).toBe("translate(65.5 30.065) scale(.7)");
    expect(
      figureTransform(
        render(
          {
            topStyle: "offShoulder",
            neckline: "sweetheart",
            silhouette: "aLine",
            fabric: "mikadoSatin",
            train: "none",
          },
          "vertical-off-shoulder",
        ),
      ),
    ).toBe("translate(65.5 -13.895) scale(.7)");
    expect(
      figureTransform(
        render(
          {
            silhouette: "aLine",
            fabric: "lace",
            train: "cathedral",
          },
          "vertical-cathedral",
        ),
      ),
    ).toBe("translate(65.5 -43.12) scale(.7)");
    expect(
      figureTransform(
        renderBack(
          {
            silhouette: "aLine",
            fabric: "lace",
            train: "chapel",
          },
          "vertical-back-chapel",
        ),
      ),
    ).toBe("translate(55.6068 -49.6869) scale(.7733)");
  });

  it("preserves the core's tightened upper viewport instead of scaling a torso into the full frame", () => {
    const supported = {
      ...dress,
      topStyle: "longSleeve" as const,
      neckline: "high" as const,
      silhouette: "aLine" as const,
      fabric: "mikadoSatin" as const,
      train: "none" as const,
      details: [],
    };
    const artwork = resolveGarmentRecipe(supported, "upper", "upper-viewport");
    const svg = dressSvgMarkup(supported, undefined, false, "upper", "visual", {
      preparedArtwork: artwork,
    });

    expect(artwork.viewBox).toEqual({ x: 100, y: 66, width: 160, height: 154 });
    expect(svg).toContain(
      'data-layer="prepared-viewport" data-viewbox="100 66 160 154"',
    );
    expect(svg).toContain(
      'data-layer="prepared-garment" data-view="upper" data-state="ready"',
    );
    expect(svg).toContain('viewBox="100 66 160 154"');
    expect(svg).toContain('transform="translate(0 0)"');
    expect(svg).not.toContain('transform="translate(-42 -130) scale(1.5)"');
    expect(svg).not.toContain('data-layer="head"');
    expect(svg).not.toContain('data-layer="mannequin-body"');
    expect(svg).not.toContain('data-layer="arms"');
  });

  it("keeps a partial prepared fragment honest without adding a generic body", () => {
    const partial = {
      ...dress,
      customOptions: { neckline: "낮은 하트" },
    };
    const artwork = resolveGarmentRecipe(partial, "full", "partial-test");
    const svg = dressSvgMarkup(partial, undefined, false, "full", "visual", {
      preparedArtwork: artwork,
    });

    expect(artwork.status).toBe("partial");
    expect(svg).toContain('data-garment-state="partial"');
    expect(svg).toContain('data-layer="prepared-garment"');
    expect(svg).not.toContain('data-layer="mannequin-body"');
    expect(svg).not.toContain('data-layer="arms"');
  });

  it("shows an explicit unresolved placeholder when prepared artwork has no asset", () => {
    const unresolved = resolveGarmentRecipe(
      {
        ...dress,
        topStyle: "unknown",
        neckline: "unknown",
        silhouette: "unknown",
        color: "unknown",
      },
      "full",
      "unresolved-test",
    );
    const svg = dressSvgMarkup(
      {
        ...dress,
        topStyle: "unknown",
        neckline: "unknown",
        silhouette: "unknown",
        color: "unknown",
      },
      undefined,
      false,
      "full",
      "visual",
      { preparedArtwork: unresolved },
    );

    expect(unresolved.assetIds).toHaveLength(0);
    expect(svg).toContain('data-garment-state="partial"');
    expect(svg).toContain('data-layer="prepared-placeholder"');
    expect(svg).not.toContain('data-layer="garment"');
    expect(svg).not.toContain('data-layer="mannequin-body"');
    expect(svg).not.toContain('data-layer="head"');
    expect(svg).not.toContain('data-layer="arms"');
  });

  it("keeps the explicit face layer separate from prepared artwork and excludes it on back", () => {
    const supported = {
      ...dress,
      topStyle: "longSleeve" as const,
      neckline: "high" as const,
      silhouette: "aLine" as const,
      fabric: "mikadoSatin" as const,
      train: "none" as const,
      details: [],
    };
    const face = "data:image/webp;base64,bridge-face";
    const upperArtwork = resolveGarmentRecipe(supported, "upper", "face-test");
    const upper = dressSvgMarkup(supported, face, true, "upper", "visual", {
      preparedArtwork: upperArtwork,
    });
    const backArtwork = resolveGarmentRecipe(supported, "back", "back-test");
    const back = dressSvgMarkup(supported, face, true, "back", "visual", {
      preparedArtwork: backArtwork,
    });

    expect(upper.indexOf('data-layer="prepared-garment"')).toBeLessThan(
      upper.indexOf('data-layer="face"'),
    );
    expect(upper).toContain(face);
    expect(upper).not.toContain('data-layer="head"');
    expect(back).not.toContain(face);
    expect(back).not.toContain('data-layer="face"');
  });

  it("renders every unknown field as neutral and explicitly unrecorded", () => {
    const unknownDress: Dress = {
      ...dress,
      topStyle: "unknown",
      neckline: "unknown",
      silhouette: "unknown",
      waistline: "unknown",
      backStyle: "unknown",
      fabric: "unknown",
      color: "unknown",
      train: "unknown",
      details: [],
    };

    const svg = dressSvgMarkup(unknownDress);

    expect(svg).toContain('data-renderer="memory-sketch"');
    expect(svg).toContain('data-state="unknown"');
    expect(svg).toContain("미기록");
    expect(svg).not.toContain('data-shape="strapless"');
    expect(svg).not.toContain('data-shape="straight"');
  });

  it.each([
    ["full", ["상의", "네크라인", "실루엣", "허리선", "트레인", "색상"], true],
    ["upper", ["상의", "네크라인", "허리선", "색상"], false],
    ["back", ["등 디자인", "실루엣", "트레인", "색상"], true],
  ] as const)(
    "renders the requested %s view and only its field set",
    (view, expectedFields, showsAnnotations) => {
      const svg = dressSvgMarkup(dress, undefined, false, view);

      expect(svg).toContain(`data-view="${view}"`);
      expect(
        [...svg.matchAll(/data-field="([^"]+)"/g)].map((match) => match[1]),
      ).toEqual(expectedFields);
      expect(svg.includes('data-layer="fabric-swatch"')).toBe(showsAnnotations);
      expect(svg.includes('data-layer="detail-badge"')).toBe(showsAnnotations);
    },
  );

  it("always excludes face bytes and transforms from the back view", () => {
    const svg = dressSvgMarkup(
      {
        ...dress,
        faceTransform: { x: 0.5, y: -0.25, scale: 1.2, rotation: 8 },
      },
      "data:image/webp;base64,private-face",
      true,
      "back",
    );

    expect(svg).not.toContain("private-face");
    expect(svg).not.toContain('data-layer="face"');
    expect(svg).not.toContain("face-transform");
  });

  it("keeps back garment closure independent from front top and neckline", () => {
    const backBase = {
      ...dress,
      silhouette: "aLine" as const,
      backStyle: "bowBack" as const,
      topStyle: "strapless" as const,
      neckline: "sweetheart" as const,
    };
    const extractBody = (value: Dress) =>
      dressSvgMarkup(value, undefined, false, "back", "visual").match(
        /data-layer="garment-base"[^>]*d="([^"]+)"/,
      )?.[1];

    const frontVariant = {
      ...backBase,
      topStyle: "longSleeve" as const,
      neckline: "v" as const,
    };
    expect(extractBody(backBase)).toBe(extractBody(frontVariant));
    expect(
      extractBody({ ...backBase, backStyle: "openBack" as const }),
    ).not.toBe(extractBody(backBase));
    const { backStyle: removedBackStyle, ...missingBackStyle } = backBase;
    void removedBackStyle;
    expect(extractBody(missingBackStyle)).toBe(
      extractBody({
        ...missingBackStyle,
        topStyle: "longSleeve",
        neckline: "v",
      }),
    );
  });

  it("keeps unknown top and neckline edges explicitly neutral", () => {
    const bodyOf = (value: Dress) =>
      dressSvgMarkup(value, undefined, false, "upper", "visual").match(
        /data-layer="garment-base"[^>]*d="([^"]+)"/,
      )?.[1];
    const unknownTop = bodyOf({ ...dress, topStyle: "unknown" });
    const knownHigh = bodyOf({
      ...dress,
      topStyle: "longSleeve",
      neckline: "high",
    });
    const unknownNeckline = bodyOf({
      ...dress,
      topStyle: "strapless",
      neckline: "unknown",
    });
    const knownStraight = bodyOf({
      ...dress,
      topStyle: "strapless",
      neckline: "straight",
    });

    expect(unknownTop).not.toBe(knownHigh);
    expect(unknownNeckline).not.toBe(knownStraight);
    expect(
      dressSvgMarkup({ ...dress, topStyle: "unknown", neckline: "sweetheart" }),
    ).toContain('data-layer="neckline-detail" data-shape="sweetheart"');
    expect(
      dressSvgMarkup({ ...dress, topStyle: "strapless", neckline: "unknown" }),
    ).toContain('data-layer="neckline-unknown"');
  });

  it("uses a dashed neutral contour for unknown silhouettes", () => {
    const svg = dressSvgMarkup(
      {
        ...dress,
        topStyle: "unknown",
        neckline: "unknown",
        silhouette: "unknown",
        waistline: "unknown",
        backStyle: "unknown",
        fabric: "unknown",
        color: "unknown",
        train: "unknown",
        details: [],
      },
      undefined,
      false,
      "full",
      "visual",
    );

    expect(svg).toContain('data-state="unknown"');
    const contour = svg.match(/<path data-layer="garment-contour"[^>]*>/)?.[0];
    if (!contour) throw new Error("unknown silhouette contour is missing");
    expect(contour).toContain('stroke-dasharray="6 5"');
  });

  it("shows fabric as a separate swatch without a tiled garment pattern", () => {
    const svg = dressSvgMarkup(dress);

    expect(svg).toContain('data-layer="fabric-swatch"');
    expect(svg).toContain("레이스");
    expect(svg).not.toContain("<pattern");
    expect(svg).not.toContain("patternUnits");
    expect(svg).not.toContain("mix-blend-mode");
  });

  it("labels unsupported notes with their dress category", () => {
    const svg = dressSvgMarkup({
      ...dress,
      customOptions: {
        neckline: "목선을 따라 작은 꽃잎이 이어짐",
        fabric: "빛에 따라 잔잔하게 반짝임",
      },
    });

    expect(svg).toContain("네크라인 · 비슷하지만 달라요");
    expect(svg).toContain("소재 · 비슷하지만 달라요");
  });

  it("renders a face only when explicitly enabled on an eligible view", () => {
    const face = "data:image/webp;base64,explicit-face";

    expect(dressSvgMarkup(dress, face)).not.toContain(face);
    const upper = dressSvgMarkup(dress, face, true, "upper");
    expect(upper).toContain(face);
    expect(upper).toContain('data-layer="head" cx="135" cy="116" r="31"');
    expect(upper).toContain('<ellipse cx="135" cy="116" rx="28" ry="32"');
  });

  it.each(["full", "upper", "back"] as const)(
    "renders a readable visual-only %s sketch without SVG copy",
    (view) => {
      const svg = dressSvgMarkup(
        { ...dress, train: "cathedral" },
        undefined,
        false,
        view,
        "visual",
      );

      expect(svg).toContain(`data-view="${view}"`);
      expect(svg).toContain('data-mode="visual"');
      expect(svg).toContain('data-layer="garment"');
      expect(svg).toContain('data-layer="mannequin"');
      expect(svg).toContain('data-layer="neck"');
      expect(svg).not.toContain("<text");
      expect(svg).not.toContain("data-field");
      expect(svg).not.toContain('data-layer="fabric-swatch"');
      if (view !== "upper") {
        expect(svg).toContain('data-shape="cathedral"');
        expect(svg).not.toContain("translate(22 -72)");
      }
    },
  );

  it("renders shared dimensional garment layers with a clipped volume mask", () => {
    const svg = dressSvgMarkup(dress, undefined, false, "full", "visual");

    expect(svg).toContain('data-layer="garment-base"');
    expect(svg).toContain('data-layer="volume-shadow"');
    expect(svg).toContain('data-layer="volume-highlight"');
    expect(svg).toContain('data-layer="garment-fold"');
    expect(svg).toContain('data-layer="train"');
    expect(svg).toMatch(/clip-path="url\(#garment-mask-[a-z0-9]+\)"/);
    expect(svg).toMatch(/fill="url\(#garment-gradient-[a-z0-9]+\)"/);
  });

  it("uses the cloth-first A-line contour and current visual coordinate contract", () => {
    const svg = dressSvgMarkup(
      {
        ...dress,
        silhouette: "aLine",
        topStyle: "strapless",
        neckline: "sweetheart",
      },
      undefined,
      false,
      "full",
      "visual",
    );
    const body = svg.match(/data-layer="garment-base"[^>]*d="([^"]+)"/)?.[1];
    if (!body) throw new Error("A-line body contour is missing");

    expect(svg).toContain('viewBox="0 0 320 427"');
    expect(svg).toContain('transform="translate(22 -58) scale(.8)"');
    expect(body).toContain("M94 210");
    expect(body).toContain("222 558");
    expect(body).toContain("Q135 580 222 558");
    expect(svg).toContain('data-layer="asymmetric-drape"');
  });

  it("attaches train fabric across the profile hem with ordered reach", () => {
    const lengths = (["sweep", "chapel", "cathedral"] as const).map((train) => {
      const svg = dressSvgMarkup(
        { ...dress, silhouette: "mermaid", train },
        undefined,
        false,
        "full",
        "visual",
      );
      const match = svg.match(
        /<path data-layer="train"[^>]*data-attachment="hem"[^>]*data-reach="(\d+)"[^>]*d="([^"]+)"/,
      );
      if (!match) throw new Error(`train panel is missing for ${train}`);
      const [, reach, outline] = match;
      const maskId = svg.match(/id="(train-mask-[a-z0-9]+)"/)?.[1];
      if (!maskId) throw new Error(`train mask is missing for ${train}`);
      expect(outline).toContain("Z");
      expect(svg).toContain(
        `data-layer="train-fold" clip-path="url(#${maskId})"`,
      );
      expect(svg).toContain(`<clipPath id="${maskId}"><path d="${outline}"`);
      return Number(reach);
    });

    expect(lengths[0]).toBeLessThan(lengths[1]);
    expect(lengths[1]).toBeLessThan(lengths[2]);
  });

  it.each(["aLine", "mermaid", "empire"] as const)(
    "marks %s as an authored profile with local volume geometry",
    (silhouette) => {
      const svg = dressSvgMarkup(
        { ...dress, silhouette },
        undefined,
        false,
        "full",
        "visual",
      );

      expect(svg).toContain(`data-profile="${silhouette}"`);
      expect(svg).toContain('data-layer="profile-volume"');
      expect(svg).toContain('data-layer="profile-fold"');
      expect(svg).toContain('data-layer="bodice-structure"');
    },
  );

  it("keeps neckline hierarchy singular and attaches sleeve construction to the profile", () => {
    const strapless = dressSvgMarkup(
      { ...dress, topStyle: "strapless" },
      undefined,
      false,
      "upper",
      "visual",
    );
    const longSleeve = dressSvgMarkup(
      { ...dress, topStyle: "longSleeve", neckline: "v" },
      undefined,
      false,
      "upper",
      "visual",
    );

    expect(strapless).not.toContain('data-layer="top-detail"');
    expect(strapless).toContain('data-layer="neckline-detail"');
    expect(longSleeve).toContain('data-layer="sleeve-construction"');
    expect(longSleeve).toContain('data-layer="sleeve-underlay-mask"');
  });

  it("uses continuous sleeve bands and arm-length construction", () => {
    const offShoulder = dressSvgMarkup(
      { ...dress, topStyle: "offShoulder", neckline: "asymmetric" },
      undefined,
      false,
      "upper",
      "visual",
    );
    const longSleeve = dressSvgMarkup(
      { ...dress, topStyle: "longSleeve", neckline: "high" },
      undefined,
      false,
      "upper",
      "visual",
    );

    expect(offShoulder).toContain('data-construction="shoulder-band"');
    expect(offShoulder).toContain('data-attachment="upper-arm"');
    expect(longSleeve).toContain('data-construction="arm-length"');
    expect(longSleeve).toContain('data-attachment="wrist"');
  });

  it("keeps the off-shoulder band single and long sleeve cuffs straight", () => {
    const offShoulder = dressSvgMarkup(
      { ...dress, topStyle: "offShoulder", neckline: "asymmetric" },
      undefined,
      false,
      "upper",
      "visual",
    );
    const longSleeve = dressSvgMarkup(
      { ...dress, topStyle: "longSleeve", neckline: "high" },
      undefined,
      false,
      "upper",
      "visual",
    );
    const offPath = offShoulder.match(
      /data-layer="sleeve-construction"[^>]*><path d="([^"]+)"/,
    )?.[1];
    const longPath = longSleeve.match(
      /data-layer="sleeve-construction"[^>]*><path d="([^"]+)"/,
    )?.[1];
    if (!offPath || !longPath) throw new Error("sleeve path is missing");

    expect((offPath.match(/M/g) ?? []).length).toBe(1);
    expect(offPath).toContain("Z");
    expect(longPath).toContain("L103 272");
    expect(longPath).toContain("L167 272");
    expect(longSleeve).toContain('stroke-width="5"');
  });

  it("gives bow backs folded lobes and two anchored tails", () => {
    const svg = dressSvgMarkup(
      { ...dress, backStyle: "bowBack" },
      undefined,
      false,
      "back",
      "visual",
    );

    expect(svg).toContain('data-layer="back-bow-lobes"');
    expect(svg).toContain('data-layer="back-bow-knot"');
    expect(svg.match(/data-layer="back-bow-tail"/g)).toHaveLength(2);
    expect(svg).toContain('data-attachment="back-waist"');
  });

  it("keeps profile panels broad and profile-local", () => {
    const svg = dressSvgMarkup(
      { ...dress, silhouette: "empire" },
      undefined,
      false,
      "full",
      "visual",
    );

    expect(svg).toContain('data-layer="profile-panel"');
    expect(svg).toContain('data-profile="empire"');
    expect(svg).toContain('data-profile-anchors="local"');
  });

  it.each([
    ["ballGown", 3],
    ["empire", 1],
    ["fitAndFlare", 1],
    ["mermaid", 1],
    ["sheath", 0],
    ["teaLength", 1],
  ] as const)(
    "keeps %s profile-local lower-volume accents bounded",
    (silhouette, accentCount) => {
      const svg = dressSvgMarkup(
        { ...dress, silhouette },
        undefined,
        false,
        "full",
        "visual",
      );

      expect(svg).toContain(
        `data-layer="profile-accents" data-profile="${silhouette}"`,
      );
      expect(svg.match(/data-layer="profile-accent"/g) ?? []).toHaveLength(
        accentCount,
      );
      expect(svg).not.toContain(
        'data-layer="profile-accent" data-accent-index="3"',
      );
    },
  );

  it("adds only neutral lower legs and feet to the full tea-length sketch", () => {
    const teaFull = dressSvgMarkup(
      { ...dress, silhouette: "teaLength" },
      undefined,
      false,
      "full",
      "visual",
    );
    const teaUpper = dressSvgMarkup(
      { ...dress, silhouette: "teaLength" },
      undefined,
      false,
      "upper",
      "visual",
    );

    expect(teaFull).toContain('data-layer="lower-legs"');
    expect(teaFull).toContain('data-layer="mannequin-feet"');
    expect(teaUpper).not.toContain('data-layer="lower-legs"');
    expect(teaUpper).not.toContain('data-layer="mannequin-feet"');
  });

  it("preserves recorded empire waistline geometry without changing the profile", () => {
    const values = (["natural", "basque", "drop"] as const).map((waistline) => {
      const svg = dressSvgMarkup(
        { ...dress, silhouette: "empire", waistline },
        undefined,
        false,
        "full",
        "visual",
      );
      const body = svg.match(/data-layer="garment-base"[^>]*d="([^"]+)"/)?.[1];
      const waist = svg.match(/data-layer="waist-detail"[^>]*d="([^"]+)"/)?.[1];
      if (!body || !waist)
        throw new Error(`empire geometry missing for ${waistline}`);
      return { body, waist };
    });

    expect(new Set(values.map(({ body }) => body)).size).toBe(values.length);
    expect(new Set(values.map(({ waist }) => waist)).size).toBe(values.length);
    expect(values.every(({ body }) => body.includes("240"))).toBe(true);
  });

  it("shows only bounded material cues for explicitly selected fabrics", () => {
    const materials = [
      "mikadoSatin",
      "lace",
      "tulle",
      "organzaChiffon",
    ] as const;
    const cues = materials.map((fabric) => {
      const svg = dressSvgMarkup(
        { ...dress, fabric },
        undefined,
        false,
        "full",
        "visual",
      );
      const cue = svg.match(
        new RegExp(
          `<g data-layer="material-cue" data-material="${fabric}"[^>]*>([\\s\\S]*?)</g>`,
        ),
      )?.[0];
      if (!cue) throw new Error(`material cue is missing for ${fabric}`);
      return cue;
    });
    const unknown = dressSvgMarkup(
      { ...dress, fabric: "unknown" },
      undefined,
      false,
      "full",
      "visual",
    );
    const satinId = cues[0].match(/data-material="mikadoSatin"/)?.[0];
    const satinSvg = dressSvgMarkup(
      { ...dress, fabric: "mikadoSatin" },
      undefined,
      false,
      "full",
      "visual",
    );
    const laceSvg = dressSvgMarkup(
      { ...dress, fabric: "lace" },
      undefined,
      false,
      "full",
      "visual",
    );

    expect(new Set(cues).size).toBe(materials.length);
    expect(unknown).not.toContain('data-layer="material-cue"');
    expect(unknown).not.toContain("patternUnits");
    expect(satinId).toBe('data-material="mikadoSatin"');
    expect(satinSvg.match(/id="garment-gradient-([a-z0-9]+)"/)?.[1]).not.toBe(
      laceSvg.match(/id="garment-gradient-([a-z0-9]+)"/)?.[1],
    );
    for (const fabric of [
      "subtleBeaded",
      "ornateBeaded",
      "glitterBeaded",
      "floral3D",
    ] as const) {
      expect(
        dressSvgMarkup(
          { ...dress, fabric },
          undefined,
          false,
          "full",
          "visual",
        ),
      ).toContain(`data-layer="material-cue" data-material="${fabric}"`);
    }
  });

  it("derives deterministic definition IDs that stay distinct by view and dress", () => {
    const full = dressSvgMarkup(dress, undefined, false, "full", "visual");
    const sameFull = dressSvgMarkup(dress, undefined, false, "full", "visual");
    const back = dressSvgMarkup(dress, undefined, false, "back", "visual");
    const otherDress = dressSvgMarkup(
      { ...dress, id: "another-dress" },
      undefined,
      false,
      "full",
      "visual",
    );

    expect(full).toBe(sameFull);
    expect(full.match(/id="garment-gradient-([a-z0-9]+)"/)?.[1]).not.toBe(
      back.match(/id="garment-gradient-([a-z0-9]+)"/)?.[1],
    );
    expect(full.match(/id="garment-gradient-([a-z0-9]+)"/)?.[1]).not.toBe(
      otherDress.match(/id="garment-gradient-([a-z0-9]+)"/)?.[1],
    );
  });

  it("accepts an instance namespace for multiple identical previews", () => {
    const first = dressSvgMarkup(dress, undefined, false, "full", "visual", {
      namespace: "preview-first",
    });
    const second = dressSvgMarkup(dress, undefined, false, "full", "visual", {
      namespace: "preview-second",
    });
    const idFor = (svg: string) =>
      svg.match(/id="(garment-gradient-[a-z0-9]+)"/)?.[1];

    expect(idFor(first)).toBeDefined();
    expect(idFor(first)).not.toBe(idFor(second));
  });

  it("keys the garment mask by waistline when the dress ID is reused", () => {
    const natural = dressSvgMarkup(
      { ...dress, waistline: "natural" },
      undefined,
      false,
      "full",
      "visual",
    );
    const drop = dressSvgMarkup(
      { ...dress, waistline: "drop" },
      undefined,
      false,
      "full",
      "visual",
    );
    const repeatNatural = dressSvgMarkup(
      { ...dress, waistline: "natural" },
      undefined,
      false,
      "full",
      "visual",
    );
    const idFor = (svg: string, prefix: string) => {
      const match = svg.match(new RegExp(`id="(${prefix}-[a-z0-9]+)"`));
      if (!match?.[1]) throw new Error(`${prefix} definition is missing`);
      return match[1];
    };
    const naturalMask = idFor(natural, "garment-mask");
    const dropMask = idFor(drop, "garment-mask");

    expect(natural).toBe(repeatNatural);
    expect(naturalMask).not.toBe(dropMask);
    expect(natural).toContain(`clip-path="url(#${naturalMask})"`);
    expect(drop).toContain(`clip-path="url(#${dropMask})"`);
    expect(natural).toContain(`<clipPath id="${naturalMask}"><path d="`);
    expect(drop).toContain(`<clipPath id="${dropMask}"><path d="`);
  });

  it("keeps unknown marks and excludes private face data in visual back view", () => {
    const svg = dressSvgMarkup(
      {
        ...dress,
        backStyle: "unknown",
        silhouette: "unknown",
        faceTransform: { x: 0.5, y: -0.25, scale: 1.2, rotation: 8 },
      },
      "data:image/webp;base64,private-face",
      true,
      "back",
      "visual",
    );

    expect(svg).toContain('data-state="unknown"');
    expect(svg).not.toContain("private-face");
    expect(svg).not.toContain("<image");
  });

  it.each([
    ["topStyle", "strapless", ["neckline", "silhouette"]],
    ["neckline", "sweetheart", ["topStyle", "silhouette"]],
    ["silhouette", "mermaid", ["topStyle", "neckline"]],
  ] as const)(
    "keeps %s known while the other two core shape fields stay unknown",
    (knownField, knownValue, unknownFields) => {
      const partialDress: Dress = {
        ...dress,
        topStyle: "unknown",
        neckline: "unknown",
        silhouette: "unknown",
        [knownField]: knownValue,
      };

      const svg = dressSvgMarkup(partialDress);

      expect(svg).toContain(`data-shape="${knownValue}"`);
      expect(svg).not.toContain('data-state="unknown" data-renderer');
      for (const field of unknownFields) {
        expect(partialDress[field]).toBe("unknown");
      }
      expect(
        (svg.match(/data-state="unknown"/g) ?? []).length,
      ).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(SILHOUETTES)(
    "presents silhouette %s without inferring another form",
    (silhouette) => {
      const svg = dressSvgMarkup({ ...dress, silhouette });

      if (silhouette === "unknown") {
        expect(svg).toContain('data-field="실루엣" data-state="unknown"');
        expect(svg).not.toContain('data-shape="unknown"');
      } else {
        expect(svg).toContain(`data-shape="${silhouette}"`);
      }
    },
  );

  it.each(FABRICS)(
    "presents material %s as a distinct separate swatch",
    (fabric) => {
      const svg = dressSvgMarkup({ ...dress, fabric });

      expect(svg).toContain('data-layer="fabric-swatch"');
      expect(svg).toContain(`data-material="${fabric}"`);
      expect(svg).toContain(
        fabric === "unknown" ? "미기록" : optionLabel(fabricOptions, fabric),
      );
      expect(svg).not.toContain("<pattern");
    },
  );

  it.each([
    ["spaghetti", "high", "sheath", "tulle"],
    ["oneShoulder", "illusion", "teaLength", "glitterBeaded"],
  ] as const)(
    "presents expanded legacy choices and their category-labelled exception notes",
    (topStyle, neckline, silhouette, fabric) => {
      const svg = dressSvgMarkup({
        ...dress,
        topStyle,
        neckline,
        silhouette,
        fabric,
        customOptions: {
          top: "원래 기록과 조금 다름",
          silhouette: "기억한 볼륨이 더 작음",
        },
      });

      expect(svg).toContain(`data-shape="${topStyle}"`);
      expect(svg).toContain(`data-shape="${neckline}"`);
      expect(svg).toContain(`data-shape="${silhouette}"`);
      expect(svg).toContain(`data-material="${fabric}"`);
      expect(svg).toContain("상의 · 비슷하지만 달라요");
      expect(svg).toContain("실루엣 · 비슷하지만 달라요");
    },
  );

  it("passes the canonical SVG into the JPEG encoder and returns its bytes", async () => {
    let svgBlob: Blob | undefined;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob: Blob) => {
        svgBlob = blob;
        return "blob:memory-sketch";
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({
        fillStyle: "",
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: (callback: BlobCallback) =>
        callback(
          new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
            type: "image/jpeg",
          }),
        ),
    });

    const privateFace = "data:image/webp;base64,private-face";
    const jpeg = await dressSvgToJpeg(
      dress,
      privateFace,
      true,
      600,
      1067,
      "back",
    );

    expect([...jpeg]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
    const capturedSvgBlob = svgBlob;
    if (!capturedSvgBlob)
      throw new Error("SVG blob was not passed to the encoder");
    const svgSource = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error);
      reader.readAsText(capturedSvgBlob);
    });
    expect(svgSource).toBe(dressSvgMarkup(dress, privateFace, true, "back"));
    expect(svgSource).not.toContain(privateFace);
    expect(svgSource).not.toContain('data-layer="face"');

    await dressSvgToJpeg(dress, privateFace, false, 600, 1067, "full");
    const faceExcludedSvgBlob = svgBlob;
    if (!faceExcludedSvgBlob)
      throw new Error("Face-excluded SVG blob was not passed to the encoder");
    const faceExcludedSvg = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error);
      reader.readAsText(faceExcludedSvgBlob);
    });
    expect(faceExcludedSvg).not.toContain(privateFace);
    expect(faceExcludedSvg).not.toContain('data-layer="face"');
  });
});
