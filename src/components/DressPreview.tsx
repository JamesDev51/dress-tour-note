import { useEffect, useMemo, useState } from "react";
import type { Dress, LocalAsset } from "../types/domain";
import { blobToDataUrl } from "../lib/image/processFace";
import { dressSvgMarkup, type DressSketchView } from "../lib/renderer/dressSvg";

export function DressPreview({
  dress,
  faceAsset,
  className = "",
  view = "full",
  includeFace = false,
}: {
  dress: Dress;
  faceAsset?: LocalAsset;
  className?: string;
  view?: DressSketchView;
  includeFace?: boolean;
}) {
  const [face, setFace] = useState<string>();
  useEffect(() => {
    let active = true;
    if (faceAsset && includeFace && view !== "back")
      blobToDataUrl(faceAsset.blob).then((x) => active && setFace(x));
    else setFace(undefined);
    return () => {
      active = false;
    };
  }, [faceAsset, includeFace, view]);
  const svg = useMemo(
    () => dressSvgMarkup(dress, face, includeFace, view),
    [dress, face, includeFace, view],
  );
  return (
    <div
      className={`dress-preview overflow-hidden rounded-preview border border-stone-200 bg-preview-surface ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
