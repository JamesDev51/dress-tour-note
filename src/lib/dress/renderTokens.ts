import type { DressColor } from "../../types/domain";
import renderTokens from "./renderTokens.json";

export const dressRenderTokens = renderTokens satisfies {
  readonly previewSurface: string;
  readonly floorShadow: string;
  readonly garmentHighlight: string;
  readonly garmentDropShadow: string;
  readonly beadShadow: string;
  readonly ornateBeadShadow: string;
  readonly exportCanvas: string;
  readonly volume: {
    readonly sideShadow: string;
    readonly contourShadow: string;
    readonly seamShadow: string;
    readonly mermaidShadow: string;
  };
  readonly garmentColor: Record<DressColor, string>;
  readonly garmentEdge: Record<DressColor, string>;
};
