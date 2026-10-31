// MannaFish Hubs (Ken, 31 Oct). Ken calls them Fisheries or Hatcheries; on the site they are "MannaFish Hubs".
// 1. A Hub is a place that gives MannaFish away free (a coffee shop, a store, a church). People put fish in their prayer basket and pray
//    for them at a Hub: "when other users add and it collectively reaches 100, that MannaFish Station gets a notice, or I get an email ...
//    the collective shows the need, I fill the pond". When a fish arrives, everyone who prayed for it there is emailed to come and get it.
//    Nothing is mailed to anyone's home and nothing is sold.
// 2. Before a place is a Hub it is on the request list (Ken, 31 Oct: "a list of places that may want to host MannaFish, including Churches
//    ... I would like to request this location as a MannaFish Hub, they can choose more than one ... one per user, must be signed in ...
//    once it has a certain number, which I will decide later, it qualifies to become a Hub ... like Amazon Returns"). One request per
//    account per place. At the number (cfg.voteGoal) Ken is emailed once. It only becomes a Hub when Ken has an agreement with the host.
// 3. "Sponsorships will bypass this rule": a church or business can sponsor a place (on the list or not); Ken is emailed and makes the
//    connection. Ken can make any place a Hub at any time, whatever its count.
// Statuses: proposed (on the request list) · talking (Ken is talking with the host) · active (a Hub) · closed.
//   GET  /api/hubs                         -> {stations:[active Hubs + "wherever it's needed most"], proposed:[...], goal}
//   GET  /api/hubs/mine          (signed in) -> {votes:[ids]}
//   POST /api/hubs/vote {ids, on} (signed in) -> {votes:{id:n}, mine:[ids]}
//   POST /api/hubs/pray {station, items:[{fish, word, l}], email, name} -> {ok, total, threshold, items:[{fish,l,n,already?}]}
//   POST /api/hubs/sponsor {ids, place, name, org, email, phone, what, note} -> {ok}
//   POST /api/hubs/suggest {name, address, why} (signed in) -> {ok}
//   GET  /api/hubs/admin?k=  ·  POST /api/hubs/admin {k, action, ...} (k = MF_ADMIN_KEY, or PROOF_KEY)
//        create {name,kind,address,city,where,note,owner,url,threshold,status} · edit {id,...} · status {id,status} · remove {id}
//        stock {id, fish, word, l, kind, qty, status:'coming'|'in'} · unstock {id, i} · cfg {voteGoal}
//        sponsorStatus {sid, status:'new'|'talking'|'done'} · suggestion {sid, do:'add'|'dismiss'}
// /api/stations/* is the same (the first name).
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const NS = { 'cache-control': 'no-store' };
const bad = (msg, status, extra) => Response.json({ error: msg, ...(extra || {}) }, { status, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_HUBS_TO || process.env.MF_STATIONS_TO || process.env.MF_POND_TO || process.env.MF_STORIES_TO || process.env.MF_PROOF_TO || FROM.email;
const SB_URL = process.env.SUPABASE_URL || 'https://oblttpxqjvaglwfdszdg.supabase.co';
const SB_PUB = 'sb_publishable_Nl4EDkBHlrnEqFVcL_oGvQ_J-X-t3Wc';
const db = () => getStore({ name: 'mannafish-stations', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rid = () => Date.now().toString(36) + Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, '0')).join('');
async function hash(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24); }
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, FISH = /^[A-Z]:[A-Za-z0-9_-]{1,40}$/;
const MERCH = ['decal', 'card', 'shirt', 'keychain', 'mug', 'cap'];
const PLACES = ['coffee', 'store', 'church', 'books', 'food', 'other'];
const STATUS = ['proposed', 'talking', 'active', 'closed'];
const SITE = 'https://manna-fish.com';
// "wherever it's needed most": always there, filled where Ken sees the need
const ANY = { id: 'anywhere', name: 'Wherever it’s needed most', city: '', where: 'MannaFish places these fish where they are needed.', note: '', threshold: 100, status: 'active', stock: [] };

// the first request list, Wilmington NC (Ken, 31 Oct: "lets start with Wilmington NC ... add Drift Coffee, Social Cafe, Mailbox Express,
// Barnes and Noble, Port City Java ... including Churches"). Addresses from public listings, to confirm with each place; map points are
// close, and are looked up again from the address the first time the admin page opens.
const W = 'Wilmington, NC';
const SEED = [
  ['drift-downtown', 'Drift Coffee & Kitchen (downtown)', 'coffee', '221 N Front St #102, Wilmington, NC 28401', 34.2391, -77.9489],
  ['social-coffee', 'Social Coffee & Supply Co.', 'coffee', '5317 Wrightsville Ave, Wilmington, NC 28403', 34.2187, -77.8566],
  ['mailbox-express', 'Mailbox Express', 'store', '609-A Piner Rd, Wilmington, NC 28409', 34.1508, -77.8958],
  ['bn-mayfaire', 'Barnes & Noble (Mayfaire)', 'books', '890 Inspiration Dr, Wilmington, NC 28405', 34.2402, -77.8282],
  ['pcj-racine', 'Port City Java (Racine Dr)', 'coffee', '132 Racine Dr, Wilmington, NC 28403', 34.2240, -77.8722],
  ['pcj-market', 'Port City Java (Market St)', 'coffee', '8211 Market St, Wilmington, NC 28411', 34.2957, -77.8006],
  ['pcj-front', 'Port City Java (Front St)', 'coffee', '21 N Front St, Wilmington, NC 28401', 34.2359, -77.9487],
  ['port-city-church', 'Port City Community Church', 'church', '250 Vision Dr, Wilmington, NC 28403', 34.2563, -77.8679],
  ['first-baptist', 'First Baptist Church', 'church', '411 Market St, Wilmington, NC 28401', 34.2350, -77.9432],
  ['church-servant', 'Church of the Servant', 'church', '4925 Oriole Dr, Wilmington, NC 28403', 34.1956, -77.8857],
  ['new-life', 'New Life Church', 'church', '4490 Gordon Rd, Wilmington, NC 28405', 34.2707, -77.8569],
  ['myrtle-grove-pres', 'Myrtle Grove Presbyterian Church', 'church', '800 Piner Rd, Wilmington, NC 28409', 34.1496, -77.8847],
].map(([id, name, kind, address, lat, lng]) => ({ id, name, kind, address, city: W, lat, lng, approx: true, status: 'proposed', where: '', note: '', owner: '', url: '', threshold: 100, stock: [], seed: true }));

async function cfg(s) {
  const c = (await s.get('cfg', { type: 'json' })) || {};
  if (!c.seeded) { for (const x of SEED) if (!(await s.get('s/' + x.id))) await s.setJSON('s/' + x.id, { ...x, created: new Date().toISOString() }); c.seeded = 1; c.voteGoal = c.voteGoal || 50; await s.setJSON('cfg', c); }
  return { voteGoal: c.voteGoal || 50, ...c };
}
async function limited(ip, what, max) {
  try { const s = getStore('mannafish-limits'), k = `${what}/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= max) return true; await s.set(k, String(n + 1)); } catch (e) { /* a counter failure never blocks anyone */ }
  return false;
}
async function userOf(req) {   // the MannaFish account (Supabase), when signed in
  const a = req.headers.get('authorization') || ''; if (!/^Bearer \S+/.test(a)) return null;
  try { const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_PUB, authorization: a } }); if (!r.ok) return null; const u = await r.json(); return u && u.id ? u : null; } catch (e) { return null; }
}
// a street address to a map point (the US Census geocoder: free, no key); quietly nothing when it can't
async function geocode(address) {
  try { const r = await fetch('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=' + encodeURIComponent(address), { signal: AbortSignal.timeout(6000) });
    const m = r.ok && (await r.json()).result.addressMatches[0]; return m ? { lat: +m.coordinates.y.toFixed(5), lng: +m.coordinates.x.toFixed(5) } : null; } catch (e) { return null; }
}
const statusOf = (st) => st.status || (st.open === false ? 'closed' : 'active');   // Stations made before statuses were open/closed Hubs
async function station(s, id) { if (id === 'anywhere') return Object.assign({}, ANY, (await s.get('s/anywhere', { type: 'json' })) || {}, { status: 'active' });
  const st = await s.get('s/' + id, { type: 'json' }); if (st) st.status = statusOf(st); return st; }
async function all(s) { const { blobs } = await s.list({ prefix: 's/' }), out = []; for (const b of blobs) { const st = await s.get(b.key, { type: 'json' }); if (st && st.id !== 'anywhere') { st.status = statusOf(st); out.push(st); } } return out; }
async function counts(s, id) { return (await s.get('c/' + id, { type: 'json' })) || { total: 0, fish: {}, words: {}, notified: false }; }
async function votes(s, id) { return (await s.get('vc/' + id, { type: 'json' })) || { n: 0, qualified: false }; }
const fk = (fish, l) => fish + '|' + (l || 'en');
function top(c, n) { return Object.entries(c.fish || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ fish: k.split('|')[0], l: k.split('|')[1], word: (c.words || {})[k.split('|')[0]] || k.split('|')[0], n: v })); }
const place = (st) => ({ id: st.id, name: st.name, kind: st.kind || 'other', address: st.address || '', city: st.city || '', lat: st.lat ?? null, lng: st.lng ?? null, url: st.url || '', sponsored: st.sponsored || '' });
const pub = (st, c) => ({ ...place(st), where: st.where || '', note: st.note || '', threshold: st.threshold || 100,
  total: c.total || 0, top: top(c, 6), fish: c.fish || {}, stock: (st.stock || []).map((x) => ({ fish: x.fish, word: x.word, l: x.l, kind: x.kind, qty: x.qty, status: x.status })) });

async function mail(to, subject, lines, name) {
  if (!hasMail() || !to) return;
  const html = '<div style="font:16px/1.5 Georgia,serif;color:#111">' + lines.filter(Boolean).map((l) => '<p>' + l + '</p>').join('') + '</div>';
  try { await sendMail({ to, name, subject, html, text: lines.filter(Boolean).map((l) => l.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')).join('\n\n'), tag: 'hubs' }); } catch (e) { /* kept anyway */ }
}
async function body(req) { if (!okOrigin(req.headers.get('origin'))) throw bad('Not allowed', 403); try { return await req.json(); } catch (e) { throw bad('Bad request', 400); } }

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/(hubs|stations)\/?/, '').replace(/\/$/, ''), s = db(), ip = context && context.ip;
  try {
  // ── the list: the Hubs (with their ponds and prayers), then the places people are asking for, with how many have asked
  if (req.method === 'GET' && !sub) {
    const C = await cfg(s), L = await all(s), hubs = [], proposed = [];
    for (const st of L) {
      if (st.status === 'active') hubs.push(pub(st, await counts(s, st.id)));
      else if (st.status === 'proposed' || st.status === 'talking') { const v = await votes(s, st.id); proposed.push({ ...place(st), status: st.status, votes: v.n, qualified: v.n >= C.voteGoal }); }
    }
    hubs.sort((a, b) => a.name.localeCompare(b.name)); hubs.push(pub(await station(s, 'anywhere'), await counts(s, 'anywhere')));
    proposed.sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
    return Response.json({ stations: hubs, proposed, goal: C.voteGoal }, { headers: NS });
  }
  // ── which places this account has asked for
  if (sub === 'mine') {
    const u = await userOf(req); if (!u) return bad('Sign in', 401);
    return Response.json({ votes: ((await s.get('u/' + u.id, { type: 'json' })) || { votes: [] }).votes }, { headers: NS });
  }
  // ── "I would like to request these locations as MannaFish Hubs": one per account per place
  if (sub === 'vote' && req.method === 'POST') {
    const b = await body(req), u = await userOf(req); if (!u) return bad('Sign in', 401);
    if (await limited(ip, 'hubvote', 120)) return bad('Please wait a little', 429);
    const C = await cfg(s), on = b.on !== false, ids = (Array.isArray(b.ids) ? b.ids : [b.id]).slice(0, 40).map((x) => clean(x, 40)).filter(Boolean);
    const me = (await s.get('u/' + u.id, { type: 'json' })) || { votes: [] }, out = {};
    for (const id of ids) {
      const st = await station(s, id); if (!st || !['proposed', 'talking'].includes(st.status)) continue;
      const vk = `v/${id}/${u.id}`, had = !!(await s.get(vk)), v = await votes(s, id);
      if (on && !had) { await s.setJSON(vk, { email: u.email || '', at: new Date().toISOString() }); v.n++; me.votes = [...new Set([...me.votes, id])]; }
      else if (!on && had) { await s.delete(vk); v.n = Math.max(0, v.n - 1); me.votes = me.votes.filter((x) => x !== id); }
      if (v.n >= C.voteGoal && !v.qualified) {   // the number is reached: Ken hears once
        v.qualified = true;
        await mail(TO(), `${st.name} qualifies to become a MannaFish Hub`, [`<b>${esc(st.name)}</b> (${esc(st.address || st.city || '')}) has <b>${v.n}</b> requests to become a MannaFish Hub. The number is ${C.voteGoal}.`,
          'It is ready for you to talk with the host. When you have an agreement, make it a Hub on the admin page and fill its pond.', `<a href="${SITE}/hubs/admin/">Open the Hubs page</a>`]);
      }
      await s.setJSON('vc/' + id, v); out[id] = v.n;
    }
    await s.setJSON('u/' + u.id, me);
    return Response.json({ ok: true, votes: out, mine: me.votes, goal: C.voteGoal }, { headers: NS });
  }
  // ── a church, business or person who wants to sponsor a Hub: Ken makes the connection
  if (sub === 'sponsor' && req.method === 'POST') {
    const b = await body(req); if (b.hp) return Response.json({ ok: true });
    const email = clean(b.email, 120).toLowerCase(); if (!EMAIL.test(email)) return bad('Email', 400, { field: 'email' });
    if (!clean(b.name, 80)) return bad('Name', 400, { field: 'name' });
    if (await limited(ip, 'hubsponsor', 10)) return bad('Please wait a little', 429);
    const ids = (Array.isArray(b.ids) ? b.ids : []).slice(0, 40).map((x) => clean(x, 40)), names = [];
    for (const id of ids) { const st = await station(s, id); if (st) names.push(st.name); }
    const r = { id: rid(), ids, places: names, place: clean(b.place, 200), name: clean(b.name, 80), org: clean(b.org, 120), email, phone: clean(b.phone, 40),
      what: (Array.isArray(b.what) ? b.what : []).filter((x) => MERCH.includes(x)), note: clean(b.note, 1000), anonymous: !!b.anonymous, status: 'new', at: new Date().toISOString() };
    if (!r.ids.length && !r.place) return bad('Which place?', 400, { field: 'place' });
    await s.setJSON('sp/' + r.id, r);
    await mail(TO(), `Hub sponsor: ${r.org || r.name}`, [`<b>${esc(r.name)}</b>${r.org ? ' (' + esc(r.org) + ')' : ''} would like to sponsor a MannaFish Hub${r.anonymous ? ', <b>anonymously</b>' : ''}.`,
      'For: ' + esc([...names, r.place].filter(Boolean).join(' · ')), r.what.length ? 'What: ' + esc(r.what.join(', ')) : '',
      `Email: ${esc(email)}${r.phone ? ' · Phone: ' + esc(r.phone) : ''}`, r.note ? '“' + esc(r.note) + '”' : '', `<a href="${SITE}/hubs/admin/">Open the Hubs page</a>`]);
    await mail(email, 'Thank you for sponsoring a MannaFish Hub', [`Thank you${r.name ? ', ' + esc(r.name) : ''}. We received your request to sponsor ${esc([...names, r.place].filter(Boolean).join(', '))}.`,
      'We will reach out to the host, set up the relationship, and write back to you. Every fish is free to the person who receives it: never sold, never resold.', '<i>Freely ye have received, freely give</i> (Matthew 10:8).'], r.name);
    return Response.json({ ok: true }, { headers: NS });
  }
  // ── a place someone would like on the list
  if (sub === 'suggest' && req.method === 'POST') {
    const b = await body(req), u = await userOf(req); if (!u) return bad('Sign in', 401);
    if (!clean(b.name, 80)) return bad('Name', 400, { field: 'name' });
    if (await limited(ip, 'hubsuggest', 10)) return bad('Please wait a little', 429);
    const r = { id: rid(), name: clean(b.name, 80), kind: PLACES.includes(b.kind) ? b.kind : 'other', address: clean(b.address, 160), why: clean(b.why, 600), by: u.email || '', status: 'new', at: new Date().toISOString() };
    await s.setJSON('sg/' + r.id, r);
    await mail(TO(), `A place for a MannaFish Hub: ${r.name}`, [`${esc(r.by)} suggests <b>${esc(r.name)}</b>${r.address ? ', ' + esc(r.address) : ''}.`, r.why ? '“' + esc(r.why) + '”' : '', `<a href="${SITE}/hubs/admin/">Add it to the list</a>`]);
    return Response.json({ ok: true }, { headers: NS });
  }
  // ── a prayer for a fish at a Hub
  if (sub === 'pray' && req.method === 'POST') {
    const b = await body(req); if (b.hp) return Response.json({ ok: true });
    const email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80);
    if (!EMAIL.test(email)) return bad('Email', 400, { field: 'email' });
    const list = (Array.isArray(b.items) ? b.items : [b]).slice(0, 24).map((x) => ({ fish: clean(x && x.fish, 40), word: clean(x && x.word, 40), l: clean(x && x.l, 5) || 'en' })).filter((x) => FISH.test(x.fish));
    if (!list.length) return bad('Which fish?', 400);
    const st = await station(s, clean(b.station, 40)); if (!st || st.status !== 'active') return bad('That Hub is not open', 404);
    if (await limited(ip, 'pray', 60)) return bad('Please wait a little', 429);
    const c = await counts(s, st.id), eh = await hash(email), out = []; c.words = c.words || {};
    for (const x of list) {
      const k = fk(x.fish, x.l), pk = `p/${st.id}/${k}/${eh}`;
      if (await s.get(pk)) { out.push({ fish: x.fish, l: x.l, n: c.fish[k] || 0, already: true }); continue; }
      await s.setJSON(pk, { email, name, word: x.word, at: new Date().toISOString() });
      c.fish[k] = (c.fish[k] || 0) + 1; c.total = (c.total || 0) + 1; if (x.word) c.words[x.fish] = x.word;
      out.push({ fish: x.fish, l: x.l, n: c.fish[k] });
    }
    const th = st.threshold || 100, hit = c.total >= th && !c.notified; if (hit) c.notified = true;
    await s.setJSON('c/' + st.id, c);
    if (hit) {   // the need is shown: Ken (and the host) hear, with the fish most prayed for
      const L = top(c, 10).map((x) => `${esc(x.word)}${x.l !== 'en' ? ' (' + esc(x.l) + ')' : ''}: <b>${x.n}</b>`).join('<br>');
      const lines = [`<b>${esc(st.name)}</b>${st.city ? ' (' + esc(st.city) + ')' : ''} has reached <b>${c.total}</b> prayers for MannaFish (its number is ${th}).`,
        L, 'Ready to fill its pond: make a run of the fish most prayed for, once it is sponsored, and send it there.', `<a href="${SITE}/hubs/admin/">Open the Hubs page</a>`];
      await mail(TO(), `MannaFish Hub ready to fill: ${st.name}`, lines);
      if (st.owner) await mail(st.owner, `${c.total} prayers for MannaFish at ${st.name}`, [lines[0], L, 'We will let you know when fish are on the way to you. Thank you for being a MannaFish Hub.']);
    }
    return Response.json({ ok: true, total: c.total, threshold: th, items: out, n: out[0].n, already: out.every((x) => x.already) || undefined }, { headers: NS });
  }
  // ── Ken's side
  if (sub === 'admin') {
    const b = req.method === 'POST' ? await body(req) : {};
    if (!KEY() || (req.method === 'GET' ? url.searchParams.get('k') : b.k) !== KEY()) return bad('Not allowed', 403);
    if (req.method === 'GET') {
      const C = await cfg(s), L = await all(s), out = []; let looked = 0;
      for (const st of L) {
        if (st.approx && !st.looked && st.address && looked < 6) { looked++; const g = await geocode(st.address); st.looked = 1; if (g) { st.lat = g.lat; st.lng = g.lng; st.approx = false; } await s.setJSON('s/' + st.id, st); }
        const c = await counts(s, st.id), v = await votes(s, st.id);
        out.push({ ...pub(st, c), status: st.status, owner: st.owner || '', notified: !!c.notified, top: top(c, 50), votes: v.n, qualified: v.n >= C.voteGoal, approx: !!st.approx });
      }
      const any = await station(s, 'anywhere'), ca = await counts(s, 'anywhere');
      out.push({ ...pub(any, ca), status: 'active', owner: any.owner || '', notified: !!ca.notified, top: top(ca, 50), votes: 0 });
      const rows = async (p) => { const { blobs } = await s.list({ prefix: p }), r = []; for (const x of blobs) { const v = await s.get(x.key, { type: 'json' }); if (v) r.push(v); } return r.sort((a, b) => (b.at || '').localeCompare(a.at || '')); };
      return Response.json({ stations: out, sponsors: await rows('sp/'), suggestions: (await rows('sg/')).filter((x) => x.status === 'new'), cfg: { voteGoal: C.voteGoal } }, { headers: NS });
    }
    const id = clean(b.id, 40), a = b.action;
    const fields = async (st) => {
      for (const f of ['name', 'city', 'where', 'note', 'owner', 'address', 'url', 'sponsored']) if (b[f] != null) st[f] = clean(b[f], f === 'note' ? 300 : f === 'where' || f === 'address' ? 200 : 120);
      if (st.owner) st.owner = st.owner.toLowerCase();
      if (b.kind && PLACES.includes(b.kind)) st.kind = b.kind;
      if (b.threshold) st.threshold = Math.max(3, Math.min(5000, Number(b.threshold) || 100));
      if (b.status && STATUS.includes(b.status)) st.status = b.status;
      if (b.lat != null && b.lng != null && b.lat !== '' && isFinite(b.lat) && isFinite(b.lng)) { st.lat = +b.lat; st.lng = +b.lng; st.approx = false; }
      else if (b.address != null && st.address && st.id !== 'anywhere') { const g = await geocode(st.address); if (g) { st.lat = g.lat; st.lng = g.lng; st.approx = false; } }
    };
    if (a === 'cfg') { const c = (await s.get('cfg', { type: 'json' })) || {}; c.voteGoal = Math.max(1, Math.min(100000, Number(b.voteGoal) || 50)); await s.setJSON('cfg', c); return Response.json({ ok: true }); }
    if (a === 'sponsorStatus') { const r = await s.get('sp/' + clean(b.sid, 40), { type: 'json' }); if (!r) return bad('Not found', 404); r.status = ['new', 'talking', 'done'].includes(b.status) ? b.status : r.status; await s.setJSON('sp/' + r.id, r); return Response.json({ ok: true }); }
    if (a === 'suggestion') { const r = await s.get('sg/' + clean(b.sid, 40), { type: 'json' }); if (!r) return bad('Not found', 404);
      r.status = b.do === 'add' ? 'added' : 'dismissed'; await s.setJSON('sg/' + r.id, r);
      if (b.do === 'add') { const st = { id: rid(), name: r.name, kind: r.kind, address: r.address, city: clean(b.city, 80) || W, status: 'proposed', where: '', note: '', owner: '', url: '', threshold: 100, stock: [], created: new Date().toISOString() };
        const g = st.address ? await geocode(st.address) : null; if (g) Object.assign(st, g); await s.setJSON('s/' + st.id, st); return Response.json({ ok: true, id: st.id }); }
      return Response.json({ ok: true }); }
    if (a === 'create') {
      if (!clean(b.name, 80)) return bad('Name', 400);
      const st = { id: rid(), name: '', kind: 'other', city: '', where: '', note: '', owner: '', address: '', url: '', threshold: 100, status: 'proposed', stock: [], created: new Date().toISOString() };
      await fields(st); await s.setJSON('s/' + st.id, st); return Response.json({ ok: true, id: st.id });
    }
    const st = await station(s, id); if (!st) return bad('No such place', 404);
    if (a === 'edit') await fields(st);
    else if (a === 'status') { if (!STATUS.includes(b.status) || id === 'anywhere') return bad('Which status?', 400); st.status = b.status; }
    else if (a === 'close' || a === 'open') st.status = a === 'open' ? 'active' : 'closed';
    else if (a === 'remove') { if (st.status === 'active') return bad('Close the Hub first', 400); await s.delete('s/' + id); return Response.json({ ok: true }); }
    else if (a === 'unstock') { st.stock = (st.stock || []).filter((x, i) => i !== Number(b.i)); }
    else if (a === 'stock') {
      const fish = clean(b.fish, 40), l = clean(b.l, 5) || 'en', kind = MERCH.includes(b.kind) ? b.kind : 'decal', status = b.status === 'in' ? 'in' : 'coming';
      if (!FISH.test(fish)) return bad('Which fish?', 400);
      st.stock = (st.stock || []).filter((x) => !(x.fish === fish && x.l === l && x.kind === kind));
      st.stock.push({ fish, word: clean(b.word, 40) || fish.slice(2), l, kind, qty: Math.max(0, Number(b.qty) || 0), status, at: new Date().toISOString() });
      if (status === 'in') {   // it's here: everyone who prayed for this fish at this Hub hears, and those prayers are answered (the count starts again)
        const c = await counts(s, st.id), key = fk(fish, l), { blobs } = await s.list({ prefix: `p/${st.id}/${key}/` }); let told = 0;
        const word = clean(b.word, 40) || (c.words || {})[fish] || fish.slice(2), what = kind === 'decal' ? 'MannaFish decals' : kind === 'keychain' ? 'MannaFish key chains' : 'MannaFish ' + kind + 's';
        for (const x of blobs) { const p = await s.get(x.key, { type: 'json' }); await s.delete(x.key);
          if (p && p.email) { told++; const hi = p.name ? esc(p.name) + ', y' : 'Y';
            if (st.id === 'anywhere') await mail(p.email, `Your prayer for ${word} was answered`, [`${hi}ou prayed for the <b>${esc(word)}</b> fish to go wherever it is needed most. It has been multiplied: ${esc(what)} are on their way to people who need them.`,
              'Thank you for praying. <i>Freely ye have received, freely give</i> (Matthew 10:8).', `<a href="${SITE}/hubs/">Find a MannaFish Hub near you</a>`], p.name);
            else await mail(p.email, `${word} is at ${st.name}`, [`${hi}ou prayed for the <b>${esc(word)}</b> fish at <b>${esc(st.name)}</b>. It is there now: ${esc(what)}, free.`,
              [st.address, st.where].filter(Boolean).map(esc).join(' · '), 'Stop by and take two: one to keep, and one to give away. <i>Freely ye have received, freely give</i> (Matthew 10:8).', `<a href="${SITE}/hubs/">See every MannaFish Hub</a>`], p.name); } }
        c.total = Math.max(0, (c.total || 0) - (c.fish[key] || 0)); delete c.fish[key]; if (c.total < (st.threshold || 100)) c.notified = false;
        await s.setJSON('c/' + st.id, c); await s.setJSON('s/' + st.id, st); return Response.json({ ok: true, told });
      }
    } else return bad('Which action?', 400);
    if (st.id === 'anywhere') { delete st.status; }
    await s.setJSON('s/' + st.id, st); return Response.json({ ok: true });
  }
  return bad('Not found', 404);
  } catch (e) { if (e instanceof Response) return e; throw e; }
};

export const config = { path: ['/api/hubs', '/api/hubs/*', '/api/stations', '/api/stations/*'] };
