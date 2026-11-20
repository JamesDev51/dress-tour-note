import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MissingRecord } from "../../components/RecordRecovery";
import { RecallDressDetail } from "../../components/RecallDressDetail";
import { DressPreview } from "../../components/DressPreview";
import {
  getPreferredStylingId,
  isDressLook,
  resolveDressLook,
} from "../../lib/dress/styling";
import { useDressEditorData } from "./useDressEditorData";
import { useDressEditorSession } from "./useDressEditorSession";
import { DressRecallNotes } from "./DressRecallNotes";
import { DressDetailsPanel } from "./DressDetailsPanel";
import { DressEditorHeader } from "./DressEditorHeader";
import { DressFeedbackSection } from "./DressFeedbackSection";
import { DressStylingControls } from "./DressStylingControls";
import {
  DressAdjustmentPanel,
  type DressAdjustment,
} from "./DressAdjustmentPanel";
import { FastRecordFlow } from "./FastRecordFlow";
import { DressPreviewButton } from "./DressPreviewDialog";
import type { Dress } from "../../types/domain";

type EditorData = NonNullable<ReturnType<typeof useDressEditorData>>;
type Panel = DressAdjustment | "details" | null;

export function DressEditorPage() {
  const { tourId = "", dressId = "" } = useParams();
  const [params] = useSearchParams();
  const data = useDressEditorData(dressId);
  if (data === null || (data && data.dress.tourId !== tourId)) {
    return <MissingRecord to={"/tour/" + tourId} label="투어로 돌아가기" />;
  }
  if (!data || data.dress.id !== dressId) {
    return (
      <main className="bridal-page p-8 text-center text-sm text-ink-muted">
        드레스를 불러오는 중...
      </main>
    );
  }
  const lookId = params.get("look") ?? getPreferredStylingId(data.dress);
  if (!isDressLook(data.dress, lookId)) {
    return (
      <MissingRecord
        to={"/tour/" + tourId + "/dress/" + dressId + "?view=record&look=base"}
        label="기본 연출로 돌아가기"
      />
    );
  }
  return (
    <DressEditorSession
      key={dressId + ":" + lookId}
      data={data}
      lookId={lookId}
    />
  );
}

function DressEditorSession({
  data,
  lookId,
}: {
  data: EditorData;
  lookId: string;
}) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const savedDress = useMemo(
    () => resolveDressLook(data.dress, lookId),
    [data.dress, lookId],
  );
  const session = useDressEditorSession(savedDress, lookId);
  const { draft, dress } = session;
  const initialPanel = params.get("adjust");
  const [panel, setPanel] = useState<Panel>(
    initialPanel === "top" || initialPanel === "neckline" ? initialPanel : null,
  );
  const returnPoint = useRef<{ top: number; focus: HTMLElement | null } | null>(
    null,
  );
  const panelRoot = useRef<HTMLDivElement>(null);
  const editView = params.get("view") === "edit";
  const recordView =
    params.get("view") === "record" ||
    (!editView && Boolean(dress.coreRecordedAt));
  useLayoutEffect(() => {
    if (recordView) window.scrollTo({ top: 0, behavior: "auto" });
  }, [recordView]);
  const lookLabel = data.dress.stylingVariants?.length
    ? session.lookName
    : undefined;
  const openPanel = (next: Panel) => {
    if (!panel) {
      returnPoint.current = {
        top: window.scrollY,
        focus:
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
      };
    }
    setPanel(next);
  };
  useLayoutEffect(() => {
    if (panel) {
      window.scrollTo({ top: 0, behavior: "auto" });
      panelRoot.current
        ?.querySelector<HTMLElement>("button, input, select, textarea")
        ?.focus({ preventScroll: true });
    } else if (returnPoint.current) {
      window.scrollTo({ top: returnPoint.current.top, behavior: "auto" });
      returnPoint.current.focus?.focus({ preventScroll: true });
      returnPoint.current = null;
    }
  }, [panel]);
  // Both panels edit the same mounted session; pending saves survive this switch.
  const closePanel = () => {
    setPanel(null);
    if (params.has("adjust")) nav(session.recordUrl(), { replace: true });
  };
  const changeLabel = (value: string) => {
    draft.setLabel(value);
    draft.latestLabel.current = value;
  };
  const onRecallBlur = () => {
    void session.saveDraft().catch(() => undefined);
  };
  const memoryEditor = (
    <DressRecallNotes
      values={draft.recall}
      onChange={draft.updateRecall}
      onBlur={onRecallBlur}
      fields={["memoryCue"]}
      compact
    />
  );
  const recallEditor = (
    <DressRecallNotes
      values={draft.recall}
      onChange={draft.updateRecall}
      onBlur={onRecallBlur}
    />
  );
  const feedback = (
    <details className="mt-5 rounded-card border border-rule p-3">
      <summary className="min-h-11 py-2 font-semibold">
        느낌·평가 남기기 · 선택
      </summary>
      {lookLabel && (
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          별점과 후보는 이 드레스의 모든 연출에 공통이에요.
        </p>
      )}
      <DressRecallNotes
        values={draft.recall}
        onChange={draft.updateRecall}
        onBlur={onRecallBlur}
        fields={["likedReason", "concern"]}
      />
      <DressFeedbackSection
        dress={dress}
        memo={draft.memo}
        onPatch={session.safelyPersist}
        onMemoChange={draft.setMemo}
        onMemoBlur={onRecallBlur}
      />
    </details>
  );
  const summary = (onEdit: () => void) => (
    <>
      <RecallDressDetail
        dress={dress}
        stylingLabel={lookLabel}
        showDetailsAction={false}
        shopName={data.shop?.name}
        onEditCore={onEdit}
        onOpenDetails={() => openPanel("details")}
        feedbackEditor={feedback}
        memoryEditor={memoryEditor}
        lookControls={
          <DressStylingControls
            dress={data.dress}
            lookId={lookId}
            busy={session.busy}
            onSwitch={session.switchLook}
            name={session.lookName}
            onNameChange={session.changeLookName}
            onNameBlur={() =>
              void session.saveLookName().catch(() => undefined)
            }
            onDelete={session.deleteLook}
            onPrefer={session.preferLook}
          />
        }
        adjustmentControls={
          <div className="grid grid-cols-2 gap-2 bridal-content pt-4">
            <button
              type="button"
              onClick={() => openPanel("neckline")}
              className="min-h-11 rounded-control border border-rule px-2 text-sm"
            >
              목·가슴선 수정
            </button>
            <button
              type="button"
              onClick={() => openPanel("top")}
              className="min-h-11 rounded-control border border-rule px-2 text-sm"
            >
              끈·소매 수정
            </button>
          </div>
        }
      />
      <div className="h-[calc(10rem+env(safe-area-inset-bottom))]">
        <div
          className="bridal-action-bar fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-rule pb-[calc(12px+env(safe-area-inset-bottom))] pt-3"
          aria-label="다음 드레스 기록"
        >
          <button
            type="button"
            onClick={() => void session.nextDress().catch(() => undefined)}
            className="min-h-12 w-full rounded-control bridal-primary px-4 font-semibold text-white"
          >
            다음 드레스 기록
          </button>
        </div>
      </div>
    </>
  );

  return (
    <main
      className={
        session.error
          ? "bridal-page pb-[calc(7rem+env(safe-area-inset-bottom))]"
          : "bridal-page"
      }
    >
      <fieldset disabled={session.busy} className="min-w-0">
        <legend className="sr-only">드레스 기록 편집</legend>
        <DressEditorHeader
          label={draft.label}
          isFavorite={dress.isFavorite}
          onBack={session.goBack}
          onLabelChange={changeLabel}
          onLabelBlur={() =>
            session.safelyPersist({ label: draft.label.trim() || dress.label })
          }
          onToggleFavorite={() =>
            session.safelyPersist({ isFavorite: !dress.isFavorite })
          }
        />
        <nav
          aria-label="기록 보기와 추가 입력"
          className="bridal-content bridal-tabs core-details-nav sticky top-[calc(68px+env(safe-area-inset-top))] z-10 grid grid-cols-2 gap-2 border-b border-rule bg-paper/95 py-2 backdrop-blur"
        >
          <button
            type="button"
            aria-pressed={!panel || panel === "top" || panel === "neckline"}
            onClick={() => {
              if (panel) closePanel();
            }}
            className="min-h-11 rounded-control border border-rule px-2 text-sm font-semibold aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-copy"
          >
            기본 기록
          </button>
          <button
            type="button"
            aria-pressed={panel === "details"}
            onClick={() => (panel ? closePanel() : openPanel("details"))}
            className="min-h-11 rounded-control border border-rule px-2 text-sm"
          >
            {panel ? "기록으로" : "자세히 기록"}
          </button>
        </nav>
        <div hidden={Boolean(panel)} aria-hidden={Boolean(panel)}>
          {recordView ? (
            summary(() =>
              nav(session.recordUrl(lookId, "edit"), { replace: true }),
            )
          ) : (
            <FastRecordFlow
              dress={savedDress}
              sessionChoices={session.pendingChoices}
              identityKey={dress.id + ":" + lookId}
              saveBlocked={Boolean(session.error)}
              initialView={editView ? "steps" : undefined}
              corePreview={
                dress.silhouette === "unknown" &&
                dress.topStyle === "unknown" &&
                dress.neckline === "unknown" &&
                dress.fabric === "unknown" ? (
                  <p className="bridal-note px-4 py-5 text-sm text-ink-muted">
                    아래에서 모양을 고르면 드레스 그림이 나타나요.
                  </p>
                ) : (
                  <DressPreview
                    dress={dress}
                    mode="visual"
                    className="w-full"
                  />
                )
              }
              renderSummary={summary}
              onPatch={session.persist}
              onComplete={session.nextDress}
              onFinishAndView={session.finishAndView}
              onOpenDetails={() => openPanel("details")}
              showDetailsAction={false}
            />
          )}
        </div>
        {panel && (
          <div ref={panelRoot}>
            {panel !== "details" ? (
              <DressAdjustmentPanel
                key={panel}
                category={panel}
                stylingLabel={lookLabel}
                dress={dress}
                onPatch={session.persist}
                onCustomCommit={session.saveCustomOption}
                onClose={closePanel}
              />
            ) : (
              <>
                <div className="bridal-content pt-4">
                  <p className="mb-3 text-sm text-ink-muted">
                    {dress.label}
                    {lookLabel && ` · ${lookLabel}`}
                  </p>
                  <DressPreviewButton
                    preview={
                      <DressPreview
                        dress={dress}
                        mode="visual"
                        className="w-full"
                      />
                    }
                  />
                  {recallEditor}
                </div>
                <DressDetailsPanel
                  dress={dress}
                  memo={draft.memo}
                  onPatch={session.persist}
                  onCustomCommit={session.saveCustomOption}
                  onMemoChange={draft.setMemo}
                  onMemoBlur={onRecallBlur}
                  onClose={closePanel}
                />
              </>
            )}
          </div>
        )}
      </fieldset>
      {recordView && !panel && (
        <DressPreviewButton
          sketch={
            dress.coreRecordedAt
              ? { dress, onSave: session.saveSketch }
              : undefined
          }
          preview={
            <DressPreview dress={dress} mode="visual" className="w-full" />
          }
        />
      )}
      {session.error && (
        <div
          role="alert"
          className="mx-6 my-4 rounded-control bg-error-surface p-4 text-sm text-error"
        >
          <p>{session.error}</p>
          <button
            type="button"
            disabled={session.busy}
            onClick={session.retry}
            className="mt-2 min-h-11 font-semibold underline"
          >
            저장 다시 시도
          </button>
        </div>
      )}
    </main>
  );
}
