# QA notes

The production candidate has 61 individual local option WebPs across nine categories, a three-step core record (silhouette → surface → upper-body combination), an optional nine-category detail editor, and local selection-aware garment artwork within the canonical SVG for full, upper, and back views. Rear coverage respects recorded sleeves/shoulders without inferring the front neckline. `기억 안 남` is a deliberate text-backed state; unsupported closest-choice notes remain category-labelled instead of being converted into a known option.

PDF transfer stays local-only: tours without extra stylings or explicit back closures use data/manifest schema v1; tours with extra stylings use v2; an explicit back closure on any base or additional styling requires v3. The envelope and trailer remain format v1, and all three data versions import. Recoverable PDFs carry `gudress-manifest.json`, `gudress-tour.json`, and optional `gudress-face.webp` or `gudress-face.jpg` attachments with SHA-256 checks. The importer recognizes `gudress-data-v1.json` only as a legacy fallback for older PDFs. View-only PDFs carry no restorable attachment. Face exclusion removes references, transforms, and bytes, and the back sketch excludes face data regardless of export mode.

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

## 2026-10-30 implementation acceptance

Final functional gates: 42 unit-test files / 457 tests passed in the full run; the subsequent shared-save barrier test and final display-label adjustment passed the 14-test core-flow suite (458 total current tests). The full production browser run passed all 56 scenarios, including Chromium and WebKit. Typecheck, format, diff whitespace, 61-image catalog validation and all six adversarial catalog fixtures passed; the production build was regenerated after the final labels.

- Prior save/recovery baseline: 21 targeted tests passed before editor integration. Existing dirty worktree changes were preserved.
- Added upper-body preset pairing, independent sleeve/neckline correction, immediate back panel, optional completion feedback, and base/additional styling sessions.
- Data verification covers atomic pairs, per-look memories, snapshot-only appearance copying, representative fallback, max8/max4 limits, delete/write races, and v1/v2 copy/overwrite/face exclusion.
- The 560 core-only combinations (10 uppers × 7 silhouettes × 8 surfaces) cover structural composition with unknown waist/color/train. Rendered galleries separately check the 10/7/8 alternatives, neckline edges, waist joins, skin masking and wrist crop. The local catalog remains 61 images.
- Mobile comparison and upper-card galleries were inspected at 320/390px in Chromium and WebKit. Native comparison selects also show the full chosen look name below the control.
- Additional browser journeys exercise final text before look changes, representative selection without changing dress count, offline look switching/comparison, preferred-look deletion, and actual v2 PDF download/copy import.
- Actual recall effectiveness and the 30-second goal are not measured by these tests. Next-day identification and preference explanation require the planned human participant study. No attached private photo is copied into the repository or app assets.

### Verification limits and environment notes

- WebKit's Playwright `context.setOffline(true)` rejected service-worker-local navigation with an internal error. The same built app passed with its isolated preview server actually stopped (TCP connection verified unavailable). The committed styling tests use that method for WebKit and keep Chromium offline emulation. `navigator.onLine` stays true during an origin outage, so this verifies cache availability rather than the offline indicator. See [Playwright issue 42775](https://github.com/microsoft/playwright/issues/42775).
- React Doctor changed-scope scan: 73/100, 12 warnings, no errors. Remaining findings concern preview/option/import complexity, editable-draft hydration/status effects, existing export component structure/loading reset, existing ref initializers, and a test fixture clone. Required FastRecordFlow effect/reset findings were repaired without silencing rules.
- `npm audit --audit-level=high` does not pass: the existing dependency set reports 8 findings (5 low, 2 moderate, 1 high). The high finding is Zod (`GHSA-mrhx-c7xc-m3w5`). This feature does not change dependencies; the suggested automatic fix is a breaking Zod major upgrade, and `--force` was not run. Dependency remediation remains separate from the feature's data/UI acceptance.
- Production build succeeds with the existing large-chunk advisory. No production deployment or physical-device/user study was performed in this implementation task.

## 2026-10-30 production deployment

The subsequent requested production deployment is live at https://dress-tour-note-three.vercel.app. All 53 tests in the remote Chromium/WebKit suite passed, including PDF recovery, offline behavior, the 61-image catalog and axe checks. See [the deployment record](DEPLOYMENT-2026-10-30.md) for source provenance, deployment identity, verification evidence and remaining limits.

## 2026-10-31: VNC 피드백 일괄 반영

검수 근거와 회귀 목록은 `.reviews/2026-10-31-batch/PLAN.md` 및 각 실행 로그에 기록한다. 전체 모양부터 부분 그림, 동일 상체 크롭, 등 파임/여밈 독립 저장, 연출 이름 자동 저장, 고정 다음 드레스 행동, 비교 출발점 복귀, 새 샵 진입, 쉬운 한국어 표시명을 확인한다.

저장 검증은 이름을 A→B→A로 바꾸는 지연 응답, 이름 실패 후 재시도, 최신 메모가 있는 앱 업데이트, 업데이트 중 편집 잠금, 오류 재시도 버튼의 하단 가림 여부를 포함한다. portable v3는 등 여밈이 있는 기록에만 쓰며 기존 v1/v2 읽기와 얼굴 제외 검증을 유지한다. 사진이나 사용자 데이터는 저장소에 추가하지 않았다.

이 검수는 자동 검사와 AI의 화면 확인이다. 사람 대상 다음 날 회상 효과나 30초 기록 목표 달성을 입증하지 않는다.

### 최종 검증 결과

- 변경 전 단위 테스트 459개, 변경 후 45개 파일의 503개 테스트가 통과했다. 마지막 업데이트 잠금 처리와 편집 세션 정리 후 관련 13개 테스트도 다시 통과했다.
- Chromium/WebKit 브라우저 시나리오 86개 모두 통과 증거를 확보했다. 첫 실행에서 77개가 통과한 뒤 WebKit 실행이 브라우저 종료로 중단됐고, 남은 9개를 별도 실행해 통과했다. 연출 저장 기능 검사는 페이지 진입 전 모션 감소를 적용해 안정된 프레임에서 수행한다. 일반/감소 모션 자체는 별도 회상 시나리오에서 계속 검사한다. 단일 실행에서 86개가 모두 통과한 것으로 집계하지 않는다.
- 타입 검사, 전체 포맷 검사, 공백 오류 검사, 프로덕션 빌드, 옵션 이미지 61개 검사 및 카탈로그 공격 사례 6개가 통과했다. React Doctor는 변경 전과 같은 73/100이며 복잡도 등 경고가 남아 있다.
- 그림 조합표와 320px/390px 완료·비교 화면을 확인했다. 실물 휴대전화의 키보드·안전 영역 검수와 실제 참여자 회상 평가는 별도 과제다.
- 기존 의존성 감사는 통과하지 않는다. 현재 결과는 낮음 3개, 보통 13개, 높음 1개이며 높은 항목은 Zod의 `GHSA-mrhx-c7xc-m3w5`다. 이번 일괄 개선에서 의존성 파일은 변경하지 않았고, 자동 제안되는 Zod 주 버전 변경은 적용하지 않았다. 기존 대용량 번들 경고도 남아 있다.

배포 및 운영 주소 검증은 [2026-10-31 배포 기록](DEPLOYMENT-2026-10-31.md)에 남긴다.

## 2026-10-31: 의상 옵션 조합 전수 점검

‘끈 없음·하트 가슴선’ 이미지 불일치 수정에 이어, 선택한 특징이 실제 그림의 어느 영역에 적용되는지 검사했다. 사용자 VNC 브라우저와 저장 데이터는 변경하지 않고 별도의 브라우저 컨텍스트에서 검수했다. 배포 없이 로컬 개발 서버에 반영했다.

| 검사                   | 범위와 결과                                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 앞모습의 알려진 선택값 | 상체 9 × 목선 8 × 치마 7 × 소재 8 × 허리 4 × 트레인 4 × 색상 3 = **193,536개**. 상체·목선·치마 연결, 소재 적용, 허리 연결, 트레인 표시, 색상 및 유한 좌표 검사에서 오류 0개. 장식은 비운 기준이다.                           |
| 앞·상체 크롭           | 기본 4,032개 조합을 두 뷰에서 검증. 실제 상체 576개 이미지를 소재별로 비교했다.                                                                                                                                              |
| 실제 전체 그림         | 기본 4,032개를 72개 시트로 렌더링. 각 셀의 빈 그림, 마젠타 배경 잔류, 이미지 로드 실패, 끊어진 SVG 참조가 없었다. 허리 기본·아이보리·트레인 없음·장식 없음 기준이다.                                                         |
| 하체 변형              | 고정 상체에서 치마 7 × 소재 8 × 허리 4 × 트레인 4 × 색상 3 = **2,688개** 및 트레인 길이 계열 672개. 오류 0개. 허리·소재 224개, 트레인 56개, 원본 전체 이미지 허리 변형 32개를 화면으로 비교했다.                             |
| 등 디자인              | 등 6 × 여밈 5개 상태(미지정 포함) × 상체 9 × 치마 7 × 허리 4 × 소재 8 = **60,480개**. 기록된 상체·치마·소재·여밈 계약을 검증했다. 색상 아이보리·트레인 없음·장식 없음 기준이다. 등/상체 54개 및 허리 예시 24개도 렌더링했다. |
| 장식                   | 12개 장식의 부분집합 **4,096가지 × 3뷰 = 12,288개**. 기록 불변성과 뷰별 표시 범위를 검증했다. 다른 선택값은 고정한 분해 검사다.                                                                                              |

수정한 불일치:

- `upperSelection.ts`: 낮은 사각·사선 가슴선이 일자처럼 보이던 절삭 좌표를 수정했다.
- `markupParts.ts`: 전체 원본 이미지에도 트임 마스크를 적용하고, 상체 크롭에서 하트 가슴선의 머메이드 원본이 다른 치마 위로 내려오지 않게 했다.
- `markupParts.ts`, `markup.ts`: 비원본 조합에서 빠져 있던 반투명 망사 목선을 선택 소재로 그린다. 원본 망사 조합에 이중으로 추가하지 않는다.
- `compositionMarkup.ts`: 소재와 치마에 같은 허리·밑단 변환을 적용해 원래 새틴 밑단이 삐져나오는 문제를 수정했다.
- `modifiers.ts`: 선택 치마에 소재를 먼저 맞춘 뒤 트레인을 늘려 치마 폭을 유지한다. 짧은 앞 치마는 보존하고 뒤 트레인을 따로 그리며, 앞·뒤에서 트레인 끝이 일치한다. 트레인으로 교체한 천에도 트임을 실제로 뚫는다.
- `detailOverlays.ts`: 치마 모양 미기록 상태에서 트임·오버스커트만 길게 떠 있지 않게 했다.
- `backConstruction.ts`: 여밈 없음/미기록이 기존 코르셋 여밈을 덮어쓴 경우, 존재하지 않는 등 파임을 SVG 메타데이터에서 제거했다.

전체 **50개 파일의 단위 테스트 559개**, 타입 검사, 변경 파일 포맷 검사 및 프로덕션 빌드가 통과했다. 빌드는 `dist/`를 덮어쓰지 않고 `/tmp/dress-combination-fixed-build-20261031`에 생성했다. 320px/390px 저장·대표 연출·오프라인 비교·PDF 복사/등 여밈 시나리오는 Chromium 5개가 통과했고, WebKit 5개는 로컬 접속에 간섭한 프록시 환경 변수를 해당 테스트 프로세스에서만 제외한 재실행으로 통과했다. 한 번의 실행에서 10개가 모두 통과한 것으로 집계하지 않는다.

검사 기록은 `/tmp/dress-option-audit-20261031/summary.json`, 실제 전체 그림 검수표는 같은 폴더의 `index.html`에 있다. 상체 수정 전후 이미지는 `/tmp/upper-combo-audit/representative-fixes-verified.png`다. 비교용 HTML은 앞·뒤 SVG ID 충돌을 제거한 후 다시 캡처했다.

이 결과는 표에 적힌 전수/분해 검사 범위다. 모든 장식 부분집합·등 상태까지 앞모습 193,536개에 동시에 곱한 전체 경우의 수를 검증한 것은 아니다.

## 2026-11-01: 기록 항목과 미리보기 단순화

사용자가 확정한 열 가지 답변을 기준으로 로컬 구현을 변경했다. 실행 계획과 소유 범위는 `.reviews/2026-11-01-simplify/PLAN.md`에 기록했다. 운영 배포 없이 개발 서버와 VNC를 유지하며 사용자 브라우저의 데이터는 삭제하지 않았다.

- 기본 기록은 실루엣 → 소재 → 상체다. 가슴라인과 끈·소매를 같은 단계에서 독립적으로 선택한다. 소재는 공통이 기본이며, 다를 때만 상체·치마를 따로 고른다. 망사·쉬폰은 하나의 선택지다.
- 길이·짧은 치마·트레인·색상·뒷모습·뒤 파임/여밈·탈부착 소매·착용감 태그·얼굴 기능을 현재 제품 화면에서 제거했다. 허리선은 자세한 기록에서만 고른다. 외형 평가인 `얼굴이 살아남`은 사진 기능과 별개인 기존 평가 태그로 유지한다.
- 선택은 화면을 이동시키지 않는다. 미리보기 버튼으로 모달을 열고 닫으면 선택 위치와 버튼 포커스로 돌아온다. 맨 위로 버튼을 제거했고, 명시적인 이전/다음 이동은 새 단계 제목에서 시작한다. 320px 화면에서도 마지막 선택지가 미리보기 버튼에 가리지 않는다.
- 혼합 소재를 실제 상체·치마 영역에 각각 적용했다. 상체 레이스가 쉬폰 치마를 덮거나 원래 소재 밑단이 남는 문제를 수정했다. 겹친 주름·진주·스팽글·꽃장식은 기호 대신 주름 음영, 작은 구슬, 반짝임, 꽃 아플리케로 표현한다.
- 선택적인 upperFabric/lowerFabric은 기본·추가 연출과 복사/복원에서 보존한다. 해당 값이 있는 PDF는 v4를 사용하며 값을 잃는 v1–v3 강제 변환은 거부한다. 기존 v1–v3 읽기와 envelope/trailer v1은 유지한다. 새 PDF는 전체·상체 그림만 표시하며 과거 기록을 내보내도 얼굴 참조·변환·바이트를 항상 제외한다.
- 과거 기록의 제거 항목은 원본 호환성을 위해 저장소와 복원 데이터에서 보존하지만 현재 화면과 새 PDF의 시각 페이지에는 표시하지 않는다. 승인된 로컬 옵션 원본 61개를 유지했다.

검증 결과:

- 전체 단위 테스트 **52개 파일 / 577개 통과**, 실패 0개. 이후 저장·이동 관련 15개 회귀 검사도 다시 통과했다.
- Chromium/WebKit **90개 브라우저 시나리오의 통과 증거**를 확보했다. 전체가 한 번에 통과한 실행은 아니다. 이전 라벨을 사용하던 비교 검사, 비동기 저장 후 선택 확인, 레거시 데이터 준비를 보완한 뒤 해당 시나리오를 재실행했다. 비교 검사는 두 엔진에서 각각 세 번 반복해 통과했다.
- 320/390px 새 기록·독립 상체 선택·소재 분리·미리보기 포커스/스크롤·저장/재열기·연출·PDF v4 복사 복원, 레거시 얼굴 제외, 오프라인·접근성 검사를 포함한다. 혼합 소재 구조 검사는 서로 다른 소재 56쌍 × 상체 4개 × 치마 2개 × 뷰 2개인 896개 조합을 확인한다.
- 타입 검사, 제품 코드/브라우저 검사/제품 문서 포맷, diff 공백 검사, 옵션 원본 61개 검사와 공격 사례 6개가 통과했다. 프로덕션 빌드는 `dist/`를 덮어쓰지 않고 `/tmp/dress-simplified-build-20261101`에 생성했다.
- 전체 `format:check`는 이전 `.omd/runs/` 자동 생성 기록 16개 파일의 포맷 문제로 실패한다. 해당 과거 실행 기록은 변경하지 않았다. React Doctor는 변경 전과 같은 **73/100**, 경고 20개이며 복잡도 등 기존 항목이 남아 있다.
- 의존성 감사는 기존 Zod 높은 항목 1개를 포함해 낮음 3개·보통 13개·높음 1개로 통과하지 않는다. 이번 작업은 의존성을 변경하지 않으며 자동 제안되는 주 버전 변경을 적용하지 않았다. 기존 번들 크기 안내도 남아 있다.

검사 산출물은 `/tmp/dress-simplify-qa/`, 전체 단위 검사 JSON은 `/tmp/dress-simplify-final-unit.json`에 있다. 320/390px 미리보기는 `/tmp/dress-simplify-preview-320.png`, `/tmp/dress-simplify-preview-390.png`, 장식 수정 전후는 `/tmp/dress-simplify-renderer/details-comparison.png`로 확인했다. 자동 검사는 실제 현장 회상 효과나 실물 휴대전화 검수를 대신하지 않는다.

## 2026-11-01: 두 개 비교 기능 제거

추가 요청에 따라 샵·결과 목록의 두 벌 선택과 비교 버튼, 편집 화면의 두 연출 비교, 전용 비교 화면/라우트 및 전용 카드·비교 계산 코드를 제거했다. 관련 선택 상태·체크 표시·모션과 소개 문구도 정리했다. 결과 목록은 전체·후보 필터와 PDF 만들기를 유지하고, 개별 기록을 바로 연다. 연출 보기·대표 선택·저장 대기와 기존 데이터/PDF 형식은 유지한다. 예전 `/compare` 주소는 기존 없는 주소 처리에 따라 홈으로 돌아간다.

삭제 전 회귀 기준을 먼저 작성했다. 기존 구현에서 비교 버튼 부재 검사 3개가 실패하는 것을 확인한 뒤 제거했고, 개별 기록 열기·후보 필터·PDF 접근·연출 이름 저장 후 이동 검사가 통과했다. 이 작업의 계획과 파일 소유 범위는 `.reviews/2026-11-01-remove-comparison/PLAN.md`에 기록했다.

전체 단위 테스트는 **52개 파일 / 561개 통과**, 실패 0개다. 제거한 기능의 전용 검사를 삭제하고 유지 기능의 회귀 검사로 교체해 이전 577개와 수가 다르다. 타입 검사, 제품 코드/테스트/문서 포맷, diff 공백 검사와 `/tmp/dress-no-comparison-build-20261101` 프로덕션 빌드가 통과했다. React Doctor는 이전 73점에서 **74/100**으로 바뀌었고 기존 경고 15개가 남아 있다. 의존성과 승인된 이미지 카탈로그는 변경하지 않았다. 이전에 기록한 전체 생성 기록 포맷·의존성 감사·번들 크기 한계는 이번 작업 범위 밖이다.

브라우저 검사 중 기존 옵션 그림의 클릭 누락도 발견했다. 실제 이미지 응답을 지연해 로딩 표시에서 마우스를 누르고, 이미지 로드로 표시가 제거된 뒤 같은 위치에서 놓으면 클릭 이벤트가 발생하지 않았다. 별도의 최소 재현에서도 두 엔진에 같은 동작이 있었다. `OptionTile`의 장식 그림 영역에 `pointer-events-none`을 적용해 이미지 교체 중에도 버튼이 클릭 대상이 되도록 수정했다. 회귀 검사는 해당 테스트에서만 서비스 워커를 차단하고 실제 이미지 응답을 제어하며, 강제 클릭이나 임의 대기 시간 없이 실행한다. 임시 이벤트 추적 코드는 제거했다.

최종 브라우저 결과는 비교 제거 관련 **15개 시나리오의 통과 증거**와 일반/감소 모션·비활성 버튼 입력 회귀 **4개 통과**다. 최초 관련 실행 13개 통과 후 두 회상 검사를 보완했고, 클릭 수정이 포함된 최종 빌드에서 해당 두 엔진 검사와 버튼 회귀 네 개가 모두 통과했다(6개/21초). 단일 전체 실행이 통과한 것으로 집계하지 않는다. 마지막 코드 변경 후 전체 단위 검사와 타입/빌드도 다시 통과했다. 샵·결과 화면 증거는 `.reviews/2026-11-01-remove-comparison/usability-browser/surfaces/axe-shop-390.png`, `axe-review-390.png`에 있다.

검사 산출물은 `/tmp/dress-remove-comparison-qa/`에 남긴다. 사용자 VNC 브라우저와 로컬 기록은 그대로 두고 별도의 브라우저 컨텍스트에서 확인한다. 운영 배포는 수행하지 않는다.
