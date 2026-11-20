import { EmptyRecordIllustration } from "../../components/RecordGraphics";
import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DressDecisionCard } from "../../components/DressDecisionCard";
import { SaveStatus } from "../../components/SaveStatus";
import { db } from "../../db/database";
import {
  addDress,
  deleteDress,
  duplicateDress,
  patchShop,
  reorderDresses,
} from "../../db/repositories";
import { useUIStore } from "../../stores/uiStore";

export function ShopPage() {
  const { tourId = "", shopId = "" } = useParams();
  const nav = useNavigate();
  const toast = useUIStore((s) => s.showToast);
  const setSave = useUIStore((s) => s.setSaveStatus);
  const [nameDraft, setNameDraft] = useState<{ id: string; value: string }>();
  const [nameError, setNameError] = useState<string>();
  const nameWrites = useRef(Promise.resolve());
  const pendingNameWrites = useRef(0);
  const nameRevision = useRef(0);
  const data = useLiveQuery(async () => {
    const shop = await db.shops.get(shopId);
    if (!shop || shop.tourId !== tourId) return null;
    if (!(await db.tours.get(tourId))) return null;
    const dresses = (
      await db.dresses.where("shopId").equals(shopId).toArray()
    ).sort((a, b) => a.order - b.order);
    return { shop, dresses };
  }, [shopId, tourId]);
  if (data === undefined)
    return (
      <main className="bridal-page bridal-content py-8 text-center text-sm text-ink-muted">
        기록을 불러오는 중...
      </main>
    );
  if (data === null)
    return (
      <main className="bridal-page bridal-content py-12">
        <h1 className="bridal-title">드레스샵 기록을 찾을 수 없어요.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          이 브라우저에서 기록을 찾을 수 없어요. 삭제된 기록일 수도 있어요.
        </p>
        <button
          type="button"
          className="bridal-primary mt-6 min-h-12 px-5"
          onClick={() => nav("/")}
        >
          홈에서 기록 찾기
        </button>
      </main>
    );
  const saveName = async (value: string, finishEditing = false) => {
    const name = value.trim();
    if (!name) {
      if (finishEditing) {
        setNameDraft(undefined);
        setNameError("샵 이름은 비워둘 수 없어 이전 이름을 유지했어요.");
      }
      return;
    }
    if (name === data.shop.name && pendingNameWrites.current === 0) {
      if (finishEditing) setNameDraft(undefined);
      return;
    }
    const revision = ++nameRevision.current;
    pendingNameWrites.current += 1;
    const write = nameWrites.current
      .catch(() => undefined)
      .then(() => patchShop(shopId, { name }));
    nameWrites.current = write;
    setSave("saving");
    try {
      await write;
      if (finishEditing)
        setNameDraft((current) =>
          current?.id === shopId && current.value === value
            ? undefined
            : current,
        );
      if (nameRevision.current === revision) {
        setNameError(undefined);
        setSave("saved");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "샵 이름을 저장하지 못했어요.";
      if (nameRevision.current === revision) {
        setNameError(message);
        setSave("error");
        toast(message);
      }
    } finally {
      pendingNameWrites.current -= 1;
    }
  };
  const saveMemo = async (memo: string) => {
    setSave("saving");
    try {
      await patchShop(shopId, { memo });
      setSave("saved");
    } catch {
      setSave("error");
      toast("샵 메모를 저장하지 못했어요. 다시 입력해 주세요.");
    }
  };
  const move = async (index: number, delta: number) => {
    const next = [...data.dresses];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    await reorderDresses(
      shopId,
      next.map((x) => x.id),
    );
    toast("드레스 순서를 바꿨어요.");
  };
  const createDress = async () => {
    try {
      const id = await addDress(shopId);
      nav(`/tour/${tourId}/dress/${id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "드레스를 추가하지 못했어요.");
    }
  };
  return (
    <main className="bridal-page pb-28">
      <header className="bridal-header">
        <div className="flex items-center justify-between">
          <button
            aria-label="투어로 돌아가기"
            className="bridal-icon-button grid h-11 w-11 place-items-center"
            onClick={() => nav(`/tour/${tourId}`)}
          >
            <ArrowLeft />
          </button>
          <SaveStatus />
        </div>
        <input
          aria-label="드레스샵 이름"
          maxLength={50}
          value={nameDraft?.id === shopId ? nameDraft.value : data.shop.name}
          aria-describedby={nameError ? "shop-name-error" : undefined}
          onChange={(event) => {
            setNameDraft({ id: shopId, value: event.target.value });
            setNameError(undefined);
            if (event.target.value.trim()) void saveName(event.target.value);
          }}
          onBlur={(event) => void saveName(event.target.value, true)}
          className="bridal-title mt-6 min-h-11 w-full bg-transparent"
        />
        {nameError && (
          <p
            id="shop-name-error"
            role="alert"
            className="mt-2 text-sm text-error"
          >
            {nameError}
          </p>
        )}
        <textarea
          aria-label="샵 상담 메모"
          maxLength={1000}
          value={data.shop.memo || ""}
          onChange={(e) => void saveMemo(e.target.value)}
          placeholder="샵 상담 메모 (선택)"
          className="bridal-field mt-4 min-h-16 w-full resize-none rounded-control border p-3 text-sm leading-6"
        />
      </header>
      <section className="bridal-content mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="bridal-section-title">
            입어본 드레스{" "}
            <span className="text-stone-300">{data.dresses.length}</span>
          </h2>
          <button
            className="bridal-secondary inline-flex min-h-11 items-center gap-1 px-3 text-sm"
            onClick={() => void createDress()}
          >
            <Plus size={16} />
            드레스 추가
          </button>
        </div>
        {data.dresses.length === 0 ? (
          <div className="bridal-empty rounded-card p-6 text-center text-sm leading-6 text-ink-muted">
            <EmptyRecordIllustration />이 샵에서 입어본 첫 드레스를
            기록해볼까요?
          </div>
        ) : (
          <div className="space-y-4">
            {data.dresses.map((d, i) => (
              <article
                key={d.id}
                className="rounded-card border border-stone-200 bg-white p-4"
              >
                <button
                  aria-label={`${d.label} 상세 편집`}
                  className="block w-full min-w-0 text-left"
                  onClick={() => nav(`/tour/${tourId}/dress/${d.id}`)}
                >
                  <DressDecisionCard dress={d} />
                </button>
                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-stone-200 pt-2">
                  <button
                    aria-label={`${d.label} 기록 보기`}
                    className="min-h-11 shrink-0 rounded-lg px-2 text-xs font-semibold text-accent-copy"
                    onClick={() =>
                      nav(`/tour/${tourId}/dress/${d.id}?view=record`)
                    }
                  >
                    기록 보기
                  </button>
                  <button
                    disabled={i === 0}
                    aria-label={`${d.label} 위로 이동`}
                    className="grid h-11 w-11 shrink-0 place-items-center text-stone-400 disabled:opacity-20"
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    disabled={i === data.dresses.length - 1}
                    aria-label={`${d.label} 아래로 이동`}
                    className="grid h-11 w-11 shrink-0 place-items-center text-stone-400 disabled:opacity-20"
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    aria-label={`${d.label} 기록 복사`}
                    className="grid h-11 w-11 shrink-0 place-items-center text-stone-400"
                    onClick={async () => {
                      try {
                        const id = await duplicateDress(d.id);
                        toast("드레스 기록을 복사했어요.");
                        nav(`/tour/${tourId}/dress/${id}`);
                      } catch (e) {
                        toast(
                          e instanceof Error
                            ? e.message
                            : "드레스 기록을 복사하지 못했어요.",
                        );
                      }
                    }}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    aria-label={`${d.label} 기본 기록 수정`}
                    className="grid h-11 w-11 shrink-0 place-items-center text-stone-400"
                    onClick={() => nav(`/tour/${tourId}/dress/${d.id}`)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    aria-label={`${d.label} 삭제`}
                    className="ml-auto grid h-11 w-11 shrink-0 place-items-center text-stone-300"
                    onClick={async () => {
                      if (confirm(`${d.label}을 삭제할까요?`)) {
                        await deleteDress(d.id);
                        toast("드레스를 삭제했어요.");
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="bridal-action-bar fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <button
          className="bridal-primary h-14 w-full"
          onClick={() => void createDress()}
        >
          <Plus className="mr-1 inline" size={17} />
          다음 드레스 기록
        </button>
      </div>
    </main>
  );
}
