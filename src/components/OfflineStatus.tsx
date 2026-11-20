import { useEffect, useState } from "react";
import { CheckCircle2, Download, WifiOff } from "lucide-react";

export function OfflineStatus() {
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    let active = true;
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready
        .then(() => {
          if (active) setReady(true);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const Icon = !online ? WifiOff : ready ? CheckCircle2 : Download;
  return (
    <div
      className="flex items-start gap-2 text-xs leading-5 text-ink-muted"
      aria-live="polite"
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        {!online
          ? ready
            ? "오프라인 사용 중 · 기록은 이 기기에 저장해요."
            : "인터넷 연결 없음 · 이미 열린 기록은 이 기기에 저장해요."
          : ready
            ? "오프라인 사용 준비 완료 · 기기를 바꾸기 전 PDF로 백업해 주세요."
            : "처음에는 인터넷에 연결해 주세요. 오프라인 준비가 끝나면 알려드려요."}
      </span>
    </div>
  );
}
