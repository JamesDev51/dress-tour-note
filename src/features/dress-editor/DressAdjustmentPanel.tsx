import { DressOptionSection } from "./DressOptionSection";
import { DressPreview } from "../../components/DressPreview";
import { DressPreviewButton } from "./DressPreviewDialog";
import { UpperBodyThumbnail, NecklineThumbnail } from "./UpperBodyThumbnail";
import { necklineOptions, topStyleOptions } from "../../lib/dress/options";
import type { Dress, DressOptionCategory } from "../../types/domain";

export type DressAdjustment = "top" | "neckline";
export function DressAdjustmentPanel({
  category,
  stylingLabel,
  dress,
  onPatch,
  onCustomCommit,
  onClose,
}: {
  category: DressAdjustment;
  stylingLabel?: string;
  dress: Dress;
  onPatch: (patch: Partial<Dress>) => Promise<void>;
  onCustomCommit: (category: DressOptionCategory, value: string) => void;
  onClose: () => void;
}) {
  const save = (patch: Partial<Dress>) => {
    void onPatch(patch).catch(() => undefined);
  };
  const title = category === "top" ? "끈·소매 수정" : "목·가슴선 수정";
  return (
    <section
      aria-label={title}
      className="bridal-content pb-[calc(11rem+env(safe-area-inset-bottom))] pt-4"
    >
      <p className="mb-1 text-sm text-ink-muted">
        {dress.label}
        {stylingLabel && ` · ${stylingLabel}`}
      </p>
      <h1 className="bridal-title">{title}</h1>
      <DressPreviewButton
        preview={
          <DressPreview dress={dress} mode="visual" className="w-full" />
        }
      />
      {category === "top" && (
        <DressOptionSection
          category="top"
          title="어깨와 팔을 덮는 모습"
          options={topStyleOptions}
          value={dress.topStyle}
          onPick={(topStyle) => save({ topStyle })}
          onClearAndSelect={(topStyle) =>
            save({ topStyle, customOptions: { top: undefined } })
          }
          renderArtwork={(topStyle) => (
            <UpperBodyThumbnail topStyle={topStyle} neckline={dress.neckline} />
          )}
          customValue={dress.customOptions?.top}
          onCustomCommit={(value) => onCustomCommit("top", value)}
        />
      )}
      {category === "neckline" && (
        <DressOptionSection
          category="neckline"
          title="목·가슴선 모양"
          options={necklineOptions}
          value={dress.neckline}
          onPick={(neckline) => save({ neckline })}
          onClearAndSelect={(neckline) =>
            save({ neckline, customOptions: { neckline: undefined } })
          }
          renderArtwork={(neckline) => (
            <NecklineThumbnail topStyle={dress.topStyle} neckline={neckline} />
          )}
          customValue={dress.customOptions?.neckline}
          onCustomCommit={(value) => onCustomCommit("neckline", value)}
        />
      )}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-rule bridal-action-bar pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 w-full rounded-control bridal-primary px-4 font-semibold text-white disabled:opacity-40"
        >
          기록으로 돌아가기
        </button>
      </div>
    </section>
  );
}
