import type {
  GarmentAsset,
  GarmentLayer,
  GarmentRecipe,
  GarmentTexture,
} from "./types";
import {
  buildBackConstructionMarkup,
  type BackConstructionMarkup,
} from "./backConstruction";
import { photoWarpInputFor, waistSpanForAsset } from "./geometry";
import { buildPhotoWarpMarkup } from "./photoWarp";
import { textureMaskId, sourceIndexFor } from "./markupParts";
import { waistlineY } from "./modifiers";
import { numberText } from "./svgUtils";

function backConstructionFor(
  recipe: GarmentRecipe,
  namespace: string,
  nativeBowImageId?: string,
): BackConstructionMarkup | undefined {
  if (recipe.view !== "back") return undefined;
  const layer = recipe.layers.find(({ region }) => region === "full");
  if (!layer) return undefined;
  const asset = layer.asset;
  const centerX = asset.anchors.centerX;
  const waistY = layer.joinY ?? asset.anchors.waistY ?? 170;
  const bow =
    recipe.backStyle === "bowBack"
      ? recipe.detailAssets?.find((detail) =>
          detail.coverage.details?.includes("backBow"),
        )
      : undefined;
  const result = buildBackConstructionMarkup({
    backStyle: recipe.backStyle ?? "unknown",
    namespace,
    frame: { width: 360, height: 640 },
    anchors: {
      centerX,
      necklineY: asset.anchors.necklineY ?? 75,
      necklineLeftX: centerX - 7,
      necklineRightX: centerX + 7,
      shoulderY: asset.anchors.shoulderY ?? 96,
      shoulderLeftX: centerX - 49,
      shoulderRightX: centerX + 49,
      waistY,
      waistLeftX: centerX - 33,
      waistRightX: centerX + 33,
      hemY: asset.anchors.hemY ?? 554,
    },
    ...(bow && nativeBowImageId
      ? {
          nativeBowImageId,
          nativeBowBounds: { x: centerX - 32, y: 196, width: 64, height: 78 },
        }
      : {}),
  });
  return recipe.backStyle === "bowBack"
    ? {
        ...result,
        markup: result.markup.replace(
          'data-layer="back-bow-native"',
          'data-layer="back-bow-native" data-detail="backBow"',
        ),
      }
    : result;
}

function photoWarpTextureMarkup(
  texture: GarmentTexture,
  sourceAssets: readonly GarmentAsset[],
  namespace: string,
): string {
  if (texture.region !== "lower") return "";
  const target = sourceAssets.find(
    (asset) => asset.assetId === texture.maskAssetId,
  );
  if (!target) return "";
  if (
    texture.joinY !== undefined &&
    target.anchors.waistY !== undefined &&
    Math.abs(texture.joinY - target.anchors.waistY) > 2
  ) {
    return "";
  }
  const sourceIndex = sourceIndexFor(sourceAssets, texture.asset.assetId);
  const sourceImageId = `${namespace}-source-${sourceIndex}`;
  const targetMaskId = textureMaskId(
    namespace,
    texture.maskAssetId,
    texture.region,
  );
  const input = photoWarpInputFor(
    texture.asset,
    target,
    sourceImageId,
    `${namespace}-warp-${sourceIndex}-${sourceIndexFor(sourceAssets, texture.maskAssetId)}`,
  );
  if (!input) return "";
  const warp = buildPhotoWarpMarkup({ ...input, targetMaskId });
  if (!warp) return "";
  const filtered = warp
    .replaceAll(
      `href="#${sourceImageId}"`,
      `href="#${sourceImageId}" filter="url(#${namespace}-matte)"`,
    )
    .replace(/<defs>([\s\S]*?)<\/defs>/g, "$1");
  return `<g data-layer="material-texture" data-region="lower-body" data-material="${texture.asset.coverage.fabric ?? "unknown"}" data-mask-asset-id="${texture.maskAssetId}" data-renderer="photo-material-composition">${filtered}</g>`;
}

function waistSourceLayer(recipe: GarmentRecipe): GarmentLayer | undefined {
  return (
    recipe.layers.find(({ region }) => region === "upper") ??
    recipe.layers.find(({ region }) => region === "full")
  );
}

export function waistTransitionMarkup(
  recipe: GarmentRecipe,
  sourceAssets: readonly GarmentAsset[],
  namespace: string,
): string {
  const waistline = recipe.waistline;
  if (!waistline || waistline === "unknown" || waistline === "natural") {
    return "";
  }
  const targetLayer = waistSourceLayer(recipe);
  if (!targetLayer) return "";
  const source =
    recipe.textures.find(({ region }) => region === "lower")?.asset ??
    recipe.textures.find(({ region }) => region === "upper")?.asset ??
    targetLayer.asset;
  const sourceIndex = sourceIndexFor(sourceAssets, source.assetId);
  const sourceJoin = waistlineY.natural;
  const targetJoin = waistlineY[waistline];
  if (sourceJoin === targetJoin) return "";
  const top = Math.min(sourceJoin, targetJoin) - 8;
  const bottom = Math.max(sourceJoin, targetJoin) + 8;
  const height = bottom - top;
  const sourceViewTop = top - (targetJoin - sourceJoin);
  const measured = waistSpanForAsset(targetLayer.asset.assetId);
  const center = targetLayer.asset.anchors.centerX;
  const span = measured ?? ([center - 33, center + 33] as const);
  const left = Math.max(0, span[0] - 10);
  const right = Math.min(360, span[1] + 10);
  const clipId = `${namespace}-waist-adjustment`;
  const definitions = `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse" data-waist-adjustment="${waistline}"><path d="M${numberText(left)} ${numberText(top)} H${numberText(right)} V${numberText(bottom)} H${numberText(left)} Z" fill-rule="nonzero" clip-rule="nonzero"/></clipPath>`;
  return `<g data-layer="waist-adjustment" data-waistline="${waistline}" data-source-asset="${source.assetId}" clip-path="url(#${clipId})"><svg x="0" y="${numberText(top)}" width="360" height="${numberText(height)}" viewBox="0 ${numberText(sourceViewTop)} 360 ${numberText(height)}" preserveAspectRatio="none" overflow="hidden"><use data-layer="waist-adjustment-cloth" href="#${namespace}-source-${sourceIndex}" filter="url(#${namespace}-matte)"/></svg></g>${definitions}`;
}

export { backConstructionFor, photoWarpTextureMarkup };
