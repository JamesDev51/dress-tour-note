import { useId } from "react";
import {
  SelectedDressArtwork,
  type SelectedDressArtworkCategory,
} from "../../components/SelectedDressArtwork";
import type { DressComparisonRow } from "../../lib/dress/decisionPresentation";
import type { Dress } from "../../types/domain";

function artworkCategory(
  key: DressComparisonRow["key"],
): SelectedDressArtworkCategory | undefined {
  return key === "fabric" || key === "backStyle" || key === "details"
    ? key
    : undefined;
}

export function ComparisonSection({
  title,
  description,
  rows,
  dresses,
}: {
  readonly title: string;
  readonly description?: string;
  readonly rows: readonly DressComparisonRow[];
  readonly dresses: readonly [Dress, Dress];
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-base font-bold">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
      )}
      {rows.length === 0 ? (
        <p className="mt-3 rounded-control bg-stone-50 p-4 text-sm leading-6 text-ink-muted">
          기록된 내용이 없어요.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-card border border-stone-200">
          {rows.map((row) => {
            const category = artworkCategory(row.key);
            return (
              <div
                key={row.key}
                className="border-b border-stone-200 last:border-0"
              >
                <h3 className="bg-artwork-surface px-3 py-2 text-xs font-semibold text-ink-muted">
                  {row.label}
                </h3>
                <div className="grid grid-cols-2 divide-x divide-stone-200">
                  {[row.left, row.right].map((cell, index) => (
                    <div
                      key={index}
                      className="min-w-0 px-3 py-3 text-xs leading-5"
                    >
                      <p
                        className={`break-keep [overflow-wrap:anywhere] ${cell.state === "recorded" ? "text-ink" : "text-ink-muted"}`}
                      >
                        {cell.value}
                      </p>
                      {category && cell.state === "recorded" && (
                        <div className="mt-3">
                          <SelectedDressArtwork
                            dress={dresses[index]}
                            categories={[category]}
                            columns={1}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
