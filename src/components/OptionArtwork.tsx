import type { SVGProps } from 'react';

export type OptionArtworkCategory =
  | 'top'
  | 'neckline'
  | 'silhouette'
  | 'fabric'
  | 'color'
  | 'train'
  | 'waistline'
  | 'back'
  | 'detail';

const TALL_DETAIL_IDS = new Set(['slit', 'overskirt']);

function artworkViewBox(category: OptionArtworkCategory, id: string) {
  if (category === 'train') return '0 0 360 300';
  if (category === 'silhouette' || category === 'color') return '0 0 300 300';
  if (category === 'detail' && TALL_DETAIL_IDS.has(id)) return '0 0 300 300';
  return '0 0 300 220';
}

export function OptionArtwork({
  category,
  id,
  className = '',
  ...props
}: {
  category: OptionArtworkCategory;
  id: string;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, 'id'>) {
  const symbolId = id === 'unknown' ? 'common-unknown' : `${category}-${id}`;
  const href = `/assets/options.svg#${symbolId}`;

  return (
    <svg
      viewBox={artworkViewBox(category, id)}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-option-art={`${category}-${id}`}
      className={`h-full w-full overflow-visible ${className}`}
      {...props}
    >
      <use href={href} width="100%" height="100%" />
    </svg>
  );
}
