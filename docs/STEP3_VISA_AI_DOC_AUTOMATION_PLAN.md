# STEP3 — VISA AI(확률 추천) + 행정서류 자동화(PDF) + 공식정보 동기화

본 문서는 STEP3에서 **(1) 비자 변경 “확률” 추천**, **(2) 행정서류 PDF 자동생성(통합신청서 + 유학생 알바 신고)**, **(3) 공식 정보 동기화 파이프라인**, **(4) 관리자 리드(영업) 파이프라인**을 한 덩어리로 설계/개발하기 위한 실행 플랜이다.

## 0) 전제(비협상)

- Framework: Next.js 16(App Router) + React 19 + TypeScript(strict)
- Backend: Supabase(Postgres/Storage/Auth) + Drizzle ORM
- Data: TanStack Query + `src/repo/**` 레이어 + keys는 `src/repo/keys.ts`에서 중앙 관리
- API: **서버 액션 금지**, `src/app/api/**` API Routes만 사용
- i18n: `ko/en/vi` 유지(최소 `ko/vi` 키 동기화는 필수)

## 1) STEP3 범위 결정(확정)

- 포함(지금 단계에 “도입”)
  - 비자 변경/연장/전환 “확률(%)” 추천: **타겟 고객이 실제로 고려하는 모든 비자 타입을 커버**(데이터 중심 룰셋으로 확장 가능 구조 강제)
  - 공식 정보 동기화(수집→스냅샷→승인→활성화): 자동화 + 운영자 승인 워크플로우
  - PDF 자동 생성: **통합신청서 + 유학생 알바(시간제취업허가/신고 관련)**
  - 관리자 리드 파이프라인: 확률/행동 기반 “핫리드” 자동 생성 + 관리자 체크/필터
- 보류(단계적으로)
  - 출입국 예약/잔여 슬롯 연동(약관/기술/운영 리스크가 커서 보류)
- 게이팅/제한(확정)
  - 로그인 필수 + **인증(verification) 승인된 사용자만** 사용 가능
  - **하루 1회 제한**(각 기능별: `visa_assessment`, `docgen_unified`, `docgen_parttime`)
  - 결제/구독 설계는 지금 단계에서 제외(단, DB/코드는 “향후 플랜/권한” 확장 가능 구조)

## 2) “확률 추천”을 구현 가능한 정의로 바꾸기(용어 정리)

여기서 “확률(%)”은 통계 모델이 아니라, **규정/요건 기반 룰엔진 결과를 0~100으로 매핑한 점수**다.

- 1) **필수요건 충족 여부(게이트)**: 불충족이면 0~N%로 제한(예: 요건 미충족)
- 2) **정량 점수(있는 비자만)**: 점수제(F-2-7 등)는 실제 점수 계산
- 3) **여유도(마진)**: 기준선 대비 여유(예: 80점 컷에서 +10점이면 상향)
- 4) **리스크 패널티**: 입력 누락/증빙 불확실/예외 케이스 등 가점/감점(운영 정책으로 관리)

즉, “요건 미달인데 80%” 같은 모순을 막고, 데이터가 쌓이면 룰을 교정/고도화할 수 있게 만든다.

## 3) 아키텍처(요약)

### 3.1 핵심 원칙

- **룰/템플릿은 코드에 하드코딩 금지**: DB(버전/효력일자)에서 로딩하여 평가/생성
- 사용자 UX는 “Wizard(단계형 입력) → 결과(확률/체크리스트) → 서류 생성(PDF) → 상담 CTA”로 고정
- 운영은 “공식 정보 업데이트 → 룰셋 갱신 → 결과 품질 유지 → 핫리드 관리” 루틴으로 고정

### 3.2 시스템 구성

- Visa Ruleset Registry(버전/효력일자)
  - 비자 타입별 요건/점수/가중치/리스크 룰 정의(데이터)
  - 평가 결과(확률/근거/부족 항목/다음 액션)를 표준 스키마로 반환
- Official Info Sync Pipeline
  - 수집(크롤/파일/API) → 스냅샷 저장 → 관리자 승인 → 활성 버전으로 승격
- DocGen(PDF)
  - PDF 템플릿 기반(`pdf-lib` 권장) + 필드 매핑(renderSpec) + Storage 저장 + 다운로드
- Lead Funnel(Admin)
  - 조건 만족 시 자동 리드 생성(예: 확률 ≥ 80% 또는 “E-7/F-2 목표” 플래그 + 고의도 행동)

## 4) DB 설계(최소 세트, Drizzle)

> 실제 구현 시 기존 테이블(`profiles`, `verification_requests`, `users.isVerified` 등)과 충돌 없이 추가/확장한다.

- `document_templates`
  - `id`, `docType`, `version`, `status(draft|active|archived)`, `effectiveFrom`, `effectiveTo?`
  - `templatePdfPath?`(원본 PDF), `renderSpecJson`(필드→폼필드명 또는 좌표/폰트/크기 매핑), `updatedBy`, `updatedAt`
- `visa_rulesets`
  - `id`, `visaType`, `version`, `effectiveFrom`, `effectiveTo?`, `status(draft|active|archived)`
  - `rulesJson`(요건/점수/패널티 규칙), `sourcesJson`(공식 출처/링크), `updatedBy`, `updatedAt`
- `visa_assessments`
  - `id`, `userId`, `inputSnapshotJson`, `resultJson`, `createdAt`
- `official_info_snapshots`
  - `id`, `kind`, `sourceUrl`, `payloadJson`, `fetchedAt`, `status(draft|approved|rejected)`, `approvedBy`, `approvedAt`
- `generated_documents`
  - `id`, `userId`, `docType(unified|parttime)`, `inputSnapshotJson`, `filePath`, `createdAt`
- `daily_usage_limits`
  - `userId`, `action`, `date(YYYY-MM-DD)`, `count`
  - 유니크: `(userId, action, date)` → 하루 1회 제한을 DB로 강제
- `leads`
  - `id`, `userId`, `source(visa_assessment|docgen|manual)`, `score`, `status(new|contacted|won|lost)`, `notes`, `createdAt`
  - 관리자 “체크 표시(핫리드)”는 `score>=threshold` 또는 별도 `isHot` 플래그로 관리

## 5) API Routes(권장)

- 사용자
  - `POST /api/visa/assess` (verification + daily limit + 평가 + 결과 저장)
  - `GET /api/visa/assessment/history`
  - `POST /api/documents/generate/unified` (verification + daily limit + PDF 생성)
  - `POST /api/documents/generate/parttime`
  - `GET /api/documents/history`
  - `GET /api/documents/[id]/download` (signed url)
- 관리자
  - `GET/PATCH /api/admin/leads` (필터/상태 변경)
  - `POST /api/admin/visa-rulesets` (draft 저장)
  - `POST /api/admin/visa-rulesets/[id]/activate` (active 승격)
  - `POST /api/admin/official-info/sync` (수집→snapshot)
  - `POST /api/admin/official-info/[id]/approve`

## 6) UX(사용자 플로우)

- `/{lang}/visa/check` (Wizard)
  - 프로필 기반 자동 채움 + 누락 질문만 단계적으로 수집
  - 결과: 비자 타입별 확률(%) 리스트 + “다음 액션”(예: 서류 생성/상담 신청 버튼)
- `/{lang}/documents` (서류함)
  - 생성 이력 + 다운로드(서명 URL) + 재생성(하루 제한)
- 서류 선택(문서 자동화 메뉴)
  - 서식명 나열보다 “상황 기반(질문형)”으로 시작해 진입 장벽을 낮춘다(예: 주소가 변경되셨나요? / 알바를 시작하나요? / 이직했나요?)
- 생성 UX
  - 생성 전 미리보기(입력값/필드 매핑) → 확정 → PDF 생성/다운로드(= 사용자가 스스로 검토 가능한 흐름)
  - 모바일: 다운로드가 어려운 케이스를 대비해 이메일 전송 또는 QR(PC 출력) 등 보조 동선을 옵션으로 둔다
- CTA(전환)
  - 확률 상위(예: ≥ 80%) 결과 화면에서 “상담 신청”을 상단 CTA로 고정(리드 생성 트리거와 연동)

## 7) Admin(운영/영업 플로우)

- `/admin/leads`
  - 핫리드(체크 표시) 우선 정렬 + 상태 칸반/필터
  - 리드 상세: 사용자 프로필 요약 + 최근 평가 결과 + 생성 문서 이력
- `/admin/visa-rulesets`
  - 룰셋 버전/효력일자 관리 + 활성화(approve/activate) 워크플로우
- `/admin/official-info`
  - 수집 스냅샷 리스트 + diff/요약 + 승인/거절

## 8) 실행 로드맵(2~4주, “돌아가는 MVP” 기준)

### Week 1 — 기반(게이팅/제한/스키마/골격)

- [ ] Drizzle 스키마 추가(룰셋/평가/문서/리드/usage limit)
- [ ] verification 게이트 공용 미들웨어/헬퍼 확정(기존 `users.isVerified` 연동)
- [ ] daily limit(DB) 적용(액션 3종)
- [ ] API Routes 골격 생성(스킬: `vkc-api-route-pattern` 활용)

### Week 2 — 비자 확률 추천(전 비자 커버 구조)

- [ ] 룰셋 JSON 스키마 확정 + “전 비자 타입 레지스트리” 등록(최소 1차 데이터)
- [ ] `/api/visa/assess` 구현 + 결과 저장 + 리드 자동 생성(임계치 기반)
- [ ] 사용자 Wizard v1(스킬: `vkc-wizardkit`) + 결과 UI(랭킹/게이지/리스트)

### Week 3 — PDF 자동생성 2종

- [ ] 템플릿 확정(공식 PDF 확보 → 가능하면 AcroForm, 아니면 배경 템플릿 + 좌표 매핑)
- [ ] `unified`/`parttime` PDF 생성 + Storage 저장 + 다운로드
- [ ] 서류함 UI + 이력/다운로드

### Week 4 — 공식 정보 동기화(운영 승인 포함)

- [ ] 수집 스냅샷 파이프라인(소스별 최소 1개) + 관리자 승인/활성화
- [ ] 룰셋/체크리스트가 “활성 공식정보”를 참조하도록 연결
- [ ] 운영 루틴 고정(주 1회 점검 + 변경 시 즉시 반영)

## 10) 자동서류 확장(Phase 2, 추가 도입 전략)

`통합신청서 + 유학생 알바` 이후에 “신고 기한/과태료/지속 이용” 효용이 큰 서류부터 확장한다.

- P2-1 (최우선, Low risk / High ROI): **체류지(주소) 변경 신고서**
  - 기한/효용: 주소 변경 후 신고 의무(14일 내) 성격으로 사용자 체감 ROI가 큼
  - 구현: 정형 PDF 템플릿 + 필드 매핑(주소/등록번호/성명 등) + 상황 기반 Wizard(“주소가 변경되셨나요?”)
- P2-2 (우선, Medium risk / High ROI): **고용/신분 변동 신고서**
  - 기한/효용: 고용 변경/신분 변경 후 신고 의무(예: 15일 내) + “졸업 이후에도 플랫폼 잔존”에 직접 기여
  - 구현: 변경 유형 분기(이직/회사정보/근무지/직종 등) Wizard + 템플릿/버전 관리
- P2-3 (중요, High risk / Medium ROI): **가족 초청 서류(사증발급인정신청/신원보증서 등)**
  - 효용: 작성 난이도/언어장벽이 커서 자동화 가치가 높고, “상담 전환” 트리거로 ROI가 큼
  - 구현: 2종 이상 문서 묶음 생성(패키지 다운로드) + 첨부서류 체크리스트 + 리드 우선순위 상향

## 11) OCR(입력 자동화) 도입(Phase 2.5)

- 여권 MRZ 인식(v1): 정확도가 높고(체크섬 검증 가능) 입력시간을 크게 단축 → Wizard의 “자동 채움”으로 연결
- ARC OCR(v2): 난이도 높음(한글 주소) → 앞면(영문명/번호) 중심 + 포맷 검증 + 사용자 수정 허용
- UX 원칙: OCR은 “선택 옵션”으로 제공하고, 결과는 항상 사용자가 수정 가능한 상태로 유지

## 12) 스킬(레포 로컬)과의 연결

- `vkc-visa-assessment-engine`: 룰셋 스키마/버전/효력일자/결과 스키마를 강제
- `vkc-docgen-template-engine`: 템플릿 스키마 + PDF renderSpec + 생성 히스토리 구조를 강제
- `vkc-admin-ops-workflow`: Draft → 검토 → Activate 운영 흐름을 표준화
