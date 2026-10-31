// The MannaFish fishing excursion (Ken, 12 Oct): "this fishing hole is stocked with 300 fish -- 300 free gifts ... this
// excursion is sponsored by [a local business], and it tells you how many fish are stocked in the pond. Each person can only
// get one ... as the gifts are given out, the lake is getting depleted, so it has to be restocked." Each gift is two
// MannaFish (one to keep, one to give away), so a gift takes two fish from the pond. One gift per mailing address.
//   GET  /api/pond                         -> {pond:{id,name,sponsor,url,msg,stocked,left,per}} or {pond:null}
//   POST /api/pond/claim {pond, to:{name,street,city,region,country,email}, from, word, lang, self}  -> {ok,left}
//        409 {error:'already'} this address has had its gift · 410 {error:'empty'} the pond is empty
//   GET  /api/pond/admin?k=                -> every excursion and every gift request (k = MF_ADMIN_KEY, or PROOF_KEY)
//   POST /api/pond/admin {k, action, ...}  -> create {name,sponsor,url,msg,stocked} · restock {id,add} · edit {id,...}
//        close {id} · open {id} · ship {claim} · unship {claim} · forget {claim} (lets that address ask again)
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, extra) => Response.json({ error: msg, ...(extra || {}) }, { status });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_POND_TO || process.env.MF_STORIES_TO || process.env.MF_PROOF_TO || FROM.email;
const PER = 2;                                                     // one to keep, one to give away
const db = () => getStore({ name: 'mannafish-ponds', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rid = () => Date.now().toString(36) + Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('');
const pub = (p) => p && ({ id: p.id, name: p.name, sponsor: p.sponsor, url: p.url, msg: p.msg, stocked: p.stocked, left: Math.max(0, p.stocked - p.given), per: PER });

// the same home written two ways counts once: "123 N. Main Street, Apt 4" and "123 north main st apt 4"
const ABBR = { street: 'st', avenue: 'ave', road: 'rd', drive: 'dr', boulevard: 'blvd', lane: 'ln', court: 'ct', place: 'pl', circle: 'cir', highway: 'hwy',
  parkway: 'pkwy', terrace: 'ter', apartment: 'apt', suite: 'ste', unit: 'apt', '#': 'apt', north: 'n', south: 's', east: 'e', west: 'w', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw' };
function addrKey(street, region) {
  const words = String(street || '').toLowerCase().replace(/#/g, ' # ').replace(/[^a-z0-9#\s]/g, ' ').split(/\s+/).filter(Boolean).map((w) => ABBR[w] || w);
  const zip = (String(region || '').match(/\d{5}/) || [String(region || '').toLowerCase().replace(/[^a-z0-9]/g, '')])[0];
  return words.join(' ') + '|' + zip;
}
async function hash(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join(''); }
async function ponds() { const s = db(), { blobs } = await s.list({ prefix: 'p/' }); return (await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))).filter(Boolean); }
async function active() { return (await ponds()).filter((p) => p.active).sort((a, b) => (a.at < b.at ? 1 : -1))[0] || null; }
async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `pond/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= 12) return true; await s.set(k, String(n + 1)); } catch (e) { /* never block a gift because the counter failed */ }
  return false;
}

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/pond\/?/, ''), s = db();

  // retired (Ken, 31 Oct: "I do not want to give individual decals out, and have a sorting, shipping and production nightmare"):
  // fish now go to MannaFish Stations in one batch (stations.mjs). Nothing is mailed to a home unless MF_POND_MAIL=1 is set again.
  const MAILOUT = process.env.MF_POND_MAIL === '1';
  if (sub === '' && req.method === 'GET') return Response.json({ pond: MAILOUT ? pub(await active()) : null }, { headers: { 'cache-control': 'no-store' } });
  if (sub === 'claim' && !MAILOUT) return bad('Fish now go to MannaFish Stations', 410, { stations: '/stations/' });

  if (sub === 'admin') {
    if (req.method === 'GET') {
      if (!KEY() || url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
      const { blobs } = await s.list({ prefix: 'c/' });
      const claims = (await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))).filter(Boolean).sort((a, b) => (a.at < b.at ? 1 : -1));
      return Response.json({ ponds: (await ponds()).sort((a, b) => (a.at < b.at ? 1 : -1)), claims }, { headers: { 'cache-control': 'no-store' } });
    }
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
    if (b.action === 'create') {
      const stocked = Math.max(0, Math.min(100000, Math.round(Number(b.stocked) || 0)));
      if (!clean(b.sponsor, 120) || !stocked) return bad('Sponsor and number of fish, please', 400);
      for (const p of await ponds()) if (p.active) { p.active = false; await s.setJSON('p/' + p.id, p); }   // one excursion at a time
      const p = { id: rid(), name: clean(b.name, 80) || 'MannaFish Excursion', sponsor: clean(b.sponsor, 120), url: /^https?:\/\//.test(b.url || '') ? clean(b.url, 300) : '',
        msg: clean(b.msg, 300), stocked, given: 0, active: true, at: new Date().toISOString() };
      await s.setJSON('p/' + p.id, p); return Response.json({ ok: true, pond: p });
    }
    if (['restock', 'edit', 'close', 'open'].includes(b.action)) {
      const p = await s.get('p/' + clean(b.id, 40), { type: 'json' }); if (!p) return bad('Not found', 404);
      if (b.action === 'restock') p.stocked += Math.max(0, Math.min(100000, Math.round(Number(b.add) || 0)));
      if (b.action === 'edit') { for (const f of ['name', 'sponsor', 'msg']) if (b[f] != null) p[f] = clean(b[f], f === 'msg' ? 300 : 120); if (b.url != null) p.url = /^https?:\/\//.test(b.url) ? clean(b.url, 300) : ''; }
      if (b.action === 'open') { for (const q of await ponds()) if (q.active && q.id !== p.id) { q.active = false; await s.setJSON('p/' + q.id, q); } p.active = true; }
      if (b.action === 'close') p.active = false;
      await s.setJSON('p/' + p.id, p); return Response.json({ ok: true, pond: p });
    }
    if (['ship', 'unship', 'forget'].includes(b.action)) {
      const key = 'c/' + clean(b.claim, 80), c = await s.get(key, { type: 'json' }); if (!c) return bad('Not found', 404);
      if (b.action === 'forget') { await s.delete(key); await s.delete('a/' + c.addr); return Response.json({ ok: true }); }
      c.shipped = b.action === 'ship' ? new Date().toISOString() : null; await s.setJSON(key, c); return Response.json({ ok: true, claim: c });
    }
    return bad('Unknown action', 400);
  }

  if (sub === 'claim' && req.method === 'POST') {
    if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (b.website) return Response.json({ ok: true, left: 0 });                 // a robot filled the hidden field
    const to = b.to || {}, t = { name: clean(to.name, 80), street: clean(to.street, 160), city: clean(to.city, 80), region: clean(to.region, 60),
      country: clean(to.country, 60) || 'USA', email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(to.email || '').trim()) ? clean(to.email, 160) : '' };
    if (!t.name || !t.street || !t.city || !t.region) return bad('Name and full address, please', 400);
    const p = await active(); if (!p || p.id !== clean(b.pond, 40)) return bad('empty', 410, { left: 0 });
    if (await limited(context && context.ip)) return bad('busy', 429);
    const addr = await hash(addrKey(t.street, t.region));
    if (await s.get('a/' + addr)) return bad('already', 409);
    const fresh = await s.get('p/' + p.id, { type: 'json' });
    if (!fresh || !fresh.active || fresh.stocked - fresh.given < PER) return bad('empty', 410, { left: 0 });
    fresh.given += PER; await s.setJSON('p/' + p.id, fresh);
    const c = { id: rid(), pond: p.id, sponsor: p.sponsor, at: new Date().toISOString(), to: t, from: clean(b.from, 80), self: !!b.self,
      word: clean(b.word, 40), lang: clean(b.lang, 8), addr, shipped: null };
    await s.setJSON('a/' + addr, { claim: c.id, at: c.at }); await s.setJSON('c/' + c.id, c);
    if (hasMail()) {
      try {
        const site = process.env.URL || 'https://manna-fish.com', who = c.self ? 'for themselves' : `from ${c.from || 'someone'}`;
        await sendMail({ to: TO(), name: 'MannaFish', tag: 'pond', subject: `Free gift to send: ${t.name} (${p.sponsor})`,
          text: `A free MannaFish gift (two: one to keep, one to give) ${who}.\n\n${t.name}\n${t.street}\n${t.city}, ${t.region}\n${t.country}\n${t.email}\n\nWord: ${c.word}\nExcursion: ${p.name}, sponsored by ${p.sponsor}. ${fresh.stocked - fresh.given} fish left.\n\nMark it sent: ${site}/pond/admin/`,
          html: `<p style="font:16px Arial,sans-serif">A free MannaFish gift (two: one to keep, one to give) ${esc(who)}.</p><p style="font:16px/1.5 Arial,sans-serif">${esc(t.name)}<br>${esc(t.street)}<br>${esc(t.city)}, ${esc(t.region)}<br>${esc(t.country)}${t.email ? '<br>' + esc(t.email) : ''}</p>`
            + `<p style="font:14px Arial,sans-serif;color:#555">Word: ${esc(c.word)} · ${esc(p.name)}, sponsored by ${esc(p.sponsor)} · ${fresh.stocked - fresh.given} fish left</p><p style="font:16px Arial,sans-serif"><a href="${site}/pond/admin/">Mark it sent</a></p>` });
      } catch (e) { console.log('pond email failed', String(e).slice(0, 200)); }
    }
    return Response.json({ ok: true, left: Math.max(0, fresh.stocked - fresh.given) });
  }
  return bad('Not found', 404);
};
export const config = { path: ['/api/pond', '/api/pond/*'] };
