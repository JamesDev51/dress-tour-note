from pathlib import Path
import json
import re

root = Path('.')
editor_path = root / 'src/features/dress-editor/DressEditorPage.tsx'
editor = editor_path.read_text(encoding='utf-8')

editor = editor.replace(
    "import { DressPreview } from '../../components/DressPreview';\n",
    "import { DressPreview } from '../../components/DressPreview';\nimport { OptionArtwork, type OptionArtworkCategory } from '../../components/OptionArtwork';\n",
)
editor, removed = re.subn(
    r"\nfunction TinyIcon\(\{type\}:\{type:string\}\)\{.*?\}\n",
    "\n",
    editor,
    count=1,
)
if removed != 1:
    raise SystemExit('TinyIcon removal did not match exactly once')

new_single = '''  const singleSection=<T extends string>(category:OptionArtworkCategory,title:string,options:{id:T;label:string;technical?:string}[],value:T,onPick:(id:T)=>void,disabled?:(id:T)=>boolean)=><section className="mt-8"><h2 className="mb-3 text-[15px] font-bold">{title}</h2><div className="grid grid-cols-3 gap-2">{options.map(o=><OptionTile key={o.id} label={o.label} technical={o.technical} selected={value===o.id} disabled={disabled?.(o.id)} onClick={()=>onPick(o.id)} icon={<OptionArtwork category={category} id={o.id}/>}/>)}</div></section>;
  return'''
editor, count = re.subn(
    r"  const singleSection=.*?;\n  return",
    new_single,
    editor,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit('singleSection replacement did not match exactly once')

sections = {
    '어깨/끈은 어떻게 생겼나요?': 'top',
    '가슴선은 어떤 모양이었나요?': 'neckline',
    '치마는 어떻게 퍼졌나요?': 'silhouette',
    '주 소재는 어떤 느낌이었나요?': 'fabric',
    '색은 가까운 쪽을 골라주세요': 'color',
    '뒤로 끌리는 길이는?': 'train',
    '허리선은 어땠나요?': 'waistline',
    '뒤태는 어땠나요?': 'back',
}
for title, category in sections.items():
    old = f"singleSection('{title}'"
    if old not in editor:
        raise SystemExit(f'missing section call: {title}')
    editor = editor.replace(old, f"singleSection('{category}','{title}'")

old_detail = 'icon={<TinyIcon type={o.id}/>}}'
if old_detail not in editor:
    raise SystemExit('detail icon target missing')
editor = editor.replace(
    old_detail,
    'icon={<OptionArtwork category="detail" id={o.id}/>}}',
)
editor_path.write_text(editor, encoding='utf-8')

package_path = root / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
scripts = package['scripts']
scripts['assets'] = 'node scripts/generate-option-assets.mjs'
scripts['predev'] = 'npm run assets'
scripts['prebuild'] = 'npm run assets'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

(root / 'vite.config.ts').write_text("""import { defineConfig } from 'vite';
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
""", encoding='utf-8')

gitignore = (root / '.gitignore').read_text(encoding='utf-8').rstrip() + '\n/public/assets/options.svg\n'
(root / '.gitignore').write_text(gitignore, encoding='utf-8')

(root / 'src/components/OptionArtwork.test.tsx').write_text("""import { render, screen } from '@testing-library/react';
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
""", encoding='utf-8')

(root / 'docs/ASSET_GUIDE.md').write_text("""# 드레스 옵션 이미지 자산

드레스 선택 화면은 빌드 전에 생성되는 `public/assets/options.svg` SVG symbol sprite를 사용합니다.

- 전체 이미지: 58개
- 실제 디자인 옵션: 57개
- 공통 `기억 안 남` 이미지: 1개
- 카테고리: 어깨/끈 8, 넥라인 8, 실루엣 6, 소재 6, 색상 3, 트레인 4, 허리선 4, 뒤태 6, 디테일 12
- 생성 기준: 목 아래 크롭, 크림 배경, 아이보리 드레스, 로즈 브라운 라인
- 접근성: 이미지 자체는 장식 요소이고 버튼 텍스트가 옵션명을 제공합니다.
- 오프라인: Vite PWA precache에 sprite가 포함됩니다.

`npm run assets`로 자산을 다시 생성할 수 있습니다.
""", encoding='utf-8')

print('Applied generated option artwork integration.')
