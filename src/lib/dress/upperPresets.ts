import type { Neckline, TopStyle } from "../../types/domain";

export type UpperPreset = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly topStyle: Exclude<TopStyle, "unknown">;
  readonly neckline: Exclude<Neckline, "unknown">;
};

// These are the initial product choices, not a measured popularity ranking.
export const PRIMARY_UPPER_PRESETS = [
  {
    id: "strapless-straight",
    label: "끈 없음 · 일자 가슴선",
    description: "팔과 어깨가 드러나고 가슴 위가 일자예요.",
    topStyle: "strapless",
    neckline: "straight",
  },
  {
    id: "strapless-sweetheart",
    label: "끈 없음 · 하트 가슴선",
    description: "팔과 어깨가 드러나고 가슴 중앙이 하트 모양이에요.",
    topStyle: "strapless",
    neckline: "sweetheart",
  },
  {
    id: "spaghetti-straight",
    label: "가는 끈 · 일자 가슴선",
    description: "가느다란 끈이 어깨를 지나고 팔은 드러나요.",
    topStyle: "spaghetti",
    neckline: "straight",
  },
  {
    id: "offShoulder-sweetheart",
    label: "어깨 감쌈 · 하트 가슴선",
    description: "천이 팔 윗부분을 감싸고 어깨 위는 드러나요.",
    topStyle: "offShoulder",
    neckline: "sweetheart",
  },
  {
    id: "shortSleeve-scoop",
    label: "짧은 소매 · 둥근 가슴선",
    description: "팔 윗부분을 짧게 덮고 가슴 위가 둥글어요.",
    topStyle: "shortSleeve",
    neckline: "scoop",
  },
  {
    id: "longSleeve-high",
    label: "긴 소매 · 목까지 덮임",
    description: "손목 가까이까지 소매가 이어지고 목 위까지 덮어요.",
    topStyle: "longSleeve",
    neckline: "high",
  },
] as const satisfies readonly UpperPreset[];

export const ADDITIONAL_UPPER_PRESETS = [
  {
    id: "strap-scoop",
    label: "일반 끈 · 둥근 가슴선",
    description: "어깨를 지나는 끈과 둥근 가슴선이 있어요.",
    topStyle: "strap",
    neckline: "scoop",
  },
  {
    id: "wideStrap-square",
    label: "넓은 끈 · 사각 가슴선",
    description: "넓은 끈이 어깨를 덮고 가슴 위가 네모나요.",
    topStyle: "wideStrap",
    neckline: "square",
  },
  {
    id: "halter-high",
    label: "목 뒤 연결 · 목까지 덮임",
    description: "천이 목 뒤로 이어지고 양쪽 어깨와 팔은 드러나요.",
    topStyle: "halter",
    neckline: "high",
  },
  {
    id: "oneShoulder-asymmetric",
    label: "한쪽 어깨 · 사선 가슴선",
    description: "한쪽 어깨만 덮고 가슴 위가 사선으로 이어져요.",
    topStyle: "oneShoulder",
    neckline: "asymmetric",
  },
] as const satisfies readonly UpperPreset[];

export const UPPER_PRESETS: readonly UpperPreset[] = [
  ...PRIMARY_UPPER_PRESETS,
  ...ADDITIONAL_UPPER_PRESETS,
];

export function findUpperPreset(topStyle: TopStyle, neckline: Neckline) {
  return UPPER_PRESETS.find(
    (preset) => preset.topStyle === topStyle && preset.neckline === neckline,
  );
}
