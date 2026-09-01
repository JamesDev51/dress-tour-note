import { useState, type CSSProperties, type HTMLAttributes } from "react";
import type {
  DressColor,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
} from "../types/domain";

export type OptionArtworkCategory =
  "top" | "neckline" | "silhouette" | "fabric" | "color";

type ArtworkIds = {
  top: Exclude<TopStyle, "unknown" | "spaghetti" | "wideStrap" | "oneShoulder">;
  neckline: Exclude<Neckline, "unknown" | "high" | "illusion">;
  silhouette: Exclude<
    Silhouette,
    "unknown" | "fitAndFlare" | "sheath" | "teaLength"
  >;
  fabric: Exclude<Fabric, "unknown" | "tulle" | "glitterBeaded">;
  color: Exclude<DressColor, "unknown">;
};

type ArtworkSourceMap = {
  readonly [Category in OptionArtworkCategory]: Readonly<
    Record<ArtworkIds[Category], string>
  >;
};

const ARTWORK_SRC = {
  top: {
    strapless: "/assets/options/top/strapless.webp",
    offShoulder: "/assets/options/top/offShoulder.webp",
    strap: "/assets/options/top/strap.webp",
    halter: "/assets/options/top/halter.webp",
    shortSleeve: "/assets/options/top/shortSleeve.webp",
    longSleeve: "/assets/options/top/longSleeve.webp",
  },
  neckline: {
    straight: "/assets/options/neckline/straight.webp",
    sweetheart: "/assets/options/neckline/sweetheart.webp",
    v: "/assets/options/neckline/v.webp",
    square: "/assets/options/neckline/square.webp",
    scoop: "/assets/options/neckline/scoop.webp",
    asymmetric: "/assets/options/neckline/asymmetric.webp",
  },
  silhouette: {
    aLine: "/assets/options/silhouette/aLine.webp",
    ballGown: "/assets/options/silhouette/ballGown.webp",
    mermaid: "/assets/options/silhouette/mermaid.webp",
    empire: "/assets/options/silhouette/empire.webp",
  },
  fabric: {
    mikadoSatin: "/assets/options/fabric/mikadoSatin.webp",
    lace: "/assets/options/fabric/lace.webp",
    organzaChiffon: "/assets/options/fabric/organzaChiffon.webp",
    subtleBeaded: "/assets/options/fabric/subtleBeaded.webp",
    ornateBeaded: "/assets/options/fabric/ornateBeaded.webp",
    floral3D: "/assets/options/fabric/floral3D.webp",
  },
  color: {
    pureWhite: "/assets/options/color/pureWhite.webp",
    ivory: "/assets/options/color/ivory.webp",
    champagne: "/assets/options/color/champagne.webp",
  },
} satisfies ArtworkSourceMap;

function sourceFor(category: OptionArtworkCategory, id: string) {
  return Object.entries(ARTWORK_SRC[category]).find(
    ([candidate]) => candidate === id,
  )?.[1];
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
  const [imageError, setImageError] = useState(false);
  const source = sourceFor(category, id);

  if (!source || id === "unknown") {
    return (
      <span
        aria-hidden="true"
        data-option-art={`${category}-${id}`}
        data-option-art-kind="unknown"
        className={`grid aspect-square h-full place-items-center rounded-xl bg-[#f7f2ef] text-xl font-semibold text-stone-300 ${className}`}
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
      data-option-art-kind={imageError ? "image-error" : "generated-image"}
      className={`grid aspect-square h-full w-full place-items-center overflow-hidden rounded-xl bg-[#fffdfa] ${className}`}
      style={style}
      {...props}
    >
      {imageError ? (
        <span className="px-2 text-center text-[11px] font-semibold leading-tight text-stone-400">
          이미지를 불러오지 못했어요.
        </span>
      ) : (
        <img
          src={source}
          alt=""
          aria-hidden="true"
          width={512}
          height={512}
          className="block h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </span>
  );
}
