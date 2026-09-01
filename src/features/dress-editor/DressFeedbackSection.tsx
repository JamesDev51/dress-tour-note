import type { Dress } from "../../types/domain";
import { quickTagOptions } from "../../lib/dress/options";

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
  return (
    <>
      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-bold">입어봤을 때 어땠나요?</h2>
        <div className="flex flex-wrap gap-2">
          {quickTagOptions.map((option) => (
            <button
              key={option.id}
              aria-pressed={dress.quickTags.includes(option.id)}
              className={`min-h-11 rounded-full border px-4 text-sm ${dress.quickTags.includes(option.id) ? "border-[#b96e63] bg-[#fff2ee] text-[#8b5750]" : "border-stone-200 bg-white text-stone-500"}`}
              onClick={() =>
                void onPatch({
                  quickTags: dress.quickTags.includes(option.id)
                    ? dress.quickTags.filter((tag) => tag !== option.id)
                    : [...dress.quickTags, option.id],
                })
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-stone-500">별점</span>
          {RATINGS.map((rating) => (
            <button
              key={rating}
              aria-label={`${rating}점`}
              className={`grid h-11 w-11 place-items-center text-xl ${rating <= (dress.rating ?? 0) ? "text-amber-400" : "text-stone-200"}`}
              onClick={() => void onPatch({ rating })}
            >
              ★
            </button>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-bold">특이사항</h2>
        <textarea
          maxLength={1000}
          value={memo}
          onChange={(event) => onMemoChange(event.target.value)}
          onBlur={onMemoBlur}
          placeholder="예: 허리가 제일 얇아 보였음, 치마 볼륨은 조금 아쉬움"
          className="min-h-32 w-full resize-none rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 outline-none focus:border-[#b96e63]"
        />
        <div className="mt-1 text-right text-[11px] text-stone-300">
          {memo.length}/1000
        </div>
      </section>
    </>
  );
}
