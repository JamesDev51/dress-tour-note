# Release checklist

The mobile release is ready only when every item below passes on the final pull request and again after production deployment.

- Exactly 61 approved source option WebPs match the catalog manifest and load offline. Only active choices appear in the editor.
- `기억 안 남` remains a distinct, text-backed state with no image request.
- Recall cue/reasons persist after immediate back, next-dress navigation, and direct reload without blur; optional blanks remain valid.
- Interrupted recall drafts are bounded and revision-aware, and whole-data deletion removes them.
- Saved cards and detail show explicit recall cues without inventing text from missing data. Full detail retains all notes and options.
- Chromium and WebKit recall and styling journeys pass; engine testing is not physical-device testing.
- The three-step core flow records silhouette, material, and upper body with explicit Next. Neckline and sleeves/straps are independent choices on the same step. Unknown values and no candidate/rating/notes still allow completion.
- One common fabric is the default; the mixed-material switch exposes independent upper/lower choices. Switching back clears overrides without losing the selected common material. Mesh/chiffon has one visible option.
- Choosing an option never scrolls to the preview. The explicit preview dialog restores selection scroll and trigger focus when closed; it does not cover the final option or navigation. Explicit Next/Previous opens the new step at its heading.
- Added stylings copy only appearance. Memories remain isolated; rating/favorite/name stay common. Opening a look never changes the representative.
- Maximum 8 additional stylings, 30-character styling names and 4 details are enforced without silently deleting existing choices.
- Completion/look switch/add/delete/next-dress operations wait for current writes; failures retain input with retry. Duplicate clicks do not create duplicate dresses.
- Representative changes affect cards and PDF favorite summary. Deleting the representative falls back to base; dress counts and order stay unchanged.
- The optional detail editor contains waistline, embellishments and detail notes. Length, tea-length, color, back/closure, detachable sleeves, comfort tags and face controls are absent from active screens.
- Full and upper previews use local selection-aware garment composition within the canonical SVG; unknown values remain visibly unrecorded and unsupported results are explicit.
- Mixed materials stay within their selected upper/lower regions. Draping, pearls, sequins and floral applique are visually distinguishable in the composed preview.
- PDF generation locks mode settings and the actual output and filename agree after rapid user actions.
- Blank names cannot make saved records impossible to back up, custom names survive reorder/delete, and older tours remain accessible.
- Tour, shop, and dress CRUD persist after immediate navigation and reload.
- No active face feature remains. Every new PDF excludes face refs, transforms and bytes, including when exporting a legacy record that contains a face.
- Recoverable PDF v1–v6 round-trip with copy/overwrite, remapped styling IDs and representative references. Regional material overrides use v4; an explicit transition position uses v5. Freehand marks on the full front sketch use v6 and retain their position and pen width on PDF export and restore. These fields cannot silently downgrade. Visual pages contain all looks with names and the summary uses only the representative.
- View-only PDFs and arbitrary files are rejected with a clear message.
- Shop and review cards open individual records directly. Both all/favorites filters remain available; no dress/look comparison controls or route remain. Obsolete comparison URLs recover through the existing unknown-route fallback.
- 320px and 390px mobile viewports have no horizontal overflow; touch targets preserve 44px and focus remains visible.
- Home/transfer/option-help graphics load from local resources. Reduced-motion disables transitions and the saving spinner.
- Direct `/`, `/privacy`, `/import`, and nested `/tour/*` routes refresh through the SPA fallback.
- A previously loaded app opens offline and supports editing, reload, and individual record/styling viewing.
- Browser traffic has no external runtime request.
- Legacy v1 raw IDs remain unchanged in Dexie/portable attachments while visible summaries use the approved presentation mapping.
- `드레스노트` title, canonical, OG/Twitter metadata, favicon, and manifest values are present with absolute HTTPS production URLs.
- The full axe run reports no serious violations on editor, details, review, import, and export.
- `npm run validate:option-catalog` and `npm run test:option-catalog-validator` pass.
- React Doctor static analysis is run; findings and any remaining warnings are recorded.
- `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm audit --audit-level=high` pass.
- Vercel reports a successful production deployment for the merged commit.

Generated `dist/` output is refreshed only with `npm run build`. The deployment check repeats the direct-route, offline, metadata, PDF recovery, 61-image catalog, axe, and no-external-request scenarios against the merged production commit.
