import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck2,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../db/database";
import type { Dress, Tour } from "../../types/domain";
import type { ExportProgress, PdfExportMode } from "../../types/portable";
import { useUIStore } from "../../stores/uiStore";

type ExportData = {
  tour: Tour;
  shopCount: number;
  dresses: Dress[];
};

type GeneratedExport = {
  blob: Blob;
  filename: string;
  title: string;
  mode: PdfExportMode;
};

export function ExportPage() {
  const { tourId = "" } = useParams();
  const nav = useNavigate();
  const toast = useUIStore((s) => s.showToast);
  const [mode, setMode] = useState<PdfExportMode>("portable");
  const [progress, setProgress] = useState<ExportProgress>();
  const [generated, setGenerated] = useState<GeneratedExport>();
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ExportData>();
  const [loadError, setLoadError] = useState<string>();
  const [loadKey, setLoadKey] = useState(0);
  const generationRevision = useRef(0);
  const busyRef = useRef(false);
  useEffect(() => {
    let active = true;
    generationRevision.current += 1;
    busyRef.current = false;
    setBusy(false);
    setGenerated(undefined);
    setProgress(undefined);
    setData(undefined);
    setLoadError(undefined);
    void (async () => {
      try {
        const tour = await db.tours.get(tourId);
        if (!tour)
          throw new Error("이 브라우저에서 투어 기록을 찾을 수 없어요.");
        const [shopCount, dresses] = await Promise.all([
          db.shops.where("tourId").equals(tourId).count(),
          db.dresses.where("tourId").equals(tourId).toArray(),
        ]);
        if (active) setData({ tour, shopCount, dresses });
      } catch (e) {
        if (active)
          setLoadError(
            e instanceof Error ? e.message : "내보낼 기록을 불러오지 못했어요.",
          );
      }
    })();
    return () => {
      active = false;
      generationRevision.current += 1;
    };
  }, [tourId, loadKey]);
  if (loadError)
    return (
      <main className="bridal-page bridal-content pt-[calc(16px+env(safe-area-inset-top))]">
        <button
          aria-label="뒤로"
          className="bridal-icon-button grid place-items-center"
          onClick={() => nav(-1)}
        >
          <ArrowLeft />
        </button>
        <div
          role="alert"
          className="mt-10 rounded-3xl bg-red-50 p-5 text-red-700"
        >
          <TriangleAlert />
          <h1 className="mt-3 text-lg font-medium">
            PDF 준비를 시작하지 못했어요.
          </h1>
          <p className="mt-2 text-sm leading-6">{loadError}</p>
        </div>
        <button
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 bridal-primary"
          onClick={() => setLoadKey((k) => k + 1)}
        >
          <RefreshCw size={17} />
          다시 불러오기
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="bridal-page bridal-content pt-[calc(16px+env(safe-area-inset-top))]">
        <button
          aria-label="뒤로"
          className="bridal-icon-button grid place-items-center"
          onClick={() => nav(-1)}
        >
          <ArrowLeft />
        </button>
        <div role="status" className="mt-16 text-center text-sm text-stone-400">
          내보내기 준비 중...
        </div>
      </main>
    );
  const reset = () => {
    generationRevision.current += 1;
    setGenerated(undefined);
    setProgress(undefined);
  };
  return (
    <main className="bridal-page bridal-content pb-36 pt-[calc(16px+env(safe-area-inset-top))]">
      <button
        aria-label="뒤로"
        className="bridal-icon-button grid place-items-center"
        onClick={() => nav(-1)}
      >
        <ArrowLeft />
      </button>
      <p className="mt-8 text-xs font-semibold text-accent-dark">PDF 저장</p>
      <h1 className="mt-2 bridal-title">PDF로 저장하기</h1>
      <section
        aria-label="PDF로 다른 폰에 기록 옮기기"
        className="bridal-note motion-enter mt-6 p-4"
      >
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-xs leading-5 text-ink-muted">
          <div className="min-w-0 break-keep">
            <Smartphone className="mx-auto mb-2 text-accent-copy" size={24} />이
            폰의 기록
          </div>
          <ArrowRight aria-hidden="true" size={14} />
          <div className="min-w-0 break-keep">
            <FileCheck2 className="mx-auto mb-2 text-accent-copy" size={24} />
            백업용 PDF
          </div>
          <ArrowRight aria-hidden="true" size={14} />
          <div className="min-w-0 break-keep">
            <Smartphone className="mx-auto mb-2 text-accent-copy" size={24} />
            다른 폰
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-muted">
          파일을 옮긴 뒤 다른 폰의 드레스노트에서 ‘PDF 가져오기’를 눌러주세요.
        </p>
      </section>
      <div className="mt-7 grid gap-2">
        <button
          disabled={busy}
          aria-pressed={mode === "portable"}
          className={`rounded-card border p-4 text-left disabled:cursor-wait disabled:opacity-60 ${mode === "portable" ? "border-accent bg-accent-soft" : "border-rule bg-white"}`}
          onClick={() => {
            if (busyRef.current) return;
            setMode("portable");
            reset();
          }}
        >
          <div className="font-semibold">
            백업용 PDF{" "}
            <span className="ml-1 text-xs text-accent-copy">추천</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-400">
            이 기기나 다른 기기에서 다시 불러와 편집할 수 있는 백업이에요.
          </p>
        </button>
        <button
          disabled={busy}
          aria-pressed={mode === "viewOnly"}
          className={`rounded-card border p-4 text-left disabled:cursor-wait disabled:opacity-60 ${mode === "viewOnly" ? "border-accent bg-accent-soft" : "border-rule bg-white"}`}
          onClick={() => {
            if (busyRef.current) return;
            setMode("viewOnly");
            reset();
          }}
        >
          <div className="font-semibold">보기 전용 PDF</div>
          <p className="mt-1 text-sm leading-6 text-stone-400">
            보여주기 위한 결과표예요. 복원에 필요한 원본 데이터는 포함하지
            않아요.
          </p>
        </button>
      </div>
      <div className="bridal-surface mt-5 p-5">
        <div className="font-semibold">{data.tour.title}</div>
        <div className="mt-2 text-sm text-stone-400">
          샵 {data.shopCount} · 드레스 {data.dresses.length} · 후보{" "}
          {data.dresses.filter((d) => d.isFavorite).length}
        </div>
        <div className="mt-1 text-xs text-stone-300">
          최소{" "}
          {1 +
            data.dresses.reduce(
              (count, dress) =>
                count + 1 + (dress.stylingVariants?.length ?? 0),
              0,
            ) *
              2 +
            data.dresses.filter((d) => d.isFavorite).length}
          페이지 · 상세 기록 길이에 따라 늘어나요
        </div>
        {data.dresses.some((dress) => dress.stylingVariants?.length) && (
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            기본 연출과 추가 연출을 모두 담아요. 후보 요약에는 대표 연출이
            표시돼요.
          </p>
        )}
      </div>
      {busy && (
        <p role="status" className="mt-4 text-sm leading-6 text-ink-muted">
          선택한 설정으로 PDF를 만들고 있어요. 설정을 바꾸려면 준비가 끝난 뒤
          다시 만들어주세요.
        </p>
      )}
      <div className="bridal-note mt-5 flex gap-2 p-4 text-sm leading-6 text-ink-muted">
        <ShieldCheck className="shrink-0" size={18} />
        <span>
          PDF는 이 기기 안에서 만들어요. 기록을 서버로 보내거나 다른 기기와
          자동으로 동기화하지 않아요.
        </span>
      </div>
      {progress && (
        <div className="mt-7">
          <div className="flex items-center justify-between text-sm">
            <span>{progress.label}</span>
            <span className="text-stone-400">{progress.percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-accent transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}
      {generated && (
        <div
          role="status"
          className="motion-enter mt-6 rounded-2xl bg-accent-soft p-4 text-sm text-accent-copy"
        >
          <p className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            PDF가 준비됐어요.
          </p>
          <p className="mt-2 text-xs leading-5">
            {generated.mode === "portable" ? "백업용 PDF" : "보기 전용 PDF"}.
            아래에서 파일을 저장하거나 공유해 주세요.
          </p>
        </div>
      )}
      <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 bridal-action-bar border-t pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {!generated ? (
          <button
            disabled={busy || !data.dresses.length}
            className="h-14 w-full bridal-primary"
            onClick={async () => {
              if (busyRef.current) return;
              busyRef.current = true;
              setBusy(true);
              const revision = ++generationRevision.current;
              const options = {
                mode,
              };
              const title = data.tour.title.trim() || "드레스 투어";
              const filename = `${title.replace(/[\\/:*?"<>|]/g, "_")}${options.mode === "viewOnly" ? "_보기용" : ""}.pdf`;
              try {
                const mod = await import("../../lib/pdf/exportPdf");
                const out = await mod.exportPortablePdf(
                  tourId,
                  options,
                  (next) => {
                    if (revision === generationRevision.current)
                      setProgress(next);
                  },
                );
                if (revision === generationRevision.current) {
                  setGenerated({ blob: out, filename, title, ...options });
                }
              } catch (e) {
                if (revision === generationRevision.current) {
                  toast(
                    e instanceof Error && e.name !== "ZodError"
                      ? e.message
                      : "기록 이름과 내용을 확인한 뒤 PDF를 다시 만들어 주세요.",
                  );
                  setProgress(undefined);
                }
              } finally {
                if (revision === generationRevision.current) {
                  busyRef.current = false;
                  setBusy(false);
                }
              }
            }}
          >
            {busy
              ? "PDF 만드는 중..."
              : mode === "portable"
                ? "백업용 PDF 만들기"
                : "보기 전용 PDF 만들기"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex h-14 items-center justify-center gap-2 bridal-secondary"
              onClick={async () => {
                const mod = await import("../../lib/pdf/exportPdf");
                try {
                  const shared = await mod.shareBlob(
                    generated.blob,
                    generated.filename,
                    generated.title,
                  );
                  if (!shared) {
                    mod.downloadBlob(generated.blob, generated.filename);
                    toast(
                      "파일 공유를 지원하지 않아 PDF 다운로드를 시작했어요.",
                    );
                  }
                } catch (e) {
                  if (e instanceof DOMException && e.name === "AbortError")
                    return;
                  toast("공유하지 못했어요. 파일 저장을 이용해 주세요.");
                }
              }}
            >
              <Send size={18} />
              공유
            </button>
            <button
              className="flex h-14 items-center justify-center gap-2 bridal-primary"
              onClick={async () => {
                const mod = await import("../../lib/pdf/exportPdf");
                mod.downloadBlob(generated.blob, generated.filename);
              }}
            >
              <Download size={18} />
              저장
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
