export function DressEditorFooter({ onNext }: { onNext: () => Promise<void> }) {
  return (
    <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-100 bg-shell/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <button
        className="h-14 w-full rounded-2xl bg-stone-900 font-bold text-white"
        onClick={() => void onNext()}
      >
        다음 드레스 추가
      </button>
    </div>
  );
}
