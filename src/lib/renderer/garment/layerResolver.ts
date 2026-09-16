import type { Dress } from "../../../types/domain";
import {
  findLowerAsset,
  findDetailAsset,
  findMaterialAsset,
  findUpperAsset,
  findUpperFamilyAsset,
} from "./registry";
import { layerJoinY } from "./modifiers";
import type {
  GarmentAsset,
  GarmentLayer,
  GarmentTexture,
  GarmentView,
} from "./types";

function selectedUpperAsset(dress: Dress): GarmentAsset | undefined {
  if (dress.topStyle === "unknown" || dress.neckline === "unknown") {
    return undefined;
  }
  const matched = findUpperAsset(dress.topStyle, dress.neckline);
  if (matched) return matched;
  if (dress.topStyle === "longSleeve") {
    return findMaterialAsset(dress.fabric) ?? findMaterialAsset("mikadoSatin");
  }
  return findUpperFamilyAsset(dress.topStyle);
}

function upperLayer(asset: GarmentAsset, dress: Dress): GarmentLayer {
  return {
    asset,
    region: "upper",
    neckline: dress.neckline === "unknown" ? undefined : dress.neckline,
    joinY: layerJoinY(asset, dress.waistline, "upper"),
    sourceJoinY: asset.anchors.waistY,
  };
}

function lowerLayer(asset: GarmentAsset, dress: Dress): GarmentLayer {
  return {
    asset,
    region: "lower",
    joinY: layerJoinY(asset, dress.waistline, "lower"),
    sourceJoinY: asset.anchors.waistY,
  };
}

function lowerAssetFor(dress: Dress): GarmentAsset | undefined {
  if (dress.silhouette === "unknown") return undefined;
  const exact = findLowerAsset(dress.silhouette, dress.waistline);
  if (exact) return exact;
  if (dress.silhouette === "empire") {
    return findLowerAsset("empire", "empire");
  }
  return findLowerAsset(dress.silhouette, "natural");
}

export function frontUpperLayers(dress: Dress): readonly GarmentLayer[] {
  if (dress.topStyle === "unknown" || dress.neckline === "unknown") return [];
  const upper = selectedUpperAsset(dress);
  return upper ? [upperLayer(upper, dress)] : [];
}

export function fullFrontLayers(dress: Dress): readonly GarmentLayer[] {
  if (dress.topStyle === "unknown") {
    const lower = lowerAssetFor(dress);
    return lower ? [lowerLayer(lower, dress)] : [];
  }
  if (dress.neckline === "unknown") {
    const lower = lowerAssetFor(dress);
    return lower ? [lowerLayer(lower, dress)] : [];
  }
  const upper = selectedUpperAsset(dress);
  if (!upper) return [];
  if (dress.silhouette === "unknown") {
    return [upperLayer(upper, dress)];
  }
  if (dress.topStyle === "strapless" && dress.neckline === "sweetheart") {
    const directLower = lowerAssetFor(dress);
    if (directLower && dress.fabric === "mikadoSatin") {
      return [
        {
          asset: directLower,
          region: "full",
          joinY: layerJoinY(directLower, dress.waistline, "full"),
          sourceJoinY: directLower.anchors.waistY,
        },
      ];
    }
  }
  if (dress.silhouette === "aLine") {
    const exact = findUpperAsset(dress.topStyle, dress.neckline);
    if (dress.topStyle === "longSleeve" && dress.neckline === "high") {
      return [
        {
          asset: upper,
          region: "full",
          joinY: layerJoinY(upper, dress.waistline, "full"),
          sourceJoinY: upper.anchors.waistY,
        },
      ];
    }
    if (exact && dress.fabric === "mikadoSatin") {
      return [
        {
          asset: upper,
          region: "full",
          joinY: layerJoinY(upper, dress.waistline, "full"),
          sourceJoinY: upper.anchors.waistY,
        },
      ];
    }
    return [lowerLayer(upper, dress), upperLayer(upper, dress)];
  }
  const lower = lowerAssetFor(dress);
  return lower
    ? [lowerLayer(lower, dress), upperLayer(upper, dress)]
    : [upperLayer(upper, dress)];
}

export function materialTextures(
  dress: Dress,
  layers: readonly GarmentLayer[],
): readonly GarmentTexture[] {
  if (dress.fabric === "unknown" || dress.fabric === "mikadoSatin") return [];
  const material = findMaterialAsset(dress.fabric);
  if (!material) return [];
  return layers
    .filter(({ asset }) => asset.assetId !== material.assetId)
    .map((layer) => ({
      asset: material,
      region: layer.region,
      maskAssetId: layer.asset.assetId,
      neckline: layer.neckline,
      joinY: layer.joinY,
    }));
}

export function detailAssetsFor(
  dress: Dress,
  view: GarmentView = "full",
): readonly GarmentAsset[] {
  const selected = [
    ...dress.details,
    ...(view === "back" && dress.backStyle === "bowBack"
      ? ["backBow" as const]
      : []),
  ]
    .map((detail) => findDetailAsset(detail))
    .filter((asset): asset is GarmentAsset => asset !== undefined);
  return selected.filter(
    (asset, index, all) =>
      all.findIndex((candidate) => candidate.assetId === asset.assetId) ===
      index,
  );
}
