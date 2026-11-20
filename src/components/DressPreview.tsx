import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import type { Dress, LocalAsset } from "../types/domain";
import { previewAspectRatio } from "../lib/renderer/previewFrame";
import { activeAppearance } from "../lib/dress/activeOptions";
import {
  clearGarmentAssetCache,
  prepareGarmentArtwork,
  type GarmentAsset,
  type GarmentArtworkResult,
} from "../lib/renderer/garment";
import {
  dressSvgMarkup,
  type DressSketchMode,
  type DressSketchView,
} from "../lib/renderer/dressSvg";

type PreparationState = "loading" | "ready" | "error";

function artworkStatusCopy(artwork: GarmentArtworkResult): string | null {
  if (artwork.status === "unavailable")
    return "기록한 특징으로 그림을 만들지 못했어요. 다시 시도해 주세요.";
  if (artwork.assetIds.length === 0)
    return "전체 모양부터 골라 주세요. 고른 특징이 그림에 반영돼요.";
  if (
    artwork.missingFields.includes("topStyle") ||
    artwork.missingFields.includes("neckline")
  )
    return "기록한 치마 모양이에요. 상체를 고르면 전체 모습을 볼 수 있어요.";
  return null;
}

function isRetryable(artwork: GarmentArtworkResult): boolean {
  return artwork.reason === "asset-load-failed";
}

function needsDetailsAction(artwork: GarmentArtworkResult): boolean {
  return artwork.status === "partial" && artwork.assetIds.length === 0;
}

function artworkAssets(artwork: GarmentArtworkResult): readonly GarmentAsset[] {
  return [
    ...artwork.layers.map(({ asset }) => asset),
    ...artwork.textures.map(({ asset }) => asset),
    ...(artwork.detailAssets ?? []),
  ].filter(
    (asset, index, assets) =>
      assets.findIndex((candidate) => candidate.assetId === asset.assetId) ===
      index,
  );
}

function loadBrowserArtwork(
  dress: Dress,
  view: DressSketchView,
  signal: AbortSignal,
  instanceNamespace: string,
): Promise<GarmentArtworkResult> {
  return prepareGarmentArtwork(dress, {
    view,
    embedAssets: false,
    namespace: `preview-${instanceNamespace}-${dress.id}-${view}`,
    signal,
  });
}

export function DressPreview({
  dress: sourceDress,
  className = "",
  view: requestedView = "full",
  mode = "annotated",
  preparedArtwork,
  onOpenDetails,
  allowRetry = true,
  overlay,
}: {
  readonly dress: Dress;
  readonly faceAsset?: LocalAsset;
  readonly className?: string;
  readonly view?: DressSketchView;
  readonly includeFace?: boolean;
  readonly mode?: DressSketchMode;
  readonly preparedArtwork?: GarmentArtworkResult;
  readonly onOpenDetails?: () => void;
  readonly allowRetry?: boolean;
  readonly overlay?: ReactNode;
}) {
  const instanceNamespace = useId();
  const dress = useMemo(() => activeAppearance(sourceDress), [sourceDress]);
  const view = requestedView === "upper" ? "upper" : "full";
  const [artwork, setArtwork] = useState<GarmentArtworkResult>();
  const [preparationState, setPreparationState] =
    useState<PreparationState>("loading");
  const [preparationError, setPreparationError] = useState<string>();
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (preparedArtwork && preparedArtwork.view === view) {
      setArtwork(preparedArtwork);
      setPreparationError(undefined);
      setPreparationState("ready");
      return;
    }

    let active = true;
    const controller = new AbortController();
    setArtwork(undefined);
    setPreparationError(undefined);
    setPreparationState("loading");
    void loadBrowserArtwork(
      dress,
      view,
      controller.signal,
      instanceNamespace,
    ).then(
      (result) => {
        if (!active) return;
        setArtwork(result);
        setPreparationState("ready");
      },
      (error: unknown) => {
        if (
          !active ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;
        setArtwork(undefined);
        setPreparationError("드레스 그림을 불러오지 못했어요.");
        setPreparationState("error");
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [dress, instanceNamespace, preparedArtwork, retryKey, view]);

  const svg = useMemo(
    () =>
      artwork
        ? dressSvgMarkup(dress, undefined, false, view, mode, {
            preparedArtwork: artwork,
            namespace: instanceNamespace,
          })
        : "",
    [artwork, dress, instanceNamespace, mode, view],
  );
  // Moving the pen updates the overlay without replacing the artwork DOM.
  const markup = useMemo(() => ({ __html: svg }), [svg]);
  const rootClass = `dress-preview overflow-hidden rounded-preview border border-stone-200 bg-preview-surface ${className}`;
  const frameStyle =
    mode === "visual" ? { aspectRatio: previewAspectRatio[view] } : undefined;

  if (preparationState === "loading") {
    return (
      <div
        className={rootClass}
        style={frameStyle}
        data-garment-state="loading"
        aria-live="polite"
      >
        <div className="grid h-full min-h-32 place-items-center p-4 text-center text-sm leading-[22px] text-ink-muted">
          드레스 그림 준비 중…
        </div>
      </div>
    );
  }

  if (preparationState === "error") {
    return (
      <div
        className={rootClass}
        style={frameStyle}
        data-garment-state="error"
        role="alert"
      >
        <div className="grid h-full min-h-32 place-items-center gap-3 p-4 text-center text-sm leading-[22px] text-error">
          <p>{preparationError ?? "드레스 그림을 불러오지 못했어요."}</p>
          {allowRetry && (
            <button
              type="button"
              className="min-h-11 rounded-control border border-error/30 bg-error-surface px-4 font-semibold text-error"
              onClick={() => {
                clearGarmentAssetCache();
                setRetryKey((value) => value + 1);
              }}
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!artwork) return null;

  const statusCopy = artworkStatusCopy(artwork);
  const localAssets = artwork.markup.includes('href="/assets/garment/')
    ? artworkAssets(artwork)
    : [];
  const handleAssetError = (asset: GarmentAsset) => {
    console.error("Garment asset failed", asset.assetId, asset.path);
    setPreparationError("드레스 그림을 불러오지 못했어요.");
    setArtwork(undefined);
    setPreparationState("error");
  };

  return (
    <div className="min-w-0">
      <div
        className={`${rootClass} relative artwork-reveal`}
        style={frameStyle}
        data-garment-state={artwork.status}
      >
        <div className="h-full" dangerouslySetInnerHTML={markup} />
        {overlay}
      </div>
      {localAssets.map((asset) => (
        <img
          key={asset.assetId}
          src={asset.path}
          alt=""
          aria-hidden="true"
          className="hidden"
          data-garment-asset-check={asset.assetId}
          onError={() => handleAssetError(asset)}
        />
      ))}
      {statusCopy && (
        <p className="mt-2 break-keep text-xs leading-[18px] text-ink-muted">
          {statusCopy}
        </p>
      )}
      {needsDetailsAction(artwork) && onOpenDetails && (
        <button
          type="button"
          className="mt-2 min-h-11 rounded-control border border-accent/30 bg-accent-soft px-3 text-xs font-semibold text-accent-copy"
          onClick={onOpenDetails}
        >
          자세히 기록하기
        </button>
      )}
      {allowRetry && isRetryable(artwork) && (
        <button
          type="button"
          className="mt-2 min-h-11 rounded-control border border-stone-200 bg-white px-3 text-xs font-semibold text-ink-muted"
          onClick={() => {
            clearGarmentAssetCache();
            setRetryKey((value) => value + 1);
          }}
        >
          이미지 다시 불러오기
        </button>
      )}
    </div>
  );
}
