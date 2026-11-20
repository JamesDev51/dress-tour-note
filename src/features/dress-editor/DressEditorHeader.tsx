import { ArrowLeft, Heart } from "lucide-react";
import { SaveStatus } from "../../components/SaveStatus";

export function DressEditorHeader({
  label,
  isFavorite,
  onBack,
  onLabelChange,
  onLabelBlur,
  onToggleFavorite,
}: {
  label: string;
  isFavorite: boolean;
  onBack: () => Promise<void>;
  onLabelChange: (value: string) => void;
  onLabelBlur: () => Promise<void>;
  onToggleFavorite: () => void | Promise<void>;
}) {
  return (
    <header className="bridal-content sticky top-0 z-20 border-b border-rule bg-paper/95 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          className="bridal-icon-button shrink-0"
          onClick={() => void onBack()}
          aria-label="뒤로"
        >
          <ArrowLeft size={19} />
        </button>
        <input
          aria-label="드레스 이름"
          maxLength={50}
          className="min-h-11 min-w-0 flex-1 bg-transparent font-medium"
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          onBlur={() => void onLabelBlur()}
        />
        <SaveStatus />
        <button
          aria-label="후보"
          aria-pressed={isFavorite}
          className={`candidate-toggle grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rule ${isFavorite ? "bg-accent-soft text-accent-copy" : "bg-transparent text-ink-muted"}`}
          onClick={() => void onToggleFavorite()}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
    </header>
  );
}
