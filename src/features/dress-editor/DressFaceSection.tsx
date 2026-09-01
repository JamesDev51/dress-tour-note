import { ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import type { FaceTransform, LocalAsset } from "../../types/domain";
import { FaceSlider } from "./FaceSlider";

export function DressFaceSection({
  face,
  transform,
  onRemove,
  onUpload,
  onTransformPatch,
  onTransformCommit,
  onReset,
}: {
  face?: LocalAsset;
  transform: FaceTransform;
  onRemove: () => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onTransformPatch: (patch: Partial<FaceTransform>) => void;
  onTransformCommit: () => void;
  onReset: () => void;
}) {
  return (
    <section className="mt-8 rounded-card border border-stone-100 bg-artwork-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">내 얼굴로 느낌 보기</h2>
          <p className="mt-1 text-sm leading-6 text-stone-400">
            사진은 이 기기에서만 처리됩니다. 가상 피팅이 아니라 분위기
            비교용이에요.
          </p>
        </div>
        {face && (
          <button
            aria-label="얼굴 사진 삭제"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-stone-400"
            onClick={async () => {
              if (confirm("얼굴 사진을 삭제할까요?")) await onRemove();
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {!face ? (
        <label className="mt-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white font-semibold shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <ImagePlus size={18} />
          얼굴 사진 추가
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await onUpload(file);
            }}
          />
        </label>
      ) : (
        <div className="mt-4 space-y-3">
          <FaceSlider
            label="좌우"
            min={-1}
            max={1}
            step={0.01}
            value={transform.x}
            onChange={(x) => onTransformPatch({ x })}
            onCommit={onTransformCommit}
          />
          <FaceSlider
            label="위아래"
            min={-1}
            max={1}
            step={0.01}
            value={transform.y}
            onChange={(y) => onTransformPatch({ y })}
            onCommit={onTransformCommit}
          />
          <FaceSlider
            label="크기"
            min={0.5}
            max={3}
            step={0.02}
            value={transform.scale}
            onChange={(scale) => onTransformPatch({ scale })}
            onCommit={onTransformCommit}
          />
          <FaceSlider
            label="회전"
            min={-15}
            max={15}
            step={1}
            value={transform.rotation}
            onChange={(rotation) => onTransformPatch({ rotation })}
            onCommit={onTransformCommit}
          />
          <button
            className="inline-flex min-h-11 items-center gap-1 text-xs text-stone-400"
            onClick={onReset}
          >
            <RotateCcw size={14} />
            위치 초기화
          </button>
        </div>
      )}
    </section>
  );
}
