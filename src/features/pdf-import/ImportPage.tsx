import { useState } from "react";
import { ArrowLeft, FileUp, ShieldCheck, TriangleAlert } from "lucide-react";
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
      const recovery = await import("../../lib/pdf/recoveryTrailer");
      const fastPreview = await recovery.inspectRecoveryTrailer(f);
      const p =
        fastPreview ??
        (await (await import("../../lib/pdf/importPdf")).inspectPortablePdf(f));
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
    <main className="min-h-dvh px-5 pb-28 pt-[calc(18px+env(safe-area-inset-top))]">
      <button
        aria-label="홈으로 돌아가기"
        className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
        onClick={() => nav("/")}
      >
        <ArrowLeft />
      </button>
      <p className="mt-8 text-xs font-semibold text-[#a75e55]">IMPORT PDF</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">
        다른 폰의 기록을
        <br />
        그대로 이어서 써요
      </h1>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        그드레스에서 내보낸 복원 가능한 PDF만 읽습니다. 일반 PDF는 분석하지
        않아요.
      </p>
      <label className="mt-7 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-stone-250 bg-white text-center">
        <FileUp size={26} className="text-[#b96e63]" />
        <div className="mt-3 font-semibold">
          {file ? file.name : "PDF 파일 선택"}
        </div>
        <div className="mt-1 text-xs text-stone-400">최대 30MB</div>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void inspect(f);
          }}
        />
      </label>
      {busy && (
        <div className="mt-5 text-center text-sm text-stone-400">
          복원 데이터를 확인하는 중...
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
            <p className="mt-1 text-xs leading-5">{error}</p>
            <p className="mt-2 text-xs leading-5 text-red-500">
              그드레스에서 ‘복원 가능한 PDF’로 저장한 원본 파일을 다시 선택해
              주세요.
            </p>
          </div>
        </div>
      )}
      {preview && (
        <section className="mt-6 rounded-3xl bg-[#faf7f5] p-5">
          <h2 className="text-xl font-black">{preview.payload.tour.title}</h2>
          <div className="mt-2 text-sm text-stone-400">
            {preview.payload.tour.tourDate || "날짜 없음"} · 샵{" "}
            {preview.shopCount} · 드레스 {preview.dressCount} · 후보{" "}
            {preview.favoriteCount}
          </div>
          <div className="mt-1 text-xs text-stone-300">
            내보낸 시각{" "}
            {new Date(preview.payload.exportedAt).toLocaleString("ko-KR")}
          </div>
          {preview.faceWarning && (
            <div className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">
              <TriangleAlert size={17} className="shrink-0" />
              {preview.faceWarning}
            </div>
          )}
          {preview.hasConflict && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-bold">
                이 기기에 같은 투어가 있어요
              </div>
              <label
                className={`mb-2 flex min-h-12 items-center gap-3 rounded-2xl border px-4 ${strategy === "copy" ? "border-[#b96e63] bg-[#fff2ee]" : "border-stone-200 bg-white"}`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === "copy"}
                  onChange={() => setStrategy("copy")}
                />
                복사본 만들기{" "}
                <span className="ml-auto text-xs text-stone-400">추천</span>
              </label>
              <label
                className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 ${strategy === "overwrite" ? "border-[#b96e63] bg-[#fff2ee]" : "border-stone-200 bg-white"}`}
              >
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === "overwrite"}
                  onChange={() => setStrategy("overwrite")}
                />
                기존 기록 덮어쓰기
              </label>
            </div>
          )}
        </section>
      )}
      <div className="mt-5 flex gap-2 rounded-2xl bg-[#fff2ee] p-4 text-xs leading-5 text-[#8b5750]">
        <ShieldCheck className="shrink-0" size={18} />
        <span>파일을 읽는 과정도 이 기기 안에서만 처리합니다.</span>
      </div>
      <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-100 bg-[#fffdfa]/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          disabled={!file || !preview || busy}
          className="h-14 w-full rounded-2xl bg-stone-900 font-bold text-white disabled:bg-stone-200"
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
          이 기록 불러오기
        </button>
      </div>
    </main>
  );
}
