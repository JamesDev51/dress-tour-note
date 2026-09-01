import { useState } from "react";
import {
  ArrowLeft,
  Database,
  FileDown,
  Palette,
  ShieldCheck,
  Trash2,
  Type,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteAllData } from "../../db/repositories";
import {
  clearPreferences,
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type AppFont,
  type AppTheme,
} from "../../lib/preferences";
import { clearAllCaches } from "../../lib/storage/persist";
import { useUIStore } from "../../stores/uiStore";
export function PrivacyPage() {
  const nav = useNavigate();
  const toast = useUIStore((s) => s.showToast);
  const [prefs, setPrefs] = useState(() => readPreferences());
  const setTheme = (theme: AppTheme) => {
    const next = { ...prefs, theme };
    setPrefs(next);
    writePreferences(next);
  };
  const setFont = (font: AppFont) => {
    const next = { ...prefs, font };
    setPrefs(next);
    writePreferences(next);
  };
  return (
    <main className="min-h-dvh px-5 pb-12 pt-[calc(18px+env(safe-area-inset-top))]">
      <button
        className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
        onClick={() => nav(-1)}
      >
        <ArrowLeft />
      </button>
      <p className="mt-8 text-xs font-semibold text-[#a75e55]">
        SETTINGS & PRIVACY
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">
        보기 편하게,
        <br />
        기록은 내 기기에만
      </h1>
      <section className="mt-7 rounded-3xl border border-stone-100 bg-white p-5">
        <div className="flex items-center gap-2 font-bold">
          <Palette size={18} className="text-[#a75e55]" />
          화면 테마
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Choice
            selected={prefs.theme === "cream"}
            onClick={() => setTheme("cream")}
            title="크림"
            subtitle="따뜻한 웨딩 톤"
          />
          <Choice
            selected={prefs.theme === "clean"}
            onClick={() => setTheme("clean")}
            title="클린"
            subtitle="밝은 흰 배경"
          />
        </div>
        <div className="mt-6 flex items-center gap-2 font-bold">
          <Type size={18} className="text-[#a75e55]" />
          글꼴
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Choice
            selected={prefs.font === "sans"}
            onClick={() => setFont("sans")}
            title="고딕"
            subtitle="빠르게 읽기"
          />
          <Choice
            selected={prefs.font === "serif"}
            onClick={() => setFont("serif")}
            title="명조"
            subtitle="차분한 기록 느낌"
            serif
          />
        </div>
      </section>
      <div className="mt-7 space-y-3">
        <Info icon={<ShieldCheck />} title="서버 전송 없음">
          사진, 메모, 드레스 선택값, PDF를 서버에 업로드하지 않습니다.
        </Info>
        <Info icon={<Database />} title="브라우저에 자동 저장">
          기록은 IndexedDB에 저장됩니다. 브라우저 데이터를 직접 삭제하면 함께
          사라질 수 있습니다.
        </Info>
        <Info icon={<FileDown />} title="PDF가 이동용 백업">
          투어 후 복원 가능한 PDF를 저장하면 다른 기기에서 그대로 이어서 편집할
          수 있습니다.
        </Info>
      </div>
      <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-5">
        <h2 className="font-bold text-red-800">이 기기의 기록 전체 삭제</h2>
        <p className="mt-2 text-xs leading-5 text-red-600">
          앱의 IndexedDB, 화면 설정, 오프라인 캐시를 지웁니다. 이미 저장한 PDF
          파일은 삭제되지 않습니다.
        </p>
        <button
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-bold text-white"
          onClick={async () => {
            if (
              !confirm(
                "이 기기의 모든 그드레스 기록을 삭제할까요? 이 작업은 되돌릴 수 없어요.",
              )
            )
              return;
            await deleteAllData();
            clearPreferences();
            setPrefs(DEFAULT_PREFERENCES);
            await clearAllCaches();
            toast("이 기기의 기록을 모두 삭제했어요.");
            nav("/", { replace: true });
          }}
        >
          <Trash2 size={17} />
          전체 데이터 삭제
        </button>
      </div>
    </main>
  );
}
function Choice({
  selected,
  onClick,
  title,
  subtitle,
  serif = false,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  serif?: boolean;
}) {
  return (
    <button
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-20 rounded-2xl border p-3 text-left ${selected ? "border-[#b96e63] bg-[#fff2ee]" : "border-stone-200 bg-stone-50"}`}
    >
      <div className={`font-bold ${serif ? "font-serif" : ""}`}>{title}</div>
      <div className="mt-1 text-[11px] text-stone-400">{subtitle}</div>
    </button>
  );
}
function Info({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-3xl bg-[#faf7f5] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#a75e55]">
        {icon}
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <p className="mt-1 text-xs leading-5 text-stone-400">{children}</p>
      </div>
    </div>
  );
}
