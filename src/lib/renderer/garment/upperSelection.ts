import type { Neckline, TopStyle } from "../../../types/domain";

export const UPPER_SELECTION_SOURCE_FRAME = {
  width: 1024,
  height: 1536,
} as const;

export type UpperTemplateKind = "base" | "longHigh" | "upperFamily" | "matched";

export type UpperSourceAnchors = {
  readonly centerX: number;
  readonly necklineY?: number;
  readonly necklineLeftX?: number;
  readonly necklineRightX?: number;
  readonly shoulderY?: number;
  readonly shoulderLeftX?: number;
  readonly shoulderRightX?: number;
  readonly waistY?: number;
  readonly waistLeftX?: number;
  readonly waistRightX?: number;
  readonly sleeveEndY?: number;
};

export type UpperSelectionInput = {
  readonly namespace: string;
  readonly topStyle: TopStyle;
  readonly neckline: Neckline;
  readonly sourceAnchors: UpperSourceAnchors;
  readonly templateKind: UpperTemplateKind;
  readonly nativeMatched?: boolean;
  readonly nativeSourceMaskId?: string;
};

export type UpperAttachmentWindow = {
  readonly kind:
    | "off-shoulder-band"
    | "shoulder-strap"
    | "spaghetti-strap"
    | "wide-strap"
    | "halter-side"
    | "one-shoulder"
    | "short-sleeve"
    | "long-sleeve";
  readonly path: string;
  readonly operation: "retain-source";
  readonly extendsPastJoin: boolean;
};

export type UpperSelectionEdge = {
  readonly kind: Exclude<Neckline, "unknown"> | "native" | "unknown";
  readonly path: string;
  readonly topY: number;
  readonly depthY: number;
  readonly operation: "cut" | "preserve";
};

export type UpperYokeInstructions = {
  readonly kind: "none" | "generic-authored-center" | "native";
  readonly path: string;
  readonly opacity: number;
  readonly maskId?: string;
  readonly operation: "overlay-source" | "preserve-native" | "none";
};

export type UpperSelectionReason =
  | "unknown-selection"
  | "invalid-source-anchors"
  | "invalid-namespace"
  | "invalid-native-source-mask";

export type UpperSelectionMarkup = {
  readonly coordinateFrame: "source-pixels";
  readonly sourceFrame: typeof UPPER_SELECTION_SOURCE_FRAME;
  readonly status: "ready" | "partial";
  readonly reason?: UpperSelectionReason;
  readonly defs: string;
  readonly maskId?: string;
  readonly selectionMaskId?: string;
  readonly nativeSourceMaskId?: string;
  readonly edge: UpperSelectionEdge;
  readonly yokeInstructions: UpperYokeInstructions;
  readonly attachmentWindows: readonly UpperAttachmentWindow[];
};

type KnownTopStyle = Exclude<TopStyle, "unknown">;
type KnownNeckline = Exclude<Neckline, "unknown">;
type NormalizedAnchors = {
  readonly centerX: number;
  readonly necklineY: number;
  readonly necklineLeftX: number;
  readonly necklineRightX: number;
  readonly shoulderY: number;
  readonly shoulderLeftX: number;
  readonly shoulderRightX: number;
  readonly waistY: number;
  readonly waistLeftX: number;
  readonly waistRightX: number;
  readonly sleeveEndY: number;
};
type EdgeShape = {
  readonly path: string;
  readonly outerY: number;
  readonly depthY: number;
};

const FRAME = UPPER_SELECTION_SOURCE_FRAME;

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function numberText(value: number): string {
  return (Math.abs(value) < 0.005 ? 0 : value)
    .toFixed(2)
    .replace(/\.?(0+)$/, "");
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&apos;");
}

function safeNamespace(value: string): string | undefined {
  const clean = value.replace(/[^a-zA-Z0-9_.:-]/g, "-").replace(/^-+|-+$/g, "");
  return clean.length > 0 && /^[A-Za-z_]/.test(clean) ? clean : undefined;
}

function validId(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value);
}

function optional(
  value: number | undefined,
  fallback: number,
): number | undefined {
  if (value === undefined) return fallback;
  return finite(value) ? value : undefined;
}

function normalizeAnchors(
  source: UpperSourceAnchors,
): NormalizedAnchors | undefined {
  const centerX = source.centerX;
  const necklineY = optional(source.necklineY, 74);
  const necklineLeftX = optional(source.necklineLeftX, centerX - 42);
  const necklineRightX = optional(source.necklineRightX, centerX + 42);
  const shoulderY = optional(source.shoulderY, (necklineY ?? 74) + 46);
  const shoulderLeftX = optional(source.shoulderLeftX, centerX - 140);
  const shoulderRightX = optional(source.shoulderRightX, centerX + 140);
  const waistY = optional(source.waistY, 342);
  const waistLeftX = optional(source.waistLeftX, centerX - 92);
  const waistRightX = optional(source.waistRightX, centerX + 92);
  const sleeveEndY = optional(source.sleeveEndY, (waistY ?? 342) + 182);
  if (
    necklineY === undefined ||
    necklineLeftX === undefined ||
    necklineRightX === undefined ||
    shoulderY === undefined ||
    shoulderLeftX === undefined ||
    shoulderRightX === undefined ||
    waistY === undefined ||
    waistLeftX === undefined ||
    waistRightX === undefined ||
    sleeveEndY === undefined
  )
    return undefined;
  const values = [
    centerX,
    necklineY,
    necklineLeftX,
    necklineRightX,
    shoulderY,
    shoulderLeftX,
    shoulderRightX,
    waistY,
    waistLeftX,
    waistRightX,
    sleeveEndY,
  ];
  if (values.some((value) => !finite(value))) return undefined;
  if (
    centerX < 0 ||
    centerX > FRAME.width ||
    necklineLeftX < 0 ||
    necklineRightX > FRAME.width ||
    necklineLeftX >= necklineRightX ||
    shoulderLeftX < 0 ||
    shoulderRightX > FRAME.width ||
    shoulderLeftX >= shoulderRightX ||
    waistLeftX < 0 ||
    waistRightX > FRAME.width ||
    waistLeftX >= waistRightX ||
    necklineY < 0 ||
    shoulderY <= necklineY ||
    waistY <= shoulderY ||
    waistY >= FRAME.height ||
    sleeveEndY <= shoulderY ||
    sleeveEndY >= FRAME.height
  )
    return undefined;
  return {
    centerX,
    necklineY,
    necklineLeftX,
    necklineRightX,
    shoulderY,
    shoulderLeftX,
    shoulderRightX,
    waistY,
    waistLeftX,
    waistRightX,
    sleeveEndY,
  };
}

function bodyPath(
  a: NormalizedAnchors,
  lowOffShoulder: boolean,
  lowOffShoulderSweetheart: boolean,
): string {
  if (lowOffShoulder) {
    const topY = clamp(a.shoulderY + 46, FRAME.height);
    const left = clamp(a.centerX - 100, FRAME.width);
    const right = clamp(a.centerX + 100, FRAME.width);
    if (lowOffShoulderSweetheart) {
      const cupY = clamp(a.shoulderY + 26, FRAME.height);
      const cupLeft = clamp(a.centerX - 62, FRAME.width);
      const cupRight = clamp(a.centerX + 62, FRAME.width);
      return `M${numberText(left)} ${numberText(topY)} C${numberText(left + 6)} ${numberText(topY - 10)} ${numberText(left + 18)} ${numberText(cupY)} ${numberText(cupLeft)} ${numberText(cupY)} C${numberText(cupLeft + 16)} ${numberText(cupY)} ${numberText(a.centerX - 36)} ${numberText(cupY + 30)} ${numberText(a.centerX)} ${numberText(cupY + 34)} C${numberText(a.centerX + 36)} ${numberText(cupY + 30)} ${numberText(cupRight - 16)} ${numberText(cupY)} ${numberText(cupRight)} ${numberText(cupY)} C${numberText(right - 18)} ${numberText(cupY)} ${numberText(right - 6)} ${numberText(topY - 10)} ${numberText(right)} ${numberText(topY)} C${numberText(right + 8)} ${numberText(topY + 42)} ${numberText(a.waistRightX + 8)} ${numberText(a.waistY - 46)} ${numberText(a.waistRightX)} ${numberText(a.waistY)} L${numberText(a.waistLeftX)} ${numberText(a.waistY)} C${numberText(a.waistLeftX - 8)} ${numberText(a.waistY - 46)} ${numberText(left - 8)} ${numberText(topY + 42)} ${numberText(left)} ${numberText(topY)} Z`;
    }
    return `M${numberText(left)} ${numberText(topY)} C${numberText(left - 8)} ${numberText(topY + 42)} ${numberText(a.waistLeftX - 8)} ${numberText(a.waistY - 46)} ${numberText(a.waistLeftX)} ${numberText(a.waistY)} L${numberText(a.waistRightX)} ${numberText(a.waistY)} C${numberText(a.waistRightX + 8)} ${numberText(a.waistY - 46)} ${numberText(right + 8)} ${numberText(topY + 42)} ${numberText(right)} ${numberText(topY)} Z`;
  }
  const left = clamp(a.necklineLeftX - 18, FRAME.width);
  const right = clamp(a.necklineRightX + 18, FRAME.width);
  return `M${numberText(left)} ${numberText(a.necklineY)} C${numberText(left - 18)} ${numberText(a.necklineY + 22)} ${numberText(a.shoulderLeftX + 18)} ${numberText(a.shoulderY - 18)} ${numberText(a.waistLeftX)} ${numberText(a.waistY)} L${numberText(a.waistRightX)} ${numberText(a.waistY)} C${numberText(a.shoulderRightX - 18)} ${numberText(a.shoulderY - 18)} ${numberText(right + 18)} ${numberText(a.necklineY + 22)} ${numberText(right)} ${numberText(a.necklineY)} Z`;
}

function necklineShape(
  neckline: KnownNeckline,
  a: NormalizedAnchors,
  padding = 30,
): EdgeShape {
  const left = clamp(a.necklineLeftX - padding, FRAME.width);
  const right = clamp(a.necklineRightX + padding, FRAME.width);
  const outerY = clamp(a.shoulderY + 8, FRAME.height);
  const straightY = clamp(a.shoulderY + 34, FRAME.height);
  const sweetheartY = clamp(a.shoulderY + 62, FRAME.height);
  const vY = clamp(a.shoulderY + 86, FRAME.height);
  switch (neckline) {
    case "straight":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(straightY)} H${numberText(left)} Z`,
        outerY,
        depthY: straightY,
      };
    case "sweetheart":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(outerY)} C${numberText(right - 34)} ${numberText(outerY + 2)} ${numberText(a.centerX + 22)} ${numberText(sweetheartY)} ${numberText(a.centerX)} ${numberText(sweetheartY)} C${numberText(a.centerX - 22)} ${numberText(sweetheartY)} ${numberText(left + 34)} ${numberText(outerY + 2)} ${numberText(left)} ${numberText(outerY)} Z`,
        outerY,
        depthY: sweetheartY,
      };
    case "v":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(outerY)} L${numberText(a.centerX)} ${numberText(vY)} L${numberText(left)} ${numberText(outerY)} Z`,
        outerY,
        depthY: vY,
      };
    case "square":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(clamp(a.shoulderY + 46, FRAME.height))} H${numberText(left)} Z`,
        outerY,
        depthY: clamp(a.shoulderY + 46, FRAME.height),
      };
    case "scoop":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(outerY)} C${numberText(right - 12)} ${numberText(outerY + 52)} ${numberText(a.centerX + 48)} ${numberText(clamp(a.shoulderY + 96, FRAME.height))} ${numberText(a.centerX)} ${numberText(clamp(a.shoulderY + 96, FRAME.height))} C${numberText(a.centerX - 48)} ${numberText(clamp(a.shoulderY + 96, FRAME.height))} ${numberText(left + 12)} ${numberText(outerY + 52)} ${numberText(left)} ${numberText(outerY)} Z`,
        outerY,
        depthY: clamp(a.shoulderY + 96, FRAME.height),
      };
    case "high":
      return { path: "", outerY, depthY: outerY };
    case "illusion":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(outerY)} C${numberText(right - 34)} ${numberText(outerY + 2)} ${numberText(a.centerX + 22)} ${numberText(clamp(a.shoulderY + 54, FRAME.height))} ${numberText(a.centerX)} ${numberText(clamp(a.shoulderY + 54, FRAME.height))} C${numberText(a.centerX - 22)} ${numberText(clamp(a.shoulderY + 54, FRAME.height))} ${numberText(left + 34)} ${numberText(outerY + 2)} ${numberText(left)} ${numberText(outerY)} Z`,
        outerY,
        depthY: clamp(a.shoulderY + 54, FRAME.height),
      };
    case "asymmetric":
      return {
        path: `M${numberText(left)} 0 H${numberText(right)} V${numberText(outerY)} L${numberText(left)} ${numberText(clamp(a.shoulderY + 58, FRAME.height))} Z`,
        outerY,
        depthY: clamp(a.shoulderY + 58, FRAME.height),
      };
  }
}

function mirroredSidePath(
  a: NormalizedAnchors,
  left: boolean,
  endY: number,
  kind: string,
): string {
  const c = a.centerX;
  const side = left ? -1 : 1;
  const outerTop = c + side * 140;
  const innerTop = c + side * 84;
  const outerJoin = c + side * 210;
  const innerJoin = c + side * 150;
  const outerEnd = c + side * 270;
  const innerEnd = c + side * 230;
  const start = outerTop;
  const first = left
    ? `M${numberText(start)} ${numberText(a.shoulderY)} C${numberText(outerJoin)} ${numberText(a.shoulderY + 100)} ${numberText(outerEnd)} ${numberText(endY - 38)} ${numberText(outerEnd)} ${numberText(endY)} L${numberText(innerEnd)} ${numberText(endY)} C${numberText(innerJoin)} ${numberText(endY - 38)} ${numberText(innerTop)} ${numberText(a.shoulderY + 48)} ${numberText(innerTop)} ${numberText(a.shoulderY)} Z`
    : `M${numberText(start)} ${numberText(a.shoulderY)} C${numberText(outerJoin)} ${numberText(a.shoulderY + 100)} ${numberText(outerEnd)} ${numberText(endY - 38)} ${numberText(outerEnd)} ${numberText(endY)} L${numberText(innerEnd)} ${numberText(endY)} C${numberText(innerJoin)} ${numberText(endY - 38)} ${numberText(innerTop)} ${numberText(a.shoulderY + 48)} ${numberText(innerTop)} ${numberText(a.shoulderY)} Z`;
  return `<path data-attachment-kind="${xml(kind)}" d="${first}" fill="white" fill-rule="nonzero" clip-rule="nonzero"/>`;
}

function sideBandPath(
  a: NormalizedAnchors,
  left: boolean,
  endY: number,
  kind: string,
): string {
  const side = left ? -1 : 1;
  const c = a.centerX;
  const y0 = a.shoulderY + 40;
  const outer0 = c + side * 168;
  const inner0 = c + side * 80;
  const outer1 = c + side * 174;
  const inner1 = c + side * 80;
  const path = left
    ? `M${numberText(outer0)} ${numberText(y0)} C${numberText(outer1)} ${numberText(y0 + 24)} ${numberText(outer1)} ${numberText(endY - 24)} ${numberText(outer1)} ${numberText(endY)} L${numberText(inner1)} ${numberText(endY)} C${numberText(inner1)} ${numberText(endY - 28)} ${numberText(inner0)} ${numberText(y0 + 18)} ${numberText(inner0)} ${numberText(y0)} Z`
    : `M${numberText(inner0)} ${numberText(y0)} C${numberText(inner1)} ${numberText(y0 + 18)} ${numberText(inner1)} ${numberText(endY - 28)} ${numberText(inner1)} ${numberText(endY)} L${numberText(outer1)} ${numberText(endY)} C${numberText(outer1)} ${numberText(endY - 24)} ${numberText(outer0)} ${numberText(y0 + 24)} ${numberText(outer0)} ${numberText(y0)} Z`;
  return `<path data-attachment-kind="${xml(kind)}" d="${path}" fill="white" fill-rule="nonzero" clip-rule="nonzero"/>`;
}

function supportPath(
  a: NormalizedAnchors,
  width: number,
  offset: number,
  kind: string,
): readonly string[] {
  const endY = Math.min(a.waistY, a.shoulderY + 82);
  const left = a.centerX - offset;
  const right = a.centerX + offset;
  const make = (x: number): string =>
    `M${numberText(x - width / 2)} ${numberText(a.shoulderY - 8)} C${numberText(x - width / 2)} ${numberText(a.shoulderY + 22)} ${numberText(x - width / 2 - 3)} ${numberText(endY - 12)} ${numberText(x - width / 2 - 3)} ${numberText(endY)} L${numberText(x + width / 2 + 3)} ${numberText(endY)} C${numberText(x + width / 2 + 3)} ${numberText(endY - 12)} ${numberText(x + width / 2)} ${numberText(a.shoulderY + 22)} ${numberText(x + width / 2)} ${numberText(a.shoulderY - 8)} Z`;
  return [make(left), make(right)].map(
    (path) =>
      `<path data-attachment-kind="${xml(kind)}" d="${path}" fill="white" fill-rule="nonzero" clip-rule="nonzero"/>`,
  );
}

function attachmentWindows(
  topStyle: KnownTopStyle,
  a: NormalizedAnchors,
): readonly UpperAttachmentWindow[] {
  switch (topStyle) {
    case "strapless":
      return [];
    case "strap":
      return supportPath(a, 24, 96, "shoulder-strap").map((path) => ({
        kind: "shoulder-strap",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "spaghetti":
      return supportPath(a, 8, 99, "spaghetti-strap").map((path) => ({
        kind: "spaghetti-strap",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "wideStrap":
      return supportPath(a, 72, 105, "wide-strap").map((path) => ({
        kind: "wide-strap",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "offShoulder":
      return [
        sideBandPath(
          a,
          true,
          Math.min(a.waistY, a.shoulderY + 120),
          "off-shoulder-band",
        ),
        sideBandPath(
          a,
          false,
          Math.min(a.waistY, a.shoulderY + 120),
          "off-shoulder-band",
        ),
      ].map((path) => ({
        kind: "off-shoulder-band",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "halter":
      return [
        mirroredSidePath(
          a,
          true,
          Math.min(a.waistY, a.shoulderY + 78),
          "halter-side",
        ),
        mirroredSidePath(
          a,
          false,
          Math.min(a.waistY, a.shoulderY + 78),
          "halter-side",
        ),
      ].map((path) => ({
        kind: "halter-side",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "oneShoulder":
      return [
        mirroredSidePath(
          a,
          true,
          Math.min(a.waistY, a.shoulderY + 112),
          "one-shoulder",
        ),
      ].map((path) => ({
        kind: "one-shoulder",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "shortSleeve":
      return [
        mirroredSidePath(
          a,
          true,
          Math.min(a.sleeveEndY, a.shoulderY + 78),
          "short-sleeve",
        ),
        mirroredSidePath(
          a,
          false,
          Math.min(a.sleeveEndY, a.shoulderY + 78),
          "short-sleeve",
        ),
      ].map((path) => ({
        kind: "short-sleeve",
        path,
        operation: "retain-source",
        extendsPastJoin: false,
      }));
    case "longSleeve":
      return [
        mirroredSidePath(a, true, a.sleeveEndY, "long-sleeve"),
        mirroredSidePath(a, false, a.sleeveEndY, "long-sleeve"),
      ].map((path) => ({
        kind: "long-sleeve",
        path,
        operation: "retain-source",
        extendsPastJoin: true,
      }));
  }
}

function emptyResult(reason: UpperSelectionReason): UpperSelectionMarkup {
  const edge = {
    kind: "unknown",
    path: "",
    topY: 0,
    depthY: 0,
    operation: "preserve",
  } as const;
  const yokeInstructions = {
    kind: "none",
    path: "",
    opacity: 0,
    operation: "none",
  } as const;
  return {
    coordinateFrame: "source-pixels",
    sourceFrame: FRAME,
    status: "partial",
    reason,
    defs: "",
    edge,
    yokeInstructions,
    attachmentWindows: [],
  };
}

export function buildUpperSelectionMarkup(
  input: UpperSelectionInput,
): UpperSelectionMarkup {
  const namespace = safeNamespace(input.namespace);
  if (!namespace) return emptyResult("invalid-namespace");
  if (input.topStyle === "unknown" || input.neckline === "unknown")
    return emptyResult("unknown-selection");
  if (
    input.nativeSourceMaskId !== undefined &&
    !validId(input.nativeSourceMaskId)
  )
    return emptyResult("invalid-native-source-mask");
  const a = normalizeAnchors(input.sourceAnchors);
  if (!a) return emptyResult("invalid-source-anchors");
  const nativeMatched = input.nativeMatched ?? input.templateKind === "matched";
  const shape = necklineShape(input.neckline, a);
  const edge: UpperSelectionEdge = {
    kind: nativeMatched ? "native" : input.neckline,
    path: nativeMatched ? "" : shape.path,
    topY: a.necklineY,
    depthY: nativeMatched ? a.necklineY : shape.depthY,
    operation: nativeMatched ? "preserve" : "cut",
  };
  const windows = attachmentWindows(input.topStyle, a);
  const lowOffShoulder =
    input.topStyle === "offShoulder" &&
    !nativeMatched &&
    input.neckline !== "high" &&
    input.neckline !== "illusion";
  const lowOffShoulderSweetheart =
    lowOffShoulder && input.neckline === "sweetheart";
  const selectionMaskId = `${namespace}-upper-selection-${input.topStyle}-${input.neckline}-${input.templateKind}`;
  const yokeMaskId = `${selectionMaskId}-yoke`;
  const yokePath =
    input.neckline === "illusion" && !nativeMatched
      ? necklineShape("illusion", a, 14).path.replace(
          /^M[^ ]+ 0 H[^ ]+/,
          `M${numberText(clamp(a.necklineLeftX - 14, FRAME.width))} 0 H${numberText(clamp(a.necklineRightX + 14, FRAME.width))}`,
        )
      : "";
  const yokeInstructions: UpperYokeInstructions =
    input.neckline !== "illusion"
      ? { kind: "none", path: "", opacity: 0, operation: "none" }
      : nativeMatched
        ? { kind: "native", path: "", opacity: 1, operation: "preserve-native" }
        : {
            kind: "generic-authored-center",
            path: yokePath,
            opacity: 0.36,
            maskId: yokeMaskId,
            operation: "overlay-source",
          };
  const native = input.nativeSourceMaskId;
  const nativeOpen = native
    ? `<g data-mask-operation="intersection" mask="url(#${xml(native)})">`
    : `<g data-mask-operation="selection">`;
  const nativeClose = `</g>`;
  const body = `<path data-mask-component="body" data-mask-top-y="${numberText(lowOffShoulder ? a.shoulderY + 46 : a.necklineY)}"${lowOffShoulderSweetheart ? ` data-mask-cup-top-y="${numberText(a.shoulderY + 26)}"` : ""} d="${bodyPath(a, lowOffShoulder, lowOffShoulderSweetheart)}" fill="white" fill-rule="nonzero" clip-rule="nonzero"/>`;
  const retained = windows.map(({ path }) => path).join("");
  const cut = edge.path
    ? `<path data-mask-component="neckline-cut" data-neckline="${input.neckline}" d="${edge.path}" fill="black" fill-rule="nonzero" clip-rule="nonzero"/>`
    : "";
  const selectionMask = `<mask id="${xml(selectionMaskId)}" x="0" y="0" width="${FRAME.width}" height="${FRAME.height}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" mask-type="luminance" data-coordinate-frame="source-pixels" data-template-kind="${xml(input.templateKind)}"><title>Upper source retention and neckline selection</title>${nativeOpen}${body}${retained}${cut}${nativeClose}</mask>`;
  const yokeMask = yokeInstructions.maskId
    ? `<mask id="${xml(yokeMaskId)}" x="0" y="0" width="${FRAME.width}" height="${FRAME.height}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" mask-type="luminance" data-coordinate-frame="source-pixels" data-yoke-opacity="0.36"><path d="${yokePath}" fill="white" fill-rule="nonzero" clip-rule="nonzero"/></mask>`
    : "";
  const defs = selectionMask + yokeMask;
  return {
    coordinateFrame: "source-pixels",
    sourceFrame: FRAME,
    status: "ready",
    defs,
    maskId: selectionMaskId,
    selectionMaskId,
    nativeSourceMaskId: native,
    edge,
    yokeInstructions,
    attachmentWindows: windows,
  };
}

export const buildUpperSelection = buildUpperSelectionMarkup;
