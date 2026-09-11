import type { Dress } from "../types/domain";
import { Heart } from "lucide-react";
import {
  createDressDecisionPresentation,
  type DecisionField,
} from "../lib/dress/decisionPresentation";
import { DressPreview } from "./DressPreview";

function FieldList({
  fields,
  hideBlank = false,
}: {
  readonly fields: readonly DecisionField[];
  readonly hideBlank?: boolean;
}) {
  const visible = hideBlank
    ? fields.filter(({ state }) => state !== "blank")
    : fields;
  if (visible.length === 0) return null;

  return (
    <dl className="space-y-1.5 text-xs leading-5">
      {visible.map(({ key, label, value, state }) => (
        <div key={key} className="grid min-w-0 grid-cols-[72px_1fr] gap-2">
          <dt className="text-stone-400">{label}</dt>
          <dd
            className={`min-w-0 break-keep [overflow-wrap:anywhere] ${state === "unknown" ? "font-semibold text-stone-500" : "text-stone-700"}`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function NoteList({ fields }: { readonly fields: readonly DecisionField[] }) {
  if (fields.length === 0) return null;

  return (
    <dl className="space-y-3 text-xs leading-5">
      {fields.map(({ key, label, value }) => (
        <div key={key} className="min-w-0">
          <dt className="text-stone-400">{label}</dt>
          <dd className="mt-1 min-w-0 break-keep text-stone-700 [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DressDecisionCard({
  dress,
  variant,
  shopName,
}: {
  readonly dress: Dress;
  readonly variant: "shop" | "review" | "compare";
  readonly shopName?: string;
}) {
  const presentation = createDressDecisionPresentation(dress);
  const candidate = presentation.decision[0];
  const rating = presentation.decision[1];

  return (
    <div className="min-w-0">
      <div
        className={`flex min-w-0 gap-3 ${variant === "review" ? "max-[350px]:block" : ""}`}
      >
        <div
          className={`${variant === "compare" ? "w-full" : variant === "review" ? "w-[116px] max-[350px]:mx-auto max-[350px]:w-[140px]" : "w-[104px]"} shrink-0`}
        >
          <DressPreview dress={presentation.dress} view="full" />
        </div>
        {variant !== "compare" && (
          <div
            className={`min-w-0 flex-1 py-1 ${variant === "review" ? "max-[350px]:mt-3" : ""}`}
          >
            {shopName && (
              <p className="truncate text-[11px] text-stone-400">{shopName}</p>
            )}
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="min-w-0 truncate font-bold">{dress.label}</h3>
              {dress.isFavorite && (
                <Heart
                  aria-label="후보"
                  className="shrink-0 text-accent"
                  fill="currentColor"
                  size={14}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
              <span className="rounded-full bg-accent-soft px-2 py-1 font-semibold text-accent-copy">
                {candidate.value}
              </span>
              {rating.state !== "blank" && (
                <span className="rounded-full bg-stone-50 px-2 py-1 text-stone-600">
                  {rating.value}
                </span>
              )}
            </div>
            <div className="mt-3">
              <FieldList fields={presentation.core} />
            </div>
            {variant === "shop" && presentation.exceptions[0] && (
              <p className="mt-2 line-clamp-2 break-keep text-xs leading-5 text-stone-600 [overflow-wrap:anywhere]">
                <span className="font-semibold text-stone-400">
                  {presentation.exceptions[0].label}
                </span>{" "}
                {presentation.exceptions[0].value}
              </p>
            )}
          </div>
        )}
      </div>

      {variant === "review" && (
        <div className="mt-4 space-y-4 border-t border-stone-100 pt-4">
          <FieldList fields={presentation.details} hideBlank />
          <FieldList fields={presentation.decision.slice(2)} hideBlank />
          <NoteList fields={presentation.exceptions} />
          {presentation.memo.state !== "blank" && (
            <div className="text-xs leading-5">
              <p className="text-stone-400">{presentation.memo.label}</p>
              <p className="mt-1 min-w-0 break-keep text-stone-700 [overflow-wrap:anywhere]">
                {presentation.memo.value}
              </p>
            </div>
          )}
        </div>
      )}

      {variant === "compare" && (
        <div className="min-w-0 px-1 pb-2 pt-3">
          {shopName && (
            <p className="truncate text-[11px] text-stone-400">{shopName}</p>
          )}
          <div className="mt-1 flex min-w-0 items-center gap-1">
            <p className="min-w-0 truncate text-sm font-bold">{dress.label}</p>
            {dress.isFavorite && (
              <Heart
                aria-label="후보"
                className="shrink-0 text-accent"
                fill="currentColor"
                size={12}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
