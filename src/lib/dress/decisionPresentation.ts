import {
  DRESS_OPTION_CATEGORIES,
  type Dress,
  type DressOptionCategory,
} from "../../types/domain";
import {
  dressForPresentation,
  formatDressPresentation,
  type DressPresentationItem,
} from "./options";

export type DecisionField = {
  readonly key: DecisionFieldKey;
  readonly label: string;
  readonly value: string;
  readonly state: "recorded" | "unknown" | "blank";
};

export type DecisionFieldKey =
  | DressOptionCategory
  | `exception:${DressOptionCategory}`
  | "candidate"
  | "rating"
  | "tags"
  | "memo"
  | "memoryCue"
  | "likedReason"
  | "concern";

export type DressDecisionPresentation = {
  readonly dress: Dress;
  readonly recall: readonly DecisionField[];
  readonly core: readonly DecisionField[];
  readonly details: readonly DecisionField[];
  readonly decision: readonly DecisionField[];
  readonly exceptions: readonly DecisionField[];
  readonly memo: DecisionField;
};

export type DressComparisonRow = {
  readonly group: "reasons" | "observed" | "missing" | "same";
  readonly key: DecisionFieldKey;
  readonly label: string;
  readonly left: DecisionField;
  readonly right: DecisionField;
};

const CATEGORY_LABELS: Record<DressOptionCategory, string> = {
  top: "상의 디자인",
  neckline: "네크라인",
  silhouette: "실루엣",
  fabric: "소재",
  color: "색상",
  waistline: "허리선",
  backStyle: "등 디자인",
  train: "트레인",
  details: "디테일",
};

const CORE_CATEGORIES = ["top", "neckline", "silhouette"] as const;
const DETAIL_CATEGORIES = [
  "fabric",
  "color",
  "waistline",
  "backStyle",
  "train",
  "details",
] as const;

function field(
  key: DecisionFieldKey,
  label: string,
  value: string | undefined,
  unknown = false,
): DecisionField {
  return {
    key,
    label,
    value: value ?? "미입력",
    state: unknown ? "unknown" : value ? "recorded" : "blank",
  };
}

function catalogValue(
  items: readonly DressPresentationItem[],
  category: DressOptionCategory,
): string | undefined {
  const values = items
    .filter((item) => item.category === category)
    .flatMap((item) => (item.value ? [item.value] : []));
  return values.length > 0 ? values.join(" · ") : undefined;
}

function isUnknown(dress: Dress, category: DressOptionCategory): boolean {
  switch (category) {
    case "top":
      return dress.topStyle === "unknown";
    case "neckline":
      return dress.neckline === "unknown";
    case "silhouette":
      return dress.silhouette === "unknown";
    case "fabric":
      return dress.fabric === "unknown";
    case "color":
      return dress.color === "unknown";
    case "waistline":
      return dress.waistline === "unknown";
    case "backStyle":
      return dress.backStyle === "unknown";
    case "train":
      return dress.train === "unknown";
    case "details":
      return false;
  }
}

function categoryField(
  dress: Dress,
  items: readonly DressPresentationItem[],
  category: DressOptionCategory,
): DecisionField {
  const unknown = isUnknown(dress, category);
  return field(
    category,
    CATEGORY_LABELS[category],
    unknown ? "기억 안 남" : catalogValue(items, category),
    unknown,
  );
}

export function createDressDecisionPresentation(
  dress: Dress,
): DressDecisionPresentation {
  const visibleDress = dressForPresentation(dress);
  const catalog = formatDressPresentation(visibleDress);
  const catalogItems = [...catalog.core, ...catalog.details];
  const core = CORE_CATEGORIES.map((category) =>
    categoryField(visibleDress, catalogItems, category),
  );
  const details = DETAIL_CATEGORIES.map((category) =>
    categoryField(visibleDress, catalogItems, category),
  );
  const exceptions = DRESS_OPTION_CATEGORIES.flatMap((category) => {
    const note = visibleDress.customOptions?.[category]?.trim();
    return note
      ? [
          field(
            `exception:${category}`,
            `${CATEGORY_LABELS[category]} 차이`,
            note,
          ),
        ]
      : [];
  });

  return {
    dress: visibleDress,
    recall: [
      field(
        "memoryCue",
        "기억할 특징",
        visibleDress.memoryCue?.trim() || undefined,
      ),
      field(
        "likedReason",
        "좋았던 점",
        visibleDress.likedReason?.trim() || undefined,
      ),
      field("concern", "아쉬운 점", visibleDress.concern?.trim() || undefined),
    ],
    core,
    details,
    decision: [
      field(
        "candidate",
        "후보",
        visibleDress.isFavorite ? "후보" : "후보 아님",
      ),
      field(
        "rating",
        "별점",
        visibleDress.rating ? `${visibleDress.rating} / 5` : undefined,
      ),
      field(
        "tags",
        "첫인상",
        visibleDress.quickTags.length > 0
          ? visibleDress.quickTags.join(" · ")
          : undefined,
      ),
    ],
    exceptions,
    memo: field("memo", "메모", visibleDress.memo.trim() || undefined),
  };
}

export { compareDressPresentations } from "./dressComparison";
