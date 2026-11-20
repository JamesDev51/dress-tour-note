import { OfflineStatus } from "../../components/OfflineStatus";
import { clearRecallDrafts } from "../../lib/storage/recallDraft";
import {
  ArrowLeft,
  Database,
  FileDown,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteAllData } from "../../db/repositories";
import { clearPreferences } from "../../lib/preferences";
import { clearAllCaches } from "../../lib/storage/persist";
import { useUIStore } from "../../stores/uiStore";
export function PrivacyPage() {
  const nav = useNavigate();
  const toast = useUIStore((s) => s.showToast);
  return (
    <main className="bridal-page bridal-content pb-12 pt-[calc(16px+env(safe-area-inset-top))]">
      <p className="mb-4 text-xl font-medium leading-7 tracking-[-0.03em]">
        드레스노트
      </p>
      <button
        aria-label="뒤로"
        className="bridal-icon-button grid place-items-center"
        onClick={() => nav(-1)}
      >
        <ArrowLeft />
      </button>
      <p className="mt-8 text-xs font-semibold text-accent-dark">
        기록과 개인정보
      </p>
      <h1 className="mt-2 bridal-title">기록은 내 브라우저에</h1>
      <div className="mt-7 space-y-5">
        <Info icon={<ShieldCheck />} title="서버 전송 없음">
          투어 기록은 현재 브라우저에만 저장해요. 계정, 클라우드, 다른 기기와
          자동으로 동기화하지 않아요.
        </Info>
        <Info icon={<Database />} title="브라우저 데이터 삭제에 주의">
          브라우저 데이터를 지우거나 앱 저장 공간을 정리하면 기록도 사라져요.
          기기를 바꾸거나 정리하기 전에 PDF로 백업해 주세요.
        </Info>
        <Info icon={<Database />} title="비공개 모드에서는 임시 저장">
          시크릿·비공개 모드에서는 창을 닫을 때 기록이 사라질 수 있어요. 오래
          남길 기록은 일반 브라우저에서 작성해 주세요.
        </Info>
        <Info icon={<FileDown />} title="다른 기기로 기록 옮기기">
          백업용 PDF를 새 기기에서 불러오면 기록을 이어서 편집할 수 있어요. 보기
          전용 PDF는 결과를 읽거나 공유할 때 사용해요.
        </Info>
      </div>
      <div className="bridal-note mt-6 p-4">
        <OfflineStatus />
      </div>
      <div className="mt-8 rounded-card border border-red-100 bg-error-surface p-5">
        <h2 className="bridal-section-title text-error">
          이 브라우저의 기록 전체 삭제
        </h2>
        <p className="mt-2 text-sm leading-6 text-error">
          이 브라우저의 기록, 화면 설정, 오프라인 캐시를 지워요. 기기에 따로
          저장한 PDF 파일은 삭제하지 않아요.
        </p>
        <button
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-error font-semibold text-white"
          onClick={async () => {
            if (
              !confirm(
                "이 브라우저의 모든 드레스노트 기록을 삭제할까요? 이 작업은 되돌릴 수 없어요.",
              )
            )
              return;
            await deleteAllData();
            clearPreferences();
            clearRecallDrafts();
            await clearAllCaches();
            toast("이 브라우저의 기록을 모두 삭제했어요.");
            nav("/", { replace: true });
          }}
        >
          <Trash2 size={17} />
          기록 전체 삭제
        </button>
      </div>
    </main>
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
    <div className="flex gap-3 border-b border-rule pb-5 last:border-0">
      <div className="grid h-10 w-8 shrink-0 place-items-center text-accent-copy">
        {icon}
      </div>
      <div>
        <div className="bridal-section-title">{title}</div>
        <p className="mt-1 text-sm leading-6 text-stone-400">{children}</p>
      </div>
    </div>
  );
}
