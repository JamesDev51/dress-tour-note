# Final validation

The release contains exactly 61 local WebP option images across nine categories, plus the explicit text-backed `기억 안 남` state. The core capture is four steps: top/shoulder, neckline, silhouette, and candidate decision. The optional detail surface covers all nine categories and preserves category-labelled notes when no listed option matches.

Preview, comparison, and PDF output use the same deterministic SVG memory-sketch renderer for full, upper, and back views. Unknown values remain visibly unrecorded rather than being guessed. A face is local-only and appears only when explicitly included on an eligible view; the back view never receives face data.

The production gate runs formatting, strict TypeScript, unit/integration tests, the exact option-catalog validator and its six adversarial fixtures, a Vite/PWA build, full mobile Chromium E2E, the active axe sweep over editor/details/review/compare/import/export, and `npm audit --audit-level=high`. Browser QA also verifies direct-route refresh, offline use, all 61 catalog images, and zero external runtime requests. Recoverable transfer remains the local PDF v1 attachment format; arbitrary and view-only PDFs are not recoverable.
