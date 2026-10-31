// MannaFish Stations (Ken, 31 Oct): "when someone likes a word and adds it to their basket ... they add it to their prayer basket for
// that word to be added to a local fishery, or MannaFish Station, and when other users add and it collectively reaches 100, that
// MannaFish Station gets a notice, or I get an email ... the collective shows the need, I fill the pond, and the user can go to that
// location and get a free decal, or shirt or key chain, depending on what that store is supplying from what is sponsored."
// No single decals are ever mailed to anyone: a Station's pond is filled with one batch, sent straight from the printer.
// Names: a MannaFish Station is the place; its Pond is what it has to give; the Hatchery is where fish are made (Ken and the printer).
// One prayer per person per fish per Station (by email). At the Station's number (100 unless set) of prayers, all fish together,
// Ken (and the Station) get an email with which fish were prayed for. When a fish arrives at a Station, everyone who prayed for
// it there gets an email to come and get theirs.
//   GET  /api/stations                       -> {stations:[{id,name,city,where,note,threshold,total,top,stock}]}
//   POST /api/stations/pray {station, items:[{fish, word, l}], email, name}  -> {ok, total, threshold, items:[{fish,l,n,already?}]}
//        (one fish on its own, {station, fish, word, l, email, name}, works too)
//   GET  /api/stations/admin?k=              -> every Station with its counts (k = MF_ADMIN_KEY, or PROOF_KEY)
//   POST /api/stations/admin {k, action, ...} -> create {name,city,where,note,owner,threshold} · edit {id,...} · close {id} · open {id}
//        stock {id, fish, word, l, kind, qty, status:'coming'|'in'} (status 'in' emails everyone who prayed for that fish there)
//        unstock {id, i}
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, extra) => Response.json({ error: msg, ...(extra || {}) }, { status, headers: { 'cache-control': 'no-store' } });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_STATIONS_TO || process.env.MF_POND_TO || process.env.MF_STORIES_TO || process.env.MF_PROOF_TO || FROM.email;
const db = () => getStore({ name: 'mannafish-stations', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rid = () => Date.now().toString(36) + Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, '0')).join('');
async function hash(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24); }
const KINDS = ['decal', 'card', 'shirt', 'keychain', 'mug', 'cap'];
const SITE = 'https://manna-fish.com';
// "wherever it's needed most": always there, filled where Ken sees the need
const ANY = { id: 'anywhere', name: 'Wherever it’s needed most', city: '', where: 'MannaFish places these fish where they are needed.', note: '', threshold: 100, open: true, stock: [] };

async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `pray/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= 60) return true; await s.set(k, String(n + 1)); } catch (e) { /* never block a prayer because the counter failed */ }
  return false;
}
async function station(s, id) { return id === 'anywhere' ? Object.assign({}, ANY, (await s.get('s/anywhere', { type: 'json' })) || {}) : s.get('s/' + id, { type: 'json' }); }
async function counts(s, id) { return (await s.get('c/' + id, { type: 'json' })) || { total: 0, fish: {}, words: {}, notified: false }; }
const fk = (fish, l) => fish + '|' + (l || 'en');
function top(c, n) { return Object.entries(c.fish || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ fish: k.split('|')[0], l: k.split('|')[1], word: (c.words || {})[k.split('|')[0]] || k.split('|')[0], n: v })); }
const pub = (st, c) => ({ id: st.id, name: st.name, city: st.city || '', where: st.where || '', note: st.note || '', threshold: st.threshold || 100,
  total: c.total || 0, top: top(c, 6), fish: c.fish || {}, stock: (st.stock || []).map((x) => ({ fish: x.fish, word: x.word, l: x.l, kind: x.kind, qty: x.qty, status: x.status })) });

async function mail(to, subject, lines, name) {
  if (!hasMail() || !to) return;
  const html = '<div style="font:16px/1.5 Georgia,serif;color:#111">' + lines.map((l) => '<p>' + l + '</p>').join('') + '</div>';
  try { await sendMail({ to, name, subject, html, text: lines.map((l) => l.replace(/<[^>]+>/g, '')).join('\n\n'), tag: 'stations' }); } catch (e) { /* the count is kept anyway */ }
}

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/stations\/?/, ''), s = db();
  // ── the list: every open Station, with how many have prayed and what its pond holds
  if (req.method === 'GET' && !sub) {
    const { blobs } = await s.list({ prefix: 's/' }), out = [];
    for (const b of blobs) { const st = await s.get(b.key, { type: 'json' }); if (st && st.open !== false && st.id !== 'anywhere') out.push(pub(st, await counts(s, st.id))); }
    out.sort((a, b) => a.name.localeCompare(b.name)); out.push(pub(await station(s, 'anywhere'), await counts(s, 'anywhere')));
    return Response.json({ stations: out }, { headers: { 'cache-control': 'no-store' } });
  }
  // ── a prayer for a fish at a Station
  if (sub === 'pray') {
    if (req.method !== 'POST') return bad('POST only', 405);
    if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (b.hp) return Response.json({ ok: true });
    const email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 80);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Email', 400, { field: 'email' });
    const list = (Array.isArray(b.items) ? b.items : [b]).slice(0, 24).map((x) => ({ fish: clean(x && x.fish, 40), word: clean(x && x.word, 40), l: clean(x && x.l, 5) || 'en' }))
      .filter((x) => /^[A-Z]:[A-Za-z0-9_-]{1,40}$/.test(x.fish));
    if (!list.length) return bad('Which fish?', 400);
    const st = await station(s, clean(b.station, 40)); if (!st || st.open === false) return bad('That Station is not open', 404);
    if (await limited(context && context.ip)) return bad('Please wait a little', 429);
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
    if (hit) {   // the need is shown: Ken (and the Station) hear about it, with the fish most prayed for
      const list = top(c, 10).map((x) => `${esc(x.word)}${x.l !== 'en' ? ' (' + esc(x.l) + ')' : ''}: <b>${x.n}</b>`).join('<br>');
      const lines = [`<b>${esc(st.name)}</b>${st.city ? ' (' + esc(st.city) + ')' : ''} has reached <b>${c.total}</b> prayers for MannaFish (its number is ${th}).`,
        list, 'Ready to fill its pond: make a run of the fish most prayed for, once it is sponsored, and send it there.',
        `<a href="${SITE}/stations/admin/">Open the Stations page</a>`];
      await mail(TO(), `MannaFish Station ready to fill: ${st.name}`, lines);
      if (st.owner) await mail(st.owner, `${c.total} prayers for MannaFish at ${st.name}`, [lines[0], list, 'We will let you know when fish are on the way to you. Thank you for being a MannaFish Station.']);
    }
    return Response.json({ ok: true, total: c.total, threshold: th, items: out, n: out[0].n, already: out.every((x) => x.already) || undefined });
  }
  // ── Ken's side
  if (sub === 'admin') {
    const k = req.method === 'GET' ? url.searchParams.get('k') : null;
    let b = {}; if (req.method === 'POST') { if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403); try { b = await req.json(); } catch (e) { return bad('Bad request', 400); } }
    if (!KEY() || (k || b.k) !== KEY()) return bad('Not allowed', 403);
    if (req.method === 'GET') {
      const { blobs } = await s.list({ prefix: 's/' }), out = [], ids = new Set();
      for (const x of blobs) { const st = await s.get(x.key, { type: 'json' }); if (!st) continue; ids.add(st.id); const c = await counts(s, st.id); out.push(Object.assign(pub(st, c), { open: st.open !== false, owner: st.owner || '', notified: !!c.notified, top: top(c, 50) })); }
      if (!ids.has('anywhere')) { const c = await counts(s, 'anywhere'); out.push(Object.assign(pub(ANY, c), { open: true, owner: '', notified: !!c.notified, top: top(c, 50) })); }
      return Response.json({ stations: out }, { headers: { 'cache-control': 'no-store' } });
    }
    const id = clean(b.id, 40), a = b.action;
    if (a === 'create') {
      if (!clean(b.name, 80)) return bad('Name', 400);
      const st = { id: rid(), name: clean(b.name, 80), city: clean(b.city, 80), where: clean(b.where, 200), note: clean(b.note, 300), owner: clean(b.owner, 120).toLowerCase(),
        threshold: Math.max(10, Math.min(5000, Number(b.threshold) || 100)), open: true, stock: [], created: new Date().toISOString() };
      await s.setJSON('s/' + st.id, st); return Response.json({ ok: true, id: st.id });
    }
    const st = await station(s, id); if (!st) return bad('No such Station', 404);
    if (a === 'edit') { for (const f of ['name', 'city', 'where', 'note', 'owner']) if (b[f] != null) st[f] = clean(b[f], f === 'note' ? 300 : f === 'where' ? 200 : 120);
      if (b.threshold) st.threshold = Math.max(10, Math.min(5000, Number(b.threshold) || 100)); }
    else if (a === 'close' || a === 'open') st.open = a === 'open';
    else if (a === 'unstock') { st.stock = (st.stock || []).filter((x, i) => i !== Number(b.i)); }
    else if (a === 'stock') {
      const fish = clean(b.fish, 40), l = clean(b.l, 5) || 'en', kind = KINDS.includes(b.kind) ? b.kind : 'decal', status = b.status === 'in' ? 'in' : 'coming';
      if (!/^[A-Z]:[A-Za-z0-9_-]{1,40}$/.test(fish)) return bad('Which fish?', 400);
      st.stock = (st.stock || []).filter((x) => !(x.fish === fish && x.l === l && x.kind === kind));
      st.stock.push({ fish, word: clean(b.word, 40) || fish.slice(2), l, kind, qty: Math.max(0, Number(b.qty) || 0), status, at: new Date().toISOString() });
      if (status === 'in') {   // it's here: everyone who prayed for this fish at this Station hears, and those prayers are answered (the count starts again)
        const c = await counts(s, st.id), key = fk(fish, l), { blobs } = await s.list({ prefix: `p/${st.id}/${key}/` }); let told = 0;
        const word = clean(b.word, 40) || (c.words || {})[fish] || fish.slice(2), what = kind === 'decal' ? 'MannaFish decals' : 'MannaFish ' + kind + 's';
        for (const x of blobs) { const p = await s.get(x.key, { type: 'json' }); await s.delete(x.key);
          if (p && p.email) { told++; const hi = p.name ? esc(p.name) + ', y' : 'Y';
            if (st.id === 'anywhere') await mail(p.email, `Your prayer for ${word} was answered`, [`${hi}ou prayed for the <b>${esc(word)}</b> fish to go wherever it is needed most. It has been multiplied: ${esc(what)} are on their way to people who need them.`,
              'Thank you for praying. <i>Freely ye have received, freely give</i> (Matthew 10:8).', `<a href="${SITE}/stations/">Find a MannaFish Station near you</a>`], p.name);
            else await mail(p.email, `${word} is at ${st.name}`, [`${hi}ou prayed for the <b>${esc(word)}</b> fish at <b>${esc(st.name)}</b>. It is there now: ${esc(what)}, free.`,
              st.where ? esc(st.where) : '', 'Stop by and take two: one to keep, and one to give away. <i>Freely ye have received, freely give</i> (Matthew 10:8).', `<a href="${SITE}/stations/">See every MannaFish Station</a>`].filter(Boolean), p.name); } }
        c.total = Math.max(0, (c.total || 0) - (c.fish[key] || 0)); delete c.fish[key]; if (c.total < (st.threshold || 100)) c.notified = false;
        await s.setJSON('c/' + st.id, c); await s.setJSON('s/' + st.id, st); return Response.json({ ok: true, told });
      }
    } else return bad('Which action?', 400);
    await s.setJSON('s/' + st.id, st); return Response.json({ ok: true });
  }
  return bad('Not found', 404);
};

export const config = { path: ['/api/stations', '/api/stations/*'] };
