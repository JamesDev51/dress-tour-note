import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { DressPreview } from "../../components/DressPreview";
import {
  SKETCH_FRAME,
  SKETCH_INK,
  sketchPath,
} from "../../lib/renderer/sketchInk";
import {
  MAX_SKETCH_POINTS,
  MAX_SKETCH_STROKES,
  SKETCH_PEN_WIDTHS,
  type Dress,
  type SketchPenWidth,
  type SketchPoint,
  type SketchStroke,
} from "../../types/domain";

export type DressSketchOptions = {
  dress: Dress;
  onSave: (strokes: SketchStroke[]) => Promise<void>;
};

const widthLabels = { 1: "가늘게", 2: "보통", 4: "굵게" };

function pointerPoint(
  event: PointerEvent<SVGSVGElement>,
): SketchPoint | undefined {
  const svg = event.currentTarget;
  const transform = svg.getScreenCTM();
  if (!transform) return;
  const cursor = svg.createSVGPoint();
  cursor.x = event.clientX;
  cursor.y = event.clientY;
  const { x, y } = cursor.matrixTransform(transform.inverse());
  const normalized = (value: number, side: number) =>
    Math.round(Math.max(0, Math.min(1, value / side)) * 10000) / 10000;
  return [
    normalized(x, SKETCH_FRAME.width),
    normalized(y, SKETCH_FRAME.height),
  ];
}

function appendPoint(stroke: SketchStroke, point: SketchPoint): SketchStroke {
  const last = stroke.points[stroke.points.length - 1];
  if (point[0] === last[0] && point[1] === last[1]) return stroke;
  // Keep the entire gesture, including its endpoint, when a long stroke fills up.
  const points =
    stroke.points.length < MAX_SKETCH_POINTS
      ? stroke.points
      : stroke.points.filter((_, index) => index % 2 === 0);
  return { ...stroke, points: [...points, point] };
}

function StrokePath({ stroke }: { stroke: SketchStroke }) {
  return <path d={sketchPath(stroke.points)} strokeWidth={stroke.width} />;
}

export function DressSketchEditor({
  dress,
  onSave,
  onCancel,
  saving,
}: DressSketchOptions & { onCancel: () => void; saving: boolean }) {
  const [strokes, setStrokes] = useState<SketchStroke[]>(
    () => dress.sketchStrokes ?? [],
  );
  const [width, setWidth] = useState<SketchPenWidth>(2);
  const [live, setLive] = useState<SketchStroke>();
  const [error, setError] = useState("");
  const active = useRef<{ pointerId: number; stroke: SketchStroke } | null>(
    null,
  );
  const savingLock = useRef(false);
  const selectedPen = useRef<HTMLButtonElement>(null);
  const instructions = useId();
  useEffect(() => {
    selectedPen.current?.focus({ preventScroll: true });
  }, []);
  const base = useMemo(() => ({ ...dress, sketchStrokes: undefined }), [dress]);
  const finishedPaths = useMemo(
    () =>
      strokes.map((stroke, index) => (
        <StrokePath key={index} stroke={stroke} />
      )),
    [strokes],
  );

  const startStroke = (event: PointerEvent<SVGSVGElement>) => {
    if (
      savingLock.current ||
      active.current ||
      event.button !== 0 ||
      !event.isPrimary ||
      strokes.length >= MAX_SKETCH_STROKES
    )
      return;
    const point = pointerPoint(event);
    if (!point) return;
    // Suppress native SVG selection and dragging when drawing over a previous mark.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke = { width, points: [point] };
    active.current = { pointerId: event.pointerId, stroke };
    setLive(stroke);
  };
  const extendStroke = (event: PointerEvent<SVGSVGElement>) => {
    const current = active.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const point = pointerPoint(event);
    if (point) current.stroke = appendPoint(current.stroke, point);
    setLive(current.stroke);
  };
  const endStroke = (event: PointerEvent<SVGSVGElement>) => {
    const current = active.current;
    if (!current || current.pointerId !== event.pointerId) return;
    extendStroke(event);
    setStrokes((previous) => [...previous, current.stroke]);
    active.current = null;
    setLive(undefined);
  };
  const cancelStroke = (event: PointerEvent<SVGSVGElement>) => {
    if (active.current?.pointerId !== event.pointerId) return;
    active.current = null;
    setLive(undefined);
  };
  const save = async () => {
    if (active.current || savingLock.current) return;
    setError("");
    savingLock.current = true;
    try {
      await onSave(strokes);
    } catch {
      setError("표시를 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      savingLock.current = false;
    }
  };

  return (
    <>
      <p id={instructions} className="text-sm text-ink-muted">
        기억하고 싶은 부분에 손가락으로 그려 주세요.
      </p>
      <fieldset
        disabled={saving || Boolean(live)}
        className="mt-3 flex flex-wrap items-center gap-1"
      >
        <legend className="sr-only">펜 굵기</legend>
        <span aria-hidden="true" className="mr-1 text-xs text-ink-muted">
          펜 굵기
        </span>
        {SKETCH_PEN_WIDTHS.map((size) => (
          <button
            type="button"
            key={size}
            ref={size === 2 ? selectedPen : undefined}
            aria-pressed={width === size}
            onClick={() => setWidth(size)}
            className="inline-flex min-h-11 items-center gap-1 rounded-control border border-rule px-2 text-sm aria-pressed:border-accent aria-pressed:bg-accent-soft"
          >
            <span
              aria-hidden="true"
              className="w-3 rounded-full"
              style={{ height: size, backgroundColor: SKETCH_INK }}
            />
            {widthLabels[size]}
          </button>
        ))}
      </fieldset>
      <div className="mx-auto mt-3 w-full max-w-[47dvh]">
        <DressPreview
          dress={base}
          view="full"
          mode="visual"
          className="w-full"
          overlay={
            <svg
              aria-label="그림에 표시할 영역"
              aria-describedby={instructions}
              role="img"
              className="absolute inset-0 size-full touch-none select-none cursor-crosshair"
              viewBox={`0 0 ${SKETCH_FRAME.width} ${SKETCH_FRAME.height}`}
              onDragStart={(event) => event.preventDefault()}
              onPointerDown={startStroke}
              onPointerMove={extendStroke}
              onPointerUp={endStroke}
              onPointerCancel={cancelStroke}
              onLostPointerCapture={cancelStroke}
            >
              <g
                pointerEvents="none"
                fill="none"
                stroke={SKETCH_INK}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {finishedPaths}
                {live && <StrokePath stroke={live} />}
              </g>
            </svg>
          }
        />
      </div>
      {strokes.length >= MAX_SKETCH_STROKES && (
        <p role="status" className="mt-2 text-sm text-ink-muted">
          한 도안에 선을 {MAX_SKETCH_STROKES}개까지 남길 수 있어요.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStrokes((previous) => previous.slice(0, -1))}
          disabled={saving || Boolean(live) || !strokes.length}
          className="min-h-11 rounded-control border border-rule px-3 text-sm disabled:opacity-50"
        >
          되돌리기
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="ml-auto min-h-11 rounded-control px-3 text-sm"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || Boolean(live)}
          className="min-h-11 rounded-control bridal-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "저장 중…" : "표시 저장"}
        </button>
      </div>
    </>
  );
}
