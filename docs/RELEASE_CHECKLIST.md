# Release checklist

The mobile release is considered ready only when all items below pass on the final pull request and again after the production deployment.

- Generated option image atlas loads and all 57 visual options map to the correct card.
- `기억 안 남` remains a distinct, text-backed unknown state.
- Tour, shop, and dress CRUD persist after immediate navigation and reload.
- Face photo upload, transform, deletion, and optional PDF exclusion work locally.
- Recoverable PDF export imports as a copy on a clean browser profile.
- View-only PDFs and arbitrary files are rejected with a clear message.
- Two-dress comparison works from both the all and favorites filters.
- 320 px and 390 px mobile viewports have no horizontal overflow.
- Direct routes and refreshes resolve through the Vercel SPA rewrite.
- A previously loaded app opens offline with the option atlas available.
- Typecheck, unit/integration tests, production build, mobile E2E, usability E2E, and security audit all pass.
- Vercel reports a successful production deployment for the merged commit.

The final gate is run from a user-authored commit after all one-time maintenance workflows have removed themselves.
