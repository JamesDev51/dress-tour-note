# Production deployment — 2026-10-31

- Live URL: https://dress-tour-note-three.vercel.app
- Deployment: `dpl_31soDcUK6BBSwWQnVFRQofUfAr32`
- Deployment URL: https://dress-tour-note-45inv1srb-minseokjeongjames-4193s-projects.vercel.app
- Project: `dress-tour-note` / `prj_gS9fjC0sga4ogC2YWW24SsabbAm5`
- Scope: `team_9o8LftZaatAL2rN5RZUmQFZK`
- Entry bundle: `/assets/index-FKbWVN3Q.js`
- Source: current workspace based on `05f2baf35e24be81f23ff63caace8b2e69add318`, including pre-existing uncommitted work. No commit was created, and this is not a deployment of that commit alone.
- Status: remote build succeeded, staged deployment was checked, and the ready deployment was promoted to production. Local, staged, and canonical entry bundle names match.

## Changes

The collected VNC feedback is applied together: natural Korean labels throughout recording, comparison and PDF transfer; a picture-first saved record; an always-visible memory cue; fewer initial controls; consistent upper-body framing; and partial dress rendering as soon as the silhouette is recorded. Existing fixed Previous/Next actions, smooth scroll destinations, active front/back state, equal option image frames and press feedback remain intact.

Back opening and fastening now save independently, with legacy values preserved. Styling names autosave through the editor save queue and survive immediate transitions and reloads. Comparison returns to the originating screen, shops open immediately after creation, and app updates flush pending editor text before reloading. Shared back controls replace duplicated selection logic.

Portable data/manifest v3 is used only when an explicit back fastening is present. Existing v1/v2 imports and exports without that field remain supported. The PDF envelope, hash validation, face exclusion, local-only storage and approved 61-image catalog are retained. No dependency or private photo asset was added in this batch.

Main changed areas are `src/features/dress-editor/`, `src/features/compare/`, `src/features/shops/`, shared preview/shell components, dress/rendering helpers, repository/domain contracts and PDF validation/export/import.

## Verification

- Full unit run: 45 files, 503 passing tests; the final shell/session adjustment was followed by 13 passing targeted tests.
- All 86 local browser scenarios have passing evidence across Chromium and WebKit. The main run passed 77 before a WebKit browser closure interrupted execution; the remaining nine passed separately. This is not reported as one uninterrupted clean run.
- Typecheck, full formatting, whitespace checks, production build, 61 option asset checks and six adversarial catalog fixtures passed. React Doctor remains 73/100, matching the pre-change baseline.
- Final production smoke: both 320px and 390px Chromium scenarios passed in 15.8 seconds. They exercise independent back fastening, styling name autosave and immediate reload, comparison return navigation, and actual v3 PDF copy restoration.
- Canonical `/` and a nested `/tour/*` route returned HTTP 200. The canonical entry bundle matches the verified build.
- The shared VNC browser was updated through the application's service-worker update action without clearing its records. Its script is the new entry bundle, and it is left showing the existing QA dress and preferred styling.
- Rendered upper-body/partial/back combination gallery, completed records and comparison layouts were visually inspected. Private reference photos were not copied into product assets or the repository.

Evidence is under `.reviews/2026-10-31-batch/`: `unit-final.log`, `update-final.log`, `verified-browser.log`, `webkit-final.log`, `webkit-recall-final.log`, `live-browser.log`, `promote-final.log`, `renderer-matrix.png` and `vnc-production.png`. These local review artifacts are excluded from deployment. The final test-only motion stabilization and this documentation do not alter the deployed application bundle.

## Remaining limits

Physical-phone checks and human next-day recall testing remain separate. Automated test timing does not establish the 30-second recording goal.

The existing dependency audit still reports 3 low, 13 moderate and 1 high finding. The high Zod advisory is `GHSA-mrhx-c7xc-m3w5`; its suggested remediation requires a major-version upgrade and was not included in this UI batch. The existing large-bundle warning and React Doctor maintainability warnings also remain. See [QA notes](QA_NOTES.md) for the validation context and earlier offline-testing limitation.

## Follow-up: 벨라인 명칭 통일

Deployment `dpl_3UdkMnJjawd73ZpS7UGPnbt5fXJt` is now live on the same production domain, with entry bundle `/assets/index-BZDz_12z.js`. The staged URL is https://dress-tour-note-b7lr0j5va-minseokjeongjames-4193s-projects.vercel.app. Its successful remote build and staged HTTP/bundle check preceded promotion.

The shared silhouette catalog now displays `벨라인` with `허리부터 둥글고 풍성하게 퍼져요.` and removes the redundant alias below the description. Recording, summaries, comparison and PDF text use the shared catalog. The stored `ballGown` ID and existing illustration remain intact. Existing catalog expectations and browser selectors were updated, along with the design reference.

Validation: 39 related unit tests, four local Chromium/WebKit mobile selection cases and two live Chromium cases passed. Production build/typecheck, full formatting and whitespace checks passed. React Doctor remains 73/100. The shared VNC browser was updated to the new bundle. Evidence is under `.reviews/2026-10-31-bell-label/`; the documentation-only follow-up does not change the deployed application.
