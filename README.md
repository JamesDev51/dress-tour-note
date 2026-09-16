# 드레스노트 (dress-tour-note)

사진 촬영이 어려운 드레스투어에서 드레스 특징을 빠르게 선택해 기록하고, **복원 가능한 PDF 한 파일**로 다른 기기에 옮길 수 있는 모바일 전용 웹앱입니다.

## 제품 원칙

- React + TypeScript + Vite, Vercel 정적 호스팅
- 서버/API/로그인/분석 SDK 없음
- 모바일 전용 UI (`max-width: 480px`)
- Dexie/IndexedDB 자동 저장
- 선택 기록으로 그리는 결정론적 SVG 기억 스케치 (AI 이미지 생성 없음)
- 얼굴 사진은 브라우저에서 재인코딩 후 로컬 저장
- 첫 정상 로드 후 PWA 오프라인 사용

## 구현 기능

### P0

- 투어/샵/드레스 CRUD, 순서 변경, 복제, 연쇄 삭제
- 4단계 핵심 기록: 어깨/상의, 네크라인, 실루엣, 후보 여부
- 마지막 단계에서 기억할 특징·좋았던 점·아쉬운 점을 선택적으로 기록
- 저장한 드레스는 특징·선택 이유·소재/뒤태 예시와 함께 다시 보기
- 비교에서는 관찰된 차이, 같은 특징, 기록이 부족한 항목을 구분
- 선택형 9개 상세 카테고리: 어깨/상의, 네크라인, 실루엣, 소재, 색상, 허리선, 등 디자인, 트레인, 디테일
- 9개 카테고리의 알려진 선택지 61개와 각 선택지의 로컬 WebP 카드 이미지
- 기존 v1 값은 화면에서만 새 선택 체계로 매핑하고 원본은 보존
- 전체·상체·뒤태를 같은 규칙으로 그리는 결정론적 SVG 기억 스케치와 선택적 얼굴 포트레이트
- `기억 안 남`과 카테고리별 `비슷하지만 달라요` 메모를 구분해 저장·표시
- 빠른 평가 태그, 별점, 후보 하트, 메모 autosave
- JPEG/PNG/WebP 얼굴 업로드, 로컬 리사이즈/재인코딩, 위치/크기/회전 조절
- IndexedDB 자동저장 및 새로고침/재실행 복구
- 복원 가능한 A4 PDF export/import
- `gudress-manifest.json` + `gudress-tour.json` + 선택적 얼굴 첨부, SHA-256 검증
- 이전 PDF의 `gudress-data-v1.json`은 가져오기에서만 레거시 fallback으로 인식
- 동일 tourId 충돌 시 복사본/덮어쓰기
- PWA 오프라인 캐시
- 전체 로컬 데이터/캐시 삭제와 개인정보 안내

### P1

- 모바일에서 드레스 2벌 나란히 비교
- Web Share API 네이티브 PDF 파일 공유 + 미지원 시 다운로드 fallback
- 복원 데이터/얼굴을 넣지 않는 보기 전용 PDF
- 뒤태/트레인/허리선/디테일을 상세 기록과 기억 스케치에 반영
- HEIC/HEIF 브라우저 내 변환 후 얼굴 입력
- 클린 테마와 Pretendard 글꼴 고정

### 제품 원칙상 제외

- 로그인/클라우드 동기화
- 공동 편집 링크
- AI 가상 피팅
- 일반 PDF OCR 복원
- 광고/분석 SDK

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
- `/tour/:tourId/review` 결과 검토 / 비교 선택
- `/tour/:tourId/compare?a=...&b=...` 모바일 2벌 비교
- `/tour/:tourId/export` portable/view-only PDF 내보내기
- `/import` portable PDF 복원
- `/privacy` 개인정보 / 전체 삭제

## 저장 모델

IndexedDB schema v1: `tours`, `shops`, `dresses`, `assets`, `meta`. 사용자 영속 데이터의 진실 원천은 Dexie입니다. Zustand는 저장 상태/토스트/PWA 업데이트 같은 UI 상태에만 사용합니다. 저장 중 새로고침한 기억 메모 세 필드는 같은 탭의 sessionStorage 임시 스냅샷에서 복구하며, 저장 완료 또는 전체 삭제 시 제거합니다. 화면은 클린 테마와 Pretendard 글꼴을 사용하며, 기존 로컬 화면 설정 키는 전체 삭제 시 함께 정리됩니다.

## PDF schema v1

- 복원용 첨부: `gudress-manifest.json` + `gudress-tour.json`
- 얼굴 포함 시 첨부: `gudress-face.webp` 또는 `gudress-face.jpg`
- 이전 PDF 호환: `gudress-data-v1.json`은 가져오기에서만 레거시 fallback으로 인식
- format: `gudress-portable-tour`
- schemaVersion: `1`
- 얼굴 제외 옵션은 페이지뿐 아니라 JSON의 asset ref, dress.faceTransform, PDF 첨부 바이트까지 제거합니다.
- 보기 전용 PDF는 JSON/얼굴 첨부가 전혀 없습니다.
- 일반 PDF/OCR 복원은 하지 않습니다.

## 드레스 옵션 추가

`src/types/domain.ts` union → `src/lib/dress/options.ts` 라벨/프레젠테이션 매핑 → `src/components/OptionArtwork.tsx` URL 맵과 `public/assets/options/` 이미지/매니페스트 → 필요 시 `src/lib/renderer/dressSvg.ts` 렌더링 → portable schema 테스트 순서로 함께 수정합니다. `npm run validate:option-catalog`로 정확한 경로, 크기, 해시, 오프라인 캐시 적격성을 검증합니다. v1에 추가된 `backStyle`은 과거 v1 PDF와의 호환성을 위해 optional 필드입니다. `dressForPresentation`은 원본을 변경하지 않습니다.

## 배포

Vercel Framework Preset은 Vite, Install Command는 `npm ci`, Build Command는 `npm run build`, Output Directory는 `dist`입니다. Production 메타데이터에는 `VITE_PUBLIC_SITE_URL` 또는 Vercel production URL이 필요하며, `vercel.json`이 SPA rewrite와 보안 헤더를 적용합니다.
