import type {
  Dress,
  DressColor,
  Fabric,
  Neckline,
  QuickTag,
  Silhouette,
  TopStyle,
} from "../../types/domain";

export type Option<T extends string> = {
  id: T;
  label: string;
  technical?: string;
};

export const topStyleOptions: Option<TopStyle>[] = [
  { id: "unknown", label: "기억 안 남" },
  { id: "strapless", label: "끈 없음", technical: "Strapless" },
  { id: "offShoulder", label: "오프숄더", technical: "Off-shoulder" },
  { id: "strap", label: "끈 있는 형태", technical: "Strap" },
  { id: "halter", label: "홀터넥", technical: "Halter" },
  { id: "shortSleeve", label: "짧은 소매", technical: "Short/Cap sleeve" },
  { id: "longSleeve", label: "긴 소매", technical: "Long sleeve" },
];
export const necklineOptions: Option<Neckline>[] = [
  { id: "unknown", label: "기억 안 남" },
  { id: "straight", label: "일자형", technical: "Straight" },
  { id: "sweetheart", label: "하트형", technical: "Sweetheart" },
  { id: "v", label: "브이형", technical: "V-neck" },
  { id: "square", label: "네모형", technical: "Square" },
  { id: "scoop", label: "둥근형", technical: "Scoop" },
  { id: "asymmetric", label: "사선형", technical: "Asymmetric" },
];
export const silhouetteOptions: Option<Silhouette>[] = [
  { id: "unknown", label: "기억 안 남" },
  { id: "aLine", label: "A라인", technical: "A-line" },
  { id: "ballGown", label: "풍성한 벨라인", technical: "Ball gown" },
  { id: "mermaid", label: "무릎부터 크게 퍼짐", technical: "Mermaid" },
  { id: "empire", label: "가슴 아래부터 퍼짐", technical: "Empire" },
];
export const fabricOptions: Option<Fabric>[] = [
  { id: "unknown", label: "기억 안 남" },
  { id: "mikadoSatin", label: "매끈한 실크", technical: "Mikado/Satin" },
  { id: "lace", label: "레이스", technical: "Lace" },
  { id: "organzaChiffon", label: "하늘하늘", technical: "Organza/Chiffon" },
  { id: "subtleBeaded", label: "은은한 비즈", technical: "Subtle beaded" },
  { id: "ornateBeaded", label: "화려한 비즈", technical: "Ornate beaded" },
  { id: "floral3D", label: "입체 꽃", technical: "3D Floral" },
];
export const colorOptions: Option<DressColor>[] = [
  { id: "unknown", label: "기억 안 남" },
  { id: "pureWhite", label: "새하얀 화이트", technical: "Pure white" },
  { id: "ivory", label: "아이보리", technical: "Ivory" },
  { id: "champagne", label: "샴페인 베이지", technical: "Champagne" },
];
export const quickTagOptions: Option<QuickTag>[] = [
  "상체 예쁨",
  "허리 예쁨",
  "얼굴이 살아남",
  "날씬해 보임",
  "사진빨",
  "무거움",
  "불편함",
  "신부 픽",
  "동행인 픽",
].map((id) => ({ id: id as QuickTag, label: id }));

export type PresentedTopStyle = Exclude<
  TopStyle,
  "spaghetti" | "wideStrap" | "oneShoulder"
>;
export type PresentedNeckline = Exclude<Neckline, "high" | "illusion">;
export type PresentedSilhouette = Exclude<
  Silhouette,
  "fitAndFlare" | "sheath" | "teaLength"
>;
export type PresentedFabric = Exclude<Fabric, "tulle" | "glitterBeaded">;
export type PresentedDress = Omit<
  Dress,
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "waistline"
  | "backStyle"
  | "fabric"
  | "train"
  | "details"
> & {
  topStyle: PresentedTopStyle;
  neckline: PresentedNeckline;
  silhouette: PresentedSilhouette;
  waistline: "unknown";
  backStyle: "unknown";
  fabric: PresentedFabric;
  train: "unknown";
  details: [];
};

const presentationTopStyle: Record<TopStyle, PresentedTopStyle> = {
  unknown: "unknown",
  strapless: "strapless",
  offShoulder: "offShoulder",
  strap: "strap",
  spaghetti: "strap",
  wideStrap: "strap",
  halter: "halter",
  oneShoulder: "unknown",
  shortSleeve: "shortSleeve",
  longSleeve: "longSleeve",
};
const presentationNeckline: Record<Neckline, PresentedNeckline> = {
  unknown: "unknown",
  straight: "straight",
  sweetheart: "sweetheart",
  v: "v",
  square: "square",
  scoop: "scoop",
  high: "unknown",
  illusion: "unknown",
  asymmetric: "asymmetric",
};
const presentationSilhouette: Record<Silhouette, PresentedSilhouette> = {
  unknown: "unknown",
  aLine: "aLine",
  ballGown: "ballGown",
  empire: "empire",
  fitAndFlare: "mermaid",
  mermaid: "mermaid",
  sheath: "unknown",
  teaLength: "unknown",
};
const presentationFabric: Record<Fabric, PresentedFabric> = {
  unknown: "unknown",
  mikadoSatin: "mikadoSatin",
  lace: "lace",
  subtleBeaded: "subtleBeaded",
  ornateBeaded: "ornateBeaded",
  tulle: "unknown",
  organzaChiffon: "organzaChiffon",
  glitterBeaded: "subtleBeaded",
  floral3D: "floral3D",
};

export function dressForPresentation(dress: Dress): PresentedDress {
  return {
    ...dress,
    topStyle: presentationTopStyle[dress.topStyle],
    neckline: presentationNeckline[dress.neckline],
    silhouette: presentationSilhouette[dress.silhouette],
    waistline: "unknown",
    backStyle: "unknown",
    fabric: presentationFabric[dress.fabric],
    train: "unknown",
    details: [],
    quickTags: [...dress.quickTags],
  };
}

export function optionLabel<T extends string>(
  options: Option<T>[],
  id: T | undefined,
) {
  return options.find((o) => o.id === id)?.label ?? "기억 안 남";
}
export function summarizeDress(dress: Dress) {
  const presented = dressForPresentation(dress);
  return [
    optionLabel(topStyleOptions, presented.topStyle),
    optionLabel(necklineOptions, presented.neckline),
    optionLabel(silhouetteOptions, presented.silhouette),
    optionLabel(fabricOptions, presented.fabric),
    optionLabel(colorOptions, presented.color),
  ].filter((x) => x !== "기억 안 남");
}
export const colorHex: Record<DressColor, string> = {
  unknown: "#f7f5f3",
  pureWhite: "#ffffff",
  ivory: "#fffaf0",
  champagne: "#f4e6d1",
};
