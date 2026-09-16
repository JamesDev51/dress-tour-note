import { useEffect, useId, useMemo, useState } from "react";
import type { Dress, LocalAsset } from "../types/domain";
import { blobToDataUrl } from "../lib/image/processFace";
import {
  clearGarmentAssetCache,
  prepareGarmentArtwork,
  type GarmentAsset,
  type GarmentArtworkResult,
  type GarmentField,
} from "../lib/renderer/garment";
import {
  dressSvgMarkup,
  type DressSketchMode,
  type DressSketchView,
} from "../lib/renderer/dressSvg";

type PreparationState = "loading" | "ready" | "error";

const GARMENT_FIELD_LABELS: Readonly<Record<GarmentField, string>> = {
  topStyle: "상의",
  neckline: "네크라인",
  silhouette: "실루엣",
  waistline: "허리선",
  fabric: "소재",
  color: "색상",
  backStyle: "등 디자인",
  train: "트레인",
  details: "디테일",
};

function artworkStatusCopy(artwork: GarmentArtworkResult): string {
  switch (artwork.status) {
    case "ready":
      return "선택한 특징으로 재구성한 이미지예요.";
    case "partial": {
      if (artwork.assetIds.length === 0) {
        return artwork.view === "back"
          ? "뒤태를 아직 기록하지 않았어요. 등 디자인을 남기면 여기에서 확인할 수 있어요."
          : "드레스 형태를 기록하면 여기에서 확인할 수 있어요.";
      }
      const missing = artwork.missingFields.map(
        (field) => GARMENT_FIELD_LABELS[field],
      );
      const prefix =
        artwork.view === "back" && artwork.missingFields.includes("backStyle")
          ? "뒤태 미기록 · 형태 참고 이미지예요."
          : "형태 참고 이미지예요.";
      return missing.length > 0
        ? `${prefix} 미기록 항목: ${missing.join(" · ")}.`
        : "기록한 특징 일부를 반영한 형태 참고 이미지예요.";
    }
    case "unavailable":
      return "기록한 특징으로 이미지를 만들 수 없어요. 기록을 확인해 주세요.";
  }
}

function isRetryable(artwork: GarmentArtworkResult): boolean {
  return artwork.reason === "asset-load-failed";
}

function needsDetailsAction(artwork: GarmentArtworkResult): boolean {
  return (
    artwork.status === "partial" &&
    (artwork.assetIds.length === 0 ||
      (artwork.view === "back" && artwork.missingFields.includes("backStyle")))
  );
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
  dress,
  faceAsset,
  className = "",
  view = "full",
  includeFace = false,
  mode = "annotated",
  preparedArtwork,
  onOpenDetails,
}: {
  readonly dress: Dress;
  readonly faceAsset?: LocalAsset;
  readonly className?: string;
  readonly view?: DressSketchView;
  readonly includeFace?: boolean;
  readonly mode?: DressSketchMode;
  readonly preparedArtwork?: GarmentArtworkResult;
  readonly onOpenDetails?: () => void;
}) {
  const instanceNamespace = useId();
  const [face, setFace] = useState<string>();
  const [artwork, setArtwork] = useState<GarmentArtworkResult>();
  const [preparationState, setPreparationState] =
    useState<PreparationState>("loading");
  const [preparationError, setPreparationError] = useState<string>();
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (faceAsset && includeFace && view !== "back") {
      setFace(undefined);
      void blobToDataUrl(faceAsset.blob).then((dataUrl) => {
        if (active) setFace(dataUrl);
      });
    } else {
      setFace(undefined);
    }
    return () => {
      active = false;
    };
  }, [faceAsset, includeFace, view]);

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
        setPreparationError(
          error instanceof Error
            ? error.message
            : "선택한 특징 이미지를 준비하지 못했어요.",
        );
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
        ? dressSvgMarkup(dress, face, includeFace, view, mode, {
            preparedArtwork: artwork,
            namespace: instanceNamespace,
          })
        : "",
    [artwork, dress, face, includeFace, instanceNamespace, mode, view],
  );
  const rootClass = `dress-preview overflow-hidden rounded-preview border border-stone-200 bg-preview-surface ${mode === "visual" ? (view === "upper" ? "aspect-[80/77]" : "aspect-[3/4]") : ""} ${className}`;

  if (preparationState === "loading") {
    return (
      <div
        className={rootClass}
        data-garment-state="loading"
        aria-live="polite"
      >
        <div className="grid h-full min-h-32 place-items-center p-4 text-center text-sm leading-[22px] text-ink-muted">
          선택한 특징 이미지 준비 중…
        </div>
      </div>
    );
  }

  if (preparationState === "error") {
    return (
      <div className={rootClass} data-garment-state="error" role="alert">
        <div className="grid h-full min-h-32 place-items-center gap-3 p-4 text-center text-sm leading-[22px] text-error">
          <p>{preparationError ?? "선택한 특징 이미지를 준비하지 못했어요."}</p>
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
        </div>
      </div>
    );
  }

  if (!artwork) return null;

  const localAssets = artwork.markup.includes('href="/assets/garment/')
    ? artworkAssets(artwork)
    : [];
  const unrecordedBack =
    artwork.status === "partial" &&
    artwork.view === "back" &&
    artwork.assetIds.length === 0 &&
    artwork.missingFields.includes("backStyle");
  const handleAssetError = (asset: GarmentAsset) => {
    if (!asset.path.startsWith("/assets/garment/"))
      setPreparationError("로컬 의상 이미지 경로가 올바르지 않아요.");
    else setPreparationError("로컬 의상 이미지를 불러오지 못했어요.");
    setArtwork(undefined);
    setPreparationState("error");
  };

  return (
    <div className="min-w-0">
      <div
        className={`${rootClass} relative`}
        data-garment-state={artwork.status}
      >
        {unrecordedBack && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-4 text-center text-sm font-semibold text-ink-muted">
            뒤태 미기록
          </div>
        )}
        <div className="h-full" dangerouslySetInnerHTML={{ __html: svg }} />
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
      <p className="mt-2 break-keep text-xs leading-[18px] text-ink-muted">
        {artworkStatusCopy(artwork)}
      </p>
      {needsDetailsAction(artwork) && onOpenDetails && (
        <button
          type="button"
          className="mt-2 min-h-11 rounded-control border border-accent/30 bg-accent-soft px-3 text-xs font-semibold text-accent-copy"
          onClick={onOpenDetails}
        >
          {artwork.view === "back" ? "뒤태 기록하기" : "상세 기록 열기"}
        </button>
      )}
      {isRetryable(artwork) && (
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
