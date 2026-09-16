import { describe, expect, it } from "vitest";
import {
  buildUpperSelectionMarkup,
  type UpperSelectionInput,
  type UpperSourceAnchors,
} from "./upperSelection";

const anchors = {
  centerX: 512,
  necklineY: 80,
  necklineLeftX: 470,
  necklineRightX: 555,
  shoulderY: 120,
  shoulderLeftX: 372,
  shoulderRightX: 650,
  waistY: 342,
  waistLeftX: 419,
  waistRightX: 603,
  sleeveEndY: 524,
} as const satisfies UpperSourceAnchors;

function input(
  overrides: Partial<UpperSelectionInput> = {},
): UpperSelectionInput {
  return {
    namespace: "garment-upper-proof",
    topStyle: "strap",
    neckline: "sweetheart",
    templateKind: "upperFamily",
    sourceAnchors: anchors,
    ...overrides,
  };
}

describe("buildUpperSelectionMarkup", () => {
  it("covers every known neckline with a bounded, distinct edge", () => {
    const necklines = [
      "straight",
      "sweetheart",
      "v",
      "square",
      "scoop",
      "high",
      "illusion",
      "asymmetric",
    ] as const;
    const results = necklines.map((neckline) =>
      buildUpperSelectionMarkup(input({ neckline })),
    );

    expect(results.every(({ status }) => status === "ready")).toBe(true);
    expect(new Set(results.map(({ edge }) => edge.path)).size).toBe(8);
    expect(results[5]?.edge.path).toBe("");
    expect(
      results.every(({ defs, maskId }) =>
        defs.includes(`<mask id="${maskId}"`),
      ),
    ).toBe(true);
    expect(results.every(({ defs }) => !defs.includes("<image"))).toBe(true);
    expect(results.every(({ defs }) => !defs.includes('fill="#'))).toBe(true);
    const coordinates = [...results[1]?.defs.matchAll(/-?\d+(?:\.\d+)?/g)].map(
      (match) => Number(match[0]),
    );
    expect(
      coordinates.every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 1536,
      ),
    ).toBe(true);
  });

  it("retains authored attachment windows for every known top style", () => {
    const topStyles = [
      "strapless",
      "offShoulder",
      "strap",
      "spaghetti",
      "wideStrap",
      "halter",
      "oneShoulder",
      "shortSleeve",
      "longSleeve",
    ] as const;

    const results = topStyles.map((topStyle) =>
      buildUpperSelectionMarkup(input({ topStyle })),
    );

    expect(results.every(({ status }) => status === "ready")).toBe(true);
    expect(results[0]?.attachmentWindows).toHaveLength(0);
    expect(
      results
        .slice(1)
        .every(({ attachmentWindows }) => attachmentWindows.length > 0),
    ).toBe(true);
    expect(
      results.every(({ attachmentWindows }) =>
        attachmentWindows.every(
          ({ path }) => path.length > 0 && !path.includes("NaN"),
        ),
      ),
    ).toBe(true);
  });

  it("intersects a native source mask and preserves a native matched edge", () => {
    const result = buildUpperSelectionMarkup(
      input({
        topStyle: "longSleeve",
        neckline: "illusion",
        templateKind: "matched",
        nativeMatched: true,
        nativeSourceMaskId: "garment-native-alpha",
      }),
    );

    expect(result.status).toBe("ready");
    expect(result.edge.kind).toBe("native");
    expect(result.edge.path).toBe("");
    expect(result.yokeInstructions.kind).toBe("native");
    expect(result.defs).toContain('mask="url(#garment-native-alpha)"');
    expect(result.defs).toContain('data-mask-operation="intersection"');
    expect(result.defs).not.toContain('data-mask-operation="replace"');
  });

  it("starts low off-shoulder retention at the measured arm-band top", () => {
    const result = buildUpperSelectionMarkup(
      input({ topStyle: "offShoulder", neckline: "v" }),
    );

    expect(result.defs).toContain('data-mask-top-y="166"');
    expect(result.defs).toContain('data-attachment-kind="off-shoulder-band"');
    expect(result.defs).not.toContain('data-mask-top-y="80"');
  });

  it("retains centered sweetheart cup peaks above the low off-shoulder band", () => {
    const result = buildUpperSelectionMarkup(
      input({ topStyle: "offShoulder", neckline: "sweetheart" }),
    );

    expect(result.defs).toContain('data-mask-top-y="166"');
    expect(result.defs).toContain('data-mask-cup-top-y="146"');
    expect(result.edge.path).not.toBe(
      buildUpperSelectionMarkup(
        input({ topStyle: "offShoulder", neckline: "v" }),
      ).edge.path,
    );
    expect(result.defs).toContain('data-attachment-kind="off-shoulder-band"');
  });

  it("returns an intentional partial state for unknown selections", () => {
    const result = buildUpperSelectionMarkup(
      input({ topStyle: "unknown", neckline: "unknown" }),
    );

    expect(result.status).toBe("partial");
    expect(result.reason).toBe("unknown-selection");
    expect(result.maskId).toBeUndefined();
    expect(result.defs).toBe("");
    expect(result.edge.kind).toBe("unknown");
    expect(result.attachmentWindows).toHaveLength(0);
  });

  it("rejects source anchors that cannot describe a bounded body", () => {
    const result = buildUpperSelectionMarkup(
      input({
        sourceAnchors: { ...anchors, waistY: 1600 },
      }),
    );

    expect(result.status).toBe("partial");
    expect(result.reason).toBe("invalid-source-anchors");
    expect(result.defs).toBe("");
  });

  it("emits an explicit generic yoke instruction for non-native illusion", () => {
    const result = buildUpperSelectionMarkup(
      input({ neckline: "illusion", nativeMatched: false }),
    );

    expect(result.yokeInstructions.kind).toBe("generic-authored-center");
    expect(result.yokeInstructions.opacity).toBeGreaterThan(0);
    expect(result.yokeInstructions.opacity).toBeLessThan(1);
    expect(result.yokeInstructions.maskId).toBeDefined();
    expect(result.defs).toContain("data-yoke-opacity");
    expect(result.defs).toContain('data-coordinate-frame="source-pixels"');
  });
});
