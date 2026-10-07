// Records each Free Decals request as an order in Supabase (Yadah project), so the person can see it
// in "My MannaFish" after signing in with the same email. Needs SUPABASE_SECRET_KEY in Netlify
// (never in the page). Without it, it answers 501 and the request is still kept by Netlify Forms.
const SB_URL = process.env.SUPABASE_URL || 'https://oblttpxqjvaglwfdszdg.supabase.co';
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return new Response('Not set up yet', { status: 501 });
  let f; try { f = Object.fromEntries(new URLSearchParams(await req.text())); } catch (e) { return new Response('Bad request', { status: 400 }); }
  if (f['bot-field'] || f['form-name'] !== 'free-gift') return Response.json({ ok: true });
  const email = String(f.email || '').trim().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new Response('Email needed', { status: 400 });
  const cut = (v) => String(v || '').slice(0, 300);
  const H = { apikey: key, 'content-type': 'application/json', prefer: 'return=representation' };
  if (key.startsWith('eyJ')) H.authorization = 'Bearer ' + key;          // older "service_role" style key
  const o = await fetch(SB_URL + '/rest/v1/orders', { method: 'POST', headers: H,
    body: JSON.stringify({ site: 'mannafish', email, ship_name: cut(f.name), street: cut(f.street), city: cut(f.city), state_zip: cut(f['state-zip']) }) });
  if (!o.ok) return new Response('Could not save order', { status: 502 });
  const [order] = await o.json();
  const word = cut(f.word), lang = cut(f['decal-language']) || 'English';
  const it = await fetch(SB_URL + '/rest/v1/order_items', { method: 'POST', headers: H,
    body: JSON.stringify({ order_id: order.id, word_key: word.toUpperCase(), language: lang, qty: 2 }) });
  if (!it.ok) return new Response('Could not save order item', { status: 502 });
  return Response.json({ ok: true, id: order.id });
};
export const config = { path: '/api/order-record' };
