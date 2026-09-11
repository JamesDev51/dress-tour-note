import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DressDecisionCard } from "../../components/DressDecisionCard";
import { db } from "../../db/database";
import { compareDressPresentations } from "../../lib/dress/decisionPresentation";
import type { Dress } from "../../types/domain";

export function ComparePage() {
  const { tourId = "" } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const leftId = params.get("a");
  const rightId = params.get("b");
  const validIds =
    leftId && rightId && leftId !== rightId ? [leftId, rightId] : undefined;
  const data = useLiveQuery(async () => {
    if (!validIds) return { kind: "invalid" } as const;
    const dresses = (
      await Promise.all(validIds.map((id) => db.dresses.get(id)))
    ).filter((d): d is Dress => !!d && d.tourId === tourId);
    if (dresses.length !== 2) return { kind: "missing" } as const;
    const shops = await db.shops.where("tourId").equals(tourId).toArray();
    return { kind: "ready", dresses, shops } as const;
  }, [tourId, leftId, rightId]);
  if (!data)
    return (
      <main className="p-8 text-center text-sm text-stone-400">
        비교 기록을 불러오는 중...
      </main>
    );
  if (data.kind !== "ready")
    return (
      <main className="min-h-dvh px-5 pt-[calc(18px+env(safe-area-inset-top))]">
        <button
          aria-label="뒤로"
          className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
          onClick={() => nav(-1)}
        >
          <ArrowLeft />
        </button>
        <div className="mt-16 rounded-3xl border border-dashed border-stone-200 p-6 text-center">
          <p className="text-sm text-stone-500">
            {data.kind === "invalid"
              ? "비교 주소가 올바르지 않아요."
              : "선택한 드레스 기록을 찾을 수 없어요."}
          </p>
          <button
            className="mt-4 min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-bold text-white"
            onClick={() => nav(`/tour/${tourId}/review`)}
          >
            결과에서 다시 선택
          </button>
        </div>
      </main>
    );
  const [left, right] = data.dresses;
  const differences = compareDressPresentations(left, right);
  const shopName = (d: Dress) =>
    data.shops.find((s) => s.id === d.shopId)?.name || "드레스샵";
  return (
    <main className="min-h-dvh pb-12">
      <header className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
        <button
          aria-label="결과로 돌아가기"
          className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
          onClick={() => nav(-1)}
        >
          <ArrowLeft />
        </button>
        <p className="mt-7 text-xs font-semibold text-accent-dark">COMPARE</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">
          두 벌을
          <br />
          붙여서 비교해요
        </h1>
      </header>
      <section className="mt-6 px-3">
        <div className="grid grid-cols-2 gap-2">
          {data.dresses.map((d) => (
            <div
              key={d.id}
              className="min-w-0 rounded-3xl border border-stone-100 bg-white p-2"
            >
              <DressDecisionCard
                dress={d}
                variant="compare"
                shopName={shopName(d)}
              />
            </div>
          ))}
        </div>
        {differences.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500">
            기록된 차이가 없어요.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-3xl border border-stone-100 bg-white">
            {differences.map((row, index) => (
              <CompareRow
                key={row.key}
                label={row.label}
                left={row.left.value}
                right={row.right.value}
                leftState={row.left.state}
                rightState={row.right.state}
                last={index === differences.length - 1}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
function CompareRow({
  label,
  left,
  right,
  leftState,
  rightState,
  last = false,
}: {
  label: string;
  left: string;
  right: string;
  leftState: "recorded" | "unknown" | "blank";
  rightState: "recorded" | "unknown" | "blank";
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "border-b border-stone-100"}>
      <div className="bg-stone-50 px-3 py-2 text-[10px] font-semibold text-stone-400">
        {label}
      </div>
      <div className="grid grid-cols-2">
        <div
          className={`min-w-0 break-keep px-3 py-3 text-xs leading-5 [overflow-wrap:anywhere] ${leftState === "recorded" ? "text-stone-600" : "font-semibold text-stone-400"}`}
        >
          {left}
        </div>
        <div
          className={`min-w-0 break-keep border-l border-stone-100 px-3 py-3 text-xs leading-5 [overflow-wrap:anywhere] ${rightState === "recorded" ? "text-stone-600" : "font-semibold text-stone-400"}`}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
