# Viet K-Connect (VietHub)

베트남 유학생/취업자를 위한 다국어 Q&A 커뮤니티입니다. 모바일 퍼스트, 신뢰 배지/검증 기반 UX를 지향합니다.

## 기술 스택

- Next.js 16 / React 19 / TypeScript (strict)
- Tailwind CSS 4
- Supabase + Drizzle ORM
- TanStack Query
- NextAuth v5

## 주요 명령어

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run lint` - ESLint
- `npm run db:generate` - Drizzle 마이그레이션 생성
- `npm run db:migrate` - 마이그레이션 실행

## 구조 요약

- `src/app` - App Router 페이지/라우트
- `src/components` - ATOMIC 컴포넌트(기본 export)
- `src/repo` - fetch/mutation/query/types + 키는 `src/repo/keys.ts`
- `messages` - ko/en/vi i18n JSON
- `public` - 정적 에셋(브랜드 로고 등)

## 운영 규칙

- 서버 액션 사용 금지, API 라우트만 사용
- import는 `@/` alias 사용
- 리스트/글/프로필은 SSR/SSG, `generateMetadata` + JSON-LD 적용
- UGC 외부 링크는 기본 `rel="ugc"` 적용
