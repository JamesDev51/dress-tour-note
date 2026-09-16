import { useState } from "react";
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
  { id: "back", label: "뒤태" },
] as const;

type RecallView = "reference" | (typeof sketchViews)[number]["id"];

function Fields({ fields }: { readonly fields: readonly DecisionField[] }) {
  return (
    <dl className="grid gap-3 text-sm leading-[22px]">
      {fields.map(({ key, label, value, state }) => (
        <div key={key} className="grid min-w-0 grid-cols-[92px_1fr] gap-3">
          <dt className="text-ink-muted">{label}</dt>
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
  onEditCore,
  onOpenDetails,
}: {
  readonly dress: Dress;
  readonly shopName?: string;
  readonly onEditCore: () => void;
  readonly onOpenDetails: () => void;
}) {
  const [view, setView] = useState<RecallView>("full");
  const presentation = createDressDecisionPresentation(dress);
  const [cue, ...reasons] = presentation.recall;
  const title = dress.memoryCue?.trim() || dress.label;

  return (
    <section className="px-5 pt-5">
      <header>
        <p className="text-xs leading-[18px] text-ink-muted">
          {shopName ? `${shopName} · ` : ""}
          {dress.order + 1}번째 · {dress.label}
        </p>
        <h1 className="mt-1 break-keep text-xl font-bold leading-7 [text-wrap:balance] [overflow-wrap:break-word]">
          {title}
        </h1>
        {cue?.state === "blank" && (
          <p className="mt-2 text-sm leading-[22px] text-ink-muted">
            기억할 특징을 아직 적지 않았어요.
          </p>
        )}
      </header>

      <section aria-label="드레스 보기" className="mt-5">
        <div
          className="grid grid-cols-3 gap-2"
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
        <button
          type="button"
          aria-pressed={view === "reference"}
          className={`mt-2 min-h-11 w-full rounded-control border px-3 text-sm font-semibold ${view === "reference" ? "border-accent bg-accent-soft text-accent-copy" : "border-stone-200 bg-white text-stone-600"}`}
          onClick={() => setView("reference")}
        >
          실루엣 참고
        </button>
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

      {view !== "reference" && (
        <div className="mt-5">
          <SelectedDressArtwork dress={presentation.dress} />
        </div>
      )}

      <section className="mt-6 rounded-card bg-accent-soft p-4">
        <h2 className="text-base font-bold leading-6">기억과 선택</h2>
        <div className="mt-3">
          <Fields fields={reasons} />
        </div>
        <div className="mt-4 border-t border-accent/20 pt-4">
          <Fields fields={presentation.decision} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold leading-6">전체 기록</h2>
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
          className="min-h-12 rounded-control bg-stone-900 px-4 font-bold text-white"
          onClick={onEditCore}
        >
          핵심 기록 수정
        </button>
        <button
          type="button"
          className="min-h-12 rounded-control border border-stone-200 bg-white px-4 font-bold"
          onClick={onOpenDetails}
        >
          상세 기록
        </button>
      </div>
    </section>
  );
}
