export function DressEditorFooter({ onNext }: { onNext: () => Promise<void> }) {
  return (
    <div className="mt-4 w-full border-t border-rule bridal-action-bar pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
      <button
        className="h-14 w-full rounded-2xl bridal-primary font-semibold text-white"
        onClick={() => void onNext()}
      >
        다음 드레스 추가
      </button>
    </div>
  );
}
