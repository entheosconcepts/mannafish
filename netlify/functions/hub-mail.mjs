// Emails to Hub hosts: Ken's side (Hubs admin › Emails), the hosts' one-tap answers, and choosing their Catch (lib/hubmail.mjs has
// the emails themselves and the automatic sends).
//   GET  /api/hub-mail?k=                     -> {cfg, hubs:[...], log, replies, picks}
//   POST /api/hub-mail {k, action:'cfg', auto:{restock,monthly,welcome}, restockDays}
//   POST /api/hub-mail {k, action:'host', id, owner, hostName, catchEvery:'month'|'quarter'|'off', restockDays, mailOff}
//   POST /api/hub-mail {k, action:'preview', kind, id?, news, period}      -> {subject, html}
//   POST /api/hub-mail {k, action:'send', kind, ids:[...]|'all', news, period, test}   -> {sent, skipped:[...]}  (test: only to Ken)
//   GET  /api/hub-mail/r?h=&t=&a=ok|low|out|stop|start   the buttons in a host's email (a small thank-you page)
//   GET  /api/hub-mail/catch?h=&t=&p=month|quarter      -> {hub, period, fish:[{key,title,ref,img}], picked}
//   POST /api/hub-mail/catch {h, t, p, fish, note}      -> {ok}  (Ken is emailed)
import { sendMail, hasMail, FROM } from './lib/mail.mjs';
import { db, hubs, settings, infoOf, logSend, sendTo, build, tokenOk, periodOf, fishList, KINDS, SITE, ADDRESS } from './lib/hubmail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const NS = { 'cache-control': 'no-store' };
const bad = (msg, status) => Response.json({ error: msg }, { status, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_HUBS_TO || process.env.MF_STATIONS_TO || process.env.MF_POND_TO || process.env.MF_PROOF_TO || FROM.email;
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, n);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SAMPLE = { id: 'sample', name: 'Your Hub', hostName: 'Friend', owner: '', status: 'active', stock: [] };
async function rows(s, prefix, n) { const { blobs } = await s.list({ prefix }), out = [];
  for (const b of blobs.sort((a, z) => z.key.localeCompare(a.key)).slice(0, n)) { const v = await s.get(b.key, { type: 'json' }); if (v) out.push(v); } return out; }
async function tell(subject, lines) { if (!hasMail()) return; const html = '<div style="font:16px/1.5 Georgia,serif;color:#111">' + lines.filter(Boolean).map((l) => '<p>' + l + '</p>').join('') + '</div>';
  try { await sendMail({ to: TO(), subject, html, text: html.replace(/<[^>]+>/g, ' '), tag: 'hub-reply' }); } catch (e) { /* kept anyway */ } }
function page(title, words, more) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · MannaFish</title>`
    + `<style>body{margin:0;background:#000;color:#eaf0f0;font:18px/1.55 Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}main{max-width:460px;padding:28px;text-align:center}`
    + `h1{font-size:1.5rem;margin:14px 0}a{color:#8fb6ff}img{width:150px}small{color:#9fb2b6;display:block;margin-top:24px;font-size:.75rem}</style></head><body><main><img src="/w/img/logo-email.png" alt="MannaFish">`
    + `<h1>${esc(title)}</h1><p>${words}</p>${more || ''}<small>${esc(ADDRESS)}</small></main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', ...NS } });
}

export default async (req) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/hub-mail\/?/, '').replace(/\/$/, ''), s = db(), q = url.searchParams;

  // ── a host taps a button in their email
  if (sub === 'r') {
    const id = clean(q.get('h'), 40), a = q.get('a');
    if (!(await tokenOk(id, q.get('t')))) return page('That link has expired', 'Just reply to the email and we will take care of it.');
    const st = await s.get('s/' + id, { type: 'json' }); if (!st) return page('Hub not found', 'Just reply to the email and we will take care of it.');
    const at = new Date().toISOString();
    if (a === 'stop' || a === 'start') { st.mailOff = a === 'stop'; await s.setJSON('s/' + id, st);
      await s.setJSON(`hm/r/${at}-${id}`, { at, id, name: st.name, a });
      return a === 'stop' ? page('You will not get these emails', `No more emails for ${esc(st.name)}. Thank you for being a MannaFish Hub.`, `<p><a href="${url.pathname}?h=${encodeURIComponent(id)}&t=${encodeURIComponent(q.get('t'))}&a=start">I changed my mind: start them again</a></p>`)
        : page('Welcome back', `Emails for ${esc(st.name)} are on again.`); }
    if (!['ok', 'low', 'out'].includes(a)) return page('Thank you', 'Just reply to the email if you need anything.');
    st.lastReply = { a, at }; st.lastCheck = at; await s.setJSON('s/' + id, st);
    await s.setJSON(`hm/r/${at}-${id}`, { at, id, name: st.name, a });
    if (a !== 'ok') await tell(`${a === 'out' ? 'OUT of MannaFish' : 'Running low'}: ${st.name}`, [`<b>${esc(st.name)}</b> says: <b>${a === 'out' ? '❌ All out' : '⚠️ Running low'}</b>.`,
      [st.address, st.hostName, st.owner].filter(Boolean).map(esc).join(' · '), (st.stock || []).length ? 'In their pond: ' + st.stock.map((x) => esc(x.word) + ' ' + esc(x.kind) + (x.qty ? ' (' + x.qty + ')' : '')).join(', ') : '', `<a href="${SITE}/hubs/admin/">Open Hubs admin</a>`]);
    const msg = { ok: ['Wonderful, thank you!', 'We will check in again in a few weeks.'], low: ['Thank you, more are on the way soon', 'Ken has been told. We will be in touch about the next delivery.'], out: ['Thank you, we are on it', 'Ken has been told, and we will get more fish to you as soon as we can.'] }[a];
    return page(msg[0], msg[1] + ` <br><br><i>Gather up the fragments that remain, that nothing be lost</i> (John 6:12).`);
  }

  // ── a host chooses their Catch
  if (sub === 'catch') {
    if (req.method === 'GET') {
      const id = clean(q.get('h'), 40); if (!(await tokenOk(id, q.get('t')))) return bad('That link has expired', 403);
      const st = await s.get('s/' + id, { type: 'json' }); if (!st) return bad('Hub not found', 404);
      const P = periodOf(new Date(), q.get('p') === 'quarter' ? 'quarter' : 'month'), picked = await s.get(`hm/p/${id}/${P.key}`, { type: 'json' });
      return Response.json({ hub: { name: st.name }, period: P, picked: picked ? { fish: picked.fish, title: picked.title, note: picked.note } : null, fish: fishList() }, { headers: NS });
    }
    if (req.method !== 'POST' || !okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    const id = clean(b.h, 40); if (!(await tokenOk(id, b.t))) return bad('That link has expired', 403);
    const st = await s.get('s/' + id, { type: 'json' }); if (!st) return bad('Hub not found', 404);
    const P = periodOf(new Date(), b.p === 'quarter' ? 'quarter' : 'month'), F = fishList(), key = clean(b.fish, 40);
    const f = key === 'surprise' ? { key: 'surprise', title: 'Surprise us', ref: '' } : F.find((x) => x.key === key); if (!f) return bad('Which fish?', 400);
    const at = new Date().toISOString(), note = clean(b.note, 500);
    await s.setJSON(`hm/p/${id}/${P.key}`, { at, id, name: st.name, fish: f.key, title: f.title, ref: f.ref, period: P.key, periodName: P.name, note });
    await tell(`Catch of ${P.short === 'Month' ? 'the Month' : 'the Quarter'}: ${st.name} chose ${f.title}`, [`<b>${esc(st.name)}</b> chose <b>${esc(f.title)}</b>${f.ref ? ' (' + esc(f.ref) + ')' : ''} for their Catch of ${esc(P.name)}.`,
      note ? '“' + esc(note) + '”' : '', [st.address, st.hostName, st.owner].filter(Boolean).map(esc).join(' · '), `<a href="${SITE}/hubs/admin/">Open Hubs admin</a>`]);
    return Response.json({ ok: true }, { headers: NS });
  }

  // ── Ken's side
  const isGet = req.method === 'GET'; let b = {};
  if (!isGet) { if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403); try { b = await req.json(); } catch (e) { return bad('Bad request', 400); } }
  if (!KEY() || (isGet ? q.get('k') : b.k) !== KEY()) return bad('Not allowed', 403);
  const C = await settings(s);
  if (isGet) {
    const H = (await hubs(s)).filter((x) => x.status === 'active' || x.owner).map((x) => {
      const every = Math.max(3, Number(x.restockDays) || C.restockDays), since = Date.parse(x.lastCheck || x.opened || x.created || 0) || 0;
      return { id: x.id, name: x.name, status: x.status, owner: x.owner || '', hostName: x.hostName || '', mailOff: !!x.mailOff, catchEvery: x.catchEvery || 'month', restockDays: x.restockDays || '',
        lastCheck: x.lastCheck || '', lastReply: x.lastReply || null, nextRestock: x.status === 'active' && x.owner && !x.mailOff && C.auto.restock ? new Date(Math.max(Date.now(), since + every * 86400000)).toISOString() : '' }; });
    return Response.json({ cfg: C, kinds: KINDS, hubs: H, log: await rows(s, 'hm/log/', 40), replies: await rows(s, 'hm/r/', 40), picks: await rows(s, 'hm/p/', 40), to: TO(), mail: hasMail() }, { headers: NS });
  }
  const a = b.action;
  if (a === 'cfg') { const c = (await s.get('hm/cfg', { type: 'json' })) || {}; c.auto = { ...C.auto };
    for (const k of ['restock', 'monthly', 'welcome']) if (b.auto && typeof b.auto[k] === 'boolean') c.auto[k] = b.auto[k];
    if (b.restockDays) c.restockDays = Math.max(3, Math.min(365, Number(b.restockDays) || 21)); await s.setJSON('hm/cfg', c); return Response.json({ ok: true }, { headers: NS }); }
  if (a === 'host') { const id = clean(b.id, 40), st = await s.get('s/' + id, { type: 'json' }); if (!st) return bad('Hub not found', 404);
    if (b.owner != null) { const e = clean(b.owner, 120).toLowerCase(); if (e && !EMAIL.test(e)) return bad('That email does not look right', 400); st.owner = e; }
    if (b.hostName != null) st.hostName = clean(b.hostName, 80);
    if (['month', 'quarter', 'off'].includes(b.catchEvery)) st.catchEvery = b.catchEvery;
    if (b.restockDays != null) st.restockDays = b.restockDays === '' ? '' : Math.max(3, Math.min(365, Number(b.restockDays) || 21));
    if (typeof b.mailOff === 'boolean') st.mailOff = b.mailOff;
    await s.setJSON('s/' + id, st); return Response.json({ ok: true }, { headers: NS }); }
  const kind = KINDS.includes(b.kind) ? b.kind : null; if (!kind) return bad('Which email?', 400);
  const news = b.news ? { subject: clean(b.news.subject, 140), heading: clean(b.news.heading, 140), body: clean(b.news.body, 5000), button: clean(b.news.button, 40), link: clean(b.news.link, 400), image: clean(b.news.image, 400), restock: !!b.news.restock, catch: !!b.news.catch } : null;
  if (kind === 'news' && !(news && news.subject && news.body)) return bad('Give it a subject and a message', 400);
  const period = ['month', 'quarter'].includes(b.period) ? b.period : undefined, all = await hubs(s);
  const pickHubs = () => (b.ids === 'all' ? all.filter((x) => x.status === 'active') : all.filter((x) => (b.ids || []).includes(x.id)));
  const one = async (st) => ({ news, period, info: kind === 'monthly' ? await infoOf(s, st) : null });
  if (a === 'preview') { const st = all.find((x) => x.id === b.id) || pickHubs()[0] || SAMPLE; const m = await build(kind, st, await one(st)); return Response.json(m, { headers: NS }); }
  if (a === 'send') {
    if (b.test) { const st = pickHubs()[0] || SAMPLE; if (!hasMail()) return bad('Email is not set up (BREVO_API_KEY)', 503);
      await sendTo(st, kind, { ...(await one(st)), test: TO() }); return Response.json({ ok: true, sent: 1, to: TO() }, { headers: NS }); }
    const L = pickHubs(); if (!L.length) return bad('Choose at least one Hub', 400);
    const sent = [], skipped = [];
    for (const st of L) { try { const r = await sendTo(st, kind, await one(st)); if (r.sent) { sent.push({ id: st.id, name: st.name, email: st.owner });
          if (kind === 'restock' || kind === 'monthly') { st.lastCheck = new Date().toISOString(); await s.setJSON('s/' + st.id, st); } }
        else skipped.push({ name: st.name, why: r.skipped }); } catch (e) { skipped.push({ name: st.name, why: 'could not send' }); } }
    if (sent.length) await logSend(s, { kind, subject: kind === 'news' ? news.subject : (await build(kind, L[0], await one(L[0]))).subject, to: sent });
    return Response.json({ ok: true, sent: sent.length, skipped }, { headers: NS });
  }
  return bad('Which action?', 400);
};
export const config = { path: ['/api/hub-mail', '/api/hub-mail/*'] };
