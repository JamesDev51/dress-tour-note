# 드레스노트 (dress-tour-note)

사진 촬영이 어려운 드레스투어에서 드레스 특징을 빠르게 선택해 기록하고, **복원 가능한 PDF 한 파일**로 다른 기기에 옮길 수 있는 모바일 전용 웹앱입니다.

## 제품 원칙

- React + TypeScript + Vite, Vercel 정적 호스팅
- 서버/API/로그인/분석 SDK 없음
- 모바일 전용 UI (`max-width: 480px`)
- Dexie/IndexedDB 자동 저장
- 선택한 특징에 따른 로컬 의상 이미지 합성과 canonical SVG/PDF 출력 (런타임 AI 이미지 생성 없음)
- 얼굴 사진 입력·합성 기능 없음
- 첫 정상 로드 후 PWA 오프라인 사용

## 구현 기능

### P0

- 투어/샵/드레스 CRUD, 순서 변경, 복제, 연쇄 삭제
- 3단계 기본 기록: 실루엣 → 소재 → 상체. 가슴라인과 끈·소매는 같은 단계에서 각각 고릅니다.
- 소재는 한 번 고르고, 다를 때만 간단한 전환으로 상체·치마를 따로 고릅니다. 두 소재가 다르면 아래 소재가 시작되는 위치(허리·골반·허벅지·무릎)를 고를 수 있습니다. 망사와 쉬폰은 하나의 선택지입니다.
- 선택 시 화면은 이동하지 않습니다. 미리보기 버튼으로 현재 조합을 열고 닫으면 선택하던 위치로 돌아옵니다.
- 피팅한 드레스 한 벌을 한 건으로 기록합니다. 예전에 저장한 추가 연출은 계속 열어보고 PDF로 백업할 수 있습니다.
- 기록을 마친 뒤 미리보기에서 전체 그림에 펜으로 표시할 수 있습니다. 세 가지 굵기와 한 획 되돌리기를 지원하며, 저장한 선은 PDF 전체 그림에도 표시됩니다.
- 혼합 소재는 v4, 아래 소재의 시작 위치를 저장한 기록은 v5로 내보냅니다. 기존 파일은 허리 기준으로 복원합니다.
- 마지막 단계에서 기억할 특징·좋았던 점·아쉬운 점을 선택적으로 기록
- 저장한 드레스는 특징·선택 이유·소재 예시와 함께 다시 보기
- 기본 기록 외 허리선·장식·세부 특징을 선택적으로 기록
- 승인된 로컬 WebP 61개 원본 카탈로그를 유지하고 현재 사용하는 선택지만 노출
- 기존 기록의 원본은 보존하며 제거된 항목은 현재 화면과 미리보기에서 제외
- 전체·상체의 로컬 의상 합성, 상체/치마 소재 분리, 미기록/부분 반영 안내
- 겹친 주름·진주·스팽글·꽃장식을 실제 드레스 영역에 반영
- `기억 안 남`과 카테고리별 `비슷하지만 달라요` 메모를 구분해 저장·표시
- 외형 평가 태그, 별점, 후보 하트, 메모 autosave
- IndexedDB 자동저장 및 새로고침/재실행 복구
- 복원 가능한 A4 PDF export/import
- `gudress-manifest.json` + `gudress-tour.json`, SHA-256 검증. 새 PDF에는 얼굴 참조·변환·이미지를 넣지 않음
- 이전 PDF의 `gudress-data-v1.json`은 가져오기에서만 레거시 fallback으로 인식
- 동일 tourId 충돌 시 복사본/덮어쓰기
- PWA 오프라인 캐시
- 전체 로컬 데이터/캐시 삭제와 개인정보 안내

### P1

- Web Share API 네이티브 PDF 파일 공유 + 미지원 시 다운로드 fallback
- 복원 데이터를 넣지 않는 보기 전용 PDF
- 허리선·장식·세부 특징을 상세 기록과 미리보기에 반영
- 클린 테마와 Pretendard 글꼴 고정

### 제품 원칙상 제외

- 로그인/클라우드 동기화
- 공동 편집 링크
- AI 가상 피팅
- 일반 PDF OCR 복원
- 광고/분석 SDK
- 길이·트레인·색상·뒷모습·뒤 여밈·탈부착 소매·착용감 태그·얼굴 기능
- 두 드레스·두 연출의 나란히 비교 기능

## 출시 보완

현재 제품 기준은 [docs/PRD.md](docs/PRD.md), 수용 기준은 [릴리스 체크리스트](docs/RELEASE_CHECKLIST.md)를 참고하세요. 홈 사용 순서와 PDF 전달 도식, 옵션 비교 도움말, 모션 감소를 지원하는 선택·단계·이미지 피드백을 제공합니다. 사용자 이름 보존, 과거 기록 더 보기, 없는 주소 복구, PDF 생성 설정 잠금도 포함합니다.

## 실행

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run validate:option-catalog
npm run test:option-catalog-validator
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## 주요 라우트

- `/` 홈 / 최근 기록
- `/tour/new` 투어 생성
- `/tour/:tourId` 투어 대시보드
- `/tour/:tourId/shop/:shopId` 샵 상세
- `/tour/:tourId/dress/:dressId` 드레스 편집
- `/tour/:tourId/review` 전체 기록 / 후보 모아보기
- `/tour/:tourId/export` portable/view-only PDF 내보내기
- `/import` portable PDF 복원
- `/privacy` 개인정보 / 전체 삭제

## 저장 모델

IndexedDB schema v1: `tours`, `shops`, `dresses`, `assets`, `meta`. 사용자 영속 데이터의 진실 원천은 Dexie입니다. Zustand는 저장 상태/토스트/PWA 업데이트 같은 UI 상태에만 사용합니다. 저장 중 새로고침한 기억 메모 세 필드는 같은 탭의 sessionStorage 임시 스냅샷에서 복구하며, 저장 완료 또는 전체 삭제 시 제거합니다. 화면은 클린 테마와 Pretendard 글꼴을 사용하며, 기존 로컬 화면 설정 키는 전체 삭제 시 함께 정리됩니다.

## PDF 복원 형식

- 복원용 첨부: `gudress-manifest.json` + `gudress-tour.json`
- 이전 PDF 호환: `gudress-data-v1.json`은 가져오기에서만 레거시 fallback으로 인식
- format: `gudress-portable-tour`
- 데이터/manifest 버전: 기본 v1, 추가 연출 v2, 과거 뒤 여밈 기록 v3, 상체·치마 소재 분리 v4, 아래 소재 시작 위치 v5, 손으로 그린 표시 v6. 필요한 값을 보존할 수 있는 버전으로 내보내며 v1–v6를 가져옵니다.
- envelope/trailer 형식은 v1을 유지합니다.
- 새 PDF는 항상 얼굴의 asset ref, dress.faceTransform, 첨부 바이트를 제외합니다. 과거 얼굴 포함 PDF의 읽기 호환성은 유지하되 얼굴 기능은 노출하지 않습니다.
- 보기 전용 PDF에는 복원 JSON 첨부가 없습니다.
- 일반 PDF/OCR 복원은 하지 않습니다.

## 드레스 옵션 추가

`src/types/domain.ts` union → `src/lib/dress/options.ts` 라벨/프레젠테이션 매핑과 `activeOptions.ts` 활성 선택지 → `src/components/OptionArtwork.tsx` URL 맵과 `public/assets/options/` 이미지/매니페스트 → 필요 시 `src/lib/renderer/dressSvg.ts` 렌더링 → portable schema 테스트 순서로 함께 수정합니다. `npm run validate:option-catalog`로 정확한 경로, 크기, 해시, 오프라인 캐시 적격성을 검증합니다. 과거 값을 읽기 위한 enum/optional 필드는 유지하며, `activeAppearance`는 저장 원본을 바꾸지 않고 현재 제품에 맞게 표시합니다.

## 배포

Vercel Framework Preset은 Vite, Install Command는 `npm ci`, Build Command는 `npm run build`, Output Directory는 `dist`입니다. Production 메타데이터에는 `VITE_PUBLIC_SITE_URL` 또는 Vercel production URL이 필요하며, `vercel.json`이 SPA rewrite와 보안 헤더를 적용합니다.
