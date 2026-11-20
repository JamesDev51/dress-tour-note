import { EmptyRecordIllustration } from "../../components/RecordGraphics";
import { MissingRecord } from "../../components/RecordRecovery";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, FileDown } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DressDecisionCard } from "../../components/DressDecisionCard";
import { db } from "../../db/database";

export function ReviewPage() {
  const { tourId = "" } = useParams();
  const nav = useNavigate();
  const [filter, setFilter] = useState<"all" | "favorite">("all");
  const data = useLiveQuery(async () => {
    const tour = await db.tours.get(tourId);
    if (!tour) return null;
    const shops = (
      await db.shops.where("tourId").equals(tourId).toArray()
    ).sort((a, b) => a.order - b.order);
    const dresses = (
      await db.dresses.where("tourId").equals(tourId).toArray()
    ).sort((a, b) => a.order - b.order);
    return { tour, shops, dresses };
  }, [tourId]);
  if (data === null) return <MissingRecord />;
  if (!data)
    return (
      <main className="bridal-page p-8 text-center text-sm text-ink-muted">
        결과를 불러오는 중...
      </main>
    );
  const shown =
    filter === "favorite"
      ? data.dresses.filter((d) => d.isFavorite)
      : data.dresses;
  return (
    <main className="bridal-page pb-28">
      <header className="bridal-header">
        <div className="flex items-center justify-between">
          <button
            aria-label="투어로 돌아가기"
            className="bridal-icon-button grid place-items-center"
            onClick={() => nav(`/tour/${tourId}`)}
          >
            <ArrowLeft />
          </button>
        </div>
        <h1 className="mt-7 bridal-title">{data.tour.title}</h1>
        <div className="mt-4 flex gap-1 rounded-control border border-rule p-1">
          <button
            className={`h-11 flex-1 rounded-xl text-sm font-medium ${filter === "all" ? "bg-accent-soft text-accent-copy" : "text-ink-muted"}`}
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            전체 {data.dresses.length}
          </button>
          <button
            className={`h-11 flex-1 rounded-xl text-sm font-medium ${filter === "favorite" ? "bg-accent-soft text-accent-copy" : "text-ink-muted"}`}
            aria-pressed={filter === "favorite"}
            onClick={() => setFilter("favorite")}
          >
            후보 {data.dresses.filter((d) => d.isFavorite).length}
          </button>
        </div>
      </header>
      <section className="bridal-content mt-7">
        {shown.length === 0 ? (
          <EmptyReviewState
            filter={filter}
            onAdd={() => nav(`/tour/${tourId}`)}
          />
        ) : (
          data.shops.map((shop) => {
            const dresses = shown.filter((d) => d.shopId === shop.id);
            if (!dresses.length) return null;
            return (
              <div key={shop.id} className="mb-8">
                <h2 className="bridal-section-title mb-4">{shop.name}</h2>
                <div className="space-y-4">
                  {dresses.map((d) => (
                    <button
                      key={d.id}
                      className="flex w-full gap-3 rounded-card border border-rule bg-white p-3 text-left"
                      onClick={() =>
                        nav(`/tour/${tourId}/dress/${d.id}?view=record`)
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <DressDecisionCard dress={d} shopName={shop.name} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>
      <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 bridal-action-bar border-t pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Link
          to={`/tour/${tourId}/export`}
          className="flex h-14 items-center justify-center gap-2 bridal-primary"
        >
          <FileDown size={18} />
          PDF 만들기
        </Link>
      </div>
    </main>
  );
}

function EmptyReviewState({
  filter,
  onAdd,
}: {
  readonly filter: "all" | "favorite";
  readonly onAdd: () => void;
}) {
  if (filter === "favorite") {
    return (
      <div className="bridal-empty rounded-card p-6 text-center text-sm text-ink-muted">
        <EmptyRecordIllustration favorite />
        아직 후보로 남긴 드레스가 없어요.
      </div>
    );
  }

  return (
    <div className="bridal-empty rounded-card p-6 text-center text-sm text-ink-muted">
      <EmptyRecordIllustration />
      <p>아직 기록한 드레스가 없어요.</p>
      <button className="mt-4 min-h-11 bridal-primary px-4" onClick={onAdd}>
        투어에서 드레스 추가
      </button>
    </div>
  );
}
