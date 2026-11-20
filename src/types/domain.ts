export type Id = string;
export type ISODateTime = string;
export type LocalDate = string;

export const TOP_STYLES = [
  "unknown",
  "strapless",
  "offShoulder",
  "strap",
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
  "empire",
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
  "subtleBeaded",
  "ornateBeaded",
  "tulle",
  "organzaChiffon",
  "glitterBeaded",
  "floral3D",
] as const;
export const LOWER_FABRIC_STARTS = ["waist", "hip", "thigh", "knee"] as const;
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
export const BACK_CLOSURES = ["unknown", "none", "buttons", "laceUp"] as const;
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
  "가벼움",
  "편함",
  "조임",
  "흘러내림",
  "까슬거림",
  "팔이 부각됨",
  "목이 길어 보임",
  "어깨가 정리됨",
  "상체가 짧아 보임",
  "골반이 강조됨",
] as const;

export const DRESS_OPTION_CATEGORIES = [
  "top",
  "neckline",
  "silhouette",
  "fabric",
  "color",
  "waistline",
  "backStyle",
  "train",
  "details",
] as const;

export type TopStyle = (typeof TOP_STYLES)[number];
export type Neckline = (typeof NECKLINES)[number];
export type Silhouette = (typeof SILHOUETTES)[number];
export type Train = (typeof TRAINS)[number];
export type Fabric = (typeof FABRICS)[number];
export type LowerFabricStart = (typeof LOWER_FABRIC_STARTS)[number];
export type DressColor = (typeof DRESS_COLORS)[number];
export type Waistline = (typeof WAISTLINES)[number];
export type BackStyle = (typeof BACK_STYLES)[number];
export type BackClosure = (typeof BACK_CLOSURES)[number];
export type DressDetail = (typeof DRESS_DETAILS)[number];
export type QuickTag = (typeof QUICK_TAGS)[number];
export type DressOptionCategory = (typeof DRESS_OPTION_CATEGORIES)[number];

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

export const SKETCH_PEN_WIDTHS = [1, 2, 4] as const;
export const MAX_SKETCH_STROKES = 100;
export const MAX_SKETCH_POINTS = 512;
export type SketchPenWidth = (typeof SKETCH_PEN_WIDTHS)[number];
export type SketchPoint = [number, number];
export interface SketchStroke {
  width: SketchPenWidth;
  /** Coordinates normalized to the full front-view canvas, including its margins. */
  points: SketchPoint[];
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
  backClosure?: BackClosure;
  fabric: Fabric;
  upperFabric?: Fabric;
  lowerFabric?: Fabric;
  lowerFabricStart?: LowerFabricStart;
  sketchStrokes?: SketchStroke[];
  color: DressColor;
  train: Train;
  details: DressDetail[];
  quickTags: QuickTag[];
  rating?: 1 | 2 | 3 | 4 | 5;
  memoryCue?: string;
  likedReason?: string;
  concern?: string;
  memo: string;
  isFavorite: boolean;
  coreRecordedAt?: ISODateTime;
  faceTransform?: FaceTransform;
  customOptions?: Partial<Record<DressOptionCategory, string>>;
  stylingVariants?: DressStylingVariant[];
  preferredStylingId?: Id;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type DressLookSnapshot = Pick<
  Dress,
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "waistline"
  | "backStyle"
  | "backClosure"
  | "fabric"
  | "upperFabric"
  | "lowerFabric"
  | "lowerFabricStart"
  | "sketchStrokes"
  | "color"
  | "train"
  | "details"
  | "customOptions"
  | "memoryCue"
  | "likedReason"
  | "concern"
  | "memo"
  | "quickTags"
>;

export interface DressStylingVariant {
  id: Id;
  label: string;
  snapshot: DressLookSnapshot;
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
