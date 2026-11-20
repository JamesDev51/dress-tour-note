import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  DressSketchEditor,
  type DressSketchOptions,
} from "./DressSketchEditor";

export function DressPreviewButton({
  preview,
  label = "미리보기",
  className = "",
  sketch,
}: {
  readonly preview: ReactNode;
  readonly sketch?: DressSketchOptions;
  readonly label?: string;
  readonly className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"preview" | "edit" | "saving">("preview");
  const sketchTrigger = useRef<HTMLButtonElement>(null);
  const returnToSketchTrigger = useRef(false);
  const finishSketch = () => {
    returnToSketchTrigger.current = true;
    setMode("preview");
  };
  useEffect(() => {
    if (mode === "preview" && returnToSketchTrigger.current) {
      sketchTrigger.current?.focus({ preventScroll: true });
      returnToSketchTrigger.current = false;
    }
  }, [mode]);
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    if (typeof node.showModal === "function") node.showModal();
    else node.setAttribute("open", "");
    return () => {
      if (typeof node.close === "function" && node.open) node.close();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-[480px] px-6 ${className}`}
      >
        <button
          ref={trigger}
          type="button"
          aria-haspopup="dialog"
          className="pointer-events-auto ml-auto block min-h-11 rounded-full border border-rule bg-paper px-4 text-sm font-semibold text-accent-copy shadow-sm"
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      </div>
      {open && (
        <dialog
          ref={dialog}
          aria-labelledby={titleId}
          onCancel={(event) => {
            event.preventDefault();
            if (mode === "edit") finishSketch();
            if (mode === "preview") setOpen(false);
          }}
          className="fixed inset-x-0 top-4 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[440px] overflow-auto rounded-preview border border-rule bg-paper p-4 text-ink backdrop:bg-ink/30"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id={titleId} className="bridal-section-title">
              {mode === "preview" ? "드레스 미리보기" : "그림에 표시하기"}
            </h2>
            {mode === "preview" && (
              <button
                type="button"
                aria-label="미리보기 닫기"
                onClick={() => setOpen(false)}
                className="min-h-11 shrink-0 rounded-control px-3 text-sm text-ink-muted"
              >
                닫기
              </button>
            )}
          </div>
          {mode !== "preview" && sketch ? (
            <DressSketchEditor
              dress={sketch.dress}
              saving={mode === "saving"}
              onCancel={finishSketch}
              onSave={async (strokes) => {
                setMode("saving");
                try {
                  await sketch.onSave(strokes);
                  finishSketch();
                } catch (error) {
                  setMode("edit");
                  throw error;
                }
              }}
            />
          ) : (
            <>
              <div className="min-w-0">{preview}</div>
              {sketch && (
                <button
                  ref={sketchTrigger}
                  type="button"
                  onClick={() => setMode("edit")}
                  className="mt-3 min-h-11 w-full rounded-control border border-rule px-4 text-sm font-semibold text-accent-copy"
                >
                  그림에 표시하기
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 min-h-12 w-full rounded-control bridal-primary px-4 font-semibold text-white"
              >
                {sketch ? "기록으로 돌아가기" : "선택으로 돌아가기"}
              </button>
            </>
          )}
        </dialog>
      )}
    </>
  );
}
