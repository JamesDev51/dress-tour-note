import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createTour } from "../../db/repositories";
import { useUIStore } from "../../stores/uiStore";
const today = () => new Date().toLocaleDateString("sv-SE");
export function NewTourPage() {
  const nav = useNavigate();
  const [brideName, setBride] = useState("");
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const setSave = useUIStore((s) => s.setSaveStatus);
  const toast = useUIStore((s) => s.showToast);
  return (
    <main className="bridal-page bridal-content pb-28 pt-[calc(16px+env(safe-area-inset-top))]">
      <button
        className="bridal-icon-button grid h-11 w-11 place-items-center"
        onClick={() => nav(-1)}
        aria-label="뒤로"
      >
        <ArrowLeft />
      </button>
      <div className="mt-8">
        <p className="text-xs font-medium text-accent-copy">새 드레스투어</p>
        <h1 className="bridal-title mt-2">
          오늘 기록을
          <br />
          만들어볼까요?
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          모든 항목은 선택이에요. 바로 시작해도 돼요.
        </p>
      </div>
      <div className="mt-9 space-y-5">
        <label className="block text-sm font-medium">
          신부 이름 <span className="font-normal text-stone-300">선택</span>
          <input
            maxLength={30}
            value={brideName}
            onChange={(e) => setBride(e.target.value)}
            placeholder="예: 히똥"
            className="bridal-field mt-2 h-14 w-full rounded-control border px-4 focus:border-accent"
          />
        </label>
        <label className="block text-sm font-medium">
          투어 날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bridal-field mt-2 h-14 w-full rounded-control border px-4 focus:border-accent"
          />
        </label>
        <label className="block text-sm font-medium">
          투어 제목 <span className="font-normal text-stone-300">선택</span>
          <input
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="비워두면 자동으로 만들어요"
            className="bridal-field mt-2 h-14 w-full rounded-control border px-4 focus:border-accent"
          />
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </div>
      <div className="bridal-action-bar fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <button
          disabled={busy}
          className="bridal-primary h-14 w-full disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setError(undefined);
            setSave("saving");
            try {
              const id = await createTour({ brideName, tourDate: date, title });
              setSave("saved");
              nav(`/tour/${id}`, { replace: true });
            } catch (e) {
              const message =
                e instanceof Error
                  ? e.message
                  : "투어를 만들지 못했어요. 다시 시도해 주세요.";
              setSave("error");
              setError(message);
              toast(message);
            } finally {
              setBusy(false);
            }
          }}
        >
          투어 만들기
        </button>
      </div>
    </main>
  );
}
