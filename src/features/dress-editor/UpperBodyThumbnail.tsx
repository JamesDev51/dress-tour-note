import { useId, useMemo, useState } from "react";
import { OptionArtwork } from "../../components/OptionArtwork";
import type { Neckline, TopStyle } from "../../types/domain";
import { upperPreviewArtwork } from "../../lib/renderer/garment/upperPreview";

export function UpperBodyThumbnail({
  topStyle,
  neckline,
}: {
  topStyle: TopStyle;
  neckline: Neckline;
}) {
  const instance = useId();
  const artwork = useMemo(
    () => upperPreviewArtwork(topStyle, neckline, `upper-choice-${instance}`),
    [instance, neckline, topStyle],
  );
  const paths = [
    ...new Set(
      [...artwork.layers, ...artwork.textures].map(({ asset }) => asset.path),
    ),
  ];
  const [loaded, setLoaded] = useState<readonly string[]>([]);
  const [failed, setFailed] = useState<readonly string[]>([]);
  const isFailed = paths.some((path) => failed.includes(path));
  const loading = paths.some((path) => !loaded.includes(path));
  return (
    <span
      aria-hidden="true"
      className="relative block h-full w-full"
      data-upper-preview={`${topStyle}-${neckline}`}
    >
      <span
        className="block h-full w-full [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: artwork.markup }}
      />
      {paths.map((path) => (
        <img
          key={path}
          src={path}
          alt=""
          className="hidden"
          onLoad={() => setLoaded((current) => [...current, path])}
          onError={() => setFailed((current) => [...current, path])}
        />
      ))}
      {(loading || isFailed) && (
        <span className="absolute inset-0 grid place-items-center bg-artwork-surface/90 px-2 text-center text-xs text-ink-muted">
          {isFailed
            ? "이미지를 불러오지 못했어요. 설명으로 선택할 수 있어요."
            : "불러오는 중"}
        </span>
      )}
    </span>
  );
}

// Use the same bare-shouldered example for comparing bust-line shapes until
// the user chooses straps or sleeves. This is illustration only, not a pick.
export function NecklineThumbnail({
  topStyle,
  neckline,
}: {
  topStyle: TopStyle;
  neckline: Neckline;
}) {
  if (
    topStyle === "unknown" &&
    !["straight", "square", "v", "scoop", "sweetheart"].includes(neckline)
  ) {
    return <OptionArtwork category="neckline" id={neckline} />;
  }
  return (
    <UpperBodyThumbnail
      topStyle={topStyle === "unknown" ? "strapless" : topStyle}
      neckline={neckline}
    />
  );
}
