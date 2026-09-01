# 드레스노트 Design System

## 1. Atmosphere & Identity

드레스노트는 피팅룸에서 손이 먼저 움직이는 조용한 기록 도구다. Warm cream surfaces, Noto Korean typography, restrained blush accents, and generous square garment artwork keep attention on the shape being remembered. The signature is a calm cream canvas with one blush selection language: the chosen dress detail should feel marked, not decorated.

This document extracts the existing visual system before the option-asset and selector work described in `.omo/plans/dress-note-option-assets-branding.md`. It is a preservation contract, not a broad visual rebrand.

## 2. Color

### Palette

| Role                | Token                                     | Value                            | Usage                                                                              |
| ------------------- | ----------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| App canvas          | `--color-canvas-warm`                     | `#f4efec`                        | Warm theme root and page background                                                |
| App canvas clean    | `--color-canvas-clean`                    | `#eef0f2`                        | Clean theme root                                                                   |
| Shell surface       | `--color-surface-shell`                   | `#fffdfa`                        | Warm app shell                                                                     |
| Shell surface clean | `--color-surface-shell-clean`             | `#ffffff`                        | Clean app shell and elevated cards                                                 |
| Soft accent surface | `--color-accent-soft`                     | `#fff2ee`                        | Selected cards, warm callouts                                                      |
| Artwork surface     | `--color-artwork-surface`                 | `#faf7f5`                        | Image and unknown-artwork backing                                                  |
| Preview surface     | `--color-preview-surface`                 | `#fbf8f6`                        | Dress preview frame and SVG backdrop                                               |
| Primary text        | `--color-ink`                             | `#211d1c` / Tailwind `stone-900` | Main copy and controls                                                             |
| Secondary text      | `--color-ink-secondary`                   | Tailwind `stone-500`             | Supporting copy                                                                    |
| Muted text          | `--color-ink-muted`                       | `#6f6662`                        | Metadata, hints, disabled-adjacent copy; the global override keeps contrast usable |
| Accent              | `--color-accent`                          | `#b96e63`                        | Selection, primary blush action, progress                                          |
| Accent dark         | `--color-accent-dark`                     | `#a75e55` / `#a85f55`            | Small labels, links, icon accents                                                  |
| Accent copy         | `--color-accent-copy`                     | `#8b5750`                        | Warm callout text                                                                  |
| Selection tint      | `--color-selection`                       | `#f1d5ce`                        | Text selection                                                                     |
| Error surface/copy  | `--color-error-surface` / `--color-error` | Tailwind `red-50` / `red-700`    | Destructive and import errors                                                      |

### Rules

- The palette is warm and low-saturation. Blush is the single interactive accent; it is not used as decorative noise.
- Existing Tailwind stone/amber/red/emerald utility colors remain semantic status colors. New work must use an existing token or add the semantic token here first.
- Surfaces use a mixed depth strategy: tonal difference first, a one-pixel border for control boundaries, and soft tinted shadows only for genuinely elevated content.
- The dress SVG uses the same warm preview surface and neutral garment shadow family so the browser preview and derived PDF remain visually related.

## 3. Typography

### Scale

| Level        | Existing value       | Weight/leading      | Usage                                          |
| ------------ | -------------------- | ------------------- | ---------------------------------------------- |
| Display      | `28px` or `1.875rem` | 900 / `1.2`         | Mobile page titles and hero heading            |
| Section      | `20px` or `1.25rem`  | 900                 | Card/section heading                           |
| Body         | `14px`               | 400 / `1.5–1.7`     | Explanations and normal controls               |
| Body compact | `12px`               | 600 / `1.35`        | Option labels and compact metadata             |
| Caption      | `10–11px`            | 500–600 / `1.3–1.5` | Technical labels, helper copy, status metadata |

### Font Stack

- Primary: `Noto Sans KR`, then `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- Optional preference: `Noto Serif KR`, serif, applied to the app root and form controls when the stored serif preference is active.
- Maximum families: two. The Noto files are already bundled locally; no runtime font CDN is allowed.

### Rules

- Korean copy uses sentence case and short, direct labels.
- Body copy stays readable at the mobile shell width. Do not create a single-character Korean orphan or split a subject from its predicate when a natural wrap is available.
- Small copy may use the existing 10–12px caption band only for metadata/technical text; user instructions and errors remain at body size.
- Large headings use tight tracking (`-0.04em`) and `font-black` only where the current surface already does so.

## 4. Spacing & Layout

### Base Unit

All intent-level spacing derives from a **4px base unit**.

| Token       | Value  | Usage                                            |
| ----------- | ------ | ------------------------------------------------ |
| `--space-1` | `4px`  | Icon-to-label and tight inline gaps              |
| `--space-2` | `8px`  | Compact groups and option-grid gaps              |
| `--space-3` | `12px` | Input/card inner padding and metadata separation |
| `--space-4` | `16px` | Standard page and card padding                   |
| `--space-5` | `20px` | Comfortable section/card padding                 |
| `--space-6` | `24px` | Hero and major card padding                      |
| `--space-7` | `28px` | Preview/card optical separation                  |
| `--space-8` | `32px` | Page-level separation and large radius context   |

### Grid and responsive contract

- Product shell: `min-width: 320px`, `width: 100%`, `max-width: 480px`, centered only when the viewport is wider than the product scope.
- Mobile editor: each active option section is a two-column CSS grid with a `--space-2`/8px gap. Cards fill their tracks; artwork is square and card-width rather than a fixed 78px thumbnail.
- Breakpoints: 320px is the narrow boundary, 390px is the primary QA width, 480px is the shell ceiling, and 768px is support-context only. No desktop product layout is introduced.
- Browser mechanics such as `env(safe-area-inset-*)`, `minmax()`, `aspect-ratio`, `clamp()`, and intrinsic sizing may stay raw. Product spacing decisions map to the 4px rhythm.
- Sticky preview and bottom actions must reserve their scroll space and may become static below 768px according to the existing mobile rule.

## 5. Components

### Mobile shell

- **Structure**: app root → centered `app-shell` → routed page; global toast/update notices are fixed overlays.
- **Variants**: warm/clean theme, sans/serif font preference.
- **Spacing**: safe-area-aware top/bottom offsets; shell width contract above.
- **States**: default, toast/status, update-available; route loading/error states remain page-owned.
- **Accessibility**: routed landmarks, `role=status` for transient announcements, keyboard-reachable links/buttons, no overlay blocking primary content.
- **Motion**: existing CSS transitions only; do not add decorative shell motion.
- **Layout**: shell primitive; document scroll owns page content; mobile sticky surfaces can be static at narrow widths.

### Brand header

- **Structure**: semantic `header` with home brand link and privacy/settings link.
- **Variants**: warm/clean inherited from shell.
- **Spacing**: 20px horizontal inset and safe-area-aware top padding.
- **States**: default, keyboard focus, visited/current route link.
- **Accessibility**: text link carries the product name; settings remains explicit Korean link text.
- **Motion**: none beyond existing link behavior.
- **Layout**: header row / cluster.

### Option tile

- **Structure**: native `button` → selected check badge (when selected) → square artwork region → Korean label → optional technical label.
- **Variants**: selected, unselected, disabled, unknown artwork, individual-image artwork, image-load error fallback.
- **Spacing**: 8px outer padding, 8px artwork-to-label gap, artwork region square and track-sized, 8px grid gap.
- **States**: default, hover where supported, active press (`scale(.985)`), visible keyboard focus, selected (`#fff2ee` + blush border/ring), disabled (`opacity` reduction without removing label), loading/error image fallback.
- **Accessibility**: native button, `aria-pressed`, visible focus, disabled remains understandable, artwork is decorative because the button label is the accessible name; a broken image never removes the label or target.
- **Motion**: 100–150ms ease-out for state/press feedback; honor reduced motion.
- **Layout**: responsive two-column grid; target remains at least 44px even when artwork content changes.

### Dress preview

- **Structure**: framed preview container → canonical SVG composition → raster person base → dynamic dress layers → optional clipped local face.
- **Variants**: no-face, face-included, loading, base-image error.
- **Spacing**: 28px outer radius and existing preview padding/layout context.
- **States**: loaded, loading, error; no silent geometric-body fallback once the raster contract is active.
- **Accessibility**: SVG has a Korean `aria-label`; loading/error is direct and readable; face-excluded output contains no face reference.
- **Motion**: none required; export waits for the same loaded base bytes.
- **Layout**: media frame with intrinsic aspect ratio; SVG and PDF use the same 720×1280 person-base bytes.

### Status and destructive callouts

- **Structure**: semantic status/callout row with icon and text; destructive deletion remains explicit.
- **Variants**: success, warning, error, offline/update.
- **Spacing**: 12–16px inner padding and 8px icon/text gap.
- **States**: default, announced status, action/focus.
- **Accessibility**: role/status and contrast are preserved; errors explain what failed and what the user can do.
- **Motion**: no attention-seeking animation.
- **Layout**: stack/cluster within the shell.

## 6. Motion & Interaction

| Type     | Duration  | Easing      | Usage                              |
| -------- | --------- | ----------- | ---------------------------------- |
| Micro    | 100–150ms | ease-out    | Option press and state tint        |
| Standard | 200–300ms | ease-in-out | Existing panel/control transitions |

Rules:

- Only transform and opacity animate. The current option press feedback is `active:scale-[.985]`; preserve it while enlarging artwork.
- Every new interactive control has native keyboard focus, selected/pressed semantics, and disabled behavior where applicable.
- No new decorative hover or scroll animation is part of this task. `prefers-reduced-motion` removes non-essential transitions.

## 7. Depth & Surface

### Strategy: mixed, with warm tonal hierarchy

- Warm canvas → shell surface → soft accent/artwork surface establishes hierarchy first.
- Use a one-pixel neutral border for cards/frames and a tinted low-opacity shadow only for raised lists, popovers, or bottom actions.
- Use radii by anatomy: 12px inner artwork, 16px controls, 24px cards, 28px preview, 32px hero/major surfaces. Do not apply one radius indiscriminately.
- Avoid purple/blue gradients, remote photographic backgrounds, decorative noise, and card stacks without task hierarchy.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target: 4.5:1 body text, 3:1 large text/UI boundaries, visible focus on every interactive element, full keyboard reachability, and reduced-motion respect.
- Mobile QA must cover 320px and 390px without more than 1px horizontal overflow. Korean labels, error copy, and headings must wrap naturally without clipping or one-syllable orphans.
- Touch targets are at least 44×44px. Image artwork is decorative and never the only accessible label.
- Offline and privacy are accessibility-adjacent product constraints: local assets must load without a network, and face-excluded exports must be unambiguous.

### Accepted Debt

| Item                                                              | Location                                                    | Why accepted                                                                                                   | Owner / Exit                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Desktop support-context note remains visible above 768px          | `src/styles/index.css`                                      | Product is intentionally mobile-only; note helps desktop QA without becoming a second layout                   | Keep until product scope changes                         |
| PDF export embeds a full Korean font while UI faces are subsetted | `src/lib/pdf/exportPdf.ts` / `src/assets/noto-*-ui-*.woff2` | Portable PDFs need broad glyph coverage; the interactive shell keeps a small local Noto subset for first paint | Revisit PDF font subsetting with a portable-glyph test   |
| Existing `role=status` overlay does not own focus                 | `src/components/MobileShell.tsx`                            | Toast/update behavior is transient and current; changing focus policy would expand scope                       | Revisit with a dedicated notification accessibility pass |
