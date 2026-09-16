import type { GarmentLogicalBounds, GarmentView } from "./types";

export const FULL_VIEW_BOX: GarmentLogicalBounds = {
  x: 0,
  y: 0,
  width: 360,
  height: 640,
};

export const UPPER_VIEW_BOX: GarmentLogicalBounds = {
  x: 100,
  y: 66,
  width: 160,
  height: 154,
};

export function viewBoxFor(view: GarmentView): GarmentLogicalBounds {
  return view === "upper" ? UPPER_VIEW_BOX : FULL_VIEW_BOX;
}

export function viewBoxText(bounds: GarmentLogicalBounds): string {
  return `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;
}
