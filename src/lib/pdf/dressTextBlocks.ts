import type { Dress, DressOptionCategory } from "../../types/domain";
import {
  ACTIVE_DRESS_CATEGORIES,
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  topStyleOptions,
} from "../dress/options";

const categoryLabels: Readonly<Record<DressOptionCategory, string>> = {
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

export type TextBlock = {
  readonly label: string;
  readonly text: string;
};

export function recallBlocks(dress: Dress): readonly TextBlock[] {
  return [
    { label: "기억할 특징", text: dress.memoryCue || "미기록" },
    { label: "좋았던 점", text: dress.likedReason || "미기록" },
    { label: "아쉬운 점", text: dress.concern || "미기록" },
  ];
}

export function dressTermBlocks(dress: Dress): readonly TextBlock[] {
  return [
    {
      label: categoryLabels.top,
      text: optionLabel(topStyleOptions, dress.topStyle),
    },
    {
      label: categoryLabels.neckline,
      text: optionLabel(necklineOptions, dress.neckline),
    },
    {
      label: categoryLabels.silhouette,
      text: optionLabel(silhouetteOptions, dress.silhouette),
    },
    {
      label: categoryLabels.fabric,
      text: optionLabel(fabricOptions, dress.fabric),
    },
    {
      label: categoryLabels.color,
      text: optionLabel(colorOptions, dress.color),
    },
    {
      label: categoryLabels.backStyle,
      text: optionLabel(backStyleOptions, dress.backStyle),
    },
    {
      label: categoryLabels.details,
      text: dress.details.length
        ? dress.details
            .map((detail) => optionLabel(detailOptions, detail))
            .join(" · ")
        : "미기록",
    },
  ];
}

export function exceptionBlocks(dress: Dress): readonly TextBlock[] {
  return ACTIVE_DRESS_CATEGORIES.flatMap((category) => {
    const note = dress.customOptions?.[category];
    return note
      ? [
          {
            label: `${categoryLabels[category]} · 비슷하지만 달라요`,
            text: note,
          },
        ]
      : [];
  });
}
