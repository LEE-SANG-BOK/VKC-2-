-- scripts/feed-run-as.sql
-- Feed popular/recent/following verification using Supabase "Run as" JWT injection.
--
-- Usage:
--   psql "$SUPABASE_DB_URL" \
--     -v viewer_jwt='JWT_FOR_ACCOUNT_A' \
--     -v viewer_id='uuid-for-account-a' \
--     -v fallback_threshold='0.1' \
--     -v following_jwt='JWT_FOR_ACCOUNT_B (optional)' \
--     -f scripts/feed-run-as.sql

\set ON_ERROR_STOP on

\if :{?viewer_jwt}
\else
  \echo 'ERROR: missing -v viewer_jwt'
  \quit
\endif

\if :{?viewer_id}
\else
  \echo 'ERROR: missing -v viewer_id'
  \quit
\endif

select set_config('request.jwt', :'viewer_jwt', true);

\echo ''
\echo '=== Question feed popular (top 20) ==='
select
  question_id,
  helpful_votes,
  recent_answer_count,
  base_score,
  recency_score,
  activity_score
from public.question_feed_metrics
order by base_score desc, created_at desc
limit 20;

\echo ''
\echo '=== Question feed recent (top 20) ==='
select
  question_id,
  helpful_votes,
  base_score,
  created_at
from public.question_feed_metrics
order by created_at desc
limit 20;

\echo ''
\echo '=== Popular fallback candidates (score < threshold) ==='
select
  question_id,
  helpful_votes,
  base_score,
  recent_answer_count
from public.question_feed_metrics
where base_score < coalesce(:fallback_threshold::numeric, 0.1)
order by base_score asc
limit 10;

\echo ''
\echo '=== Following filter (requires viewer_id follow records) ==='
select
  q.question_id,
  q.author_id,
  q.helpful_votes,
  q.created_at
from public.question_feed_metrics q
where q.author_id = any (
  select following_id
  from public.user_follows
  where follower_id = :'viewer_id'
)
order by q.created_at desc
limit 20;

\if :{?following_jwt}
\echo ''
\echo '=== Cross-account visibility check (optional) ==='
select set_config('request.jwt', :'following_jwt', true);
select
  question_id,
  author_id
from public.question_feed_metrics
where author_id = :'viewer_id'
order by created_at desc
limit 5;
\endif

\echo ''
\echo '=== Post helpful aggregation ==='
select
  p.id,
  p.helpful_count,
  v.vote_count
from public.posts p
left join (
  select
    target_id,
    count(*) filter (where vote_type = 'helpful') as vote_count
  from public.votes
  where target_type = 'post'
  group by target_id
) v on v.target_id = p.id
order by p.helpful_count desc nulls last
limit 20;

\echo ''
\echo 'Feed Run as verification script completed.'
