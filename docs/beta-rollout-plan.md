# Viet K-Connect 베타 론칭 우선순위 플랜

## 1) P0 — 베타 출시 필수
- 전문가 인증 답변: 인증/전문가 뱃지 노출, 답변 상단 고정, 채택 기능 활성화, 업보트 기반 정렬 지원.
- 온보딩 개인화: 첫 로그인 설문(관심 토픽·비자 단계·언어), `users.interests/koreanLevel` 저장, 홈 피드 필터 반영.
- 실데이터/SEO 정합성: mock 데이터 제거, 질문 상세 SSR + generateMetadata/JSON-LD 실데이터 동기화, hreflang/canonical 반영.
- 사이트맵 정비: DB 기반 동적 sitemap 생성, robots에 최신 경로 반영, Search Console 제출 준비.
- 모바일 핵심 UX: 하단 내비/모바일 드로어 유지, 브레이크포인트 추가(sm/lg), 터치 타깃 44px+, 간격 정리.

## 2) P1 — 베타 직후 1~2주 내
- 토픽 구독/알림: topic_subscriptions 활성화, 관심 토픽 알림 토글, PWA 푸시/이메일 준비.
- Q&A 품질 강화: 업보트/정렬 SQL화, 신고 흐름 재점검, 채택된 답변 라벨·고정.
- PWA 안정화: ENABLE_PWA=true 기준 서비스워커 활성, 오프라인 캐시 기본 셋, 설치 배너/푸시 채널 준비.
- 성능 모니터링: Lighthouse/Playwright 기반 `npm run audit:performance` 실행 체계화, LCP/INP/CLS 목표 트래킹.

## 3) P2 — 베타 운영 안정화
- 게이미피케이션: 기여도/레벨 배지, 미션/랭킹 준비.
- 콘텐츠 확장: 카드뉴스·숏폼 웹 연계 섹션, OG 미리보기 일관화.
- 데이터 추적: KPI(가입 전환, 재방문, 알림 클릭, 채택률) 이벤트 스키마 설계 및 로깅.
