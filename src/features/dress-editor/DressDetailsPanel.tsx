import { DressFeedbackSection } from "./DressFeedbackSection";
import { NecklineThumbnail } from "./UpperBodyThumbnail";
import { DressOptionSection } from "./DressOptionSection";
import { DressMaterialPicker } from "./DressMaterialPicker";
import {
  activeDetailOptions,
  activeFabricOptions,
  activeSilhouetteOptions,
  normalizeActiveSilhouette,
} from "../../lib/dress/activeOptions";
import {
  necklineOptions,
  topStyleOptions,
  waistlineOptions,
} from "../../lib/dress/options";
import type { Dress, DressOptionCategory } from "../../types/domain";

const activeDetailIds = new Set(activeDetailOptions.map((option) => option.id));
function currentDetails(dress: Dress) {
  return dress.details.filter((detail) => activeDetailIds.has(detail));
}
export function DressDetailsPanel({
  dress,
  memo,
  onPatch,
  onCustomCommit,
  onMemoChange,
  onMemoBlur,
  onClose,
}: {
  dress: Dress;
  memo: string;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onCustomCommit: (category: DressOptionCategory, value: string) => void;
  onMemoChange: (value: string) => void;
  onMemoBlur: () => void;
  onClose: () => void;
}) {
  const save = (patch: Partial<Dress>) => {
    void onPatch(patch).catch(() => undefined);
  };
  const selectedDetails = currentDetails(dress);
  const without = (category: DressOptionCategory) => ({
    [category]: undefined,
  });
  const toggleDetail = (
    value: Dress["details"][number],
    clearCustom = false,
  ) => {
    const remove = selectedDetails.includes(value);
    if (!remove && selectedDetails.length >= 4) return;
    save({
      details: remove
        ? selectedDetails.filter((detail) => detail !== value)
        : [...selectedDetails, value],
      ...(clearCustom ? { customOptions: without("details") } : {}),
    });
  };
  return (
    <div className="bridal-content pb-48 pt-4">
      <DressOptionSection
        category="neckline"
        title="목·가슴선"
        options={necklineOptions}
        value={dress.neckline}
        renderArtwork={(neckline) => (
          <NecklineThumbnail topStyle={dress.topStyle} neckline={neckline} />
        )}
        onPick={(neckline) => save({ neckline })}
        onClearAndSelect={(neckline) =>
          save({ neckline, customOptions: without("neckline") })
        }
        customValue={dress.customOptions?.neckline}
        onCustomCommit={(value) => onCustomCommit("neckline", value)}
      />
      <DressOptionSection
        category="top"
        title="끈·소매"
        options={topStyleOptions}
        value={dress.topStyle}
        onPick={(topStyle) => save({ topStyle })}
        onClearAndSelect={(topStyle) =>
          save({ topStyle, customOptions: without("top") })
        }
        customValue={dress.customOptions?.top}
        onCustomCommit={(value) => onCustomCommit("top", value)}
      />
      <DressOptionSection
        category="silhouette"
        title="전체 모양"
        options={activeSilhouetteOptions}
        value={normalizeActiveSilhouette(dress.silhouette)}
        onPick={(silhouette) => save({ silhouette })}
        onClearAndSelect={(silhouette) =>
          save({ silhouette, customOptions: without("silhouette") })
        }
        customValue={dress.customOptions?.silhouette}
        onCustomCommit={(value) => onCustomCommit("silhouette", value)}
      />
      <div className="mt-8">
        <DressMaterialPicker
          values={dress}
          onPatch={onPatch}
          commonSection={(fabric, select) => (
            <DressOptionSection
              category="fabric"
              title="소재·표면"
              options={activeFabricOptions}
              value={fabric}
              onPick={select}
              onClearAndSelect={(value) => select(value, true)}
              customValue={dress.customOptions?.fabric}
              onCustomCommit={(value) => onCustomCommit("fabric", value)}
            />
          )}
        />
      </div>
      <DressOptionSection
        category="waistline"
        title="허리선"
        options={waistlineOptions}
        value={dress.waistline}
        onPick={(waistline) => save({ waistline })}
        onClearAndSelect={(waistline) =>
          save({ waistline, customOptions: without("waistline") })
        }
        customValue={dress.customOptions?.waistline}
        onCustomCommit={(value) => onCustomCommit("waistline", value)}
      />
      <DressOptionSection
        category="details"
        title="장식과 세부 특징"
        hint={`최대 4개 선택 · ${selectedDetails.length}/4`}
        options={activeDetailOptions}
        selectionMode="multiple"
        selectedValues={selectedDetails}
        disabled={(value) =>
          selectedDetails.length >= 4 && !selectedDetails.includes(value)
        }
        onToggle={toggleDetail}
        onClearAndSelect={(value) => toggleDetail(value, true)}
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
      <div className="bridal-action-bar fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-rule py-4 backdrop-blur">
        <button
          type="button"
          className="min-h-12 w-full rounded-control bridal-primary px-4 font-semibold text-white"
          onClick={onClose}
        >
          기록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
