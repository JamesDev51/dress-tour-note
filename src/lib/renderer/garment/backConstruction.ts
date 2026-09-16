import type { BackStyle } from "../../../types/domain";

export const BACK_CONSTRUCTION_STYLES = [
  "openBack",
  "vBack",
  "buttonBack",
  "corsetBack",
  "illusionBack",
  "bowBack",
] as const;

type KnownBackStyle = (typeof BACK_CONSTRUCTION_STYLES)[number];

export type BackConstructionFrame = {
  readonly width: number;
  readonly height: number;
};

export type BackConstructionBounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type BackConstructionAnchors = {
  readonly centerX: number;
  readonly necklineY: number;
  readonly necklineLeftX: number;
  readonly necklineRightX: number;
  readonly shoulderY: number;
  readonly shoulderLeftX?: number;
  readonly shoulderRightX?: number;
  readonly waistY: number;
  readonly waistLeftX: number;
  readonly waistRightX: number;
  readonly hemY: number;
};

export type BackConstructionInput = {
  readonly backStyle: BackStyle;
  readonly namespace: string;
  readonly frame: BackConstructionFrame;
  readonly anchors: BackConstructionAnchors;
  readonly nativeBowImageId?: string;
  readonly nativeBowBounds?: BackConstructionBounds;
};

export type BackConstructionViewBox = BackConstructionFrame & {
  readonly x: 0;
  readonly y: 0;
};

export type BackConstructionMarkup = {
  readonly defs: string;
  readonly markup: string;
  readonly maskId: string;
  readonly viewBox: BackConstructionViewBox;
  readonly status: "known" | "unknown";
};

type RearGeometry = {
  readonly centerX: number;
  readonly necklineY: number;
  readonly waistY: number;
  readonly waistWidth: number;
  readonly openingTopY: number;
  readonly openingBottomY: number;
  readonly openingTopWidth: number;
  readonly openingBottomWidth: number;
};

const LIGHT = "#fffdf8";
const EDGE = "#b7a69a";
const SHADOW = "#8e7c72";

function assertNever(value: never): never {
  throw new Error(`Unsupported rear construction: ${String(value)}`);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function numberText(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function idPart(value: string, fallback: string): string {
  const clean = value.replace(/[^a-zA-Z0-9_.:-]/g, "-");
  return clean.length > 0 ? clean : fallback;
}

function normalizedFrame(
  frame: BackConstructionFrame,
): BackConstructionViewBox {
  return {
    x: 0,
    y: 0,
    width: Math.max(1, finite(frame.width, 360)),
    height: Math.max(1, finite(frame.height, 640)),
  };
}

function geometryFor(
  frame: BackConstructionViewBox,
  anchors: BackConstructionAnchors,
): RearGeometry {
  const centerX = clamp(
    finite(anchors.centerX, frame.width / 2),
    0,
    frame.width,
  );
  const necklineY = clamp(
    finite(anchors.necklineY, frame.height * 0.12),
    0,
    frame.height,
  );
  const waistY = clamp(
    finite(anchors.waistY, frame.height * 0.27),
    necklineY + 1,
    frame.height,
  );
  const neckWidth = Math.max(
    1,
    finite(anchors.necklineRightX, centerX + frame.width * 0.02) -
      finite(anchors.necklineLeftX, centerX - frame.width * 0.02),
  );
  const anchorWaistWidth = Math.abs(
    finite(anchors.waistRightX, centerX + frame.width * 0.09) -
      finite(anchors.waistLeftX, centerX - frame.width * 0.09),
  );
  const waistWidth = Math.max(
    neckWidth * 2,
    anchorWaistWidth,
    frame.width * 0.08,
  );
  const upperHeight = Math.max(1, waistY - necklineY);
  return {
    centerX,
    necklineY,
    waistY,
    waistWidth,
    openingTopY: Math.min(waistY - 1, necklineY + upperHeight * 0.1),
    openingBottomY: Math.max(necklineY + 1, waistY - upperHeight * 0.08),
    openingTopWidth: Math.max(neckWidth * 1.45, waistWidth * 0.34),
    openingBottomWidth: Math.max(neckWidth * 2, waistWidth * 0.67),
  };
}

function centeredPath(
  geometry: RearGeometry,
  topWidth: number,
  bottomWidth: number,
): string {
  const { centerX, openingTopY: top, openingBottomY: bottom } = geometry;
  const topLeft = centerX - topWidth / 2;
  const topRight = centerX + topWidth / 2;
  const bottomLeft = centerX - bottomWidth / 2;
  const bottomRight = centerX + bottomWidth / 2;
  return `M${numberText(topLeft)} ${numberText(top)} C${numberText(topLeft - bottomWidth * 0.08)} ${numberText(top + (bottom - top) * 0.3)} ${numberText(bottomLeft)} ${numberText(bottom - (bottom - top) * 0.18)} ${numberText(bottomLeft)} ${numberText(bottom)} Q${numberText(centerX)} ${numberText(bottom + 4)} ${numberText(bottomRight)} ${numberText(bottom)} C${numberText(bottomRight)} ${numberText(bottom - (bottom - top) * 0.18)} ${numberText(topRight + bottomWidth * 0.08)} ${numberText(top + (bottom - top) * 0.3)} ${numberText(topRight)} ${numberText(top)} Z`;
}

function vPath(geometry: RearGeometry): string {
  const { centerX, openingTopY: top, openingBottomY: bottom } = geometry;
  const topWidth = geometry.openingTopWidth * 0.95;
  return `M${numberText(centerX - topWidth / 2)} ${numberText(top)} L${numberText(centerX)} ${numberText(bottom)} L${numberText(centerX + topWidth / 2)} ${numberText(top)} Z`;
}

function openingPath(
  style: KnownBackStyle,
  geometry: RearGeometry,
): string | undefined {
  switch (style) {
    case "openBack":
      return centeredPath(
        geometry,
        geometry.openingTopWidth,
        geometry.openingBottomWidth,
      );
    case "vBack":
      return vPath(geometry);
    case "corsetBack":
    case "illusionBack":
      return centeredPath(
        geometry,
        geometry.openingTopWidth * 0.92,
        geometry.openingBottomWidth * 0.86,
      );
    case "buttonBack":
    case "bowBack":
      return undefined;
    default:
      return assertNever(style);
  }
}

function maskMarkup(
  maskId: string,
  style: BackStyle,
  frame: BackConstructionViewBox,
  opening: string | undefined,
): string {
  const openingMarkup = opening
    ? `<path data-layer="back-opening-mask" d="${opening}" fill="black" fill-rule="nonzero"/>`
    : "";
  const kind =
    style === "openBack"
      ? ' data-opening-kind="open"'
      : style === "vBack"
        ? ' data-opening-kind="v"'
        : style === "corsetBack"
          ? ' data-opening-kind="corset"'
          : style === "illusionBack"
            ? ' data-opening-kind="illusion"'
            : "";
  return `<mask id="${escapeXml(maskId)}" x="0" y="0" width="${numberText(frame.width)}" height="${numberText(frame.height)}" maskUnits="userSpaceOnUse" mask-type="luminance" data-back-style="${escapeXml(style)}"${kind}><rect width="${numberText(frame.width)}" height="${numberText(frame.height)}" fill="white"/>${openingMarkup}</mask>`;
}

function openingDetails(
  style: "openBack" | "vBack" | "corsetBack" | "illusionBack",
  opening: string,
): string {
  const shape =
    style === "openBack"
      ? "open"
      : style === "vBack"
        ? "v"
        : style === "corsetBack"
          ? "corset"
          : "illusion";
  const edge = `<path data-layer="back-opening-edge" d="${opening}" fill="none" stroke="${LIGHT}" stroke-width="3" stroke-opacity=".92" stroke-linecap="round" stroke-linejoin="round"/>`;
  const lining = `<path data-layer="back-opening-lining" d="${opening}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity=".76" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g data-layer="back-opening" data-shape="${shape}" data-view="back" data-construction="${style}">${edge}${lining}</g>`;
}

function buttonDetails(geometry: RearGeometry): string {
  const start = geometry.openingTopY + 8;
  const end = geometry.openingBottomY - 7;
  const step = (end - start) / 6;
  const dots = Array.from({ length: 7 }, (_, index) => {
    const y = start + step * index;
    const x = geometry.centerX + Math.sin(index * 0.65) * 0.55;
    return `<circle data-button-index="${index}" cx="${numberText(x)}" cy="${numberText(y)}" r="2.1" fill="${LIGHT}" stroke="${SHADOW}" stroke-width=".75"/>`;
  }).join("");
  const x = numberText(geometry.centerX);
  return `<g data-layer="back-button-closure" data-shape="button" data-view="back" data-attachment="center-back-spine"><path data-layer="back-button-placket" d="M${x} ${numberText(start - 5)} L${x} ${numberText(end + 5)}" fill="none" stroke="${LIGHT}" stroke-width="4" stroke-opacity=".55" stroke-linecap="round"/><path data-layer="back-button-seam" d="M${x} ${numberText(start - 5)} L${x} ${numberText(end + 5)}" fill="none" stroke="${EDGE}" stroke-width="1" stroke-opacity=".8"/><g data-layer="back-buttons" data-attachment="center-back-spine">${dots}</g></g>`;
}

function corsetDetails(geometry: RearGeometry, opening: string): string {
  const top = geometry.openingTopY + 8;
  const bottom = geometry.openingBottomY - 7;
  const half = geometry.openingBottomWidth * 0.25;
  const rows = Array.from({ length: 6 }, (_, index) => {
    const y = top + ((bottom - top) * index) / 5;
    const left = geometry.centerX - half;
    const right = geometry.centerX + half;
    return `<circle data-eyelet-index="${index}" cx="${numberText(left)}" cy="${numberText(y)}" r="1.8" fill="${LIGHT}" stroke="${SHADOW}" stroke-width=".7"/><circle data-eyelet-index="${index}" cx="${numberText(right)}" cy="${numberText(y)}" r="1.8" fill="${LIGHT}" stroke="${SHADOW}" stroke-width=".7"/>`;
  }).join("");
  const laces = Array.from({ length: 5 }, (_, index) => {
    const y0 = top + ((bottom - top) * index) / 5;
    const y1 = top + ((bottom - top) * (index + 1)) / 5;
    const left = geometry.centerX - half;
    const right = geometry.centerX + half;
    return `<path data-lace-index="${index}" d="M${numberText(left)} ${numberText(y0)} L${numberText(right)} ${numberText(y1)} M${numberText(right)} ${numberText(y0)} L${numberText(left)} ${numberText(y1)}" fill="none" stroke="${SHADOW}" stroke-width="1.45" stroke-opacity=".86" stroke-linecap="round"/>`;
  }).join("");
  return `${openingDetails("corsetBack", opening)}<g data-layer="back-corset-closure" data-shape="corset" data-view="back" data-attachment="center-back-spine"><g data-layer="back-corset-eyelets">${rows}</g><g data-layer="back-corset-lacing">${laces}</g></g>`;
}

function illusionPattern(patternId: string): string {
  return `<pattern id="${escapeXml(patternId)}" data-layer="back-illusion-pattern" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M-1 1 L1 -1 M0 6 L6 0 M5 7 L7 5" fill="none" stroke="${LIGHT}" stroke-width=".8" stroke-opacity=".7"/></pattern>`;
}

function illusionDetails(
  geometry: RearGeometry,
  opening: string,
  patternId: string,
): string {
  const panel = centeredPath(
    geometry,
    geometry.openingTopWidth * 0.78,
    geometry.openingBottomWidth * 0.72,
  );
  return `${openingDetails("illusionBack", opening)}<path data-layer="back-illusion-panel" data-alpha-state="partial" d="${panel}" fill="${LIGHT}" fill-opacity=".22" stroke="none"/><path data-layer="back-illusion-mesh" data-alpha-state="partial" d="${panel}" fill="url(#${escapeXml(patternId)})" fill-opacity=".38" stroke="${LIGHT}" stroke-width="1.2" stroke-opacity=".64" stroke-linejoin="round"/>`;
}

function fallbackBow(geometry: RearGeometry): string {
  const y =
    geometry.openingTopY +
    (geometry.openingBottomY - geometry.openingTopY) * 0.38;
  const half = geometry.waistWidth * 0.38;
  const left = geometry.centerX - half;
  const right = geometry.centerX + half;
  const knot = `<circle data-layer="back-bow-knot" cx="${numberText(geometry.centerX)}" cy="${numberText(y)}" r="4.5" fill="${LIGHT}" stroke="${SHADOW}" stroke-width="1.1"/>`;
  const lobes = `<path data-layer="back-bow-loop" d="M${numberText(geometry.centerX - 3)} ${numberText(y - 2)} C${numberText(left - 8)} ${numberText(y - 17)} ${numberText(left - 20)} ${numberText(y - 8)} ${numberText(left - 16)} ${numberText(y + 7)} C${numberText(left - 12)} ${numberText(y + 19)} ${numberText(geometry.centerX - 9)} ${numberText(y + 13)} ${numberText(geometry.centerX - 3)} ${numberText(y + 3)} Z" fill="${LIGHT}" fill-opacity=".9" stroke="${SHADOW}" stroke-width="1.2" stroke-linejoin="round"/><path data-layer="back-bow-loop" d="M${numberText(geometry.centerX + 3)} ${numberText(y - 2)} C${numberText(right + 8)} ${numberText(y - 17)} ${numberText(right + 20)} ${numberText(y - 8)} ${numberText(right + 16)} ${numberText(y + 7)} C${numberText(right + 12)} ${numberText(y + 19)} ${numberText(geometry.centerX + 9)} ${numberText(y + 13)} ${numberText(geometry.centerX + 3)} ${numberText(y + 3)} Z" fill="${LIGHT}" fill-opacity=".9" stroke="${SHADOW}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const tails = `<path data-layer="back-bow-tail" d="M${numberText(geometry.centerX - 2)} ${numberText(y + 4)} C${numberText(geometry.centerX - 12)} ${numberText(y + 18)} ${numberText(geometry.centerX - 15)} ${numberText(y + 32)} ${numberText(geometry.centerX - 12)} ${numberText(y + 42)} L${numberText(geometry.centerX - 1)} ${numberText(y + 25)} Z" fill="${LIGHT}" fill-opacity=".78" stroke="${SHADOW}" stroke-width="1.1" stroke-linejoin="round"/><path data-layer="back-bow-tail" d="M${numberText(geometry.centerX + 2)} ${numberText(y + 4)} C${numberText(geometry.centerX + 12)} ${numberText(y + 18)} ${numberText(geometry.centerX + 15)} ${numberText(y + 32)} ${numberText(geometry.centerX + 12)} ${numberText(y + 42)} L${numberText(geometry.centerX + 1)} ${numberText(y + 25)} Z" fill="${LIGHT}" fill-opacity=".78" stroke="${SHADOW}" stroke-width="1.1" stroke-linejoin="round"/>`;
  return `${lobes}${knot}${tails}`;
}

function bowDetails(
  input: BackConstructionInput,
  frame: BackConstructionViewBox,
  geometry: RearGeometry,
): string {
  const fallbackBounds: BackConstructionBounds = {
    x: geometry.centerX - geometry.waistWidth * 0.6,
    y:
      geometry.openingTopY +
      (geometry.openingBottomY - geometry.openingTopY) * 0.22,
    width: geometry.waistWidth * 1.2,
    height: Math.max(
      34,
      (geometry.openingBottomY - geometry.openingTopY) * 0.55,
    ),
  };
  const bounds = input.nativeBowBounds ?? fallbackBounds;
  const bounded = {
    x: clamp(finite(bounds.x, fallbackBounds.x), 0, frame.width),
    y: clamp(finite(bounds.y, fallbackBounds.y), 0, frame.height),
    width: clamp(finite(bounds.width, fallbackBounds.width), 1, frame.width),
    height: clamp(
      finite(bounds.height, fallbackBounds.height),
      1,
      frame.height,
    ),
  };
  const nativeId = input.nativeBowImageId
    ? idPart(input.nativeBowImageId, "")
    : "";
  const bow = nativeId
    ? `<use data-layer="back-bow-native" data-native-image-id="${escapeXml(nativeId)}" href="#${escapeXml(nativeId)}" x="${numberText(bounded.x)}" y="${numberText(bounded.y)}" width="${numberText(bounded.width)}" height="${numberText(bounded.height)}" preserveAspectRatio="none"/>`
    : fallbackBow(geometry);
  return `<g data-layer="back-bow" data-shape="bow" data-view="back" data-attachment="center-back-spine">${bow}</g>`;
}

function knownMarkup(
  input: BackConstructionInput,
  style: KnownBackStyle,
  frame: BackConstructionViewBox,
  geometry: RearGeometry,
  maskId: string,
  prefix: string,
): { readonly defs: string; readonly markup: string } {
  const opening = openingPath(style, geometry);
  const patternId = `${prefix}-illusion-pattern`;
  const details =
    style === "buttonBack"
      ? buttonDetails(geometry)
      : style === "bowBack"
        ? bowDetails(input, frame, geometry)
        : style === "corsetBack" && opening
          ? corsetDetails(geometry, opening)
          : style === "illusionBack" && opening
            ? illusionDetails(geometry, opening, patternId)
            : opening
              ? openingDetails(style, opening)
              : "";
  const defs = `${maskMarkup(maskId, style, frame, opening)}${style === "illusionBack" ? illusionPattern(patternId) : ""}`;
  const markup = `<g data-layer="back-construction" data-shape="${style === "buttonBack" ? "button" : style === "bowBack" ? "bow" : style === "corsetBack" ? "corset" : style === "illusionBack" ? "illusion" : style === "vBack" ? "v" : "open"}" data-view="back" data-coordinate-frame="rear-source" data-view-box="0 0 ${numberText(frame.width)} ${numberText(frame.height)}" data-state="known" data-mask-id="${escapeXml(maskId)}">${details}</g>`;
  return { defs, markup };
}

export function buildBackConstructionMarkup(
  input: BackConstructionInput,
): BackConstructionMarkup {
  const frame = normalizedFrame(input.frame);
  const prefix = `${idPart(input.namespace, "garment")}-back-${idPart(input.backStyle, "unknown")}`;
  const maskId = `${prefix}-mask`;
  const geometry = geometryFor(frame, input.anchors);
  const style = input.backStyle;
  if (style === "unknown") {
    return {
      defs: maskMarkup(maskId, input.backStyle, frame, undefined),
      markup: `<g data-layer="back-construction" data-shape="unknown" data-view="back" data-coordinate-frame="rear-source" data-view-box="0 0 ${numberText(frame.width)} ${numberText(frame.height)}" data-state="unknown" data-mask-id="${escapeXml(maskId)}"><path data-layer="back-unknown-boundary" d="M${numberText(geometry.centerX - geometry.waistWidth * 0.36)} ${numberText(geometry.openingTopY)} Q${numberText(geometry.centerX)} ${numberText(geometry.openingBottomY)} ${numberText(geometry.centerX + geometry.waistWidth * 0.36)} ${numberText(geometry.openingTopY)}" fill="none" stroke="${EDGE}" stroke-width="2" stroke-dasharray="6 4" stroke-linecap="round"/></g>`,
      maskId,
      viewBox: frame,
      status: "unknown",
    };
  }
  const result = knownMarkup(input, style, frame, geometry, maskId, prefix);
  return {
    defs: result.defs,
    markup: result.markup,
    maskId,
    viewBox: frame,
    status: "known",
  };
}
