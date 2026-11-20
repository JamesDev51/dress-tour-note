import type { Dress } from "../../types/domain";
import { activeQuickTagOptions } from "../../lib/dress/activeOptions";

const RATINGS = [1, 2, 3, 4, 5] as const;

export function DressFeedbackSection({
  dress,
  memo,
  onPatch,
  onMemoChange,
  onMemoBlur,
}: {
  dress: Pick<Dress, "quickTags" | "rating">;
  memo: string;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onMemoChange: (value: string) => void;
  onMemoBlur: () => void;
}) {
  const activeTags = new Set(activeQuickTagOptions.map((option) => option.id));
  const selectedTags = new Set(
    dress.quickTags.filter((tag) => activeTags.has(tag)),
  );
  const save = (patch: Partial<Dress>) => {
    void onPatch(patch).catch(() => undefined);
  };
  return (
    <>
      <section className="mt-8">
        <h2 className="bridal-section-title mb-3">입어봤을 때 어땠나요?</h2>
        <div className="flex flex-wrap gap-2">
          {activeQuickTagOptions.map((option) => (
            <button
              key={option.id}
              aria-pressed={selectedTags.has(option.id)}
              className={`min-h-11 rounded-full border px-4 text-sm ${selectedTags.has(option.id) ? "border-accent bg-accent-soft text-accent-copy" : "border-rule bg-white text-stone-500"}`}
              onClick={() =>
                save({
                  quickTags: selectedTags.has(option.id)
                    ? [...selectedTags].filter((tag) => tag !== option.id)
                    : [...selectedTags, option.id],
                })
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1">
          <span className="w-full text-sm text-stone-500">별점</span>
          {RATINGS.map((rating) => (
            <button
              key={rating}
              aria-label={`${rating}점`}
              aria-pressed={rating === dress.rating}
              className={`rating-choice grid h-11 w-11 shrink-0 place-items-center text-xl ${rating <= (dress.rating ?? 0) ? "text-amber-400" : "text-stone-200"}`}
              onClick={() => save({ rating })}
            >
              ★
            </button>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="bridal-section-title mb-3">추가 메모</h2>
        <textarea
          aria-label="추가 메모"
          maxLength={1000}
          value={memo}
          onChange={(event) => onMemoChange(event.target.value)}
          onBlur={onMemoBlur}
          placeholder="예: 허리가 제일 얇아 보였음, 치마 볼륨은 조금 아쉬움"
          className="min-h-32 w-full resize-none rounded-2xl border border-rule bg-white p-4 text-sm leading-6 focus:border-accent"
        />
        <div className="mt-1 text-right text-[11px] text-stone-300">
          {memo.length}/1000
        </div>
      </section>
    </>
  );
}
