import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DressPreview } from "../../components/DressPreview";
import type { DressSketchView } from "../../lib/renderer/dressSvg";
import { ComparisonSection } from "./ComparisonSection";
import { db } from "../../db/database";
import { compareDressPresentations } from "../../lib/dress/decisionPresentation";
import type { Dress } from "../../types/domain";

export function ComparePage() {
  const { tourId = "" } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [view, setView] = useState<DressSketchView>("full");
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
  const rows = compareDressPresentations(left, right, true);
  const reasons = [
    "likedReason",
    "concern",
    "tags",
    "candidate",
    "rating",
    "memo",
  ].flatMap((key) => rows.filter((row) => row.key === key));
  const observed = rows.filter((row) => row.group === "observed");
  const missing = rows.filter((row) => row.group === "missing");
  const same = rows.filter((row) => row.group === "same");
  const shopName = (dress: Dress) =>
    data.shops.find((shop) => shop.id === dress.shopId)?.name ?? "드레스샵";
  return (
    <main className="min-h-dvh px-4 pb-12 pt-[calc(12px+env(safe-area-inset-top))]">
      <header>
        <button
          aria-label="결과로 돌아가기"
          className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
          onClick={() => nav(`/tour/${tourId}/review`)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="mt-5 text-2xl font-bold">두 벌의 차이를 살펴봐요</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          기억에 남은 특징과 입었을 때의 느낌을 함께 봐요.
        </p>
      </header>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[left, right].map((dress) => (
          <div key={dress.id} className="min-w-0 border-t-2 border-accent pt-3">
            <p className="break-keep text-xs leading-5 text-ink-muted [overflow-wrap:anywhere]">
              {shopName(dress)} · {dress.order + 1}번째
            </p>
            <h2 className="mt-1 break-keep text-sm font-bold leading-6 [text-wrap:balance] [overflow-wrap:break-word]">
              {dress.memoryCue?.trim() || dress.label}
            </h2>
            {dress.memoryCue?.trim() && (
              <p className="mt-1 text-xs text-ink-muted">{dress.label}</p>
            )}
          </div>
        ))}
      </div>
      <ComparisonSection
        title="선택할 때 중요했던 점"
        rows={reasons}
        dresses={[left, right]}
      />
      <section className="mt-8" aria-label="그림 비교">
        <h2 className="text-base font-bold">모양을 나란히</h2>
        <div
          role="group"
          aria-label="비교 그림 보기 선택"
          className="mt-3 grid grid-cols-3 gap-2"
        >
          {(
            [
              { id: "full", label: "전체" },
              { id: "upper", label: "상체" },
              { id: "back", label: "뒤태" },
            ] as const
          ).map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              className={`min-h-11 rounded-control border px-3 text-sm font-semibold ${view === item.id ? "border-accent bg-accent-soft text-accent-copy" : "border-stone-200 bg-white text-ink-muted"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[left, right].map((dress) => (
            <DressPreview
              key={dress.id}
              dress={dress}
              view={view}
              mode="visual"
            />
          ))}
        </div>
      </section>
      <ComparisonSection
        title="기록된 차이"
        description={
          observed.length === 0
            ? "두 기록에서 확인된 외형 차이는 없어요. 실제 드레스가 같다는 뜻은 아니에요."
            : undefined
        }
        rows={observed}
        dresses={[left, right]}
      />
      {same.length > 0 && (
        <details className="mt-6">
          <summary className="min-h-11 cursor-pointer rounded-control bg-stone-50 p-3 text-sm font-semibold">
            같은 특징 {same.length}개 보기
          </summary>
          <ComparisonSection
            title="함께 기록된 특징"
            rows={same}
            dresses={[left, right]}
          />
        </details>
      )}
      {missing.length > 0 && (
        <ComparisonSection
          title="더 확인하면 좋은 부분"
          description="한쪽 또는 양쪽 기록이 비어 있어요."
          rows={missing}
          dresses={[left, right]}
        />
      )}
    </main>
  );
}
