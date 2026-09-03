export function DressEditorFooter({ onNext }: { onNext: () => Promise<void> }) {
  return (
    <div className="mt-4 w-full border-t border-stone-100 bg-shell px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
      <button
        className="h-14 w-full rounded-2xl bg-stone-900 font-bold text-white"
        onClick={() => void onNext()}
      >
        다음 드레스 추가
      </button>
    </div>
  );
}
