import {
  acknowledgeRecallDraft,
  readRecallDraft,
} from "../../lib/storage/recallDraft";
import { useCallback, useState } from "react";
import { useDressEditorData } from "./useDressEditorData";
import { useNavigate, useParams } from "react-router-dom";
import { RecallDressDetail } from "../../components/RecallDressDetail";
import { DressPreview } from "../../components/DressPreview";
import {
  addDress,
  patchDress,
  removeFaceAsset,
  setFaceAsset,
} from "../../db/repositories";
import { processFaceFile } from "../../lib/image/processFace";
import { useUIStore } from "../../stores/uiStore";
import {
  DEFAULT_FACE_TRANSFORM,
  type Dress,
  type DressOptionCategory,
} from "../../types/domain";
import { DressRecallNotes } from "./DressRecallNotes";
import { DressDetailsPanel } from "./DressDetailsPanel";
import { DressEditorHeader } from "./DressEditorHeader";
import { FastRecordFlow } from "./FastRecordFlow";
import { useDressEditorDraft } from "./useDressEditorDraft";
import { usePendingWrites } from "./usePendingWrites";

export function DressEditorPage() {
  const { tourId = "", dressId = "" } = useParams();
  const nav = useNavigate();
  const setSave = useUIStore((state) => state.setSaveStatus);
  const toast = useUIStore((state) => state.showToast);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [includeFace, setIncludeFace] = useState(false);
  const { run, waitForPending } = usePendingWrites();
  const data = useDressEditorData(dressId);
  const currentData = data?.dress.id === dressId ? data : undefined;
  const writeDress = useCallback(
    (id: string, patch: Partial<Dress>) => run(() => patchDress(id, patch)),
    [run],
  );
  const draft = useDressEditorDraft({
    dressId,
    dress: currentData?.dress,
    face: currentData?.face,
    onSaveStatus: setSave,
    writeDress,
  });
  const {
    recall,
    latestRecall,
    updateRecall,
    memo,
    setMemo,
    label,
    setLabel,
    transform,
    latestMemo,
    latestLabel,
    latestTransform,
    hasFace,
    updateTransform,
    flushTransform,
  } = draft;

  if (!currentData?.dress || !currentData.tour) {
    return (
      <main className="p-8 text-center text-sm text-stone-400">
        드레스를 불러오는 중...
      </main>
    );
  }
  const dress = currentData.dress;

  const persist = async (patch: Partial<Dress>, message?: string) => {
    setSave("saving");
    try {
      await writeDress(dressId, patch);
      setSave("saved");
      if (message) toast(message);
    } catch (error) {
      setSave("error");
      throw error;
    }
  };
  const safelyPersist = async (patch: Partial<Dress>, message?: string) => {
    try {
      await persist(patch, message);
    } catch {
      toast("저장하지 못했어요. 다시 시도해 주세요.");
    }
  };
  const saveCustomOption = (category: DressOptionCategory, value: string) =>
    void safelyPersist({
      customOptions: {
        [category]: value || undefined,
      },
    });
  const saveDraft = async () => {
    const pendingRecall = readRecallDraft(dressId);
    await persist({
      memo: latestMemo.current,
      ...latestRecall.current,
      label: latestLabel.current.trim() || dress.label,
      ...(currentData.face ? { faceTransform: latestTransform.current } : {}),
    });
    if (pendingRecall) acknowledgeRecallDraft(dressId, pendingRecall.revision);
  };
  const goBack = async () => {
    try {
      await waitForPending();
      await saveDraft();
      nav(`/tour/${tourId}/shop/${dress.shopId}`);
    } catch {
      toast("저장하지 못했어요. 다시 시도해 주세요.");
    }
  };
  const addNextDress = async () => {
    await waitForPending();
    await saveDraft();
    const next = await run(() => addDress(dress.shopId));
    nav(`/tour/${tourId}/dress/${next}`, { replace: true });
  };
  const removeFace = async () => {
    hasFace.current = false;
    setIncludeFace(false);
    await run(() => removeFaceAsset(tourId));
    toast("얼굴 사진을 삭제했어요.");
  };
  const uploadFace = async (file: File) => {
    try {
      setSave("saving");
      const asset = await processFaceFile(file);
      await run(() => setFaceAsset(tourId, asset));
      hasFace.current = true;
      setSave("saved");
      toast("얼굴 사진을 저장했어요.");
    } catch (error) {
      setSave("error");
      toast(
        error instanceof Error ? error.message : "사진을 처리하지 못했어요.",
      );
    }
  };
  const resetFace = () => {
    updateTransform(DEFAULT_FACE_TRANSFORM);
    void safelyPersist({ faceTransform: DEFAULT_FACE_TRANSFORM });
  };
  const changeLabel = (value: string) => {
    setLabel(value);
    latestLabel.current = value;
  };

  const recallEditor = (
    <DressRecallNotes
      values={recall}
      onChange={updateRecall}
      onBlur={() =>
        void saveDraft().catch(() =>
          toast("저장하지 못했어요. 다시 시도해 주세요."),
        )
      }
    />
  );

  return (
    <main className="min-h-dvh">
      <DressEditorHeader
        label={label}
        isFavorite={dress.isFavorite}
        onBack={goBack}
        onLabelChange={changeLabel}
        onLabelBlur={() =>
          safelyPersist({ label: label.trim() || dress.label })
        }
        onToggleFavorite={() =>
          safelyPersist({ isFavorite: !dress.isFavorite })
        }
      />
      {detailsOpen && (
        <div className="px-5 pt-4">
          <DressPreview
            dress={{ ...dress, faceTransform: transform }}
            mode="visual"
            faceAsset={currentData.face}
            includeFace={detailsOpen && includeFace}
            className="mx-auto aspect-[9/16] max-h-[34dvh] w-auto"
          />
        </div>
      )}
      {detailsOpen ? (
        <>
          <div className="px-5">{recallEditor}</div>
          <DressDetailsPanel
            dress={dress}
            memo={memo}
            transform={transform}
            face={currentData.face}
            includeFace={includeFace}
            onPatch={safelyPersist}
            onCustomCommit={saveCustomOption}
            onMemoChange={(value) => {
              setMemo(value);
              latestMemo.current = value;
            }}
            onMemoBlur={() => void safelyPersist({ memo: latestMemo.current })}
            onRemoveFace={removeFace}
            onUploadFace={uploadFace}
            onIncludeFaceChange={setIncludeFace}
            onTransformPatch={updateTransform}
            onTransformCommit={flushTransform}
            onResetFace={resetFace}
            onClose={() => {
              setIncludeFace(false);
              setDetailsOpen(false);
            }}
          />
        </>
      ) : (
        <FastRecordFlow
          dress={dress}
          recallEditor={recallEditor}
          corePreview={
            <DressPreview
              dress={dress}
              mode="visual"
              className="mx-auto mt-6 max-w-40"
            />
          }
          renderSummary={(onEditCore) => (
            <RecallDressDetail
              dress={dress}
              shopName={currentData.shop?.name}
              onEditCore={onEditCore}
              onOpenDetails={() => setDetailsOpen(true)}
            />
          )}
          onPatch={persist}
          onComplete={addNextDress}
          onOpenDetails={() => setDetailsOpen(true)}
        />
      )}
    </main>
  );
}
