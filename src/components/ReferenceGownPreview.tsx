import { useId } from "react";
import {
  fabricOptions,
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  topStyleOptions,
} from "../lib/dress/options";
import type { Dress } from "../types/domain";
import { OptionArtwork } from "./OptionArtwork";
import { SelectedDressArtwork } from "./SelectedDressArtwork";

type ReferenceGownPreviewVariant = "detail" | "compact";

type RecordedLabel = {
  readonly label: string;
  readonly value: string;
};

function recordedLabels(dress: Dress): readonly RecordedLabel[] {
  return [
    {
      label: "소매·상의",
      value: optionLabel(topStyleOptions, dress.topStyle),
    },
    {
      label: "네크라인",
      value: optionLabel(necklineOptions, dress.neckline),
    },
    { label: "소재", value: optionLabel(fabricOptions, dress.fabric) },
  ].filter(({ value }) => value !== "기억 안 남");
}

export function ReferenceGownPreview({
  dress,
  variant = "detail",
  className = "",
}: {
  readonly dress: Dress;
  readonly variant?: ReferenceGownPreviewVariant;
  readonly className?: string;
}) {
  const headingId = useId();
  const silhouetteLabel = optionLabel(silhouetteOptions, dress.silhouette);
  const hasSilhouetteException = Boolean(
    dress.customOptions?.silhouette?.trim(),
  );
  const available = dress.silhouette !== "unknown" && !hasSilhouetteException;
  const labels = recordedLabels(dress);

  if (variant === "compact") {
    return (
      <section
        aria-labelledby={headingId}
        data-reference-gown
        data-reference-state={available ? "available" : "no-reference"}
        data-reference-silhouette={available ? dress.silhouette : "unknown"}
        className={`min-w-0 ${className}`}
      >
        <div className="aspect-square overflow-hidden rounded-control border border-stone-200 bg-artwork-surface">
          {available ? (
            <OptionArtwork
              category="silhouette"
              id={dress.silhouette}
              className="rounded-none"
            />
          ) : (
            <div className="grid h-full place-items-center p-2 text-center text-[11px] leading-4 text-ink-muted">
              실루엣 참고 이미지를 표시할 수 없어요.
            </div>
          )}
        </div>
        <p
          id={headingId}
          className="mt-1 break-keep text-xs font-bold leading-[18px] text-accent-copy"
        >
          실루엣 참고 · {silhouetteLabel}
        </p>
        {labels.length > 0 && (
          <p
            className="mt-1 break-keep text-[11px] leading-4 text-ink-muted [overflow-wrap:anywhere]"
            aria-label={`기록된 주요 선택 ${labels.map(({ label, value }) => `${label} ${value}`).join(" · ")}`}
          >
            {labels.map(({ value }) => value).join(" · ")}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      data-reference-gown
      data-reference-state={available ? "available" : "no-reference"}
      data-reference-silhouette={available ? dress.silhouette : "unknown"}
      className={`min-w-0 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h2
          id={headingId}
          className="break-keep text-base font-bold leading-6 text-ink"
        >
          실루엣 참고
        </h2>
        <span className="min-w-0 truncate rounded-full bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-copy">
          {silhouetteLabel}
        </span>
      </div>
      <div className="mt-3 aspect-square overflow-hidden rounded-card border border-stone-200 bg-artwork-surface">
        {available ? (
          <OptionArtwork
            category="silhouette"
            id={dress.silhouette}
            className="rounded-none"
          />
        ) : (
          <div className="grid h-full place-items-center p-5 text-center text-sm leading-[22px] text-ink-muted">
            실루엣 참고 이미지를 표시할 수 없어요.
            <br />
            기록한 실루엣과 메모를 확인해 주세요.
          </div>
        )}
      </div>
      <p className="mt-3 break-keep text-sm leading-[22px] text-ink-muted">
        선택한 실루엣을 참고한 완성 드레스 이미지예요. 네크라인·소매·소재·장식은
        아래 기록과 예시 이미지로 따로 확인해 주세요.
      </p>
      <div className="mt-4">
        <SelectedDressArtwork
          dress={dress}
          categories={["top", "neckline", "fabric", "backStyle", "details"]}
        />
      </div>
    </section>
  );
}
