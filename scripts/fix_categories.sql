-- 부모 카테고리 upsert (parent_id는 null)
insert into categories (name, slug, is_active, "order")
values
  ('한국 비자·체류','visa',true,1),
  ('유학·학생','students',true,2),
  ('취업·경력','career',true,3),
  ('생활정보','living',true,4)
on conflict (slug) do update set is_active=true, parent_id=null;

-- 비자 하위
update categories set parent_id = (select id from categories where slug='visa')
where slug in ('visa-process','status-change','visa-checklist','visa-tips');

-- 유학/학생 하위
update categories set parent_id = (select id from categories where slug='students')
where slug in ('scholarship','tuition-living-cost','university-ranking','campus-life','korean-language','student-life');

-- 취업/경력 하위
update categories set parent_id = (select id from categories where slug='career')
where slug in ('business','legal','wage-info','employment');

-- 생활정보 하위
update categories set parent_id = (select id from categories where slug='living')
where slug in ('cost-of-living','housing','finance','healthcare');
