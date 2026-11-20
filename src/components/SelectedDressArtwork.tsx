import {
  detailOptions,
  necklineOptions,
  optionLabel,
  topStyleOptions,
} from "../lib/dress/options";
import type { Dress } from "../types/domain";
import { OptionArtwork, type OptionArtworkCategory } from "./OptionArtwork";
import {
  activeAppearance,
  lowerFabricFor,
  materialLabel,
  materialRegionLabels,
  upperFabricFor,
} from "../lib/dress/activeOptions";

export type SelectedDressArtworkCategory =
  "top" | "neckline" | "fabric" | "backStyle" | "details";

type ArtworkItem = {
  readonly category: OptionArtworkCategory;
  readonly id: string;
  readonly label: string;
  readonly part?: string;
};

const defaultCategories = ["fabric", "details"] as const;

function artworkItems(
  dress: Dress,
  categories: readonly SelectedDressArtworkCategory[],
): readonly ArtworkItem[] {
  return categories.flatMap((category): readonly ArtworkItem[] => {
    switch (category) {
      case "top":
        return dress.topStyle === "unknown"
          ? []
          : [
              {
                category,
                id: dress.topStyle,
                label: optionLabel(topStyleOptions, dress.topStyle),
              },
            ];
      case "neckline":
        return dress.neckline === "unknown"
          ? []
          : [
              {
                category,
                id: dress.neckline,
                label: optionLabel(necklineOptions, dress.neckline),
              },
            ];
      case "fabric": {
        const upper = upperFabricFor(dress);
        const lower = lowerFabricFor(dress);
        const parts = materialRegionLabels(dress);
        if (upper === lower)
          return upper === "unknown"
            ? []
            : [{ category, id: upper, label: materialLabel(upper) }];
        return [
          ...(upper === "unknown"
            ? []
            : [
                {
                  category,
                  id: upper,
                  part: parts.upper,
                  label: materialLabel(upper),
                },
              ]),
          ...(lower === "unknown"
            ? []
            : [
                {
                  category,
                  id: lower,
                  part: parts.lower,
                  label: materialLabel(lower),
                },
              ]),
        ];
      }
      case "backStyle":
        return [];
      case "details":
        return dress.details.map((id) => ({
          category,
          id,
          label: optionLabel(detailOptions, id),
        }));
    }
  });
}

export function SelectedDressArtwork({
  dress,
  categories = defaultCategories,
  compact = false,
  columns = 2,
}: {
  readonly dress: Dress;
  readonly categories?: readonly SelectedDressArtworkCategory[];
  readonly compact?: boolean;
  readonly columns?: 1 | 2;
}) {
  const items = artworkItems(activeAppearance(dress), categories);
  if (items.length === 0) return null;

  return (
    <section aria-label={compact ? "소재" : "선택한 특징 예시"}>
      <p className="text-xs font-semibold text-ink-muted">
        {compact ? "소재" : "고른 특징의 예시"}
      </p>
      <ul
        className={`mt-2 grid gap-2 ${columns === 1 ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {items.map(({ category, id, part, label }) => (
          <li
            key={`${category}-${id}`}
            className={compact ? "flex min-w-0 items-center gap-2" : "min-w-0"}
          >
            <div className={compact ? "h-9 w-9 shrink-0" : "aspect-square"}>
              <OptionArtwork category={category} id={id} />
            </div>
            <p className="break-keep text-xs leading-[18px] text-stone-600 [overflow-wrap:anywhere]">
              {part && (
                <span className={compact ? "mr-2 text-ink-muted" : undefined}>
                  {part}{" "}
                </span>
              )}
              {label}
              {!compact && " 예시"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
