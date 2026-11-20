import type { Dress } from "../types/domain";
import { Heart } from "lucide-react";
import {
  createDressDecisionPresentation,
  type DressDecisionPresentation,
} from "../lib/dress/decisionPresentation";
import { DressPreview } from "./DressPreview";
import { SelectedDressArtwork } from "./SelectedDressArtwork";
import {
  getDressLooks,
  getPreferredStylingId,
  resolveDressLook,
} from "../lib/dress/styling";

function FavoriteMark({ size }: { readonly size: number }) {
  return (
    <Heart
      aria-label="후보"
      className="shrink-0 text-accent"
      fill="currentColor"
      size={size}
    />
  );
}

function StandardCard({
  dress,
  presentation,
  metadata,
  title,
  stylingLabel,
}: {
  readonly dress: Dress;
  readonly presentation: DressDecisionPresentation;
  readonly metadata: string;
  readonly title: string;
  readonly stylingLabel?: string;
}) {
  const candidate = presentation.decision[0];
  const rating = presentation.decision[1];
  const reason = presentation.recall
    .slice(1)
    .find(({ state }) => state !== "blank");
  const tags = presentation.decision.find(({ key }) => key === "tags");

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 gap-3">
        <div className="w-[40%] min-w-[108px] max-w-[140px] shrink-0">
          <DressPreview
            dress={presentation.dress}
            allowRetry={false}
            view="full"
            mode="visual"
            className="aspect-[3/4]"
          />
        </div>
        <div className="min-w-0 flex-1 py-1">
          <p className="break-keep text-xs leading-[18px] text-stone-400 [overflow-wrap:anywhere]">
            {metadata}
          </p>
          {stylingLabel && (
            <p className="mt-1 break-keep text-xs leading-5 text-ink-muted [overflow-wrap:anywhere]">
              대표 연출 · {stylingLabel}
            </p>
          )}
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="min-w-0 break-keep font-medium leading-6 [text-wrap:balance] [overflow-wrap:break-word]">
              {title}
            </h3>
            {dress.isFavorite && <FavoriteMark size={14} />}
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            <span className="rounded-full bg-accent-soft px-2 py-1 font-semibold text-accent-copy">
              {candidate.value}
            </span>
            {rating.state !== "blank" && (
              <span className="rounded-full bg-stone-50 px-2 py-1 text-stone-600">
                {rating.value}
              </span>
            )}
          </div>
          {reason && (
            <p className="mt-3 line-clamp-2 break-keep text-xs leading-5 text-stone-700 [overflow-wrap:anywhere]">
              <span className="font-semibold text-stone-400">
                {reason.label}
              </span>{" "}
              {reason.value}
            </p>
          )}
          {tags?.state === "recorded" && (
            <p className="mt-2 line-clamp-1 text-xs leading-5 text-accent-copy">
              {tags.value}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 border-t border-rule pt-3">
        <SelectedDressArtwork
          dress={presentation.dress}
          categories={["fabric"]}
          columns={1}
          compact
        />
      </div>
    </div>
  );
}

export function DressDecisionCard({
  dress,
  shopName,
}: {
  readonly dress: Dress;
  readonly shopName?: string;
}) {
  const stylingId = getPreferredStylingId(dress);
  const visibleDress = resolveDressLook(dress, stylingId);
  const presentation = createDressDecisionPresentation(visibleDress);
  const title = visibleDress.memoryCue?.trim() || dress.label;
  const stylingLabel = dress.stylingVariants?.length
    ? getDressLooks(dress).find(({ id }) => id === stylingId)?.label
    : undefined;
  const metadata = [shopName, `${dress.order + 1}번째`, dress.label]
    .filter(Boolean)
    .join(" · ");

  return (
    <StandardCard
      dress={dress}
      presentation={presentation}
      metadata={metadata}
      title={title}
      stylingLabel={stylingLabel}
    />
  );
}
