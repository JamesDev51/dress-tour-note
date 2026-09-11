# 드레스노트 Design System

## Supersession

드레스노트는 사진을 대신하는 **드레스 기억 스케치** 기록 도구다. 이 contract는 이전의 raster mannequin, photoreal virtual try-on, 그리고 245-combination structure-raster mandate를 명시적으로 폐기한다. 이들은 구현 요구사항이 아니며, 새 구조 조합 생성, 사실적인 신체 비율 약속, 소재를 전신에 덮는 표현을 다시 도입해서는 안 된다. 이 문서는 런타임 동작을 추가하지 않는 design contract다.

변하지 않는 정체성은 절제된 blush 선택 언어 (`#fff2ee`, `#b96e63`), local Pretendard, 흰 shell, 4px spacing rhythm, 44px target, visible focus, reduced motion, 320–480px 모바일 전용 범위다. image는 인식 보조물이며 공식 한국어 용어가 항상 accessible name이다.

## Five-component topology

| Component                | Outcome                                     | Boundary and states                                                                                                                           |
| ------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                | 선택지를 눈으로 구별한다                    | local image → official Korean term → plain one-line description → common aliases. loading, loaded, error fallback, selected, disabled, focus. |
| `fast-record`            | 네 핵심 선택을 한 mounted flow에서 끝낸다   | 아래 4-step state machine만 core path. back/next, saving, write-error/retry, completion.                                                      |
| `memory-sketch`          | 기록을 과장 없이 도형으로 보여 준다         | full/upper/back, unknown, unsupported annotation, no-face/face-enabled.                                                                       |
| `details-and-exceptions` | 선택 밖의 차이와 detail을 선택적으로 남긴다 | collapsed, expanded, empty, edited, validation-error; core path를 막지 않는다.                                                                |
| `decision-and-backup`    | 이후 비교·회고·PDF에서 결정을 찾는다        | shop, review, compare, export, import/privacy에서 같은 formatter와 local-only v1 원칙을 사용한다.                                             |

별도 companion identity, account, sync, analytics, remote image/face upload, 새 route는 만들지 않는다.

## Four-step core state machine

한 editor route 안에서 한 번에 하나의 step만 mount한다. 각 step의 `기억 안 남`은 유효한 명시 선택이다.

| State              | Required decision                    | Entry / exit and persistence                                                                                           |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Step 1 — 어깨/상의 | top/shoulder                         | 새 dress에서 시작하고 선택 후 Step 2. saving 중 중복 tap을 막고 실패 시 선택·step을 유지해 재시도한다.                 |
| Step 2 — 네크라인  | neckline                             | Step 1 다음, back은 Step 1. Step 1 값과 독립 저장한다.                                                                 |
| Step 3 — 실루엣    | silhouette                           | Step 2 다음, back은 Step 2. unknown을 known form으로 추측하지 않는다.                                                  |
| Step 4 — 후보 결정 | `isFavorite`, 선택 rating/첫인상 tag | Step 3 다음, back은 Step 3. 후보 여부만 core; `다음 드레스 기록`은 모든 write를 await하고 새 dress Step 1로 reset한다. |

정확히 네 결정은 top/shoulder → neckline → silhouette → candidate decision이다. fabric, color, waistline, back style, train, details, comfort/body-effect, memo, face는 `상세 기록`에만 둔다.

## Card-grid and content hierarchy

- top, neckline, silhouette, fabric, waistline, back style의 구조·소재 card는 320px와 390px에서 **2 columns**만 허용한다.
- color, train, compact detail multi-select처럼 짧은 label의 단순 attribute만 조건부 3 columns/chips를 허용한다. 320px에서 label 또는 44px target이 맞지 않으면 2 columns/stack으로 fallback한다.
- known card는 반드시 **representative local image → official Korean term → plain one-line description → genuinely common aliases** 순서다. alias는 secondary metadata이며 공식 용어를 대체하지 않는다.
- selected는 blush tint/border와 text check, focus는 별도 focus ring으로 보인다. image error에도 공식 용어, 설명, alias, target, selection은 남는다.

## 61 known-choice catalog inventory (62 including unknown state)

`unknown`을 제외한 정확히 **61**개의 catalog choice는 각각 local `512×512 WebP` 이미지 하나를 가진다. 각 파일은 120KB 이하, 전체 7.5MiB 이하이며 face, text, watermark, remote URL, `unknown.webp`를 포함하지 않는다. 하나의 generic `unknown` text-only state가 모든 category에 적용되므로 catalog entry는 62개지만 image inventory는 61개다. 아래 모든 known 항목은 `image asset | official Korean term | plain one-line description | common aliases` 순서다.

### Top — 9

- `top/strapless.webp` / `strapless` | 스트랩리스 | 어깨 끈 없이 가슴선으로 지지해요. | 튜브탑
- `top/offShoulder.webp` / `offShoulder` | 오프숄더 | 소매나 밴드가 어깨 아래에 놓여요. | 오프숄더 드레스
- `top/strap.webp` / `strap` | 스트랩 | 일반 폭의 끈이 어깨 위를 지나가요. | 끈 드레스
- `top/spaghetti.webp` / `spaghetti` | 스파게티 스트랩 | 아주 가는 끈으로 어깨를 지지해요. | 가는 끈
- `top/wideStrap.webp` / `wideStrap` | 와이드 스트랩 | 넓은 끈이 어깨를 덮어요. | 넓은 끈
- `top/halter.webp` / `halter` | 홀터넥 | 끈이나 천이 목 뒤 또는 목선을 감싸요. | 홀터
- `top/oneShoulder.webp` / `oneShoulder` | 원숄더 | 한쪽 어깨만 덮는 비대칭 상의예요. | 한쪽 어깨
- `top/shortSleeve.webp` / `shortSleeve` | 캡 소매 | 어깨를 짧게 덮는 작은 소매예요. | 짧은 소매
- `top/longSleeve.webp` / `longSleeve` | 롱슬리브 | 팔을 길게 덮는 소매예요. | 긴 소매

### Neckline — 8

- `neckline/straight.webp` / `straight` | 스트레이트 네크라인 | 가슴선이 거의 수평으로 곧아요. | 일자 넥
- `neckline/sweetheart.webp` / `sweetheart` | 스위트하트 네크라인 | 하트 윗부분처럼 가운데가 굴곡져요. | 하트 넥
- `neckline/v.webp` / `v` | 브이넥 | 앞목이 V자 모양으로 내려가요. | V 네크라인
- `neckline/square.webp` / `square` | 스퀘어넥 | 네모난 모서리가 보이는 목선이에요. | 사각 넥
- `neckline/scoop.webp` / `scoop` | 스쿱넥 | U자처럼 둥글고 넓게 파였어요. | 라운드 넥
- `neckline/high.webp` / `high` | 하이넥 | 목 가까이까지 높게 올라와요. | 목 올라오는 넥
- `neckline/illusion.webp` / `illusion` | 일루전 네크라인 | 얇은 투명 천이 피부 위 목선을 이어 보여요. | 시스루 넥
- `neckline/asymmetric.webp` / `asymmetric` | 비대칭 네크라인 | 좌우 높이나 선이 다른 목선이에요. | 사선 넥

### Silhouette — 7

- `silhouette/aLine.webp` / `aLine` | A라인 | 허리에서 밑단으로 자연스럽게 퍼져요. | 에이라인
- `silhouette/ballGown.webp` / `ballGown` | 볼가운 | 잘록한 허리와 크게 풍성한 치마예요. | 벨라인
- `silhouette/empire.webp` / `empire` | 엠파이어 실루엣 | 가슴 아래 절개선부터 치마가 퍼져요. | 하이웨이스트
- `silhouette/fitAndFlare.webp` / `fitAndFlare` | 피트 앤 플레어 | 몸선을 따라오다 아래에서 부드럽게 퍼져요. | 세미 머메이드
- `silhouette/mermaid.webp` / `mermaid` | 머메이드 | 무릎 부근까지 맞고 아래에서 크게 퍼져요. | 인어라인
- `silhouette/sheath.webp` / `sheath` | 시스 실루엣 | 몸을 따라 비교적 곧게 떨어져요. | 슬림라인
- `silhouette/teaLength.webp` / `teaLength` | 티 렝스 | 발목보다 위로 올라오는 짧은 길이예요. | 미디 길이

### Fabric — 8

- `fabric/mikadoSatin.webp` / `mikadoSatin` | 미카도 새틴 | 매끈하고 탄탄한 광택이 느껴져요. | 새틴
- `fabric/lace.webp` / `lace` | 레이스 | 실로 만든 무늬가 표면에 보여요. | 레이스 원단
- `fabric/subtleBeaded.webp` / `subtleBeaded` | 은은한 비즈 | 작은 비즈가 드문드문 빛나요. | 잔비즈
- `fabric/ornateBeaded.webp` / `ornateBeaded` | 화려한 비즈 | 비즈 장식이 넓고 촘촘해요. | 비즈 드레스
- `fabric/tulle.webp` / `tulle` | 튤 | 가볍고 망사처럼 비치는 소재예요. | 망사 원단
- `fabric/organzaChiffon.webp` / `organzaChiffon` | 오간자·쉬폰 | 얇고 하늘하늘한 투명 계열 소재예요. | 쉬폰
- `fabric/glitterBeaded.webp` / `glitterBeaded` | 글리터 비즈 | 반짝이 입자와 비즈가 함께 보여요. | 글리터
- `fabric/floral3D.webp` / `floral3D` | 입체 플라워 | 꽃 장식이 표면에서 도드라져요. | 3D 플라워

### Color — 3

- `color/pureWhite.webp` / `pureWhite` | 퓨어 화이트 | 또렷하고 밝은 흰색이에요. | 새하얀 화이트
- `color/ivory.webp` / `ivory` | 아이보리 | 크림기가 아주 옅게 도는 흰색이에요. | 크림 화이트
- `color/champagne.webp` / `champagne` | 샴페인 | 베이지와 금빛이 은은하게 섞여요. | 샴페인 베이지

### Waistline — 4

- `waistline/natural.webp` / `natural` | 내추럴 웨이스트 | 자연 허리 위치에 절개선이 있어요. | 기본 허리선
- `waistline/basque.webp` / `basque` | 바스크 웨이스트 | 허리선이 V자나 물결처럼 아래로 내려와요. | 바스크
- `waistline/drop.webp` / `drop` | 드롭 웨이스트 | 허리선이 골반 쪽으로 내려가요. | 로우 웨이스트
- `waistline/empire.webp` / `empire` | 엠파이어 웨이스트 | 허리선이 가슴 바로 아래에 있어요. | 하이 웨이스트

### Back style — 6

- `back/openBack.webp` / `openBack` | 오픈 백 | 등이 넓게 드러나는 뒤태예요. | 등 파임
- `back/vBack.webp` / `vBack` | 브이 백 | 등이 V자 모양으로 파였어요. | V 백
- `back/buttonBack.webp` / `buttonBack` | 버튼 백 | 등 중앙에 단추가 줄지어 있어요. | 단추 장식
- `back/corsetBack.webp` / `corsetBack` | 코르셋 백 | 끈을 교차해 조이는 뒤태예요. | 레이스업
- `back/illusionBack.webp` / `illusionBack` | 일루전 백 | 투명한 천 위에 장식이 이어져요. | 시스루 백
- `back/bowBack.webp` / `bowBack` | 리본 백 | 등이나 뒤 허리에 리본이 있어요. | 백 리본

The sixth back-style image is `back/bowBack.webp`. Therefore 9 + 8 + 7 + 8 + 3 + 4 + 6 + 4 + 12 = **61 non-unknown images**. The generic text-only `unknown` state makes 62 catalog entries; no `unknown.webp` exists.

### Train — 4

- `train/none.webp` / `none` | 트레인 없음 | 뒤로 끌리는 길이가 거의 없어요. | 노 트레인
- `train/sweep.webp` / `sweep` | 스윕 트레인 | 바닥을 살짝 스치는 짧은 끌림이에요. | 브러시 트레인
- `train/chapel.webp` / `chapel` | 채플 트레인 | 예식용으로 적당히 길게 이어져요. | 중간 트레인
- `train/cathedral.webp` / `cathedral` | 캐서드럴 트레인 | 뒤로 길고 넓게 이어져요. | 롱 트레인

### Detail — 12

- `detail/corset.webp` / `corset` | 코르셋 | 보디스 구조가 허리를 잡아줘요. | 본딩
- `detail/draping.webp` / `draping` | 드레이핑 | 천이 주름을 이루며 겹쳐져요. | 셔링
- `detail/waistBow.webp` / `waistBow` | 허리 리본 | 앞이나 옆 허리에 리본이 있어요. | 웨이스트 보우
- `detail/backBow.webp` / `backBow` | 백 리본 | 등 또는 뒤 허리에 리본이 있어요. | 뒤 리본
- `detail/pearl.webp` / `pearl` | 진주 장식 | 진주처럼 둥근 장식이 붙어 있어요. | 펄
- `detail/sequin.webp` / `sequin` | 스팽글 | 납작한 반짝이 조각이 빛나요. | 시퀸
- `detail/floral.webp` / `floral` | 플라워 장식 | 꽃 모양 장식이나 무늬가 있어요. | 꽃 장식
- `detail/slit.webp` / `slit` | 슬릿 | 치마 한쪽이 트여 다리가 보여요. | 트임
- `detail/sheer.webp` / `sheer` | 시어 | 피부가 비쳐 보이는 얇은 부분이 있어요. | 시스루
- `detail/detachableSleeve.webp` / `detachableSleeve` | 탈부착 소매 | 떼거나 붙일 수 있는 소매예요. | 분리 소매
- `detail/overskirt.webp` / `overskirt` | 오버스커트 | 치마 위에 덧입히는 추가 스커트예요. | 덧치마
- `detail/buttons.webp` / `buttons` | 버튼 장식 | 단추가 장식이나 여밈으로 이어져요. | 단추

## Unknown and unsupported choices

| Case                          | UI and persistence                                                                                                                   | Sketch                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Unknown (`기억 안 남`)        | First-class selectable text-only state, no fabricated image; saves canonical `unknown` and clears that category exception note.      | Neutral/dashed field labelled `미기록`; never defaults to straight, strapless, A-line, or another known form. |
| Unsupported (`선택지에 없음`) | Pick closest canonical choice, open `비슷하지만 달라요`, save bounded category-labelled difference note or memo; no new protocol ID. | Show closest form and visibly attach the category-labelled difference; no exact reconstruction claim.         |
| Loading/error                 | Preserve term, description, alias, target, selection; show neutral local fallback/retry.                                             | Keep safe prior state or `미기록`; never invent a detail.                                                     |

## Dress memory sketch

The visible label is **드레스 기억 스케치**. It is a deterministic, intentionally illustrative neutral figure built from SVG primitives/layers, not virtual try-on. Fabric is a separate swatch and details are badges, never tiled over the garment. Browser and PDF share semantic inputs, not claims of physical drape, body measurement, or photographic likeness.

## Full / upper / back field matrix

| View  | Required fields                                                                                                | Explicit exclusions                                       |
| ----- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Full  | top/shoulder, neckline, silhouette, waistline, train cue, color; fabric swatch and detail badges beside sketch | Face unless separately enabled; unknowns remain `미기록`. |
| Upper | top/shoulder, neckline, waistline, color cue; face only when explicitly enabled                                | silhouette length, train, back style, disabled face.      |
| Back  | back style, silhouette, train cue, color; fabric swatch/detail badges beside sketch                            | Face always; front neckline is not inferred.              |

## Face and privacy matrix

| Surface / export                        | Face allowed          | Required behavior                                                       |
| --------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| Fast four-step record                   | No                    | Never blocks or appears in the 30-second core path.                     |
| Optional detail and full/upper sketch   | Explicit enable only  | Browser-local source; clear include/exclude state; no default portrait. |
| Compact shop/review/compare cards       | No                    | Full memory sketch and decision metadata without portrait.              |
| Back sketch                             | No                    | Never render, reference, transform, or infer face.                      |
| Face-excluded recoverable/view-only PDF | No                    | Exclude bytes, asset references, transforms; label privacy outcome.     |
| Face-included recoverable PDF           | Explicit include only | Retain existing privacy choice; no remote upload or sharing.            |

## Cross-surface display matrix

| Surface       | Sketch and fields                                                   | Decision / exception treatment                                      |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Shop          | Full sketch, up to three core official terms, candidate/rating      | Concise category-labelled exception when present.                   |
| Review        | Full sketch, all recorded core terms, high-signal tags              | Details, exceptions, memo without hiding unknowns.                  |
| Compare       | Both full sketches; every differing recorded field as labelled rows | Category-labelled exception notes; blanks and unknowns differ.      |
| Per-dress PDF | Full, upper, back panels; swatch; all terms/notes/tags/memo         | Apply face matrix and show `미기록`/unsupported honestly.           |
| Favorites PDF | Full sketch and bounded decision summary                            | Face only under explicit PDF include rule; no photoreal flattening. |

## Mobile acceptance: 320px and 390px

| Width | Required observable state                                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 320px | Two-column structural cards readable; three columns only where label and 44px targets fit. ≤1px horizontal overflow, no clipped Korean label/orphan, hidden nav, or focus loss. |
| 390px | Same hierarchy and step order; extra width is spacing, not desktop layout. Validate selected, focus, loading, error, unknown, unsupported, no-face, face-enabled.               |

At both widths, sticky actions reserve scroll space, keyboard focus stays visible, and local assets support offline editing once available.

## Accessibility and interaction constraints

- Native buttons use selected semantics and keyboard focus; detail inputs have native labels.
- WCAG 2.2 AA target: 4.5:1 body text, 3:1 large text/UI, 44px targets, natural Korean wrapping, reduced motion.
- Errors explain recovery; a pending save never loses a final tap or advances unpersisted.
- No server, API, account, analytics, cloud sync, remote asset, OCR, or social sharing.

## Accepted debt

| Item                                                                 | Why accepted now                                                                                      | Owner / exit                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Product screens still implement the retired preview/editor direction | This documentation-only task changes no runtime behavior and must not be presented as a UI migration. | Todos 2–12 replace code, assets, tests, release docs. |
| Desktop support-context note above 768px                             | Mobile-only scope; useful QA context without a desktop product layout.                                | Revisit only if scope changes.                        |
| PDF embeds full Pretendard while UI uses subset                      | Portable PDFs need broad Korean glyph coverage; shell prioritizes first paint.                        | Revisit with portable-glyph test.                     |
| Transient status overlay does not own focus                          | Focus-policy change exceeds documentation scope.                                                      | Dedicated notification accessibility pass.            |
