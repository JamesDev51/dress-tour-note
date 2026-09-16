import type {
  GarmentAsset,
  GarmentLayer,
  GarmentRecipe,
  GarmentTexture,
} from "./types";
import { slitMaskId } from "./modifiers";
import { escapeXml, numberText } from "./svgUtils";
import {
  buildUpperSelectionMarkup,
  type UpperSelectionMarkup,
} from "./upperSelection";

const SOURCE_SCALE = 0.3515625;
const SOURCE_OFFSET_Y = 50;

export type UpperSelectionRuntime = {
  readonly defs: string;
  readonly maskId: string;
};

function isNativeLowUpper(layer: GarmentLayer): boolean {
  return (
    layer.region === "upper" &&
    layer.asset.role === "lower-silhouette" &&
    layer.asset.coverage.topStyle === "strapless" &&
    layer.asset.coverage.neckline === "sweetheart" &&
    layer.neckline === "sweetheart"
  );
}

function sourceY(value: number | undefined): number | undefined {
  return value === undefined
    ? undefined
    : (value - SOURCE_OFFSET_Y) / SOURCE_SCALE;
}

function sourceX(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value / SOURCE_SCALE;
}

function logicalizedSelectionDefs(selection: UpperSelectionMarkup): string {
  return selection.defs.replace(
    /(<mask\b[^>]*>)([\s\S]*?)(<\/mask>)/g,
    '$1<g transform="translate(0 50) scale(0.3515625)">$2</g>$3',
  );
}

export function upperSelectionForLayer(
  layer: GarmentLayer,
  namespace: string,
): UpperSelectionRuntime | undefined {
  const topStyle = layer.asset.coverage.topStyle;
  const neckline = layer.neckline ?? layer.asset.coverage.neckline;
  if (
    !topStyle ||
    topStyle === "unknown" ||
    !neckline ||
    neckline === "unknown"
  ) {
    return undefined;
  }
  const centerX = sourceX(layer.asset.anchors.centerX) ?? 512;
  const necklineY = sourceY(layer.asset.anchors.necklineY);
  const shoulderY = sourceY(layer.asset.anchors.shoulderY);
  const waistY = sourceY(layer.sourceJoinY ?? layer.asset.anchors.waistY);
  if (
    necklineY === undefined ||
    shoulderY === undefined ||
    waistY === undefined
  ) {
    return undefined;
  }
  const selection = buildUpperSelectionMarkup({
    namespace: `${namespace}-upper-selection`,
    topStyle,
    neckline,
    sourceAnchors: {
      centerX,
      necklineY,
      necklineLeftX: centerX - 20,
      necklineRightX: centerX + 20,
      shoulderY,
      shoulderLeftX: centerX - 140,
      shoulderRightX: centerX + 140,
      waistY,
      waistLeftX: centerX - 92,
      waistRightX: centerX + 92,
      sleeveEndY: waistY + 182,
    },
    templateKind:
      layer.asset.role === "matched-upper" &&
      layer.asset.coverage.neckline === neckline
        ? "matched"
        : layer.asset.role === "material-master"
          ? "longHigh"
          : "upperFamily",
    nativeMatched:
      layer.asset.role === "matched-upper" &&
      layer.asset.coverage.neckline === neckline,
  });
  if (selection.status !== "ready" || !selection.selectionMaskId) {
    return undefined;
  }
  return {
    defs: logicalizedSelectionDefs(selection),
    maskId: selection.selectionMaskId,
  };
}

function armClip(topStyle: string | undefined): string {
  switch (topStyle) {
    case "longSleeve":
      return "M139.22 91.84 L131.48 97.11 L127.27 108.36 L123.40 119.61 L119.53 130.86 L115.31 142.11 L111.09 153.36 L106.88 164.61 L102.66 175.86 L98.44 187.11 L94.22 198.36 L90 209.61 L83.32 228.59 L94.22 233.87 L101.95 230 L106.52 218.75 L110.74 207.5 L115.66 196.25 L120.94 185 L125.51 173.75 L130.08 162.5 L134.65 151.25 L137.11 140 L139.92 128.75 L141.68 117.5 L142.73 106.25 L141.33 96.41 Z M220.78 91.84 L228.52 97.11 L232.73 108.36 L236.60 119.61 L240.47 130.86 L244.69 142.11 L248.91 153.36 L253.13 164.61 L257.34 175.86 L261.56 187.11 L265.78 198.36 L270 209.61 L276.68 228.59 L265.78 233.87 L258.05 230 L253.48 218.75 L249.26 207.5 L244.34 196.25 L239.06 185 L234.49 173.75 L229.92 162.5 L225.35 151.25 L222.89 140 L220.08 128.75 L218.32 117.5 L217.27 106.25 L218.67 96.41 Z";
    case "shortSleeve":
      return "M136 100 C123 111 115 127 111 144 C116 154 127 158 139 151 L146 111 Z M214 100 C227 111 235 127 239 144 C234 154 223 158 211 151 L204 111 Z";
    case "offShoulder":
      return "M111 113 C99 123 96 143 105 161 C116 169 129 164 139 151 L146 116 Z M249 113 C261 123 264 143 255 161 C244 169 231 164 221 151 L214 116 Z";
    case "oneShoulder":
      return "M121 98 C105 126 99 163 101 201 C111 211 124 204 135 184 L149 110 Z";
    default:
      return "";
  }
}

function necklineCutout(neckline: string | undefined): string {
  switch (neckline) {
    case "straight":
      return "M140 70 H220 V104 H140 Z";
    case "sweetheart":
      return "M137 70 H223 V105 C208 98 196 106 180 118 C164 106 152 98 137 105 Z";
    case "v":
      return "M139 70 H221 L180 124 Z";
    case "square":
      return "M141 70 H219 V111 H141 Z";
    case "scoop":
      return "M139 70 H221 C221 110 205 127 180 127 C155 127 139 110 139 70 Z";
    case "illusion":
      return "M140 70 H220 V101 C206 95 195 103 180 113 C165 103 154 95 140 101 Z";
    case "asymmetric":
      return "M139 70 H221 L221 106 L139 96 Z";
    case "high":
    default:
      return "";
  }
}

function clipPathFor(
  layer: GarmentLayer,
  id: string,
  upperViewBottom?: number,
  useSelectionMask = false,
): string {
  const joinY = layer.joinY ?? layer.asset.anchors.waistY ?? 170;
  if (layer.region === "full") return "";
  if (layer.region === "lower") {
    const sourceJoin = layer.sourceJoinY ?? joinY;
    const overlap = Math.abs(sourceJoin - joinY) > 2 ? 12 : 3;
    return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse" data-clip-rule="nonzero-union"><path d="M0 ${Math.max(0, joinY - overlap)} H360 V640 H0 Z" fill-rule="nonzero" clip-rule="nonzero"/></clipPath>`;
  }
  const centralBottom = useSelectionMask
    ? Math.max(joinY + 66, upperViewBottom ?? 0)
    : (upperViewBottom ?? joinY + 3);
  const central = `M0 0 H360 V${Math.min(640, centralBottom)} H0 Z`;
  const arms = useSelectionMask ? "" : armClip(layer.asset.coverage.topStyle);
  return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse" data-clip-rule="nonzero-union"><path d="${central}" fill-rule="nonzero" clip-rule="nonzero"/>${arms ? `<path d="${arms}" fill-rule="nonzero" clip-rule="nonzero"/>` : ""}</clipPath>`;
}

function lowerTextureClipPath(
  id: string,
  silhouette: string | undefined,
  joinY = 170,
): string {
  const y = Number(joinY.toFixed(2));
  const shape = silhouette ?? "unknown";
  return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse" data-silhouette="${shape}" data-clip-rule="nonzero-union"><path d="M0 ${Math.max(0, y - 12)} H360 V640 H0 Z" fill-rule="nonzero" clip-rule="nonzero"/></clipPath>`;
}

function upperTextureClipPath(
  id: string,
  layer: GarmentLayer,
  upperViewBottom?: number,
): string {
  const joinY = layer.joinY ?? 170;
  const bodice = `M148 70 H212 C216 87 220 106 221 126 C223 145 219 160 215 ${joinY + 3} H145 C141 160 137 145 139 126 C140 106 144 87 148 70 Z`;
  const attachment = `M72 82 H288 V${Math.min(640, Math.max(joinY + 3, upperViewBottom ?? 0))} H72 Z`;
  return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse" data-clip-rule="nonzero-union"><path d="${bodice}" fill-rule="nonzero" clip-rule="nonzero"/><path d="${attachment}" fill-rule="nonzero" clip-rule="nonzero"/></clipPath>`;
}

function sourceImageMarkup(
  asset: GarmentAsset,
  index: number,
  href: string,
  namespace: string,
): string {
  const imageId = `${namespace}-source-${index}`;
  const placement = asset.imagePlacement ?? {
    x: 0,
    y: 50,
    width: 360,
    height: 540,
  };
  return `<image id="${imageId}" data-asset-id="${escapeXml(asset.assetId)}" data-role="${asset.role}" x="${placement.x}" y="${placement.y}" width="${placement.width}" height="${placement.height}" preserveAspectRatio="none" href="${escapeXml(href)}"/>`;
}

function sourceIndexFor(
  assets: readonly GarmentAsset[],
  assetId: string,
): number {
  const index = assets.findIndex((asset) => asset.assetId === assetId);
  return index < 0 ? 0 : index;
}

function maskIdFor(
  namespace: string,
  sourceAssetId: string,
  region: string,
): string {
  return `${namespace}-mask-${sourceAssetId.replace(/[^a-zA-Z0-9_-]/g, "-")}-${region}`;
}

function textureMaskId(
  namespace: string,
  targetAssetId: string,
  region: string,
): string {
  return `${namespace}-texture-mask-${targetAssetId.replace(/[^a-zA-Z0-9_-]/g, "-")}-${region}`;
}

function textureMaskMarkup(
  texture: GarmentTexture,
  sourceAssets: readonly GarmentAsset[],
  namespace: string,
  slit: boolean,
  constructionMaskId?: string,
  selectionMaskId?: string,
): string {
  const targetIndex = sourceIndexFor(sourceAssets, texture.maskAssetId);
  const targetImageId = `${namespace}-source-${targetIndex}`;
  const targetAsset = sourceAssets.find(
    (asset) => asset.assetId === texture.maskAssetId,
  );
  const nativeLowUpper =
    texture.region === "upper" &&
    texture.neckline === "sweetheart" &&
    targetAsset?.role === "lower-silhouette" &&
    targetAsset.coverage.topStyle === "strapless" &&
    targetAsset.coverage.neckline === "sweetheart";
  const id = textureMaskId(namespace, texture.maskAssetId, texture.region);
  const neckline =
    texture.region === "upper" &&
    texture.neckline &&
    texture.neckline !== "high" &&
    !nativeLowUpper
      ? `<path d="${necklineCutout(texture.neckline)}" fill="black" fill-rule="nonzero"/>`
      : "";
  const targetUse = `<use href="#${targetImageId}" filter="url(#${namespace}-matte)"/>`;
  const selectedUse = selectionMaskId
    ? `<g mask="url(#${selectionMaskId})">${targetUse}</g>`
    : targetUse;
  const slitMarkup =
    texture.region === "lower" && slit
      ? `<g mask="url(#${slitMaskId(namespace)})">${selectedUse}</g>`
      : selectedUse;
  const constructionMarkup = constructionMaskId
    ? `<g mask="url(#${constructionMaskId})">${slitMarkup}</g>`
    : slitMarkup;
  return `<mask id="${id}" x="0" y="0" width="360" height="640" maskUnits="userSpaceOnUse" mask-type="luminance" style="mask-type:luminance"><rect width="360" height="640" fill="black"/>${constructionMarkup}${neckline}</mask>`;
}

function lowerTextureScale(silhouette: string | undefined): number {
  switch (silhouette) {
    case "sheath":
      return 0.54;
    case "teaLength":
      return 0.72;
    case "fitAndFlare":
      return 1.42;
    case "mermaid":
      return 1.5;
    case "ballGown":
      return 1.62;
    case "empire":
      return 1.08;
    case "aLine":
    case "unknown":
    default:
      return 1;
  }
}

function necklineMaskMarkup(layer: GarmentLayer, namespace: string): string {
  const id = maskIdFor(namespace, layer.asset.assetId, layer.region);
  const cutout = necklineCutout(layer.neckline);
  return `<mask id="${id}" x="0" y="0" width="360" height="640" maskUnits="userSpaceOnUse" mask-type="luminance" style="mask-type:luminance"><rect width="360" height="640" fill="white"/><path d="${cutout}" fill="black" fill-rule="nonzero"/></mask>`;
}

function useMarkup(
  layer: GarmentLayer,
  index: number,
  namespace: string,
  sourceIndex: number,
  slit: boolean,
  constructionMaskId?: string,
  selectionMaskId?: string,
): string {
  const imageId = `${namespace}-source-${sourceIndex}`;
  const clipId = `${namespace}-clip-${sourceIndex}-${layer.region}`;
  const clip = layer.region === "full" ? "" : ` clip-path="url(#${clipId})"`;
  const nativeLowUpper = isNativeLowUpper(layer);
  const mask = selectionMaskId
    ? ` mask="url(#${selectionMaskId})"`
    : layer.region === "upper" &&
        layer.neckline &&
        layer.neckline !== "high" &&
        !nativeLowUpper
      ? ` mask="url(#${maskIdFor(namespace, layer.asset.assetId, layer.region)})"`
      : "";
  const maskStyle = selectionMaskId
    ? ` style="mask:url(#${selectionMaskId})"`
    : layer.region === "upper" &&
        layer.neckline &&
        layer.neckline !== "high" &&
        !nativeLowUpper
      ? ` style="mask:url(#${maskIdFor(namespace, layer.asset.assetId, layer.region)})"`
      : "";
  const slitMask =
    layer.region === "lower" && slit
      ? ` mask="url(#${slitMaskId(namespace)})"`
      : "";
  const styleMask = [
    maskStyle.replace(/^ style="|"$/g, ""),
    layer.region === "lower" && slit
      ? `mask:url(#${slitMaskId(namespace)})`
      : "",
  ]
    .filter(Boolean)
    .join(";");
  const style = styleMask ? ` style="${styleMask}"` : "";
  const constructionMask = constructionMaskId
    ? ` mask="url(#${constructionMaskId})"`
    : "";
  const neckline = layer.neckline ? ` data-neckline="${layer.neckline}"` : "";
  const sourceJoin = layer.sourceJoinY ?? layer.asset.anchors.waistY;
  const targetJoin = layer.joinY ?? sourceJoin;
  const sourceHem = layer.asset.anchors.hemY;
  const joined =
    layer.region === "lower" &&
    sourceJoin !== undefined &&
    targetJoin !== undefined &&
    sourceHem !== undefined &&
    Math.abs(sourceJoin - targetJoin) > 2;
  const sourceHeight =
    sourceJoin !== undefined && sourceHem !== undefined
      ? Math.max(1, sourceHem - sourceJoin)
      : 1;
  const targetHeight =
    targetJoin !== undefined && sourceHem !== undefined
      ? Math.max(1, sourceHem - targetJoin)
      : 1;
  const joinedUse = `<use data-layer="garment-image-source" data-region="lower-body" data-asset-id="${escapeXml(layer.asset.assetId)}"${neckline} href="#${imageId}" filter="url(#${namespace}-matte)"/>`;
  if (joined) {
    const overlap = 12;
    const frameY = targetJoin - overlap;
    const frameHeight = targetHeight + overlap;
    const frame = `<svg data-layer="lower-join-frame" data-source-join-y="${numberText(sourceJoin)}" data-target-join-y="${numberText(targetJoin)}" x="0" y="${numberText(frameY)}" width="360" height="${numberText(frameHeight)}" viewBox="0 ${numberText(sourceJoin)} 360 ${numberText(sourceHeight)}" preserveAspectRatio="none" overflow="hidden"${clip}${mask}${slitMask}${constructionMask}${style}>${joinedUse}</svg>`;
    return `<g data-layer="garment-image" data-region="lower-body" data-asset-id="${escapeXml(layer.asset.assetId)}"${neckline}>${frame}</g>`;
  }
  return `<use data-layer="garment-image" data-region="${layer.region === "lower" ? "lower-body" : layer.region === "upper" ? "upper-body" : "full-body"}" data-asset-id="${escapeXml(layer.asset.assetId)}"${neckline} href="#${imageId}" filter="url(#${namespace}-matte)"${clip}${mask}${slitMask}${constructionMask}${style}/>`;
}

function textureUseMarkup(
  texture: GarmentTexture,
  sourceAssets: readonly GarmentAsset[],
  namespace: string,
): string {
  const imageId = `${namespace}-source-${sourceIndexFor(sourceAssets, texture.asset.assetId)}`;
  const targetIndex = sourceIndexFor(sourceAssets, texture.maskAssetId);
  const clip =
    texture.region === "full"
      ? ""
      : ` clip-path="url(#${namespace}-texture-clip-${targetIndex}-${texture.region})"`;
  const clipStyle =
    texture.region === "full"
      ? ""
      : `clip-path:url(#${namespace}-texture-clip-${targetIndex}-${texture.region})`;
  const mask = ` mask="url(#${textureMaskId(namespace, texture.maskAssetId, texture.region)})"`;
  const style = clipStyle;
  const neckline = texture.neckline
    ? ` data-neckline="${texture.neckline}"`
    : "";
  const targetAsset = sourceAssets.find(
    (asset) => asset.assetId === texture.maskAssetId,
  );
  const targetSilhouette = targetAsset?.coverage.silhouette;
  const xScale =
    texture.region === "lower" ? lowerTextureScale(targetSilhouette) : 1;
  const transform =
    xScale === 1
      ? ""
      : ` transform="translate(${numberText(180 - 180 * xScale)} 0) scale(${numberText(xScale)} 1)" data-material-x-scale="${numberText(xScale)}"`;
  const sourceJoin = texture.asset.anchors.waistY;
  const targetJoin = texture.joinY ?? targetAsset?.anchors.waistY;
  const sourceHem = texture.asset.anchors.hemY;
  const targetHem = targetAsset?.anchors.hemY ?? sourceHem;
  const joined =
    texture.region === "lower" &&
    sourceJoin !== undefined &&
    targetJoin !== undefined &&
    sourceHem !== undefined &&
    targetHem !== undefined &&
    Math.abs(sourceJoin - targetJoin) > 0.01;
  if (joined) {
    const sourceHeight = Math.max(1, sourceHem - sourceJoin);
    const targetHeight = Math.max(1, targetHem - targetJoin);
    const overlap = 12;
    const frameY = targetJoin - overlap;
    const frameHeight = targetHeight + overlap;
    const frame = `<svg data-layer="material-join-frame" data-source-join-y="${numberText(sourceJoin)}" data-target-join-y="${numberText(targetJoin)}" x="0" y="${numberText(frameY)}" width="360" height="${numberText(frameHeight)}" viewBox="0 ${numberText(sourceJoin)} 360 ${numberText(sourceHeight)}" preserveAspectRatio="none" overflow="hidden"${clip}${mask}${style ? ` style="${style}"` : ""}> <use data-layer="material-texture-source" data-region="lower-body" data-material="${texture.asset.coverage.fabric ?? "unknown"}" data-mask-asset-id="${escapeXml(texture.maskAssetId)}"${neckline} href="#${imageId}" filter="url(#${namespace}-matte)"/></svg>`;
    return frame;
  }
  return `<use data-layer="material-texture" data-region="${texture.region === "lower" ? "lower-body" : texture.region === "upper" ? "upper-body" : "full-body"}" data-material="${texture.asset.coverage.fabric ?? "unknown"}" data-mask-asset-id="${escapeXml(texture.maskAssetId)}"${neckline} href="#${imageId}" filter="url(#${namespace}-matte)"${clip}${mask}${transform}${style ? ` style="${style}"` : ""}/>`;
}

export {
  clipPathFor,
  lowerTextureClipPath,
  maskIdFor,
  necklineMaskMarkup,
  sourceImageMarkup,
  sourceIndexFor,
  textureMaskId,
  textureMaskMarkup,
  textureUseMarkup,
  upperTextureClipPath,
  useMarkup,
};
