type Step = 1 | 2 | 3 | 4;

export function FastRecordNavigation({
  step,
  canAdvance,
  saving,
  onPrevious,
  onNext,
  onFinishAndView,
}: {
  step: Step;
  canAdvance: boolean;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinishAndView?: () => void;
}) {
  if (step === 4) {
    return (
      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-100 bg-shell/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          className="min-h-14 w-full rounded-control bg-stone-900 px-3 font-bold text-white disabled:opacity-40"
          disabled={!canAdvance || saving}
          onClick={onFinishAndView}
        >
          기록 완료하고 보기
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="min-h-11 rounded-control border border-stone-200 bg-white font-bold disabled:opacity-40"
            disabled={saving}
            onClick={onPrevious}
          >
            이전
          </button>
          <button
            type="button"
            className="min-h-11 rounded-control border border-stone-200 bg-white px-3 text-sm font-bold disabled:opacity-40"
            disabled={!canAdvance || saving}
            onClick={onNext}
          >
            다음 드레스 기록
          </button>
        </div>
      </div>
    );
  }
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
        다음
      </button>
    </div>
  );
}
