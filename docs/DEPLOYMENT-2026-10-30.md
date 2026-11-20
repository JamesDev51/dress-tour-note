# Production deployment — 2026-10-30

- Live URL: https://dress-tour-note-three.vercel.app
- Vercel project: `dress-tour-note` / `prj_gS9fjC0sga4ogC2YWW24SsabbAm5`
- Team: `team_9o8LftZaatAL2rN5RZUmQFZK`
- Deployment: `dpl_Dz4DSGUKhsvPmYqBUtrfetKYo3ot`
- Deployment URL: https://dress-tour-note-nv6x4myk2-minseokjeongjames-4193s-projects.vercel.app
- Dashboard: https://vercel.com/minseokjeongjames-4193s-projects/dress-tour-note/Dz4DSGUKhsvPmYqBUtrfetKYo3ot
- Target/state: `production` / `READY`; promoted to the production domain after staged HTTP checks.
- Source: the current workspace, including its uncommitted implementation changes, based on `05f2baf35e24be81f23ff63caace8b2e69add318` (`feat/dress-recall-experience`). This is a workspace deployment, not a release of that commit alone. No commit was created for deployment.
- Remote build: `npm ci` then `npm run build`; successful, approximately 29 seconds. The deployed entry bundle is `/assets/index-CQZCiv7K.js`.

## Verification against the live production domain

All **53 browser tests passed in 1.7 minutes**: 42 Chromium scenarios and 11 WebKit recall scenarios. The deployment configuration uses the public production URL and does not start a local preview server. The mobile home test now uses the configured base URL instead of a hard-coded loopback address.

Coverage includes 320px/390px layouts; explicit three-step completion; immediate save/navigation/reload; independent styling memories and representative selection; styling comparison; v1 import and v2 PDF download/copy restoration; face inclusion/exclusion; error recovery; all 61 option images; offline editing/reloading/comparison; and no external runtime requests. The axe sweep found no serious violations on editor, details, review, comparison, import, and export.

Direct browser requests to `/`, `/privacy`, `/import`, and a missing nested `/tour/*` route returned HTTP 200 and rendered the appropriate screen. The latter displayed the expected missing-record recovery screen. The smoke check captured no uncaught page errors. Canonical and OG URLs use the live HTTPS domain; OG/Twitter image, favicon, and web manifest requests returned HTTP 200.

Vercel's deployment error-log query returned no logs for the inspected period. This is a static browser application, so that result is not a substitute for the browser checks above. No analytics, log drain, account, backend, or external image upload was added.

Local verification artifacts are under `.reviews/2026-10-30-deploy/` (excluded from deployment): `results.json`, `smoke.json`, and `production-home.png`.

## Limits retained from implementation acceptance

WebKit styling tests use an isolated local origin to verify an actual origin outage because Playwright's offline emulation has a WebKit limitation. Those three scenarios passed in the earlier 56-test local production-build run and are intentionally excluded from this 53-test remote run. WebKit recall scenarios did run against the live URL.

The existing dependency-audit findings, React Doctor warnings, physical-device gap, and unmeasured human recall effectiveness remain documented in `QA_NOTES.md`. This deployment did not change dependencies or claim human-study results.

## Follow-up: fixed recording navigation

The subsequent requested navigation correction is live on the same production domain. Deployment `dpl_85my1hqE1a5gJ9NCjFrj9sKjyacF` is `READY` / `production`, with entry bundle `/assets/index-BoSvCJjA.js`. The remote build completed in 32 seconds; the staged deployment was checked before promotion. Source remains the working tree based on `05f2baf`, including the new navigation change.

Previous/Next and the final completion action now remain at the viewport bottom throughout the three core steps. The bar stays within the 480px shell, includes bottom safe-area padding, and reserves document space so the final choice remains reachable. Existing disabled/saving behavior is unchanged.

Validation: 14 core-flow unit tests and 16 targeted Chromium/WebKit browser tests passed locally, along with the TypeScript production build and changed-file formatting checks. The browser tests include all three steps at top/middle/bottom scroll positions, 320px/390px widths, final-choice clearance, saved-record navigation, detail return, failed-save retry, and the serious-axe sweep. React Doctor remains 73/100 with the same 12 warnings and no new findings in the navigation component. Screenshots were also checked at 390×844 and a reduced 320×360 viewport.

After promotion, all four fixed-navigation scenarios passed against the public production domain (Chromium and WebKit at both widths). Local screenshots and remote test artifacts are in `.reviews/2026-10-30-fixed-navigation/`, excluded from deployment. Physical keyboard/safe-area behavior on an actual phone remains a device-testing gap.

## Follow-up: back to top

Deployment `dpl_QNgnwVKqtiNHEUNnptbtBBvYkipd` is now `READY` / `production` on the same live domain. The entry bundle is `/assets/index-Crg5ncMF.js`; the remote build completed in 31 seconds. Source remains the working tree based on `05f2baf`. The staged HTTP response and bundle were checked before promotion.

The shared mobile shell now shows `맨 위로` after scrolling more than 320px. It returns instantly to the page top, restores keyboard focus to the shell, and disappears at the top without changing records or the current step. It stays above visible fixed footers, ignores a hidden core footer when a detail panel is open, and is hidden while a choice dialog is open. Scroll space is reserved for the last content item, and transient toasts appear above the control. No dependency was added.

The final local run passed 12 Chromium/WebKit browser scenarios, including the new button at 320px/390px, keyboard activation, retained selections, normal and fixed-footer panels, existing bottom navigation, mobile overflow and the serious-axe sweep. Typecheck, production build, changed-file formatting and whitespace checks passed. React Doctor stayed at 73/100 with the same 12 warnings. After promotion, all four new scenarios passed on the live domain. Screenshots and remote artifacts are stored locally in `.reviews/2026-10-30-scroll-to-top/`; physical-device checks remain separate.

## Follow-up: smooth arrow, active editing side and wider previews

Deployment `dpl_4fW6wnsVkAvBRe5FPQfc1gGVTvi5` is `READY` / `production` on the live domain, with entry bundle `/assets/index-CYE_8Kj4.js`. The remote build completed in 34 seconds. The staged HTTP response and bundle were checked before promotion. Source remains the working tree based on `05f2baf`.

- Back to top is a 44px circular upward-arrow button with no visible text. Its accessible name stays `맨 위로`. It uses native smooth scrolling by default and instant scrolling when reduced motion is enabled; keyboard focus returns to the shell.
- Front/back editing buttons now show the selected color and border. Neckline and sleeve adjustments count as front editing; the rear panel selects back. Existing save and return actions are preserved.
- Core, full-detail and adjustment previews use the available content width. At 390px the core preview grows from 160px to 350px; at 320px it is 280px. Garment geometry, proportions and stored data are unchanged.

All **16 targeted browser scenarios passed on the live production domain** in 56.2 seconds, across Chromium and WebKit. They verify selected styling, preview width, neckline/sleeve panel selection, no horizontal overflow, fixed navigation, keyboard activation, smooth intermediate scroll positions, reduced-motion immediate return, and the serious-axe sweep. Build/typecheck, changed-file format and whitespace checks also passed. React Doctor remains 73/100 with the same 12 warnings; the React review introduced no new state/effect or dependency work. Screenshots and remote test artifacts are under `.reviews/2026-10-30-wide-preview/`.

The smooth-scroll test initially toggled reduced motion while existing entrance animations were mounted, which interfered with WebKit scrolling. Each motion preference is now established before opening the app; both final paths passed. Physical-device verification remains separate.

## Follow-up: choice/preview scrolling and simple upper-body labels

Deployment `dpl_7oeQ4MuX4xz4QjTxeX5gXjurqo8R` is `READY` / `production` on https://dress-tour-note-three.vercel.app. Its staged URL is https://dress-tour-note-qiq9mh8yq-minseokjeongjames-4193s-projects.vercel.app and its entry bundle is `/assets/index-CLat_PTi.js`. The remote build completed in 35 seconds. The staged HTTP response and bundle were checked before promotion, and the public domain was checked afterward. Source remains the working tree based on `05f2baf`.

- Next scrolls to and focuses the next step's question and choices, below the sticky editing menu.
- A successful core choice save scrolls to and focuses the updated preview without advancing the step. Pending or failed saves do not scroll. An inactive hidden core flow does not steal the current panel's focus.
- Both actions use native smooth scrolling and honor reduced motion. Existing fixed navigation and preview widths remain intact.
- All ten upper-body preset cards retain their picture and simple main label. Formal aliases and extra descriptions beneath those labels are removed. Stored upper-body values and partial-adjustment behavior are unchanged.

Validation: all 15 core-flow unit tests passed, including deferred success/failure scrolling. Production build, typecheck, full format check and whitespace checks passed. React Doctor remains 73/100 with the same 12 warnings. Screenshots were inspected at 320px/390px.

The 22 targeted browser scenarios cover both Chromium and WebKit, the new scroll destinations and labels, fixed navigation, front/back state, wide previews, immediate persistence, detail recovery and the serious-axe sweep. The initial local run passed 21; the failed WebKit injected-write scenario passed on isolated rerun and on production. The production run also passed 21 initially: the existing panel-return test sampled a position while the newly added smooth scroll was still moving. That test now establishes reduced motion before loading the app to isolate position restoration; its Chromium and WebKit reruns both passed. Smooth scrolling remains enabled and covered in the separate 390px cases. Thus every targeted scenario has passing final evidence, with those initial failures retained in the artifacts rather than reported as a single clean run.

Local and production artifacts are under `.reviews/2026-10-30-choice-flow/`. The final test-only adjustment and this report do not change the deployed application bundle. Physical-device verification remains separate.

## Follow-up: press feedback and concrete neckline wording

Deployment `dpl_92QA2sPyCJh9dR4UhaBouiMLqB7U` is `READY` / `production` on https://dress-tour-note-three.vercel.app. Its staged URL is https://dress-tour-note-i2p3engwu-minseokjeongjames-4193s-projects.vercel.app and its entry bundle is `/assets/index-C6TaCQlX.js`. The remote build completed in 32 seconds; the staged response and bundle were checked before promotion, and the public entry bundle was checked afterward. Source remains the working tree based on `05f2baf`.

- Buttons inside the mobile shell shrink to 97% and darken immediately while pressed, then return over the existing 150ms transition. Reduced motion keeps the brightness cue without scaling. Disabled buttons remain inactive. Existing selected colors, check marks, and save semantics remain intact.
- Native touch input can defer CSS `:active` until release. A small shell hook now adds a temporary touch-press attribute at contact and clears it on movement, release, cancellation, scrolling, window blur, visibility changes, context menus, or unmount. Listeners are passive and do not prevent scrolling, alter clicks, or delay writes.
- Adjustment actions now read `목·가슴선 수정`, with a `목·가슴선 모양` section. Preset labels use concrete terms such as `일자 가슴선` and `하트 가슴선`; high-neck choices say `목까지 덮임`. Preset values, artwork, and the concise picture/main-label cards are preserved.

Changed production files: `src/styles/index.css`, `src/components/useButtonPressFeedback.ts`, `src/components/MobileShell.tsx`, `src/lib/dress/upperPresets.ts`, and wording in `FastRecordFlow`, `FastRecordOptions`, `DressEditorPage`, and `DressAdjustmentPanel`. The previous four-class press styling is replaced by one shared button rule. No dependency or persistent data format changed.

All **17 targeted browser scenarios passed against the public production domain in 46.6 seconds**, including Chromium/WebKit mouse and keyboard press/release, disabled controls, reduced motion, 320px/390px layouts, concise labels, adjustment panels, preserved auto-scroll, immediate persistence, and the serious-axe sweep. Two Chromium cases inject native touch start/move/cancel/end via CDP and verify immediate feedback, gesture cleanup, and successful normal activation. These are browser-emulated touch checks, not physical-phone checks.

All 17 core-flow/catalog unit tests passed. Production build/typecheck, full formatting and whitespace checks passed; React Doctor remains 73/100 with the same 12 warnings. Independent read-only review found no press-cleanup or click/save interference defect. Screenshots and test results are under `.reviews/2026-10-30-press-feedback/`. Physical-device behavior remains a separate verification gap.

## Follow-up: consistent option images and concise previews

Deployment `dpl_2v1BsMnxkHMuCUB4FboCEVRBpxtR` is `READY` / `production` on https://dress-tour-note-three.vercel.app, with entry bundle `/assets/index-BHNln7M8.js`. The staged URL is https://dress-tour-note-2v2syrwql-minseokjeongjames-4193s-projects.vercel.app. Its 36-second remote build and staged HTTP/bundle check succeeded before promotion; the public domain now serves the same bundle. Source remains the working tree based on `05f2baf`.

`OptionTile.tsx` now top-aligns its contents and reserves a non-shrinking square image frame. An absolutely contained artwork wrapper keeps image dimensions independent of descriptions, wrapped labels, selection checks and fallback text. Before this correction, native button content centering moved the A-line image roughly 10px lower than its neighboring card at 320px; the new browser regression reproduced that failure before the fix. All original local artwork and SVG crop geometry are retained.

`DressPreview.tsx` removes the redundant `반영한 특징·미기록 항목` disclosure and its unused `showRecordDetails` prop. Reference-image captions, unrecorded-back guidance, loading/error/retry states, renderer metadata and saved data remain intact. `DressPreview.test.tsx` and `e2e/recall.spec.ts` cover the resulting presentation.

All 78 targeted component tests, four new geometry browser cases and 13 related browser regressions passed locally. Production build/typecheck, full formatting and whitespace checks passed; React Doctor remains 73/100 with the same 12 warnings. The final live run passed **nine Chromium/WebKit scenarios in 33.1 seconds**: equal square frames and top insets at 320px/390px across primary/additional choices, adjustments and nine detail sections; selected-state stability; disclosure removal; preserved choice/preview scrolling; and the serious-axe sweep. Screenshots were inspected, and local artifacts are under `.reviews/2026-10-30-uniform-images/`. Physical-phone verification remains separate.
