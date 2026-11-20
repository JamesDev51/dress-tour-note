import type {
  Dress,
  DressDetail,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
  Waistline,
} from "../../../types/domain";
import { GARMENT_ASSETS, GARMENT_RENDERER_VERSION } from "./registryData";
import type { GarmentAsset, GarmentAssetRole, GarmentLayer } from "./types";

export { GARMENT_ASSETS, GARMENT_RENDERER_VERSION } from "./registryData";

export const GARMENT_ASSET_REGISTRY_VERSION = `${GARMENT_RENDERER_VERSION}/30-webp`;

const supportedUpperPairs = [
  "longSleeve+high",
  "offShoulder+high",
  "strap+high",
  "spaghetti+high",
  "wideStrap+high",
  "halter+high",
  "oneShoulder+high",
  "shortSleeve+high",
  "halter+illusion",
  "longSleeve+illusion",
  "offShoulder+illusion",
  "oneShoulder+asymmetric",
  "strapless+high",
  "strapless+illusion",
] as const;

export type SupportedUpperPair = (typeof supportedUpperPairs)[number];

export function upperPairKey(topStyle: TopStyle, neckline: Neckline): string {
  return `${topStyle}+${neckline}`;
}

export function isSupportedUpperPair(
  topStyle: TopStyle,
  neckline: Neckline,
): boolean {
  return supportedUpperPairs.some(
    (pair) => pair === upperPairKey(topStyle, neckline),
  );
}

export function findGarmentAsset(assetId: string): GarmentAsset | undefined {
  return GARMENT_ASSETS.find((asset) => asset.assetId === assetId);
}

export function findAssetByRole(
  role: GarmentAssetRole,
  predicate: (asset: GarmentAsset) => boolean,
): GarmentAsset | undefined {
  return GARMENT_ASSETS.find(
    (asset) => asset.role === role && predicate(asset),
  );
}

export function findMaterialAsset(fabric: Fabric): GarmentAsset | undefined {
  return findAssetByRole(
    "material-master",
    (asset) => asset.coverage.fabric === fabric,
  );
}

export function findLowerAsset(
  silhouette: Silhouette,
  waistline: Waistline,
): GarmentAsset | undefined {
  return findAssetByRole(
    "lower-silhouette",
    (asset) =>
      asset.coverage.silhouette === silhouette &&
      asset.coverage.waistline === waistline,
  );
}

export function findUpperAsset(
  topStyle: TopStyle,
  neckline: Neckline,
): GarmentAsset | undefined {
  const pair = upperPairKey(topStyle, neckline);
  return GARMENT_ASSETS.find((asset) => {
    const coveragePair = upperPairKey(
      asset.coverage.topStyle ?? "unknown",
      asset.coverage.neckline ?? "unknown",
    );
    return (
      (asset.role === "upper-family" || asset.role === "matched-upper") &&
      coveragePair === pair
    );
  });
}

export function findUpperFamilyAsset(
  topStyle: TopStyle,
): GarmentAsset | undefined {
  if (topStyle === "strapless") {
    return findUpperAsset("strapless", "high");
  }
  return findAssetByRole(
    "upper-family",
    (asset) => asset.coverage.topStyle === topStyle,
  );
}

export function findBackCore(): GarmentAsset | undefined {
  return findAssetByRole("back-core", () => true);
}

export function findDetailAsset(detail: DressDetail): GarmentAsset | undefined {
  return findAssetByRole(
    "detail-master",
    (asset) => asset.coverage.details?.includes(detail) ?? false,
  );
}

export function layersForFullAsset(
  asset: GarmentAsset,
): readonly GarmentLayer[] {
  return [{ asset, region: "full" }];
}

export function layersForUpperAndLower(
  upper: GarmentAsset,
  lower: GarmentAsset,
): readonly GarmentLayer[] {
  return [
    { asset: lower, region: "lower" },
    { asset: upper, region: "upper" },
  ];
}

export function isFixedMikadoFixture(dress: Dress): boolean {
  return (
    dress.fabric === "mikadoSatin" &&
    dress.color === "ivory" &&
    dress.waistline === "natural" &&
    dress.train === "none" &&
    dress.details.length === 0
  );
}
