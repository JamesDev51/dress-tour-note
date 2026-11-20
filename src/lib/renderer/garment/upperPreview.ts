import type { Dress, Neckline, TopStyle } from "../../../types/domain";
import { DISPLAY_DRESS_COLOR } from "../../dress/activeOptions";
import { resolveGarmentRecipe } from "./core";
import { buildGarmentArtworkMarkup, createGarmentNamespace } from "./markup";
import { dressRenderTokens } from "../../dress/renderTokens";
import { UPPER_VIEW_BOX } from "./viewBounds";
import { renderMannequin } from "../dressSvgSupport";

// Choice cards and comparisons share neck, waist and wrist registration.
export const UPPER_CHOICE_VIEW_BOX = UPPER_VIEW_BOX;

export function upperPreviewArtwork(
  topStyle: TopStyle,
  neckline: Neckline,
  namespace: string,
) {
  const sample: Dress = {
    id: "upper-choice",
    tourId: "",
    shopId: "",
    label: "",
    order: 1,
    topStyle,
    neckline,
    silhouette: "aLine",
    fabric: "mikadoSatin",
    waistline: "natural",
    color: DISPLAY_DRESS_COLOR,
    train: "none",
    backStyle: "unknown",
    details: [],
    quickTags: [],
    memo: "",
    isFavorite: false,
    createdAt: "",
    updatedAt: "",
  };
  const recipe = resolveGarmentRecipe(sample, "full");
  const garmentMarkup = buildGarmentArtworkMarkup(
    { ...recipe, viewBox: UPPER_CHOICE_VIEW_BOX },
    { namespace },
  );
  const mannequin = renderMannequin(undefined, false, {
    coordinateFrame: "garment",
    includeHead: false,
    includeFloorShadow: false,
  });
  const contourId = `${createGarmentNamespace(namespace)}-choice-contour`;
  const contour = `<filter id="${contourId}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius=".7" result="outline"/><feFlood flood-color="${dressRenderTokens.garmentDropShadow}" flood-opacity=".3"/><feComposite in2="outline" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return {
    ...recipe,
    viewBox: UPPER_CHOICE_VIEW_BOX,
    // Insert the neutral anatomy guide behind the unchanged garment composition.
    markup: garmentMarkup
      .replace("</defs>", `${contour}</defs>${mannequin}`)
      .replace(
        'data-layer="garment-composition"',
        `data-layer="garment-composition" filter="url(#${contourId})"`,
      ),
  };
}
