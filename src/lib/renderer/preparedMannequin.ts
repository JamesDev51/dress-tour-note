import { dressRenderTokens as tokens } from "../dress/renderTokens";
import type { GarmentArtworkResult } from "./garment";
import { numberText } from "./garment/svgUtils";

export const PREPARED_MANNEQUIN_FLOOR = 556;

export function preparedMannequinGeometry(artwork: GarmentArtworkResult) {
  const upper =
    artwork.layers.find(({ region }) => region === "upper") ??
    artwork.layers[0];
  const shoulderY = upper?.asset.anchors.shoulderY ?? 96;
  const waistY = upper?.joinY ?? upper?.asset.anchors.waistY ?? 170;
  return { shoulderY, waistY, headY: shoulderY - 49, top: shoulderY - 73 };
}

export function preparedFaceRegistration(
  artwork: GarmentArtworkResult,
  centerX: number,
) {
  const { headY } = preparedMannequinGeometry(artwork);
  return `translate(${numberText(centerX * 0.45)} ${numberText(headY - 116 * 0.55)}) scale(.55)`;
}

export function renderPreparedMannequin(
  artwork: GarmentArtworkResult,
  centerX: number,
) {
  const { shoulderY: s, waistY: w, headY } = preparedMannequinGeometry(artwork);
  const sleeved =
    artwork.topStyle === "longSleeve" ||
    (artwork.view === "back" &&
      artwork.layers.some(
        ({ asset }) => asset.coverage.topStyle === "longSleeve",
      ));
  const fill = tokens.garmentColor.champagne;
  const edge = tokens.garmentDropShadow;
  const arms = sleeved
    ? `<path data-layer="arms" d="M-34 ${s + 3} Q-50 ${s + 59} -78 ${s + 118} M34 ${s + 3} Q50 ${s + 59} 78 ${s + 118}" fill="none" stroke="${fill}" stroke-opacity="1" stroke-width="6" stroke-linecap="round"/>`
    : `<path data-layer="arms" d="M-33 ${s - 1} C-42 ${s + 9} -46 ${s + 38} -51 ${s + 59} L-59 ${s + 111} Q-60 ${s + 119} -54 ${s + 120} Q-50 ${s + 120} -49 ${s + 112} L-40 ${s + 62} L-28 ${s + 20} Z M33 ${s - 1} C42 ${s + 9} 46 ${s + 38} 51 ${s + 59} L59 ${s + 111} Q60 ${s + 119} 54 ${s + 120} Q50 ${s + 120} 49 ${s + 112} L40 ${s + 62} L28 ${s + 20} Z"/>`;
  const lowerLegs =
    artwork.silhouette === "teaLength" && artwork.view !== "upper"
      ? `<g data-layer="lower-legs"><path d="M-17 412 C-20 449 -17 486 -14 512 L-13 544 L-5 544 L-3 509 C1 471 1 444 -2 412 Z M17 412 C20 449 17 486 14 512 L13 544 L5 544 L3 509 C-1 471 -1 444 2 412 Z"/><path data-layer="mannequin-feet" d="M-13 541 Q-17 549 -23 552 Q-25 556 -18 556 L-5 552 L-5 541 Z M13 541 Q17 549 23 552 Q25 556 18 556 L5 552 L5 541 Z"/></g>`
      : "";
  const markup = `<g data-layer="mannequin" data-registration="garment-anchors" transform="translate(${numberText(centerX)} 0)" fill="${fill}" stroke="${edge}" stroke-opacity=".18" stroke-width=".8" stroke-linejoin="round"><path data-layer="mannequin-body" d="M-8 ${s - 28} L-9 ${s - 11} C-17 ${s - 7} -30 ${s - 7} -35 ${s + 2} C-34 ${s + 22} -25 ${w - 16} -23 ${w} L23 ${w} C25 ${w - 16} 34 ${s + 22} 35 ${s + 2} C30 ${s - 7} 17 ${s - 7} 9 ${s - 11} L8 ${s - 28} Z"/>${arms}${lowerLegs}<path data-layer="neck" d="M-8 ${s - 27} L-9 ${s - 11} Q0 ${s - 6} 9 ${s - 11} L8 ${s - 27}" stroke="none"/><ellipse data-layer="head" cx="0" cy="${headY}" rx="17" ry="23"/><path data-layer="collarbones" d="M-25 ${s - 2} Q-14 ${s - 5} -4 ${s} M25 ${s - 2} Q14 ${s - 5} 4 ${s}" fill="none" stroke-opacity=".12"/></g>`;
  return markup;
}
