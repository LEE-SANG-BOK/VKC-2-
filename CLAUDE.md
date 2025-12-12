# 베트남 Q&A 커뮤니티 사이트

본 프로젝트는 베트남 전용 Q&A 사이트
다국어 지원 필요함 (한/영/베트남 적용 필요)

## 기술 스펙

- Next.js
- Tailwind
- Supabase
- Drizzle ORM
- Tanstack Query
- React Hook Forms
- Zod
- Drizzle Zod

## 디자인 가이드라인

- ATOMIC 디자인 패턴 적용
- Magic UI 사용
- 반응형 항시 지원
- SEO 항시 지원 (SSR 적용)
- tailwind container 클래스 기준으로 반응형 지원

## SEO 가이드라인

• 서버에서 보이는 HTML: 리스트·글·프로필은 SSR/SSG(ISR)로 최초 HTML을 만들어줘. JS 실행 의존 X.
• 메타데이터 시스템화: generateMetadata로 title/description/canonical/OG/Twitter 카드와 다국어 alternates를 라우트별로 관리.
• sitemap & robots: app/sitemap.ts / app/robots.ts로 자동 생성. 내부 검색·프리뷰 등은 noindex(robots.txt 차단이 아님!) 처리.
• 구조화 데이터: 글= DiscussionForumPosting, 프로필= ProfilePage JSON-LD.
• UGC 링크 안전화: 댓글·본문의 외부링크에 기본 rel="ugc"(+ 필요 시 nofollow/sponsored).
• 페이지네이션: 각 페이지는 고유 URL과 내부 링크 제공(무한 스크롤만 쓰지 말 것). rel=prev/next에 의존하지 말고 순차 링크/정상 URL 구조 유지.
• CWV 성능 기준: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1을 75퍼센타일 기준으로 맞춘다. 이미지 최적화/폰트 최적화/3rd 스크립트 늦게 로드.

## 데이터베이스 연결 및 API 연동 가이드라인

- 절대 서버 액션을 사용하지 않을 것
- API 라우트로 API 를 만들어서 사용할 것
- repo 폴더 구조 유지해서 tanstack query 로 작업할
  - repo/[domain]/(fetch.ts, mutation.ts, query.ts, types.ts)
  - repo/key.ts
- 필요한 페이지에는 SEO 가이드라인에 따라 SSR 적용할 것
