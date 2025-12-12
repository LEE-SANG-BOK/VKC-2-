create or replace function gen_default_nickname() returns text language plpgsql as $$
declare
  adjectives text[] := array[
    'bright','calm','swift','sunny','gentle','bold','quiet','lively','cozy','fresh',
    'brave','clever','kind','mint','amber','lunar','solar','happy','chill','merry'
  ];
  nouns text[] := array[
    'otter','lynx','heron','panda','falcon','tiger','koala','owl','whale','coral',
    'lotus','coconut','mango','pepper','bamboo','dolphin','phoenix','avocado','coffee','lotus'
  ];
  adj text;
  noun text;
  num text;
begin
  adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
  num := to_char(floor(random() * 900 + 100)::int, 'FM000'); -- 3 digits
  return lower(adj || '-' || noun || num);
end;
$$;
create or replace function normalize_nickname() returns trigger language plpgsql as $$ begin if new.display_name is null or new.display_name ~* '^[0-9a-f-]{20,}$' or new.display_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or new.display_name ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' or length(new.display_name) < 2 then new.display_name := gen_default_nickname(); end if; return new; end; $$;
drop trigger if exists trg_profiles_nickname on users;
create trigger trg_profiles_nickname before insert or update on users for each row execute function normalize_nickname();
update users set display_name = gen_default_nickname() where display_name is null or display_name ~* '^[0-9a-f-]{20,}$' or display_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or display_name ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' or length(display_name) < 2;

 update users
  set
  display_name =
  gen_default_nickn
  ame()
  where
  display_name
  is null
     or
  display_name
  ~* '^[0-9a-f-]
  {20,}$'
     or
  display_name ~*
  '^[0-9a-f]{8}-[0-
  9a-f]{4}-[0-
  9a-f]{4}-[0-9a-
  f]{4}-[0-9a-f]
  {12}$'
     or
  display_name ~*
  '^[^@\\s]+@[^@\
  \s]+\\.[^@\\s]+$'
     or
  length(display_na
  me) < 2;