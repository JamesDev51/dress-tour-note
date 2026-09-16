import type { BackStyle, Neckline, TopStyle } from "../../types/domain";
import type { ProfileAnchors } from "./dressProfiles";

type KnownTopStyle = Exclude<TopStyle, "unknown">;
type KnownNeckline = Exclude<Neckline, "unknown">;
type KnownBackStyle = Exclude<BackStyle, "unknown">;
type PathBuilder<T> = (anchors: ProfileAnchors) => string;

const topPaths: Readonly<Record<KnownTopStyle, PathBuilder<KnownTopStyle>>> = {
  strapless: () => "",
  offShoulder: (a) =>
    `M${a.sleeveLeft - 5} ${a.bustY + 67} C${a.sleeveLeft - 8} ${a.bustY + 52} ${a.sleeveLeft - 11} ${a.bustY + 31} ${a.sleeveLeft - 9} ${a.bustY + 23} C${a.sleeveLeft - 7} ${a.bustY + 11} ${a.shoulderLeft - 1} ${a.topY + 10} ${a.shoulderLeft} ${a.topY + 10} C${a.shoulderLeft + 11} ${a.topY + 7} ${a.necklineLeft + 16} ${a.bustY - 4} 135 ${a.bustY} C${a.necklineRight - 16} ${a.bustY - 4} ${a.shoulderRight - 11} ${a.topY + 7} ${a.shoulderRight} ${a.topY + 10} C${a.shoulderRight + 1} ${a.topY + 10} ${a.sleeveRight + 7} ${a.bustY + 11} ${a.sleeveRight + 9} ${a.bustY + 23} C${a.sleeveRight + 11} ${a.bustY + 31} ${a.sleeveRight + 8} ${a.bustY + 52} ${a.sleeveRight + 5} ${a.bustY + 67} L${a.sleeveRight - 4} ${a.bustY + 67} C${a.sleeveRight - 4} ${a.bustY + 52} ${a.sleeveRight - 5} ${a.bustY + 37} ${a.sleeveRight - 8} ${a.bustY + 25} C${a.sleeveRight - 12} ${a.bustY + 15} ${a.necklineRight - 11} ${a.bustY + 11} ${a.necklineRight - 5} ${a.bustY + 11} C${a.necklineRight - 17} ${a.bustY + 11} 138 ${a.bustY + 16} 135 ${a.bustY + 16} C132 ${a.bustY + 16} ${a.necklineLeft + 17} ${a.bustY + 11} ${a.necklineLeft + 5} ${a.bustY + 11} C${a.necklineLeft - 11} ${a.bustY + 11} ${a.shoulderLeft + 12} ${a.bustY + 15} ${a.shoulderLeft + 8} ${a.bustY + 25} C${a.shoulderLeft + 5} ${a.bustY + 37} ${a.shoulderLeft + 4} ${a.bustY + 52} ${a.shoulderLeft + 4} ${a.bustY + 67} L${a.sleeveLeft - 5} ${a.bustY + 67} Z`,
  strap: (a) =>
    `M${a.shoulderLeft + 1} ${a.bustY + 3} C${a.shoulderLeft + 4} ${a.bustY - 2} ${a.shoulderLeft + 7} ${a.topY - 8} ${a.shoulderLeft + 10} ${a.topY - 10} M${a.shoulderRight - 1} ${a.bustY + 3} C${a.shoulderRight - 4} ${a.bustY - 2} ${a.shoulderRight - 7} ${a.topY - 8} ${a.shoulderRight - 10} ${a.topY - 10}`,
  spaghetti: (a) =>
    `M${a.shoulderLeft + 4} ${a.bustY + 3} C${a.shoulderLeft + 6} ${a.bustY - 3} ${a.shoulderLeft + 9} ${a.topY - 8} ${a.shoulderLeft + 11} ${a.topY - 12} M${a.shoulderRight - 4} ${a.bustY + 3} C${a.shoulderRight - 6} ${a.bustY - 3} ${a.shoulderRight - 9} ${a.topY - 8} ${a.shoulderRight - 11} ${a.topY - 12}`,
  wideStrap: (a) =>
    `M${a.shoulderLeft - 1} ${a.bustY + 4} L${a.shoulderLeft + 2} ${a.topY - 12} L${a.shoulderLeft + 14} ${a.topY - 5} M${a.shoulderRight + 1} ${a.bustY + 4} L${a.shoulderRight - 2} ${a.topY - 12} L${a.shoulderRight - 14} ${a.topY - 5}`,
  halter: (a) =>
    `M${a.shoulderLeft + 1} ${a.bustY + 4} L${a.necklineLeft + 10} ${a.topY - 12} Q135 ${a.topY - 3} ${a.necklineRight - 10} ${a.topY - 12} L${a.shoulderRight - 1} ${a.bustY + 4}`,
  oneShoulder: (a) =>
    `M${a.shoulderLeft - 1} ${a.bustY + 5} C${a.shoulderLeft + 17} ${a.bustY - 3} ${a.necklineRight - 4} ${a.topY - 9} ${a.shoulderRight} ${a.topY - 3} L${a.shoulderRight + 1} ${a.bustY + 6}`,
  shortSleeve: (a) =>
    `M${a.shoulderLeft} ${a.bustY + 3} C${a.sleeveLeft - 6} ${a.bustY + 2} ${a.sleeveLeft - 11} ${a.bustY + 12} ${a.sleeveLeft - 14} ${a.bustY + 24} C${a.sleeveLeft - 6} ${a.bustY + 31} ${a.shoulderLeft + 1} ${a.bustY + 27} ${a.shoulderLeft + 6} ${a.bustY + 17} Z M${a.shoulderRight} ${a.bustY + 3} C${a.sleeveRight + 6} ${a.bustY + 2} ${a.sleeveRight + 11} ${a.bustY + 12} ${a.sleeveRight + 14} ${a.bustY + 24} C${a.sleeveRight + 6} ${a.bustY + 27} ${a.shoulderRight - 1} ${a.bustY + 31} ${a.shoulderRight - 6} ${a.bustY + 17} Z`,
  longSleeve: (a) =>
    `M${a.shoulderLeft} ${a.topY + 10} C${a.shoulderLeft - 5} ${a.topY + 16} ${a.sleeveLeft - 7} ${a.bustY + 9} ${a.sleeveLeft - 7} ${a.bustY + 9} C${a.sleeveLeft - 9} ${a.bustY + 20} ${a.sleeveLeft - 10} ${a.bustY + 35} ${a.sleeveLeft - 10} ${a.bustY + 39} C${a.sleeveLeft - 10} ${a.bustY + 49} ${a.sleeveLeft - 8} ${a.bustY + 61} ${a.sleeveLeft - 5} ${a.bustY + 64} L${a.sleeveLeft - 5} ${a.bustY + 67} L${a.sleeveLeft + 4} ${a.bustY + 67} C${a.sleeveLeft + 5} ${a.bustY + 59} ${a.sleeveLeft + 5} ${a.bustY + 52} ${a.sleeveLeft + 7} ${a.bustY + 45} C${a.sleeveLeft + 7} ${a.bustY + 33} ${a.sleeveLeft + 8} ${a.bustY + 25} ${a.shoulderLeft + 6} ${a.bustY + 11} C${a.shoulderLeft + 6} ${a.topY + 16} ${a.shoulderLeft + 3} ${a.topY + 11} ${a.shoulderLeft} ${a.topY + 10} Z M${a.shoulderRight} ${a.topY + 10} C${a.shoulderRight + 5} ${a.topY + 16} ${a.sleeveRight + 7} ${a.bustY + 9} ${a.sleeveRight + 7} ${a.bustY + 9} C${a.sleeveRight + 9} ${a.bustY + 20} ${a.sleeveRight + 10} ${a.bustY + 35} ${a.sleeveRight + 10} ${a.bustY + 39} C${a.sleeveRight + 10} ${a.bustY + 49} ${a.sleeveRight + 8} ${a.bustY + 61} ${a.sleeveRight + 5} ${a.bustY + 64} L${a.sleeveRight + 5} ${a.bustY + 67} L${a.sleeveRight - 4} ${a.bustY + 67} C${a.sleeveRight - 5} ${a.bustY + 59} ${a.sleeveRight - 5} ${a.bustY + 52} ${a.sleeveRight - 7} ${a.bustY + 45} C${a.sleeveRight - 7} ${a.bustY + 33} ${a.sleeveRight - 8} ${a.bustY + 25} ${a.shoulderRight - 6} ${a.bustY + 11} C${a.shoulderRight - 6} ${a.topY + 16} ${a.shoulderRight - 3} ${a.topY + 11} ${a.shoulderRight} ${a.topY + 10} Z`,
};

const necklinePaths: Readonly<
  Record<KnownNeckline, PathBuilder<KnownNeckline>>
> = {
  straight: (a) =>
    `M${a.necklineLeft} ${a.bustY - 11} L${a.necklineRight} ${a.bustY - 11}`,
  sweetheart: (a) =>
    `M${a.necklineLeft} ${a.bustY - 11} Q${a.necklineLeft + 13} ${a.bustY - 22} 135 ${a.bustY - 8} Q${a.necklineRight - 13} ${a.bustY - 22} ${a.necklineRight} ${a.bustY - 11}`,
  v: (a) =>
    `M${a.necklineLeft} ${a.bustY - 14} L135 ${a.bustY + 10} L${a.necklineRight} ${a.bustY - 14}`,
  square: (a) =>
    `M${a.necklineLeft + 2} ${a.topY - 5} L${a.necklineLeft + 2} ${a.bustY - 7} L${a.necklineRight - 2} ${a.bustY - 7} L${a.necklineRight - 2} ${a.topY - 5}`,
  scoop: (a) =>
    `M${a.necklineLeft + 1} ${a.bustY - 14} Q135 ${a.bustY + 12} ${a.necklineRight - 1} ${a.bustY - 14}`,
  high: (a) =>
    `M${a.necklineLeft + 8} ${a.topY + 3} Q135 ${a.topY + 12} ${a.necklineRight - 8} ${a.topY + 3}`,
  illusion: (a) =>
    `M${a.necklineLeft + 1} ${a.bustY - 14} Q135 ${a.bustY + 10} ${a.necklineRight - 1} ${a.bustY - 14} M${a.necklineLeft + 8} ${a.topY + 3} Q135 ${a.topY + 12} ${a.necklineRight - 8} ${a.topY + 3}`,
  asymmetric: (a) =>
    `M${a.necklineLeft} ${a.bustY - 8} Q${a.necklineLeft + 25} ${a.topY + 1} ${a.necklineRight} ${a.topY + 4}`,
};

const backPaths: Readonly<Record<KnownBackStyle, PathBuilder<KnownBackStyle>>> =
  {
    openBack: (a) =>
      `M${a.necklineLeft - 1} ${a.backTop} Q135 ${a.backBottom - 4} ${a.necklineRight + 1} ${a.backTop}`,
    vBack: (a) =>
      `M${a.necklineLeft - 1} ${a.backTop} L135 ${a.backBottom} L${a.necklineRight + 1} ${a.backTop}`,
    buttonBack: (a) => `M135 ${a.backTop - 2} L135 ${a.backBottom + 6}`,
    corsetBack: (a) =>
      `M${a.necklineLeft + 7} ${a.backTop + 8} L${a.necklineRight - 7} ${a.backBottom} M${a.necklineRight - 7} ${a.backTop + 8} L${a.necklineLeft + 7} ${a.backBottom} M${a.necklineLeft + 8} ${a.backTop + 28} L${a.necklineRight - 8} ${a.backTop + 34}`,
    illusionBack: (a) =>
      `M${a.necklineLeft - 1} ${a.backTop} Q135 ${a.backBottom - 14} ${a.necklineRight + 1} ${a.backTop} M${a.necklineLeft + 7} ${a.backTop + 10} L${a.necklineRight - 7} ${a.backBottom}`,
    bowBack: (a) =>
      `M135 ${a.backTop + 39} C126 ${a.backTop + 24} ${a.necklineLeft - 2} ${a.backTop + 19} ${a.necklineLeft - 2} ${a.backTop + 32} C${a.necklineLeft - 2} ${a.backTop + 46} 120 ${a.backTop + 50} 135 ${a.backTop + 43} C150 ${a.backTop + 50} ${a.necklineRight + 2} ${a.backTop + 46} ${a.necklineRight + 2} ${a.backTop + 32} C${a.necklineRight + 2} ${a.backTop + 19} 144 ${a.backTop + 24} 135 ${a.backTop + 39} Z`,
  };

const connectedOffShoulderPath = (a: ProfileAnchors) => {
  const left = a.necklineLeft - 9;
  const right = a.necklineRight + 9;
  const armLeft = a.sleeveLeft - 22;
  const armRight = a.sleeveRight + 18;
  const top = a.bustY - 6;
  const cuff = a.bustY + 45;
  return `M${left} ${top} C${left + 10} ${top - 8} ${left + 22} ${top - 6} ${left + 31} ${top + 1} C${left + 36} ${top + 5} 133 ${top + 11} 135 ${top + 12} C137 ${top + 11} ${right - 36} ${top + 5} ${right - 31} ${top + 1} C${right - 22} ${top - 6} ${right - 10} ${top - 8} ${right} ${top} C${armRight - 3} ${top + 7} ${armRight} ${top + 14} ${armRight} ${top + 21} C${armRight} ${top + 32} ${armRight - 3} ${cuff - 2} ${armRight - 9} ${cuff + 4} C${armRight - 15} ${cuff + 7} ${a.sleeveRight - 3} ${cuff - 3} ${a.sleeveRight - 5} ${cuff - 12} C${a.sleeveRight - 7} ${a.bustY + 24} ${a.sleeveRight - 12} ${a.bustY + 12} ${right - 18} ${a.bustY + 6} C${right - 24} ${a.bustY + 2} 143 ${a.bustY + 2} 139 ${a.bustY + 8} C137 ${a.bustY + 11} 136 ${a.bustY + 15} 135 ${a.bustY + 18} C134 ${a.bustY + 15} 133 ${a.bustY + 11} 131 ${a.bustY + 8} C127 ${a.bustY + 2} ${left + 24} ${a.bustY + 2} ${left + 18} ${a.bustY + 6} C${a.sleeveLeft + 12} ${a.bustY + 12} ${a.sleeveLeft + 7} ${a.bustY + 24} ${a.sleeveLeft + 5} ${cuff - 12} C${a.sleeveLeft + 3} ${cuff - 3} ${armLeft + 15} ${cuff + 7} ${armLeft + 9} ${cuff + 4} C${armLeft + 3} ${cuff - 2} ${armLeft} ${top + 32} ${armLeft} ${top + 21} C${armLeft} ${top + 14} ${armLeft + 7} ${top + 7} ${left} ${top} Z`;
};

const connectedLongSleevePath = (a: ProfileAnchors) => {
  const outerLeft = a.sleeveLeft - 21;
  const innerLeft = a.sleeveLeft + 4;
  const outerRight = a.sleeveRight + 21;
  const innerRight = a.sleeveRight - 4;
  const cuffY = a.bustY + 67;
  return `M${a.shoulderLeft} ${a.topY + 1} C${a.shoulderLeft - 7} ${a.topY + 10} ${outerLeft + 2} ${a.bustY + 14} ${outerLeft} ${a.bustY + 31} C${outerLeft - 3} ${a.bustY + 50} ${outerLeft - 2} ${cuffY - 10} ${outerLeft} ${cuffY - 2} C${outerLeft + 2} ${cuffY + 7} ${innerLeft - 2} ${cuffY + 8} ${innerLeft} ${cuffY} L${innerLeft} ${cuffY} C${innerLeft + 1} ${cuffY - 12} ${innerLeft + 1} ${a.bustY + 43} ${innerLeft + 6} ${a.bustY + 25} C${innerLeft + 10} ${a.bustY + 12} ${a.shoulderLeft + 12} ${a.topY + 8} ${a.shoulderLeft} ${a.topY + 1} Z M${a.shoulderRight} ${a.topY + 1} C${a.shoulderRight + 7} ${a.topY + 10} ${outerRight - 2} ${a.bustY + 14} ${outerRight} ${a.bustY + 31} C${outerRight + 3} ${a.bustY + 50} ${outerRight + 2} ${cuffY - 10} ${outerRight} ${cuffY - 2} C${outerRight - 2} ${cuffY + 7} ${innerRight + 2} ${cuffY + 8} ${innerRight} ${cuffY} L${innerRight} ${cuffY} C${innerRight - 1} ${cuffY - 12} ${innerRight - 1} ${a.bustY + 43} ${innerRight - 6} ${a.bustY + 25} C${innerRight - 10} ${a.bustY + 12} ${a.shoulderRight - 12} ${a.topY + 8} ${a.shoulderRight} ${a.topY + 1} Z`;
};

const connectedShortSleevePath = (a: ProfileAnchors) => {
  const left = a.sleeveLeft - 15;
  const right = a.sleeveRight + 15;
  return `M${a.shoulderLeft} ${a.bustY + 1} C${left + 8} ${a.bustY - 4} ${left - 2} ${a.bustY + 5} ${left} ${a.bustY + 19} C${left + 2} ${a.bustY + 31} ${left + 9} ${a.bustY + 35} ${left + 18} ${a.bustY + 28} C${left + 16} ${a.bustY + 17} ${left + 14} ${a.bustY + 8} ${a.shoulderLeft + 8} ${a.bustY + 5} Z M${a.shoulderRight} ${a.bustY + 1} C${right - 8} ${a.bustY - 4} ${right + 2} ${a.bustY + 5} ${right} ${a.bustY + 19} C${right - 2} ${a.bustY + 31} ${right - 9} ${a.bustY + 35} ${right - 18} ${a.bustY + 28} C${right - 16} ${a.bustY + 17} ${right - 14} ${a.bustY + 8} ${a.shoulderRight - 8} ${a.bustY + 5} Z`;
};

const integratedTopPaths: Readonly<
  Record<KnownTopStyle, PathBuilder<KnownTopStyle>>
> = {
  ...topPaths,
  offShoulder: connectedOffShoulderPath,
  shortSleeve: connectedShortSleevePath,
  longSleeve: connectedLongSleevePath,
};

const sleeveStyles = ["offShoulder", "shortSleeve", "longSleeve"] as const;
type SleeveStyle = (typeof sleeveStyles)[number];

function isSleeveStyle(style: KnownTopStyle): style is SleeveStyle {
  return sleeveStyles.some((candidate) => candidate === style);
}

export function topConstructionMarkup({
  style,
  anchors,
  edge,
  gradientId,
}: {
  readonly style: KnownTopStyle;
  readonly anchors: ProfileAnchors;
  readonly edge: string;
  readonly gradientId: string;
}) {
  if (style === "strapless")
    return '<g data-layer="top-structure" data-shape="strapless" data-integrated="true"/>';
  const path = integratedTopPaths[style](anchors);
  if (isSleeveStyle(style)) {
    const construction =
      style === "offShoulder" ? "shoulder-band" : "arm-length";
    const attachment = style === "offShoulder" ? "upper-arm" : "wrist";
    return `<g data-layer="sleeve-construction" data-shape="${style}" data-construction="${construction}" data-attachment="${attachment}" data-joined-to="armholes" data-profile-anchors="local"><path d="${path}" fill="url(#${gradientId})" fill-opacity=".78" stroke="${edge}" stroke-opacity=".34" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  return `<path data-layer="top-detail" data-shape="${style}" d="${path}" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function sleeveMaskPathFor(
  style: KnownTopStyle,
  anchors: ProfileAnchors,
): string | undefined {
  return isSleeveStyle(style) ? integratedTopPaths[style](anchors) : undefined;
}

export function necklinePathFor(style: KnownNeckline, anchors: ProfileAnchors) {
  return necklinePaths[style](anchors);
}

export function backConstructionMarkup({
  style,
  anchors,
  edge,
  fill,
}: {
  readonly style: KnownBackStyle;
  readonly anchors: ProfileAnchors;
  readonly edge: string;
  readonly fill: string;
}) {
  const path = backPaths[style](anchors);
  const bowY = anchors.backTop + 39;
  const extra =
    style === "buttonBack"
      ? `<g data-layer="back-buttons" fill="${edge}"><circle cx="135" cy="204" r="2.2"/><circle cx="135" cy="216" r="2.2"/><circle cx="135" cy="228" r="2.2"/><circle cx="135" cy="240" r="2.2"/><circle cx="135" cy="252" r="2.2"/></g>`
      : style === "bowBack"
        ? `<circle data-layer="back-bow-knot" data-attachment="back-waist" cx="135" cy="${bowY}" r="4" fill="${fill}" stroke="${edge}" stroke-width="1.6"/><path data-layer="back-bow-tail" data-attachment="back-waist" d="M132 ${bowY + 3} C127 ${bowY + 14} 120 ${bowY + 22} 118 ${bowY + 35} C123 ${bowY + 42} 129 ${bowY + 34} 135 ${bowY + 18} Z" fill="${fill}" fill-opacity=".72" stroke="${edge}" stroke-width="1.8" stroke-linejoin="round"/><path data-layer="back-bow-tail" data-attachment="back-waist" d="M138 ${bowY + 4} C144 ${bowY + 17} 153 ${bowY + 27} 157 ${bowY + 46} C151 ${bowY + 51} 144 ${bowY + 40} 136 ${bowY + 20} Z" fill="${fill}" fill-opacity=".72" stroke="${edge}" stroke-width="1.8" stroke-linejoin="round"/>`
        : "";
  const detail =
    style === "bowBack"
      ? `<g data-layer="back-bow-lobes"><path data-layer="back-detail" d="${path}" fill="${fill}" fill-opacity=".52" stroke="${edge}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>`
      : `<path data-layer="back-detail" d="${path}" fill="none" fill-opacity=".52" stroke="${edge}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g data-layer="back-construction" data-shape="${style}">${detail}${extra}</g>`;
}
