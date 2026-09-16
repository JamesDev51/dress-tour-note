import { DRESS_OPTION_CATEGORIES, type Dress } from "../../types/domain";
import {
  createDressDecisionPresentation,
  type DecisionField,
  type DecisionFieldKey,
  type DressComparisonRow,
} from "./decisionPresentation";

const REASON_KEYS: readonly DecisionFieldKey[] = [
  "memoryCue",
  "likedReason",
  "concern",
  "tags",
  "candidate",
  "rating",
  "memo",
];

function sameField(left: DecisionField, right: DecisionField) {
  if (left.state !== right.state) return false;
  if (left.key === "tags" || left.key === "details") {
    return (
      left.value.split(" · ").sort().join(" · ") ===
      right.value.split(" · ").sort().join(" · ")
    );
  }
  return left.value === right.value;
}

export function compareDressPresentations(
  leftDress: Dress,
  rightDress: Dress,
  includeSame = false,
): readonly DressComparisonRow[] {
  const left = createDressDecisionPresentation(leftDress);
  const right = createDressDecisionPresentation(rightDress);
  const leftFields = [
    ...left.recall,
    ...left.core,
    ...left.details,
    ...left.decision,
    left.memo,
    ...left.exceptions,
  ];
  const rightFields = [
    ...right.recall,
    ...right.core,
    ...right.details,
    ...right.decision,
    right.memo,
    ...right.exceptions,
  ];
  const keys = [
    ...left.recall,
    ...left.core,
    ...left.details,
    ...left.decision,
    left.memo,
  ].map(({ key }) => key);
  keys.push(
    ...DRESS_OPTION_CATEGORIES.map(
      (category): DecisionFieldKey => `exception:${category}`,
    ),
  );

  return keys.flatMap((key) => {
    const leftField = leftFields.find((item) => item.key === key);
    const rightField = rightFields.find((item) => item.key === key);
    if (!leftField && !rightField) return [];
    const label = leftField?.label ?? rightField?.label ?? key;
    const blank: DecisionField = {
      key,
      label,
      value: "미입력",
      state: "blank",
    };
    const visibleLeft = leftField ?? blank;
    const visibleRight = rightField ?? blank;
    const equal = sameField(visibleLeft, visibleRight);
    if (equal && !includeSame) return [];
    const isReason = REASON_KEYS.includes(key);
    if (
      isReason &&
      visibleLeft.state === "blank" &&
      visibleRight.state === "blank"
    )
      return [];
    const bothRecorded =
      visibleLeft.state === "recorded" && visibleRight.state === "recorded";
    const group = isReason
      ? "reasons"
      : !bothRecorded
        ? "missing"
        : equal
          ? "same"
          : "observed";
    return [
      {
        key,
        label,
        left: visibleLeft,
        right: visibleRight,
        group,
      } satisfies DressComparisonRow,
    ];
  });
}
