import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SaveStatus } from "../../components/SaveStatus";
import { db } from "../../db/database";
import {
  addShop,
  deleteShop,
  patchTour,
  reorderShops,
} from "../../db/repositories";
import { useUIStore } from "../../stores/uiStore";

export function TourDashboardPage() {
  const { tourId = "" } = useParams();
  const nav = useNavigate();
  const toast = useUIStore((s) => s.showToast);
  const setSave = useUIStore((s) => s.setSaveStatus);
  const [shopName, setShopName] = useState("");
  const [adding, setAdding] = useState(false);
  const data = useLiveQuery(async () => {
    const tour = await db.tours.get(tourId);
    if (!tour) return undefined;
    const shops = (
      await db.shops.where("tourId").equals(tourId).toArray()
    ).sort((a, b) => a.order - b.order);
    const counts = await Promise.all(
      shops.map(async (s) => ({
        dress: await db.dresses.where("shopId").equals(s.id).count(),
        fav: await db.dresses
          .where("shopId")
          .equals(s.id)
          .filter((d) => d.isFavorite)
          .count(),
      })),
    );
    return {
      tour,
      shops,
      counts,
      total: counts.reduce((n, c) => n + c.dress, 0),
    };
  }, [tourId]);
  if (data === undefined)
    return (
      <main className="p-8 text-center text-sm text-stone-400">
        기록을 불러오는 중...
      </main>
    );
  const move = async (index: number, delta: number) => {
    const next = [...data.shops];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await reorderShops(
      tourId,
      next.map((x) => x.id),
    );
    toast("순서를 바꿨어요.");
  };
  const canAddShop = shopName.trim().length > 0;
  return (
    <main className="min-h-dvh pb-28">
      <header className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button
            className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
            onClick={() => nav("/")}
            aria-label="홈"
          >
            <ArrowLeft />
          </button>
          <SaveStatus />
          <Link
            to={`/tour/${tourId}/review`}
            className={`grid h-11 w-11 place-items-center rounded-full ${data.total ? "bg-stone-900 text-white" : "pointer-events-none bg-stone-100 text-stone-300"}`}
            aria-label="결과 보기"
          >
            <FileText size={18} />
          </Link>
        </div>
        <input
          aria-label="투어 제목"
          value={data.tour.title}
          maxLength={50}
          onChange={(e) => {
            void patchTour(tourId, { title: e.target.value });
            setSave("saved");
          }}
          className="mt-7 w-full bg-transparent text-3xl font-black tracking-[-.04em] outline-none"
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
          <span>{data.tour.tourDate || "날짜 없음"}</span>
          <span>·</span>
          <span>샵 {data.shops.length}</span>
          <span>·</span>
          <span>드레스 {data.total}</span>
        </div>
      </header>
      <section className="mt-8 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">드레스샵</h2>
          <button
            className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#fff2ee] px-3 text-sm font-semibold text-[#a75e55]"
            onClick={() => setAdding((v) => !v)}
          >
            <Plus size={16} />샵 추가
          </button>
        </div>
        {adding && (
          <div className="mb-4 rounded-2xl border border-[#eadbd6] bg-white p-3">
            <input
              autoFocus
              maxLength={50}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="드레스샵 이름"
              className="h-12 w-full rounded-xl bg-stone-50 px-3 outline-none"
            />
            <p className="mt-2 text-xs text-stone-400">
              샵 이름을 입력하면 기록을 시작할 수 있어요.
            </p>
            <button
              disabled={!canAddShop}
              className="mt-2 h-11 w-full rounded-xl bg-stone-900 text-sm font-bold text-white disabled:bg-stone-200"
              onClick={async () => {
                if (!canAddShop) return;
                setSave("saving");
                try {
                  await addShop(tourId, { name: shopName.trim() });
                  setShopName("");
                  setAdding(false);
                  setSave("saved");
                } catch (e) {
                  setSave("error");
                  toast(
                    e instanceof Error ? e.message : "샵을 추가하지 못했어요.",
                  );
                }
              }}
            >
              추가하기
            </button>
          </div>
        )}
        {data.shops.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 p-8 text-center">
            <p className="font-semibold">첫 번째 드레스샵을 추가해 주세요.</p>
            <p className="mt-2 text-xs text-stone-400">
              샵별로 입어본 드레스를 묶어서 기록해요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.shops.map((s, i) => (
              <div
                key={s.id}
                className="rounded-3xl border border-stone-100 bg-white p-4 shadow-[0_6px_24px_rgba(60,45,40,.05)]"
              >
                <button
                  aria-label={`${s.name} 열기`}
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => nav(`/tour/${tourId}/shop/${s.id}`)}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff2ee] text-sm font-black text-[#a75e55]">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{s.name}</div>
                    <div className="mt-1 text-xs text-stone-400">
                      드레스 {data.counts[i].dress} · 후보 {data.counts[i].fav}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300" />
                </button>
                <div className="mt-3 flex gap-1 border-t border-stone-50 pt-2">
                  <button
                    aria-label={`${s.name} 위로 이동`}
                    disabled={i === 0}
                    className="grid h-9 w-10 place-items-center rounded-lg text-stone-400 disabled:opacity-20"
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    aria-label={`${s.name} 아래로 이동`}
                    disabled={i === data.shops.length - 1}
                    className="grid h-9 w-10 place-items-center rounded-lg text-stone-400 disabled:opacity-20"
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    aria-label={`${s.name} 삭제`}
                    className="ml-auto grid h-9 w-10 place-items-center rounded-lg text-stone-300"
                    onClick={async () => {
                      if (
                        confirm(
                          `${s.name}과 안의 드레스 ${data.counts[i].dress}벌을 삭제할까요?`,
                        )
                      ) {
                        await deleteShop(s.id);
                        toast("샵을 삭제했어요.");
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-100 bg-[#fffdfa]/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Link
          to={`/tour/${tourId}/review`}
          className={`flex h-14 items-center justify-center rounded-2xl font-bold ${data.total ? "bg-stone-900 text-white" : "pointer-events-none bg-stone-100 text-stone-300"}`}
        >
          {data.total ? "전체 결과 보기" : "드레스를 먼저 추가해 주세요"}
        </Link>
      </div>
    </main>
  );
}
