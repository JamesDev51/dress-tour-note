# 그드레스 (dress-tour-note)

사진 촬영이 어려운 드레스투어에서 그림 대신 드레스 형태를 선택해 기록하고, **복원 가능한 PDF 한 파일**로 다른 기기에 옮길 수 있는 모바일 전용 웹앱입니다.

## 제품 원칙
- React + TypeScript + Vite, Vercel 정적 호스팅
- 서버/API/로그인/분석 SDK 없음
- 모바일 전용 UI (`max-width: 480px`)
- Dexie/IndexedDB 자동 저장
- SVG 기반 드레스 조합 (AI 이미지 생성 없음)
- 얼굴 사진은 브라우저에서 재인코딩 후 로컬 저장
- 첫 정상 로드 후 PWA 오프라인 사용

## 구현 기능
### P0
- 투어/샵/드레스 CRUD, 순서 변경, 복제, 연쇄 삭제
- 어깨/끈, 넥라인, 실루엣, 허리선, 소재, 색, 트레인, 디테일 조합
- 상체 조합 호환성 자동 보정
- SVG 실시간 미리보기
- 빠른 평가 태그, 별점, 후보 하트, 메모 autosave
- JPEG/PNG/WebP 얼굴 업로드, 로컬 리사이즈/재인코딩, 위치/크기/회전 조절
- IndexedDB 자동저장 및 새로고침/재실행 복구
- 복원 가능한 A4 PDF export/import
- `gudress-data-v1.json` + 선택적 얼굴 첨부, SHA-256 검증
- 동일 tourId 충돌 시 복사본/덮어쓰기
- PWA 오프라인 캐시
- 전체 로컬 데이터/캐시 삭제와 개인정보 안내

### P1
- 모바일에서 드레스 2벌 나란히 비교
- Web Share API 네이티브 PDF 파일 공유 + 미지원 시 다운로드 fallback
- 복원 데이터/얼굴을 넣지 않는 보기 전용 PDF
- 뒤태 별도 기록
- HEIC/HEIF 브라우저 내 변환 후 얼굴 입력
- 크림/클린 테마, 고딕/명조 글꼴 로컬 설정

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
npm run build
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
- `/privacy` 보기 설정 / 개인정보 / 전체 삭제

## 저장 모델
IndexedDB schema v1: `tours`, `shops`, `dresses`, `assets`, `meta`. 사용자 영속 데이터의 진실 원천은 Dexie입니다. Zustand는 저장 상태/토스트/PWA 업데이트 같은 UI 상태에만 사용합니다. 테마/글꼴은 기기 UI preference로 별도 로컬 저장되며 전체 삭제 시 함께 초기화됩니다.

## PDF schema v1
- 첨부 JSON: `gudress-data-v1.json`
- format: `gudress-portable-tour`
- schemaVersion: `1`
- 얼굴 포함 시: `gudress-asset-{id}.webp|jpg`
- 얼굴 제외 옵션은 페이지뿐 아니라 JSON의 asset ref, dress.faceTransform, PDF 첨부 바이트까지 제거합니다.
- 보기 전용 PDF는 JSON/얼굴 첨부가 전혀 없습니다.
- 일반 PDF/OCR 복원은 하지 않습니다.

## 드레스 옵션 추가
`src/types/domain.ts` union → `src/lib/dress/options.ts` 라벨/호환성 → 필요 시 `src/lib/renderer/dressSvg.ts` 렌더링 → portable schema 테스트 순서로 함께 수정합니다. v1에 추가된 `backStyle`은 과거 v1 PDF와의 호환성을 위해 optional 필드입니다.

## 배포
Vercel Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는 `dist`, 환경변수는 없습니다. `vercel.json`이 SPA rewrite와 보안 헤더를 적용합니다.
