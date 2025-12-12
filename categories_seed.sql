-- categories_seed.sql (slug 기반 upsert + parent_id 세팅)

WITH upsert_parents AS (
  INSERT INTO categories (slug, name, "order", parent_id)
  VALUES
    ('visa', '한국 비자·체류', 1, NULL),
    ('students', '한국 유학·학생', 2, NULL),
    ('career', '한국 취업·경력', 3, NULL),
    ('living', '한국 생활정보', 4, NULL)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        "order" = EXCLUDED."order",
        parent_id = NULL,
        is_active = TRUE
  RETURNING id, slug
)
INSERT INTO categories (slug, name, parent_id, "order")
SELECT v.slug, v.name, p.id, v.ord
FROM upsert_parents p
JOIN (
  VALUES
    ('visa-process', '한국 비자 신청·연장', 'visa', 1),
    ('status-change', '한국 체류자격 변경', 'visa', 2),
    ('visa-checklist', '한국 비자 체크리스트', 'visa', 3),
    ('scholarship', '한국 입학·장학금', 'students', 1),
    ('university-ranking', '한국 학교/지역 비교', 'students', 2),
    ('korean-language', '한국어/TOPIK', 'students', 3),
    ('business', '한국 아르바이트', 'career', 1),
    ('wage-info', '급여·최저임금', 'career', 2),
    ('legal', '근로자 권리', 'career', 3),
    ('housing', '한국에서 집 구하기', 'living', 1),
    ('cost-of-living', '한국 생활비 계산', 'living', 2),
    ('healthcare', '한국 의료 이용', 'living', 3)
) AS v(slug, name, parent_slug, ord)
ON p.slug = v.parent_slug
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      "order" = EXCLUDED."order",
      is_active = TRUE;
