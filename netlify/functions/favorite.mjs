// Favorite fish (Ken, 21 Nov: "add to my basket, my favorite fish... make sure admin gets notice when people add and where it came from... randomly, occasionally, send that user some free merch").
//   POST /api/favorite        {id, word, ref, src, dev, email?, lang}  -> {ok, lucky?, claim?}   one call each time a fish is added to a basket
//   POST /api/favorite/claim  {token, name, email, street, city, state, zip, note}  -> {ok}      a lucky person says where the free merch goes
//   GET  /api/favorite?k=KEY  -> {events:[newest 150], top:[{id,word,n}], claims:[...]}           for the admin page
// Ken is emailed at every add (set MF_FAV_EMAIL=0 to stop that and read the admin page instead). The surprise merch is OFF until MF_MERCH_ON=1 is set in Netlify.
//   MF_MERCH_ODDS  1 in this many adds is lucky (default 50)      MF_MERCH_MAX_MONTH  at most this many a month (default 20)
// One lucky add per device per 30 days. It is a surprise gift, not a prize drawing: nothing is bought, earned or promised.
import { getStore } from '@netlify/blobs';
import { sendMail, FROM } from './lib/mail.mjs';
const NS = { 'cache-control': 'no-store' };
const bad = (m, s) => Response.json({ ok: false, error: m }, { status: s, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_BASKET_TO || process.env.MF_ORDERS_TO || process.env.MF_PROOF_TO || FROM.email;
const db = () => getStore({ name: 'mannafish-favorites', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, DAY = 864e5;
const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
const month = () => new Date().toISOString().slice(0, 7);
async function limited(ip) { try { const s = getStore('mannafish-limits'), k = `fav/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0; if (n >= 120) return true; await s.set(k, String(n + 1)); } catch (e) { /* never blocks */ } return false; }
export default async (req, context) => {
  const url = new URL(req.url), s = db(), path = url.pathname.replace(/\/$/, '');
  if (req.method === 'GET') {
    if (!KEY() || url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
    const ev = [], claims = [], top = {};
    for (const b of (await s.list({ prefix: 'e/' })).blobs) { const r = await s.get(b.key, { type: 'json' }); if (r) { ev.push(r); const t = (top[r.id] = top[r.id] || { id: r.id, word: r.word, n: 0 }); t.n++; } }
    for (const b of (await s.list({ prefix: 'c/' })).blobs) { const r = await s.get(b.key, { type: 'json' }); if (r) claims.push({ token: r.token, at: r.at, claimed: !!r.claimed, word: r.word, src: r.src, who: r.who, ship: r.ship || null }); }
    ev.sort((a, b) => b.at - a.at); claims.sort((a, b) => b.at - a.at);
    return Response.json({ events: ev.slice(0, 150), total: ev.length, top: Object.values(top).sort((a, b) => b.n - a.n).slice(0, 25), claims: claims.slice(0, 50), merch: process.env.MF_MERCH_ON === '1' }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (/\/claim$/.test(path)) {   // a lucky person tells us where to send the merch
    const c = /^[0-9a-f]{32}$/.test(b.token || '') && await s.get('c/' + b.token, { type: 'json' }); if (!c || Date.now() - c.at > 14 * DAY) return bad('This link is not valid any more.', 404);
    if (c.claimed) return Response.json({ ok: true, already: true }, { headers: NS });
    const email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80), ship = { name, email: EMAIL.test(email) ? email : '', street: clean(b.street, 100), city: clean(b.city, 60), state: clean(b.state, 30), zip: clean(b.zip, 12), note: clean(b.note, 300) };
    if (!name || !ship.email || !ship.street || !ship.city || !ship.zip) return bad('Please add your name, email and the full address.', 400);
    c.claimed = true; c.claimedAt = Date.now(); c.ship = ship; await s.setJSON('c/' + c.token, c);
    try { await sendMail({ to: TO(), subject: `SHIP FREE MERCH: ${name} (${c.word})`, tag: 'favorite', html: `<p><b>${esc(name)}</b> (${esc(ship.email)}) claimed the surprise merch. Their lucky favorite: <b>${esc(c.word)}</b> from ${esc(c.src)}.</p><p>${esc(ship.street)}, ${esc(ship.city)} ${esc(ship.state)} ${esc(ship.zip)}</p>${ship.note ? `<p>${esc(ship.note)}</p>` : ''}`, text: `${name} ${ship.email}\n${ship.street}, ${ship.city} ${ship.state} ${ship.zip}\n${c.word} from ${c.src}` }); } catch (e) { /* the claim is kept either way */ }
    try { await sendMail({ to: ship.email, subject: 'Your free MannaFish gift is on its way', tag: 'favorite', html: `<div style="font:16px/1.55 Georgia,serif;max-width:34rem"><p>Thank you, ${esc(name)}. We will send your free MannaFish gift to the address you gave. It is a surprise, a thank-you for loving ${esc(c.word)}. Pass the second fish on to someone.</p><p style="color:#5b6570;font-size:13px">MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405</p></div>`, text: 'Your free MannaFish gift is on its way.' }); } catch (e) { /* ok */ }
    return Response.json({ ok: true }, { headers: NS });
  }
  // an add
  if (await limited(context && context.ip)) return Response.json({ ok: true }, { headers: NS });
  const id = clean(b.id, 40), word = clean(b.word, 60); if (!id || !word) return bad('Which fish?', 400);
  const dev = /^[A-Za-z0-9-]{8,60}$/.test(b.dev || '') ? b.dev : '', email = EMAIL.test(clean(b.email, 120)) ? clean(b.email, 120).toLowerCase() : '';
  const ev = { id, word, ref: clean(b.ref, 60), src: clean(b.src, 60) || 'unknown', lang: clean(b.lang, 5), who: email || (dev ? 'device ' + dev.slice(0, 8) : 'anonymous'), dev, at: Date.now() };
  // surprise merch: off until MF_MERCH_ON=1; one in MF_MERCH_ODDS, once a device a month, at most MF_MERCH_MAX_MONTH a month
  let claim = '';
  if (process.env.MF_MERCH_ON === '1' && dev) {
    const odds = Math.max(2, Number(process.env.MF_MERCH_ODDS) || 50), max = Number(process.env.MF_MERCH_MAX_MONTH) || 20, mk = 'm/' + month(), cnt = Number(await s.get(mk)) || 0, last = Number(await s.get('d/' + dev)) || 0;
    if (cnt < max && Date.now() - last > 30 * DAY && crypto.getRandomValues(new Uint32Array(1))[0] % odds === 0) { claim = rand(); ev.lucky = true; await s.set(mk, String(cnt + 1)); await s.set('d/' + dev, String(Date.now())); await s.setJSON('c/' + claim, { token: claim, at: Date.now(), word, src: ev.src, who: ev.who, claimed: false }); }
  }
  await s.setJSON('e/' + ev.at + '-' + rand().slice(0, 6), ev);
  if (process.env.MF_FAV_EMAIL !== '0' || ev.lucky) { try { await sendMail({ to: TO(), subject: (ev.lucky ? '🎁 LUCKY favorite: ' : '❤ Favorite: ') + word + ' · ' + ev.src, tag: 'favorite',
    html: `<p><b>${esc(word)}</b>${ev.ref ? ' (' + esc(ev.ref) + ')' : ''} was added to a favorite basket.</p><p>Where: <b>${esc(ev.src)}</b><br>Who: ${esc(ev.who)}<br>Language: ${esc(ev.lang || 'en')}</p>${ev.lucky ? '<p><b>This one was picked for the surprise merch.</b> They are asked for a shipping address; you will get a SHIP FREE MERCH email if they answer.</p>' : ''}`, text: `${word} added from ${ev.src} by ${ev.who}` + (ev.lucky ? ' (lucky: surprise merch)' : '') }); } catch (e) { /* never blocks */ } }
  return Response.json({ ok: true, ...(claim ? { lucky: true, claim } : {}) }, { headers: NS });
};
export const config = { path: ['/api/favorite', '/api/favorite/claim'] };
