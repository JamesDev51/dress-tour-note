# FEATURE PAGES

## OVERVIEW

Route-level React screens for the full mobile journey; route declarations remain centralized in `src/app/router.tsx`.

## WHERE TO LOOK

| Surface          | Location                                                 | Responsibility                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------ |
| Recent tours     | `home/HomePage.tsx`                                      | Query and delete local tours; import entry |
| Tour creation    | `tours/NewTourPage.tsx`                                  | Create then navigate                       |
| Tour dashboard   | `tours/TourDashboardPage.tsx`                            | Tour metadata and shop ordering            |
| Shop detail      | `shops/ShopPage.tsx`                                     | Dress CRUD and ordering                    |
| Dress editing    | `dress-editor/DressEditorPage.tsx`                       | Options, autosave, face transform/upload   |
| Review/compare   | `review/ReviewPage.tsx`, `compare/ComparePage.tsx`       | Favorites and two-dress comparison         |
| PDF transfer     | `pdf-export/ExportPage.tsx`, `pdf-import/ImportPage.tsx` | Lazy UI around `src/lib/pdf`               |
| Privacy/settings | `privacy/PrivacyPage.tsx`                                | Preferences and complete local deletion    |

## CONVENTIONS

- Pages read reactive domain state with `useLiveQuery` against the singleton `db`.
- Send writes through `src/db/repositories.ts`; keep transaction and cascade semantics out of components.
- Route identifiers come from `useParams`; query-only comparison IDs come from `useSearchParams`.
- Use shared `DressPreview`, `SaveStatus`, and option components instead of duplicating their behavior.
- Surface save progress and user feedback through `useUIStore`; it is not a persistence layer.
- Keep copy concise and Korean, and preserve touch-first behavior within the 480px shell.
- PDF pages remain lazy-loaded because `pdf-lib`, font, HEIC, and export code are heavy chunks.

## ANTI-PATTERNS

- Do not write directly to Dexie tables from event handlers when a repository mutation exists.
- Do not move portable-format parsing, hashing, or PDF assembly into page components.
- Do not retain face image data outside local browser storage or the explicitly requested portable export.
- Do not assume a route entity exists; preserve current missing-record navigation/error behavior.
- Do not add desktop-only layouts that compromise 320px or 390px flows.

## VALIDATION

- Page behavior: targeted Vitest tests where logic is isolated.
- User journey: `npm run build && npm run test:e2e` against the production preview.
- For editing changes, verify autosave survives immediate navigation and reload.
- For route changes, verify direct refresh through the Vercel rewrite contract.
