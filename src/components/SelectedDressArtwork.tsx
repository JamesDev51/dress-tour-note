import {
  backStyleOptions,
  detailOptions,
  fabricOptions,
  optionLabel,
} from "../lib/dress/options";
import type { Dress } from "../types/domain";
import { OptionArtwork, type OptionArtworkCategory } from "./OptionArtwork";

export type SelectedDressArtworkCategory = "fabric" | "backStyle" | "details";

type ArtworkItem = {
  readonly category: OptionArtworkCategory;
  readonly id: string;
  readonly label: string;
};

const defaultCategories = ["fabric", "backStyle", "details"] as const;

function artworkItems(
  dress: Dress,
  categories: readonly SelectedDressArtworkCategory[],
): readonly ArtworkItem[] {
  return categories.flatMap((category): readonly ArtworkItem[] => {
    switch (category) {
      case "fabric":
        return dress.fabric === "unknown"
          ? []
          : [
              {
                category,
                id: dress.fabric,
                label: optionLabel(fabricOptions, dress.fabric),
              },
            ];
      case "backStyle":
        return !dress.backStyle || dress.backStyle === "unknown"
          ? []
          : [
              {
                category,
                id: dress.backStyle,
                label: optionLabel(backStyleOptions, dress.backStyle),
              },
            ];
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
  const items = artworkItems(dress, categories);
  if (items.length === 0) return null;

  return (
    <section aria-label="선택한 특징 예시">
      <p className="text-xs font-semibold text-ink-muted">
        선택한 특징 · 예시 이미지
      </p>
      <ul
        className={`mt-2 grid gap-2 ${columns === 1 ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {items.map(({ category, id, label }) => (
          <li
            key={`${category}-${id}`}
            className={compact ? "flex min-w-0 items-center gap-2" : "min-w-0"}
          >
            <div className={compact ? "h-14 w-14 shrink-0" : "aspect-square"}>
              <OptionArtwork category={category} id={id} />
            </div>
            <p className="mt-1 break-keep text-xs leading-[18px] text-stone-600 [overflow-wrap:anywhere]">
              {label} 예시
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
