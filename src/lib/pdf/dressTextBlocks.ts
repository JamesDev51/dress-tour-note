import type { Dress, DressOptionCategory } from "../../types/domain";
import {
  necklineOptions,
  optionLabel,
  topStyleOptions,
  waistlineOptions,
} from "../dress/options";
import {
  activeAppearance,
  activeDetailOptions,
  activeSilhouetteOptions,
  lowerFabricFor,
  materialLabel,
  materialRegionLabels,
  upperFabricFor,
} from "../dress/activeOptions";

const exceptionCategories = [
  "top",
  "neckline",
  "silhouette",
  "fabric",
  "waistline",
  "details",
] as const satisfies readonly DressOptionCategory[];
const categoryLabels = {
  top: "끈·소매",
  neckline: "목·가슴선",
  silhouette: "전체 모양",
  fabric: "소재",
  waistline: "허리선",
  details: "장식과 세부 특징",
} as const;

export type TextBlock = { readonly label: string; readonly text: string };

export function recallBlocks(dress: Dress): readonly TextBlock[] {
  return [
    { label: "기억할 특징", text: dress.memoryCue || "미기록" },
    { label: "좋았던 점", text: dress.likedReason || "미기록" },
    { label: "아쉬운 점", text: dress.concern || "미기록" },
  ];
}

export function dressTermBlocks(record: Dress): readonly TextBlock[] {
  const dress = activeAppearance(record);
  const upper = upperFabricFor(dress);
  const lower = lowerFabricFor(dress);
  const parts = materialRegionLabels(dress);
  const materialBlocks =
    upper === lower
      ? [{ label: "소재", text: materialLabel(upper) }]
      : [
          { label: `${parts.upper} 소재`, text: materialLabel(upper) },
          {
            label: parts.lower === "치마" ? "치마 소재" : parts.lower,
            text: materialLabel(lower),
          },
        ];
  return [
    {
      label: categoryLabels.silhouette,
      text: optionLabel(activeSilhouetteOptions, dress.silhouette),
    },
    ...materialBlocks,
    {
      label: categoryLabels.top,
      text: optionLabel(topStyleOptions, dress.topStyle),
    },
    {
      label: categoryLabels.neckline,
      text: optionLabel(necklineOptions, dress.neckline),
    },
    {
      label: categoryLabels.waistline,
      text: optionLabel(waistlineOptions, dress.waistline),
    },
    {
      label: categoryLabels.details,
      text: dress.details.length
        ? dress.details
            .map((detail) => optionLabel(activeDetailOptions, detail))
            .join(" · ")
        : "미기록",
    },
  ];
}

export function exceptionBlocks(dress: Dress): readonly TextBlock[] {
  return exceptionCategories.flatMap((category) => {
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
