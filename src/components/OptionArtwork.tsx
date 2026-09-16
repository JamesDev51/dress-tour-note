import { useState, type CSSProperties, type HTMLAttributes } from "react";

export type OptionArtworkCategory =
  | "top"
  | "neckline"
  | "silhouette"
  | "fabric"
  | "color"
  | "waistline"
  | "backStyle"
  | "train"
  | "details";

const artworkSources: Readonly<
  Record<OptionArtworkCategory, Readonly<Record<string, string>>>
> = {
  top: {
    strapless: "/assets/options/top/strapless.webp",
    offShoulder: "/assets/options/top/offShoulder.webp",
    strap: "/assets/options/top/strap.webp",
    spaghetti: "/assets/options/top/spaghetti.webp",
    wideStrap: "/assets/options/top/wideStrap.webp",
    halter: "/assets/options/top/halter.webp",
    oneShoulder: "/assets/options/top/oneShoulder.webp",
    shortSleeve: "/assets/options/top/shortSleeve.webp",
    longSleeve: "/assets/options/top/longSleeve.webp",
  },
  neckline: {
    straight: "/assets/options/neckline/straight.webp",
    sweetheart: "/assets/options/neckline/sweetheart.webp",
    v: "/assets/options/neckline/v.webp",
    square: "/assets/options/neckline/square.webp",
    scoop: "/assets/options/neckline/scoop.webp",
    high: "/assets/options/neckline/high.webp",
    illusion: "/assets/options/neckline/illusion.webp",
    asymmetric: "/assets/options/neckline/asymmetric.webp",
  },
  silhouette: {
    aLine: "/assets/options/silhouette/aLine.webp",
    ballGown: "/assets/options/silhouette/ballGown.webp",
    mermaid: "/assets/options/silhouette/mermaid.webp",
    empire: "/assets/options/silhouette/empire.webp",
    fitAndFlare: "/assets/options/silhouette/fitAndFlare.webp",
    sheath: "/assets/options/silhouette/sheath.webp",
    teaLength: "/assets/options/silhouette/teaLength.webp",
  },
  fabric: {
    mikadoSatin: "/assets/options/fabric/mikadoSatin.webp",
    lace: "/assets/options/fabric/lace.webp",
    organzaChiffon: "/assets/options/fabric/organzaChiffon.webp",
    subtleBeaded: "/assets/options/fabric/subtleBeaded.webp",
    ornateBeaded: "/assets/options/fabric/ornateBeaded.webp",
    floral3D: "/assets/options/fabric/floral3D.webp",
    tulle: "/assets/options/fabric/tulle.webp",
    glitterBeaded: "/assets/options/fabric/glitterBeaded.webp",
  },
  color: {
    pureWhite: "/assets/options/color/pureWhite.webp",
    ivory: "/assets/options/color/ivory.webp",
    champagne: "/assets/options/color/champagne.webp",
  },
  waistline: {
    natural: "/assets/options/waistline/natural.webp",
    basque: "/assets/options/waistline/basque.webp",
    drop: "/assets/options/waistline/drop.webp",
    empire: "/assets/options/waistline/empire.webp",
  },
  backStyle: {
    openBack: "/assets/options/back/openBack.webp",
    vBack: "/assets/options/back/vBack.webp",
    buttonBack: "/assets/options/back/buttonBack.webp",
    corsetBack: "/assets/options/back/corsetBack.webp",
    illusionBack: "/assets/options/back/illusionBack.webp",
    bowBack: "/assets/options/back/bowBack.webp",
  },
  train: {
    none: "/assets/options/train/none.webp",
    sweep: "/assets/options/train/sweep.webp",
    chapel: "/assets/options/train/chapel.webp",
    cathedral: "/assets/options/train/cathedral.webp",
  },
  details: {
    corset: "/assets/options/detail/corset.webp",
    draping: "/assets/options/detail/draping.webp",
    waistBow: "/assets/options/detail/waistBow.webp",
    backBow: "/assets/options/detail/backBow.webp",
    pearl: "/assets/options/detail/pearl.webp",
    sequin: "/assets/options/detail/sequin.webp",
    floral: "/assets/options/detail/floral.webp",
    slit: "/assets/options/detail/slit.webp",
    sheer: "/assets/options/detail/sheer.webp",
    detachableSleeve: "/assets/options/detail/detachableSleeve.webp",
    overskirt: "/assets/options/detail/overskirt.webp",
    buttons: "/assets/options/detail/buttons.webp",
  },
};

function sourceFor(category: OptionArtworkCategory, id: string) {
  return artworkSources[category][id];
}

export function OptionArtwork({
  category,
  id,
  className = "",
  style,
  ...props
}: {
  category: OptionArtworkCategory;
  id: string;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLSpanElement>, "id">) {
  const source = sourceFor(category, id);
  const [loadedSource, setLoadedSource] = useState<string>();
  const [failedSource, setFailedSource] = useState<string>();
  const failed = failedSource === source;
  const loading = Boolean(source) && !failed && loadedSource !== source;

  if (!source || id === "unknown") {
    return (
      <span
        aria-hidden="true"
        data-option-art={`${category}-${id}`}
        data-option-art-kind="unknown"
        className={`grid aspect-square h-full place-items-center rounded-xl bg-artwork-surface text-xl font-semibold text-stone-300 ${className}`}
        style={style}
        {...props}
      >
        ?
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      data-option-art={`${category}-${id}`}
      data-option-art-kind={failed ? "image-error" : "generated-image"}
      data-option-art-loading={loading ? "true" : "false"}
      className={`relative grid aspect-square h-full w-full place-items-center overflow-hidden rounded-xl bg-shell ${className}`}
      style={style}
      {...props}
    >
      {failed ? (
        <span className="px-2 text-center text-xs font-semibold leading-5 text-stone-400">
          이미지를 불러오지 못했어요.
        </span>
      ) : (
        <img
          src={source}
          alt=""
          aria-hidden="true"
          width={512}
          height={512}
          loading="lazy"
          className="block h-full w-full object-cover"
          onLoad={() => setLoadedSource(source)}
          onError={() => setFailedSource(source)}
        />
      )}
      {loading && (
        <span
          data-option-art-loading-indicator
          className="absolute inset-0 grid place-items-center bg-artwork-surface/80 text-xs font-semibold text-ink-muted"
        >
          불러오는 중
        </span>
      )}
    </span>
  );
}
