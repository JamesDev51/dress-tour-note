import { useUIStore } from "../../stores/uiStore";
import { useId } from "react";
import type { RecallDraft } from "../../lib/storage/recallDraft";
export type { RecallDraft } from "../../lib/storage/recallDraft";

export type RecallKey = keyof RecallDraft;

const FIELDS = [
  {
    key: "memoryCue",
    label: "기억할 특징",
    max: 80,
    placeholder: "예: 등 뒤 큰 리본, 잔잔한 레이스",
  },
  {
    key: "likedReason",
    label: "좋았던 점",
    max: 160,
    placeholder: "예: 허리가 편하고 목선이 시원해 보였음",
  },
  {
    key: "concern",
    label: "아쉬운 점",
    max: 160,
    placeholder: "예: 팔을 올릴 때 겨드랑이가 까슬거림",
  },
] as const;

export function DressRecallNotes({
  values,
  onChange,
  onBlur,
}: {
  readonly values: RecallDraft;
  readonly onChange: (key: RecallKey, value: string) => void;
  readonly onBlur: () => void;
}) {
  const id = useId();
  const saveFailed = useUIStore((state) => state.saveStatus === "error");
  return (
    <section className="mt-6" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-bold">
        이 드레스를 기억할 단서
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        하나만 남겨도 좋아요. 착용감은 입은 사람에게 물어봐 주세요.
      </p>
      {saveFailed && (
        <div
          role="alert"
          className="mt-4 rounded-control bg-error-surface p-4 text-sm text-error"
        >
          <p>저장하지 못했어요. 입력한 내용을 다시 저장해 주세요.</p>
          <button
            type="button"
            onClick={onBlur}
            className="mt-2 min-h-11 rounded-control border border-error px-3 font-semibold"
          >
            기억 메모 다시 저장
          </button>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {FIELDS.map(({ key, label, max, placeholder }) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor={`${id}-${key}`} className="text-sm font-semibold">
                {label}
              </label>
              <span
                id={`${id}-${key}-count`}
                className="text-xs tabular-nums text-ink-muted"
              >
                {values[key].length}/{max} · 선택
              </span>
            </div>
            <textarea
              id={`${id}-${key}`}
              aria-describedby={`${id}-${key}-count`}
              rows={2}
              maxLength={max}
              value={values[key]}
              placeholder={placeholder}
              onChange={(event) => onChange(key, event.target.value)}
              onBlur={onBlur}
              className="min-h-20 w-full resize-y rounded-control border border-stone-200 bg-white px-4 py-3 text-sm leading-6 placeholder:text-ink-muted focus:border-accent"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
