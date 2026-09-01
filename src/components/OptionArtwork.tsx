import type { CSSProperties, HTMLAttributes } from "react";

export type OptionArtworkCategory =
  | "top"
  | "neckline"
  | "silhouette"
  | "fabric"
  | "color"
  | "train"
  | "waistline"
  | "back"
  | "detail";

type AtlasCell = { col: number; row: number };

const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = 10;
const ATLAS_URL = "/assets/option-atlas.webp";

const CELLS: Record<OptionArtworkCategory, Record<string, AtlasCell>> = {
  top: {
    strapless: { col: 0, row: 0 },
    offShoulder: { col: 1, row: 0 },
    spaghetti: { col: 2, row: 0 },
    wideStrap: { col: 3, row: 0 },
    halter: { col: 4, row: 0 },
    oneShoulder: { col: 5, row: 0 },
    shortSleeve: { col: 6, row: 0 },
    longSleeve: { col: 7, row: 0 },
  },
  neckline: {
    straight: { col: 0, row: 1 },
    sweetheart: { col: 1, row: 1 },
    v: { col: 2, row: 1 },
    square: { col: 3, row: 1 },
    scoop: { col: 4, row: 1 },
    high: { col: 5, row: 1 },
    illusion: { col: 6, row: 1 },
    asymmetric: { col: 7, row: 1 },
  },
  silhouette: {
    aLine: { col: 0, row: 2 },
    ballGown: { col: 1, row: 2 },
    fitAndFlare: { col: 2, row: 2 },
    mermaid: { col: 3, row: 2 },
    sheath: { col: 4, row: 2 },
    teaLength: { col: 5, row: 2 },
  },
  fabric: {
    mikadoSatin: { col: 0, row: 3 },
    lace: { col: 1, row: 3 },
    tulle: { col: 2, row: 3 },
    organzaChiffon: { col: 3, row: 3 },
    glitterBeaded: { col: 4, row: 3 },
    floral3D: { col: 5, row: 3 },
  },
  color: {
    pureWhite: { col: 0, row: 4 },
    ivory: { col: 1, row: 4 },
    champagne: { col: 2, row: 4 },
  },
  train: {
    none: { col: 0, row: 5 },
    sweep: { col: 1, row: 5 },
    chapel: { col: 2, row: 5 },
    cathedral: { col: 3, row: 5 },
  },
  waistline: {
    natural: { col: 0, row: 6 },
    basque: { col: 1, row: 6 },
    drop: { col: 2, row: 6 },
    empire: { col: 3, row: 6 },
  },
  back: {
    openBack: { col: 0, row: 7 },
    vBack: { col: 1, row: 7 },
    buttonBack: { col: 2, row: 7 },
    corsetBack: { col: 3, row: 7 },
    illusionBack: { col: 4, row: 7 },
    bowBack: { col: 5, row: 7 },
  },
  detail: {
    corset: { col: 0, row: 8 },
    draping: { col: 1, row: 8 },
    waistBow: { col: 2, row: 8 },
    backBow: { col: 3, row: 8 },
    pearl: { col: 4, row: 8 },
    sequin: { col: 5, row: 8 },
    floral: { col: 6, row: 8 },
    slit: { col: 7, row: 8 },
    sheer: { col: 0, row: 9 },
    detachableSleeve: { col: 1, row: 9 },
    overskirt: { col: 2, row: 9 },
    buttons: { col: 3, row: 9 },
  },
};

function position(cell: AtlasCell) {
  const x = (cell.col / (ATLAS_COLUMNS - 1)) * 100;
  const y = (cell.row / (ATLAS_ROWS - 1)) * 100;
  return `${x}% ${y}%`;
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
  const cell = id === "unknown" ? undefined : CELLS[category][id];

  if (!cell) {
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
      data-option-art-kind="generated-image"
      className={`block aspect-square h-full shrink-0 rounded-xl bg-[#fffdfa] bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${ATLAS_URL})`,
        backgroundSize: `${ATLAS_COLUMNS * 100}% ${ATLAS_ROWS * 100}%`,
        backgroundPosition: position(cell),
        ...style,
      }}
      {...props}
    />
  );
}
