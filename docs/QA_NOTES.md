# QA notes

The production candidate has 61 individual local option WebPs across nine categories, a four-step core record, an optional nine-category detail editor, and deterministic SVG memory sketches for full, upper, and back views. `기억 안 남` is a deliberate text-backed state; unsupported closest-choice notes remain category-labelled instead of being converted into a known option.

PDF transfer is local-only schema v1. Recoverable PDFs carry `gudress-manifest.json`, `gudress-tour.json`, and optional `gudress-face.webp` or `gudress-face.jpg` attachments with SHA-256 checks. The importer recognizes `gudress-data-v1.json` only as a legacy fallback for older PDFs. View-only PDFs carry no restorable attachment. Face exclusion removes references, transforms, and bytes, and the back sketch excludes face data regardless of export mode.

Run the current gates from the repository root:

```bash
npm run format:check
npm run typecheck
npm test
npm run validate:option-catalog
npm run test:option-catalog-validator
npm run build
npm run test:e2e
npm audit --audit-level=high
```

The full E2E command uses the production preview at `127.0.0.1:4173`. It covers 320px and 390px layouts, all 61 option images, persistence, PDF copy restoration and invalid-file rejection, offline edit/reload/compare, direct routes, no external runtime requests, and the active axe sweep over editor, details, review, compare, import, and export.

Recall journeys run in both Chromium and WebKit. They cover optional memory/liked/concern fields, immediate navigation and unblurred reload recovery, compact cards with complete detail access, semantic comparison groups, synchronized views, and deletion of interrupted drafts. Tailscale review hosting is a development-only service; it does not add a product backend or cloud storage.
