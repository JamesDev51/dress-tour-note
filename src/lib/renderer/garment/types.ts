import type {
  BackStyle,
  DressColor,
  DressDetail,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
  Train,
  Waistline,
} from "../../../types/domain";

export const GARMENT_VIEWS = ["full", "upper", "back"] as const;
export type GarmentView = (typeof GARMENT_VIEWS)[number];

export const GARMENT_STATUSES = ["ready", "partial", "unavailable"] as const;
export type GarmentStatus = (typeof GARMENT_STATUSES)[number];

export const GARMENT_ASSET_ROLES = [
  "material-master",
  "lower-silhouette",
  "upper-family",
  "matched-upper",
  "back-core",
  "detail-master",
] as const;
export type GarmentAssetRole = (typeof GARMENT_ASSET_ROLES)[number];

export const GARMENT_LAYER_REGIONS = ["full", "upper", "lower"] as const;
export type GarmentLayerRegion = (typeof GARMENT_LAYER_REGIONS)[number];

export type GarmentField =
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "waistline"
  | "fabric"
  | "color"
  | "backStyle"
  | "train"
  | "details";

export type GarmentAssetCoverage = {
  readonly view: "front-full" | "back-full";
  readonly topStyle?: TopStyle;
  readonly neckline?: Neckline;
  readonly silhouette?: Silhouette;
  readonly waistline?: Waistline;
  readonly fabric?: Fabric;
  readonly color?: DressColor;
  readonly backStyle?: BackStyle | "neutralCoreOnly";
  readonly train?: Train;
  readonly details?: readonly DressDetail[];
};

export type GarmentSourceFrame = {
  readonly width: number;
  readonly height: number;
  readonly logicalWidth: number;
  readonly logicalHeight: number;
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

export type GarmentLogicalBounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type GarmentAnchors = {
  readonly centerX: number;
  readonly necklineY?: number;
  readonly shoulderY?: number;
  readonly waistY?: number;
  readonly hemY?: number;
};

export type GarmentAsset = {
  readonly assetId: string;
  readonly path: string;
  readonly role: GarmentAssetRole;
  readonly mime: "image/webp";
  readonly byteLength: number;
  readonly sourceSha256: string;
  readonly optimizedSha256: string;
  readonly sourceFrame: GarmentSourceFrame;
  readonly imagePlacement?: GarmentLogicalBounds;
  readonly logicalBounds: GarmentLogicalBounds;
  readonly anchors: GarmentAnchors;
  readonly regions: Readonly<Record<string, GarmentLogicalBounds>>;
  readonly coverage: GarmentAssetCoverage;
  readonly alpha: "runtime-matte";
  readonly rendererVersion: string;
};

export type GarmentLayer = {
  readonly asset: GarmentAsset;
  readonly region: GarmentLayerRegion;
  readonly neckline?: Neckline;
  readonly joinY?: number;
  readonly sourceJoinY?: number;
};

export type GarmentTexture = {
  readonly asset: GarmentAsset;
  readonly region: GarmentLayerRegion;
  readonly maskAssetId: string;
  readonly neckline?: Neckline;
  readonly joinY?: number;
};

export type GarmentReason =
  | "no-match"
  | "unknown-field"
  | "custom-option"
  | "duplicate-details"
  | "unsupported-waistline"
  | "unsupported-train"
  | "unsupported-detail"
  | "missing-asset"
  | "asset-load-failed";

export type GarmentRecipe = {
  readonly view: GarmentView;
  readonly color: DressColor;
  readonly topStyle?: TopStyle;
  readonly neckline?: Neckline;
  readonly silhouette?: Silhouette;
  readonly waistline?: Waistline;
  readonly fabric?: Fabric;
  readonly train?: Train;
  readonly details?: readonly DressDetail[];
  readonly backStyle?: BackStyle;
  readonly status: GarmentStatus;
  readonly reason?: GarmentReason;
  readonly markup: string;
  readonly viewBox: GarmentLogicalBounds;
  readonly logicalBounds: GarmentLogicalBounds;
  readonly layers: readonly GarmentLayer[];
  readonly textures: readonly GarmentTexture[];
  readonly detailAssets?: readonly GarmentAsset[];
  readonly assetIds: readonly string[];
  readonly resolvedFields: readonly GarmentField[];
  readonly missingFields: readonly GarmentField[];
  readonly warnings: readonly string[];
};

export type GarmentArtworkOptions = {
  readonly view: GarmentView;
  readonly embedAssets: boolean;
  readonly namespace?: string;
  readonly signal?: AbortSignal;
};

export type GarmentMarkupOptions = {
  readonly namespace?: string;
  readonly assetHrefs?: ReadonlyMap<string, string>;
};

export type GarmentArtworkResult = GarmentRecipe;

export function isGarmentView(value: string): value is GarmentView {
  return GARMENT_VIEWS.some((view) => view === value);
}
