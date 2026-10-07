\set QUIET on
\pset tuples_only on
insert into auth.users values ('11111111-1111-1111-1111-111111111111','ann@x.com'),('22222222-2222-2222-2222-222222222222','bob@x.com');
select 'profiles made by trigger: '||count(*) from public.profiles;
insert into public.orders(email,ship_name) values ('Ann@X.com','Ann'),('bob@x.com','Bob');
insert into public.order_items(order_id,word_key,language,qty) select id,'HOPE','Español',2 from public.orders;
-- Ann signs in
set role authenticated; select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","email":"ann@x.com"}',false);
insert into public.notes(word_key,verse_ref,body) values ('HOPE','Psalm 42:5','Ann note');
insert into public.highlights(verse_ref) values ('Psalm 42:5');
insert into public.activity(kind,word_key) values ('viewed','HOPE');
select 'ann sees notes: '||count(*) from public.notes;
select 'ann sees orders: '||string_agg(ship_name,',') from public.orders;
select 'ann sees order items: '||count(*) from public.order_items;
do $$ begin insert into public.notes(user_id,body) values ('22222222-2222-2222-2222-222222222222','forged'); raise notice 'FAIL: forged note allowed'; exception when others then raise notice 'ok: cannot write as Bob'; end $$;
do $$ begin insert into public.orders(email) values ('ann@x.com'); raise notice 'FAIL: browser order insert allowed'; exception when others then raise notice 'ok: cannot create orders from the browser'; end $$;
-- Bob signs in
select set_config('request.jwt.claims','{"sub":"22222222-2222-2222-2222-222222222222","email":"bob@x.com"}',false);
select 'bob sees notes: '||count(*) from public.notes;
select 'bob sees highlights: '||count(*) from public.highlights;
select 'bob sees activity: '||count(*) from public.activity;
select 'bob sees orders: '||string_agg(ship_name,',') from public.orders;
update public.notes set body='hacked'; 
select 'bob sees profiles: '||count(*) from public.profiles;
-- nobody signed in
reset role; set role anon; select set_config('request.jwt.claims','',false);
select 'anon sees sites: '||count(*) from public.sites;
select 'anon sees notes: '||count(*) from public.notes;
select 'anon sees orders: '||count(*) from public.orders;
reset role;
select 'ann note still: '||body from public.notes;
