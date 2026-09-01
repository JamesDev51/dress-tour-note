type OptionIllustrationCategory =
  | 'topStyle'
  | 'neckline'
  | 'silhouette'
  | 'fabric'
  | 'color'
  | 'train'
  | 'waistline'
  | 'backStyle'
  | 'detail';

type AtlasSpec = {
  src: string;
  columns: number;
  rows: number;
  ids: readonly string[];
};

const atlases: Record<OptionIllustrationCategory, AtlasSpec> = {
  topStyle: {
    src: '/assets/options/top-style.webp',
    columns: 4,
    rows: 2,
    ids: ['strapless', 'offShoulder', 'spaghetti', 'wideStrap', 'halter', 'oneShoulder', 'shortSleeve', 'longSleeve'],
  },
  neckline: {
    src: '/assets/options/neckline.webp',
    columns: 4,
    rows: 2,
    ids: ['straight', 'sweetheart', 'v', 'square', 'scoop', 'high', 'illusion', 'asymmetric'],
  },
  silhouette: {
    src: '/assets/options/silhouette.webp',
    columns: 3,
    rows: 2,
    ids: ['aLine', 'ballGown', 'fitAndFlare', 'mermaid', 'sheath', 'teaLength'],
  },
  fabric: {
    src: '/assets/options/fabric.webp',
    columns: 3,
    rows: 2,
    ids: ['mikadoSatin', 'lace', 'tulle', 'organzaChiffon', 'glitterBeaded', 'floral3D'],
  },
  color: {
    src: '/assets/options/color.webp',
    columns: 3,
    rows: 1,
    ids: ['pureWhite', 'ivory', 'champagne'],
  },
  train: {
    src: '/assets/options/train.webp',
    columns: 2,
    rows: 2,
    ids: ['none', 'sweep', 'chapel', 'cathedral'],
  },
  waistline: {
    src: '/assets/options/waistline.webp',
    columns: 2,
    rows: 2,
    ids: ['natural', 'basque', 'drop', 'empire'],
  },
  backStyle: {
    src: '/assets/options/back-style.webp',
    columns: 3,
    rows: 2,
    ids: ['openBack', 'vBack', 'buttonBack', 'corsetBack', 'illusionBack', 'bowBack'],
  },
  detail: {
    src: '/assets/options/detail.webp',
    columns: 4,
    rows: 3,
    ids: ['corset', 'draping', 'waistBow', 'backBow', 'pearl', 'sequin', 'floral', 'slit', 'sheer', 'detachableSleeve', 'overskirt', 'buttons'],
  },
};

export function OptionIllustration({
  category,
  id,
}: {
  category: OptionIllustrationCategory;
  id: string;
}) {
  if (id === 'unknown') {
    return (
      <span
        aria-hidden="true"
        className="grid h-full w-full place-items-center rounded-xl bg-[radial-gradient(circle_at_50%_42%,#fff_0,#fff_32%,#f6efec_100%)] text-2xl font-black text-stone-300"
      >
        ?
      </span>
    );
  }

  const atlas = atlases[category];
  const index = atlas.ids.indexOf(id);
  if (index < 0) {
    return <span aria-hidden="true" className="grid h-full w-full place-items-center text-xl text-stone-300">✧</span>;
  }

  const column = index % atlas.columns;
  const row = Math.floor(index / atlas.columns);
  const x = atlas.columns === 1 ? 0 : (column / (atlas.columns - 1)) * 100;
  const y = atlas.rows === 1 ? 0 : (row / (atlas.rows - 1)) * 100;

  return (
    <span
      aria-hidden="true"
      className="block h-full w-full bg-no-repeat"
      style={{
        backgroundImage: `url(${atlas.src})`,
        backgroundPosition: `${x}% ${y}%`,
        backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
      }}
    />
  );
}

export type { OptionIllustrationCategory };
