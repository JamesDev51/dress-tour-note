import { describe, expect, it } from "vitest";
import type { BackStyle } from "../../../types/domain";
import {
  BACK_CONSTRUCTION_STYLES,
  buildBackConstructionMarkup,
  type BackConstructionInput,
} from "./backConstruction";

const fixture: BackConstructionInput = {
  backStyle: "openBack",
  namespace: "garment-back-proof",
  frame: { width: 360, height: 640 },
  anchors: {
    centerX: 180,
    necklineY: 74.609,
    necklineLeftX: 173.32,
    necklineRightX: 187.031,
    shoulderY: 95.703,
    shoulderLeftX: 130.781,
    shoulderRightX: 229.219,
    waistY: 170.234,
    waistLeftX: 147.305,
    waistRightX: 212.344,
    hemY: 554.141,
  },
};

function construction(
  backStyle: BackStyle,
  overrides: Partial<BackConstructionInput> = {},
) {
  return buildBackConstructionMarkup({ ...fixture, ...overrides, backStyle });
}

describe("buildBackConstructionMarkup", () => {
  it("returns a bounded unknown state without inventing rear construction", () => {
    const result = construction("unknown");

    expect(result.status).toBe("unknown");
    expect(result.markup).toContain('data-state="unknown"');
    expect(result.markup).toContain('stroke-dasharray="6 4"');
    expect(result.defs).toContain('data-back-style="unknown"');
    expect(result.defs).not.toContain("data-opening-kind=");
  });

  it.each([
    ["openBack", "open"],
    ["vBack", "v"],
    ["buttonBack", "button"],
    ["corsetBack", "corset"],
    ["illusionBack", "illusion"],
    ["bowBack", "bow"],
  ] as const)(
    "renders the recorded %s rear construction",
    (backStyle, shape) => {
      const result = construction(backStyle);

      expect(result.status).toBe("known");
      expect(result.markup).toContain(`data-shape="${shape}"`);
      expect(result.markup).toContain('data-view="back"');
      expect(result.defs).toContain(`data-back-style="${backStyle}"`);
      expect(result.viewBox).toEqual({ x: 0, y: 0, width: 360, height: 640 });
    },
  );

  it("cuts real open and V negative space through the photographic core mask", () => {
    const open = construction("openBack");
    const v = construction("vBack");

    expect(open.maskId).not.toBe(v.maskId);
    expect(open.defs).toContain('data-opening-kind="open"');
    expect(v.defs).toContain('data-opening-kind="v"');
    expect(open.defs).toMatch(
      /<path[^>]+data-layer="back-opening-mask"[^>]+fill="black"/,
    );
    expect(v.defs).toMatch(
      /<path[^>]+data-layer="back-opening-mask"[^>]+fill="black"/,
    );
    expect(open.markup).toContain('data-layer="back-opening-edge"');
    expect(v.markup).toContain('data-layer="back-opening-lining"');
    expect(open.markup).not.toContain('data-layer="back-buttons"');
  });

  it("keeps button and corset closures attached to the rear spine", () => {
    const button = construction("buttonBack");
    const corset = construction("corsetBack");

    expect(button.markup).toContain('data-layer="back-buttons"');
    expect(button.markup).toContain('data-attachment="center-back-spine"');
    expect(button.markup.match(/data-button-index=/g)).toHaveLength(7);
    expect(corset.defs).toContain('data-opening-kind="corset"');
    expect(corset.markup).toContain('data-layer="back-corset-lacing"');
    expect(corset.markup).toContain('data-layer="back-corset-eyelets"');
    expect(corset.markup).toContain('data-attachment="center-back-spine"');
  });

  it("renders a translucent illusion panel and keeps a supplied bow reference local", () => {
    const illusion = construction("illusionBack");
    const bow = construction("bowBack", {
      nativeBowImageId: "garment-bow-source",
      nativeBowBounds: { x: 137, y: 101, width: 86, height: 74 },
    });
    const fallbackBow = construction("bowBack");

    expect(illusion.defs).toContain('data-opening-kind="illusion"');
    expect(illusion.defs).toContain('data-layer="back-illusion-pattern"');
    expect(illusion.markup).toContain('fill-opacity=".38"');
    expect(bow.markup).toContain('data-layer="back-bow-native"');
    expect(bow.markup).toContain('href="#garment-bow-source"');
    expect(bow.markup).toContain('x="137"');
    expect(bow.markup).toContain('width="86"');
    expect(fallbackBow.markup).toContain('data-layer="back-bow-knot"');
    expect(fallbackBow.markup).toContain('data-layer="back-bow-loop"');
    expect(fallbackBow.markup).toContain('data-layer="back-bow-tail"');
    expect(bow.markup).not.toContain("http:");
    expect(bow.markup).not.toContain("https:");
  });

  it("namespaces construction ids and stays invariant to absent front fields", () => {
    const styles = BACK_CONSTRUCTION_STYLES.map((style, index) =>
      construction(style, { namespace: `rear-independent-${index}` }),
    );
    const ids = styles.map(({ maskId }) => maskId);

    expect(new Set(ids).size).toBe(BACK_CONSTRUCTION_STYLES.length);
    expect(
      styles.every(
        ({ defs, markup }) =>
          !/front|topStyle|neckline/.test(`${defs}${markup}`),
      ),
    ).toBe(true);
    expect(construction("openBack", { namespace: "same" })).toEqual(
      construction("openBack", { namespace: "same" }),
    );
  });
});
