export function FastRecordNavigation({
  step,
  canAdvance,
  saving,
  onPrevious,
  onNext,
  onFinishAndView,
}: {
  step: 1 | 2 | 3;
  canAdvance: boolean;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinishAndView?: () => void;
}) {
  return (
    <div className="h-[calc(5rem+env(safe-area-inset-bottom))]">
      <nav
        aria-label="기록 단계 이동"
        className="bridal-action-bar fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[480px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 border-t border-rule pb-[calc(12px+env(safe-area-inset-bottom))] pt-3"
      >
        <button
          type="button"
          className="bridal-secondary min-h-12 disabled:opacity-40"
          disabled={step === 1 || saving}
          onClick={onPrevious}
        >
          이전
        </button>
        <button
          type="button"
          className="min-h-12 rounded-control bridal-primary px-3 font-semibold text-white disabled:opacity-40"
          disabled={!canAdvance || saving}
          onClick={step === 3 ? onFinishAndView : onNext}
        >
          {step === 3 ? "기록 완료하고 보기" : "다음"}
        </button>
      </nav>
    </div>
  );
}
