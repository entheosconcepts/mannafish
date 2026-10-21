-- The basket (Ken, 21 Oct): who a request is for and the note that goes with it. Run once in the Supabase SQL editor
-- (Yadah project). Without it the basket still works: the order is saved without these, and everything is also kept in
-- Netlify Blobs and emailed (netlify/functions/basket.mjs).
alter table public.orders add column if not exists kind      text;   -- me, gift, church
alter table public.orders add column if not exists note      text;   -- the note in the envelope, or about the baskets
alter table public.orders add column if not exists from_name text;   -- who asked (ship_name is who it goes to)
alter table public.orders add column if not exists country   text;
alter table public.orders add column if not exists org       text;   -- church or ministry
alter table public.orders add column if not exists baskets   int;
alter table public.orders add column if not exists ref       text;   -- the request's id in the basket store
-- status: requested, packed, sent, delivered, cancelled (set from /basket/admin/)
