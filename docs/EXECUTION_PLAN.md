# Viet K-Connect 실행 플랜/체크리스트 (P0→P1)

> 역할: Viet K‑Connect 프로젝트 시니어 풀스택 개발자 관점  
> 목표: “신뢰 기반 Q&A 커뮤니티” 웹 MVP를 **출시 가능한 품질**로 마무리  
> 범위: 기능/SEO/성능/모바일/디자인/리팩토링/운영 최소 기능  
> 제외: 외부 마케팅 채널 운영/광고 집행/픽셀·SDK/외부 콘텐츠 배포 전략

---

## 0. 작업 운영 원칙

### 0.1 스택/아키텍처 고정(변경 금지)
- Next.js(App Router) + Supabase(Postgres/Storage/Auth) + Drizzle ORM + TanStack Query
- NextAuth(Google) 구조 유지
- Tailwind/shadcn-ui/Magic UI 기반 스타일 유지
- 서버 액션 금지, `/api/**` API Routes만 사용

### 0.2 PR 산출물 규칙
- 각 작업은 **PR 단위로 커밋 분리**
- PR 설명에 아래 3개 항목 필수 포함
  - **why**: 어떤 문제를 해결하는가
  - **what**: 무엇을 변경했는가(파일/기능 단위)
  - **test**: 어떻게 검증했는가(수동/테스트/로그)
- 주요 화면은 **모바일/데스크톱 반응형 스크린샷 첨부**

---

## 1. 작업 진행 “공식”(팀 공통 포맷)

모든 기능/리팩토링 작업은 아래 구조로 진행한다.

1) **플랜(체크리스트)**
- 해야 할 서브태스크를 `[ ]`로 나열
- 선행 PR/의존성 명시

2) **현황 분석(코드 기준)**
- 현재 구현 위치/동작을 파일 단위로 정리
- 구현/부분 구현/미구현 구분

3) **개선 포인트(why/what)**
- 문제의 원인(why)과 변경 범위(what)
- API/DB/UI/SEO/모바일 관점 포함

4) **판정**
- **OK**(현 상태 유지) / **개선 필요**(P0/P1 포함)로 결론

5) **다음 액션**
- 다른 플랜으로 이동 or 해당 작업 PR 착수
- PR 이름(스코프) + 담당 에이전트 지정

---

## 2. P0 — 출시 전 필수 우선순위

### P0‑1) 실데이터 정합성/SEO

**플랜(체크리스트)**
- [ ] posts 상세 mock/샘플 의존 제거
- [ ] `generateMetadata` 실데이터 기반 title/desc/OG/Twitter/canonical 정합화
- [ ] JSON‑LD(QAPage) 본문/답변/통계 100% 일치
- [ ] sitemap: 실제 posts id + categories + profiles 동적 포함
- [ ] robots sitemap 경로 유지/검증

**현황 분석**
- 상세 SSR/메타는 실데이터 기반으로 구현됨: `src/app/[lang]/(main)/posts/[id]/page.tsx`.
- mock 파일이 잔존하나 라우트에서 사용되지 않음: `src/app/[lang]/(main)/posts/[id]/postData.ts`(dead code).
- JSON‑LD는 실데이터와 불일치(댓글/답변/공유/answerCount 0 고정).
- sitemap은 posts id만 일부 동적, categories는 하드코딩, profiles 미포함: `src/app/sitemap.ts`.
- robots는 OK: `src/app/robots.ts`.

**개선 포인트**
- mock 파일 및 더미 로직 전수 제거.
- `fetchPost` 응답의 answers/comments/likes/view 수를 JSON‑LD/메타에 동기화.
- OG/JSON‑LD에 썸네일 포함.
- sitemap을 categories/users까지 DB 기반 동적 생성.

**판정**: 부분 OK, 개선 필요(JSON‑LD 정합성 + mock 잔존 제거 + sitemap 확장)

**다음 액션(PR)**
- PR‑A1: `seo-realdata-postdetail`
- PR‑A2: `seo-sitemap-dynamic` (A1과 파일 충돌 적음)

---

### P0‑2) 인증(Verification) End‑to‑End

**플랜(체크리스트)**
- [ ] `/verify` 3‑step wizard UX(타입 선택 → 업로드 가이드 → 상태/이력)
- [ ] private storage 업로드 + **public URL 저장 금지**, path 기반 관리
- [ ] 관리자 승인/반려 시 문서 즉시 삭제(or TTL)
- [ ] 승인 라벨을 프로필/답변 카드에 표시(비자/경력/한국 n년차)
- [ ] 관리자 pending 큐 UI에 사유/배지타입/만료 입력 포함

**현황 분석**
- 사용자 페이지는 단일 폼 + 이력 토글: `src/app/[lang]/(main)/verification/request/*`.
- documents 버킷은 private 사용.
- 그러나 업로드 헬퍼가 publicUrl 생성/저장: `src/lib/supabase/storage.ts` → private 정책/삭제 관리와 충돌.
- 관리자 큐/승인 UI/API는 기본 구현됨: `src/app/admin/(dashboard)/verifications/*`, `/api/admin/verifications/*`.
- 승인/반려 후 storage 삭제 로직 없음.
- “라벨(비자, 경력 등)” UI 노출 없음.

**개선 포인트**
- verificationRequests.documentUrls에는 publicUrl 대신 storage path 저장.
- 관리자 화면에서 signed URL로만 미리보기.
- 승인/반려 시 `deleteFiles('documents', paths)` 수행.
- 사용자 요청 UI를 wizard로 재설계.
- 승인 라벨을 users 메타로 저장/노출.

**판정**: 개선 필요(핵심 P0)

**다음 액션(PR)**
- PR‑B1: `verification-storage-path-signedurl-delete`
- PR‑B2: `verification-wizard-user-ui`
- PR‑B3: `verification-admin-queue-extended`

---

### P0‑3) 모바일 UX 필수 개선

**플랜(체크리스트)**
- [ ] 하단 탭 5개 + “질문하기” CTA 강조
- [ ] 질문/답변 폼 모바일 키보드 안전영역 + autosize 입력 + skeleton
- [ ] 리스트는 infinite scroll로 통일

**현황 분석**
- 하단 탭 5개는 구현 완료: `src/components/organisms/BottomNavigation.tsx`.
- 질문하기 CTA는 시각적 위계 강화가 부족.
- 글 작성 폼 skeleton은 있으나 autosize/키보드 safe‑area 대응은 불충분.
- 리스트 infinite scroll은 홈/검색/카테고리 모두 통일됨(PostList 기반).

**개선 포인트**
- BottomNav 중앙 탭을 primary FAB 스타일로 강조.
- NewPost/Answer 입력의 autosize + 하단 고정 submit bar + 키보드 safe‑bottom 보장.

**판정**: 부분 OK, 개선 필요(CTA 강조 + 폼 micro‑UX)

**다음 액션(PR)**
- PR‑C1: `mobile-bottomnav-cta-emphasis`
- PR‑C2: `mobile-post-answer-form-ux`
  (두 PR 모두 posts 상세 파일은 건드리지 않도록 범위 제한)

---

### P0‑4) 운영/관리 최소 기능

**플랜(체크리스트)**
- [ ] 신고 UI/흐름 점검 및 누락 보완
- [ ] 관리자 신고 큐 액션 정합화(숨김/삭제/경고/차단)
- [ ] 상단 공지/배너 관리자 설정형 CRUD + 홈 노출

**현황 분석**
- 신고 기능(사용자/관리자) 기본 흐름 구현됨: `src/repo/reports/*`, `src/app/admin/(dashboard)/reports/*`.
- 공지/배너는 미구현. VietnamBanner는 정적 CTA 배너로만 존재.

**개선 포인트**
- reports admin 액션이 요구 스펙을 모두 커버하는지 점검 후 부족분만 보완.
- banners/notices 도메인 신설(테이블+API+admin UI+홈 캐러셀 SSR).

**판정**: reports는 OK에 가까움(점검 필요), 배너는 개선 필요(P0)

**다음 액션(PR)**
- PR‑D1: `reports-admin-audit-fix`
- PR‑D2: `admin-banners-crud-home-slot`

---

### P0‑5) 페이지 내 체류시간/게이팅/튜토리얼(내부 전환)

**플랜(체크리스트)**
- [ ] 질문 상세 하단 “유사 질문/같은 카테고리 인기글/다음 글 추천” 배치
- [ ] SimilarQuestionPrompt locale 링크 오류 수정
- [ ] 비회원 참여 액션 로그인 게이팅 재확인
- [ ] 신규 유저 1회성 규칙/기능 툴팁 제공

**현황 분석**
- SimilarQuestionPrompt는 작성 페이지에서만 사용, 링크 locale prefix 누락.
- 상세 하단 추천 섹션 없음.
- 게이팅은 대부분 구현.
- 1회성 튜토리얼 없음.

**개선 포인트**
- PostDetail에서 related posts prefetch + 하단 섹션 추가(SSR 포함).
- SimilarQuestionPrompt 링크를 `/${lang}` prefix 적용.
- 신규 세션 1회 툴팁/규칙 안내 추가.

**판정**: 개선 필요(P0)

**다음 액션(PR)**
- PR‑A3: `postdetail-related-content-section`
- PR‑A4: `similarprompt-locale-fix`

---

## 3. P1 — 차순위(베타 직후) 작업

### P1‑5) 온보딩(개인화)

**플랜**
- [ ] 첫 로그인 최소 질문 wizard화
- [ ] 저장값으로 홈 피드 관심 토픽 우선 노출

**현황**
- 온보딩 설문과 저장 구현됨: `src/app/[lang]/(main)/onboarding/*`.
- 홈에서 interests 기반 초기 카테고리 우선 선택 구현됨.

**판정**: OK(추가 UX polish만 필요)

**다음 액션**
- P0 완료 후 작은 UX polish PR로 진행

---

### P1‑6) 구독/알림

**현황**
- 카테고리/토픽 구독 API·필터는 존재.
- 구독 기반 in‑app 알림/설정 UI는 없음.

**판정**: 개선 필요(P1)

**다음 액션**
- P0 이후 Stream‑E로 진행

---

### P1‑7) 포인트/레벨/뱃지 + 관리자 포인트

**현황**
- users 소셜/신뢰 지표 컬럼은 존재.
- 산정 로직/노출 UI/관리자 패널 미구현.

**판정**: 개선 필요(P1)

**다음 액션**
- P1 Stream‑F로 별도 진행

---

## 4. 병렬 진행을 위한 에이전트/PR 분리 기준

### 4.1 분리 원칙
1) **도메인/파일 경계로 수평 분리**: 한 PR이 한 도메인(API+repo+UI)을 “세로로” 완결.
2) **핵심 파일 소유권 고정**: 동시 PR이 같은 핵심 파일을 수정하지 않도록 담당 고정.
3) **DB 마이그레이션 PR 단일 소유**: 동일 테이블 수정 PR 병렬 금지.
4) **홈/상세/공통 레이아웃 통합은 마지막에**: 충돌 지점 최소화.

### 4.2 P0 병렬 스트림(충돌 최소화)

| 스트림/에이전트 | PR 목록 | 소유 파일 범위 |
|---|---|---|
| **Agent A (SEO/상세/체류시간)** | A1, A2, A3, A4 | `src/app/[lang]/(main)/posts/[id]/*`, `src/app/sitemap.ts` |
| **Agent B (Verification E2E)** | B1, B2, B3 | `src/app/[lang]/(main)/verification/*`, `src/lib/supabase/storage.ts`, `src/app/api/upload/document/*`, `src/app/api/admin/verifications/*`, `src/app/admin/(dashboard)/verifications/*` |
| **Agent C (Mobile UX/Forms)** | C1, C2 | `src/components/organisms/BottomNavigation.tsx`, `src/app/[lang]/(main)/posts/new/*`, `src/components/molecules/RichTextEditor.tsx` (상세 파일은 제외) |
| **Agent D (Ops/Banners)** | D1, D2 | `src/app/admin/(dashboard)/reports/*`, `src/app/api/admin/reports/*`, `src/app/api/banners/*(신규)`, `src/app/admin/(dashboard)/banners/*(신규)`, 배너 관련 organism |

이 구조로 가면 P0는 서로 거의 파일 충돌 없이 병렬 진행 가능하고, P1은 P0 이후 동일 원칙으로 새 스트림을 추가하면 됩니다.

---

## 5. 실행 순서 제안

1) **P0 스트림 병렬 착수** (A/B/C/D 동시)
2) P0 완료 후 **P1‑6 → P1‑7 순서로 스트림 확장**
3) 모든 PR 통합 후 Lighthouse/수동 QA로 베타 출시
