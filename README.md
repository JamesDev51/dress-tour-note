# 그드레스 · Dress Tour Note

사진 촬영이 제한되는 드레스투어에서 그림 대신 구조적 특징을 선택해 드레스를 기록하고, 사람이 읽는 결과표와 편집용 원본 데이터를 하나의 PDF로 보관하는 **모바일 전용 로컬 퍼스트 웹앱**입니다.

- 서버 없음
- 로그인 없음
- 사용자 기록·얼굴 사진 외부 전송 없음
- IndexedDB 자동 저장
- SVG 기반 드레스 조합
- 원본 PDF 내보내기 및 다른 기기에서 전체 복원

## 제품 범위

Release 1.0은 다음 기능을 포함합니다.

1. 투어 생성·수정·삭제
2. 드레스샵 생성·수정·정렬·삭제 및 5초 실행 취소
3. 샵별 드레스 생성·복제·정렬·삭제
4. 어깨/소매, 가슴선, 허리선, 치마, 소재, 디테일, 트레인, 뒷모습, 색감 선택
5. 같은 좌표계의 SVG 실시간 스케치
6. 빠른 인상 태그, 자유 메모, 후보 저장
7. 얼굴 사진 로컬 처리, 이동·확대·회전, 화면/PDF 포함 토글
8. IndexedDB 자동 저장 및 재접속 복구
9. 샵별 결과 PDF 및 후보 요약 페이지
10. PDF 내부 JSON·얼굴 이미지 첨부, SHA-256 검증, 기기 간 복원
11. 후보 2~3벌 모바일 비교
12. 전체 데이터 삭제와 개인정보 안내

## 기술 스택

- React 19 + TypeScript + Vite
- React Router
- Dexie / IndexedDB
- Zustand
- SVG dress composer
- `pdf-lib` for visible PDF assembly and embedded attachments
- `pdfjs-dist` for attachment extraction
- Vitest + Testing Library + fake-indexeddb
- Playwright mobile Chromium/WebKit + axe-core
- Vercel static SPA

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run format:check
```

한 번에 실행:

```bash
npm run validate
```

## 주요 라우트

| 경로 | 화면 |
|---|---|
| `/` | 홈 및 최근 기록 |
| `/tour/new` | 새 투어 |
| `/tour/:tourId` | 투어 대시보드 |
| `/tour/:tourId/shop/:shopId` | 샵 상세 |
| `/tour/:tourId/shop/:shopId/dress/:dressId/edit` | 드레스 편집기 |
| `/tour/:tourId/face` | 내 얼굴로 느낌 보기 |
| `/tour/:tourId/favorites` | 후보 선택 |
| `/tour/:tourId/compare` | 2~3벌 비교 |
| `/tour/:tourId/export` | PDF 미리보기 및 내보내기 |
| `/import` | 원본 PDF 불러오기 |
| `/settings` | 저장 현황·개인정보·전체 삭제 |

Vercel의 `vercel.json`이 모든 직접 진입 경로를 `index.html`로 되돌립니다.

## 데이터 구조

IndexedDB 이름은 `gudeureseu-db`이며 스키마 버전은 1입니다.

- `tours`: 투어 기본 정보와 공통 얼굴 transform
- `shops`: 투어별 샵 및 정렬값
- `dresses`: 샵별 드레스 스타일·태그·메모·후보
- `assets`: 얼굴 사진 Blob
- `settings`: 최근 열린 기록 등 로컬 설정

모든 사용자 입력은 브라우저 안에서만 저장됩니다. 브라우저 데이터 삭제, 시크릿 모드 종료, 저장 공간 자동 정리 시 사라질 수 있으므로 투어가 끝나면 원본 PDF 보관을 안내합니다.

## 자동 저장 설계

드레스 옵션은 즉시 큐에 들어가고 메모·이름은 300ms debounce 후 저장됩니다. 같은 엔티티의 연속 변경은 하나의 patch로 합쳐지고, 엔티티별 Promise chain으로 쓰기 순서를 보장합니다.

- 저장 중: `저장 중…`
- 성공: `저장됨 ✓`
- 실패: `저장 안 됨`, 탭하여 재시도
- 용량 초과: `저장 공간 부족`
- PDF 내보내기 전 해당 투어의 pending queue를 반드시 flush

## 편집 가능한 PDF 포맷

앱 식별자와 포맷은 다음과 같습니다.

```text
appId: com.mmingjjung.gudeureseu
format: gudeureseu-editable-pdf
schemaVersion: 1
```

표시 페이지를 만든 뒤 `pdf-lib`로 아래 파일을 첨부합니다.

```text
gudeureseu-manifest.json
gudeureseu-tour.json
face-{assetId}.webp 또는 .jpg (선택)
```

Manifest에는 각 데이터 파일의 SHA-256과 byteSize가 포함됩니다. 불러오기 순서:

1. 50MB 제한 및 `%PDF-` 시그니처 확인
2. PDF.js로 첨부파일 추출
3. appId, format, schemaVersion 확인
4. 필수 첨부, byteSize, SHA-256 검증
5. payload enum과 참조 무결성 검증
6. 구버전 순차 migration
7. 동일 projectId 충돌 시 복사본 또는 덮어쓰기
8. 단일 IndexedDB transaction으로 저장

**복원은 앱에서 직접 내려받은 원본 PDF에만 보장됩니다.** 인쇄, 압축, 온라인 편집, 다른 PDF 앱의 재저장 과정에서 첨부파일이 제거될 수 있습니다.

## PDF 마이그레이션 규칙

- 현재 스키마보다 높은 버전은 안전하게 중단합니다.
- 낮은 버전은 `migrateExportPayload()`에서 버전별로 순차 변환합니다.
- 새 필드는 optional/default를 먼저 정의하고, 기존 enum 값을 삭제하지 않습니다.
- ID 복사 가져오기는 tour/shop/dress/asset 모든 참조를 새 UUID로 함께 remap합니다.

## SVG 자산 규칙

모든 드레스 조각은 `viewBox="0 0 1000 1400"` 좌표계를 공유합니다. 렌더 순서:

1. train back
2. mannequin / face
3. skirt base
4. bodice base
5. upper style / neckline
6. fabric texture
7. details
8. back-style inset
9. waistline / outline highlight

선택지는 외부 이미지에 의존하지 않고 파라메트릭 SVG로 생성됩니다. 카드 썸네일과 큰 미리보기, PDF 렌더러가 같은 스타일 데이터를 사용합니다.

## 얼굴 사진 처리

- 입력: JPEG, PNG, WebP, HEIC/HEIF
- 최대 입력: 20MB
- 긴 변: 최대 1600px
- 우선 저장: WebP quality 0.82
- fallback: JPEG quality 0.85
- 이동 범위, 확대 0.5~3, 회전 -15~15도
- 투어 공통 사진 1장

이 기능은 얼굴 분석이나 체형 합성이 아닌 단순 배치이며 UI에서 “가상피팅”이라는 표현을 사용하지 않습니다.

## 보안·개인정보

- 사용자 데이터에 대한 `fetch`/XHR 없음
- CSP `connect-src 'self'` 및 카메라·마이크·위치 권한 차단
- 얼굴 사진은 현재 브라우저와 사용자가 선택한 원본 PDF에만 존재
- 앱 전체 삭제 제공
- PDF 얼굴 포함 시 공유 경고 표시

## 테스트 전략

### 단위·통합

- 옵션 호환 규칙과 복수 디테일
- stable serialization과 파일명 정리
- payload validation, 참조 무결성, ID remap
- IndexedDB CRUD와 샵 하위 데이터 원자적 삭제/복원
- autosave merge, flush, 실패 보존 및 재시도

### E2E

- 새 투어 → 샵 → 드레스 → 스타일 → 메모 → 새로고침
- 후보 저장 및 비교
- 얼굴 이미지와 transform 재접속 복구
- PDF 다운로드 → 깨끗한 브라우저에서 가져오기
- 일반 PDF 안전 거부 및 DB 무변경
- 320px 가로 overflow 없음
- axe-core 접근성 검사
- 직접 URL 새로고침
- 10개 샵 × 10벌 저장 및 PDF 생성 스트레스 검사

CI는 모바일 Chromium과 모바일 WebKit에서 실행하고 실패 시 trace, screenshot, video, HTML report를 artifact로 남깁니다.

## 배포

Vercel에서 이 저장소를 연결하고 Framework Preset을 Vite로 두면 됩니다.

- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22
- 환경 변수: 없음

`master`에 push될 때 GitHub Actions 검증과 Vercel 배포가 각각 실행됩니다.
