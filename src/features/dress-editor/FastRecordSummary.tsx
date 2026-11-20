import {
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  topStyleOptions,
} from "../../lib/dress/options";
import {
  materialLabel,
  normalizeActiveSilhouette,
} from "../../lib/dress/activeOptions";
import type { Dress } from "../../types/domain";
type SummaryDress = Pick<
  Dress,
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "fabric"
  | "upperFabric"
  | "lowerFabric"
  | "lowerFabricStart"
  | "isFavorite"
  | "customOptions"
>;
const categoryLabels = {
  top: "끈·소매",
  neckline: "목·가슴선",
  silhouette: "전체 모양",
  fabric: "소재·표면",
  waistline: "허리선",
  details: "장식과 세부 특징",
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
  const rows = [
    [
      "전체 모양",
      optionLabel(
        silhouetteOptions,
        normalizeActiveSilhouette(dress.silhouette),
      ),
    ],
    ["소재·표면", materialLabel(dress)],
    ["목·가슴선", optionLabel(necklineOptions, dress.neckline)],
    ["끈·소매", optionLabel(topStyleOptions, dress.topStyle)],
    ["후보", dress.isFavorite ? "후보" : "후보 표시 없음"],
  ];
  return (
    <section className="bridal-content pt-5">
      <h1 className="bridal-title">기본 기록</h1>
      <dl className="mt-4 grid gap-2 rounded-card bg-accent-soft p-4 text-sm">
        {rows.map(([title, value]) => (
          <div key={title} className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">{title}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {customEntries.length > 0 && (
        <section className="mt-4 rounded-card border border-rule bg-white p-4">
          <h2 className="text-sm font-semibold">선택지와 다른 점</h2>
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
          className="min-h-12 rounded-control bridal-primary px-4 font-semibold text-white"
          onClick={onEditCore}
        >
          기본 기록 수정
        </button>
        <button
          type="button"
          className="min-h-12 rounded-control border border-rule bg-white px-4 font-semibold"
          onClick={onOpenDetails}
        >
          자세히 기록
        </button>
      </div>
    </section>
  );
}
