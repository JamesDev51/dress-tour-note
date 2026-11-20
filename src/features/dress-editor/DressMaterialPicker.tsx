import { useId, useState, type ReactNode } from "react";
import {
  LOWER_FABRIC_STARTS,
  type Dress,
  type Fabric,
} from "../../types/domain";
import {
  activeFabricOptions,
  normalizeActiveFabric,
  upperFabricFor,
  lowerFabricFor,
  fabricStartLabels,
} from "../../lib/dress/activeOptions";
import { OptionArtwork } from "../../components/OptionArtwork";
import { OptionTile } from "../../components/OptionTile";

export type MaterialValues = Pick<
  Dress,
  "fabric" | "upperFabric" | "lowerFabric" | "lowerFabricStart"
>;

function differentKnownFabrics(upper: Fabric, lower: Fabric) {
  return upper !== "unknown" && lower !== "unknown" && upper !== lower;
}

export function DressMaterialPicker({
  values: saved,
  disabled = false,
  acknowledged = true,
  onPatch,
  commonSection,
}: {
  readonly values: MaterialValues;
  readonly disabled?: boolean;
  readonly acknowledged?: boolean;
  readonly onPatch: (patch: Partial<Dress>) => Promise<void>;
  readonly commonSection?: (
    fabric: Fabric,
    pick: (fabric: Fabric, clearCustom?: boolean) => void,
  ) => ReactNode;
}) {
  const id = useId();
  const [pending, setPending] = useState<MaterialValues | null>(null);
  const values = pending ?? saved;
  const mixed =
    values.upperFabric !== undefined || values.lowerFabric !== undefined;
  const upper = normalizeActiveFabric(upperFabricFor(values));
  const lower = normalizeActiveFabric(lowerFabricFor(values));

  const changeMaterial = (
    patch: Partial<MaterialValues>,
    clearCustom = false,
  ) => {
    if (disabled) return;
    // Save the whole selection together, including any explicitly cleared fields.
    const next: MaterialValues = {
      fabric: values.fabric,
      upperFabric: values.upperFabric,
      lowerFabric: values.lowerFabric,
      lowerFabricStart: values.lowerFabricStart,
      ...patch,
    };
    if (
      !differentKnownFabrics(
        normalizeActiveFabric(upperFabricFor(next)),
        normalizeActiveFabric(lowerFabricFor(next)),
      )
    ) {
      next.lowerFabricStart = undefined;
    }
    setPending(next);
    void onPatch(
      clearCustom ? { ...next, customOptions: { fabric: undefined } } : next,
    )
      .catch(() => undefined)
      .finally(() => setPending((latest) => (latest === next ? null : latest)));
  };
  const selectCommon = (fabric: Fabric, clearCustom = false) =>
    changeMaterial(
      { fabric, upperFabric: undefined, lowerFabric: undefined },
      clearCustom,
    );
  const cards = (
    value: Fabric,
    onPick: (value: Fabric) => void,
    unknownLabel: string,
  ) => (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {activeFabricOptions
          .filter((option) => option.id !== "unknown")
          .map((option) => (
            <OptionTile
              key={option.id}
              label={option.label}
              description={option.description}
              selected={acknowledged && value === option.id}
              disabled={disabled}
              onClick={() => onPick(option.id)}
              icon={<OptionArtwork category="fabric" id={option.id} />}
            />
          ))}
      </div>
      <button
        type="button"
        aria-label={unknownLabel}
        aria-pressed={acknowledged && value === "unknown"}
        disabled={disabled}
        onClick={() => onPick("unknown")}
        className="mt-3 min-h-11 w-full rounded-control border border-rule px-3 text-sm font-semibold aria-pressed:bg-accent-soft aria-pressed:text-accent-copy"
      >
        기억 안 남
      </button>
    </>
  );
  return (
    <div className="min-w-0" data-material-picker aria-busy={Boolean(pending)}>
      <label
        htmlFor={id}
        className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold"
      >
        <input
          id={id}
          type="checkbox"
          checked={mixed}
          disabled={disabled}
          className="h-5 w-5 accent-accent-copy"
          onChange={(event) =>
            changeMaterial(
              event.target.checked
                ? { upperFabric: upper, lowerFabric: lower }
                : {
                    fabric: upper,
                    upperFabric: undefined,
                    lowerFabric: undefined,
                  },
            )
          }
        />
        상체와 치마 소재가 달라요
      </label>
      {mixed ? (
        <div className="space-y-5">
          <fieldset
            aria-label="상체 소재"
            disabled={disabled}
            className="min-w-0"
          >
            <legend className="bridal-section-title">상체 소재</legend>
            {cards(
              upper,
              (upperFabric) => changeMaterial({ upperFabric }),
              "상체 소재 기억 안 남",
            )}
          </fieldset>
          <fieldset
            aria-label="치마 소재"
            disabled={disabled}
            className="min-w-0"
          >
            <legend className="bridal-section-title">치마 소재</legend>
            {cards(
              lower,
              (lowerFabric) => changeMaterial({ lowerFabric }),
              "치마 소재 기억 안 남",
            )}
          </fieldset>
          {differentKnownFabrics(upper, lower) && (
            <fieldset disabled={disabled} className="min-w-0">
              <legend className="bridal-section-title">
                아래 소재는 어디서 시작해요?
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {LOWER_FABRIC_STARTS.map((start) => (
                  <button
                    key={start}
                    type="button"
                    aria-pressed={
                      (values.lowerFabricStart ?? "waist") === start
                    }
                    disabled={disabled}
                    onClick={() => changeMaterial({ lowerFabricStart: start })}
                    className="min-h-11 rounded-control border border-rule px-3 text-sm font-semibold aria-pressed:bg-accent-soft aria-pressed:text-accent-copy"
                  >
                    {fabricStartLabels[start]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      ) : (
        (commonSection?.(normalizeActiveFabric(values.fabric), selectCommon) ??
        cards(normalizeActiveFabric(values.fabric), selectCommon, "기억 안 남"))
      )}
    </div>
  );
}
