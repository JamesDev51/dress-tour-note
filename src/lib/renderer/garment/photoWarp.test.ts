import { describe, expect, it } from "vitest";
import {
  buildPhotoWarpMarkup,
  type PhotoWarpGuide,
  type PhotoWarpInput,
} from "./photoWarp";

const frame = { width: 1024, height: 1536 } as const;

function guide(
  spans: readonly (readonly [number, number])[],
  centerX = 512,
): PhotoWarpGuide {
  return {
    frame,
    centerX,
    rows: spans.map(([leftX, rightX], index) => ({
      y: 343 + index * 120,
      runs: [
        [leftX - 120, leftX - 80],
        [leftX, rightX],
        [rightX + 80, rightX + 120],
      ],
      centerRunIndex: 1,
    })),
  };
}

function input(overrides: Partial<PhotoWarpInput> = {}): PhotoWarpInput {
  return {
    sourceImageId: "garment-proof-material",
    sourceGuide: guide([
      [430, 594],
      [380, 644],
      [320, 704],
    ]),
    targetGuide: guide([
      [430, 594],
      [280, 744],
      [180, 844],
    ]),
    source: {
      centerX: 512,
      joinY: 343,
      hemY: 583,
      joinLeftX: 430,
      joinRightX: 594,
      joinKind: "source-waist",
    },
    target: {
      centerX: 512,
      joinY: 343,
      hemY: 583,
      joinLeftX: 430,
      joinRightX: 594,
      joinKind: "source-waist",
    },
    namespace: "garment-proof",
    ...overrides,
  };
}

describe("buildPhotoWarpMarkup", () => {
  it("maps a central lower body with bounded finite strip transforms", () => {
    const result = buildPhotoWarpMarkup(input());

    expect(result).toContain('data-coordinate-frame="source-pixels"');
    expect(result).toContain('data-source-image-id="garment-proof-material"');
    expect(result).toContain('data-fast-path="global-affine"');
    expect(result).toContain('clipPathUnits="userSpaceOnUse"');
    expect(result).toContain('data-strip-mapping="global-affine"');
    expect(result).toContain('href="#garment-proof-material"');
    expect(result).not.toContain("data:image/");

    const matrices = [...result.matchAll(/matrix\(([^)]+)\)/g)].map(
      ([, values]) => values?.trim().split(/\s+/).map(Number) ?? [],
    );
    expect(matrices.length).toBe(1);
    expect(
      matrices.every(
        (values) =>
          values.length === 6 &&
          values.every(Number.isFinite) &&
          (values[0] ?? 0) > 0 &&
          (values[3] ?? 0) > 0,
      ),
    ).toBe(true);
  });

  it("keeps the target mask and measured construction metadata on the composition", () => {
    const result = buildPhotoWarpMarkup(
      input({
        target: {
          ...input().target,
          joinY: 291,
          hemY: 1428,
          joinLeftX: 417,
          joinRightX: 606,
          joinKind: "high-empire",
        },
        targetMaskId: "garment-proof-empire-mask",
      }),
    );

    expect(result).toContain('mask="url(#garment-proof-empire-mask)"');
    expect(result).toContain('data-target-join-kind="high-empire"');
    expect(result).toContain('data-target-join-y="291"');
    expect(result).toContain('data-target-hem-y="1428"');
  });

  it("uses one source image reference when source and target geometry match", () => {
    const fixture = input();
    const result = buildPhotoWarpMarkup({
      ...fixture,
      targetGuide: fixture.sourceGuide,
    });

    expect(result.match(/<use\b/g)).toHaveLength(1);
    expect(result).toContain('data-fast-path="exact"');
    expect(result).toContain('data-strip-count="1"');
  });

  it("does not let side branches become the lower body", () => {
    const result = buildPhotoWarpMarkup(
      input({
        sourceGuide: {
          ...guide([
            [430, 594],
            [380, 644],
            [320, 704],
          ]),
          rows: [
            {
              y: 343,
              runs: [
                [12, 220],
                [430, 594],
                [804, 1012],
              ],
              centerRunIndex: 1,
            },
            {
              y: 463,
              runs: [[18, 1006]],
              centerRunIndex: null,
            },
            {
              y: 583,
              runs: [[320, 704]],
              centerRunIndex: 0,
            },
          ],
        },
      }),
    );

    expect(result).toContain('data-fast-path="global-affine"');
    expect(result).not.toContain("12 343");
    expect(result).not.toContain("1012 343");
    expect(result).toContain('data-strip-mapping="global-affine"');
  });

  it.each([
    ["empty source rows", { sourceGuide: { ...guide([]), rows: [] } }],
    ["empty target rows", { targetGuide: { ...guide([]), rows: [] } }],
    [
      "reversed source anchors",
      { source: { ...input().source, joinY: 700, hemY: 343 } },
    ],
    [
      "zero-width target span",
      {
        targetGuide: guide([
          [512, 512],
          [520, 520],
          [530, 530],
        ]),
      },
    ],
    [
      "non-finite target anchor",
      { target: { ...input().target, hemY: Number.NaN } },
    ],
  ] as const)("returns empty markup for %s", (_label, overrides) => {
    expect(buildPhotoWarpMarkup(input(overrides))).toBe("");
  });

  it("keeps a shorter tea-length target in the target frame", () => {
    const fixture = input({
      source: { ...input().source, hemY: 1437 },
      target: { ...input().target, hemY: 1072 },
    });
    const result = buildPhotoWarpMarkup(fixture);

    expect(result).toContain('data-fast-path="short-hem"');
    expect(result).toContain('data-strip-mapping="short-hem-viewbox"');
    expect(result.match(/<use\b/g)).toHaveLength(1);
    expect(result).toContain('data-target-hem-y="1072"');
    expect(result).toContain("1072");
    expect(result).not.toContain('data-target-hem-y="583"');
  });
});
