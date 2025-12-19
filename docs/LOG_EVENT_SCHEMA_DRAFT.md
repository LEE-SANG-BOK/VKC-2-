# Log/Event Schema Draft

## goals
- track views, searches, likes, answers for daily/weekly aggregates
- support per-entity ranking and trend analysis
- keep raw events short-lived, aggregates long-lived

## tables

event_logs
- id: uuid (pk)
- event_type: text (view | search | like | answer | comment | bookmark | follow | report | share)
- entity_type: text (post | answer | comment | user | search)
- entity_id: uuid
- user_id: uuid (nullable)
- session_id: text (nullable)
- ip_hash: text (nullable)
- locale: text (ko | en | vi)
- referrer: text (nullable)
- metadata: jsonb (search_query, search_tokens, source, extra)
- created_at: timestamp

event_aggregates_daily
- id: uuid (pk)
- date: date (yyyy-mm-dd)
- event_type: text
- entity_type: text
- entity_id: uuid
- count: int
- unique_users: int
- created_at: timestamp
- updated_at: timestamp

search_terms_daily
- id: uuid (pk)
- date: date
- query_normalized: text
- locale: text
- count: int
- created_at: timestamp

## notes
- retain event_logs for 7-30 days, aggregates for 12+ months
- create composite indexes: (event_type, entity_type, entity_id, date), (query_normalized, date)
