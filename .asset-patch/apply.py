from __future__ import annotations

from pathlib import Path
import re

ROOT = Path('.')

option_artwork = r'''import type { SVGProps } from 'react';

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
'''

option_tile = r'''import { Check } from 'lucide-react';

export function OptionTile({
  label,
  technical,
  selected,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  technical?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`relative min-h-[136px] rounded-2xl border p-2 text-left transition active:scale-[.985] ${
        selected
          ? 'border-[#b96e63] bg-[#fff2ee] ring-2 ring-[#b96e63]/15'
          : 'border-stone-200 bg-white'
      } ${disabled ? 'opacity-35' : ''}`}
    >
      {selected && (
        <span className="absolute right-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-[#b96e63] text-white">
          <Check size={13} />
        </span>
      )}
      <div className="mb-2 grid h-[78px] place-items-center overflow-hidden rounded-xl bg-[#faf7f5] px-1 text-[#8d6c65]">
        {icon ?? <span className="text-2xl">?</span>}
      </div>
      <div className="text-[12px] font-semibold leading-[1.35] text-stone-800">{label}</div>
      {technical && <div className="mt-1 text-[9px] leading-tight text-stone-400">{technical}</div>}
    </button>
  );
}
'''

option_artwork_test = r'''import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OptionArtwork, type OptionArtworkCategory } from './OptionArtwork';

const cases: Array<[OptionArtworkCategory, string]> = [
  ['top', 'offShoulder'],
  ['neckline', 'sweetheart'],
  ['silhouette', 'aLine'],
  ['fabric', 'lace'],
  ['color', 'ivory'],
  ['train', 'chapel'],
  ['waistline', 'basque'],
  ['back', 'buttonBack'],
  ['detail', 'overskirt'],
  ['top', 'unknown'],
];

describe('OptionArtwork', () => {
  it.each(cases)('renders %s/%s through the generated sprite', (category, id) => {
    const { container } = render(<OptionArtwork category={category} id={id} />);
    const artwork = container.querySelector(`[data-option-art="${category}-${id}"]`);
    expect(artwork).toBeInTheDocument();
    const use = artwork?.querySelector('use');
    expect(use?.getAttribute('href')).toBe(
      id === 'unknown' ? '/assets/options.svg#common-unknown' : `/assets/options.svg#${category}-${id}`,
    );
  });

  it('is decorative and hidden from assistive technology', () => {
    render(<OptionArtwork category="top" id="strapless" data-testid="art" />);
    expect(screen.getByTestId('art')).toHaveAttribute('aria-hidden', 'true');
  });
});
'''

index_html = r'''<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#fff8f5" />
    <meta name="description" content="사진 대신 모양으로 기록하고 PDF로 옮기는 드레스투어 노트" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="그드레스 | 드레스투어 노트" />
    <meta property="og:description" content="드레스 특징을 이미지로 고르고, 복원 가능한 PDF 하나로 저장해요." />
    <meta name="twitter:card" content="summary" />
    <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
    <title>그드레스 | 드레스투어 노트</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'''

vite_config = r'''import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['assets/options.svg', 'icons/icon.svg'],
      manifest: {
        id: '/',
        name: '그드레스 - 드레스투어 노트',
        short_name: '그드레스',
        description: '사진 대신 모양으로 기록하는 드레스투어 노트',
        theme_color: '#fff8f5',
        background_color: '#fff8f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
'''

asset_guide = r'''# 드레스 옵션 이미지 자산

드레스 옵션 선택 화면은 `public/assets/options.svg`의 SVG symbol sprite를 사용합니다.

- 전체 symbol: 58개
- 실제 디자인 옵션: 57개
- 공통 `기억 안 남` 이미지: 1개
- 생성 기준: 승인된 목 아래 크롭, 크림 배경, 아이보리 드레스, 로즈 브라운 라인
- 생성 방식: `npm run assets`가 압축된 원본에서 sprite를 복원
- 로딩 방식: 같은 출처의 외부 SVG `<use>`
- 접근성: 옵션명은 버튼 텍스트가 제공하며 이미지는 장식 요소로 숨김

## 카테고리

| 카테고리 | 이미지 수 |
|---|---:|
| 어깨/끈 | 8 |
| 넥라인 | 8 |
| 실루엣 | 6 |
| 소재 | 6 |
| 색상 | 3 |
| 트레인 | 4 |
| 허리선 | 4 |
| 뒤태 | 6 |
| 디테일 | 12 |
'''

(ROOT / 'src/components/OptionArtwork.tsx').write_text(option_artwork, encoding='utf-8')
(ROOT / 'src/components/OptionTile.tsx').write_text(option_tile, encoding='utf-8')
(ROOT / 'src/components/OptionArtwork.test.tsx').write_text(option_artwork_test, encoding='utf-8')
(ROOT / 'index.html').write_text(index_html, encoding='utf-8')
(ROOT / 'vite.config.ts').write_text(vite_config, encoding='utf-8')
(ROOT / 'docs/ASSET_GUIDE.md').write_text(asset_guide, encoding='utf-8')

import json
package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
old_scripts = package['scripts']
package['scripts'] = {
    'assets': 'node scripts/generate-option-assets.mjs',
    'predev': 'npm run assets',
    'dev': old_scripts['dev'],
    'prebuild': 'npm run assets',
    'build': old_scripts['build'],
    'preview': old_scripts['preview'],
    'typecheck': old_scripts['typecheck'],
    'test': old_scripts['test'],
    'test:watch': old_scripts['test:watch'],
    'test:e2e': old_scripts['test:e2e'],
    'format': old_scripts['format'],
    'format:check': old_scripts['format:check'],
}
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

gitignore_path = ROOT / '.gitignore'
gitignore = gitignore_path.read_text(encoding='utf-8')
if 'public/assets/options.svg' not in gitignore:
    gitignore += 'public/assets/options.svg\n'
gitignore_path.write_text(gitignore, encoding='utf-8')

generator_path = ROOT / 'scripts/generate-option-assets.mjs'
generator = generator_path.read_text(encoding='utf-8')
generator = generator.replace(
    'writeFileSync(target, gunzipSync(compressed));',
    "const svg = gunzipSync(compressed).toString('utf8').replace(' style=\"display:none\"', '');\nwriteFileSync(target, svg);",
)
generator_path.write_text(generator, encoding='utf-8')

editor_path = ROOT / 'src/features/dress-editor/DressEditorPage.tsx'
editor = editor_path.read_text(encoding='utf-8')
editor = editor.replace(
    "import { DressPreview } from '../../components/DressPreview';\n",
    "import { DressPreview } from '../../components/DressPreview';\nimport { OptionArtwork, type OptionArtworkCategory } from '../../components/OptionArtwork';\n",
)
editor, removed = re.subn(r"\nfunction TinyIcon\(\{type\}:\{type:string\}\)\{.*?\}\n", "\n", editor, count=1)
if removed != 1:
    raise SystemExit('TinyIcon removal did not match exactly once')
new_single = """  const singleSection=<T extends string>(category:OptionArtworkCategory,title:string,options:{id:T;label:string;technical?:string}[],value:T,onPick:(id:T)=>void,disabled?:(id:T)=>boolean)=><section className=\"mt-8\"><h2 className=\"mb-3 text-[15px] font-bold\">{title}</h2><div className=\"grid grid-cols-3 gap-2\">{options.map(o=><OptionTile key={o.id} label={o.label} technical={o.technical} selected={value===o.id} disabled={disabled?.(o.id)} onClick={()=>onPick(o.id)} icon={<OptionArtwork category={category} id={o.id}/>}/>)}</div></section>;
  return"""
editor, count = re.subn(r"  const singleSection=.*?;\n  return", new_single, editor, count=1, flags=re.S)
if count != 1:
    raise SystemExit('singleSection replacement did not match exactly once')
section_categories = {
    '어깨/끈은 어떻게 생겼나요?': 'top',
    '가슴선은 어떤 모양이었나요?': 'neckline',
    '치마는 어떻게 퍼졌나요?': 'silhouette',
    '주 소재는 어떤 느낌이었나요?': 'fabric',
    '색은 가까운 쪽을 골라주세요': 'color',
    '뒤로 끌리는 길이는?': 'train',
    '허리선은 어땠나요?': 'waistline',
    '뒤태는 어땠나요?': 'back',
}
for title, category in section_categories.items():
    old = f"singleSection('{title}'"
    new = f"singleSection('{category}','{title}'"
    if old not in editor:
        raise SystemExit(f'missing section call: {title}')
    editor = editor.replace(old, new)
old_detail = "icon={<TinyIcon type={o.id}/>}}"
new_detail = "icon={<OptionArtwork category=\"detail\" id={o.id}/>}}"
if old_detail not in editor:
    raise SystemExit('detail icon replacement target missing')
editor = editor.replace(old_detail, new_detail)
editor_path.write_text(editor, encoding='utf-8')

sprite = (ROOT / 'public/assets/options.svg').read_text(encoding='utf-8')
expected = [
    'common-unknown',
    *[f'top-{x}' for x in ['strapless','offShoulder','spaghetti','wideStrap','halter','oneShoulder','shortSleeve','longSleeve']],
    *[f'neckline-{x}' for x in ['straight','sweetheart','v','square','scoop','high','illusion','asymmetric']],
    *[f'silhouette-{x}' for x in ['aLine','ballGown','fitAndFlare','mermaid','sheath','teaLength']],
    *[f'fabric-{x}' for x in ['mikadoSatin','lace','tulle','organzaChiffon','glitterBeaded','floral3D']],
    *[f'color-{x}' for x in ['pureWhite','ivory','champagne']],
    *[f'train-{x}' for x in ['none','sweep','chapel','cathedral']],
    *[f'waistline-{x}' for x in ['natural','basque','drop','empire']],
    *[f'back-{x}' for x in ['openBack','vBack','buttonBack','corsetBack','illusionBack','bowBack']],
    *[f'detail-{x}' for x in ['corset','draping','waistBow','backBow','pearl','sequin','floral','slit','sheer','detachableSleeve','overskirt','buttons']],
]
missing = [symbol for symbol in expected if f'id="{symbol}"' not in sprite]
if missing:
    raise SystemExit(f'missing SVG symbols: {missing}')
print(f'Integrated and validated {len(expected)} generated option artworks.')
