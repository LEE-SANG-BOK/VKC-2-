# Codex Prompt Protocol (VKC) — 설계 일관성 & 오류 최소화

목표: Viet K‑Connect에서 Codex(에이전트)가 **일관된 설계/워크플로우**로 작업하고, **실수/누락/드리프트**를 최소화한다.  
적용 범위: 기능 개발, 버그 수정, 리팩토링, 문서 업데이트, PR/리뷰 대응 전부.

> 기술/아키텍처 규칙(비협상)은 `AGENTS.md` + `docs/EXECUTION_PLAN.md`가 1순위다.

---

## 1) 작업 시작 전 “Task Intake” (반드시 먼저)

아래 항목을 먼저 확정/기록하면, 중간에 설계가 흔들리거나 되돌리는 비용이 크게 줄어든다.

### 1.1 Constraints & Dependencies (제약/의존)

- **Non‑negotiables** 확인
  - 서버 액션 금지(“use server” 금지), `src/app/api/**` API Routes만
  - Drizzle/Supabase/TanStack Query/repo 패턴 유지
  - i18n(ko/vi 키 동기화) 유지
- **순서 의존성** 확인
  - 스키마/마이그레이션 → API → FE → 문서/테스트 순서처럼, 선행 작업이 후행을 막지 않게 정렬
  - Hot File(충돌 위험) 여부를 먼저 체크하고, 범위/소유권을 분리

### 1.2 Risks Before Acting (리스크 평가)

- 변경의 위험도를 먼저 분류하고, 그에 맞는 검증/게이트를 계획한다.
  - **Low**: 문서/스킬/리팩토링(외부 영향 적음)
  - **Medium**: API/FE 변경(사용자 플로우/SEO 영향)
  - **High**: DB 스키마/마이그레이션, 인증/권한, 데이터 손실 가능 변경
- High/Medium 변경은 “Done 기준 + 검증 커맨드”를 먼저 고정한다.

### 1.3 Leverage Available Info (정보 선활용)

질문하기 전에, 아래를 먼저 읽고/검색해서 “이미 답이 있는지” 확인한다.

- 정책/절차: `AGENTS.md`, `docs/EXECUTION_PLAN.md`, `docs/WORKING_PLAN.md`
- 도메인 SoT(있다면): 예) STEP3는 `docs/STEP3_SOT_RESOURCES.md`
- 코드 검색: `rg`로 기존 패턴/유사 구현을 찾고 그대로 따른다.

---

## 2) Abductive Debugging Loop (문제 분석 방식)

버그/이슈 대응은 “추측→코딩”이 아니라, **가설→검증→수정**을 짧게 반복한다.

1) 증상 정리(재현 단계, 기대/실제, 영향 범위)  
2) 가능한 원인 가설 2~3개(가장 그럴듯한 것부터)  
3) 빠른 검증(로그/검색/최소 재현)  
4) 원인 확정 후 최소 수정(원인 제거)  
5) 회귀 방지(테스트/린트/문서/가드레일)

---

## 3) Output Grounding (근거 기반 산출물 규칙)

- “왜/무엇/어떻게 검증”을 항상 세트로 쓴다.
- 근거는 **파일 경로/구조/SoT 문서**로 연결한다. (예: `docs/WORKING_PLAN.md`, `src/app/api/**`)
- 요구사항/정책 충돌이 있으면 **우선순위(AGENTS → EXECUTION_PLAN → WORKING_PLAN → 요청)** 기준으로 해결한다.

---

## 4) Done Criteria (완료 기준) — 먼저 쓰고 시작

작업 종류별로 “완료”를 명확히 정의한다.

### 4.1 API(Route) 작업

- 입력 검증/권한/에러 응답/레이트리밋이 표준 패턴으로 동작
- 타입체크/빌드가 통과
- 최소 1개 “의도된 요청/실패 케이스”가 확인됨

### 4.2 FE(UX) 작업

- 모바일(저속 네트워크)에서 핵심 플로우가 막히지 않음
- ko/vi 레이아웃 깨짐 없음(텍스트 길이)
- CLS/LCP 악화 요소(이미지/영상/임베드) 점검

### 4.3 DB/마이그레이션 작업

- 스키마 변경이 롤백/데이터 보존 관점에서 안전
- 마이그레이션 생성/적용 흐름이 `docs/EXECUTION_PLAN.md` 게이트에 맞음

---

## 5) 실행 프롬프트 템플릿 (VKC 표준)

Codex에게 아래 형태로 지시하면 누락이 줄고, FE/BE 경계가 선명해진다.

```md
$vkc-repo-guardrails
$<필요한 스킬들...>

## Goal
- (한 문장)

## Scope
- In-scope:
- Out-of-scope:

## Constraints (Non-negotiables)
- (예: 서버 액션 금지, API Routes만, 로그인+verification 게이트, 1/day 제한 등)

## Done (Acceptance Criteria)
- (테스트/빌드/UX 기준 포함)

## References / SoT
- (관련 문서/파일 경로)

## Notes
- (리스크/의존성/선행결정)
```

---

## 6) 권장 “스킬 매핑”

- API 표준 골격: `$vkc-api-route-pattern`
- 위저드 UI(단계형): `$vkc-wizardkit`
- DB 스키마/마이그레이션: `$vkc-drizzle-schema-migration`
- 운영 승인 워크플로우: `$vkc-admin-ops-workflow`
- 아키텍처 드리프트 방지: `$vkc-repo-guardrails`
- 릴리즈 전 UX 감사: `$vkc-ux-audit`

