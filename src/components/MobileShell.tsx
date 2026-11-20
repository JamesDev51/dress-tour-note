import { useState } from "react";
import { flushBeforeAppUpdate } from "../lib/storage/beforeAppUpdate";
import { Link, Outlet } from "react-router-dom";
import { useUIStore } from "../stores/uiStore";
import { useButtonPressFeedback } from "./useButtonPressFeedback";
export function MobileShell() {
  const pressRoot = useButtonPressFeedback();
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const toast = useUIStore((s) => s.toast);
  const updateAvailable = useUIStore((s) => s.pwaUpdateAvailable);
  const updateSW = useUIStore((s) => s.updateSW);
  return (
    <div className="app-root min-h-dvh text-ink">
      <div
        ref={pressRoot}
        inert={updating}
        tabIndex={-1}
        className="app-shell mx-auto min-h-dvh w-full max-w-[480px] shadow-sm focus:outline-none"
      >
        <Outlet />
      </div>
      {toast && (
        <div
          role="status"
          key={toast}
          className="motion-enter pointer-events-none fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(90vw,430px)] -translate-x-1/2 rounded-2xl bg-accent-copy px-4 py-3 text-sm text-white shadow-sm"
        >
          {toast}
        </div>
      )}
      {updateAvailable && (
        <div className="fixed left-1/2 top-3 z-50 flex w-[min(92vw,440px)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-rule bg-paper px-4 py-3 text-sm shadow-sm">
          <span>{updateError || "새 버전이 있어요."}</span>
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center font-semibold text-accent-dark"
            disabled={updating}
            onClick={async () => {
              if (updating || !updateSW) return;
              setUpdating(true);
              setUpdateError("");
              let reloadRequested = false;
              try {
                await flushBeforeAppUpdate();
                await updateSW();
                reloadRequested = true;
              } catch {
                setUpdateError("기록을 저장한 뒤 다시 시도해 주세요.");
              } finally {
                // Keep editing locked between skip-waiting and the actual reload.
                setUpdating(reloadRequested);
              }
            }}
          >
            {updating ? "저장 확인 중…" : "업데이트"}
          </button>
        </div>
      )}
    </div>
  );
}
export function BrandHeader({
  variant = "default",
}: {
  variant?: "default" | "bridal";
}) {
  return (
    <header
      className={`${variant === "bridal" ? "home-content" : "bridal-content"} home-header`}
    >
      <Link to="/" className="home-wordmark">
        드레스노트
      </Link>
      <Link to="/privacy" className="home-privacy-link">
        개인정보
      </Link>
    </header>
  );
}
