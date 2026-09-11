import { Check } from "lucide-react";

export function OptionTile({
  label,
  description,
  aliases,
  selected,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  description?: string;
  aliases?: readonly string[];
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      data-option-card
      className={`min-h-[44px] rounded-2xl border p-2 text-left transition active:scale-[.985] ${
        selected
          ? "border-accent bg-accent-soft ring-2 ring-accent/15"
          : "border-stone-200 bg-white"
      } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
    >
      <div
        data-option-artwork
        className="mb-2 grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-artwork-surface text-accent-copy"
      >
        {icon ?? <span className="text-2xl">?</span>}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div
          data-option-label
          className="text-[12px] font-semibold leading-[1.35] text-stone-800"
        >
          {label}
        </div>
        {selected && (
          <span
            data-selected-check
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-white"
          >
            <Check size={13} />
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-[11px] leading-[1.45] text-stone-600">
          {description}
        </p>
      )}
      {aliases && aliases.length > 0 && (
        <div className="mt-1 text-[10px] leading-tight text-stone-400">
          {aliases.join(" · ")}
        </div>
      )}
    </button>
  );
}
