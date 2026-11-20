# 드레스노트 Design System

## 두 개 비교 기능 제거 — 2026-11-01

이 항목은 아래의 비교 화면·비교 선택 규칙보다 우선한다.

- 샵·결과 목록의 두 벌 선택, 나란히 비교 화면, 편집 화면의 두 연출 비교를 제거한다. 비교용 버튼·선택 상태·주소를 제품에 남기지 않는다.
- 목록에서는 각 드레스 기록을 바로 연다. 새 드레스는 한 벌을 한 건으로 기록한다. 연출 선택과 대표 표시는 이전에 여러 연출을 저장한 기록에서만 보인다. 전체·후보 필터, 자동저장과 PDF 백업은 유지한다.
- 소개와 사용 순서는 특징 선택 → 느낌 기록 → 기록 다시 보기로 설명한다. 비교 기능을 안내하지 않는다.
- 예전 비교 주소는 기존 없는 주소 복귀 동작을 따른다. 저장된 드레스와 연출 데이터는 삭제하지 않는다.

## 기능 정리와 직접 선택 — 2026-11-01

사용자가 확정한 다음 규칙이 아래의 이전 기능·자동 스크롤·상체 조합 규칙보다 우선한다.

- 기본 기록은 전체 모양 → 소재 → 가슴선·끈/소매 세 단계다. 마지막 단계에서 가슴선을 먼저 고르고, 같은 화면 아래에서 끈·소매를 독립적으로 고른다. 합친 상체 프리셋을 거치지 않는다.
- 소재는 한 번 고르는 것이 기본이다. `상체와 치마 소재가 달라요`를 켜면 같은 화면에서 상체와 치마 소재를 각각 고른다. 서로 다른 두 소재를 골랐을 때만 아래 소재의 시작 위치를 허리·골반·허벅지·무릎 중에서 고른다. 기본은 허리이며 실루엣과 허리선은 별도로 기록한다. 연출과 PDF에도 두 소재와 시작 위치를 유지한다.
- 망사와 얇고 흐르는 원단 선택은 `망사·쉬폰`으로 합친다. 이전 소재 식별자는 백업 읽기에 보존한다.
- 길이·트레인·짧은 길이 선택, 색상, 얼굴 업로드·편집·미리보기·PDF 포함, 등 모양·여밈·뒤 리본·뒷모습 뷰, 탈부착 소매 및 모든 착용감 태그를 현재 제품에서 제거한다. 허리선은 자세한 기록에만 둔다. 메모·좋았던 점·아쉬운 점의 자유 입력은 유지한다.
- 선택 직후 자동 스크롤과 위로 가기 버튼을 없앤다. `미리보기` 버튼을 누르면 현재까지 고른 드레스가 화면 위의 대화상자에 뜬다. 닫을 때 선택 위치와 키보드 포커스를 복원하며, 옵션 선택·저장 성공을 이유로 화면을 이동시키지 않는다.
- 장식과 세부 특징은 실제 미리보기에서 구별돼야 한다. 겹친 주름은 천의 겹침과 음영, 진주는 작고 입체적인 광택, 스팽글은 얇은 반짝이 조각의 군집, 꽃은 꽃잎의 겹침으로 표현한다. 진주·스팽글을 큰 단추 같은 반복 기호로 처리하지 않는다.
- 기존 차분한 브라이덜 토큰과 로컬 이미지를 유지한다. 저장·실패 복구·연출별 기록·PDF 가져오기는 보존한다. 삭제한 기능의 이전 데이터는 현재 화면을 복잡하게 만들지 않는 호환성 경계에서만 읽는다. 새 PDF는 항상 얼굴 없이 전체·상체 그림만 담는다.
- 상하 소재를 따로 기록한 백업은 portable schema v4, 아래 소재의 시작 위치까지 기록한 백업은 v5로 내보낸다. 손그림이 있는 기록은 v6로 내보낸다. v1–v6 가져오기와 envelope/trailer v1을 유지한다. 선택적 비색인 필드 추가에는 Dexie 테이블/인덱스 변경이 없다.

## 그림 아래 반복 안내 제거 — 2026-10-31

- 정상적으로 표시된 드레스 그림에는 `기록한 특징을 반영한 참고 그림이에요.`
  같은 반복 설명을 화면과 PDF에 붙이지 않는다. 안내가 없을 때 빈 문단도
  남기지 않는다. 기록하지 않은 부위·그림 준비 실패·재시도처럼 필요한 상태
  안내는 해당 상황에서만 보여준다.

## 전 화면 브라이덜 디자인 — 2026-10-31

사용자가 승인한 홈의 차분한 웨딩 분위기를 모든 앱 화면의 기본 디자인으로
확장한다. 이 항목은 아래의 홈 한정 색상·흰 shell 규칙보다 우선한다.

- 공통 paper는 `#faf8f4`, rule은 `#e4ded7`이다. 앱 바탕·헤더·고정 행동
  영역은 paper, 입력·옵션·드레스 카드 표면은 기존 흰색과 preview-surface를
  사용한다. 주 행동은 accent-copy `#8b5750`, 선택은 기존 blush와 체크로
  구분한다. 경고·삭제·실패는 기존 error 토큰을 유지한다.
- 로컬 Pretendard를 유지한다. 홈 제목은 30px/42px, 일반 화면 제목과
  편집 가능한 제목은 26px/36px weight 500, 섹션 제목은 16px/24px
  weight 600이다. 제목 tracking은 -0.03em, 본문은 14px/24px이다.
- 화면 좌우 여백은 24px로 맞춘다. 비교 두 열과 드레스 선택 두 열은
  320px에서도 유지한다. 카드 안쪽 여백·이미지 비율·기록 정보는 보존한다.
- 공통 `bridal-*` 클래스가 바탕·헤더·입력·주/보조 버튼·카드·고정 바를
  담당한다. 임의의 전역 클래스 문자열 매칭으로 의미가 다른 상태를 바꾸지
  않는다. 선택·disabled·오류 상태는 개별 의미를 유지한다.
- 드레스 편집 헤더의 68px 높이와 스크롤 기준점, 화면 아래 고정 행동,
  최소 44px 목표·focus·누름 피드백·움직임 줄이기를 유지한다. 장식용
  진한 블록·과한 그림자는 줄이고 실제 드레스 그림과 기록을 우선한다.
- 투어·샵 이름 수정, 저장·복구, 연출, 비교, PDF 가져오기/내보내기와
  개인정보 삭제의 동작과 계약은 디자인 변경 범위 밖이다. PDF 파일 내부의
  기존 렌더링과 로컬 이미지 카탈로그는 유지한다.

## 차분한 브라이덜 홈 — 2026-10-31

홈 화면에 한정해 이 항목을 우선한다. Jenny Yoo의 크림 바탕과 여백,
Grace Loves Lace의 드레스 중심 구성을 참고하되 기존 로컬 자산과 제품의
기록 기능으로 재해석한다.

- 홈 전용 paper 토큰은 `#faf8f4`, 구분선 토큰은 `#e4ded7`이다. 다른 화면의
  흰 shell과 기존 blush 팔레트는 유지한다.
- 제목은 로컬 Pretendard 30px/42px, weight 500, tracking -0.03em이다.
  본문은 14px/24px, 섹션 제목은 16px/24px, 브랜드 워드마크는 20px/28px
  weight 500이다. 가독성을 위해 작은 정보도 기존 ink-muted 색을 유지한다.
- 모든 홈 구역과 헤더의 좌우 여백은 24px이다. 첫 방문에는 거울 앞에서 드레스를 입어보는 장면을
  화면 너비에 맞춘 4:3 사진으로 먼저 보여주고, 제목과 새 투어 시작 버튼을 이어 배치한다.
  기록 유무와 관계없이 사진을 보여주고, 최근 투어는 사진 아래에 둔다. 홈 푸터에는 할미눈나의 인스타그램
  링크를, PDF 첫 표지 하단에는 제작자와 계정명을 표시한다.
- 홈 헤더는 제품명 워드마크와 개인정보 링크를 사용한다. 주 행동은
  `새 투어 시작`, 보조 행동은 PDF 가져오기다. 버튼은 기존 control radius와
  44px 이상 목표, focus, 150ms 누름 피드백 및 움직임 줄이기를 유지한다.
- 첫 방문 안내는 짧은 문장과 단일 이미지로 구성한다. 세 개의 그림 타일과
  큰 점선 빈 상태는 사용하지 않는다. 기록이 있으면 소개를 축약하고 최근
  기록을 먼저 이어 열 수 있게 한다. 최신순·더 보기·개별 삭제 기능은 보존한다.
- 브랜드 사진·로고·카피·독점 폰트와 원격 자산은 제품에 추가하지 않는다.
  개인정보·로컬 저장·오프라인 상태는 하단에서 계속 확인할 수 있다.

## 현장 기록과 쉬운 용어 — 2026-10-31

이번 항목이 아래 이전 문서와 충돌하면 이번 규칙을 따른다.

- 기본 기록은 전체 모양 → 소재·표면 → 상체 모습 세 단계다. 처음에는 빈 그림 대신 짧은 안내를 보여 주고, 전체 모양부터 고른 치마를 표시한다. 상체 미선택은 저장값을 추정하지 않는다.
- 기본 단계와 부분 수정에서 선택 저장이 끝나면 그림으로 부드럽게 이동한다. 이전·다음은 해당 단계의 선택지로 이동한다. 움직임 줄이기 설정을 지키고 고정 메뉴 아래에 목표를 둔다.
- 상체는 가장 비슷한 조합을 먼저 고르고 `목·가슴선 수정`과 `끈·소매 수정`으로 필요한 부분만 바꾼다. 카드와 결과 상체는 같은 목–손목 크롭을 사용한다.
- 완료 화면은 드레스 그림과 기억할 특징을 먼저 보여 준다. 기억할 특징은 항상 입력할 수 있으며 자세한 느낌·평가, 선택 예시, 전체 기록은 뒤에 배치한다. `반영한 특징·미기록 항목` 목록은 노출하지 않는다.
- 이전·다음, 완료 후 다음 드레스, 수정 패널 돌아가기는 화면 아래에 고정한다. 실패 안내와 재시도에도 하단 여백을 확보한다. 위로 가기는 화살표만 보이고 접근성 이름과 움직임 줄이기 동작을 유지한다.
- 등 파임과 등 뒤 여밈은 독립적으로 기록한다. 뒤 리본은 장식으로 유지한다. 기존 버튼 백·코르셋 백·리본 백 기록을 잃거나 등 파임을 추정하지 않는다.
- 연출 이름은 다른 입력과 같은 저장 경로로 자동 저장한다. 저장 실패·재열기 때 초안을 유지하며 이동 전에 최신 입력을 반영한다. 앱 업데이트는 편집을 잠근 뒤 저장을 확인하고, 진행 중 작업 또는 저장 실패 시 현재 화면을 유지한다.
- 비교는 그림 → 느낌과 평가 → 다른 점 → 비교하기 어려운 부분 순서다. 같은 점은 펼쳐 확인한다. 샵에서도 두 벌을 골라 비교하며, 종료하면 출발한 화면과 연출로 돌아간다. 새 샵을 만들면 해당 샵으로 이동한다.
- 사용자 표시명은 쉬운 한국어로 통일한다. 끈·소매, 목·가슴선, 전체 모양, 소재·표면, 뒷모습, 뒤로 끌리는 길이, 장식과 세부 특징을 쓴다. 저장한 식별자와 직접 쓴 이름·메모는 바꾸지 않는다. 새 기본 이름은 `드레스 01`이다.
- PDF는 `백업용 PDF`와 `보기 전용 PDF`로 구분한다. 등 여밈 필드가 있으면 portable schema v3, 추가 연출만 있으면 v2, 둘 다 없으면 v1로 내보낸다. v1/v2/v3 가져오기와 envelope/trailer v1, 해시 검증, 얼굴 제외 계약을 유지한다. Dexie 테이블·인덱스는 버전 1 그대로다.

## 기본 기록·연출 — 2026-10-30

동행인이 피팅 중 실루엣 → 소재·표면 → 상체 모습의 세 가지를 선택하고 명시적으로 다음으로 이동한다. 선택은 저장 성공 후 확정한다. 상체 대표 6개/추가 4개는 실제 렌더러의 동일한 중립 소재와 팔을 포함한 크롭을 사용한다. 프리셋은 topStyle·neckline 두 값만 함께 저장하고, 윗선/끈·소매 수정은 각각 한 값만 변경한다.

- 소재는 기본 과정에 둔다. 모든 단계에 앞모습/뒷모습을 노출하고 등 디자인·트레인·뒤 리본은 전용 패널에서 수정한다. 닫으면 단계·스크롤·포커스를 복원한다.
- 세 번째 단계의 주 행동은 `기록 완료하고 보기`. 후보·별점·기억할 특징·좋았던 점·아쉬운 점은 완료 후 선택 입력이다. 다음 드레스 기록은 별도 동작이다.
- 기본 세 값만으로 전체 그림을 구성하고 허리·색·뒤태·트레인의 미기록 값은 보존한다. `기록한 형태와 소재를 반영한 참고 모습`과 펼칠 수 있는 반영/미기록 항목을 제공한다. 자산 오류는 별도로 안내한다.
- 한 벌의 기본 연출과 추가 연출 최대 8개를 구분한다. 추가는 외형만 복사하고 느낌은 비운다. 연출 보기와 대표 선택은 분리하고 별점·후보·이름·얼굴은 한 벌의 공통 정보로 유지한다.
- 목록과 비교 기본값은 대표 연출이다. 같은 벌의 다른 연출도 비교할 수 있고 샵·착용 순서·드레스 이름·연출 이름을 함께 표시한다.
- 구조 선택은 320/390px 모두 두 열, 터치 영역은 최소 44px. 첨부 사진은 비공개 검수 자료이며 제품 자산에 포함하지 않는다.
- 핑크/목 스카프/초커/자유 그리기/옆모습/샵 조건 비교는 이번 범위 밖이다. 미지원 특징은 직접 입력에 보존한다.

## Recall experience — 2026-09-11 (기록 단계는 위 규칙으로 갱신)

이번 사용자 요청은 기록을 다시 보고 어떤 드레스였는지 떠올리고 선택할 수 있게 하는 것이다. 아래 규칙은 이전 문서의 작은 스케치·분류 우선 목록·분류 순서 비교 규칙을 대체한다. 사진처럼 재현한다는 약속은 하지 않으며 기록하지 않은 특징을 추정하지 않는다.

- 기록은 세 단계로 진행한다. 완료 화면에서 `기억할 특징`(80자), `좋았던 점`(160자), `아쉬운 점`(160자)을 선택적으로 남긴다. 소재·디테일 전체 목록을 거쳐야 이유를 적을 수 있는 구조를 피한다. 입은 사람의 느낌은 당사자에게 물어서 기록하도록 안내한다.
- 다시 보는 목록은 기억할 특징을 첫 제목으로 보여 주고, 없으면 기존 드레스 이름을 사용한다. 업체·착용 순서/드레스 이름은 함께 남겨 기록의 출처를 잃지 않는다. 문장 생성이나 메모를 임의로 별명으로 바꾸는 것은 금지한다.
- 저장한 드레스를 열면 큰 그림, 기억할 특징, 이유, 선택한 실제 옵션 예시, 전체 기록을 확인한다. 수정 동작은 명시적이며 새 드레스는 빠른 입력으로 시작한다. 이전 v1 기록도 모든 원래 입력값에 접근할 수 있어야 한다.
- 핵심 기록 3단계에서는 `기록 완료하고 보기`가 현재 드레스 저장·보기 동작이고, `다음 드레스 기록`은 새 빈 드레스를 추가하는 별도 이어쓰기 동작이다. 완료 동작은 마지막 메모 입력까지 기다리며 새 드레스를 만들지 않는다.
- 샵·결과 카드의 `기록 보기`는 `?view=record` UI 경로로 기존 기록을 먼저 보여 준다. `coreRecordedAt`이 없는 v1 기록도 완료 상태로 추정하거나 저장값을 바꾸지 않고, 기록 보기와 핵심 기록 수정 동작을 분리한다.
- 브라우저의 작은 스케치 안에는 글자를 넣지 않는다. 동일한 SVG 형태를 넓게 보여 주고 제목·기록 상태·설명은 읽을 수 있는 HTML로 밖에 둔다. PDF의 기존 설명형 렌더링과 face 제외 계약은 유지한다.
- 얼굴을 명시적으로 포함하는 상체 스케치는 기존 기준점 `(135, 116)`과 clip 타원 `rx=28, ry=32`를 사용하며, 중립 마네킹 머리의 반지름은 `31`이다. 얼굴 변환값과 뒤태·제외 출력의 얼굴 없음 규칙은 그대로 보존한다.
- 선택한 소재·뒤태·디테일은 기존 local WebP 예시를 재사용하며 `선택한 특징 · 예시 이미지`라고 설명한다. 예시의 다른 부위를 실제 기록으로 오인하게 하지 않는다. 미기록 항목에는 이미지를 만들어 넣지 않는다.
- 비교는 선택 이유/착용감 → 관찰된 외형 차이 → 기록이 부족한 항목 순서다. 알려진 값끼리 다른 것과 한쪽을 기록하지 않은 것은 서로 다른 구역에 둔다. 같은 특징도 필요할 때 펼쳐 확인할 수 있다. 전체/상체/뒤태를 나란히 전환한다.
- 모든 기록을 보존한다. 요약에서 생략된 메모·디테일은 상세에서 전체를 읽을 수 있어야 한다. 저장 실패에는 재시도를 제공하고 마지막 입력 직후 이동해도 저장을 기다린다.

### Illustration contract — 2026-09-11

- `memory-sketch` is a quiet fashion illustration, not a fitting or fabric-reconstruction promise. The neutral head, shoulders, arms, and torso stay continuous behind one continuous garment contour.
- Silhouette IDs use seven authored, complete bodice-to-hem profiles with profile-local waist, shoulder, neckline, sleeve, back-panel, hem, and train anchors. Top, neckline, waistline, back, and train cues must attach to those anchors; the train is a connected tapered shape. Two or three broad light/shadow layers provide structural volume without guessed textile texture.
- The seven profiles must be distinguishable from the contour and release point at card scale: ball gown gathers into rounded fullness below a defined waist, empire releases under the bust while preserving the selected waist cue, fit-and-flare holds the hip before a lower flare, mermaid holds the thigh before a knee turn, sheath stays slim with restrained folds, and tea-length ends above neutral mannequin shins/feet with a deliberate ground relationship. These lower-body cues are profile-local filled planes, never repeated rails.
- Structural light may vary by profile and known satin/lace records may retain restrained tonal cues, but no unrecorded material texture is painted onto the garment. The `unknown` profile remains neutral/dashed and never confirms a known silhouette or textile.
- Visual and annotated SVGs share the same geometry; visual mode suppresses copy only. Unknown values retain neutral/dashed cues and never select a known form. Full/upper/back view bounds and the face matrix remain unchanged, with back always face-free.
- Back body closure uses the recorded back style, silhouette, waist geometry, and top coverage. Recorded topStyle masks preserve sleeve/shoulder coverage in rear views; the front neckline is never inferred into the back view. Unknown top coverage remains neutral and partial. Unknown top and neckline values use explicit unfinished neutral boundaries, and unknown silhouette contours stay dashed.
- Keep the existing warm render tokens and local catalog images. Do not add raster combinations, remote assets, new option IDs, or body-measurement claims.

### Silhouette reference state — 2026-09-12

- `silhouette-reference` is a browser-only recall aid. It reuses one existing local silhouette catalog image for the saved `silhouette` value and is always labelled **실루엣 참고**.
- The reference image is a complete-gown visual cue for silhouette only. It does not claim to reproduce the saved top, neckline, fabric, color, waistline, back, train, details, custom note, body, or face. The saved values remain visible as official Korean labels and local option examples beside the image.
- `silhouette-reference` is a secondary full/front visual opened explicitly from saved recall detail. Unknown or custom silhouette values show an honest text state and never select another silhouette image.
- `garment-artwork` is the default selection-aware visual on saved recall details, shop/review decision cards, and all compare views. It uses only same-origin prepared local assets and reports `ready`, `partial`, or `unavailable` beside the image; it never presents a partial or unavailable result as complete.

### Prepared garment artwork bridge — 2026-09-12

- `dressSvgMarkup` remains the canonical SVG composition. When a prepared `garment-artwork` result is supplied, its namespaced fragment is fitted to the existing logical frame and replaces the legacy garment/body stack; annotated labels and category notes remain outside the image fragment.
- Browser previews prepare local artwork with `embedAssets: false`. JPEG and PDF rendering prepare the same views with `embedAssets: true`, so portable v1 JSON contains no garment image bytes or new asset IDs; visual JPEGs carry only the prepared artwork needed for that page.
- `partial` results render only resolved local layers with explicit partial copy. `unavailable` results retain the bounded record sketch with an explicit unavailable message and retry when an asset load failed. Unknown fields never cause a known feature to be fabricated.
- The neutral head and optional face crop remain separate from the garment fragment. Face bytes and transforms are excluded from back, compact cards, view-only exports, and face-off recoverable exports; full/upper face inclusion remains explicit.

### Reusable recall primitives and states

| Primitive            | Anatomy                                                                   | States                                                    |
| -------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| Recall card          | 선택한 특징 이미지, 특징 제목, 업체·이름, 후보·별점, 선택 이유, 선택 예시 | recorded / legacy / unknown / image-loading / image-error |
| Recall notes         | 세 개의 짧은 레이블 입력, 선택 안내, 즉시 반영되는 글자 제한              | empty / editing / saving / saved / error-retry            |
| Sketch viewer        | 그림, 전체·상체·뒤태 선택 버튼, 의미 있는 HTML 캡션                       | full / upper / back / unknown / optional-face             |
| Silhouette reference | 완성 드레스 참고 이미지, `실루엣 참고` label, recorded option labels      | available / no-reference / loading / image-error          |
| Selected artwork     | 기존 이미지, 공식 용어, 쉬운 설명; 실제 사진이 아닌 선택 예시 안내        | known / unknown-text / loading / error                    |
| Comparison group     | 두 열의 동일 항목, 이유/실제 차이/정보 부족 그룹                          | observed-difference / incomplete / same / empty           |

### Recall tokens

기존 Pretendard, blush, 흰 shell, 4px spacing과 44px 목표를 유지한다. 제목은 20px/28px semibold 또는 bold, 본문·메모는 14px/22px, 보조 식별 정보는 12px/18px, 섹션 제목은 16px/24px이다. 320px에서도 두 비교 열의 본문은 12px/20px 아래로 줄이지 않는다. 그림의 작은 글자를 키우는 대신 HTML로 분리한다.

기존 CSS 토큰을 정식 채택한다: canvas `#eef0f2`, shell `#ffffff`, artwork-surface `#faf7f5`, preview-surface `#fbf8f6`, ink `#211d1c`, ink-muted `#6f6662`, accent-soft `#fff2ee`, accent `#b96e63`, accent-copy `#8b5750`, error `#b91c1c`, error-surface `#fef2f2`. 카드 24px, preview 28px, control 16px radius; 간격 4/8/12/16/20/24/32px. 이미지 안쪽은 외곽 radius에서 padding을 뺀 값을 사용한다. 그림 면은 기존 preview-surface, 선택 이유 면은 accent-soft를 쓰며 의미 없는 장식이나 추가 팔레트를 만들지 않는다.

모바일 스케치는 정보량에 따라 4:5 또는 3:4 영역을 사용하고, 전체 드레스 끝단이나 트레인을 자르지 않는다. 확대해도 unknown 표시와 face 정책은 동일하다. 긴 한국어는 단어를 보존하고, 매우 긴 단일 문자열만 안전하게 줄바꿈한다.

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
- `silhouette/ballGown.webp` / `ballGown` | 벨라인 | 허리부터 둥글고 풍성하게 퍼져요. | —
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

The visible label is **드레스 기억 스케치** for the deterministic fallback and annotated record view. The primary recall image is the prepared local `garment-artwork` composition described above; it is not a virtual try-on or a body-measurement claim. Unknown fields remain explicit, and no remote generation or runtime artwork is introduced.

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

| Surface       | Sketch and fields                                                                                                                            | Decision / exception treatment                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Shop          | Selection-aware garment artwork, compact recorded labels, candidate/rating                                                                   | Concise category-labelled exception when present; recorded sketch remains in detail. |
| Review        | Selection-aware garment artwork, compact recorded labels, high-signal tags                                                                   | Details, exceptions, memo without hiding unknowns.                                   |
| Compare       | Both selection-aware garment artworks in full/upper/back; every differing recorded field as labelled rows; silhouette reference is secondary | Category-labelled exception notes; blanks and unknowns differ.                       |
| Per-dress PDF | Prepared full, upper, back panels; swatch; all terms/notes/tags/memo                                                                         | Apply face matrix and show `미기록`/unsupported honestly.                            |
| Favorites PDF | Prepared full artwork and bounded decision summary                                                                                           | Face only under explicit PDF include rule; no virtual try-on or likeness claim.      |

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

### Interrupted text recovery

저장된 도메인 데이터의 기준은 Dexie다. 새 기억 메모 세 필드는 입력 즉시 저장을 시작하며, 같은 탭에서 저장 도중 새로고침한 경우에만 복구할 수 있도록 sessionStorage에 제한된 임시 스냅샷을 둔다. 스냅샷은 revision이 일치하는 저장 완료 시 제거하고 전체 데이터 삭제에도 포함한다. 얼굴·이미지·다른 도메인 데이터는 담지 않는다. 후보 결정 저장 중에는 메모 입력을 비활성화해 핵심 기록과 메모가 어긋나지 않게 한다.

## Release interaction additions — 2026-10-21

- Reuse the local 61-image catalog for the home three-step guide and optional neckline/silhouette explanations. Empty states use the existing dress-note motif; transfer diagrams explain phone → recoverable PDF → phone without implying cloud sync.
- Keep the large recall picture and provide a direct anchor to saved reasons. Comparison explicitly labels differences, matches, and missing records.
- Selection feedback uses 150ms, step/image entry 200ms, and a one-time saved confirmation at most 300ms as initial interaction tokens. These transitions never delay a write or navigation. Reduced-motion removes animation, movement, and transition while retaining text and state.
- Missing entities and route errors provide recovery actions. Home can reveal all older records; user-authored dress names survive reordering.
- A generated PDF is tied to its immutable mode/face settings. Generating locks the settings and older requests cannot replace current results.
