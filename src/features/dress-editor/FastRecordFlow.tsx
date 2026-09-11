import { useEffect, useRef, useState } from "react";
import { DressOptionSection } from "./DressOptionSection";
import {
  necklineOptions,
  silhouetteOptions,
  topStyleOptions,
} from "../../lib/dress/options";
import type {
  Dress,
  Neckline,
  QuickTag,
  Silhouette,
  TopStyle,
} from "../../types/domain";
import { FastRecordDecisionStep } from "./FastRecordDecisionStep";
import { FastRecordNavigation } from "./FastRecordNavigation";
import { FastRecordSummary } from "./FastRecordSummary";

type CoreDress = Pick<
  Dress,
  | "id"
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "isFavorite"
  | "coreRecordedAt"
  | "rating"
  | "quickTags"
  | "customOptions"
>;
type Step = 1 | 2 | 3 | 4;
const PREVIOUS_STEP = { 1: 1, 2: 1, 3: 2, 4: 3 } as const;
const NEXT_STEP = { 1: 2, 2: 3, 3: 4, 4: 4 } as const;
const fastNecklineOptions = necklineOptions.map((option) =>
  option.id === "sweetheart"
    ? { ...option, aliases: [...(option.aliases ?? []), "하트형"] }
    : option,
);

function hasRecordedCore(dress: CoreDress) {
  return dress.coreRecordedAt !== undefined;
}

export function FastRecordFlow({
  dress,
  onPatch,
  onComplete,
  onOpenDetails,
}: {
  dress: CoreDress;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onComplete: () => Promise<void>;
  onOpenDetails: () => void;
}) {
  const recorded = hasRecordedCore(dress);
  const [view, setView] = useState<"summary" | "steps">(
    recorded ? "summary" : "steps",
  );
  const [step, setStep] = useState<Step>(1);
  const [topStyle, setTopStyle] = useState<TopStyle>(dress.topStyle);
  const [neckline, setNeckline] = useState<Neckline>(dress.neckline);
  const [silhouette, setSilhouette] = useState<Silhouette>(dress.silhouette);
  const [isFavorite, setIsFavorite] = useState(dress.isFavorite);
  const [rating, setRating] = useState(dress.rating);
  const [quickTags, setQuickTags] = useState<readonly QuickTag[]>(
    dress.quickTags,
  );
  const [acknowledged, setAcknowledged] = useState(() => [
    recorded || dress.topStyle !== "unknown",
    recorded || dress.neckline !== "unknown",
    recorded || dress.silhouette !== "unknown",
    recorded,
  ]);
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setView(hasRecordedCore(dress) ? "summary" : "steps");
    setStep(1);
    setTopStyle(dress.topStyle);
    setNeckline(dress.neckline);
    setSilhouette(dress.silhouette);
    setIsFavorite(dress.isFavorite);
    setRating(dress.rating);
    setQuickTags(dress.quickTags);
    const nextRecorded = hasRecordedCore(dress);
    setAcknowledged([
      nextRecorded || dress.topStyle !== "unknown",
      nextRecorded || dress.neckline !== "unknown",
      nextRecorded || dress.silhouette !== "unknown",
      nextRecorded,
    ]);
    setSaving(false);
    busyRef.current = false;
    setError("");
  }, [dress.id]);

  useEffect(() => {
    setIsFavorite(dress.isFavorite);
  }, [dress.isFavorite]);

  const persist = async (patch: Partial<Dress>, acknowledgeStep = false) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onPatch(patch);
      if (acknowledgeStep) {
        setAcknowledged((current) =>
          current.map((value, index) => (index === step - 1 ? true : value)),
        );
      }
      return true;
    } catch {
      setError("저장하지 못했어요. 다시 시도해 주세요.");
      return false;
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  };

  const pickTop = async (value: TopStyle) => {
    if (await persist({ topStyle: value }, true)) setTopStyle(value);
  };
  const pickNeckline = async (value: Neckline) => {
    if (await persist({ neckline: value }, true)) setNeckline(value);
  };
  const pickSilhouette = async (value: Silhouette) => {
    if (await persist({ silhouette: value }, true)) setSilhouette(value);
  };
  const pickCandidate = async (value: boolean) => {
    if (
      await persist(
        { isFavorite: value, coreRecordedAt: new Date().toISOString() },
        true,
      )
    )
      setIsFavorite(value);
  };
  const changeRating = async (value: NonNullable<Dress["rating"]>) => {
    if (await persist({ rating: value })) setRating(value);
  };
  const toggleTag = async (tag: QuickTag) => {
    const next = quickTags.includes(tag)
      ? quickTags.filter((value) => value !== tag)
      : [...quickTags, tag];
    if (await persist({ quickTags: next })) setQuickTags(next);
  };
  const finish = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onComplete();
    } catch {
      setError("저장하지 못했어요. 다시 시도해 주세요.");
      busyRef.current = false;
      setSaving(false);
    }
  };

  if (view === "summary") {
    return (
      <FastRecordSummary
        dress={{
          topStyle,
          neckline,
          silhouette,
          isFavorite,
          customOptions: dress.customOptions,
        }}
        onEditCore={() => setView("steps")}
        onOpenDetails={onOpenDetails}
      />
    );
  }

  return (
    <section className="px-5 pb-32 pt-4">
      <h1 className="sr-only">드레스 핵심 기록</h1>
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{step}/4</span>
        <span className="text-ink-muted">빠른 기록</span>
      </div>
      <div
        aria-hidden="true"
        className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100"
      >
        <div
          className="h-full bg-accent transition-[width] motion-reduce:transition-none"
          style={{ width: `${step * 25}%` }}
        />
      </div>

      {step === 1 && (
        <DressOptionSection
          category="top"
          title="어깨/상의는 어땠나요?"
          options={topStyleOptions}
          value={acknowledged[0] ? topStyle : undefined}
          onPick={(value) => void pickTop(value)}
          disabled={() => saving}
          allowCustom={false}
          customValue={dress.customOptions?.top}
          onCustomCommit={() => undefined}
        />
      )}
      {step === 2 && (
        <DressOptionSection
          category="neckline"
          title="네크라인은 어땠나요?"
          options={fastNecklineOptions}
          value={acknowledged[1] ? neckline : undefined}
          onPick={(value) => void pickNeckline(value)}
          disabled={() => saving}
          allowCustom={false}
          customValue={dress.customOptions?.neckline}
          onCustomCommit={() => undefined}
        />
      )}
      {step === 3 && (
        <DressOptionSection
          category="silhouette"
          title="실루엣은 어땠나요?"
          options={silhouetteOptions}
          value={acknowledged[2] ? silhouette : undefined}
          onPick={(value) => void pickSilhouette(value)}
          disabled={() => saving}
          allowCustom={false}
          customValue={dress.customOptions?.silhouette}
          onCustomCommit={() => undefined}
        />
      )}
      {step === 4 && (
        <FastRecordDecisionStep
          acknowledged={acknowledged[3]}
          isFavorite={isFavorite}
          rating={rating}
          quickTags={quickTags}
          saving={saving}
          onCandidate={(value) => void pickCandidate(value)}
          onRating={(value) => void changeRating(value)}
          onTag={(value) => void toggleTag(value)}
        />
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-control bg-error-surface p-3 text-sm text-error"
        >
          {error}
        </p>
      )}
      {step === 4 && acknowledged[3] && (
        <button
          type="button"
          className="mt-6 min-h-12 w-full rounded-control border border-stone-200 bg-white px-4 font-bold"
          disabled={saving}
          onClick={onOpenDetails}
        >
          상세 기록
        </button>
      )}
      <FastRecordNavigation
        step={step}
        canAdvance={acknowledged[step - 1] === true}
        saving={saving}
        onPrevious={() => setStep((current) => PREVIOUS_STEP[current])}
        onNext={() => {
          if (step === 4) void finish();
          else setStep((current) => NEXT_STEP[current]);
        }}
      />
    </section>
  );
}
