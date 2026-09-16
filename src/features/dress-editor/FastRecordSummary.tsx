import {
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  topStyleOptions,
} from "../../lib/dress/options";
import type { Dress } from "../../types/domain";

type SummaryDress = Pick<
  Dress,
  "topStyle" | "neckline" | "silhouette" | "isFavorite" | "customOptions"
>;

const categoryLabels = {
  top: "상의 디자인",
  neckline: "네크라인",
  silhouette: "실루엣",
  fabric: "소재",
  color: "색상",
  waistline: "허리선",
  backStyle: "등 디자인",
  train: "트레인",
  details: "디테일",
} as const;

export function FastRecordSummary({
  dress,
  onEditCore,
  onOpenDetails,
}: {
  dress: SummaryDress;
  onEditCore: () => void;
  onOpenDetails: () => void;
}) {
  const customEntries = Object.entries(dress.customOptions ?? {}).filter(
    (entry): entry is [keyof typeof categoryLabels, string] =>
      entry[0] in categoryLabels && Boolean(entry[1]?.trim()),
  );
  return (
    <section className="px-5 pt-5">
      <h1 className="text-xl font-black">핵심 기록</h1>
      <dl className="mt-4 grid gap-2 rounded-card bg-accent-soft p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">어깨/상의</dt>
          <dd className="font-bold">
            {optionLabel(topStyleOptions, dress.topStyle)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">네크라인</dt>
          <dd className="font-bold">
            {optionLabel(necklineOptions, dress.neckline)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">실루엣</dt>
          <dd className="font-bold">
            {optionLabel(silhouetteOptions, dress.silhouette)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">후보</dt>
          <dd className="font-bold">
            {dress.isFavorite ? "후보" : "후보 아님"}
          </dd>
        </div>
      </dl>
      {customEntries.length > 0 && (
        <section className="mt-4 rounded-card border border-stone-100 bg-white p-4">
          <h2 className="text-sm font-bold">선택지와 다른 점</h2>
          <dl className="mt-2 grid gap-2 text-sm">
            {customEntries.map(([category, note]) => (
              <div key={category} className="grid gap-1">
                <dt className="text-xs font-semibold text-ink-muted">
                  {categoryLabels[category]}
                </dt>
                <dd>{note}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <div className="mt-4 grid gap-2">
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
