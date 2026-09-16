import type { Dress, Fabric } from "../../types/domain";
import {
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  topStyleOptions,
  trainOptions,
  waistlineOptions,
} from "../dress/options";
import { dressRenderTokens } from "../dress/renderTokens";
import type { ProfileAnchors, ProfileVolume } from "./dressProfiles";
import type { DressSketchMode, DressSketchView } from "./dressSvg";
import type { GarmentArtworkResult, GarmentLayer } from "./garment";

export type SvgIds = {
  readonly faceMask: string;
  readonly garmentGradient: string;
  readonly garmentMask: string;
  readonly sleeveMask: string;
  readonly trainMask: string;
};

export type PreparedArtworkVerticalBounds = {
  readonly top: number;
  readonly bottom: number;
};

export type PreparedArtworkFrameTransformInput = {
  readonly bounds: PreparedArtworkVerticalBounds;
  readonly sourceCenterX: number;
  readonly baseScale: number;
  readonly safeInset: number;
};

export type PreparedArtworkFrameTransform = {
  readonly scale: number;
  readonly translateX: number;
  readonly translateY: number;
};

export function preparedArtworkFrameTransform({
  bounds,
  sourceCenterX,
  baseScale,
  safeInset,
}: PreparedArtworkFrameTransformInput): PreparedArtworkFrameTransform {
  const availableHeight = Math.max(1, 427 - safeInset * 2);
  const sourceHeight = Math.max(1, bounds.bottom - bounds.top);
  const scale = Math.min(baseScale, availableHeight / sourceHeight);
  return {
    scale,
    translateX: 160 - sourceCenterX * scale,
    translateY: 213.5 - ((bounds.top + bounds.bottom) / 2) * scale,
  };
}

function trainExtensionFor(train: GarmentArtworkResult["train"]): number {
  switch (train) {
    case "sweep":
      return 24;
    case "chapel":
      return 52;
    case "cathedral":
      return 84;
    case "none":
    case "unknown":
    case undefined:
      return 0;
  }
}

function boundsForLayers(
  layers: readonly GarmentLayer[],
): PreparedArtworkVerticalBounds | undefined {
  const topLayers = layers.filter(({ region }) => region !== "lower");
  const bottomLayers = layers.filter(({ region }) => region !== "upper");
  const top = topLayers.length
    ? Math.min(...topLayers.map(topBoundForLayer))
    : Math.min(
        ...layers.map(
          ({ asset, joinY }) =>
            joinY ?? asset.anchors.waistY ?? asset.logicalBounds.y,
        ),
      );
  const bottom = bottomLayers.length
    ? Math.max(
        ...bottomLayers.map(
          ({ asset }) => asset.logicalBounds.y + asset.logicalBounds.height,
        ),
      )
    : Math.max(
        ...layers.map(
          ({ asset, joinY }) =>
            joinY ??
            asset.anchors.waistY ??
            asset.logicalBounds.y + asset.logicalBounds.height,
        ),
      );
  return Number.isFinite(top) && Number.isFinite(bottom) && bottom > top
    ? { top, bottom }
    : undefined;
}

function topBoundForLayer({ asset, neckline, region }: GarmentLayer): number {
  if (
    region === "upper" &&
    asset.coverage.topStyle === "offShoulder" &&
    neckline === "sweetheart"
  ) {
    return Math.max(
      asset.logicalBounds.y,
      asset.anchors.shoulderY ?? asset.logicalBounds.y,
    );
  }
  return asset.logicalBounds.y;
}

export function preparedArtworkVerticalBounds(
  artwork: GarmentArtworkResult,
  includeFace = false,
): PreparedArtworkVerticalBounds {
  const bounds =
    artwork.assetIds.length > 0
      ? boundsForLayers(artwork.layers)
      : { top: 12, bottom: 628 };
  const lowerLayer =
    artwork.layers.find(({ region }) => region === "lower") ??
    artwork.layers.find(({ region }) => region === "full");
  const trainBottom = lowerLayer?.asset.anchors.hemY
    ? Math.min(
        636,
        lowerLayer.asset.anchors.hemY + trainExtensionFor(artwork.train),
      )
    : undefined;
  const top = Math.min(bounds?.top ?? 12, includeFace ? 72 : Infinity);
  const bottom = Math.max(bounds?.bottom ?? 628, trainBottom ?? -Infinity);
  return { top, bottom };
}

export const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );

function stableSuffix(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createSvgIds(
  dress: Dress,
  view: DressSketchView,
  mode: DressSketchMode,
  namespace?: string,
): SvgIds {
  const suffix = stableSuffix(
    [
      namespace ?? "",
      dress.id,
      view,
      mode,
      dress.color,
      dress.silhouette,
      dress.waistline,
      dress.topStyle,
      dress.neckline,
      dress.backStyle ?? "unknown",
      dress.train,
      dress.fabric,
    ].join("|"),
  );
  return {
    faceMask: `face-mask-${suffix}`,
    garmentGradient: `garment-gradient-${suffix}`,
    garmentMask: `garment-mask-${suffix}`,
    sleeveMask: `sleeve-mask-${suffix}`,
    trainMask: `train-mask-${suffix}`,
  };
}

export function renderFields(dress: Dress, view: DressSketchView) {
  const field = (label: string, value: string, known: boolean, y: number) =>
    `<g data-field="${escapeXml(label)}"${known ? "" : ' data-state="unknown"'}><text x="254" y="${y}" font-size="9" fill="${dressRenderTokens.volume.contourShadow}">${escapeXml(label)}</text><text x="254" y="${y + 15}" font-size="9" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(known ? value : "미기록")}</text></g>`;
  const top = field(
    "상의",
    optionLabel(topStyleOptions, dress.topStyle),
    dress.topStyle !== "unknown",
    92,
  );
  const neckline = field(
    "네크라인",
    optionLabel(necklineOptions, dress.neckline),
    dress.neckline !== "unknown",
    132,
  );
  const silhouette = field(
    "실루엣",
    optionLabel(silhouetteOptions, dress.silhouette),
    dress.silhouette !== "unknown",
    172,
  );
  const waist = field(
    "허리선",
    optionLabel(waistlineOptions, dress.waistline),
    dress.waistline !== "unknown",
    212,
  );
  const train = field(
    "트레인",
    optionLabel(trainOptions, dress.train),
    dress.train !== "unknown",
    252,
  );
  const color = field(
    "색상",
    optionLabel(colorOptions, dress.color),
    dress.color !== "unknown",
    292,
  );
  switch (view) {
    case "full":
      return `${top}${neckline}${silhouette}${waist}${train}${color}`;
    case "upper":
      return `${top}${neckline}${waist}${color}`;
    case "back":
      return `${field("등 디자인", optionLabel(backStyleOptions, dress.backStyle), Boolean(dress.backStyle && dress.backStyle !== "unknown"), 132)}${silhouette}${train}${color}`;
  }
}

export function renderAnnotations(dress: Dress, view: DressSketchView) {
  const detailLabels = dress.details.map((detail) =>
    optionLabel(detailOptions, detail),
  );
  const notes = Object.entries(dress.customOptions ?? []).flatMap(
    ([category, note]) => {
      if (
        view === "back" &&
        ["top", "neckline", "waistline"].includes(category)
      )
        return [];
      const categoryLabel: Readonly<Record<string, string>> = {
        top: "상의",
        neckline: "네크라인",
        silhouette: "실루엣",
        fabric: "소재",
        color: "색상",
        waistline: "허리선",
        backStyle: "등 디자인",
        train: "트레인",
        details: "디테일",
      };
      return note ? [{ label: categoryLabel[category] ?? category, note }] : [];
    },
  );
  const badges = detailLabels.slice(0, 2).map((label, index) => {
    const y = 402 + index * 30;
    return `<g data-layer="detail-badge"><rect x="254" y="${y}" width="92" height="22" rx="11" fill="${dressRenderTokens.garmentColor.ivory}" stroke="${dressRenderTokens.garmentEdge.ivory}"/><text x="300" y="${y + 14}" text-anchor="middle" font-size="8" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(label)}</text></g>`;
  });
  const noteLabels = notes.slice(0, 2).map(({ label, note }, index) => {
    const y = 472 + index * 42;
    const visibleNote = note.length > 13 ? `${note.slice(0, 13)}…` : note;
    return `<g data-layer="unsupported-note"><text x="254" y="${y}" font-size="7" font-weight="700" fill="${dressRenderTokens.volume.contourShadow}">${escapeXml(label)} · 비슷하지만 달라요</text><text x="254" y="${y + 14}" font-size="8" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(visibleNote)}</text><title>${escapeXml(note)}</title></g>`;
  });
  return [...badges, ...noteLabels].join("");
}

export function renderDefinitions({
  ids,
  bodyPath,
  fill,
  sleeveMaskPath,
  trainPath,
}: {
  readonly ids: SvgIds;
  readonly bodyPath: string;
  readonly fill: string;
  readonly sleeveMaskPath?: string;
  readonly trainPath?: string;
}) {
  const sleeveMask = sleeveMaskPath
    ? `<mask id="${ids.sleeveMask}" maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="640"><rect width="320" height="640" fill="white"/><path d="${sleeveMaskPath}" fill="black" stroke="black" stroke-width="5" stroke-linejoin="round"/></mask>`
    : "";
  const trainMask = trainPath
    ? `<clipPath id="${ids.trainMask}"><path d="${trainPath}"/></clipPath>`
    : "";
  return `<defs><linearGradient id="${ids.garmentGradient}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dressRenderTokens.volume.sideShadow}" stop-opacity=".24"/><stop offset=".14" stop-color="${fill}" stop-opacity=".92"/><stop offset=".34" stop-color="${fill}"/><stop offset=".56" stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity=".42"/><stop offset=".76" stop-color="${fill}" stop-opacity=".98"/><stop offset="1" stop-color="${dressRenderTokens.volume.sideShadow}" stop-opacity=".12"/></linearGradient><clipPath id="${ids.garmentMask}"><path d="${bodyPath}"/></clipPath>${sleeveMask}${trainMask}</defs>`;
}

export type MannequinRenderOptions = {
  readonly includeBody?: boolean;
  readonly includeNeck?: boolean;
  readonly includeArms?: boolean;
  readonly includeHead?: boolean;
  readonly includeFloorShadow?: boolean;
};

export function renderMannequin(
  sleeveMaskId?: string,
  showLowerLegs = false,
  options: MannequinRenderOptions = {},
) {
  const {
    includeBody = true,
    includeNeck = true,
    includeArms = true,
    includeHead = true,
    includeFloorShadow = true,
  } = options;
  const lowerLegs = showLowerLegs
    ? `<path data-layer="lower-legs" d="M124 454 C123 489 124 527 127 558 M146 454 C147 489 146 527 143 558" fill="none" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".15" stroke-width="5" stroke-linecap="round"/><path data-layer="mannequin-feet" d="M127 555 C124 563 118 568 118 573 C123 575 130 572 135 568 M143 555 C146 563 152 568 152 573 C147 575 140 572 135 568" fill="none" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".15" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";
  const body = `${includeBody ? `<path data-layer="mannequin-body" d="M122 143 L122 160 C111 164 101 168 95 178 C87 190 84 213 88 235 C90 249 96 262 105 278 L165 278 C174 262 180 249 182 235 C186 213 183 190 175 178 C169 168 159 164 148 160 L148 143 Z" fill="${dressRenderTokens.floorShadow}" opacity=".18" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".08" stroke-width="1.5" stroke-linejoin="round"/>` : ""}${includeNeck ? `<path data-layer="neck" d="M126 143 L126 162 M144 143 L144 162" fill="none" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".2" stroke-width="6" stroke-linecap="round"/>` : ""}${includeArms ? `<path data-layer="arms" d="M96 177 C87 196 87 227 96 258 M174 177 C183 196 183 227 174 258" fill="none" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".13" stroke-width="3" stroke-linecap="round"/>` : ""}${lowerLegs}`;
  const maskedBody = sleeveMaskId
    ? `<g data-layer="sleeve-underlay-mask" mask="url(#${sleeveMaskId})">${body}</g>`
    : body;
  return `<g data-layer="mannequin">${includeFloorShadow ? `<ellipse data-layer="floor-shadow" cx="135" cy="580" rx="100" ry="8" fill="${dressRenderTokens.floorShadow}" opacity=".2"/>` : ""}${includeHead ? `<circle data-layer="head" cx="135" cy="116" r="31" fill="${dressRenderTokens.floorShadow}" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".16" stroke-width="2"/>` : ""}${maskedBody}</g>`;
}

function renderMaterialCue({
  fabric,
  profileKey,
  anchors,
  transition,
  clip,
}: {
  readonly fabric: Fabric;
  readonly profileKey: string;
  readonly anchors: ProfileAnchors;
  readonly transition: number;
  readonly clip: string;
}) {
  const lower = profileKey === "teaLength" ? 452 : 548;
  const left = anchors.waistLeft + 8;
  const right = anchors.waistRight - 8;
  const sweepingPanel = `M${left} ${transition + 5} C${left + 17} ${transition + 44} 151 408 177 ${lower} Q185 ${lower + 8} ${right + 8} ${lower + 4} C160 418 143 ${transition + 45} ${right} ${transition + 7} Z`;
  switch (fabric) {
    case "mikadoSatin":
      return `<g data-layer="material-cue" data-material="mikadoSatin" data-style="specular-plane" data-profile="${profileKey}"><path d="${sweepingPanel}" fill="${dressRenderTokens.garmentHighlight}" opacity=".2" ${clip}/><path d="M${left + 4} ${transition + 7} C${left + 19} ${transition + 54} 151 406 176 ${lower - 4}" fill="none" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".48" stroke-width="2.2" stroke-linecap="round" ${clip}/></g>`;
    case "lace":
      return `<g data-layer="material-cue" data-material="lace" data-style="matte-openwork" data-profile="${profileKey}"><path d="${sweepingPanel}" fill="${dressRenderTokens.volume.sideShadow}" opacity=".05" ${clip}/><path d="M${left - 5} ${lower - 7} Q${left + 1} ${lower + 1} ${left + 7} ${lower - 7} Q${left + 13} ${lower + 1} ${left + 19} ${lower - 7} Q${left + 25} ${lower + 1} ${left + 31} ${lower - 7} Q${left + 37} ${lower + 1} ${left + 43} ${lower - 7} Q${left + 49} ${lower + 1} ${left + 55} ${lower - 7}" fill="none" stroke="${dressRenderTokens.volume.sideShadow}" stroke-opacity=".28" stroke-width="1.4" stroke-linecap="round" ${clip}/></g>`;
    case "tulle":
      return `<g data-layer="material-cue" data-material="tulle" data-style="airy-veil" data-profile="${profileKey}"><path d="${sweepingPanel}" fill="${dressRenderTokens.volume.sideShadow}" opacity=".08" stroke="${dressRenderTokens.volume.sideShadow}" stroke-opacity=".22" stroke-width="1.4" stroke-dasharray="9 7" ${clip}/></g>`;
    case "organzaChiffon":
      return `<g data-layer="material-cue" data-material="organzaChiffon" data-style="soft-double-edge" data-profile="${profileKey}"><path d="M${left} ${transition + 6} C${left + 18} ${transition + 46} 151 414 175 ${lower - 4}" fill="none" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".32" stroke-width="2.2" stroke-linecap="round" ${clip}/><path d="M${left + 7} ${transition + 12} C${left + 25} ${transition + 52} 157 420 181 ${lower}" fill="none" stroke="${dressRenderTokens.volume.sideShadow}" stroke-opacity=".16" stroke-width="1.7" stroke-linecap="round" ${clip}/></g>`;
    case "subtleBeaded":
      return `<g data-layer="material-cue" data-material="subtleBeaded" data-style="sparse-light-points" data-profile="${profileKey}" fill="${dressRenderTokens.volume.sideShadow}" fill-opacity=".3" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".55" stroke-width=".8"><circle cx="${left + 9}" cy="${transition + 52}" r="2" ${clip}/><circle cx="${left + 22}" cy="${transition + 116}" r="1.8" ${clip}/><circle cx="${left + 36}" cy="${transition + 188}" r="2" ${clip}/></g>`;
    case "ornateBeaded":
      return `<g data-layer="material-cue" data-material="ornateBeaded" data-style="sparse-light-points" data-profile="${profileKey}" fill="${dressRenderTokens.volume.sideShadow}" fill-opacity=".32" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".56" stroke-width=".8"><circle cx="${left + 8}" cy="${transition + 48}" r="2" ${clip}/><circle cx="${left + 20}" cy="${transition + 98}" r="1.8" ${clip}/><circle cx="${left + 31}" cy="${transition + 152}" r="2.1" ${clip}/><circle cx="${left + 43}" cy="${transition + 214}" r="1.8" ${clip}/><circle cx="${left + 54}" cy="${transition + 266}" r="2" ${clip}/></g>`;
    case "glitterBeaded":
      return `<g data-layer="material-cue" data-material="glitterBeaded" data-style="sparse-light-points" data-profile="${profileKey}" fill="${dressRenderTokens.volume.sideShadow}" fill-opacity=".3" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".62" stroke-width=".9"><circle cx="${right + 2}" cy="${transition + 58}" r="2.1" ${clip}/><circle cx="${right + 17}" cy="${transition + 142}" r="1.9" ${clip}/><circle cx="${right + 29}" cy="${transition + 226}" r="2.1" ${clip}/></g>`;
    case "floral3D":
      return `<g data-layer="material-cue" data-material="floral3D" data-style="shallow-raised-form" data-profile="${profileKey}"><path d="M${left + 8} ${transition + 80} C${left + 18} ${transition + 68} ${left + 31} ${transition + 72} ${left + 36} ${transition + 85} C${left + 27} ${transition + 96} ${left + 15} ${transition + 100} ${left + 8} ${transition + 80} Z" fill="${dressRenderTokens.volume.sideShadow}" fill-opacity=".13" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".34" stroke-width="1" ${clip}/><path d="M${right + 3} ${transition + 182} C${right + 13} ${transition + 170} ${right + 26} ${transition + 174} ${right + 31} ${transition + 187} C${right + 22} ${transition + 198} ${right + 10} ${transition + 202} ${right + 3} ${transition + 182} Z" fill="${dressRenderTokens.volume.sideShadow}" fill-opacity=".12" stroke="${dressRenderTokens.garmentHighlight}" stroke-opacity=".32" stroke-width="1" ${clip}/></g>`;
    case "unknown":
      return "";
  }
}

export function renderVolumeLayers({
  ids,
  volume,
  profileKey,
  anchors,
  transition,
  fabric,
}: {
  readonly ids: SvgIds;
  readonly volume: ProfileVolume;
  readonly profileKey: string;
  readonly anchors: ProfileAnchors;
  readonly transition: number;
  readonly fabric: Fabric;
}) {
  const clip = `clip-path="url(#${ids.garmentMask})"`;
  const leftBust = `M${anchors.necklineLeft - 7} ${anchors.bustY - 2} C${anchors.necklineLeft + 1} ${anchors.bustY - 12} ${anchors.necklineLeft + 15} ${anchors.bustY - 9} 135 ${anchors.bustY + 5} C${anchors.waistLeft + 8} ${anchors.bustY + 26} ${anchors.waistLeft + 7} ${transition - 4} ${anchors.waistLeft + 5} ${transition + 2} C${anchors.waistLeft - 1} ${transition - 10} ${anchors.necklineLeft - 5} ${anchors.bustY + 15} ${anchors.necklineLeft - 7} ${anchors.bustY - 2} Z`;
  const rightBust = `M${anchors.necklineRight + 7} ${anchors.bustY - 2} C${anchors.necklineRight - 1} ${anchors.bustY - 12} ${anchors.necklineRight - 15} ${anchors.bustY - 9} 135 ${anchors.bustY + 5} C${anchors.waistRight - 8} ${anchors.bustY + 26} ${anchors.waistRight - 7} ${transition - 4} ${anchors.waistRight - 5} ${transition + 2} C${anchors.waistRight + 1} ${transition - 10} ${anchors.necklineRight + 5} ${anchors.bustY + 15} ${anchors.necklineRight + 7} ${anchors.bustY - 2} Z`;
  const accents = volume.accents
    .map(
      (path, index) =>
        `<path data-layer="profile-accent" data-accent-index="${index}" d="${path}" fill="${index % 2 === 0 ? dressRenderTokens.volume.sideShadow : dressRenderTokens.garmentHighlight}" opacity="${index % 2 === 0 ? ".11" : ".16"}" stroke="none" ${clip}/>`,
    )
    .join("");
  return `<g data-layer="profile-volume" data-profile="${profileKey}"><path data-layer="volume-shadow" d="${volume.shadow}" fill="${dressRenderTokens.volume.sideShadow}" opacity=".2" ${clip}/><path data-layer="volume-highlight" d="${volume.highlight}" fill="${dressRenderTokens.garmentHighlight}" opacity=".31" ${clip}/></g><g data-layer="profile-panel" data-profile="${profileKey}" data-profile-anchors="local"><path data-layer="bust-plane" d="${leftBust}" fill="${dressRenderTokens.garmentHighlight}" opacity=".2" ${clip}/><path data-layer="bust-plane" d="${rightBust}" fill="${dressRenderTokens.volume.sideShadow}" opacity=".075" ${clip}/></g><g data-layer="profile-accents" data-profile="${profileKey}">${accents}</g>${renderMaterialCue({ fabric, profileKey, anchors, transition, clip })}<g data-layer="profile-fold" data-profile="${profileKey}"><g data-layer="garment-fold" data-shape="asymmetric-drape"><path data-layer="asymmetric-drape" d="${volume.fold}" fill="${dressRenderTokens.volume.sideShadow}" opacity=".075" stroke="none" ${clip}/></g></g>`;
}
