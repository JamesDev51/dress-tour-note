import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  FileUp,
  Smartphone,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ImportPreview, ImportStrategy } from "../../types/portable";
import { useUIStore } from "../../stores/uiStore";

export function ImportPage() {
  const nav = useNavigate();
  const toast = useUIStore((s) => s.showToast);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<ImportPreview>();
  const [strategy, setStrategy] = useState<ImportStrategy>("copy");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const inspect = async (f: File) => {
    setFile(f);
    setPreview(undefined);
    setError(undefined);
    setBusy(true);
    try {
      const mod = await import("../../lib/pdf/importPdf");
      const p = await mod.inspectPortablePdf(f);
      setPreview(p);
      setStrategy(p.hasConflict ? "copy" : "overwrite");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "PDF를 불러오지 못했어요.";
      setError(message);
      toast(message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="bridal-page bridal-content pb-28 pt-[calc(16px+env(safe-area-inset-top))]">
      <button
        aria-label="홈으로 돌아가기"
        className="bridal-icon-button grid place-items-center"
        onClick={() => nav("/")}
      >
        <ArrowLeft />
      </button>
      <p className="mt-8 text-xs font-semibold text-accent-dark">
        PDF 가져오기
      </p>
      <h1 className="mt-2 bridal-title">PDF에서 기록 가져오기</h1>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        드레스노트에서 만든 백업용 PDF만 읽어요. 일반 PDF와 보기 전용 PDF에서는
        기록을 복원하지 않아요.
      </p>
      <section
        aria-label="백업용 PDF로 기록 이어 쓰기"
        className="bridal-note motion-enter mt-6 p-4"
      >
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-xs leading-5 text-ink-muted">
          <div className="min-w-0 break-keep">
            <Smartphone className="mx-auto mb-2 text-accent-copy" size={24} />
            기록한 폰
          </div>
          <ArrowRight aria-hidden="true" size={14} />
          <div className="min-w-0 break-keep">
            <FileCheck2 className="mx-auto mb-2 text-accent-copy" size={24} />
            백업용 PDF
          </div>
          <ArrowRight aria-hidden="true" size={14} />
          <div className="min-w-0 break-keep">
            <Smartphone className="mx-auto mb-2 text-accent-copy" size={24} />
            지금 이 폰
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-muted">
          기록한 폰에서 ‘백업용 PDF’로 저장한 원본 파일을 이 폰으로 옮긴 뒤
          선택해 주세요. 보기 전용 PDF는 복원할 수 없어요.
        </p>
      </section>
      <label
        className={`bridal-surface mt-7 flex min-h-36 min-w-0 flex-col items-center justify-center px-4 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${busy ? "cursor-wait opacity-60" : "cursor-pointer"}`}
      >
        <FileUp size={26} className="text-accent" />
        <div className="mt-3 max-w-full break-all font-medium">
          {file ? file.name : "PDF 파일 선택"}
        </div>
        <div className="mt-1 text-xs text-stone-400">최대 30MB</div>
        <input
          type="file"
          disabled={busy}
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            if (busy) return;
            const f = e.target.files?.[0];
            if (f) void inspect(f);
          }}
        />
      </label>
      {busy && (
        <div className="mt-5 text-center text-sm text-stone-400">
          백업 기록을 확인하는 중...
        </div>
      )}
      {error && !busy && (
        <div
          role="alert"
          className="mt-5 flex gap-2 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">이 PDF를 불러올 수 없어요.</div>
            <p className="mt-1 text-sm leading-6">{error}</p>
            <p className="mt-2 text-sm leading-6 text-error">
              드레스노트에서 ‘백업용 PDF’로 저장한 원본 파일을 다시 선택해
              주세요.
            </p>
          </div>
        </div>
      )}
      {preview && (
        <section className="bridal-surface mt-6 p-5">
          <h2 className="text-xl font-medium">{preview.payload.tour.title}</h2>
          <div className="mt-2 text-sm text-stone-400">
            {preview.payload.tour.tourDate || "날짜 없음"} · 샵{" "}
            {preview.shopCount} · 드레스 {preview.dressCount} · 후보{" "}
            {preview.favoriteCount}
          </div>
          <div className="mt-1 text-xs text-stone-300">
            내보낸 시각{" "}
            {new Date(preview.payload.exportedAt).toLocaleString("ko-KR")}
          </div>
          {preview.hasConflict && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-semibold">
                이 브라우저에 같은 투어가 있어요
              </div>
              <label
                className={`mb-2 flex min-h-12 items-center gap-3 rounded-control border px-4 ${strategy === "copy" ? "border-accent bg-accent-soft" : "border-rule bg-white"}`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === "copy"}
                  onChange={() => setStrategy("copy")}
                />
                새 투어로 추가{" "}
                <span className="ml-auto text-xs text-stone-400">추천</span>
              </label>
              <label
                className={`flex min-h-12 items-center gap-3 rounded-control border px-4 ${strategy === "overwrite" ? "border-error bg-error-surface" : "border-rule bg-white"}`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === "overwrite"}
                  onChange={() => setStrategy("overwrite")}
                />
                기존 투어 덮어쓰기
              </label>
              {strategy === "overwrite" && (
                <p className="mt-2 text-sm leading-6 text-error">
                  이 투어의 현재 기록을 PDF에 담긴 기록으로 바꿔요. 현재 기록은
                  되돌릴 수 없어요.
                </p>
              )}
            </div>
          )}
        </section>
      )}
      <div className="bridal-note mt-5 flex gap-2 p-4 text-sm leading-6 text-ink-muted">
        <ShieldCheck className="shrink-0" size={18} />
        <span className="min-w-0 break-keep">
          파일은 이 기기 안에서만 읽고 기록은 현재 브라우저에 저장해요. 계정이나
          클라우드로 자동 동기화하지 않아요.
        </span>
      </div>
      <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 bridal-action-bar border-t pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          disabled={!file || !preview || busy}
          className={`h-14 w-full ${preview?.hasConflict && strategy === "overwrite" ? "rounded-control bg-error font-semibold text-white disabled:bg-stone-200" : "bridal-primary"}`}
          onClick={async () => {
            if (!preview) return;
            setBusy(true);
            setError(undefined);
            try {
              const mod = await import("../../lib/pdf/importPdf");
              const id = await mod.importPortablePreview(
                preview,
                preview.hasConflict ? strategy : "overwrite",
              );
              nav(`/tour/${id}`, { replace: true });
            } catch (e) {
              const message =
                e instanceof Error ? e.message : "복원에 실패했어요.";
              setError(message);
              toast(message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {preview?.hasConflict
            ? strategy === "overwrite"
              ? "기존 투어 덮어쓰기"
              : "새 투어로 추가"
            : "이 기록 가져오기"}
        </button>
      </div>
    </main>
  );
}
