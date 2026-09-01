# Release checklist

The mobile release is considered ready only when all items below pass on the final pull request and again after the production deployment.

- Exactly 25 individual option WebPs load and map to the correct card; no atlas request remains.
- `기억 안 남` remains a distinct, text-backed unknown state.
- Tour, shop, and dress CRUD persist after immediate navigation and reload.
- Face photo upload, transform, deletion, and optional PDF exclusion work locally.
- Recoverable PDF export imports as a copy on a clean browser profile.
- View-only PDFs and arbitrary files are rejected with a clear message.
- Two-dress comparison works from both the all and favorites filters.
- 320 px and 390 px mobile viewports have no horizontal overflow.
- Direct routes and refreshes resolve through the Vercel SPA rewrite.
- A previously loaded app opens offline with every individual option WebP and the raster person base available.
- Shoulder and neckline selections save independently in either order and survive immediate reload.
- Legacy v1 raw IDs remain unchanged in Dexie/portable attachments while visible summaries use the approved presentation mapping.
- Preview and both PDF modes use the same inline raster person base; face-excluded output contains no face refs, transforms, or bytes.
- `드레스노트` title, canonical, OG/Twitter metadata, favicon, and manifest values are present with absolute HTTPS production URLs.
- Typecheck, unit/integration tests, production build, mobile E2E, usability E2E, and security audit all pass.
- Vercel reports a successful production deployment for the merged commit.

The final gate is run from a user-authored commit after all one-time maintenance workflows have removed themselves. The merged production commit is checked once more after deployment, including the fast PDF recovery trailer and every individual option WebP. The branch now contains only production code, documentation, generated local assets, and the permanent CI workflow.
