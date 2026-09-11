# Release checklist

The mobile release is ready only when every item below passes on the final pull request and again after production deployment.

- Exactly 61 local option WebPs across all nine categories match the catalog manifest and load offline.
- `기억 안 남` remains a distinct, text-backed state with no image request.
- The four-step core flow records shoulder/top, neckline, silhouette, and candidate decision; every step persists across back/next/reload.
- The optional detail editor exposes all nine categories and persists closest-choice notes without silently replacing unsupported values.
- Full, upper, and back previews are deterministic SVG memory sketches; unknown values remain visibly unrecorded.
- Tour, shop, and dress CRUD persist after immediate navigation and reload.
- Face photo upload, transform, deletion, and optional PDF exclusion work locally; the back view and face-excluded output contain no face refs, transforms, or bytes.
- Recoverable PDF v1 export imports as a copy on a clean browser profile; old v1 files without newer optional fields remain compatible.
- View-only PDFs and arbitrary files are rejected with a clear message.
- Two-dress comparison works from both the all and favorites filters.
- 320px and 390px mobile viewports have no horizontal overflow.
- Direct `/`, `/privacy`, `/import`, and nested `/tour/*` routes refresh through the SPA fallback.
- A previously loaded app opens offline and supports edit, reload, and comparison.
- Browser traffic has no external runtime request.
- Legacy v1 raw IDs remain unchanged in Dexie/portable attachments while visible summaries use the approved presentation mapping.
- `드레스노트` title, canonical, OG/Twitter metadata, favicon, and manifest values are present with absolute HTTPS production URLs.
- The full axe run reports no serious violations on editor, details, review, compare, import, and export.
- `npm run validate:option-catalog` and `npm run test:option-catalog-validator` pass.
- `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm audit --audit-level=high` pass.
- Vercel reports a successful production deployment for the merged commit.

Generated `dist/` output is refreshed only with `npm run build`. The deployment check repeats the direct-route, offline, metadata, PDF recovery, 61-image catalog, axe, and no-external-request scenarios against the merged production commit.
