import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  ChevronDown,
  Heart,
  ImagePlus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DressPreview } from "../../components/DressPreview";
import {
  OptionArtwork,
  type OptionArtworkCategory,
} from "../../components/OptionArtwork";
import { OptionTile } from "../../components/OptionTile";
import { SaveStatus } from "../../components/SaveStatus";
import { db } from "../../db/database";
import {
  addDress,
  patchDress,
  removeFaceAsset,
  setFaceAsset,
} from "../../db/repositories";
import {
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  isNecklineCompatible,
  necklineOptions,
  quickTagOptions,
  silhouetteOptions,
  topStyleOptions,
  trainOptions,
  waistlineOptions,
} from "../../lib/dress/options";
import { processFaceFile } from "../../lib/image/processFace";
import {
  DEFAULT_FACE_TRANSFORM,
  type Dress,
  type FaceTransform,
} from "../../types/domain";
import { useUIStore } from "../../stores/uiStore";

export function DressEditorPage() {
  const { tourId = "", dressId = "" } = useParams();
  const nav = useNavigate();
  const setSave = useUIStore((s) => s.setSaveStatus);
  const toast = useUIStore((s) => s.showToast);
  const data = useLiveQuery(async () => {
    const dress = await db.dresses.get(dressId);
    if (!dress) return undefined;
    const tour = await db.tours.get(dress.tourId);
    const face = tour?.faceAssetId
      ? await db.assets.get(tour.faceAssetId)
      : undefined;
    return { dress, tour, face };
  }, [dressId]);
  const [memo, setMemo] = useState("");
  const [label, setLabel] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [transform, setTransform] = useState<FaceTransform>(
    DEFAULT_FACE_TRANSFORM,
  );
  const initialized = useRef("");
  const latestMemo = useRef("");
  const latestLabel = useRef("");
  const latestTransform = useRef<FaceTransform>(DEFAULT_FACE_TRANSFORM);
  const hasFace = useRef(false);
  useEffect(() => {
    if (data?.dress && initialized.current !== data.dress.id) {
      initialized.current = data.dress.id;
      latestMemo.current = data.dress.memo;
      latestLabel.current = data.dress.label;
      latestTransform.current =
        data.dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
      setMemo(data.dress.memo);
      setLabel(data.dress.label);
      setTransform(latestTransform.current);
    }
    hasFace.current = Boolean(data?.face);
  }, [data?.dress, data?.face]);
  useEffect(() => {
    if (!data?.dress || memo === data.dress.memo) return;
    setSave("saving");
    const t = window.setTimeout(async () => {
      try {
        await patchDress(dressId, { memo });
        setSave("saved");
      } catch {
        setSave("error");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [memo, dressId, data?.dress?.memo, setSave]);
  useEffect(() => {
    if (!data?.dress) return;
    const current = data.dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
    if (JSON.stringify(transform) === JSON.stringify(current)) return;
    const t = window.setTimeout(async () => {
      try {
        await patchDress(dressId, { faceTransform: transform });
        setSave("saved");
      } catch {
        setSave("error");
      }
    }, 220);
    return () => clearTimeout(t);
  }, [transform, dressId, data?.dress, setSave]);
  useEffect(
    () => () => {
      if (initialized.current !== dressId) return;
      const finalLabel = latestLabel.current.trim();
      const patch: Partial<Dress> = { memo: latestMemo.current };
      if (finalLabel) patch.label = finalLabel;
      if (hasFace.current) patch.faceTransform = latestTransform.current;
      void patchDress(dressId, patch);
    },
    [dressId],
  );
  if (!data?.dress || !data.tour)
    return (
      <main className="p-8 text-center text-sm text-stone-400">
        드레스를 불러오는 중...
      </main>
    );
  const d = data.dress;
  const immediate = async (patch: Partial<Dress>, message?: string) => {
    setSave("saving");
    try {
      const changed = await patchDress(dressId, patch);
      setSave("saved");
      if (changed) toast("선택한 어깨 형태에 맞춰 가슴선을 바꿨어요.");
      if (message) toast(message);
    } catch {
      setSave("error");
    }
  };
  const updateTransform = (patch: Partial<FaceTransform>) =>
    setTransform((current) => {
      const next = { ...current, ...patch };
      hasFace.current = true;
      latestTransform.current = next;
      return next;
    });
  const flushTransform = () => {
    void patchDress(dressId, { faceTransform: latestTransform.current });
  };
  const singleSection = <T extends string>(
    category: OptionArtworkCategory,
    title: string,
    options: { id: T; label: string; technical?: string }[],
    value: T,
    onPick: (id: T) => void,
    disabled?: (id: T) => boolean,
  ) => (
    <section className="mt-8">
      <h2 className="mb-3 text-[15px] font-bold">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <OptionTile
            key={o.id}
            label={o.label}
            technical={o.technical}
            selected={value === o.id}
            disabled={disabled?.(o.id)}
            onClick={() => onPick(o.id)}
            icon={<OptionArtwork category={category} id={o.id} />}
          />
        ))}
      </div>
    </section>
  );
  return (
    <main className="min-h-dvh pb-32">
      <header className="sticky top-0 z-20 border-b border-stone-100 bg-[#fffdfa]/95 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-stone-50"
            onClick={async () => {
              await patchDress(dressId, {
                memo: latestMemo.current,
                label: latestLabel.current.trim() || d.label,
                ...(data.face ? { faceTransform: latestTransform.current } : {}),
              });
              nav(`/tour/${tourId}/shop/${d.shopId}`);
            }}
            aria-label="뒤로"
          >
            <ArrowLeft size={19} />
          </button>
          <input
            aria-label="드레스 이름"
            maxLength={50}
            className="min-w-0 flex-1 bg-transparent font-bold outline-none"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              latestLabel.current = e.target.value;
            }}
            onBlur={async () => {
              const next = label.trim();
              if (next && next !== d.label) await immediate({ label: next });
            }}
          />
          <SaveStatus />
          <button
            aria-label="후보"
            className={`grid h-10 w-10 place-items-center rounded-full ${d.isFavorite ? "bg-[#fff0ec] text-[#b96e63]" : "bg-stone-50 text-stone-400"}`}
            onClick={() => immediate({ isFavorite: !d.isFavorite })}
          >
            <Heart size={18} fill={d.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </header>
      <div className="px-5 pt-4">
        <div className="sticky top-[72px] z-10 rounded-[32px] bg-[#fffdfa] pb-3">
          <DressPreview
            dress={{ ...d, faceTransform: transform }}
            faceAsset={data.face}
            className="mx-auto aspect-[9/13] max-h-[42dvh] w-auto"
          />
        </div>
        {singleSection(
          "top",
          "어깨/끈은 어떻게 생겼나요?",
          topStyleOptions,
          d.topStyle,
          (id) => immediate({ topStyle: id }),
        )}
        {singleSection(
          "neckline",
          "가슴선은 어떤 모양이었나요?",
          necklineOptions,
          d.neckline,
          (id) => immediate({ neckline: id }),
          (id) => id !== "unknown" && !isNecklineCompatible(d.topStyle, id),
        )}
        {singleSection(
          "silhouette",
          "치마는 어떻게 퍼졌나요?",
          silhouetteOptions,
          d.silhouette,
          (id) => immediate({ silhouette: id }),
        )}
        {singleSection(
          "fabric",
          "주 소재는 어떤 느낌이었나요?",
          fabricOptions,
          d.fabric,
          (id) => immediate({ fabric: id }),
        )}
        {singleSection(
          "color",
          "색은 가까운 쪽을 골라주세요",
          colorOptions,
          d.color,
          (id) => immediate({ color: id }),
        )}
        {singleSection(
          "train",
          "뒤로 끌리는 길이는?",
          trainOptions,
          d.train,
          (id) => immediate({ train: id }),
        )}
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[15px] font-bold">눈에 띈 디테일</h2>
            <span className="text-xs text-stone-400">최대 4개</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {detailOptions.map((o) => (
              <OptionTile
                key={o.id}
                label={o.label}
                selected={d.details.includes(o.id)}
                disabled={!d.details.includes(o.id) && d.details.length >= 4}
                onClick={() =>
                  immediate({
                    details: d.details.includes(o.id)
                      ? d.details.filter((x) => x !== o.id)
                      : [...d.details, o.id],
                  })
                }
                icon={<OptionArtwork category="detail" id={o.id} />}
              />
            ))}
          </div>
        </section>
        <button
          className="mt-7 flex h-12 w-full items-center justify-between rounded-2xl bg-stone-50 px-4 text-sm font-semibold"
          onClick={() => setAdvanced((v) => !v)}
        >
          더 자세히 기록{" "}
          <ChevronDown size={17} className={advanced ? "rotate-180" : ""} />
        </button>
        {advanced && (
          <>
            {singleSection(
              "waistline",
              "허리선은 어땠나요?",
              waistlineOptions,
              d.waistline,
              (id) => immediate({ waistline: id }),
            )}
            {singleSection(
              "back",
              "뒤태는 어땠나요?",
              backStyleOptions,
              d.backStyle ?? "unknown",
              (id) => immediate({ backStyle: id }),
            )}
          </>
        )}
        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold">입어봤을 때 어땠나요?</h2>
          <div className="flex flex-wrap gap-2">
            {quickTagOptions.map((o) => (
              <button
                key={o.id}
                aria-pressed={d.quickTags.includes(o.id)}
                className={`min-h-11 rounded-full border px-4 text-sm ${d.quickTags.includes(o.id) ? "border-[#b96e63] bg-[#fff2ee] text-[#a75e55]" : "border-stone-200 bg-white text-stone-500"}`}
                onClick={() =>
                  immediate({
                    quickTags: d.quickTags.includes(o.id)
                      ? d.quickTags.filter((x) => x !== o.id)
                      : [...d.quickTags, o.id],
                  })
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-stone-500">별점</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`${n}점`}
                className={`grid h-10 w-10 place-items-center text-xl ${n <= (d.rating ?? 0) ? "text-amber-400" : "text-stone-200"}`}
                onClick={() => immediate({ rating: n as 1 | 2 | 3 | 4 | 5 })}
              >
                ★
              </button>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold">특이사항</h2>
          <textarea
            maxLength={1000}
            value={memo}
            onChange={(e) => {
              setMemo(e.target.value);
              latestMemo.current = e.target.value;
            }}
            onBlur={() =>
              void patchDress(dressId, { memo: latestMemo.current })
            }
            placeholder="예: 허리가 제일 얇아 보였음, 치마 볼륨은 조금 아쉬움"
            className="min-h-32 w-full resize-none rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 outline-none focus:border-[#b96e63]"
          />
          <div className="mt-1 text-right text-[11px] text-stone-300">
            {memo.length}/1000
          </div>
        </section>
        <section className="mt-8 rounded-3xl border border-stone-100 bg-[#faf7f5] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">내 얼굴로 느낌 보기</h2>
              <p className="mt-1 text-xs leading-5 text-stone-400">
                사진은 이 기기에서만 처리됩니다. 가상 피팅이 아니라 분위기
                비교용이에요.
              </p>
            </div>
            {data.face && (
              <button
                aria-label="얼굴 사진 삭제"
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-stone-400"
                onClick={async () => {
                  if (confirm("얼굴 사진을 삭제할까요?")) {
                    hasFace.current = false;
                    await removeFaceAsset(tourId);
                    toast("얼굴 사진을 삭제했어요.");
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          {!data.face ? (
            <label className="mt-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-semibold shadow-sm">
              <ImagePlus size={18} />
              얼굴 사진 추가
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setSave("saving");
                    const asset = await processFaceFile(file);
                    await setFaceAsset(tourId, asset);
                    hasFace.current = true;
                    setSave("saved");
                    toast("얼굴 사진을 저장했어요.");
                  } catch (err) {
                    setSave("error");
                    toast(
                      err instanceof Error
                        ? err.message
                        : "사진을 처리하지 못했어요.",
                    );
                  }
                }}
              />
            </label>
          ) : (
            <div className="mt-4 space-y-3">
              <FaceSlider
                label="좌우"
                min={-1}
                max={1}
                step={0.01}
                value={transform.x}
                onChange={(x) => updateTransform({ x })}
                onCommit={flushTransform}
              />
              <FaceSlider
                label="위아래"
                min={-1}
                max={1}
                step={0.01}
                value={transform.y}
                onChange={(y) => updateTransform({ y })}
                onCommit={flushTransform}
              />
              <FaceSlider
                label="크기"
                min={0.5}
                max={3}
                step={0.02}
                value={transform.scale}
                onChange={(scale) => updateTransform({ scale })}
                onCommit={flushTransform}
              />
              <FaceSlider
                label="회전"
                min={-15}
                max={15}
                step={1}
                value={transform.rotation}
                onChange={(rotation) => updateTransform({ rotation })}
                onCommit={flushTransform}
              />
              <button
                className="inline-flex h-10 items-center gap-1 text-xs text-stone-400"
                onClick={() => {
                  latestTransform.current = DEFAULT_FACE_TRANSFORM;
                  setTransform(DEFAULT_FACE_TRANSFORM);
                  void patchDress(dressId, {
                    faceTransform: DEFAULT_FACE_TRANSFORM,
                  });
                }}
              >
                <RotateCcw size={14} />
                위치 초기화
              </button>
            </div>
          )}
        </section>
      </div>
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-100 bg-[#fffdfa]/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          className="h-14 w-full rounded-2xl bg-stone-900 font-bold text-white"
          onClick={async () => {
            await patchDress(dressId, {
              memo: latestMemo.current,
              label: latestLabel.current.trim() || d.label,
              ...(hasFace.current
                ? { faceTransform: latestTransform.current }
                : {}),
            });
            const next = await addDress(d.shopId);
            nav(`/tour/${tourId}/dress/${next}`, { replace: true });
          }}
        >
          다음 드레스 추가
        </button>
      </div>
    </main>
  );
}
function FaceSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <label className="grid grid-cols-[56px_1fr_42px] items-center gap-2 text-xs text-stone-500">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="accent-[#b96e63]"
      />
      <span className="text-right text-[10px] text-stone-400">
        {value.toFixed(step < 1 ? 2 : 0)}
      </span>
    </label>
  );
}
