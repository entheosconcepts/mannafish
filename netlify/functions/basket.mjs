// The MannaFish basket (fish-lang/basket.js): a free request for MannaFish decals -- for me, a gift for a friend, or a church or
// Free Fish Embassy (Ken, 21 Oct: "I need to build out the fish basket").
//   POST /api/basket                {for, name, email, street, city, zip, country, note, to, org, baskets, phone, lang, items:[{id,word,ref,l,q}]}
//                                   -> kept here (Netlify Blobs), in the account's orders (Supabase, when SUPABASE_SECRET_KEY is set),
//                                      and emailed to MannaFish and to the person (when BREVO_API_KEY is set)
//   GET  /api/basket/status?ids=a,b -> where each request is (requested, packed, sent, delivered)
//   GET  /api/basket/admin?k=       -> every request (k = MF_ADMIN_KEY, or PROOF_KEY)
//   POST /api/basket/admin {k,id,status}
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const SB_URL = process.env.SUPABASE_URL || 'https://oblttpxqjvaglwfdszdg.supabase.co';
const SB_PUB = 'sb_publishable_Nl4EDkBHlrnEqFVcL_oGvQ_J-X-t3Wc';
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_BASKET_TO || process.env.MF_STORIES_TO || process.env.MF_PROOF_TO || FROM.email;
const db = () => getStore({ name: 'mannafish-basket', consistency: 'strong' });
const STATUS = ['requested', 'packed', 'sent', 'delivered', 'cancelled', 'waitlist'];
// Until decals can be sent (Ken, 25 Oct: launch the devotional first, decals "coming soon"), every request is a waitlist entry:
// name, email and the fish wanted, no address, nothing promised. Netlify setting MF_BASKET_OPEN=1 opens real requests again.
const OPEN = () => process.env.MF_BASKET_OPEN === '1';
const LANG = { en: 'English', es: 'Español', tl: 'Tagalog', zh: '中文', hi: 'हिन्दी', el: 'Ελληνικά', de: 'Deutsch', ko: '한국어', he: 'עברית', ar: 'العربية',ru:"Русский" };
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rid = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
const bad = (m, s) => Response.json({ ok: false, error: m }, { status: s });
function okOrigin(o) { if (!o) return true; try { const h = new URL(o).hostname; return /(^|\.)manna-fish\.com$|netlify\.app$|^localhost$|^mf\.test$/.test(h); } catch (e) { return false; } }

async function limited(ip, max) {
  try {
    const s = getStore('mannafish-limits'), k = `basket/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0;
    if (n >= max) return true;
    await s.set(k, String(n + 1));
  } catch (e) { /* a counter failure never blocks a request */ }
  return false;
}
// the account, when the person is signed in (their orders then show on every device)
async function userOf(req) {
  const a = req.headers.get('authorization') || ''; if (!/^Bearer \S+/.test(a)) return null;
  try { const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_PUB, authorization: a } }); if (!r.ok) return null; const u = await r.json(); return u && u.id ? u : null; } catch (e) { return null; }
}
function sbHeaders() {
  const key = process.env.SUPABASE_SECRET_KEY; if (!key) return null;
  const H = { apikey: key, 'content-type': 'application/json', prefer: 'return=representation' };
  if (key.startsWith('eyJ')) H.authorization = 'Bearer ' + key;
  return H;
}
// into the account's orders; the extra columns (kind, note, ...) are used when tools/supabase/basket.sql has been run
async function toSupabase(r, user) {
  const H = sbHeaders(); if (!H) return '';
  const ship = r.for === 'gift' ? r.to : r.for === 'church' ? r.org : r.name;
  const base = { site: 'mannafish', email: r.email, ship_name: ship, street: r.street, city: r.city, state_zip: r.zip, ...(user ? { user_id: user.id } : {}) };
  const more = { kind: r.for, note: r.note, from_name: r.name, country: r.country, org: r.org, baskets: r.baskets || null, ref: r.id };
  let o = await fetch(SB_URL + '/rest/v1/orders', { method: 'POST', headers: H, body: JSON.stringify({ ...base, ...more }) });
  if (!o.ok) o = await fetch(SB_URL + '/rest/v1/orders', { method: 'POST', headers: H, body: JSON.stringify(base) });
  if (!o.ok) { console.log('basket order not saved', o.status, (await o.text()).slice(0, 200)); return ''; }
  const [order] = await o.json();
  const it = await fetch(SB_URL + '/rest/v1/order_items', { method: 'POST', headers: H,
    body: JSON.stringify(r.items.map((x) => ({ order_id: order.id, word_key: x.word.toUpperCase(), language: LANG[x.l] || 'English', qty: x.q }))) });
  if (!it.ok) console.log('basket items not saved', it.status);
  return order.id;
}
async function sbStatus(sbid, status) {
  const H = sbHeaders(); if (!H || !sbid) return;
  try { await fetch(SB_URL + '/rest/v1/orders?id=eq.' + encodeURIComponent(sbid), { method: 'PATCH', headers: H, body: JSON.stringify({ status }) }); } catch (e) {}
}
function lines(r) { return r.items.map((x) => `${x.q} × ${x.word}${x.l && x.l !== 'en' ? ' (' + (LANG[x.l] || x.l) + ')' : ''}${x.ref ? ' — ' + x.ref : ''}`); }
function shipTo(r) { return [r.for === 'gift' ? r.to : r.for === 'church' ? r.org + ' (' + r.name + ')' : r.name, r.street, r.city + ' ' + r.zip, r.country].filter(Boolean).join('\n'); }
// on the waitlist: MannaFish hears who wants which fish; the person is told nothing is mailed yet
async function notifyWait(r) {
  if (!hasMail()) return;
  const site = process.env.URL || 'https://manna-fish.com', n = r.items.reduce((t, x) => t + x.q, 0);
  const kind = { me: 'for themselves', gift: 'as a gift', church: 'for ' + (r.org || 'a church') + (r.baskets ? ' (' + r.baskets + ' baskets)' : '') }[r.for];
  try {
    await sendMail({ to: TO(), name: 'MannaFish', tag: 'basket-wait', subject: `🧺 Waitlist: ${n} MannaFish ${kind}`,
      text: `${r.name} <${r.email}>${r.phone ? ' · ' + r.phone : ''} joined the decal waitlist: ${n} MannaFish ${kind}.\n\n${lines(r).join('\n')}\n\n${r.note ? 'Note:\n' + r.note + '\n\n' : ''}All requests: ${site}/basket/admin/`,
      html: `<p style="font:16px Arial,sans-serif"><b>${esc(r.name)}</b> &lt;${esc(r.email)}&gt;${r.phone ? ' · ' + esc(r.phone) : ''} joined the decal waitlist: <b>${n} MannaFish</b> ${esc(kind)}.</p>`
        + `<ul style="font:16px Arial,sans-serif">${lines(r).map((l) => '<li>' + esc(l) + '</li>').join('')}</ul>`
        + (r.note ? `<p style="font:16px/1.5 Georgia,serif;white-space:pre-wrap"><b>Note</b><br>${esc(r.note)}</p>` : '')
        + `<p style="font:16px Arial,sans-serif"><a href="${site}/basket/admin/">All requests</a></p>` });
  } catch (e) { console.log('waitlist email failed', String(e).slice(0, 200)); }
  try {
    await sendMail({ to: r.email, name: r.name, tag: 'basket-wait-thanks', subject: 'You are on the MannaFish decal waitlist',
      text: `Thank you, ${r.name}! You are on the waitlist for ${n} MannaFish decals:\n\n${lines(r).join('\n')}\n\nThe decals are not ready to send yet. We will email you when they are, and nothing will be mailed until then.\n\nIn the meantime, today's fish is waiting for you at ${site}\n\nMannaFish`,
      html: `<p style="font:17px/1.5 Georgia,serif">Thank you, ${esc(r.name)}! You are on the waitlist for <b>${n} MannaFish decals</b>:</p>`
        + `<ul style="font:16px Arial,sans-serif">${lines(r).map((l) => '<li>' + esc(l) + '</li>').join('')}</ul>`
        + `<p style="font:17px/1.5 Georgia,serif">The decals are not ready to send yet. We will email you when they are, and nothing will be mailed until then.</p>`
        + `<p style="font:17px/1.5 Georgia,serif">In the meantime, <a href="${site}">today's fish</a> is waiting for you.</p>` });
  } catch (e) { console.log('waitlist thanks failed', String(e).slice(0, 200)); }
}
async function notify(r) {
  if (!hasMail()) return;
  const site = process.env.URL || 'https://manna-fish.com', n = r.items.reduce((t, x) => t + x.q, 0);
  const kind = { me: 'for themselves', gift: 'as a gift for ' + r.to, church: 'for ' + r.org + (r.baskets ? ' (' + r.baskets + ' baskets)' : '') }[r.for];
  try {
    await sendMail({ to: TO(), name: 'MannaFish', tag: 'basket', subject: `🧺 Basket: ${n} MannaFish ${kind}`,
      text: `${r.name} <${r.email}>${r.phone ? ' · ' + r.phone : ''} asked for ${n} MannaFish ${kind}.\n\n${lines(r).join('\n')}\n\nShip to:\n${shipTo(r)}\n\n${r.note ? 'Note:\n' + r.note + '\n\n' : ''}Requests: ${site}/basket/admin/`,
      html: `<p style="font:16px Arial,sans-serif"><b>${esc(r.name)}</b> &lt;${esc(r.email)}&gt;${r.phone ? ' · ' + esc(r.phone) : ''} asked for <b>${n} MannaFish</b> ${esc(kind)}.</p>`
        + `<ul style="font:16px Arial,sans-serif">${lines(r).map((l) => '<li>' + esc(l) + '</li>').join('')}</ul>`
        + `<p style="font:16px/1.4 Arial,sans-serif;white-space:pre-line"><b>Ship to</b><br>${esc(shipTo(r))}</p>`
        + (r.note ? `<p style="font:16px/1.5 Georgia,serif;white-space:pre-wrap"><b>Note</b><br>${esc(r.note)}</p>` : '')
        + `<p style="font:16px Arial,sans-serif"><a href="${site}/basket/admin/">All basket requests</a></p>` });
  } catch (e) { console.log('basket email failed', String(e).slice(0, 200)); }
  try {
    await sendMail({ to: r.email, name: r.name, tag: 'basket-thanks', subject: 'Your MannaFish basket is on its way to us',
      text: `Thank you, ${r.name}! We have your request for ${n} MannaFish ${r.for === 'gift' ? 'for ' + r.to : r.for === 'church' ? 'for ' + r.org : ''}.\n\n${lines(r).join('\n')}\n\nFree, postage included. Someone already paid for it.\nFive loaves, two fish, and twelve baskets left over (John 6:9–13).\n\n${site}/you/#or`,
      html: `<p style="font:17px/1.5 Georgia,serif">Thank you, ${esc(r.name)}! We have your request for <b>${n} MannaFish</b>${r.for === 'gift' ? ' for ' + esc(r.to) : r.for === 'church' ? ' for ' + esc(r.org) : ''}.</p>`
        + `<ul style="font:16px Arial,sans-serif">${lines(r).map((l) => '<li>' + esc(l) + '</li>').join('')}</ul>`
        + `<p style="font:15px Arial,sans-serif;color:#555">Free, postage included. Someone already paid for it.<br><i>Five loaves, two fish, and twelve baskets left over (John 6:9–13).</i></p>`
        + `<p style="font:15px Arial,sans-serif"><a href="${site}/you/#or">See your orders</a></p>` });
  } catch (e) { console.log('basket thanks failed', String(e).slice(0, 200)); }
}

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/basket\/?/, ''), s = db();
  if (sub === 'admin') {
    if (req.method === 'GET') {
      if (!KEY() || url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
      const { blobs } = await s.list({ prefix: 'b/' });
      const all = (await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))).filter(Boolean).sort((a, b) => (a.at < b.at ? 1 : -1));
      return Response.json({ ok: true, requests: all }, { headers: { 'cache-control': 'no-store' } });
    }
    if (req.method !== 'POST') return bad('Not allowed', 405);
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
    const r = await s.get('b/' + clean(b.id, 40), { type: 'json' }); if (!r) return bad('Not found', 404);
    if (b.status && STATUS.includes(b.status)) { r.status = b.status; r.log = (r.log || []).concat([[b.status, new Date().toISOString()]]); await sbStatus(r.sbid, b.status); }
    if (b.memo != null) r.memo = clean(b.memo, 600);
    await s.setJSON('b/' + r.id, r);
    return Response.json({ ok: true, request: r });
  }
  if (sub === 'status' && req.method === 'GET') {
    const ids = (url.searchParams.get('ids') || '').split(',').map((x) => clean(x, 40)).filter(Boolean).slice(0, 50);
    const out = {};
    for (const id of ids) { const r = await s.get('b/' + id, { type: 'json' }); if (r) out[id] = { status: r.status, at: r.at, log: r.log || [] }; }
    return Response.json({ ok: true, status: out }, { headers: { 'cache-control': 'no-store' } });
  }
  if (sub !== '' || req.method !== 'POST') return bad('Not found', 404);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.hp) return Response.json({ ok: true, id: 'x' });                    // a robot filled the hidden field
  const kind = ['me', 'gift', 'church'].includes(b.for) ? b.for : 'me';
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 40).map((x) => ({ id: clean(x.id, 30), word: clean(x.word, 30), ref: clean(x.ref, 40), l: LANG[x.l] ? x.l : 'en', q: Math.max(1, Math.min(12, parseInt(x.q, 10) || 1)) })).filter((x) => x.word);
  if (!items.length) return bad('The basket is empty', 400);
  const r = { id: Date.now().toString(36) + rid(6), at: new Date().toISOString(), status: 'requested', for: kind,
    name: clean(b.name, 80), email: clean(b.email, 160), phone: clean(b.phone, 40), to: clean(b.to, 80), org: clean(b.org, 120), baskets: Math.max(0, Math.min(12, parseInt(b.baskets, 10) || 0)),
    street: clean(b.street, 160), city: clean(b.city, 80), zip: clean(b.zip, 40), country: clean(b.country, 60) || 'United States', note: clean(b.note, 600), lang: LANG[b.lang] ? b.lang : 'en', items };
  const wait = !OPEN() || !!b.wait; if (wait) { r.status = 'waitlist'; r.wait = true; r.street = r.city = r.zip = ''; }
  if (!r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return bad('Name and email, please', 400);
  if (!wait && (!r.street || !r.city || !r.zip)) return bad('Name, email and address, please', 400);
  if (kind === 'gift' && !r.to && !wait) return bad('Who is the gift for?', 400);
  if (kind === 'church' && !r.org) return bad('Which church or ministry?', 400);
  const n = items.reduce((t, x) => t + x.q, 0);
  if (n > (kind === 'church' ? 400 : 60)) return bad('That is more than one request can hold', 400);
  if (await limited(context && context.ip, 6)) return bad('Please wait a little', 429);
  const user = await userOf(req);
  if (!wait) try { r.sbid = await toSupabase(r, user); } catch (e) { console.log('basket supabase', String(e).slice(0, 200)); }
  await s.setJSON('b/' + r.id, r);
  await (wait ? notifyWait(r) : notify(r));
  return Response.json({ ok: true, id: r.id, wait });
};
export const config = { path: ['/api/basket', '/api/basket/*'] };
