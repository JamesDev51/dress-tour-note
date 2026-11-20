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

import {
  activeAppearance,
  lowerFabricFor,
  materialLabel,
  upperFabricFor,
} from "./activeOptions";

export type DecisionField = {
  readonly key: DecisionFieldKey;
  readonly label: string;
  readonly value: string;
  readonly state: "recorded" | "unknown" | "blank";
};

export type DecisionFieldKey =
  | DressOptionCategory
  | `exception:${DressOptionCategory}`
  | "backClosure"
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

const CATEGORY_LABELS: Record<DressOptionCategory, string> = {
  top: "끈·소매",
  neckline: "목·가슴선",
  silhouette: "전체 모양",
  fabric: "소재·표면",
  color: "색상",
  waistline: "허리선",
  backStyle: "등 파임",
  train: "뒤로 끌리는 길이",
  details: "장식과 세부 특징",
};

const CORE_CATEGORIES = ["silhouette", "fabric", "neckline", "top"] as const;
const DETAIL_CATEGORIES = ["waistline", "details"] as const;

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
  if (category === "fabric") {
    return field(
      category,
      "소재",
      materialLabel(dress),
      upperFabricFor(dress) === "unknown" ||
        lowerFabricFor(dress) === "unknown",
    );
  }
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
  const visibleDress = activeAppearance(dressForPresentation(dress));
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
        visibleDress.isFavorite ? "후보" : "후보 표시 없음",
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
