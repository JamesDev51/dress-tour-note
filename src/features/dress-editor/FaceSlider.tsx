export function FaceSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}) {
  return (
    <label className="grid grid-cols-[56px_1fr_42px] items-center gap-2 text-xs text-stone-500">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="accent-[#b96e63]"
      />
      <span className="text-right text-[10px] text-stone-400">
        {value.toFixed(step < 1 ? 2 : 0)}
      </span>
    </label>
  );
}
