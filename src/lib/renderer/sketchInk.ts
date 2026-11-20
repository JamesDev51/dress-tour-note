import {
  SKETCH_PEN_WIDTHS,
  type SketchPoint,
  type SketchStroke,
} from "../../types/domain";

export const SKETCH_FRAME = { width: 320, height: 427 } as const;
export const SKETCH_INK = "#754b55";

export function sketchPath(points: readonly SketchPoint[]): string {
  if (!points.length) return "";
  const coordinates = points.map(
    ([x, y]) =>
      `${Number((x * SKETCH_FRAME.width).toFixed(2))} ${Number((y * SKETCH_FRAME.height).toFixed(2))}`,
  );
  // A zero-length segment gives a single tap the same round cap as a line.
  return (
    "M" +
    coordinates[0] +
    "L" +
    (coordinates.length === 1 ? coordinates[0] : coordinates.slice(1).join(" "))
  );
}

export function sketchInkMarkup(strokes?: readonly SketchStroke[]): string {
  if (!strokes?.length) return "";
  const paths = strokes
    .filter(
      ({ width, points }) => SKETCH_PEN_WIDTHS.includes(width) && points.length,
    )
    .map(
      ({ width, points }) =>
        `<path stroke-width="${width}" d="${sketchPath(points)}"/>`,
    )
    .join("");
  return `<g data-layer="sketch-ink" fill="none" stroke="${SKETCH_INK}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
}
