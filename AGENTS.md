# PROJECT KNOWLEDGE BASE

**Updated:** 2026-09-11
**Baseline:** 4040773
**Branch:** feat/dress-recall-experience

## OVERVIEW

드레스노트 is a Korean, mobile-only React 19 + TypeScript + Vite PWA for recording dress tours without photography. It has no backend: user data, face images, preferences, and recoverable PDF transfers stay in the browser.

## STRUCTURE

```text
./
├── src/main.tsx          # React bootstrap and PWA registration
├── src/app/              # Browser router
├── src/features/         # Route-level screens
├── src/components/       # Shared shell, preview, option, status UI
├── src/db/               # Dexie schema and all persistent mutations
├── src/lib/              # Dress, image, PDF, validation, storage utilities
├── src/types/            # Domain and portable-format contracts
├── src/styles/           # Tailwind entry and global mobile theme
├── e2e/                  # Mobile Chromium journeys and accessibility checks
├── public/               # Source icons and 61 local option WebPs
├── docs/                 # Release, QA, and asset acceptance notes
└── dist/                 # Generated production output; do not hand-edit
```

## WHERE TO LOOK

| Task                       | Location                                                          | Notes                                            |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Add/change a route         | `src/app/router.tsx`, `src/features/`                             | PDF routes are lazy chunks                       |
| Change persisted entities  | `src/types/domain.ts`, `src/db/`                                  | Dexie is the source of truth                     |
| Change dress choices       | `src/types/domain.ts`, `src/lib/dress/options.ts`                 | Then renderer and portable tests                 |
| Change dress rendering     | `src/lib/renderer/dressSvg.ts`, `src/components/DressPreview.tsx` | SVG is canonical; JPEG is derived                |
| Change face handling       | `src/lib/image/processFace.ts`, `src/db/repositories.ts`          | Re-encode and hash locally                       |
| Change PDF transfer        | `src/lib/pdf/`, `src/types/portable.ts`, `src/lib/validation/`    | Preserve v1 compatibility                        |
| Change offline behavior    | `src/pwa.ts`, `vite.config.ts`                                    | Prompt-based updates; local WebPs precached      |
| Change theme/font settings | `src/lib/preferences.ts`, `src/components/MobileShell.tsx`        | Fixed clean/Pretendard; clear legacy preferences |
| Validate release behavior  | `e2e/`, `docs/RELEASE_CHECKLIST.md`                               | 320px and 390px mobile surfaces                  |
| Change deployment routing  | `vercel.json`                                                     | Nested SPA routes need rewrites                  |

## CODE MAP

| Symbol                 | Type      | Location                                        | Role                                           |
| ---------------------- | --------- | ----------------------------------------------- | ---------------------------------------------- |
| `router`               | export    | `src/app/router.tsx`                            | Complete SPA route tree                        |
| `MobileShell`          | component | `src/components/MobileShell.tsx`                | Shared layout, preferences, global status UI   |
| `db`                   | singleton | `src/db/database.ts`                            | Dexie schema v1 database                       |
| repository exports     | functions | `src/db/repositories.ts`                        | CRUD, ordering, cascades, snapshots, import    |
| `DressEditorPage`      | component | `src/features/dress-editor/DressEditorPage.tsx` | Largest editing/autosave surface               |
| `dressSvgMarkup`       | function  | `src/lib/renderer/dressSvg.ts`                  | Canonical composed dress visual                |
| portable exports       | functions | `src/lib/pdf/portable.ts`                       | Canonical JSON, manifest, SHA-256 verification |
| `portableTourV1Schema` | schema    | `src/lib/validation/schemas.ts`                 | Untrusted portable data boundary               |
| `useUIStore`           | store     | `src/stores/uiStore.ts`                         | Toast/save/PWA state only                      |

## CONVENTIONS

- Node 22+ and npm lockfile; CI installs with `npm ci`.
- Strict TypeScript project references cover app, build configs, and E2E.
- Tests are colocated as `src/**/*.test.{ts,tsx}`; browser journeys live in `e2e/`.
- Feature pages may query Dexie reactively, but persistent mutations belong in `src/db/repositories.ts`.
- Zustand holds ephemeral UI state only. Dexie holds saved domain data; sessionStorage holds only interrupted recall text until commit/recovery; localStorage retains legacy preference cleanup.
- Dress-option changes follow: domain union -> labels/compatibility -> renderer if needed -> schema/portable tests.
- `backStyle` stays optional because older schema-v1 PDFs omit it.
- User-facing copy is Korean. Playwright fixes locale to `ko-KR` and timezone to `Asia/Seoul`.
- Mobile layout is product scope, capped at 480px; verify both 320px and 390px widths.
- `public/assets/options/` contains 61 local WebP option examples. The unknown state remains text-backed.

## ANTI-PATTERNS (THIS PROJECT)

- Do not introduce a server, login, cloud sync, collaboration links, analytics, ads, or remote image upload.
- Do not put persistent domain data in Zustand or bypass repository transactions for multi-table writes.
- Do not treat arbitrary PDFs as recoverable input or add OCR-based restoration.
- Do not include face references, transforms, or bytes when face export is disabled.
- Do not hand-edit `dist/` or generated Workbox bundles.
- Keep the approved 61-image local catalog; do not restore legacy atlas placeholders or fetch remote runtime artwork.

## COMMANDS

```bash
npm install
npm run dev
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:e2e
```

CI also runs `npm audit --audit-level=high`. Playwright exercises the production preview at `127.0.0.1:4173`, not the Vite dev server.

## NOTES

- Direct `/tour/*`, `/import`, and `/privacy` refreshes depend on `vercel.json` SPA rewrites.
- PWA navigation falls back to `/index.html`; generated assets up to 4 MiB are eligible for precache.
- Release acceptance includes persistence after immediate navigation/reload, PDF copy import, invalid-file rejection, offline option-image access, accessibility, and no horizontal overflow.
- See narrower `AGENTS.md` files before editing `src/features`, `src/db`, or `src/lib/pdf`.
