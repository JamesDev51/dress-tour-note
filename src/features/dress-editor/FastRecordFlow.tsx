import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FastRecordOptions } from "./FastRecordOptions";
import type { Dress } from "../../types/domain";
import { FastRecordNavigation } from "./FastRecordNavigation";
import { FastRecordSummary } from "./FastRecordSummary";
import { DressPreviewButton } from "./DressPreviewDialog";
import { upperFabricFor, lowerFabricFor } from "../../lib/dress/activeOptions";

type CoreDress = Pick<
  Dress,
  | "id"
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "fabric"
  | "upperFabric"
  | "lowerFabric"
  | "lowerFabricStart"
  | "isFavorite"
  | "coreRecordedAt"
  | "rating"
  | "quickTags"
  | "customOptions"
>;
type Step = 1 | 2 | 3;
const choiceKeys = ["silhouette", "fabric", "neckline", "topStyle"] as const;
type ChoiceKey = (typeof choiceKeys)[number];
type ChoiceWrites = Partial<Record<ChoiceKey, Partial<Dress> | "failed">>;
const PREVIOUS_STEP = { 1: 1, 2: 1, 3: 2 } as const;
const NEXT_STEP = { 1: 2, 2: 3, 3: 3 } as const;

function initialAcknowledgements(dress: CoreDress) {
  const recorded = dress.coreRecordedAt !== undefined;
  return [
    recorded || dress.silhouette !== "unknown",
    recorded ||
      (upperFabricFor(dress) !== "unknown" &&
        lowerFabricFor(dress) !== "unknown"),
    recorded || dress.neckline !== "unknown",
    recorded || dress.topStyle !== "unknown",
  ];
}

type FastRecordFlowProps = {
  sessionChoices?: readonly Partial<Dress>[];
  dress: CoreDress;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onComplete: () => Promise<void>;
  onFinishAndView?: () => Promise<void>;
  onOpenDetails: () => void;
  recallEditor?: ReactNode;
  corePreview?: ReactNode;
  renderSummary?: (onEditCore: () => void) => ReactNode;
  initialView?: "summary" | "steps";
  identityKey?: string;
  showDetailsAction?: boolean;
  saveBlocked?: boolean;
};

export function FastRecordFlow(props: FastRecordFlowProps) {
  const identity = props.identityKey ?? props.dress.id;
  return (
    <FastRecordSession
      key={JSON.stringify([identity, props.initialView ?? "auto"])}
      {...props}
    />
  );
}

function FastRecordSession({
  dress,
  sessionChoices,
  onPatch,
  onComplete,
  onFinishAndView,
  onOpenDetails,
  recallEditor,
  corePreview,
  renderSummary,
  initialView,
  showDetailsAction = true,
  saveBlocked,
}: FastRecordFlowProps) {
  const [view, setView] = useState<"summary" | "steps">(
    initialView ?? (dress.coreRecordedAt ? "summary" : "steps"),
  );
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState("forward");
  const [values, setValues] = useState(dress);
  const [acknowledged, setAcknowledged] = useState(() =>
    initialAcknowledgements(dress),
  );
  const [saving, setSaving] = useState(false);
  const [writes, setWrites] = useState<ChoiceWrites>({});
  const busyRef = useRef(false);
  const generation = useRef(0);
  const [error, setError] = useState("");
  const options = useRef<HTMLDivElement>(null);
  const requestedStepFocus = useRef(false);
  useLayoutEffect(() => {
    if (!requestedStepFocus.current) return;
    requestedStepFocus.current = false;
    const heading = options.current?.querySelector<HTMLElement>("h2");
    if (!heading) return;
    const menuBottom =
      document.querySelector(".core-details-nav")?.getBoundingClientRect()
        .bottom ?? 0;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: Math.max(
        0,
        window.scrollY + heading.getBoundingClientRect().top - menuBottom - 16,
      ),
      behavior: reduced ? "auto" : "smooth",
    });
    heading.focus({ preventScroll: true });
  }, [step]);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );

  useEffect(() => {
    setValues(dress);
    const persisted = initialAcknowledgements(dress);
    setAcknowledged((current) =>
      persisted.map((value, index) => value || current[index] === true),
    );
  }, [dress]);

  const persist = async (patch: Partial<Dress>) => {
    const group = choiceKeys.find((key) => key in patch);
    if (!group || busyRef.current) return;

    // The editor serializes writes. Keep each group's latest tap visible while
    // earlier writes settle and the database sends intermediate records.
    setWrites((current) => ({ ...current, [group]: patch }));
    setError("");
    let failed = false;
    try {
      await onPatch(patch);
      setValues((current) => ({ ...current, ...patch }));
      setAcknowledged((current) =>
        current.map((value, index) => value || choiceKeys[index] === group),
      );
    } catch (cause) {
      failed = true;
      throw cause;
    } finally {
      setWrites((current) => {
        if (current[group] !== patch) return current;
        const next = { ...current };
        if (failed && saveBlocked === undefined) next[group] = "failed";
        else delete next[group];
        return next;
      });
    }
  };

  const complete = async (nextDress: boolean) => {
    if (busyRef.current) return;
    const activeGeneration = generation.current;
    busyRef.current = true;
    setSaving(true);
    setError("");
    try {
      if (nextDress) await onComplete();
      else await onFinishAndView?.();
      if (activeGeneration === generation.current && !nextDress)
        setView("summary");
    } catch {
      if (activeGeneration === generation.current && saveBlocked === undefined)
        setError(
          nextDress
            ? "다음 드레스를 만들지 못했어요. 현재 기록은 유지돼요. 다시 시도해 주세요."
            : "저장하지 못했어요. 다시 시도해 주세요.",
        );
    } finally {
      // A new look mounts a separate keyed session, so this reset stays local.
      busyRef.current = false;
      setSaving(false);
    }
  };
  const choices = { ...values };
  const chosen = choiceKeys.map((key, index) => {
    const pending = writes[key];
    if (!pending || pending === "failed") return acknowledged[index] === true;
    Object.assign(choices, pending);
    return true;
  });
  // An edit from the detailed panel may supersede a pending basic choice.
  for (const patch of sessionChoices ?? []) {
    Object.assign(choices, patch);
    choiceKeys.forEach((key, index) => {
      if (key in patch) chosen[index] = true;
    });
  }
  const message =
    error ||
    (Object.values(writes).includes("failed")
      ? "저장하지 못했어요. 선택을 다시 눌러 주세요."
      : "");
  const errorMessage = message && (
    <p
      role="alert"
      className="mt-4 rounded-control bg-error-surface p-3 text-sm text-error"
    >
      {message}
    </p>
  );

  if (view === "summary") {
    if (renderSummary) return renderSummary(() => setView("steps"));
    return (
      <>
        {corePreview && <DressPreviewButton preview={corePreview} />}
        <FastRecordSummary
          dress={values}
          onEditCore={() => setView("steps")}
          onOpenDetails={onOpenDetails}
        />
        <section className="bridal-content pb-8">
          <fieldset disabled={saving}>{recallEditor}</fieldset>
          {errorMessage}
          <button
            type="button"
            disabled={saving}
            onClick={() => void complete(true)}
            className="mt-4 min-h-12 w-full rounded-control bridal-primary px-4 font-semibold text-white disabled:opacity-40"
          >
            다음 드레스 기록
          </button>
        </section>
      </>
    );
  }

  return (
    <section className="bridal-content pb-24 pt-4">
      <h1 className="sr-only">드레스 기본 기록</h1>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{step}/3</span>
        <span className="text-ink-muted">기본 기록</span>
      </div>
      <div
        aria-hidden="true"
        className="mb-4 mt-2 h-1 overflow-hidden rounded-full bg-stone-100"
      >
        <div
          className="h-full bg-accent transition-[width] motion-reduce:transition-none"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      {corePreview && <DressPreviewButton preview={corePreview} />}
      <div
        ref={options}
        key={step}
        className={`record-step record-step-${direction}`}
      >
        <FastRecordOptions
          step={step}
          values={choices}
          acknowledged={chosen[step - 1] === true}
          upperAcknowledged={{
            neckline: chosen[2] === true,
            topStyle: chosen[3] === true,
          }}
          saving={saving}
          onPatch={persist}
        />
      </div>
      {errorMessage}
      <FastRecordNavigation
        step={step}
        canAdvance={
          (step === 3
            ? chosen.every(Boolean) && Object.keys(writes).length === 0
            : chosen[step - 1] === true) && !saveBlocked
        }
        saving={saving}
        onPrevious={() => {
          requestedStepFocus.current = true;
          setDirection("backward");
          setStep((current) => PREVIOUS_STEP[current]);
        }}
        onNext={() => {
          requestedStepFocus.current = true;
          setDirection("forward");
          setStep((current) => NEXT_STEP[current]);
        }}
        onFinishAndView={() => void complete(false)}
      />
      {showDetailsAction && (
        <button
          type="button"
          disabled={saving}
          onClick={onOpenDetails}
          className="mt-3 min-h-11 w-full rounded-control px-4 text-sm font-semibold text-ink-muted"
        >
          자세히 기록
        </button>
      )}
    </section>
  );
}
