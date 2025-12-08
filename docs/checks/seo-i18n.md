# SEO / i18n / SSR 체크리스트

## 필수 적용 항목 (모든 신규 라우트)
- `generateMetadata`: title/description/canonical, alternates(ko/en/vi), OG/Twitter 카드, keywords.
- JSON-LD: Q&A는 DiscussionForumPosting, 프로필은 ProfilePage, 뉴스/이벤트는 Article/NewsArticle.
- SSR/SSG(ISR): 리스트·글·프로필은 서버에서 HTML 생성, HydrationBoundary로 TanStack Query 상태 주입.
- UGC 링크: `rel="ugc"` 기본 적용(+nofollow/sponsored 필요 시 추가).
- 페이지네이션: 고유 URL, 내부 링크 제공(무한스크롤만 사용 금지).

## 라우트별 상태 점검 계획
- 홈/피드(`[lang]/(main)/*`): 이미 SSR; 카테고리/토픽/팔로우 탭 메타 변형 필요 시 `generateMetadata` 분기 추가.
- 상세(Q&A/뉴스): 목업 제거 후 실데이터 기반 `generateMetadata` + JSON-LD; canonical에 lang 포함.
- 토픽/구독(신규): `/[lang]/topics/[slug]` 메타/JSON-LD, 구독 상태 반영; pagination URL 유지.
- FAQ/이벤트/배너(신규): Article/FAQPage JSON-LD; `noindex` 필요 페이지(프리뷰/내부) 분리.
- 랭킹/미션(신규): 기본 SEO 메타, 구조화 데이터는 BreadcrumbList/ItemList 고려.
- 관리자: `robots: noindex` 설정.

## i18n
- 모든 문구 `messages/*.json` 키화, ko/en/vi 3개 키 존재 여부 검사.
- 링크·버튼의 lang-aware 경로 사용(`[lang]` 세그먼트).
- 온보딩/설정에서 언어 기본값을 비자/언어 레벨과 연동(선택값 저장).

## 기술 체크
- sitemap/robots: 신규 라우트 반영, 내부/테스트 라우트는 제외 혹은 noindex.
- OG 이미지: 카드뉴스/이벤트/뉴스는 썸네일 필드로 OG 지정, fallback 이미지 준비.
- 성능: 이미지 최적화, 폰트 최적화, LCP/INP/CLS 목표(LCP ≤2.5s, INP ≤200ms, CLS ≤0.1).
