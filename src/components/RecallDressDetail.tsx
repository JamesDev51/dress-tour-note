import { useId, useState, type ReactNode } from "react";
import {
  createDressDecisionPresentation,
  type DecisionField,
} from "../lib/dress/decisionPresentation";
import type { Dress } from "../types/domain";
import { DressPreview } from "./DressPreview";
import { ReferenceGownPreview } from "./ReferenceGownPreview";
import { SelectedDressArtwork } from "./SelectedDressArtwork";

const sketchViews = [
  { id: "full", label: "전체" },
  { id: "upper", label: "상체" },
] as const;

type RecallView = "reference" | (typeof sketchViews)[number]["id"];

function Fields({ fields }: { readonly fields: readonly DecisionField[] }) {
  return (
    <dl className="grid gap-3 text-sm leading-[22px]">
      {fields.map(({ key, label, value, state }) => (
        <div key={key} className="grid min-w-0 grid-cols-[92px_1fr] gap-3">
          <dt className="break-keep text-ink-muted">{label}</dt>
          <dd
            className={`min-w-0 break-keep [overflow-wrap:anywhere] ${state === "unknown" ? "font-semibold text-stone-500" : "text-ink"}`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function RecallDressDetail({
  dress,
  shopName,
  stylingLabel,
  feedbackEditor,
  memoryEditor,
  lookControls,
  adjustmentControls,
  onEditCore,
  onOpenDetails,
  showDetailsAction = true,
}: {
  readonly dress: Dress;
  readonly shopName?: string;
  readonly stylingLabel?: string;
  readonly feedbackEditor?: ReactNode;
  readonly memoryEditor?: ReactNode;
  readonly lookControls?: ReactNode;
  readonly adjustmentControls?: ReactNode;
  readonly onEditCore: () => void;
  readonly onOpenDetails: () => void;
  readonly showDetailsAction?: boolean;
}) {
  const reasonsId = useId();
  const [view, setView] = useState<RecallView>("full");
  const presentation = createDressDecisionPresentation(dress);
  const [cue, ...reasons] = presentation.recall;
  const title = dress.memoryCue?.trim() || dress.label;

  return (
    <section className="bridal-content pt-5">
      <header>
        <p className="text-xs leading-[18px] text-ink-muted">
          {shopName ? `${shopName} · ` : ""}
          {dress.order + 1}번째 · {dress.label}
        </p>
        {stylingLabel && (
          <p className="mt-1 break-keep text-xs leading-5 text-ink-muted [overflow-wrap:anywhere]">
            {stylingLabel}
          </p>
        )}
        <h1 className="mt-1 break-keep bridal-title [text-wrap:balance] [overflow-wrap:break-word]">
          {title}
        </h1>
        {!memoryEditor && cue?.state === "blank" && (
          <p className="mt-2 text-sm leading-[22px] text-ink-muted">
            기억할 특징을 아직 적지 않았어요.
          </p>
        )}
      </header>

      <section aria-label="드레스 보기" className="mt-5">
        <div
          className="grid grid-cols-2 gap-2"
          role="group"
          aria-label="그림 보기 선택"
        >
          {sketchViews.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              className={`min-h-11 rounded-control border px-3 text-sm font-semibold ${view === item.id ? "border-accent bg-accent-soft text-accent-copy" : "border-stone-200 bg-white text-stone-600"}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {view === "reference" ? (
          <ReferenceGownPreview dress={presentation.dress} className="mt-4" />
        ) : (
          <>
            <DressPreview
              dress={presentation.dress}
              view={view}
              mode="visual"
              className="mt-3"
              onOpenDetails={onOpenDetails}
            />
          </>
        )}
      </section>

      {memoryEditor}
      {adjustmentControls}
      {lookControls}
      <details className="mt-4 rounded-control border border-stone-200 p-3">
        <summary className="min-h-11 py-2 text-sm font-semibold">
          고른 특징의 예시 보기
        </summary>
        <button
          type="button"
          aria-pressed={view === "reference"}
          className={`mt-2 min-h-11 w-full rounded-control border px-3 text-sm font-semibold ${view === "reference" ? "border-accent bg-accent-soft text-accent-copy" : "border-stone-200 bg-white text-stone-600"}`}
          onClick={() => setView("reference")}
        >
          전체 모양 예시
        </button>
        <SelectedDressArtwork dress={presentation.dress} />
      </details>

      {feedbackEditor}

      <section id={reasonsId} className="mt-6 scroll-mt-40 bridal-note p-4">
        <h2 className="bridal-section-title">느낌과 평가</h2>
        <div className="mt-3">
          <Fields fields={reasons} />
        </div>
        <div className="mt-4 border-t border-accent/20 pt-4">
          <Fields fields={presentation.decision} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="bridal-section-title">전체 기록</h2>
        <div className="mt-3 space-y-5">
          <Fields fields={[...presentation.core, ...presentation.details]} />
          {presentation.exceptions.length > 0 && (
            <Fields fields={presentation.exceptions} />
          )}
          <Fields fields={[presentation.memo]} />
        </div>
      </section>

      <div className="mt-6 grid gap-2 pb-6">
        <button
          type="button"
          className="min-h-12 bridal-primary px-4"
          onClick={onEditCore}
        >
          기본 기록 수정
        </button>
        {showDetailsAction && (
          <button
            type="button"
            className="min-h-12 bridal-secondary px-4"
            onClick={onOpenDetails}
          >
            자세히 기록
          </button>
        )}
      </div>
    </section>
  );
}
