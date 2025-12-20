# Product and SEO Policy

## Public vs Private SSR
- Public SSR: lists, posts, profiles, categories, FAQ.
- Private gating: write actions require login; show CTA instead of errors.
- Sensitive content should show preview + login CTA when gated.

## Sitemap and Robots
- Sitemap should include: home, posts, profiles, categories, FAQ.
- When a public notice/news route exists, include it in sitemap.
- Robots should expose sitemap and block internal-only paths via `noindex` meta.

## hreflang and Canonical
- Use the same canonical base for ko/en/vi pages.
- Always emit alternates for all locales when route exists.

## Personalization Rules
- Base ordering: popular with recent boost.
- Apply onboarding interest weights as a secondary factor.
- Keep anonymous users on non-personalized ranking.

## Related/Recommended Content
- Related posts use category + tags + engagement signals.
- If data is insufficient, fall back to category-popular list.

## Profile Score and Ranking
- Score = trustScore + helpfulAnswers * 5 + adoptionRate.
- Level increases every 100 points; levelProgress is % to next level.
- Rank is global leaderboard order by score.

## Analytics Events
- Required events: view, search, like, answer, comment, bookmark, follow, report, share.
- Metadata: entityType/entityId, locale, channel where relevant.

## Core Metrics
- DAU/WAU/MAU tracked by locale.
- Answer rate, adoption rate, report rate tracked weekly.

## Content Expansion Process
- Internal drafts live in a private workspace.
- Only reviewed content moves to public categories.
- Maintain a CMS checklist for SEO title/description and source attribution.

## Moderation and Spam Policy
- External links must be on allowlist.
- Ads and contact solicitation are disallowed in user posts.
- Repeat offenders are rate-limited and content is auto-hidden.

## Security and Rate Limit
- Write APIs should apply stricter rate limits than read APIs.
- CSP should block unsafe inline scripts and limit third-party domains.

## Dependency Review
- Review dependencies quarterly for security/size regressions.
- Remove unused libraries and heavy locale bundles.
