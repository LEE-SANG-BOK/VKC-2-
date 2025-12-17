# VietHub (Viet K-Connect) 프로젝트 인수인계 문서

---

## 최근 주요 변경 사항

- 모바일 하단 네비게이션 추가 및 안전 영역 패딩 적용 (다국어 경로, 알림 뱃지 포함)
- 모바일 사이드바를 Sheet 드로어로 전환, 데스크톱 사이드바는 스티키 유지
- PostCard 모바일 터치 타깃 확대 및 썸네일 노출 방식 개선
- 운영: 지속 PR(단일 브랜치) 운영 시작 — `codex-beta-improvements` (PR: https://github.com/LEE-SANG-BOK/VKC-2-/pull/1)
- 홈 피드 무한스크롤 유지 + `?page=` 기반 Prev/Next 링크 제공(SEO-friendly 페이지네이션)
- `GET /api/posts` 리스트 응답에서 `content` 기본 제외 + `excerpt` 제공으로 응답 크기/렌더 비용 절감
- `GET /api/posts` 추가 최적화: content preview 8000→4000, 검색 fallback에서도 full-content 로딩 제거, 이미지/썸네일 파싱 경량화
- 무한스크롤은 cursor(keyset) 페이지네이션(`/api/posts?cursor=...`)으로 offset 비용 절감(`?page=`는 SEO/공유용 유지)
- 게시글 상세 answers/comments keyset 조회 성능 개선을 위한 인덱스 마이그레이션 추가: `src/lib/db/migrations/0028_long_ben_grimm.sql`
- 공개 GET API 캐시 헤더 추가: `/api/categories`, `/api/posts/trending`, `/api/posts`(비로그인/검색·필터 없음일 때)
- 알림 과호출 방지: `GET /api/notifications/unread-count` 전용 API 추가 + unread polling 완화 + Notifications 페이지 인증 enabled 게이팅
- i18n 보강: `messages/*`에 `common.anonymous`, `common.uncategorized` 추가(익명/미지정 라벨 현지화)
- 신고 파이프라인 단일화: `POST /api/reports`도 `reports` 테이블로 저장하도록 정합 + legacy `content_reports` 백필 API(`/api/admin/reports/backfill-content-reports`) 추가
- 관리자 신고 처리 보강: `reviewed(검토됨)` 상태 액션 지원 + 신고 상세에서 HTML을 텍스트로 렌더링해 XSS 방어
- HTML→텍스트 공통 유틸 추가: `src/utils/htmlToText.ts` (admin reports/comments + posts metadata에서 재사용)
- Tooltip 잔상 방지: 라우트/검색 파라미터 변경 시 Tooltip 강제 close (`src/components/atoms/Tooltip.tsx`)
- 게시글 상세 UI 정리: 상단 썸네일/상단 카테고리칩 제거, 카테고리+태그 칩은 본문 하단으로 통합, 북마크는 헤더에서 제거 후 하단 액션바(공유 옆)로 이동
- UGC 글자수 상한 조정: 제목 100 / 본문 5000 / 답변 3000 / 댓글 400 + ko/en/vi 오류 메시지 동기화
- SimilarQuestionPrompt 성능: `GET /api/search/posts`는 `id/title`만 반환하도록 축소 + `Cache-Control: no-store`
- 홈 SSR 성능: Hydration에 미사용 `posts.trending` prefetch 제거(초기 payload↓)
- 공개 API/검색 PII 최소화: 공개 user payload에서 `email` 제거 + 검색 API에서 email 기반 검색 제거
- 프로필 PII 보호: `GET /api/users/[id]`는 본인 요청일 때만 `email/phone/notify*` 반환
- 게시글 썸네일 안정화: 리스트/상세 썸네일 src 정규화로 이미지 깨짐/런타임 오류 방지
- SEO 보강: posts/profile `generateMetadata` 정합화 + sitemap(posts/categories/profiles) 동적 생성
- Verification 보안/정합성: documents는 path-only 저장 + `/api/verification/request` path 정규화/소유권(userId prefix) 검증 + 관리자 승인/반려 시 signed URL 미리보기 및 문서 삭제 + 프로필/답변 카드에 badgeType 기반 TrustBadge 라벨 노출
- ESLint 설정 조정: `agents/**`, `scripts/**` 글로벌 ignore, `no-explicit-any` 등 일부 규칙 완화로 린트 통과
- `paginatedResponse` 메타 지원 + `/api/search/posts`의 토큰 오버랩 스코어링 및 조회/좋아요 기반 fallback 흐름 정비로 Similar Question/검색 UI가 `meta` 신호를 받아 안내할 수 있게 됨
- PostCard 카드의 신뢰 배지를 닉네임 바로 아래로 이동, 팔로우 버튼을 제목 오른쪽 상단으로 축소 배치하고 답변 안내 뱃지를 애니메이션 효과와 함께 추가해서 무인증 글에도 신뢰 신호/전환을 부각
- 컴포넌트 구조 정리: `ProfileChecker`, `StructuredData`를 `src/components/organisms/*`로 이동해 `src/components` 루트 ATOMIC 정리, `src/scripts` 중복 폴더 제거
- 스키마 확장: users에 badge_type/trust_score/helpful_answers/adoption_rate/is_expert 추가, topic_subscriptions 테이블 신설, 비자 매칭 메타(visa_jobs, visa_requirements) 테이블 추가, 인증 승인 시 뱃지 자동 부여 API 반영

---

## 전략 기반 UI/UX 개선 플랜 (요약)

- 핵심 페르소나: D2→D10→E7→F2 비자 전환을 준비하는 베트남 유학생/구직자. 모국어 모바일 중심, 신뢰도 높은 비자·취업 정보와 한국 생활 팁을 짧게 소비.
- 제품 목표: (1) 비자·취업 정보의 신뢰성과 구조화, (2) 모바일 원핸드 내비게이션과 빠른 질문/작성, (3) 카드뉴스·숏폼·UGC를 통한 참여/공유, (4) 검증/출처 신호 강화.

### 우선순위 UX 백로그
- 정보 아키텍처: 홈 상단에 비자 단계별 체크리스트/타임라인 카드(언어별 토글), E-7 우호 직군/지역/언어 필터 추가한 검색·카테고리 UI.
- 콘텐츠 포맷: 카드뉴스/숏폼 전용 섹션(큰 타이포·2언어 표기), 저장·공유 CTA, UGC 챌린지(해시태그/배지) 진입 포인트를 하단 네비·피드 상단에 노출.
- 신뢰도/검증: 관리자·전문가 답변 라벨, 출처 표기 컴포넌트, 외부 링크 기본 `rel="ugc"` 유지, 신고/스팸 차단 흐름 명확화.
- 네비/레이아웃: 하단 네비·모바일 드로어(완료), 메인 콘텐츠 `max-w-4xl` 가독성, 터치 타깃 44px 이상 유지.

### 단계별 실행
- Phase A (UI): 홈 히어로에 비자 단계 카드/체크리스트, 카드뉴스 슬라이드 블록 추가. 검색 필터에 비자 단계·업종(E-7 가능 직군)·지역 추가.
- Phase B (참여): “질문/생활 꿀팁 챌린지” 진입, 저장/공유 CTA, UGC 배지 노출. 알림 뱃지·내 활동 접근 동선 단순화.
- Phase C (신뢰): 관리자/전문가 답변 라벨링, 출처 표기, FAQ/가이드 SSR+JSON-LD 구조화, 신고/스팸 UX 정리.
- Phase D (콘텐츠 디자인): 카드뉴스·숏폼 템플릿 라이브러리화, 숏폼 플레이리스트 섹션, 인앱 공유 시 요약 메타 삽입.

### 측정 지표
- 카드뉴스/숏폼 저장·공유율, 신규 질문 작성률, 챌린지 UGC 생성 수, 비자 가이드 조회→전환(글쓰기/상담 요청) 비율, 모바일 세션당 페이지/체류시간.

### 참여/바이럴 플랜 (신규)
- 온보딩 강화: 회원가입 직후 환영 모달/툴팁으로 “첫 질문 올리는 법, 관심 토픽 구독” 스텝 안내. 첫 질문 작성 CTA와 리워드 배너 노출.
- 첫 질문 이벤트: Day1~3 “첫 질문 올리기” 미션 + SNS 공유 시 추가 보상(카드뉴스 안내 포함)으로 초기 질문 생성 유도.
- 베스트 답변상: 주간 인기 답변자 발표를 카드뉴스로 제작·공유, 답변자 보람/노출 극대화.
- 친구 초대(추천인): 초대 코드/링크 발급, 가입 시 코드 입력 → 양쪽 보상. 추천 횟수별 배지/포인트 UI 필요. DB에 추천인-피추천인 매핑 필수(백엔드 필요).
- 프로필 성취감: 질문/답변/좋아요/채택률/랭킹을 프로필에서 시각화(예: “다음 레벨까지 X답변 남음” 진행바)해 참여 동기 부여.

---

## 베타 기능·SEO·전환 플랜 (추가)

- 데이터/SEO 무결성: mock 데이터 제거, Q&A 상세 SSR/SSG + `generateMetadata`/JSON-LD를 실제 콘텐츠로 동기화. `app/sitemap.ts` 동적 생성, robots.txt에 사이트맵 경로 명시.
- P0/P1 기능 마감: 신원/전문가/기여 뱃지 UI, 온보딩에서 관심사·비자 단계 수집 후 개인화 피드, 카테고리/태그 구독 알림 기본 제공.
- 신뢰/검증 UX: 프로필·답변에 인증/전문가 배지, 출처 슬롯, 신고/모더레이션 흐름 명확화.
- 가입/전환: 소셜 로그인 다각화(기존 + Zalo 등 고려), 가입 단계 최소화·진행도 표시, 비로그인 미리보기 + CTA 노출.
- 콘텐츠-웹 연계: 카드뉴스/숏폼에 웹 CTA/QR, 웹에 숏폼·카드뉴스 허브 섹션(임베드/갤러리) 추가, 질문 상세에 관련 숏폼/카드뉴스 추천.
- UX 지표: 가입 전환율, 재방문율, 알림 클릭률, 저장·공유율, 질문/답변 전환률, SEO 색인 커버리지(실 URL 기준) 모니터링.
- 신고/모더레이션: `content_reports` 테이블과 관리자 리스트/상태 변경 API(`/api/admin/content-reports`) 추가, 사용자 신고 엔드포인트 `/api/reports`(post/answer/comment 대상)

---

## 1. 기술 스택 (무슨 기술로 만들었나요?)

```
┌─────────────────────────────────────────────────────────────┐
│                        프론트엔드                            │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16      → 웹사이트를 만드는 프레임워크              │
│  React 19        → 화면을 그리는 라이브러리                  │
│  TypeScript      → 자바스크립트에 타입을 추가한 언어         │
│  Tailwind CSS 4  → CSS를 쉽게 쓰는 도구                     │
│  TanStack Query  → 서버 데이터를 관리하는 도구              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        백엔드                                │
├─────────────────────────────────────────────────────────────┤
│  Next.js API     → API를 만드는 도구 (서버 액션 사용 안함)   │
│  NextAuth v5     → 로그인/회원가입 처리                      │
│  Drizzle ORM     → 데이터베이스를 쉽게 다루는 도구           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       데이터베이스                           │
├─────────────────────────────────────────────────────────────┤
│  Supabase        → 데이터베이스 + 파일 저장소                │
│  PostgreSQL      → 실제 데이터가 저장되는 곳                 │
└─────────────────────────────────────────────────────────────┘
```

### 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `next-auth` | 구글 로그인 |
| `@tanstack/react-query` | API 데이터 관리 |
| `drizzle-orm` | DB 쿼리 작성 |
| `@supabase/supabase-js` | Supabase 연동 |
| `tiptap` | 리치 텍스트 에디터 (글 작성할 때 사용) |
| `lucide-react` | 아이콘 |
| `framer-motion` | 애니메이션 |
| `sonner` | 토스트 알림 |
| `dayjs` | 날짜 처리 |

---

## 2. 폴더 구조 (파일들이 어디 있나요?)

```
viet-kconnect-renew-nextjs/
│
├── 📁 messages/              ← 다국어 번역 파일
│   ├── ko.json               ← 한국어
│   ├── en.json               ← 영어
│   └── vi.json               ← 베트남어
│
├── 📁 public/                ← 정적 파일 (이미지, 아이콘 등)
│
├── 📁 src/                   ← 소스 코드 (여기가 핵심!)
│   │
│   ├── 📁 app/               ← 페이지들
│   │   ├── 📁 [lang]/        ← 언어별 페이지 (ko, en, vi)
│   │   ├── 📁 admin/         ← 관리자 페이지
│   │   └── 📁 api/           ← API 라우트
│   │
│   ├── 📁 components/        ← 화면 조각들 (버튼, 카드 등)
│   │   ├── 📁 atoms/         ← 가장 작은 단위 (버튼, 아바타)
│   │   ├── 📁 molecules/     ← 중간 단위 (카드, 모달)
│   │   ├── 📁 organisms/     ← 큰 단위 (헤더, 사이드바)
│   │   ├── 📁 templates/     ← 페이지 템플릿
│   │   └── 📁 ui/            ← Magic UI 컴포넌트
│   │
│   ├── 📁 repo/              ← API 호출 코드
│   │   ├── 📁 posts/         ← 게시글 관련
│   │   ├── 📁 users/         ← 사용자 관련
│   │   ├── 📁 comments/      ← 댓글 관련
│   │   └── ...
│   │
│   ├── 📁 lib/               ← 유틸리티
│   │   ├── 📁 db/            ← 데이터베이스 설정
│   │   ├── 📁 supabase/      ← Supabase 설정
│   │   └── auth.ts           ← 인증 설정
│   │
│   └── 📁 types/             ← 타입 정의
│
├── middleware.ts             ← 미들웨어 (언어 리다이렉트)
├── drizzle.config.ts         ← Drizzle 설정
└── package.json              ← 프로젝트 정보
```

---

## 3. 페이지 구조 (어떤 페이지가 있나요?)

### 일반 사용자 페이지 (`/[lang]/...`)

| 경로 | 설명 |
|------|------|
| `/ko` | 홈페이지 (게시글 목록) |
| `/ko/login` | 로그인 페이지 |
| `/ko/posts/new` | 새 게시글 작성 |
| `/ko/posts/[id]` | 게시글 상세 보기 |
| `/ko/profile/[id]` | 사용자 프로필 |
| `/ko/profile/edit` | 내 프로필 수정 |
| `/ko/search` | 검색 페이지 |
| `/ko/notifications` | 알림 페이지 |
| `/ko/verification/request` | 인증 신청 |
| `/ko/verification/history` | 인증 내역 |

### 관리자 페이지 (`/admin/...`)

| 경로 | 설명 |
|------|------|
| `/admin` | 대시보드 (통계) |
| `/admin/login` | 관리자 로그인 |
| `/admin/users` | 사용자 관리 |
| `/admin/posts` | 게시글 관리 |
| `/admin/comments` | 댓글 관리 |
| `/admin/reports` | 신고 관리 |
| `/admin/verifications` | 인증 관리 |
| `/admin/categories` | 카테고리 관리 |
| `/admin/news` | 뉴스 관리 |
| `/admin/notifications` | 알림 관리 |

---

## 4. API 구조 (서버랑 어떻게 통신하나요?)

### API 규칙

- **서버 액션 사용 안 함** → 모든 데이터는 API 라우트로 처리
- **경로**: `/api/...`

### 주요 API 목록

#### 게시글 API

```
GET    /api/posts              → 게시글 목록
POST   /api/posts              → 게시글 작성
GET    /api/posts/[id]         → 게시글 상세
PUT    /api/posts/[id]         → 게시글 수정
DELETE /api/posts/[id]         → 게시글 삭제
POST   /api/posts/[id]/like    → 좋아요 토글
POST   /api/posts/[id]/bookmark → 북마크 토글
POST   /api/posts/[id]/view    → 조회수 증가
GET    /api/posts/trending     → 인기 게시글
```

#### 답변 API

```
GET    /api/posts/[id]/answers      → 답변 목록
POST   /api/posts/[id]/answers      → 답변 작성
PUT    /api/answers/[id]            → 답변 수정
DELETE /api/answers/[id]            → 답변 삭제
POST   /api/answers/[id]/adopt      → 답변 채택
POST   /api/answers/[id]/like       → 좋아요 토글
```

#### 댓글 API

```
GET    /api/posts/[id]/comments     → 게시글 댓글
POST   /api/posts/[id]/comments     → 댓글 작성
GET    /api/answers/[id]/comments   → 답변 댓글
POST   /api/answers/[id]/comments   → 답변 댓글 작성
PUT    /api/comments/[id]           → 댓글 수정
DELETE /api/comments/[id]           → 댓글 삭제
```

#### 사용자 API

```
GET    /api/users/[id]              → 프로필 조회
PUT    /api/users/[id]              → 프로필 수정
POST   /api/users/[id]/follow       → 팔로우 토글
GET    /api/users/[id]/followers    → 팔로워 목록
GET    /api/users/[id]/following    → 팔로잉 목록
GET    /api/users/[id]/bookmarks    → 북마크 목록
GET    /api/users/recommended       → 추천 사용자
```

#### 알림 API

```
GET    /api/notifications           → 알림 목록
POST   /api/notifications/[id]/read → 알림 읽음 처리
POST   /api/notifications/read-all  → 전체 읽음 처리
```

#### 뉴스 API

```
GET    /api/news                    → 뉴스 목록 (공개)
```

#### 관리자 뉴스 API

```
GET    /api/admin/news              → 뉴스 목록 (관리자)
POST   /api/admin/news              → 뉴스 생성
GET    /api/admin/news/[id]         → 뉴스 상세
PATCH  /api/admin/news/[id]         → 뉴스 수정
DELETE /api/admin/news/[id]         → 뉴스 삭제
POST   /api/admin/upload            → 관리자 이미지 업로드
```

#### 기타 API

```
GET    /api/categories              → 카테고리 목록
POST   /api/categories/[id]/subscribe → 카테고리 구독
GET    /api/search                  → 통합 검색
POST   /api/upload                  → 파일 업로드
POST   /api/verification/request    → 인증 신청
```

---

## 5. 데이터베이스 구조 (데이터가 어떻게 저장되나요?)

### 테이블 관계도

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │────<│   posts     │────<│  answers    │
│ (사용자)    │     │ (게시글)    │     │ (답변)      │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  follows    │     │  comments   │     │   likes     │
│ (팔로우)    │     │ (댓글)      │     │ (좋아요)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 테이블 설명

#### users (사용자)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID (UUID)                     │
│ name               │ 이름                               │
│ email              │ 이메일                             │
│ image              │ 프로필 사진 URL                    │
│ displayName        │ 표시 이름                          │
│ bio                │ 자기소개                           │
│ phone              │ 전화번호                           │
│ gender             │ 성별                               │
│ ageGroup           │ 연령대                             │
│ nationality        │ 국적                               │
│ status             │ 상태 (학생, 직장인 등)             │
│ userType           │ 사용자 유형 (student/worker/resident 등) │
│ visaType           │ 비자 유형                          │
│ interests          │ 관심 카테고리 ID 배열              │
│ preferredLanguage  │ 선호 언어(ko/en/vi)                │
│ koreanLevel        │ 한국어 수준 (beginner/intermediate/advanced) │
│ suspendedUntil     │ 정지 종료일 (정지된 경우)          │
│ isVerified         │ 인증 여부                          │
│ isProfileComplete  │ 프로필 완성 여부                   │
│ onboardingCompleted│ 온보딩 완료 여부                   │
│ emailNotifications │ 이메일 알림 설정                   │
│ pushNotifications  │ 푸시 알림 설정                     │
│ notifyAnswers      │ 답변 알림 설정                     │
│ notifyComments     │ 댓글 알림 설정                     │
│ notifyReplies      │ 대댓글 알림 설정                   │
│ notifyAdoptions    │ 채택 알림 설정                     │
│ notifyFollows      │ 팔로우 알림 설정                   │
│ createdAt          │ 가입일                             │
└────────────────────┴────────────────────────────────────┘
```

#### posts (게시글)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ authorId           │ 작성자 ID                          │
│ type               │ 타입 (question/share)              │
│ title              │ 제목                               │
│ content            │ 내용                               │
│ category           │ 카테고리                           │
│ subcategory        │ 세부 카테고리                      │
│ tags               │ 태그 배열                          │
│ views              │ 조회수                             │
│ likes              │ 좋아요 수                          │
│ isResolved         │ 해결 여부 (질문인 경우)            │
│ adoptedAnswerId    │ 채택된 답변 ID                     │
│ createdAt          │ 작성일                             │
│ updatedAt          │ 수정일                             │
└────────────────────┴────────────────────────────────────┘
```

#### answers (답변)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ postId             │ 게시글 ID                          │
│ authorId           │ 작성자 ID                          │
│ content            │ 답변 내용                          │
│ likes              │ 좋아요 수                          │
│ isAdopted          │ 채택 여부                          │
│ createdAt          │ 작성일                             │
│ updatedAt          │ 수정일                             │
└────────────────────┴────────────────────────────────────┘
```

#### comments (댓글)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ postId             │ 게시글 ID (게시글 댓글인 경우)     │
│ answerId           │ 답변 ID (답변 댓글인 경우)         │
│ parentId           │ 부모 댓글 ID (대댓글인 경우)       │
│ authorId           │ 작성자 ID                          │
│ content            │ 댓글 내용                          │
│ likes              │ 좋아요 수                          │
│ createdAt          │ 작성일                             │
│ updatedAt          │ 수정일                             │
└────────────────────┴────────────────────────────────────┘
```

#### likes (좋아요)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ userId             │ 사용자 ID                          │
│ postId             │ 게시글 ID (게시글 좋아요)          │
│ answerId           │ 답변 ID (답변 좋아요)              │
│ commentId          │ 댓글 ID (댓글 좋아요)              │
│ createdAt          │ 생성일                             │
└────────────────────┴────────────────────────────────────┘
```

#### bookmarks (북마크)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ userId             │ 사용자 ID                          │
│ postId             │ 게시글 ID                          │
│ createdAt          │ 생성일                             │
└────────────────────┴────────────────────────────────────┘
```

#### follows (팔로우)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ followerId         │ 팔로우 하는 사람 ID                │
│ followingId        │ 팔로우 받는 사람 ID                │
│ createdAt          │ 생성일                             │
└────────────────────┴────────────────────────────────────┘
```

#### notifications (알림)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ userId             │ 알림 받는 사람 ID                  │
│ type               │ 알림 종류                          │
│ postId             │ 관련 게시글 ID                     │
│ answerId           │ 관련 답변 ID                       │
│ commentId          │ 관련 댓글 ID                       │
│ senderId           │ 알림 보낸 사람 ID                  │
│ content            │ 알림 내용                          │
│ isRead             │ 읽음 여부                          │
│ readAt             │ 읽은 시간                          │
│ createdAt          │ 생성일                             │
└────────────────────┴────────────────────────────────────┘

알림 종류 (type):
- answer: 새 답변
- comment: 새 댓글
- reply: 대댓글
- adoption: 답변 채택
- like: 좋아요
- follow: 새 팔로워
```

#### verificationRequests (인증 요청)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ userId             │ 신청자 ID                          │
│ type               │ 인증 종류 (학생, 직장인 등)        │
│ documentUrls       │ 증빙 서류 URL 배열                 │
│ status             │ 상태 (pending/approved/rejected)   │
│ reason             │ 반려 사유                          │
│ submittedAt        │ 신청일                             │
│ reviewedAt         │ 검토일                             │
│ reviewedBy         │ 검토자 ID                          │
└────────────────────┴────────────────────────────────────┘
```

#### categories (카테고리)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ name               │ 카테고리 이름                      │
│ slug               │ URL용 이름 (영문)                  │
│ parentId           │ 부모 카테고리 ID (하위 분류인 경우)│
│ order              │ 정렬 순서                          │
│ isActive           │ 활성화 여부                        │
│ createdAt          │ 생성일                             │
│ updatedAt          │ 수정일                             │
└────────────────────┴────────────────────────────────────┘
> 상위 14개 카테고리에 하위 토픽 4개(TOPIK, 장학금, 면접팁, 노동권)가 parentId로 연결되어 있습니다.
```

#### reports (신고)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ reporterId         │ 신고자 ID                          │
│ type               │ 신고 종류                          │
│ status             │ 상태 (pending/reviewed/resolved)   │
│ reason             │ 신고 사유                          │
│ postId             │ 신고된 게시글 ID                   │
│ answerId           │ 신고된 답변 ID                     │
│ commentId          │ 신고된 댓글 ID                     │
│ reviewedBy         │ 검토자 ID                          │
│ reviewNote         │ 검토 메모                          │
│ createdAt          │ 신고일                             │
│ updatedAt          │ 수정일                             │
└────────────────────┴────────────────────────────────────┘

신고 종류 (type):
- spam: 스팸/광고
- harassment: 괴롭힘/혐오
- inappropriate: 부적절한 콘텐츠
- misinformation: 허위 정보
- other: 기타
```

#### news (뉴스)

```
┌────────────────────┬────────────────────────────────────┐
│ 컬럼               │ 설명                               │
├────────────────────┼────────────────────────────────────┤
│ id                 │ 고유 ID                            │
│ title              │ 뉴스 제목                          │
│ category           │ 뉴스 카테고리                      │
│ language           │ 언어 코드(vi/ko/en)                │
│ content            │ 뉴스/관리자 게시글 본문            │
│ imageUrl           │ 이미지 URL                         │
│ linkUrl            │ 링크 URL                           │
│ isActive           │ 활성화 여부                        │
│ order              │ 정렬 순서                          │
│ createdAt          │ 생성일                             │
│ updatedAt          │ 수정일                             │
└────────────────────┴────────────────────────────────────┘
```

---

## 6. 컴포넌트 구조 (화면은 어떻게 만들어졌나요?)

### ATOMIC 디자인 패턴

이 프로젝트는 **ATOMIC 디자인** 패턴을 사용합니다. 레고 블록처럼 작은 조각을 모아서 큰 화면을 만드는 방식이에요.

```
atoms (원자) → molecules (분자) → organisms (유기체) → templates (템플릿) → pages (페이지)
```

### atoms (가장 작은 단위)

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| Avatar | `Avatar.tsx` | 동그란 프로필 사진 |
| Badge | `Badge.tsx` | 작은 라벨 (태그) |
| Button | `Button.tsx` | 버튼 |
| IconButton | `IconButton.tsx` | 아이콘만 있는 버튼 |
| Logo | `Logo.tsx` | 로고 |
| Modal | `Modal.tsx` | 팝업 창 |
| SearchInput | `SearchInput.tsx` | 검색창 |
| Tooltip | `Tooltip.tsx` | 마우스 올리면 나오는 설명 |
| LanguageSwitcher | `LanguageSwitcher.tsx` | 언어 변경 버튼 |

### molecules (중간 단위)

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| PostCard | `PostCard.tsx` | 게시글 카드 (목록에서 보이는 것) |
| AnswerCard | `AnswerCard.tsx` | 답변 카드 |
| CommentCard | `CommentCard.tsx` | 댓글 카드 |
| NewsCard | `NewsCard.tsx` | 뉴스 카드 |
| UserProfile | `UserProfile.tsx` | 사용자 프로필 정보 |
| CategoryFilter | `CategoryFilter.tsx` | 카테고리 필터 |
| RichTextEditor | `RichTextEditor.tsx` | 글 작성 에디터 |
| NotificationModal | `NotificationModal.tsx` | 알림 팝업 |
| BookmarksModal | `BookmarksModal.tsx` | 북마크 팝업 |
| FollowingModal | `FollowingModal.tsx` | 팔로잉 팝업 |
| MyPostsModal | `MyPostsModal.tsx` | 내 게시글 팝업 |
| ProfileModal | `ProfileModal.tsx` | 프로필 팝업 |
| SettingsModal | `SettingsModal.tsx` | 설정 팝업 |
| AccountStatusBanner | `AccountStatusBanner.tsx` | 계정 상태 배너 |
| VietnamBanner | `VietnamBanner.tsx` | 메인 배너 |

### organisms (큰 단위)

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| Header | `Header.tsx` | 상단 헤더 (로고, 검색, 알림, 로그인) |
| CategorySidebar | `CategorySidebar.tsx` | 왼쪽 카테고리 메뉴 |
| PostList | `PostList.tsx` | 게시글 목록 (무한 스크롤) |
| NewsSection | `NewsSection.tsx` | 뉴스 섹션 |
| LoginPrompt | `LoginPrompt.tsx` | 로그인 유도 메시지 |
| CategorySubscription | `CategorySubscription.tsx` | 카테고리 구독 |
| VerificationRequest | `VerificationRequest.tsx` | 인증 신청 폼 |

### templates (페이지 템플릿)

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| MainLayout | `MainLayout.tsx` | 메인 레이아웃 (헤더 + 사이드바 + 콘텐츠) |

---

## 7. 데이터 관리 (TanStack Query)

### repo 폴더 구조

모든 API 호출은 `src/repo/` 폴더에서 관리합니다.

```
src/repo/
├── keys.ts          ← 쿼리 키 (캐시 관리용)
├── posts/
│   ├── fetch.ts     ← API 호출 함수 (fetch, create, update, delete)
│   ├── query.ts     ← useQuery 훅 (데이터 조회)
│   ├── mutation.ts  ← useMutation 훅 (데이터 변경)
│   └── types.ts     ← 타입 정의
├── users/
├── comments/
├── answers/
├── notifications/
├── categories/
├── verification/
├── reports/
├── news/
└── admin/
```

### 사용 예시

```tsx
// 게시글 목록 조회
import { usePosts } from '@/repo/posts/query';

function PostListPage() {
  const { data, isLoading } = usePosts({ category: 'tech' });
  
  if (isLoading) return <div>로딩 중...</div>;
  
  return (
    <ul>
      {data?.posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// 게시글 작성
import { useCreatePost } from '@/repo/posts/mutation';

function NewPostForm() {
  const { mutate: createPost, isPending } = useCreatePost();
  
  const handleSubmit = () => {
    createPost({
      title: '제목',
      content: '내용',
      type: 'question',
      category: 'tech',
    });
  };
  
  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? '등록 중...' : '등록'}
    </button>
  );
}
```

### 쿼리 키 (keys.ts)

```typescript
export const queryKeys = {
  posts: {
    all: ['posts'],
    list: (filters) => ['posts', 'list', filters],
    detail: (id) => ['posts', 'detail', id],
  },
  users: {
    all: ['users'],
    detail: (id) => ['users', 'detail', id],
  },
  // ...
};
```

---

## 8. 인증 시스템 (로그인은 어떻게 하나요?)

### 일반 사용자 인증 (NextAuth)

- **Google 로그인**만 지원
- JWT 방식 사용 (토큰 기반)
- 세션 정보는 토큰에 저장

```typescript
// 로그인 상태 확인
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>로딩...</div>;
  if (status === 'unauthenticated') return <div>로그인 해주세요</div>;
  
  return <div>안녕하세요, {session.user.name}님!</div>;
}
```

### 관리자 인증

- 별도의 로그인 시스템 (환경 변수로 관리)
- JWT 토큰 사용
- 쿠키에 `admin_token` 저장

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=비밀번호
ADMIN_JWT_SECRET=시크릿키
```

---

## 9. 다국어 (i18n)

### 지원 언어

- 한국어 (`ko`)
- 영어 (`en`)
- 베트남어 (`vi`)

### 번역 파일 위치

```
messages/
├── ko.json  ← 한국어
├── en.json  ← 영어
└── vi.json  ← 베트남어
```

### 사용 방법

```tsx
// 서버 컴포넌트에서
import { getDictionary } from '@/i18n/get-dictionary';

async function Page({ params }: { params: { lang: string } }) {
  const dict = await getDictionary(params.lang);
  
  return <h1>{dict.common.appName}</h1>;
}
```

### URL 구조

- `/ko/...` → 한국어
- `/en/...` → 영어
- `/vi/...` → 베트남어

미들웨어가 자동으로 언어 감지해서 리다이렉트합니다.

---

## 10. 파일 업로드

### Supabase Storage 사용

```typescript
// 일반 사용자용 (NextAuth 인증 필요)
POST /api/upload          → 게시글 이미지 업로드
POST /api/upload/avatar   → 프로필 사진 업로드
POST /api/upload/document → 인증 서류 업로드

// 관리자용 (관리자 인증 필요)
POST /api/admin/upload    → 관리자 이미지 업로드 (뉴스 등)
```

### 업로드 버킷

- `profile`: 프로필 사진
- `documents`: 인증 서류
- `posts`: 게시글 이미지, 관리자 업로드 이미지

### 주의사항

- 일반 사용자 API (`/api/upload`)는 NextAuth 세션 인증 사용
- 관리자 API (`/api/admin/upload`)는 관리자 JWT 토큰 인증 사용
- 두 인증 시스템이 다르므로 관리자 페이지에서는 반드시 `/api/admin/upload` 사용

---

## 11. 환경 변수 설정

### .env.local 파일

```bash
# 데이터베이스
DATABASE_URL="postgresql://username:password@host:port/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
AUTH_SECRET=openssl-rand-base64-32-로-생성한-값
GOOGLE_CLIENT_ID=구글-클라이언트-ID
GOOGLE_CLIENT_SECRET=구글-클라이언트-시크릿

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 관리자
ADMIN_USERNAME=admin
ADMIN_PASSWORD=비밀번호
ADMIN_JWT_SECRET=시크릿키
```

---

## 12. 자주 쓰는 명령어

### 개발

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 린트 검사
npm run lint
```

### 데이터베이스

```bash
# 마이그레이션 파일 생성 (스키마 변경 후)
npm run db:generate

# 마이그레이션 실행
npm run db:migrate

# DB에 직접 푸시 (개발용)
npm run db:push

# Drizzle Studio (DB GUI)
npm run db:studio

# 시드 데이터 넣기
npm run db:seed
```

---

## 13. 배포

### Vercel 배포

1. GitHub에 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 배포 완료!

### 주의사항

- `/admin` 경로는 i18n 미들웨어에서 제외됨
- 환경 변수 모두 Vercel에 설정해야 함
- `DATABASE_URL`은 Supabase 연결 문자열 사용

---

## 14. 트러블슈팅 (문제 해결)

### Q: 로그인이 안 돼요

- Google Cloud Console에서 OAuth 설정 확인
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 확인
- `AUTH_SECRET` 설정 확인

### Q: DB 연결이 안 돼요

- `DATABASE_URL` 확인
- Supabase 프로젝트 상태 확인
- VPN/방화벽 확인

### Q: 이미지 업로드가 안 돼요

- Supabase Storage 버킷 설정 확인
- `SUPABASE_SERVICE_ROLE_KEY` 확인
- 버킷 정책 (public/private) 확인

### Q: 관리자 페이지 접속이 안 돼요

- `/admin/login`에서 로그인
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` 확인
- `admin_token` 쿠키 확인

### Q: 빌드 에러가 나요

- `npm run lint`로 에러 확인
- 타입 에러 수정
- 의존성 버전 확인

---

## 15. 코드 규칙

### 파일 네이밍

- 컴포넌트: `PascalCase.tsx` (예: `PostCard.tsx`)
- 유틸리티: `camelCase.ts` (예: `utils.ts`)
- 타입: `types.ts`

### 임포트 경로

```typescript
// @/ 별칭 사용
import { Button } from '@/components/atoms/Button';
import { queryKeys } from '@/repo/keys';
import { db } from '@/lib/db';
```

### 컴포넌트

- `default export` 사용
- Props 타입은 컴포넌트 위에 정의

```typescript
interface PostCardProps {
  post: Post;
  onLike?: () => void;
}

export default function PostCard({ post, onLike }: PostCardProps) {
  return <div>...</div>;
}
```

### API 라우트

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    // 데이터 조회 로직
    return apiSuccess(data);
  } catch (error) {
    return apiError('서버 오류', 500);
  }
}
```

---

## 16. 추가 참고 자료

### 공식 문서

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Drizzle ORM](https://orm.drizzle.team)
- [NextAuth.js](https://authjs.dev)
- [Supabase](https://supabase.com/docs)

### 프로젝트 관련 파일

- `AGENTS.md`: AI 코딩 가이드
- `CLAUDE.md`: Claude AI 설정
- `README.md`: 기본 설명서

---

## 17. AI 프롬프트 가이드 (Claude/ChatGPT 사용법)

이 프로젝트에서 AI를 활용해 개발할 때 사용할 수 있는 프롬프트 템플릿입니다.

---

### 신규 기능 개발 프롬프트

#### 기본 템플릿
```
[기능명] 기능을 개발해줘.

## 요구사항
- (기능 설명)
- (세부 요구사항 1)
- (세부 요구사항 2)

## 참고
- 이 프로젝트는 Next.js 16 + React 19 + TypeScript 사용
- 서버 액션 사용하지 않고 API 라우트만 사용
- TanStack Query로 데이터 관리
- ATOMIC 디자인 패턴 (atoms/molecules/organisms/templates)
- Tailwind CSS 4 사용
- HANDOVER.md 파일 참고해서 프로젝트 구조 파악해줘
```

#### 예시 1: 새 페이지 추가
```
공지사항 페이지를 개발해줘.

## 요구사항
- /ko/notices 경로에 공지사항 목록 페이지
- /ko/notices/[id] 경로에 공지사항 상세 페이지
- 관리자만 작성 가능, 일반 사용자는 조회만 가능
- 페이지네이션 적용
- SSR로 SEO 최적화

## 참고
- HANDOVER.md 파일 참고해서 프로젝트 구조 파악해줘
- 기존 posts 구조 참고해서 비슷하게 만들어줘
```

#### 예시 2: 새 API 추가
```
즐겨찾기 폴더 기능 API를 개발해줘.

## 요구사항
- 사용자가 북마크를 폴더별로 분류할 수 있음
- 폴더 CRUD API 필요
- 북마크에 폴더 연결 기능

## API 목록
- GET /api/bookmark-folders - 폴더 목록
- POST /api/bookmark-folders - 폴더 생성
- PATCH /api/bookmark-folders/[id] - 폴더 수정
- DELETE /api/bookmark-folders/[id] - 폴더 삭제
- PATCH /api/bookmarks/[id]/folder - 북마크에 폴더 연결

## 참고
- src/app/api/ 폴더 구조 참고
- src/lib/db/schema.ts에 테이블 추가 필요
- src/repo/ 폴더에 fetch, query, mutation, types 파일 생성
```

#### 예시 3: 새 컴포넌트 추가
```
이미지 갤러리 컴포넌트를 개발해줘.

## 요구사항
- 게시글 작성 시 여러 이미지를 그리드로 표시
- 클릭하면 라이트박스로 확대
- 좌우 화살표로 이미지 전환
- 모바일에서도 스와이프 지원

## 참고
- src/components/molecules/ 폴더에 생성
- framer-motion 사용 가능
- 기존 컴포넌트 스타일 참고
```

---

### 버그 수정 프롬프트

#### 기본 템플릿
```
[문제 상황] 버그를 수정해줘.

## 현재 동작
- (현재 어떻게 동작하는지)

## 기대 동작
- (어떻게 동작해야 하는지)

## 재현 방법
1. (단계 1)
2. (단계 2)
3. (에러 발생)

## 에러 메시지 (있다면)
(에러 메시지 붙여넣기)

## 관련 파일
- (의심되는 파일 경로)
```

#### 예시 1: API 에러
```
게시글 수정 시 500 에러가 발생해.

## 현재 동작
- 게시글 수정 버튼 클릭하면 500 Internal Server Error 발생

## 기대 동작
- 정상적으로 게시글이 수정되어야 함

## 재현 방법
1. 게시글 상세 페이지 접속
2. 수정 버튼 클릭
3. 내용 변경 후 저장
4. 500 에러 발생

## 에러 메시지
PUT /api/posts/xxx 500 Internal Server Error
TypeError: Cannot read properties of undefined (reading 'id')

## 관련 파일
- src/app/api/posts/[id]/route.ts
```

#### 예시 2: UI 버그
```
모바일에서 사이드바가 닫히지 않아.

## 현재 동작
- 모바일에서 햄버거 메뉴로 사이드바 열면 닫기 버튼이 동작 안 함

## 기대 동작
- X 버튼이나 바깥 영역 클릭 시 사이드바가 닫혀야 함

## 재현 방법
1. 모바일 화면 크기로 변경 (375px)
2. 햄버거 메뉴 클릭
3. 사이드바 열림
4. X 버튼 클릭해도 안 닫힘

## 관련 파일
- src/components/organisms/CategorySidebar.tsx
```

#### 예시 3: 데이터 문제
```
알림이 중복으로 생성되는 문제가 있어.

## 현재 동작
- 댓글 작성 시 알림이 2개씩 생성됨

## 기대 동작
- 알림은 1개만 생성되어야 함

## 재현 방법
1. 게시글에 댓글 작성
2. 게시글 작성자의 알림 확인
3. 같은 알림이 2개 있음

## 관련 파일
- src/app/api/posts/[id]/comments/route.ts
- src/lib/notifications/create.ts
```

---

### 리팩토링 프롬프트

#### 기본 템플릿
```
[대상] 리팩토링해줘.

## 현재 문제
- (현재 코드의 문제점)

## 개선 방향
- (어떻게 개선하고 싶은지)

## 제약 조건
- 기존 기능은 그대로 유지
- API 응답 형식 변경 없음
- (추가 제약 조건)

## 관련 파일
- (리팩토링 대상 파일)
```

#### 예시 1: 코드 중복 제거
```
API 라우트의 인증 로직을 리팩토링해줘.

## 현재 문제
- 모든 API 파일에서 getSession() 호출하고 에러 처리하는 코드가 중복됨
- 인증 실패 시 응답 형식도 파일마다 다름

## 개선 방향
- 미들웨어나 래퍼 함수로 인증 로직 통합
- 일관된 에러 응답 형식 사용

## 제약 조건
- 기존 API 응답 형식 유지
- 점진적으로 적용 가능하도록

## 관련 파일
- src/app/api/posts/route.ts
- src/app/api/comments/route.ts
- src/lib/api/auth.ts
```

#### 예시 2: 성능 개선
```
게시글 목록 쿼리 성능을 개선해줘.

## 현재 문제
- 게시글 목록 로딩이 느림 (2-3초)
- N+1 쿼리 문제 의심

## 개선 방향
- 쿼리 최적화
- 필요한 필드만 select
- 적절한 인덱스 추가

## 제약 조건
- API 응답 형식 변경 없음
- 기존 기능 유지

## 관련 파일
- src/app/api/posts/route.ts
- src/lib/db/schema.ts
```

#### 예시 3: 컴포넌트 분리
```
PostCard 컴포넌트를 리팩토링해줘.

## 현재 문제
- PostCard.tsx가 500줄이 넘어서 관리가 어려움
- 좋아요, 북마크, 공유 로직이 모두 한 파일에 있음

## 개선 방향
- 하위 컴포넌트로 분리 (PostCardActions, PostCardHeader 등)
- 커스텀 훅으로 로직 분리 (usePostLike, usePostBookmark)

## 제약 조건
- 외부에서 사용하는 Props 인터페이스 유지
- 스타일 변경 없음

## 관련 파일
- src/components/molecules/PostCard.tsx
```

#### 예시 4: 타입 개선
```
Post 관련 타입을 정리해줘.

## 현재 문제
- Post 타입이 여러 파일에 중복 정의됨
- API 응답 타입과 클라이언트 타입이 달라서 혼란

## 개선 방향
- 타입을 한 곳에서 관리
- API 응답 타입과 클라이언트 타입 명확히 구분

## 제약 조건
- 점진적으로 적용 가능하도록

## 관련 파일
- src/types/post.ts
- src/repo/posts/types.ts
```

#### 예시 5: 폴더 구조 정리
```
관리자 관련 코드 구조를 정리해줘.

## 현재 문제
- 관리자 API가 src/app/api/admin/에 있고
- 관리자 repo가 src/repo/admin/에 있는데
- 일부 유틸 함수가 src/lib/에 흩어져 있음

## 개선 방향
- 관리자 관련 코드를 일관된 구조로 정리
- 문서화 개선

## 제약 조건
- 기능 변경 없음
- import 경로 변경 최소화

## 관련 파일
- src/app/api/admin/
- src/repo/admin/
- src/lib/admin/
```

---

### 기능 수정/확장 프롬프트

#### 기본 템플릿
```
[기존 기능]을 수정/확장해줘.

## 현재 기능
- (현재 어떻게 동작하는지)

## 변경 사항
- (무엇을 변경하고 싶은지)

## 영향 범위
- (이 변경으로 영향받는 다른 기능)

## 관련 파일
- (수정이 필요한 파일)
```

#### 예시 1: 기능 확장
```
게시글 타입에 '정보공유' 타입을 추가해줘.

## 현재 기능
- 게시글 타입: question(질문), share(공유)

## 변경 사항
- 'info' 타입 추가 (정보공유)
- 정보공유는 채택 기능 없음
- 사이드바에 정보공유 필터 추가

## 영향 범위
- DB 스키마 (post_type enum)
- 게시글 작성 폼
- 게시글 목록 필터
- 사이드바 메뉴

## 관련 파일
- src/lib/db/schema.ts
- src/app/[lang]/(main)/posts/new/page.tsx
- src/components/organisms/PostList.tsx
- src/components/organisms/CategorySidebar.tsx
```

#### 예시 2: 동작 변경
```
알림 설정을 카테고리별로 세분화해줘.

## 현재 기능
- 알림 on/off만 가능 (전체 또는 전무)

## 변경 사항
- 카테고리별 알림 설정 가능
- 예: 기술 카테고리는 알림 on, 라이프스타일은 off

## 영향 범위
- users 테이블 스키마
- 프로필 설정 페이지
- 알림 생성 로직

## 관련 파일
- src/lib/db/schema.ts
- src/app/[lang]/(main)/profile/edit/page.tsx
- src/lib/notifications/create.ts
```

---

### 프롬프트 작성 팁

1. **구체적으로 작성하기**
   - ❌ "로그인 기능 만들어줘"
   - ✅ "Google OAuth 로그인 기능을 NextAuth v5로 구현해줘. 로그인 후 /ko로 리다이렉트되어야 해."

2. **관련 파일 명시하기**
   - 프로젝트 구조를 모르는 AI도 빠르게 파악 가능
   - HANDOVER.md 참고하라고 언급

3. **제약 조건 명시하기**
   - 서버 액션 사용 안 함
   - API 응답 형식 유지
   - 기존 스타일 유지 등

4. **예시 코드 첨부하기**
   - 비슷한 기존 코드가 있으면 첨부
   - "이 파일처럼 만들어줘" 형식으로 요청

5. **단계별로 요청하기**
   - 큰 기능은 한 번에 요청하지 말고 나눠서
   - 예: DB 스키마 → API → 프론트엔드 순서로

---

## 마무리

이 문서가 프로젝트를 이해하는 데 도움이 되셨기를 바랍니다!

**궁금한 점이 있으면 코드를 직접 살펴보세요. 파일 이름과 폴더 구조가 직관적이라 찾기 쉬울 거예요.**

작성일: 2025년 12월
