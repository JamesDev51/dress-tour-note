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
    <header className="sticky top-0 z-20 border-b border-stone-100 bg-[#fffdfa]/95 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          className="grid h-11 w-11 place-items-center rounded-full bg-stone-50"
          onClick={() => void onBack()}
          aria-label="뒤로"
        >
          <ArrowLeft size={19} />
        </button>
        <input
          aria-label="드레스 이름"
          maxLength={50}
          className="min-h-11 min-w-0 flex-1 bg-transparent font-bold"
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          onBlur={() => void onLabelBlur()}
        />
        <SaveStatus />
        <button
          aria-label="후보"
          className={`grid h-11 w-11 place-items-center rounded-full ${isFavorite ? "bg-[#fff2ee] text-[#b96e63]" : "bg-stone-50 text-stone-400"}`}
          onClick={() => void onToggleFavorite()}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
    </header>
  );
}
