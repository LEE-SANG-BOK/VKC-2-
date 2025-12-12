-- 신규 세부 토픽 추가 (상위 카테고리 유지)
-- topik (한국어 배우기), scholarship (교육), interview-tips (직장생활), worker-rights (노동법)
INSERT INTO "categories" ("name", "slug", "parent_id", "order", "sort_order", "is_active")
SELECT 'TOPIK 시험 대비', 'topik', c.id, 1, 1, true FROM "categories" c WHERE c.slug = 'korean-language'
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "parent_id" = EXCLUDED."parent_id",
  "order" = EXCLUDED."order",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = true;

INSERT INTO "categories" ("name", "slug", "parent_id", "order", "sort_order", "is_active")
SELECT '장학금/유학 준비', 'scholarship', c.id, 2, 2, true FROM "categories" c WHERE c.slug = 'education'
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "parent_id" = EXCLUDED."parent_id",
  "order" = EXCLUDED."order",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = true;

INSERT INTO "categories" ("name", "slug", "parent_id", "order", "sort_order", "is_active")
SELECT '면접/이력서 팁', 'interview-tips', c.id, 3, 3, true FROM "categories" c WHERE c.slug = 'employment'
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "parent_id" = EXCLUDED."parent_id",
  "order" = EXCLUDED."order",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = true;

INSERT INTO "categories" ("name", "slug", "parent_id", "order", "sort_order", "is_active")
SELECT '노동권/산업 안전', 'worker-rights', c.id, 4, 4, true FROM "categories" c WHERE c.slug = 'legal'
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "parent_id" = EXCLUDED."parent_id",
  "order" = EXCLUDED."order",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = true;
