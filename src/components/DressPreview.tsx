import { useEffect, useMemo, useState } from "react";
import type { Dress, LocalAsset } from "../types/domain";
import {
  DressPersonBaseLoadError,
  loadDressPersonBase,
} from "../lib/image/dressPerson";
import { blobToDataUrl } from "../lib/image/processFace";
import { loadDressFabricTexture } from "../lib/image/dressFabric";
import {
  loadDressLayerAssets,
  type DressLayerAssets,
} from "../lib/image/dressLayers";
import { dressForPresentation } from "../lib/dress/options";
import { dressSvgMarkup } from "../lib/renderer/dressSvg";

export function DressPreview({
  dress,
  faceAsset,
  className = "",
}: {
  dress: Dress;
  faceAsset?: LocalAsset;
  className?: string;
}) {
  const [person, setPerson] = useState<string>();
  const [personError, setPersonError] = useState<string>();
  const [face, setFace] = useState<string>();
  const [fabricTexture, setFabricTexture] = useState<string>();
  const [layerAssets, setLayerAssets] = useState<DressLayerAssets>();
  useEffect(() => {
    let active = true;
    loadDressPersonBase()
      .then((dataUrl) => {
        if (active) setPerson(dataUrl);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPersonError(
          error instanceof DressPersonBaseLoadError
            ? error.message
            : "인물 베이스 이미지를 불러오지 못했어요.",
        );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (faceAsset)
      blobToDataUrl(faceAsset.blob).then((x) => active && setFace(x));
    else setFace(undefined);
    return () => {
      active = false;
    };
  }, [faceAsset]);
  const presentedDress = useMemo(() => dressForPresentation(dress), [dress]);
  const { neckline, silhouette, topStyle } = presentedDress;
  useEffect(() => {
    let active = true;
    setFabricTexture(undefined);
    loadDressFabricTexture(presentedDress.fabric)
      .then((texture) => {
        if (active) setFabricTexture(texture);
      })
      .catch(() => {
        if (active) setFabricTexture(undefined);
      });
    return () => {
      active = false;
    };
  }, [presentedDress.fabric]);
  useEffect(() => {
    let active = true;
    setLayerAssets(undefined);
    loadDressLayerAssets({ neckline, silhouette, topStyle })
      .then((assets) => {
        if (active) setLayerAssets(assets);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPersonError(
          error instanceof Error
            ? error.message
            : "드레스 레이어를 불러오지 못했어요.",
        );
      });
    return () => {
      active = false;
    };
  }, [neckline, silhouette, topStyle]);
  const svg = useMemo(
    () =>
      person && layerAssets
        ? dressSvgMarkup(
            presentedDress,
            person,
            layerAssets,
            face,
            true,
            fabricTexture,
          )
        : "",
    [fabricTexture, face, layerAssets, person, presentedDress],
  );
  if (personError)
    return (
      <div
        role="alert"
        className={`grid min-h-24 place-items-center rounded-preview bg-preview-surface px-4 text-center text-sm text-error ${className}`}
      >
        {personError}
      </div>
    );
  if (!person || !layerAssets)
    return (
      <div
        role="status"
        className={`grid min-h-24 place-items-center rounded-preview bg-preview-surface px-4 text-center text-sm text-stone-500 ${className}`}
      >
        미리보기를 준비하는 중...
      </div>
    );
  return (
    <div
      className={`dress-preview overflow-hidden rounded-preview border border-stone-200 bg-preview-surface ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
