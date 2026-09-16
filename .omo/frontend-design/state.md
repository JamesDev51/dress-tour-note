# 드레스노트 frontend design state

## Current Objective

Execute `.omo/plans/dress-note-option-assets-branding.md` while preserving the existing warm, mobile-only local-first product behavior and its compatibility contracts.

## Locked Decisions

- Visible product copy is `드레스노트`; internal `gudress` database, preference, portable, attachment, and filename identifiers remain unchanged.
- The existing warm cream/clean themes, Noto typography, compact 4px rhythm, and mobile-only 320–480px shell remain the visual foundation. This is a focused selector/asset upgrade, not a broad rebrand.
- Twenty-five local individual WebP option assets replace the atlas; unknown remains text-backed; no runtime remote assets.
- The dynamic dress renderer remains canonical. Only the person base becomes a shared local raster inlined into SVG/PDF output.
- Legacy option values remain raw in Dexie and portable v1. A typed presentation adapter projects them for visible surfaces; explicit user selections write canonical values.
- UI has five two-column sections: shoulder, neckline, silhouette, fabric, color. Retired questions do not appear in visible summaries or visual output.

## Source Inputs

- `.omo/plans/dress-note-option-assets-branding.md`
- `AGENTS.md`, `src/features/AGENTS.md`, `src/db/AGENTS.md`, `src/lib/pdf/AGENTS.md`
- Existing `src/styles/index.css`, `src/components/MobileShell.tsx`, `src/components/OptionTile.tsx`, `src/components/OptionArtwork.tsx`
- Objective QA artifacts under `.omo/evidence/`

## Design Brief

- Primary users: Korean brides recording dress-tour impressions quickly on a phone, often in a time-constrained shop environment; companions may review/compare later.
- Primary journeys: choose visible dress traits, preserve notes/rating/tags, compare candidates, export/re-import a recoverable PDF, and keep data local/offline.
- Taste direction: quiet warm editorial utility. The signature is a calm cream canvas with blush selection states and square garment imagery that makes shape recognition immediate.
- Anti-references: generic dashboard cards, remote-photo dependencies, broad desktop layouts, decorative gradients, image atlases, and hidden legacy-field rewriting.

## Inclusive Personas

- Mobile-first Korean reader at 320px width: needs no horizontal overflow, natural CJK wrapping, readable labels, and 44px+ touch targets.
- Keyboard/focus user: needs visible focus rings, `aria-pressed`/button semantics, and a stable image-error fallback.
- Low-bandwidth/offline user: needs precached local images, no remote runtime requests, and clear failure state if a local base asset cannot load.
- Privacy-sensitive bride: needs no-face previews/exports to exclude face refs, transforms, and bytes while keeping the dynamic dress rendering intact.
- Returning user with legacy v1 data: needs raw records preserved and a consistent presentation projection without surprise mutations or correction toast.

## Adaptive Preferences

- Respect stored theme/font preferences already exposed by `MobileShell`.
- Keep `prefers-reduced-motion` behavior from existing CSS; no decorative motion is added for this task.
- Validate at 320px and 390px, with the shell capped at 480px and no desktop product expansion.
- Validate Korean line breaks, keyboard focus, disabled/pressed states, and 200% zoom-like narrow reflow where browser tooling permits.

## Verification Matrix

- `npm test`, `npm run typecheck`, `npm run build`, `npm run format:check`, `npm run test:e2e`, and `npm audit --audit-level=high`.
- Playwright Chromium production preview at 320px/390px for editor selection, reload, offline assets, PDF export/import, direct routes, no horizontal overflow, and accessibility.
- `npm run build` output inspection for metadata, PWA precache, and dev-tool exclusion; `curl -i` for HTML/static asset MIME/status.
- Fresh visual QA screenshots/contact sheet followed by independent design-system/functional and visual/CJK oracle review.
- React doctor static report and react-scan runtime evidence where supported; no production dev-tool resources.

## Design Debt Register

| Item                                                        | Location                                  | Why accepted                                                                                               | Owner / Exit                                   |
| ----------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Desktop shell still shows a small mobile-only guidance note | `src/styles/index.css` desktop media rule | Mobile-only scope is explicit product intent; desktop is QA/support context, not a product surface         | This plan; retain unless product scope changes |
| Current font package ships broad Korean font files          | `src/styles/index.css`, Vite font imports | Existing typography is part of the product identity; subsetting is outside this asset/compatibility change | Future performance pass                        |

## Decisions Log

- 2026-09-01: Use plan-specified local imagegen assets and preserve current design language; do not run remote reference capture or asset CDN sourcing.
- 2026-09-01: Treat legacy raw/presentation separation as a boundary contract and test it table-first.
