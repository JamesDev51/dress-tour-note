export type Id = string;
export type ISODateTime = string;
export type LocalDate = string;

export const TOP_STYLES = [
  "unknown",
  "strapless",
  "offShoulder",
  "spaghetti",
  "wideStrap",
  "halter",
  "oneShoulder",
  "shortSleeve",
  "longSleeve",
] as const;
export const NECKLINES = [
  "unknown",
  "straight",
  "sweetheart",
  "v",
  "square",
  "scoop",
  "high",
  "illusion",
  "asymmetric",
] as const;
export const SILHOUETTES = [
  "unknown",
  "aLine",
  "ballGown",
  "fitAndFlare",
  "mermaid",
  "sheath",
  "teaLength",
] as const;
export const TRAINS = [
  "unknown",
  "none",
  "sweep",
  "chapel",
  "cathedral",
] as const;
export const FABRICS = [
  "unknown",
  "mikadoSatin",
  "lace",
  "tulle",
  "organzaChiffon",
  "glitterBeaded",
  "floral3D",
] as const;
export const DRESS_COLORS = [
  "unknown",
  "pureWhite",
  "ivory",
  "champagne",
] as const;
export const WAISTLINES = [
  "unknown",
  "natural",
  "basque",
  "drop",
  "empire",
] as const;
export const BACK_STYLES = [
  "unknown",
  "openBack",
  "vBack",
  "buttonBack",
  "corsetBack",
  "illusionBack",
  "bowBack",
] as const;
export const DRESS_DETAILS = [
  "corset",
  "draping",
  "waistBow",
  "backBow",
  "pearl",
  "sequin",
  "floral",
  "slit",
  "sheer",
  "detachableSleeve",
  "overskirt",
  "buttons",
] as const;
export const QUICK_TAGS = [
  "상체 예쁨",
  "허리 예쁨",
  "얼굴이 살아남",
  "날씬해 보임",
  "사진빨",
  "무거움",
  "불편함",
  "신부 픽",
  "동행인 픽",
] as const;

export type TopStyle = (typeof TOP_STYLES)[number];
export type Neckline = (typeof NECKLINES)[number];
export type Silhouette = (typeof SILHOUETTES)[number];
export type Train = (typeof TRAINS)[number];
export type Fabric = (typeof FABRICS)[number];
export type DressColor = (typeof DRESS_COLORS)[number];
export type Waistline = (typeof WAISTLINES)[number];
export type BackStyle = (typeof BACK_STYLES)[number];
export type DressDetail = (typeof DRESS_DETAILS)[number];
export type QuickTag = (typeof QUICK_TAGS)[number];

export interface Tour {
  id: Id;
  title: string;
  brideName?: string;
  tourDate?: LocalDate;
  status: "draft" | "completed";
  faceAssetId?: Id;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  lastOpenedAt: ISODateTime;
  lastExportedAt?: ISODateTime;
}

export interface Shop {
  id: Id;
  tourId: Id;
  name: string;
  order: number;
  appointmentAt?: ISODateTime;
  consultant?: string;
  memo?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface FaceTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface Dress {
  id: Id;
  tourId: Id;
  shopId: Id;
  order: number;
  label: string;
  topStyle: TopStyle;
  neckline: Neckline;
  silhouette: Silhouette;
  waistline: Waistline;
  backStyle?: BackStyle;
  fabric: Fabric;
  color: DressColor;
  train: Train;
  details: DressDetail[];
  quickTags: QuickTag[];
  rating?: 1 | 2 | 3 | 4 | 5;
  memo: string;
  isFavorite: boolean;
  faceTransform?: FaceTransform;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface LocalAsset {
  id: Id;
  tourId: Id;
  kind: "face";
  mimeType: "image/webp" | "image/jpeg";
  blob: Blob;
  width: number;
  height: number;
  byteLength: number;
  sha256: string;
  createdAt: ISODateTime;
}

export interface TourSnapshot {
  tour: Tour;
  shops: Shop[];
  dresses: Dress[];
  assets: LocalAsset[];
}

export const DEFAULT_FACE_TRANSFORM: FaceTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};
