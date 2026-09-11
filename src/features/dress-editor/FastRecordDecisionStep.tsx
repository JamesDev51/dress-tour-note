import { quickTagOptions } from "../../lib/dress/options";
import type { Dress, QuickTag } from "../../types/domain";

const RATINGS = [1, 2, 3, 4, 5] as const;

export function FastRecordDecisionStep({
  acknowledged,
  isFavorite,
  rating,
  quickTags,
  saving,
  onCandidate,
  onRating,
  onTag,
}: {
  acknowledged: boolean;
  isFavorite: boolean;
  rating: Dress["rating"];
  quickTags: readonly QuickTag[];
  saving: boolean;
  onCandidate: (value: boolean) => void;
  onRating: (value: NonNullable<Dress["rating"]>) => void;
  onTag: (value: QuickTag) => void;
}) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-black">후보로 남길까요?</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[true, false].map((value) => (
          <button
            type="button"
            key={String(value)}
            aria-pressed={acknowledged && isFavorite === value}
            disabled={saving}
            className={`min-h-12 rounded-control border px-3 font-bold ${
              acknowledged && isFavorite === value
                ? "border-accent bg-accent-soft text-accent-copy"
                : "border-stone-200 bg-white"
            }`}
            onClick={() => onCandidate(value)}
          >
            {value ? "후보로 남기기" : "후보 아님"}
          </button>
        ))}
      </div>
      <h3 className="mt-6 font-bold">별점 · 선택</h3>
      <div className="mt-2 flex items-center gap-1">
        {RATINGS.map((value) => (
          <button
            type="button"
            key={value}
            aria-label={`${value}점`}
            disabled={saving}
            className={`grid h-11 w-11 place-items-center text-xl ${
              value <= (rating ?? 0) ? "text-amber-400" : "text-stone-200"
            }`}
            onClick={() => onRating(value)}
          >
            ★
          </button>
        ))}
      </div>
      <h3 className="mt-6 font-bold">첫인상 · 선택</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {quickTagOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            aria-pressed={quickTags.includes(option.id)}
            disabled={saving}
            className={`min-h-11 rounded-full border px-4 text-sm ${
              quickTags.includes(option.id)
                ? "border-accent bg-accent-soft text-accent-copy"
                : "border-stone-200 bg-white text-ink-muted"
            }`}
            onClick={() => onTag(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
