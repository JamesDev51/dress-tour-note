import { useEffect, useRef, useState, type ReactNode } from "react";
import { FastRecordOptions } from "./FastRecordOptions";
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

function hasRecordedCore(dress: CoreDress) {
  return dress.coreRecordedAt !== undefined;
}

export function FastRecordFlow({
  dress,
  onPatch,
  onComplete,
  onFinishAndView,
  onOpenDetails,
  recallEditor,
  corePreview,
  renderSummary,
  initialView,
  showDetailsAction = true,
}: {
  dress: CoreDress;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onComplete: () => Promise<void>;
  onFinishAndView?: () => Promise<void>;
  onOpenDetails: () => void;
  recallEditor?: ReactNode;
  corePreview?: ReactNode;
  renderSummary?: (onEditCore: () => void) => ReactNode;
  initialView?: "summary" | "steps";
  showDetailsAction?: boolean;
}) {
  const recorded = hasRecordedCore(dress);
  const [view, setView] = useState<"summary" | "steps">(
    initialView ?? (recorded ? "summary" : "steps"),
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
    setView(initialView ?? (hasRecordedCore(dress) ? "summary" : "steps"));
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
  }, [dress.id, initialView]);

  useEffect(() => {
    setTopStyle(dress.topStyle);
    setNeckline(dress.neckline);
    setSilhouette(dress.silhouette);
    setIsFavorite(dress.isFavorite);
    setRating(dress.rating);
    setQuickTags(dress.quickTags);
    const nextRecorded = hasRecordedCore(dress);
    setAcknowledged((current) => [
      current[0] || nextRecorded || dress.topStyle !== "unknown",
      current[1] || nextRecorded || dress.neckline !== "unknown",
      current[2] || nextRecorded || dress.silhouette !== "unknown",
      current[3] || nextRecorded,
    ]);
  }, [
    dress.coreRecordedAt,
    dress.isFavorite,
    dress.neckline,
    dress.quickTags,
    dress.rating,
    dress.silhouette,
    dress.topStyle,
  ]);

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
  const finishAndView = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onFinishAndView?.();
      setView("summary");
    } catch {
      setError("저장하지 못했어요. 다시 시도해 주세요.");
      busyRef.current = false;
      setSaving(false);
    }
  };

  if (view === "summary") {
    if (renderSummary) return renderSummary(() => setView("steps"));
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
    <section className={`px-5 pt-4 ${step === 4 ? "pb-48" : "pb-32"}`}>
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

      {step !== 4 && (
        <FastRecordOptions
          step={step}
          values={{
            topStyle,
            neckline,
            silhouette,
            customOptions: dress.customOptions,
          }}
          acknowledged={acknowledged[step - 1] === true}
          saving={saving}
          onTop={(value) => void pickTop(value)}
          onNeckline={(value) => void pickNeckline(value)}
          onSilhouette={(value) => void pickSilhouette(value)}
        />
      )}
      {showDetailsAction && step === 4 && acknowledged[3] && (
        <button
          type="button"
          className="mt-5 min-h-12 w-full rounded-control border border-accent/30 bg-accent-soft px-4 font-bold text-accent-copy"
          disabled={saving}
          onClick={onOpenDetails}
        >
          상세 기록
        </button>
      )}

      {step === 4 && corePreview}
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

      {step === 4 && (
        <fieldset disabled={saving} className="min-w-0">
          {recallEditor}
        </fieldset>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-control bg-error-surface p-3 text-sm text-error"
        >
          {error}
        </p>
      )}
      <FastRecordNavigation
        step={step}
        canAdvance={acknowledged[step - 1] === true}
        saving={saving}
        onPrevious={() => setStep((current) => PREVIOUS_STEP[current])}
        onFinishAndView={() => void finishAndView()}
        onNext={() => {
          if (step === 4) void finish();
          else setStep((current) => NEXT_STEP[current]);
        }}
      />
    </section>
  );
}
