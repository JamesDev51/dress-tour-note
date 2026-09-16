import type { Train, Waistline } from "../../../types/domain";
import type { GarmentAsset, GarmentLayer, GarmentRecipe } from "./types";
import { waistSpanForAsset } from "./geometry";

export type ModifierAssetRef = {
  readonly asset: GarmentAsset;
  readonly sourceIndex: number;
  readonly filterId?: string;
};

export type DetailAssetRefs = {
  readonly namespace: string;
  readonly matteFilterId: string;
  readonly bow?: ModifierAssetRef;
  readonly floral?: ModifierAssetRef;
};

export const waistlineY: Readonly<
  Record<Exclude<Waistline, "unknown">, number>
> = {
  natural: 170.2,
  basque: 181.5,
  drop: 194,
  empire: 152.3,
};

const trainExtension: Readonly<
  Record<Exclude<Train, "unknown" | "none">, number>
> = {
  sweep: 24,
  chapel: 52,
  cathedral: 84,
};

function safe(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function numberText(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function trainMaskId(namespace: string, train: Train): string {
  return `${namespace}-train-${safe(train)}`;
}

export function slitMaskId(namespace: string): string {
  return `${namespace}-detail-slit`;
}

export function joinYFor(
  waistline: Waistline | undefined,
  fallback = waistlineY.natural,
): number {
  return waistline && waistline !== "unknown"
    ? waistlineY[waistline]
    : fallback;
}

export function layerJoinY(
  asset: GarmentAsset,
  waistline: Waistline | undefined,
  region: GarmentLayer["region"],
): number | undefined {
  const source = asset.anchors.waistY;
  const requested =
    waistline && waistline !== "unknown" ? waistlineY[waistline] : source;
  if (requested === undefined) return undefined;
  if (
    region === "lower" &&
    asset.coverage.silhouette === "empire" &&
    waistline === "natural"
  ) {
    return source;
  }
  return requested;
}

function waistPath(
  waistline: Exclude<Waistline, "unknown">,
  span: readonly [number, number],
): string {
  const y = waistlineY[waistline];
  const center = (span[0] + span[1]) / 2;
  const half = Math.max(8, Math.min(160, (span[1] - span[0]) / 2));
  const left = center - half;
  const right = center + half;
  const dip = waistline === "basque" ? 8 : waistline === "drop" ? 3 : 0;
  return `M${numberText(left)} ${numberText(y)} C${numberText(left + half * 0.35)} ${numberText(y + dip)} ${numberText(center - half * 0.18)} ${numberText(y + dip)} ${numberText(center)} ${numberText(y + dip + (waistline === "basque" ? 3 : 0))} C${numberText(center + half * 0.18)} ${numberText(y + dip)} ${numberText(right - half * 0.35)} ${numberText(y + dip)} ${numberText(right)} ${numberText(y)}`;
}

export function waistMarkup(recipe: GarmentRecipe): string {
  const waistline = recipe.waistline;
  if (!waistline || waistline === "unknown") {
    return "";
  }
  const silhouette = recipe.silhouette;
  if (waistline === "natural" && silhouette !== "empire") return "";
  const y = waistlineY[waistline];
  const layer =
    recipe.layers.find(({ region }) => region === "lower") ??
    recipe.layers.find(({ region }) => region === "full") ??
    recipe.layers.find(({ region }) => region === "upper");
  const center = layer?.asset.anchors.centerX ?? 180;
  const span =
    (layer && waistSpanForAsset(layer.asset.assetId)) ??
    ([center - 33, center + 33] as const);
  const transition = waistPath(waistline, span);
  const releaseLeft = span[0] - 15;
  const releaseRight = span[1] + 15;
  const release =
    silhouette === "empire" && waistline === "natural"
      ? `<path data-layer="waist-release" data-source-join="152.3" d="M${numberText(releaseLeft)} 152.3 C${numberText(span[0])} 156 ${numberText(span[1])} 156 ${numberText(releaseRight)} 152.3" fill="none" stroke="#806b5a" stroke-opacity=".34" stroke-width="2.1" stroke-linecap="round"/>`
      : "";
  return `<g data-layer="waist-construction" data-waistline="${waistline}"><path data-layer="waist-line" d="${transition}" fill="none" stroke="#806b5a" stroke-opacity=".62" stroke-width="1.7" stroke-linecap="round"/><path data-layer="waist-edge" d="${transition}" fill="none" stroke="#fffaf1" stroke-opacity=".18" stroke-width="4.4" stroke-linecap="round"/>${release}</g>`;
}

export function trainMarkup(
  recipe: GarmentRecipe,
  namespace: string,
  source: ModifierAssetRef | undefined,
  lowerLayer: GarmentLayer | undefined,
  targetSourceIndex?: number,
): {
  readonly definitions: string;
  readonly content: string;
  readonly replacedRegion?: GarmentLayer["region"];
} {
  const train = recipe.train;
  if (
    recipe.view === "upper" ||
    !train ||
    train === "unknown" ||
    train === "none" ||
    !source ||
    !lowerLayer
  ) {
    return { definitions: "", content: "" };
  }
  const hemY = lowerLayer.asset.anchors.hemY ?? 552;
  const joinY = lowerLayer.joinY ?? lowerLayer.asset.anchors.waistY ?? 170;
  const sourceHemY = source.asset.anchors.hemY ?? hemY;
  const sourceJoinY = source.asset.anchors.waistY ?? joinY;
  const targetEndY = Math.min(636, hemY + trainExtension[train]);
  const targetSourceJoinY = lowerLayer.asset.anchors.waistY ?? joinY;
  const targetSourceHemY = lowerLayer.asset.anchors.hemY ?? hemY;
  const sourceHeight = Math.max(1, sourceHemY - sourceJoinY);
  const targetSourceHeight = Math.max(1, targetSourceHemY - targetSourceJoinY);
  const targetTop = joinY;
  const targetHeight = Math.max(1, targetEndY - targetTop);
  const maskId = trainMaskId(namespace, train);
  const targetIndex = targetSourceIndex ?? source.sourceIndex;
  const targetImageId = `${namespace}-source-${targetIndex}`;
  const definitions = `<mask id="${maskId}" x="0" y="0" width="360" height="640" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" mask-type="luminance" style="mask-type:luminance" data-train="${train}" data-mask-purpose="continuous-lower-train"><rect width="360" height="640" fill="black"/><svg data-layer="train-target-frame" data-train="${train}" x="0" y="${numberText(targetTop)}" width="360" height="${numberText(targetHeight)}" viewBox="0 ${numberText(targetSourceJoinY)} 360 ${numberText(targetSourceHeight)}" preserveAspectRatio="none" overflow="hidden"><use data-layer="train-target-matte" href="#${targetImageId}" filter="url(#${namespace}-matte)"/></svg></mask>`;
  const content = `<g data-layer="train" data-composition="unified-lower" data-region="lower-body" data-train="${train}" data-source-asset="${safe(source.asset.assetId)}" data-target-asset="${safe(lowerLayer.asset.assetId)}" mask="url(#${maskId})"><svg data-layer="train-cloth-frame" data-train="${train}" data-source-window="join-to-hem" x="0" y="${numberText(targetTop)}" width="360" height="${numberText(targetHeight)}" viewBox="0 ${numberText(sourceJoinY)} 360 ${numberText(sourceHeight)}" preserveAspectRatio="none" overflow="hidden"><use data-layer="train-cloth-unified" data-train="${train}" data-asset-id="${safe(source.asset.assetId)}" href="#${namespace}-source-${source.sourceIndex}" filter="url(#${namespace}-matte)"/></svg></g>`;
  return { definitions, content, replacedRegion: lowerLayer.region };
}
