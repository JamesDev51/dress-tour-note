# Release checklist

The mobile release is ready only when every item below passes on the final pull request and again after production deployment.

- Exactly 61 local option WebPs across all nine categories match the catalog manifest and load offline.
- `기억 안 남` remains a distinct, text-backed state with no image request.
- Recall cue/reasons persist after immediate back, next-dress navigation, and direct reload without blur; optional blanks remain valid.
- Interrupted recall drafts are bounded and revision-aware, and whole-data deletion removes them.
- Saved cards and detail show explicit recall cues without inventing text from missing data. Full detail retains all notes and options.
- Comparison separates observed differences, matching features, and missing information; both views switch together and stay face-free.
- Chromium and WebKit recall journeys pass; engine testing is not physical-device testing.
- The four-step core flow records shoulder/top, neckline, silhouette, and candidate decision; every step persists across back/next/reload.
- The optional detail editor exposes all nine categories and persists closest-choice notes without silently replacing unsupported values.
- Full, upper, and back previews use prepared local garment artwork in the canonical SVG frame. Partial/unavailable results are labelled, unknown values remain visibly unrecorded, and the record-sketch fallback remains usable.
- Garment assets load offline; PDF/JPEG embeds the selected assets without changing portable v1 JSON.
- `기록 완료하고 보기` waits for the last input and opens the saved record without adding another dress.
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
