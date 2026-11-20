import type { Dress, Neckline, TopStyle } from "../../types/domain";
import {
  activeSilhouetteOptions,
  normalizeActiveSilhouette,
} from "../../lib/dress/activeOptions";
import { necklineOptions, topStyleOptions } from "../../lib/dress/options";
import { OptionTile } from "../../components/OptionTile";
import { OptionArtwork } from "../../components/OptionArtwork";
import { UpperBodyThumbnail, NecklineThumbnail } from "./UpperBodyThumbnail";
import { DressMaterialPicker } from "./DressMaterialPicker";

type CoreValues = Pick<
  Dress,
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "fabric"
  | "upperFabric"
  | "lowerFabric"
  | "lowerFabricStart"
  | "customOptions"
>;
export function FastRecordOptions({
  step,
  values,
  acknowledged,
  upperAcknowledged,
  saving,
  onPatch,
}: {
  readonly step: 1 | 2 | 3;
  readonly values: CoreValues;
  readonly acknowledged: boolean;
  readonly upperAcknowledged: { neckline: boolean; topStyle: boolean };
  readonly saving: boolean;
  readonly onPatch: (patch: Partial<Dress>) => Promise<void>;
}) {
  const save = (patch: Partial<Dress>) => {
    void onPatch(patch).catch(() => undefined);
  };
  const unknown = (label: string, selected: boolean, patch: Partial<Dress>) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={saving}
      onClick={() => save(patch)}
      className="mt-3 min-h-11 w-full rounded-control border border-rule px-3 text-sm font-semibold aria-pressed:bg-accent-soft aria-pressed:text-accent-copy"
    >
      기억 안 남
    </button>
  );
  return (
    <section className="mt-5 min-w-0">
      {step !== 3 && (
        <h2 tabIndex={-1} className="bridal-section-title focus:outline-none">
          {step === 1 ? "전체 모양은 어땠나요?" : "소재·표면은 어땠나요?"}
        </h2>
      )}
      {step === 1 && (
        <>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            허리부터 치마 끝까지 퍼지는 모양을 골라 주세요.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2" data-fast-record-options>
            {activeSilhouetteOptions
              .filter((option) => option.id !== "unknown")
              .map((option) => (
                <OptionTile
                  key={option.id}
                  label={option.label}
                  description={option.description}
                  selected={
                    acknowledged &&
                    normalizeActiveSilhouette(values.silhouette) === option.id
                  }
                  disabled={saving}
                  onClick={() => save({ silhouette: option.id })}
                  icon={<OptionArtwork category="silhouette" id={option.id} />}
                />
              ))}
          </div>
          {unknown(
            "기억 안 남",
            acknowledged && values.silhouette === "unknown",
            { silhouette: "unknown" },
          )}
        </>
      )}
      {step === 2 && (
        <>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            전체 소재를 고르고, 상체와 치마가 다를 때만 나눠 주세요.
          </p>
          <DressMaterialPicker
            values={values}
            acknowledged={acknowledged}
            disabled={saving}
            onPatch={onPatch}
          />
        </>
      )}
      {step === 3 && (
        <>
          <section aria-label="목·가슴선 선택" data-option-category="neckline">
            <h2
              tabIndex={-1}
              className="bridal-section-title focus:outline-none"
            >
              목·가슴선
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              가슴 위를 지나는 선부터 골라 주세요.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {necklineOptions
                .filter((o) => o.id !== "unknown")
                .map((o) => (
                  <OptionTile
                    key={o.id}
                    label={o.label}
                    selected={
                      upperAcknowledged.neckline && values.neckline === o.id
                    }
                    disabled={saving}
                    onClick={() => save({ neckline: o.id })}
                    icon={
                      <NecklineThumbnail
                        topStyle={values.topStyle}
                        neckline={o.id as Neckline}
                      />
                    }
                  />
                ))}
            </div>
            {unknown(
              "가슴선 기억 안 남",
              upperAcknowledged.neckline && values.neckline === "unknown",
              { neckline: "unknown" },
            )}
          </section>
          <section
            aria-label="끈·소매 선택"
            data-option-category="top"
            className="mt-8"
          >
            <h2
              tabIndex={-1}
              className="bridal-section-title focus:outline-none"
            >
              끈·소매
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              가슴선은 그대로 두고 어깨와 팔의 모양을 골라 주세요.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {topStyleOptions
                .filter((o) => o.id !== "unknown")
                .map((o) => (
                  <OptionTile
                    key={o.id}
                    label={o.label}
                    selected={
                      upperAcknowledged.topStyle && values.topStyle === o.id
                    }
                    disabled={saving}
                    onClick={() => save({ topStyle: o.id })}
                    icon={
                      <UpperBodyThumbnail
                        topStyle={o.id as TopStyle}
                        neckline={
                          values.neckline === "unknown"
                            ? "straight"
                            : values.neckline
                        }
                      />
                    }
                  />
                ))}
            </div>
            {unknown(
              "끈·소매 기억 안 남",
              upperAcknowledged.topStyle && values.topStyle === "unknown",
              { topStyle: "unknown" },
            )}
          </section>
        </>
      )}
    </section>
  );
}
