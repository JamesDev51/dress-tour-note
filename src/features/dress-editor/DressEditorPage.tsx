import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, useParams } from "react-router-dom";
import { DressPreview } from "../../components/DressPreview";
import { db } from "../../db/database";
import {
  addDress,
  patchDress,
  removeFaceAsset,
  setFaceAsset,
} from "../../db/repositories";
import {
  colorOptions,
  dressForPresentation,
  fabricOptions,
  necklineOptions,
  silhouetteOptions,
  topStyleOptions,
} from "../../lib/dress/options";
import { processFaceFile } from "../../lib/image/processFace";
import { DEFAULT_FACE_TRANSFORM, type Dress } from "../../types/domain";
import { useUIStore } from "../../stores/uiStore";
import { DressEditorFooter } from "./DressEditorFooter";
import { DressEditorHeader } from "./DressEditorHeader";
import { DressFaceSection } from "./DressFaceSection";
import { DressFeedbackSection } from "./DressFeedbackSection";
import { DressOptionSection } from "./DressOptionSection";
import { useDressEditorDraft } from "./useDressEditorDraft";

export function DressEditorPage() {
  const { tourId = "", dressId = "" } = useParams();
  const nav = useNavigate();
  const setSave = useUIStore((s) => s.setSaveStatus);
  const toast = useUIStore((s) => s.showToast);
  const data = useLiveQuery(async () => {
    const dress = await db.dresses.get(dressId);
    if (!dress) return undefined;
    const tour = await db.tours.get(dress.tourId);
    const face = tour?.faceAssetId
      ? await db.assets.get(tour.faceAssetId)
      : undefined;
    return { dress, tour, face };
  }, [dressId]);
  const draft = useDressEditorDraft({
    dressId,
    dress: data?.dress,
    face: data?.face,
    onSaveStatus: setSave,
  });
  const {
    memo,
    setMemo,
    label,
    setLabel,
    transform,
    setTransform,
    latestMemo,
    latestLabel,
    latestTransform,
    hasFace,
    updateTransform,
    flushTransform,
  } = draft;
  if (!data?.dress || !data.tour)
    return (
      <main className="p-8 text-center text-sm text-stone-400">
        드레스를 불러오는 중...
      </main>
    );
  const d = data.dress;
  const presented = dressForPresentation(d);
  const immediate = async (patch: Partial<Dress>, message?: string) => {
    setSave("saving");
    try {
      await patchDress(dressId, patch);
      setSave("saved");
      if (message) toast(message);
    } catch {
      setSave("error");
    }
  };
  const removeFace = async () => {
    hasFace.current = false;
    await removeFaceAsset(tourId);
    toast("얼굴 사진을 삭제했어요.");
  };
  const uploadFace = async (file: File) => {
    try {
      setSave("saving");
      const asset = await processFaceFile(file);
      await setFaceAsset(tourId, asset);
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
    latestTransform.current = DEFAULT_FACE_TRANSFORM;
    setTransform(DEFAULT_FACE_TRANSFORM);
    void patchDress(dressId, { faceTransform: DEFAULT_FACE_TRANSFORM });
  };
  const saveDraft = () =>
    patchDress(dressId, {
      memo: latestMemo.current,
      label: latestLabel.current.trim() || d.label,
      ...(data.face ? { faceTransform: latestTransform.current } : {}),
    });
  const goBack = async () => {
    await saveDraft();
    nav(`/tour/${tourId}/shop/${d.shopId}`);
  };
  const addNextDress = async () => {
    await saveDraft();
    const next = await addDress(d.shopId);
    nav(`/tour/${tourId}/dress/${next}`, { replace: true });
  };
  const changeLabel = (value: string) => {
    setLabel(value);
    latestLabel.current = value;
  };
  const blurLabel = async () => {
    const next = label.trim();
    if (next && next !== d.label) await immediate({ label: next });
  };
  return (
    <main className="min-h-dvh pb-32">
      <DressEditorHeader
        label={label}
        isFavorite={d.isFavorite}
        onBack={goBack}
        onLabelChange={changeLabel}
        onLabelBlur={blurLabel}
        onToggleFavorite={() => immediate({ isFavorite: !d.isFavorite })}
      />
      <div className="px-5 pt-4">
        <div className="sticky top-[72px] z-10 rounded-[32px] bg-[#fffdfa] pb-3">
          <DressPreview
            dress={{ ...d, faceTransform: transform }}
            faceAsset={data.face}
            className="mx-auto aspect-[9/16] max-h-[42dvh] w-auto"
          />
        </div>
        <DressOptionSection
          category="top"
          title="어깨/끈은 어떻게 생겼나요?"
          options={topStyleOptions}
          value={presented.topStyle}
          onPick={(id) => immediate({ topStyle: id })}
        />
        <DressOptionSection
          category="neckline"
          title="가슴선은 어떤 모양이었나요?"
          options={necklineOptions}
          value={presented.neckline}
          onPick={(id) => immediate({ neckline: id })}
        />
        <DressOptionSection
          category="silhouette"
          title="치마는 어떻게 퍼졌나요?"
          options={silhouetteOptions}
          value={presented.silhouette}
          onPick={(id) => immediate({ silhouette: id })}
        />
        <DressOptionSection
          category="fabric"
          title="주 소재는 어떤 느낌이었나요?"
          options={fabricOptions}
          value={presented.fabric}
          onPick={(id) => immediate({ fabric: id })}
        />
        <DressOptionSection
          category="color"
          title="색은 가까운 쪽을 골라주세요"
          options={colorOptions}
          value={presented.color}
          onPick={(id) => immediate({ color: id })}
        />
        <DressFeedbackSection
          dress={d}
          memo={memo}
          onPatch={immediate}
          onMemoChange={(value) => {
            setMemo(value);
            latestMemo.current = value;
          }}
          onMemoBlur={() =>
            void patchDress(dressId, { memo: latestMemo.current })
          }
        />
        <DressFaceSection
          face={data.face}
          transform={transform}
          onRemove={removeFace}
          onUpload={uploadFace}
          onTransformPatch={updateTransform}
          onTransformCommit={flushTransform}
          onReset={resetFace}
        />
      </div>
      <DressEditorFooter onNext={addNextDress} />
    </main>
  );
}
