import { useRef, useState } from "react";
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
  const [creatingShop, setCreatingShop] = useState(false);
  const creatingShopRef = useRef(false);
  const [titleDraft, setTitleDraft] = useState<{ id: string; value: string }>();
  const [titleError, setTitleError] = useState<string>();
  const titleWrites = useRef(Promise.resolve());
  const pendingTitleWrites = useRef(0);
  const titleRevision = useRef(0);
  const data = useLiveQuery(async () => {
    const tour = await db.tours.get(tourId);
    if (!tour) return null;
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
      <main className="bridal-page bridal-content py-8 text-center text-sm text-ink-muted">
        기록을 불러오는 중...
      </main>
    );
  if (data === null)
    return (
      <main className="bridal-page bridal-content py-12">
        <h1 className="bridal-title">투어 기록을 찾을 수 없어요.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          이 브라우저에서 기록을 찾을 수 없어요. 삭제된 기록일 수도 있어요.
        </p>
        <Link
          to="/"
          className="bridal-primary mt-6 inline-flex min-h-12 items-center px-5"
        >
          홈에서 기록 찾기
        </Link>
      </main>
    );
  const saveTitle = async (value: string, finishEditing = false) => {
    const title = value.trim();
    if (!title) {
      if (finishEditing) {
        setTitleDraft(undefined);
        setTitleError("제목은 비워둘 수 없어 이전 제목을 유지했어요.");
      }
      return;
    }
    if (title === data.tour.title && pendingTitleWrites.current === 0) {
      if (finishEditing) setTitleDraft(undefined);
      return;
    }
    const revision = ++titleRevision.current;
    pendingTitleWrites.current += 1;
    const write = titleWrites.current
      .catch(() => undefined)
      .then(() => patchTour(tourId, { title }));
    titleWrites.current = write;
    setSave("saving");
    try {
      await write;
      if (finishEditing)
        setTitleDraft((current) =>
          current?.id === tourId && current.value === value
            ? undefined
            : current,
        );
      if (titleRevision.current === revision) {
        setTitleError(undefined);
        setSave("saved");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "투어 제목을 저장하지 못했어요.";
      if (titleRevision.current === revision) {
        setTitleError(message);
        setSave("error");
        toast(message);
      }
    } finally {
      pendingTitleWrites.current -= 1;
    }
  };
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
    <main className="bridal-page pb-28">
      <header className="bridal-header">
        <div className="flex items-center justify-between">
          <button
            className="bridal-icon-button grid h-11 w-11 place-items-center"
            onClick={() => nav("/")}
            aria-label="홈"
          >
            <ArrowLeft />
          </button>
          <SaveStatus />
          <Link
            to={`/tour/${tourId}/review`}
            className={`grid h-11 w-11 place-items-center rounded-full ${data.total ? "bridal-primary" : "pointer-events-none bg-stone-100 text-stone-300"}`}
            aria-label="결과 보기"
          >
            <FileText size={18} />
          </Link>
        </div>
        <input
          aria-label="투어 제목"
          value={titleDraft?.id === tourId ? titleDraft.value : data.tour.title}
          maxLength={50}
          aria-describedby={titleError ? "tour-title-error" : undefined}
          onChange={(e) => {
            setTitleDraft({ id: tourId, value: e.target.value });
            setTitleError(undefined);
            if (e.target.value.trim()) void saveTitle(e.target.value);
          }}
          onBlur={(event) => void saveTitle(event.target.value, true)}
          className="bridal-title mt-6 min-h-11 w-full bg-transparent"
        />
        {titleError && (
          <p
            id="tour-title-error"
            role="alert"
            className="mt-2 text-sm text-error"
          >
            {titleError}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
          <span>{data.tour.tourDate || "날짜 없음"}</span>
          <span>·</span>
          <span>샵 {data.shops.length}</span>
          <span>·</span>
          <span>드레스 {data.total}</span>
        </div>
      </header>
      <section className="bridal-content mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="bridal-section-title">드레스샵</h2>
          <button
            className="bridal-secondary inline-flex min-h-11 items-center gap-1 px-3 text-sm"
            onClick={() => setAdding((v) => !v)}
          >
            <Plus size={16} />샵 추가
          </button>
        </div>
        {adding && (
          <div className="bridal-surface mb-4 p-4">
            <input
              autoFocus
              aria-label="추가할 드레스샵 이름"
              maxLength={50}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="드레스샵 이름"
              className="bridal-field h-12 w-full rounded-control border px-3"
            />
            <p className="mt-2 text-xs text-stone-400">
              샵 이름을 입력하면 기록을 시작할 수 있어요.
            </p>
            <button
              disabled={!canAddShop || creatingShop}
              className="bridal-primary mt-3 h-11 w-full text-sm disabled:bg-stone-200"
              onClick={async () => {
                if (!canAddShop || creatingShopRef.current) return;
                creatingShopRef.current = true;
                setCreatingShop(true);
                setSave("saving");
                try {
                  const id = await addShop(tourId, { name: shopName.trim() });
                  setShopName("");
                  setAdding(false);
                  setSave("saved");
                  nav(`/tour/${tourId}/shop/${id}`);
                } catch (e) {
                  setSave("error");
                  toast(
                    e instanceof Error ? e.message : "샵을 추가하지 못했어요.",
                  );
                } finally {
                  creatingShopRef.current = false;
                  setCreatingShop(false);
                }
              }}
            >
              {creatingShop ? "추가 중..." : "추가하기"}
            </button>
          </div>
        )}
        {data.shops.length === 0 ? (
          <div className="bridal-empty rounded-card p-6 text-center">
            <p className="font-semibold">첫 번째 드레스샵을 추가해 주세요.</p>
            <p className="mt-2 text-xs text-stone-400">
              샵별로 입어본 드레스를 묶어서 기록해요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.shops.map((s, i) => (
              <div key={s.id} className="bridal-surface p-4">
                <button
                  aria-label={`${s.name} 열기`}
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => nav(`/tour/${tourId}/shop/${s.id}`)}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-accent-soft text-sm font-medium text-accent-copy">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{s.name}</div>
                    <div className="mt-1 text-xs text-stone-400">
                      드레스 {data.counts[i].dress} · 후보 {data.counts[i].fav}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300" />
                </button>
                <div className="mt-3 flex gap-1 border-t border-stone-200 pt-2">
                  <button
                    aria-label={`${s.name} 위로 이동`}
                    disabled={i === 0}
                    className="grid h-11 w-11 place-items-center rounded-lg text-stone-400 disabled:opacity-20"
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    aria-label={`${s.name} 아래로 이동`}
                    disabled={i === data.shops.length - 1}
                    className="grid h-11 w-11 place-items-center rounded-lg text-stone-400 disabled:opacity-20"
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    aria-label={`${s.name} 삭제`}
                    className="ml-auto grid h-11 w-11 place-items-center rounded-lg text-stone-300"
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
      <div className="bridal-action-bar fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <Link
          to={`/tour/${tourId}/review`}
          className={`flex h-14 items-center justify-center rounded-control font-medium ${data.total ? "bridal-primary" : "pointer-events-none bg-stone-100 text-stone-300"}`}
        >
          {data.total ? "전체 결과 보기" : "드레스를 먼저 추가해 주세요"}
        </Link>
      </div>
    </main>
  );
}
