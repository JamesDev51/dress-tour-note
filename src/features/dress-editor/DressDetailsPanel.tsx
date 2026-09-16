import { useEffect, useRef, useState } from "react";
import { DressFaceSection } from "./DressFaceSection";
import { DressFeedbackSection } from "./DressFeedbackSection";
import { DressOptionSection } from "./DressOptionSection";
import {
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  necklineOptions,
  silhouetteOptions,
  topStyleOptions,
  trainOptions,
  waistlineOptions,
} from "../../lib/dress/options";
import type {
  Dress,
  DressOptionCategory,
  FaceTransform,
  LocalAsset,
} from "../../types/domain";

export function DressDetailsPanel({
  dress,
  memo,
  transform,
  face,
  includeFace,
  onPatch,
  onCustomCommit,
  onMemoChange,
  onMemoBlur,
  onRemoveFace,
  onUploadFace,
  onIncludeFaceChange,
  onTransformPatch,
  onTransformCommit,
  onResetFace,
  onClose,
}: {
  dress: Dress;
  memo: string;
  transform: FaceTransform;
  face: LocalAsset | undefined;
  includeFace: boolean;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onCustomCommit: (category: DressOptionCategory, value: string) => void;
  onMemoChange: (value: string) => void;
  onMemoBlur: () => void;
  onRemoveFace: () => Promise<void>;
  onUploadFace: (file: File) => Promise<void>;
  onIncludeFaceChange: (include: boolean) => void;
  onTransformPatch: (patch: Partial<FaceTransform>) => void;
  onTransformCommit: () => void;
  onResetFace: () => void;
  onClose: () => void;
}) {
  const [selectedDetails, setSelectedDetails] = useState(dress.details);
  const [detailBusy, setDetailBusy] = useState(false);
  const detailBusyRef = useRef(false);

  useEffect(() => {
    setSelectedDetails(dress.details);
  }, [dress.details]);

  const customOptionsWithout = (category: DressOptionCategory) => ({
    [category]: undefined,
  });
  const toggleDetail = async (
    value: Dress["details"][number],
    clearCustom = false,
  ) => {
    if (detailBusyRef.current) return;
    detailBusyRef.current = true;
    setDetailBusy(true);
    const next = selectedDetails.includes(value)
      ? selectedDetails.filter((detail) => detail !== value)
      : [...selectedDetails, value];
    setSelectedDetails(next);
    try {
      await onPatch({
        details: next,
        ...(clearCustom
          ? { customOptions: customOptionsWithout("details") }
          : {}),
      });
    } catch (error) {
      setSelectedDetails(dress.details);
      throw error;
    } finally {
      detailBusyRef.current = false;
      setDetailBusy(false);
    }
  };

  return (
    <div className="px-5 pb-32 pt-4">
      <button
        type="button"
        className="min-h-11 rounded-control px-3 text-sm font-bold text-accent-copy underline underline-offset-4"
        onClick={onClose}
      >
        핵심 기록으로 돌아가기
      </button>
      <DressOptionSection
        category="top"
        title="어깨/상의"
        options={topStyleOptions}
        value={dress.topStyle}
        onPick={(value) => void onPatch({ topStyle: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            topStyle: value,
            customOptions: customOptionsWithout("top"),
          })
        }
        customValue={dress.customOptions?.top}
        onCustomCommit={(value) => onCustomCommit("top", value)}
      />
      <DressOptionSection
        category="neckline"
        title="네크라인"
        options={necklineOptions}
        value={dress.neckline}
        onPick={(value) => void onPatch({ neckline: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            neckline: value,
            customOptions: customOptionsWithout("neckline"),
          })
        }
        customValue={dress.customOptions?.neckline}
        onCustomCommit={(value) => onCustomCommit("neckline", value)}
      />
      <DressOptionSection
        category="silhouette"
        title="실루엣"
        options={silhouetteOptions}
        value={dress.silhouette}
        onPick={(value) => void onPatch({ silhouette: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            silhouette: value,
            customOptions: customOptionsWithout("silhouette"),
          })
        }
        customValue={dress.customOptions?.silhouette}
        onCustomCommit={(value) => onCustomCommit("silhouette", value)}
      />
      <DressOptionSection
        category="fabric"
        title="소재"
        options={fabricOptions}
        value={dress.fabric}
        onPick={(value) => void onPatch({ fabric: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            fabric: value,
            customOptions: customOptionsWithout("fabric"),
          })
        }
        customValue={dress.customOptions?.fabric}
        onCustomCommit={(value) => onCustomCommit("fabric", value)}
      />
      <DressOptionSection
        category="color"
        title="색상"
        options={colorOptions}
        value={dress.color}
        onPick={(value) => void onPatch({ color: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            color: value,
            customOptions: customOptionsWithout("color"),
          })
        }
        customValue={dress.customOptions?.color}
        onCustomCommit={(value) => onCustomCommit("color", value)}
      />
      <DressOptionSection
        category="waistline"
        title="허리선"
        options={waistlineOptions}
        value={dress.waistline}
        onPick={(value) => void onPatch({ waistline: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            waistline: value,
            customOptions: customOptionsWithout("waistline"),
          })
        }
        customValue={dress.customOptions?.waistline}
        onCustomCommit={(value) => onCustomCommit("waistline", value)}
      />
      <DressOptionSection
        category="backStyle"
        title="등 디자인"
        options={backStyleOptions}
        value={dress.backStyle ?? "unknown"}
        onPick={(value) => void onPatch({ backStyle: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            backStyle: value,
            customOptions: customOptionsWithout("backStyle"),
          })
        }
        customValue={dress.customOptions?.backStyle}
        onCustomCommit={(value) => onCustomCommit("backStyle", value)}
      />
      <DressOptionSection
        category="train"
        title="트레인"
        options={trainOptions}
        value={dress.train}
        onPick={(value) => void onPatch({ train: value })}
        onClearAndSelect={(value) =>
          void onPatch({
            train: value,
            customOptions: customOptionsWithout("train"),
          })
        }
        customValue={dress.customOptions?.train}
        onCustomCommit={(value) => onCustomCommit("train", value)}
      />
      <DressOptionSection
        category="details"
        title="디테일"
        hint={`최대 4개 선택 · ${selectedDetails.length}/4`}
        options={detailOptions}
        selectionMode="multiple"
        selectedValues={selectedDetails}
        disabled={(value) =>
          detailBusy ||
          (selectedDetails.length >= 4 && !selectedDetails.includes(value))
        }
        onToggle={(value) => void toggleDetail(value)}
        onClearAndSelect={(value) => void toggleDetail(value, true)}
        customValue={dress.customOptions?.details}
        onCustomCommit={(value) => onCustomCommit("details", value)}
      />
      <DressFeedbackSection
        dress={dress}
        memo={memo}
        onPatch={onPatch}
        onMemoChange={onMemoChange}
        onMemoBlur={onMemoBlur}
      />
      <DressFaceSection
        face={face}
        includeFace={includeFace}
        transform={transform}
        onRemove={onRemoveFace}
        onUpload={onUploadFace}
        onIncludeChange={onIncludeFaceChange}
        onTransformPatch={onTransformPatch}
        onTransformCommit={onTransformCommit}
        onReset={onResetFace}
      />
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-stone-100 bg-white/95 p-4 backdrop-blur">
        <button
          type="button"
          className="min-h-12 w-full rounded-control bg-stone-900 px-4 font-bold text-white"
          onClick={onClose}
        >
          핵심 기록으로
        </button>
      </div>
    </div>
  );
}
