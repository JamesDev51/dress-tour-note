import { matrix } from "./svgUtils";

const KEY_LOW = 0.08;
const KEY_HIGH = 0.42;
const SPILL_LOW = 0.02;
const SPILL_HIGH = 0.22;

export function matteFilterMarkup(
  id: string,
  color: string,
  bounds = { x: -12, y: -12, width: 384, height: 664 },
): string {
  const keyDelta = KEY_HIGH - KEY_LOW;
  const spillDelta = SPILL_HIGH - SPILL_LOW;
  const keyAlpha = [
    -0.5 / keyDelta,
    1 / keyDelta,
    -0.5 / keyDelta,
    0,
    KEY_HIGH / keyDelta,
  ];
  const spillAlpha = [
    0.5 / spillDelta,
    -1 / spillDelta,
    0.5 / spillDelta,
    0,
    -SPILL_LOW / spillDelta,
  ];
  const palette =
    color === "pureWhite"
      ? [1, 1, 1]
      : color === "champagne"
        ? [1, 0.89, 0.76]
        : color === "ivory"
          ? [1, 0.97, 0.91]
          : [0.84, 0.82, 0.79];
  const colorContract =
    color === "unknown"
      ? "neutral-form-reference-v1"
      : "neutral-illumination-bridal-palette-v1";
  return `<filter id="${id}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB" data-matte-contract="chroma-excess-v1" data-color-contract="${colorContract}"><feColorMatrix in="SourceGraphic" type="matrix" result="key-alpha" values="${matrix([[1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], keyAlpha])}"/><feComposite in="key-alpha" in2="SourceGraphic" operator="in" result="key-alpha-clipped"/><feColorMatrix in="SourceGraphic" type="matrix" result="spill-alpha" values="${matrix([[1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], spillAlpha])}"/><feColorMatrix in="SourceGraphic" type="matrix" result="despill" values="${matrix(
    [
      [0.875, 0.25, -0.125, 0, 0],
      [0.4, 0.2, 0.4, 0, 0],
      [-0.125, 0.25, 0.875, 0, 0],
      [0, 0, 0, 1, 0],
    ],
  )}"/><feColorMatrix in="spill-alpha" type="matrix" result="inverse-spill" values="${matrix(
    [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, -1, 1],
    ],
  )}"/><feComposite in="despill" in2="spill-alpha" operator="in" result="corrected-edge"/><feComposite in="SourceGraphic" in2="inverse-spill" operator="in" result="original-core"/><feMerge result="composed-rgb"><feMergeNode in="original-core"/><feMergeNode in="corrected-edge"/></feMerge><feColorMatrix in="composed-rgb" type="matrix" result="composed-opaque" values="${matrix(
    [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1],
    ],
  )}"/><feComposite in="composed-opaque" in2="key-alpha-clipped" operator="in" result="matted"/><feColorMatrix in="matted" type="matrix" result="neutral-illumination" values="${matrix(
    [
      [0.2126, 0.7152, 0.0722, 0, 0],
      [0.2126, 0.7152, 0.0722, 0, 0],
      [0.2126, 0.7152, 0.0722, 0, 0],
      [0, 0, 0, 1, 0],
    ],
  )}"/><feColorMatrix in="neutral-illumination" type="matrix" result="selected-palette" values="${matrix(
    [
      [palette[0], 0, 0, 0, 0],
      [0, palette[1], 0, 0, 0],
      [0, 0, palette[2], 0, 0],
      [0, 0, 0, 1, 0],
    ],
  )}"/></filter>`;
}
