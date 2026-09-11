type Step = 1 | 2 | 3 | 4;

export function FastRecordNavigation({
  step,
  canAdvance,
  saving,
  onPrevious,
  onNext,
}: {
  step: Step;
  canAdvance: boolean;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2">
      <button
        type="button"
        className="min-h-12 rounded-control border border-stone-200 bg-white font-bold disabled:opacity-40"
        disabled={step === 1 || saving}
        onClick={onPrevious}
      >
        이전
      </button>
      <button
        type="button"
        className="min-h-12 rounded-control bg-stone-900 px-3 font-bold text-white disabled:opacity-40"
        disabled={!canAdvance || saving}
        onClick={onNext}
      >
        {step === 4 ? "다음 드레스 기록" : "다음"}
      </button>
    </div>
  );
}
