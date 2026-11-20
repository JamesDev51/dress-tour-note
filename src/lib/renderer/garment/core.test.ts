import { describe, expect, it, vi } from "vitest";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import {
  FABRICS,
  NECKLINES,
  SILHOUETTES,
  TOP_STYLES,
  type Dress,
} from "../../../types/domain";
import { buildGarmentArtworkMarkup, resolveGarmentRecipe } from "./core";
import { clearGarmentAssetCache, prepareGarmentArtwork } from "./preparation";
import { GARMENT_ASSETS } from "./registry";

function dress(overrides: Partial<Dress> = {}): Dress {
  return {
    id: "dress-1",
    tourId: "tour-1",
    shopId: "shop-1",
    order: 1,
    label: "테스트 드레스",
    topStyle: "longSleeve",
    neckline: "high",
    silhouette: "aLine",
    waistline: "natural",
    backStyle: "unknown",
    fabric: "mikadoSatin",
    color: "ivory",
    train: "none",
    details: [],
    quickTags: [],
    memo: "",
    isFavorite: false,
    createdAt: "2026-09-12T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("garment artwork core", () => {
  it.each(["full", "upper", "back"] as const)(
    "keeps slit references valid in %s",
    (view) => {
      const result = resolveGarmentRecipe(
        dress({ backStyle: "openBack", details: ["slit"], waistline: "drop" }),
        view,
      );
      const document = new DOMParser().parseFromString(
        result.markup,
        "image/svg+xml",
      );
      expect(document.querySelector("parsererror")).toBeNull();
      for (const element of document.querySelectorAll("*"))
        for (const attribute of element.attributes)
          for (const match of attribute.value.matchAll(/url\(#([^)]+)\)/g))
            expect(document.getElementById(match[1]!)).not.toBeNull();
    },
  );
  it("keeps a rear opening in destination coordinates when moving the skirt waist", () => {
    const result = resolveGarmentRecipe(
      dress({
        silhouette: "empire",
        waistline: "drop",
        backStyle: "corsetBack",
      }),
      "back",
    );
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    const frame = document.querySelector('[data-layer="lower-join-frame"]');
    expect(frame?.hasAttribute("mask")).toBe(false);
    expect(frame?.parentElement?.getAttribute("mask")).toContain(
      "corsetBack-mask",
    );
  });

  it("keeps the photographed one-shoulder sleeve out of a remapped A-line skirt", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "oneShoulder",
        neckline: "v",
        silhouette: "aLine",
        fabric: "lace",
        waistline: "drop",
      }),
    );
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    const frame = document.querySelector('[data-layer="lower-join-frame"]');
    const clipId = frame?.getAttribute("clip-path")?.match(/url\(#(.+)\)/)?.[1];
    const clip = document.getElementById(clipId!);
    expect(clip?.getAttribute("data-body-contour")).toBe("measured");
    const lowerTexture = document.querySelector(
      '[data-region="lower-body"][data-layer="material-texture"]',
    );
    const textureClipId = lowerTexture
      ?.getAttribute("clip-path")
      ?.match(/url\(#(.+)\)/)?.[1];
    if (textureClipId)
      expect(
        document
          .getElementById(textureClipId)
          ?.querySelector("path")
          ?.getAttribute("d"),
      ).not.toMatch(/^M0 /);
  });

  it("bounds rear material to the same selected upper coverage as its base image", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "offShoulder",
        backStyle: "openBack",
        fabric: "lace",
        waistline: "drop",
      }),
      "back",
    );
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    const texture = document.querySelector(
      '[data-layer="material-texture"][data-region="upper-body"]',
    );
    const id = texture?.getAttribute("clip-path")?.match(/url\(#(.+)\)/)?.[1];
    const clip = document.getElementById(id!);
    const paths = [...clip!.querySelectorAll("path")].map((path) =>
      path.getAttribute("d"),
    );
    expect(paths[0]).toMatch(/^M137 0 H223/);
    expect(paths).not.toContain(expect.stringMatching(/^M72 82 H288/));
  });

  it("keeps the lowered rear waist cloth outside the opening and below closure details", () => {
    const result = resolveGarmentRecipe(
      dress({ backStyle: "openBack", waistline: "drop" }),
      "back",
    );
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    const cloth = document.querySelector('[data-layer="waist-adjustment"]');
    const mask = cloth?.closest("[mask]")?.getAttribute("mask");
    const opening = document.querySelector('[data-layer="back-opening-mask"]')
      ?.parentElement?.id;
    expect(mask).toBe(`url(#${opening})`);
    expect(
      result.markup.lastIndexOf('data-layer="waist-adjustment"'),
    ).toBeLessThan(result.markup.lastIndexOf('data-layer="back-construction"'));
  });

  it("preserves explicitly selected detachable sleeves outside rear base coverage", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "strapless",
        backStyle: "openBack",
        details: ["detachableSleeve"],
      }),
      "back",
    );
    const document = new DOMParser().parseFromString(
      result.markup,
      "image/svg+xml",
    );
    expect(
      document
        .querySelector('[data-detail="detachableSleeve"]')
        ?.closest("[mask]"),
    ).toBeNull();
  });

  it("renders the fixed long/high/a-line material fixture as a local keyed image", () => {
    const result = resolveGarmentRecipe(dress());

    expect(result.status).toBe("ready");
    expect(result.assetIds).toContain(
      "longHigh-aLine-longSleeve-high-ivory-mikadoSatin-magenta-key-v1",
    );
    expect(result.markup).toContain('data-renderer="garment-artwork"');
    expect(result.markup).toContain('data-matte-contract="chroma-excess-v1"');
    expect(result.markup).toContain(
      'data-color-contract="neutral-illumination-bridal-palette-v1"',
    );
    expect(result.markup).toContain(
      "/assets/garment/front/material/mikadoSatin-longHigh-key-v1.webp",
    );
    expect(result.markup).not.toContain("dress-1");
  });

  it("changes the complete composition when an authored upper family changes", () => {
    const high = resolveGarmentRecipe(dress({ topStyle: "longSleeve" }));
    const offShoulder = resolveGarmentRecipe(
      dress({ topStyle: "offShoulder", silhouette: "fitAndFlare" }),
    );

    expect(high.status).toBe("ready");
    expect(offShoulder.status).toBe("ready");
    expect(offShoulder.markup).not.toBe(high.markup);
    expect(offShoulder.assetIds).toContain(
      "upper-offShoulder-high-aLine-mikado-v1",
    );
    expect(offShoulder.markup).toContain("offShoulder-v1.webp");
    expect(offShoulder.markup).toContain("upper-selection");
    expect(offShoulder.markup).toContain('data-mask-component="body"');
    expect(offShoulder.markup).toContain('data-mask-operation="selection"');
  });

  it("uses the selected material sample across an authored attachment and lower shape", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "offShoulder",
        neckline: "sweetheart",
        silhouette: "fitAndFlare",
        fabric: "floral3D",
      }),
    );

    expect(result.status).toBe("ready");
    expect(result.assetIds).toContain("floral3D-longHigh-aLine-v2");
    expect(result.markup).toContain('data-layer="material-texture"');
    expect(result.markup).toContain('data-material="floral3D"');
    expect(result.markup).toContain('data-neckline="sweetheart"');
    expect(result.markup).toContain('data-renderer="photo-lower-warp"');
    expect(result.markup).toContain('clip-path="url(#');
  });

  it("composes a measured lower silhouette without leaking the source upper", () => {
    const result = resolveGarmentRecipe(dress({ silhouette: "mermaid" }));

    expect(result.status).toBe("ready");
    expect(result.assetIds).toEqual([
      "lower-mermaid-strapless-sweetheart-mikado-natural-key-v1",
      "longHigh-aLine-longSleeve-high-ivory-mikadoSatin-magenta-key-v1",
    ]);
    expect(result.markup).toContain('data-region="lower-body"');
    expect(result.markup).toContain('data-region="upper-body"');
    expect(result.markup).toContain('clip-path="url(#');
    expect(result.markup).toContain('data-clip-rule="nonzero-union"');
  });

  it("keeps unknown values partial and omits an invented upper construction", () => {
    const result = resolveGarmentRecipe(
      dress({ topStyle: "unknown", neckline: "unknown" }),
    );

    expect(result.status).toBe("partial");
    expect(result.missingFields).toEqual(["topStyle", "neckline"]);
    expect(result.markup).toContain('data-state="partial"');
    expect(result.markup).not.toContain("front/upper");
    expect(result.markup).not.toContain("front/matched");
  });

  it("uses a neutral form reference for an unrecorded colour", () => {
    const result = resolveGarmentRecipe(dress({ color: "unknown" }));

    expect(result.status).toBe("partial");
    expect(result.missingFields).toContain("color");
    expect(result.assetIds.length).toBeGreaterThan(0);
    expect(result.markup).toContain('data-reference-mode="form"');
    expect(result.markup).toContain(
      'data-color-contract="neutral-form-reference-v1"',
    );
  });

  it("cuts the selected neckline through the photographed upper construction", () => {
    const result = resolveGarmentRecipe(dress({ neckline: "straight" }));

    expect(result.status).toBe("ready");
    expect(result.markup).toContain('data-neckline="straight"');
    expect(result.markup).toContain('fill="black"');
    expect(result.markup).toContain("garment-artwork");
  });

  it("keeps rear opening, closure, and ribbon separate without duplicate decorations", () => {
    const record = dress({
      backStyle: "vBack",
      backClosure: "buttons",
      details: ["buttons", "backBow"],
    });
    const rear = resolveGarmentRecipe(record, "back");
    expect(rear.markup).toContain('data-opening-kind="v"');
    expect(rear.markup.match(/data-layer="back-buttons"/g)).toHaveLength(1);
    expect(rear.markup.match(/<g data-detail="backBow"/g)).toHaveLength(1);
    expect(rear.markup).not.toContain('data-detail="buttons"');
    expect(resolveGarmentRecipe(record, "full").markup).toContain(
      'data-detail="buttons"',
    );
  });

  it("returns the same wrist-inclusive upper crop used by choice cards", () => {
    const result = resolveGarmentRecipe(dress(), "upper");

    expect(result.viewBox).toEqual({ x: 60, y: 60, width: 240, height: 200 });
    expect(result.markup).toContain('data-view="upper"');
    expect(result.markup).toContain('viewBox="60 60 240 200"');
  });

  it("joins every recorded waistline and train with visible modifier geometry", () => {
    const waists = ["natural", "basque", "drop", "empire"] as const;
    const trains = ["none", "sweep", "chapel", "cathedral"] as const;
    const waistResults = waists.map((waistline) =>
      resolveGarmentRecipe(dress({ waistline, silhouette: "mermaid" })),
    );
    const trainResults = trains.map((train) =>
      resolveGarmentRecipe(dress({ train, silhouette: "mermaid" })),
    );

    expect(waistResults.every(({ status }) => status === "ready")).toBe(true);
    expect(new Set(waistResults.map(({ markup }) => markup)).size).toBe(
      waists.length,
    );
    expect(trainResults.every(({ status }) => status === "ready")).toBe(true);
    expect(trainResults[0].markup).not.toContain('data-layer="train"');
    expect(
      trainResults
        .slice(1)
        .every(({ markup }) => markup.includes('data-layer="train"')),
    ).toBe(true);
    expect(new Set(trainResults.map(({ markup }) => markup)).size).toBe(
      trains.length,
    );
    expect(waistResults[0].markup).not.toContain(
      'data-layer="waist-construction"',
    );
    expect(waistResults[1].markup).toContain('data-layer="lower-join-frame"');
    const texturedWaist = resolveGarmentRecipe(
      dress({ waistline: "basque", silhouette: "mermaid", fabric: "lace" }),
    );
    expect(texturedWaist.markup).toContain('data-layer="material-join-frame"');
    expect(texturedWaist.markup).toContain('data-layer="waist-adjustment"');
  });

  it("keeps the upper of a native full gown when its lower becomes a train", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "longSleeve",
        neckline: "high",
        silhouette: "aLine",
        fabric: "mikadoSatin",
        train: "chapel",
      }),
    );

    expect(result.status).toBe("ready");
    expect(result.markup).toContain('data-composition="unified-lower"');
    expect(result.markup).toContain('data-region="upper-body"');
    expect(result.markup).not.toContain('data-region="full-body"');
    expect(result.markup).toContain('data-source-window="join-to-hem"');
  });

  it("draws each recorded detail in its allowed view", () => {
    const details = [
      "corset",
      "draping",
      "waistBow",
      "backBow",
      "pearl",
      "sequin",
      "floral",
      "slit",
      "sheer",
      "detachableSleeve",
      "overskirt",
      "buttons",
    ] as const;
    const front = details.map((detail) =>
      resolveGarmentRecipe(dress({ details: [detail] })),
    );
    const backBow = resolveGarmentRecipe(
      dress({ backStyle: "bowBack", details: ["backBow"] }),
      "back",
    );

    expect(front.every(({ status }) => status === "ready")).toBe(true);
    expect(
      front
        .filter((_, index) => details[index] !== "backBow")
        .every(({ markup }, index) =>
          markup.includes(
            `data-detail="${details[index >= 3 ? index + 1 : index]}"`,
          ),
        ),
    ).toBe(true);
    expect(
      front.find(({ markup }) => markup.includes('data-detail="backBow"')),
    ).toBeUndefined();
    expect(backBow.markup).toContain('data-detail="backBow"');
    expect(
      front.find(({ markup }) => markup.includes('data-detail="waistBow"'))
        ?.markup,
    ).toContain('data-layer="detail-photo"');
    expect(
      front.find(({ markup }) => markup.includes('data-detail="floral"'))
        ?.markup,
    ).toContain('data-layer="detail-photo"');
  });

  it("uses the rear construction helper without front field gating", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "unknown",
        neckline: "unknown",
        backStyle: "openBack",
        fabric: "lace",
      }),
      "back",
    );

    expect(result.status).toBe("partial");
    expect(result.missingFields).toContain("topStyle");
    expect(result.markup).toContain('data-back-style="openBack"');
    expect(result.markup).toContain('data-layer="back-opening-mask"');
    expect(result.markup).not.toContain("front/upper");
    expect(result.markup).not.toContain("front/matched");
  });

  it("removes the long-sleeve rear template from an off-shoulder record", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "offShoulder",
        neckline: "sweetheart",
        backStyle: "bowBack",
      }),
      "back",
    );

    expect(result.status).toBe("ready");
    const mask = new DOMParser()
      .parseFromString(result.markup, "image/svg+xml")
      .querySelector('[data-layer="back-top-selection"]');
    expect(mask).not.toBeNull();
    expect(mask?.getAttribute("data-top-style")).toBe("offShoulder");
    expect(mask?.querySelector('[data-back-part="long-sleeve"]')).toBeNull();
    expect(
      mask?.querySelector('[data-back-part="off-shoulder-band"]'),
    ).not.toBeNull();
    expect(result.markup).not.toContain('data-neckline="sweetheart"');
    expect(result.markup).toContain('data-body-contour="measured"');
  });

  it("does not retain a template skirt when the rear silhouette is unknown", () => {
    const result = resolveGarmentRecipe(
      dress({ silhouette: "unknown", backStyle: "buttonBack" }),
      "back",
    );
    expect(result.status).toBe("partial");
    expect(result.missingFields).toContain("silhouette");
    expect(result.layers.every((layer) => layer.region === "upper")).toBe(true);
    expect(result.markup).not.toContain('data-region="lower-body"');
  });

  it("uses the recorded rear silhouette without borrowing the front neckline", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "strapless",
        neckline: "v",
        silhouette: "mermaid",
        backStyle: "openBack",
      }),
      "back",
    );

    expect(result.status).toBe("ready");
    expect(
      result.layers.find((layer) => layer.region === "lower")?.asset.coverage
        .silhouette,
    ).toBe("mermaid");
    expect(result.markup).toContain('data-back-part="strapless-bodice"');
    expect(result.markup).not.toContain('data-neckline="v"');
    expect(result.markup).toContain('data-back-style="openBack"');
  });

  it("keeps front neckline changes out of a recorded rear construction", () => {
    const views = ["high", "v", "sweetheart", "unknown"].map((neckline) =>
      resolveGarmentRecipe(
        dress({
          neckline: neckline as Dress["neckline"],
          topStyle: "offShoulder",
          backStyle: "openBack",
        }),
        "back",
        "rear-same-selection",
      ),
    );
    const withoutInstanceIds = views.map((view) =>
      view.markup.replaceAll(
        /garment-rear-same-selection-\d+/g,
        "rear-instance",
      ),
    );
    expect(new Set(withoutInstanceIds).size).toBe(1);
    expect(views.every((view) => view.status === "ready")).toBe(true);
  });

  it("renders one native bow when back style and detail record the same feature", () => {
    const result = resolveGarmentRecipe(
      dress({ backStyle: "bowBack", details: ["backBow"] }),
      "back",
    );

    expect(result.status).toBe("ready");
    expect(result.markup.match(/data-layer="back-bow-native"/g)).toHaveLength(
      1,
    );
    expect(result.markup).not.toContain(
      'data-layer="detail-photo" data-detail="backBow"',
    );
    expect(result.markup).toContain("detail-matte");
  });

  it("uses the authored risk-pair composite when that pair exists", () => {
    const result = resolveGarmentRecipe(
      dress({ topStyle: "longSleeve", neckline: "illusion" }),
    );

    expect(result.status).toBe("ready");
    expect(result.assetIds).toEqual([
      "matched-longSleeve-illusion-aLine-mikado-v1",
    ]);
    expect(result.markup).not.toContain("mikadoSatin-longHigh-key-v1.webp");
  });

  it("uses the authored low strapless upper while preserving the selected lower photo", () => {
    const result = resolveGarmentRecipe(
      dress({
        topStyle: "strapless",
        neckline: "sweetheart",
        silhouette: "aLine",
        fabric: "lace",
        train: "chapel",
        backStyle: "bowBack",
        details: ["backBow", "pearl"],
      }),
    );
    expect(result.status).toBe("ready");
    expect(result.markup).toContain("matched-strapless-high-aLine-mikado-v1");
    expect(result.markup).toContain(
      "lower-mermaid-strapless-sweetheart-mikado-natural-key-v1",
    );
    expect(result.markup).toContain(
      'data-layer="train" data-composition="unified-lower" data-region="lower-body"',
    );
    expect(result.markup).toContain(
      'data-region="upper-body" data-asset-id="lower-mermaid-strapless-sweetheart-mikado-natural-key-v1"',
    );
    expect(result.markup).not.toContain("upper-selection");
    expect(result.markup).not.toContain(
      '<use data-layer="garment-image" data-region="lower-body"',
    );

    const upper = resolveGarmentRecipe(
      dress({
        topStyle: "strapless",
        neckline: "sweetheart",
        silhouette: "aLine",
        fabric: "lace",
      }),
      "upper",
    );
    expect(upper.status).toBe("ready");
    expect(upper.assetIds).toContain(
      "lower-mermaid-strapless-sweetheart-mikado-natural-key-v1",
    );
    expect(upper.markup).toContain(
      'data-region="upper-body" data-asset-id="lower-mermaid-strapless-sweetheart-mikado-natural-key-v1"',
    );
    expect(upper.markup).toContain("matched-strapless-high-aLine-mikado-v1");
  });

  it.each(["full", "upper"] as const)(
    "preserves a strapless sweetheart upper and the selected mikado skirt in %s",
    (view) => {
      for (const silhouette of SILHOUETTES.filter(
        (value) => value !== "unknown",
      )) {
        const result = resolveGarmentRecipe(
          dress({ topStyle: "strapless", neckline: "sweetheart", silhouette }),
          view,
        );
        const upper = result.layers.find(
          ({ region }) => region === "upper" || region === "full",
        );
        const lower = result.layers.find(
          ({ region }) => region === "lower" || region === "full",
        );

        expect(upper?.asset.coverage.topStyle, silhouette).toBe("strapless");
        expect(upper?.asset.coverage.neckline, silhouette).toBe("sweetheart");
        expect(lower?.asset.coverage.silhouette, silhouette).toBe(silhouette);
      }
    },
  );

  it("rejects custom notes and duplicate details without exposing their text", () => {
    const custom = resolveGarmentRecipe(
      dress({ customOptions: { neckline: "낮은 하트" } }),
    );
    const duplicate = resolveGarmentRecipe(
      dress({ details: ["pearl", "pearl"] }),
    );

    expect(custom.status).toBe("partial");
    expect(custom.markup).toContain("/assets/garment/");
    expect(custom.markup).not.toContain("낮은 하트");
    expect(duplicate.status).toBe("unavailable");
    expect(duplicate.reason).toBe("duplicate-details");
  });

  it("keeps an unrecorded back construction unresolved and face-free", () => {
    const result = resolveGarmentRecipe(dress(), "back");

    expect(result.status).toBe("partial");
    expect(result.assetIds).toEqual([]);
    expect(result.markup).not.toContain("neutral-back-aLine-v1.webp");
    expect(result.markup).not.toContain("front/");
    expect(result.markup).not.toContain("face");
  });

  it("resolves every baseline field tuple to an explicit state", () => {
    const tuples = TOP_STYLES.slice(1).flatMap((topStyle) =>
      NECKLINES.slice(1).flatMap((neckline) =>
        SILHOUETTES.slice(1).flatMap((silhouette) =>
          FABRICS.slice(1).map((fabric) =>
            resolveGarmentRecipe(
              dress({ topStyle, neckline, silhouette, fabric }),
            ),
          ),
        ),
      ),
    );

    expect(tuples).toHaveLength(4032);
    expect(tuples.every(({ status }) => status === "ready")).toBe(true);
    expect(tuples.every(({ markup }) => markup.includes('data-state="'))).toBe(
      true,
    );
    expect(
      tuples
        .filter(({ status }) => status === "ready")
        .every(({ assetIds }) => assetIds.length > 0),
    ).toBe(true);
  });

  it("embeds only local asset bytes when requested", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
      ),
    );

    const result = await prepareGarmentArtwork(dress(), {
      view: "full",
      embedAssets: true,
      namespace: "test-embed",
    });

    expect(result.status).toBe("ready");
    expect(result.markup).toContain("data:image/webp;base64,AQID");
    expect(result.markup).not.toContain('href="http://');
    expect(result.markup).not.toContain('href="https://');
    vi.unstubAllGlobals();
  });

  it("embeds each source once even when the lower material is strip-warped", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(new Uint8Array([7, 8, 9]), { status: 200 }),
      ),
    );

    const result = await prepareGarmentArtwork(
      dress({
        topStyle: "offShoulder",
        neckline: "sweetheart",
        silhouette: "fitAndFlare",
        fabric: "lace",
      }),
      { view: "full", embedAssets: true, namespace: "warp-embed" },
    );

    expect(result.status).toBe("ready");
    expect(result.markup.match(/data:image\/webp;base64,/g)).toHaveLength(3);
    expect(result.markup.match(/<image\b/g)).toHaveLength(3);
    vi.unstubAllGlobals();
  });

  it("embeds photographic detail masters with their local matte filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(new Uint8Array([10, 11, 12]), { status: 200 }),
      ),
    );

    const result = await prepareGarmentArtwork(
      dress({ details: ["waistBow", "floral"] }),
      { view: "full", embedAssets: true, namespace: "detail-embed" },
    );

    expect(result.status).toBe("ready");
    expect(result.assetIds).toContain(
      "detail-satinBow-ivory-silk-magenta-key-v1",
    );
    expect(result.assetIds).toContain(
      "detail-floralApplique-ivory-organza-magenta-key-v1",
    );
    expect(result.markup.match(/data:image\/webp;base64,/g)).toHaveLength(3);
    expect(result.markup).toContain("detail-matte");
    vi.unstubAllGlobals();
  });

  it("reuses bytes by static asset identity without retaining dress identity", async () => {
    clearGarmentAssetCache();
    const fetchMock = vi.fn(
      async () => new Response(new Uint8Array([4, 5, 6]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await prepareGarmentArtwork(dress(), {
      view: "full",
      embedAssets: true,
      namespace: "cache-one",
    });
    await prepareGarmentArtwork(dress({ id: "dress-2", label: "다른 기록" }), {
      view: "full",
      embedAssets: true,
      namespace: "cache-two",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    clearGarmentAssetCache();
  });

  it("builds pure markup with an explicit namespace for independent instances", () => {
    const recipe = resolveGarmentRecipe(dress());
    const first = buildGarmentArtworkMarkup(recipe, { namespace: "first" });
    const second = buildGarmentArtworkMarkup(recipe, { namespace: "second" });

    expect(first).not.toBe(second);
    expect(first).toContain("garment-first-");
    expect(second).toContain("garment-second-");
  });

  it("keeps the optimized runtime pack complete and private-metadata free", () => {
    expect(GARMENT_ASSETS).toHaveLength(30);
    expect(
      GARMENT_ASSETS.every(
        (asset) =>
          asset.path.startsWith("/assets/garment/") &&
          !asset.path.includes(".omo") &&
          !asset.assetId.includes("prompt") &&
          asset.byteLength < 4 * 1024 * 1024 &&
          statSync(resolve("public", asset.path.slice(1))).size ===
            asset.byteLength,
      ),
    ).toBe(true);
  });

  it("keeps selected bridal colours distinct while preserving the same local source", () => {
    const ivory = resolveGarmentRecipe(dress({ color: "ivory" }));
    const white = resolveGarmentRecipe(dress({ color: "pureWhite" }));
    const champagne = resolveGarmentRecipe(dress({ color: "champagne" }));

    expect(ivory.assetIds).toEqual(white.assetIds);
    expect(white.assetIds).toEqual(champagne.assetIds);
    expect(ivory.markup).not.toBe(white.markup);
    expect(white.markup).not.toBe(champagne.markup);
    expect(champagne.markup).toContain("0.76");
  });
});
