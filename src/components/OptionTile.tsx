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
      className={`flex min-h-[44px] min-w-0 flex-col items-stretch justify-start rounded-2xl border p-2 text-left option-tile ${
        selected
          ? "border-accent-copy bg-accent-soft ring-2 ring-accent-copy/15"
          : "border-rule bg-white"
      } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
    >
      <div
        data-option-artwork
        className="pointer-events-none relative mb-2 aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-artwork-surface text-accent-copy"
      >
        <div className="absolute inset-0 grid place-items-center">
          {icon ?? <span className="text-2xl">?</span>}
        </div>
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
            key={label}
            className="motion-check grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-copy text-white"
          >
            <Check size={13} />
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs leading-5 text-stone-600">{description}</p>
      )}
      {aliases && aliases.length > 0 && (
        <div className="mt-1 text-xs leading-5 text-stone-400">
          {aliases.join(" · ")}
        </div>
      )}
    </button>
  );
}
