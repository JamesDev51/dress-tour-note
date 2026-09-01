import { Check } from "lucide-react";

export function OptionTile({
  label,
  technical,
  selected,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  technical?: string;
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
      className={`relative min-h-[136px] rounded-2xl border p-2 text-left transition active:scale-[.985] ${
        selected
          ? "border-accent bg-accent-soft ring-2 ring-accent/15"
          : "border-stone-200 bg-white"
      } ${disabled ? "opacity-35" : ""}`}
    >
      {selected && (
        <span className="absolute right-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
          <Check size={13} />
        </span>
      )}
      <div className="mb-2 grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-artwork-surface text-accent-copy">
        {icon ?? <span className="text-2xl">?</span>}
      </div>
      <div className="text-[12px] font-semibold leading-[1.35] text-stone-800">
        {label}
      </div>
      {technical && (
        <div className="mt-1 text-[10px] leading-tight text-stone-400">
          {technical}
        </div>
      )}
    </button>
  );
}
