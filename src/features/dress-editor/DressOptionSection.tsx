import {
  OptionArtwork,
  type OptionArtworkCategory,
} from "../../components/OptionArtwork";
import { OptionTile } from "../../components/OptionTile";
import type { Option } from "../../lib/dress/options";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const categoryLabels = {
  top: "상의 디자인",
  neckline: "네크라인",
  silhouette: "실루엣",
  fabric: "소재",
  color: "색상",
  waistline: "허리선",
  backStyle: "등 디자인",
  train: "트레인",
  details: "디테일",
} as const satisfies Readonly<Record<OptionArtworkCategory, string>>;

function isCompactCandidate(category: OptionArtworkCategory) {
  return category === "color" || category === "train" || category === "details";
}

type SharedDressOptionSectionProps<T extends string> = {
  category: OptionArtworkCategory;
  title: string;
  hint?: string;
  options: readonly Option<T>[];
  disabled?: (id: T) => boolean;
  customValue?: string;
  onCustomCommit: (value: string) => void;
  onClearAndSelect?: (id: T) => void;
  allowCustom?: boolean;
};

type SingleDressOptionSectionProps<T extends string> =
  SharedDressOptionSectionProps<T> & {
    selectionMode?: "single";
    value?: T;
    onPick: (id: T) => void;
  };

type MultipleDressOptionSectionProps<T extends string> =
  SharedDressOptionSectionProps<T> & {
    selectionMode: "multiple";
    selectedValues: readonly T[];
    onToggle: (id: T) => void;
  };

type DressOptionSectionProps<T extends string> =
  SingleDressOptionSectionProps<T> | MultipleDressOptionSectionProps<T>;

function measuredLabelWidth(label: HTMLElement) {
  const probe = document.createElement("span");
  const style = window.getComputedStyle(label);
  probe.style.cssText = `font:${style.font};letter-spacing:${style.letterSpacing};position:fixed;visibility:hidden;white-space:nowrap`;
  probe.textContent = label.textContent;
  document.body.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

function useGridColumns(
  compactCandidate: boolean,
  optionLabels: readonly string[],
) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);
  const labelsKey = optionLabels.join("\u0000");

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!compactCandidate || !grid) {
      setColumns(2);
      return;
    }
    const update = () => {
      const width = grid.getBoundingClientRect().width;
      const targetWidth = (width - 16) / 3;
      const labels = Array.from(
        grid.querySelectorAll<HTMLElement>("[data-option-label]"),
      );
      const labelsFit = labels.every(
        (label) => measuredLabelWidth(label) <= targetWidth - 44,
      );
      setColumns(targetWidth >= 44 && labelsFit ? 3 : 2);
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [compactCandidate, labelsKey]);

  return { columns, gridRef };
}

export function DressOptionSection<T extends string>(
  props: DressOptionSectionProps<T>,
) {
  const {
    category,
    title,
    hint,
    options,
    disabled,
    customValue = "",
    onCustomCommit,
    onClearAndSelect,
    allowCustom = true,
  } = props;
  const [custom, setCustom] = useState(customValue);
  const [differenceOpen, setDifferenceOpen] = useState(Boolean(customValue));
  const [pendingChoice, setPendingChoice] = useState<T>();
  useEffect(() => {
    setCustom(customValue);
    if (customValue) setDifferenceOpen(true);
  }, [customValue]);
  const multiple = props.selectionMode === "multiple";
  const unknownOption = multiple
    ? undefined
    : options.find((option) => option.id === "unknown");
  const knownOptions = options.filter((option) => option.id !== "unknown");
  const selectedKnown = multiple
    ? props.selectedValues.some((id) => id !== "unknown")
    : props.value !== "unknown" &&
      knownOptions.some((option) => option.id === props.value);
  const { columns, gridRef } = useGridColumns(
    isCompactCandidate(category),
    knownOptions.map((option) => option.label),
  );
  const selected = (id: T) =>
    multiple ? props.selectedValues.includes(id) : props.value === id;
  const applyPick = (id: T, keepNote: boolean) => {
    if (!keepNote && onClearAndSelect) {
      onClearAndSelect(id);
    } else if (multiple) {
      props.onToggle(id);
    } else {
      props.onPick(id);
    }
    if (!keepNote) {
      setCustom("");
      setDifferenceOpen(false);
      if (!onClearAndSelect) onCustomCommit("");
    }
    setPendingChoice(undefined);
  };
  const pick = (id: T) => {
    const changesSingleChoice = !multiple && props.value !== id;
    const changesMultipleChoice = multiple;
    if (custom.trim() && (changesSingleChoice || changesMultipleChoice)) {
      setPendingChoice(id);
      return;
    }
    applyPick(id, id !== "unknown");
  };
  return (
    <section data-option-category={category} className="mt-8">
      <h2 className="mb-3 text-xl font-black">{title}</h2>
      {hint && <p className="-mt-2 mb-3 text-sm text-ink-muted">{hint}</p>}
      {unknownOption && (
        <button
          type="button"
          aria-pressed={selected(unknownOption.id)}
          data-option-unknown
          className={`mb-3 min-h-[44px] rounded-control border px-3 text-left text-sm font-semibold transition active:scale-[.985] ${
            selected(unknownOption.id)
              ? "border-accent bg-accent-soft text-accent-copy ring-2 ring-accent/15"
              : "border-stone-200 bg-white text-stone-600"
          } ${disabled?.(unknownOption.id) ? "cursor-not-allowed opacity-35" : ""}`}
          disabled={disabled?.(unknownOption.id)}
          onClick={() => pick(unknownOption.id)}
        >
          기억 안 남
        </button>
      )}
      <div
        ref={gridRef}
        data-testid="option-grid"
        data-option-grid-columns={columns}
        className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {knownOptions.map((option) => (
          <OptionTile
            key={option.id}
            label={option.label}
            description={option.description}
            aliases={option.aliases}
            selected={selected(option.id)}
            disabled={disabled?.(option.id)}
            onClick={() => pick(option.id)}
            icon={<OptionArtwork category={category} id={option.id} />}
          />
        ))}
      </div>
      {allowCustom && selectedKnown && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={differenceOpen}
            className="min-h-[44px] rounded-control px-3 text-sm font-semibold text-accent-copy underline underline-offset-4"
            onClick={() => setDifferenceOpen((open) => !open)}
          >
            비슷하지만 달라요 · {categoryLabels[category]}
          </button>
          {differenceOpen && (
            <label className="mt-2 block text-xs font-semibold text-stone-500">
              <span className="sr-only">
                {categoryLabels[category]}에서 다른 점
              </span>
              <input
                aria-label={`${categoryLabels[category]}에서 다른 점`}
                value={custom}
                maxLength={80}
                placeholder="어떤 점이 달랐는지 적어주세요"
                className="h-12 w-full rounded-control border border-stone-200 bg-white px-4 text-sm font-normal text-stone-800 focus:border-accent"
                onChange={(event) => setCustom(event.target.value)}
                onBlur={() => onCustomCommit(custom.trim())}
              />
            </label>
          )}
        </div>
      )}
      {pendingChoice !== undefined && (
        <dialog
          open
          aria-label="메모 처리 선택"
          className="fixed inset-x-5 bottom-24 z-30 rounded-card border border-stone-200 bg-white p-4 shadow-xl"
        >
          <p className="text-sm font-bold">
            {categoryLabels[category]} 메모를 어떻게 할까요?
          </p>
          <div className="mt-3 grid gap-2">
            {pendingChoice !== "unknown" && (
              <button
                type="button"
                className="min-h-11 rounded-control bg-stone-900 px-3 text-sm font-bold text-white"
                onClick={() => applyPick(pendingChoice, true)}
              >
                메모 유지하고 변경
              </button>
            )}
            <button
              type="button"
              className="min-h-11 rounded-control border border-accent bg-accent-soft px-3 text-sm font-bold text-accent-copy"
              onClick={() => applyPick(pendingChoice, false)}
            >
              {pendingChoice === "unknown"
                ? "메모 지우고 기억 안 남 선택"
                : "메모 지우고 변경"}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-control px-3 text-sm font-semibold text-ink-muted"
              onClick={() => setPendingChoice(undefined)}
            >
              취소
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}
