import type {
  BackClosure,
  BackStyle,
  Dress,
  DressColor,
  DressDetail,
  DressOptionCategory,
  Fabric,
  Neckline,
  QuickTag,
  Silhouette,
  TopStyle,
  Train,
  Waistline,
} from "../../types/domain";
import { QUICK_TAGS } from "../../types/domain";
import { resolveBackClosure } from "./backDetails";

// allow: SIZE_OK — this module is the indivisible, pure-data dress catalog.
export type Option<T extends string> = {
  readonly id: T;
  readonly label: string;
  readonly description: string;
  readonly aliases?: readonly string[];
  readonly technical?: string;
};

export class CatalogIdError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`Unknown dress option ID: ${id}`);
    this.name = "CatalogIdError";
    this.id = id;
  }
}

export function isCatalogId<T extends string>(
  options: readonly Option<T>[],
  id: string,
): id is T {
  return options.some((option) => option.id === id);
}

export function assertCatalogId<T extends string>(
  options: readonly Option<T>[],
  id: string,
): asserts id is T {
  if (!isCatalogId(options, id)) throw new CatalogIdError(id);
}

export const topStyleOptions: readonly Option<TopStyle>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "상의 형태가 기억나지 않아요.",
  },
  {
    id: "strapless",
    label: "끈 없음",
    description: "어깨 끈 없이 가슴선을 드러내는 상의예요.",
    technical: "Strapless",
  },
  {
    id: "offShoulder",
    label: "어깨 감쌈",
    description: "어깨를 살짝 드러내고 소매가 팔 윗부분을 감싸요.",
    aliases: ["오프 숄더"],
    technical: "Off-shoulder",
  },
  {
    id: "strap",
    label: "일반 끈",
    description: "어깨를 지나는 일반적인 끈이 있는 형태예요.",
    aliases: ["끈 있는 형태"],
    technical: "Strap",
  },
  {
    id: "spaghetti",
    label: "가는 끈",
    description: "가느다란 끈이 어깨를 지지하는 형태예요.",
    technical: "Spaghetti strap",
  },
  {
    id: "wideStrap",
    label: "넓은 끈",
    description: "넓은 끈이 어깨를 안정감 있게 덮는 형태예요.",
    technical: "Wide strap",
  },
  {
    id: "halter",
    label: "목 뒤로 연결",
    description: "끈이나 천이 목 뒤로 올라가 어깨를 드러내요.",
    technical: "Halter",
  },
  {
    id: "oneShoulder",
    label: "한쪽 어깨",
    description: "한쪽 어깨만 덮고 반대쪽 어깨를 드러내는 형태예요.",
    technical: "One-shoulder",
  },
  {
    id: "shortSleeve",
    label: "짧은 소매",
    description: "팔 윗부분을 짧게 덮는 소매가 있어요.",
    aliases: ["반소매"],
    technical: "Short/Cap sleeve",
  },
  {
    id: "longSleeve",
    label: "긴 소매",
    description: "손목 가까이까지 이어지는 긴 소매가 있어요.",
    technical: "Long sleeve",
  },
];

export const necklineOptions: readonly Option<Neckline>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "목선 모양이 기억나지 않아요.",
  },
  {
    id: "straight",
    label: "일자 가슴선",
    description: "가슴 위를 수평에 가깝게 가로지르는 목선이에요.",
    aliases: ["일자 네크라인"],
    technical: "Straight",
  },
  {
    id: "sweetheart",
    label: "하트 가슴선",
    description: "가슴 중앙이 하트 윗선처럼 굴곡진 목선이에요.",
    aliases: ["하트 네크라인"],
    technical: "Sweetheart",
  },
  {
    id: "v",
    label: "브이넥",
    description: "가슴 중앙으로 V자 형태로 내려가는 목선이에요.",
    technical: "V-neck",
  },
  {
    id: "square",
    label: "사각 목선",
    description: "가슴 위가 네모난 선처럼 각진 목선이에요.",
    aliases: ["사각 네크라인"],
    technical: "Square",
  },
  {
    id: "scoop",
    label: "둥근 목선",
    description: "둥근 U자 곡선으로 깊게 파인 목선이에요.",
    aliases: ["U넥"],
    technical: "Scoop",
  },
  {
    id: "high",
    label: "목까지 덮임",
    description: "목 가까이까지 올라와 쇄골을 덮는 목선이에요.",
    technical: "High neck",
  },
  {
    id: "illusion",
    label: "망사로 덮인 목선",
    description: "살결처럼 보이는 얇은 망사 위로 목선이 이어져 보여요.",
    aliases: ["시스루 네크라인"],
    technical: "Illusion",
  },
  {
    id: "asymmetric",
    label: "사선 목·가슴선",
    description: "좌우 높이나 선이 서로 다른 목선이에요.",
    aliases: ["언밸런스 네크라인"],
    technical: "Asymmetric",
  },
];

export const silhouetteOptions: readonly Option<Silhouette>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "치마 전체 실루엣이 기억나지 않아요.",
  },
  {
    id: "aLine",
    label: "A라인",
    description: "허리에서 밑단으로 갈수록 자연스럽게 퍼지는 실루엣이에요.",
    technical: "A-line",
  },
  {
    id: "ballGown",
    label: "벨라인",
    description: "허리부터 둥글고 풍성하게 퍼져요.",
    technical: "Ball gown",
  },
  {
    id: "empire",
    label: "가슴 아래부터 퍼짐",
    description: "가슴 바로 아래에서 치마가 시작해 아래로 흐르는 실루엣이에요.",
    technical: "Empire",
  },
  {
    id: "fitAndFlare",
    label: "피트 앤 플레어",
    description: "몸선을 따라 내려오다 허벅지 아래부터 부드럽게 퍼져요.",
    technical: "Fit-and-flare",
  },
  {
    id: "mermaid",
    label: "머메이드",
    description: "몸선을 따라 내려오다가 허벅지나 무릎 부근부터 퍼져요.",
    technical: "Mermaid",
  },
  {
    id: "sheath",
    label: "슬림라인",
    description: "몸선을 따라 비교적 곧고 슬림하게 떨어지는 실루엣이에요.",
    aliases: ["슬림 라인"],
    technical: "Sheath",
  },
  {
    id: "teaLength",
    label: "발목 위 길이",
    description: "종아리 중간에서 발목 사이 길이로 떨어지는 실루엣이에요.",
    technical: "Tea length",
  },
];

export const fabricOptions: readonly Option<Fabric>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "주된 소재나 장식감이 기억나지 않아요.",
  },
  {
    id: "mikadoSatin",
    label: "실크",
    description: "표면이 매끈하고 은은한 광택이 나요.",
    aliases: ["미카도"],
    technical: "Silk",
  },
  {
    id: "lace",
    label: "레이스",
    description: "실로 짠 무늬가 표면에 섬세하게 드러나는 소재예요.",
    technical: "Lace",
  },
  {
    id: "subtleBeaded",
    label: "은은한 비즈",
    description: "작은 비즈 장식이 가까이에서 은은하게 반짝여요.",
    technical: "Subtle beaded",
  },
  {
    id: "ornateBeaded",
    label: "화려한 비즈",
    description: "비즈 장식이 넓게 들어가 조명 아래에서 뚜렷하게 반짝여요.",
    technical: "Ornate beaded",
  },
  {
    id: "tulle",
    label: "망사",
    description: "가볍고 망사처럼 비치는 얇은 겹 소재예요.",
    technical: "Tulle",
  },
  {
    id: "organzaChiffon",
    label: "얇고 흐르는 원단",
    description: "가볍고 흐르며 공기감 있게 움직이는 얇은 소재예요.",
    aliases: ["쉬폰"],
    technical: "Organza/Chiffon",
  },
  {
    id: "glitterBeaded",
    label: "글리터 비즈",
    description: "반짝이와 비즈가 함께 들어가 강한 광택이 느껴지는 소재예요.",
    technical: "Glitter beaded",
  },
  {
    id: "floral3D",
    label: "입체 꽃",
    description: "입체적인 꽃 장식이 표면 위로 도드라져 보여요.",
    technical: "3D Floral",
  },
];

export const colorOptions: readonly Option<DressColor>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "드레스 색감이 기억나지 않아요.",
  },
  {
    id: "pureWhite",
    label: "흰색",
    description: "푸른 기 없이 또렷하고 밝은 흰색이에요.",
    aliases: ["새하얀 화이트"],
    technical: "Pure white",
  },
  {
    id: "ivory",
    label: "아이보리",
    description: "노란 기가 아주 살짝 도는 부드러운 흰색이에요.",
    technical: "Ivory",
  },
  {
    id: "champagne",
    label: "샴페인",
    description: "베이지와 골드 기가 은은하게 도는 따뜻한 색감이에요.",
    aliases: ["샴페인 베이지"],
    technical: "Champagne",
  },
];

export const waistlineOptions: readonly Option<Waistline>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "허리선 위치가 기억나지 않아요.",
  },
  {
    id: "natural",
    label: "기본 허리선",
    description: "원래 허리 위치에 절개선이 놓인 형태예요.",
    technical: "Natural waist",
  },
  {
    id: "basque",
    label: "V자·곡선 허리선",
    description: "허리선이 아래로 V자나 곡선으로 내려오는 형태예요.",
    technical: "Basque waist",
  },
  {
    id: "drop",
    label: "골반 쪽 허리선",
    description: "허리선이 골반 쪽으로 낮게 내려간 형태예요.",
    technical: "Drop waist",
  },
  {
    id: "empire",
    label: "가슴 아래 허리선",
    description: "가슴 바로 아래에 허리선이 놓인 형태예요.",
    technical: "Empire waist",
  },
];

export const backStyleOptions: readonly Option<BackStyle>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "등 쪽 디자인이 기억나지 않아요.",
  },
  {
    id: "openBack",
    label: "등이 넓게 파임",
    description: "등이 넓게 드러나도록 파인 디자인이에요.",
    technical: "Open back",
  },
  {
    id: "vBack",
    label: "V자로 파인 등",
    description: "등 쪽이 V자 형태로 파인 디자인이에요.",
    technical: "V-back",
  },
  {
    id: "buttonBack",
    label: "등 단추",
    description: "등 중앙을 따라 단추가 이어지는 디자인이에요.",
    technical: "Button back",
  },
  {
    id: "corsetBack",
    label: "등 뒤 묶는 끈",
    description: "등 뒤 끈을 교차로 묶어 조이는 디자인이에요.",
    technical: "Corset back",
  },
  {
    id: "illusionBack",
    label: "망사로 덮인 등",
    description: "얇은 망사 위로 등 디자인이 이어져 보이는 형태예요.",
    technical: "Illusion back",
  },
  {
    id: "bowBack",
    label: "뒤 리본",
    description: "등 뒤에 리본 장식이 중심이 되는 디자인이에요.",
    technical: "Bow back",
  },
];

export const backClosureOptions: readonly Option<BackClosure>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "등 뒤 여밈이 기억나지 않아요.",
  },
  {
    id: "none",
    label: "여밈 없음",
    description: "등 뒤에 단추나 묶는 끈이 없어요.",
  },
  {
    id: "buttons",
    label: "등 단추",
    description: "등 중앙을 따라 단추가 이어져요.",
  },
  {
    id: "laceUp",
    label: "등 뒤 묶는 끈",
    description: "등 뒤 끈을 교차로 묶어요.",
  },
];

export const trainOptions: readonly Option<Train>[] = [
  {
    id: "unknown",
    label: "기억 안 남",
    description: "치맛자락 길이가 기억나지 않아요.",
  },
  {
    id: "none",
    label: "끌림 없음",
    description: "뒤로 끌리는 치맛자락 없이 바닥선에서 끝나요.",
    technical: "No train",
  },
  {
    id: "sweep",
    label: "짧게 끌림",
    description: "바닥에 살짝 닿을 만큼 짧게 뒤로 이어져요.",
    technical: "Sweep train",
  },
  {
    id: "chapel",
    label: "중간 길이로 끌림",
    description: "예식장 바닥 위로 적당히 길게 이어지는 트레인이에요.",
    technical: "Chapel train",
  },
  {
    id: "cathedral",
    label: "길게 끌림",
    description: "예식장 통로를 덮을 만큼 길고 풍성하게 이어지는 트레인이에요.",
    technical: "Cathedral train",
  },
];

export const detailOptions: readonly Option<DressDetail>[] = [
  {
    id: "corset",
    label: "코르셋",
    description: "몸통을 잡아주는 코르셋 구조가 드러나는 디테일이에요.",
    technical: "Corset",
  },
  {
    id: "draping",
    label: "겹쳐진 주름",
    description: "천을 주름지게 겹쳐 흐르게 만든 디테일이에요.",
    technical: "Draping",
  },
  {
    id: "waistBow",
    label: "허리 리본",
    description: "허리선에 리본 장식이 더해진 디테일이에요.",
    technical: "Waist bow",
  },
  {
    id: "backBow",
    label: "뒤 리본",
    description: "등 뒤나 치맛자락 뒤에 리본 장식이 있는 디테일이에요.",
    technical: "Back bow",
  },
  {
    id: "pearl",
    label: "진주 장식",
    description: "진주 모양 장식이 표면에 더해진 디테일이에요.",
    technical: "Pearl",
  },
  {
    id: "sequin",
    label: "스팽글",
    description: "납작한 반짝이 조각이 표면을 따라 붙은 디테일이에요.",
    technical: "Sequin",
  },
  {
    id: "floral",
    label: "꽃 장식",
    description: "꽃무늬나 꽃 장식이 더해진 디테일이에요.",
    technical: "Floral",
  },
  {
    id: "slit",
    label: "치마 트임",
    description: "치마에 다리가 보이도록 낸 트임이 있어요.",
    technical: "Slit",
  },
  {
    id: "sheer",
    label: "비치는 부분",
    description: "피부가 은은히 비치는 얇은 원단 디테일이에요.",
    technical: "Sheer",
  },
  {
    id: "detachableSleeve",
    label: "탈부착 소매",
    description: "필요에 따라 떼거나 붙일 수 있는 소매예요.",
    technical: "Detachable sleeve",
  },
  {
    id: "overskirt",
    label: "덧치마",
    description: "기본 치마 위에 덧입히는 추가 스커트예요.",
    technical: "Overskirt",
  },
  {
    id: "buttons",
    label: "단추 장식",
    description: "앞이나 뒤에 장식용 단추가 이어지는 디테일이에요.",
    technical: "Buttons",
  },
];

export const quickTagOptions: readonly Option<QuickTag>[] = QUICK_TAGS.map(
  (id) => ({
    id,
    label: id,
    description: "드레스를 입었을 때 떠오른 인상이에요.",
  }),
);

export type PresentedTopStyle = TopStyle;
export type PresentedNeckline = Neckline;
export type PresentedSilhouette = Silhouette;
export type PresentedFabric = Fabric;
export type PresentedDress = Dress;

export type DressCatalogCategory =
  | DressOptionCategory
  | "waistline"
  | "backStyle"
  | "backClosure"
  | "train"
  | "details";

export type DressPresentationItem = {
  readonly category: DressCatalogCategory;
  readonly categoryLabel: string;
  readonly value?: string;
  readonly note?: string;
};

export type DressPresentation = {
  readonly core: readonly DressPresentationItem[];
  readonly details: readonly DressPresentationItem[];
  readonly exceptions: readonly DressPresentationItem[];
};

const categoryLabels: Record<DressCatalogCategory, string> = {
  top: "끈·소매",
  neckline: "목·가슴선",
  silhouette: "전체 모양",
  fabric: "소재·표면",
  color: "색상",
  waistline: "허리선",
  backStyle: "등 파임",
  backClosure: "등 뒤 여밈",
  train: "뒤로 끌리는 길이",
  details: "장식과 세부 특징",
};

function optionFor<T extends string>(
  options: readonly Option<T>[],
  id: T | undefined,
) {
  return options.find((option) => option.id === id);
}

function selectedItem<T extends string>(
  category: DressCatalogCategory,
  options: readonly Option<T>[],
  id: T | undefined,
): DressPresentationItem | undefined {
  const option = optionFor(options, id);
  if (!option || option.id === "unknown") return undefined;

  return {
    category,
    categoryLabel: categoryLabels[category],
    value: option.label,
  };
}

export function dressForPresentation(dress: Dress): Dress {
  const copy = {
    ...dress,
    details: [...dress.details],
    quickTags: [...dress.quickTags],
  };

  return dress.customOptions
    ? { ...copy, customOptions: { ...dress.customOptions } }
    : copy;
}

export function formatDressPresentation(dress: Dress): DressPresentation {
  const core = [
    selectedItem("silhouette", silhouetteOptions, dress.silhouette),
    selectedItem("fabric", fabricOptions, dress.fabric),
    selectedItem("top", topStyleOptions, dress.topStyle),
    selectedItem("neckline", necklineOptions, dress.neckline),
    selectedItem("color", colorOptions, dress.color),
  ].filter((item): item is DressPresentationItem => Boolean(item));
  const details = [
    selectedItem("waistline", waistlineOptions, dress.waistline),
    selectedItem(
      "backStyle",
      backStyleOptions,
      ["buttonBack", "corsetBack", "bowBack"].includes(dress.backStyle ?? "")
        ? undefined
        : dress.backStyle,
    ),
    selectedItem("backClosure", backClosureOptions, resolveBackClosure(dress)),
    selectedItem("train", trainOptions, dress.train),
    ...[
      ...new Set([
        ...dress.details,
        ...(dress.backStyle === "bowBack" ? ["backBow" as const] : []),
      ]),
    ].map((detail) => selectedItem("details", detailOptions, detail)),
  ].filter((item): item is DressPresentationItem => Boolean(item));
  const exceptions = [
    {
      category: "top",
      options: topStyleOptions,
      id: dress.topStyle,
      note: dress.customOptions?.top,
    },
    {
      category: "neckline",
      options: necklineOptions,
      id: dress.neckline,
      note: dress.customOptions?.neckline,
    },
    {
      category: "silhouette",
      options: silhouetteOptions,
      id: dress.silhouette,
      note: dress.customOptions?.silhouette,
    },
    {
      category: "fabric",
      options: fabricOptions,
      id: dress.fabric,
      note: dress.customOptions?.fabric,
    },
    {
      category: "color",
      options: colorOptions,
      id: dress.color,
      note: dress.customOptions?.color,
    },
  ] satisfies readonly {
    readonly category: DressOptionCategory;
    readonly options: readonly Option<string>[];
    readonly id: string;
    readonly note: string | undefined;
  }[];

  return {
    core,
    details,
    exceptions: exceptions.flatMap(({ category, options, id, note }) => {
      if (!note) return [];

      const option = optionFor(options, id);
      return [
        {
          category,
          categoryLabel: categoryLabels[category],
          ...(option && option.id !== "unknown" ? { value: option.label } : {}),
          note,
        },
      ];
    }),
  };
}

export function optionLabel<T extends string>(
  options: readonly Option<T>[],
  id: T | undefined,
) {
  return optionFor(options, id)?.label ?? "기억 안 남";
}

export function summarizeDress(dress: Dress): string[] {
  const presentation = formatDressPresentation(dress);

  return [
    ...presentation.core.map((item) => item.value),
    ...presentation.details.map((item) => item.value),
    ...presentation.exceptions.map(({ categoryLabel, value, note }) =>
      value
        ? `${categoryLabel}: ${value} (${note})`
        : `${categoryLabel}: ${note}`,
    ),
  ].filter((value): value is string => Boolean(value));
}
