// Card orders from the sponsor builder (Ken, 3 Nov; the sponsor page 17 Nov; nominations, edits and history 18 Nov).
// Each order is a list of cards (a fish, the sponsor's words and link, a logo, how many). Nothing is charged here: the request is kept and emailed
// to MannaFish, who replies with a proof. The fish are never sold; a sponsor pays for them to be given away.
//   POST /api/card-order {items:[{fish,title,name,url,label,logo,qty,cfg,dest}], contact:{name,email,phone,note,city}} -> {ok, id, total, editToken}
//        dest = {type:'self'} | {type:'hub', hubId, hubName} | {type:'new', nominee:{org,name,email,city}}: who gets these decals. A Hub or a new
//        business is only a nomination: it is emailed after Ken approves it (so nobody can use the form to send unwanted email).
//   POST /api/card-order {edit:{id,t}, items, contact}  -> {ok}     the sponsor changes a request before printing starts (the link in their email)
//   GET  /api/card-order?id=<id>&t=<edit token>        -> {order}   the same request, to load it back into the builder
//   GET  /api/card-order?k=<MF_ADMIN_KEY>              -> {orders:[...]}  (newest first, with each card's nomination and the changes made; for /print/orders/)
//   POST /api/card-order {k, id, status}                -> {ok}      'new'|'talking'|'proof'|'printing'|'done'
//   POST /api/card-order {k, id, nom:{i, action:'send'|'resend'|'decline'|'setEmail', email?}} -> {ok}   Ken's side of a nomination
// The nominee's own page is /nominate/ (netlify/functions/nomination.mjs).
import { getStore } from '@netlify/blobs';
import { sendMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const NS = { 'cache-control': 'no-store' };
const bad = (msg, status) => Response.json({ error: msg }, { status, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_ORDERS_TO || process.env.MF_PROOF_TO || FROM.email;
const db = () => getStore({ name: 'mannafish-orders', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, MIN = 100;
const STATUS = ['new', 'talking', 'proof', 'printing', 'done'], LOCKED = ['printing', 'done'];
const ADDRESS = 'MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405';
const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
async function hash(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mf-edit|' + s)); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40); }
async function limited(ip, what) {
  try { const s = getStore('mannafish-limits'), k = `${what || 'cards'}/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= 10) return true; await s.set(k, String(n + 1)); } catch (e) { /* never blocks */ }
  return false;
}
// one card, cleaned
export function cleanItem(x) {
  const qty = Math.max(MIN, Math.round((Number(x.qty) || MIN) / 100) * 100);
  let link = clean(x.url, 200); if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
  const logo = typeof x.logo === 'string' && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(x.logo) && x.logo.length < 1500000 ? x.logo : '';
  const c = x.cfg && typeof x.cfg === 'object' ? x.cfg : null;
  const cfg = c ? { qrTo: c.qrTo === 'app' ? 'app' : 'link', logoAspect: isFinite(c.logoAspect) ? Math.max(0, Math.min(12, +Number(c.logoAspect).toFixed(3))) : 0, by: ['logo', 'name', 'text'].includes(c.by) ? c.by : 'text', credit: clean(c.credit, 100), text: clean(c.text, 120), name: clean(c.name, 60),
    verse: c.verse && typeof c.verse === 'object' && c.verse.top ? { ref: clean(c.verse.ref, 40), top: clean(c.verse.top, 130), bot: clean(c.verse.bot, 130), ver: ['kjv', 'web', 'asv', 'ylt', 'darby', 'bbe', 'dra'].includes(c.verse.ver) ? c.verse.ver : 'kjv' } : undefined,
    qrWords: String(c.qrWords == null ? '' : c.qrWords).replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').split('\n').slice(0, 2).map((l) => clean(l, 24)).join('\n') } : null;
  const d = x.dest && typeof x.dest === 'object' ? x.dest : {};
  let dest = { type: 'self' };
  if (d.type === 'hub') dest = { type: 'hub', hubId: clean(d.hubId, 40), hubName: clean(d.hubName, 80), city: clean(d.city, 60) };
  if (d.type === 'new') { const n = d.nominee || {}, em = clean(n.email, 120).toLowerCase(); dest = { type: 'new', nominee: { org: clean(n.org, 80), name: clean(n.name, 80), email: EMAIL.test(em) ? em : '', phone: clean(n.phone, 40), city: clean(n.city, 60) } }; }
  return { fish: clean(x.fish, 40), title: clean(x.title, 40), name: clean(x.name, 60), url: link, label: clean(x.label, 50), logo, qty, ...(cfg ? { cfg } : {}), dest };
}
const destKey = (d) => d.type === 'hub' ? 'hub:' + d.hubId + d.hubName : d.type === 'new' ? 'new:' + (d.nominee.org + '|' + d.nominee.email).toLowerCase() : 'self';
const sponsorOf = (o, it) => it.name || (it.cfg && (it.cfg.name || it.cfg.text)) || o.contact.name;
const placeOf = (it) => it.dest.type === 'hub' ? it.dest.hubName : it.dest.type === 'new' ? it.dest.nominee.org : '';
const mail = async (to, subject, html, name) => { try { await sendMail({ to, name, subject, html, text: html.replace(/<[^>]+>/g, ' '), tag: 'cards' }); return true; } catch (e) { return false; } };
const wrap = (body) => `<div style="font:16px/1.55 Georgia,serif;color:#1c2228;max-width:34rem">${body}<p style="color:#5b6570;font-size:13px;margin-top:22px">${ADDRESS}</p></div>`;
const btn = (href, label) => `<p><a href="${esc(href)}" style="display:inline-block;background:#2a5fb0;color:#fff;text-decoration:none;font:700 15px Arial,sans-serif;padding:12px 20px;border-radius:999px">${esc(label)}</a></p>`;
const strip = (o) => { const { edit, ...rest } = o; return rest; };
// who is waiting for what: the nomination record of each card that goes to someone else
async function nominate(store, o, origin) {
  o.items.forEach((it, i) => { if (it.dest.type === 'self') { delete it.nom; return; } if (!it.nom) it.nom = { status: 'pending', token: rand(), at: Date.now() }; });
  for (const [i, it] of o.items.entries()) if (it.nom && it.nom.token) await store.setJSON('nm/' + it.nom.token, { orderId: o.id, i });
}
const diffText = (a, b) => {
  const line = (it) => `${it.qty} × ${it.title}${placeOf(it) ? ' for ' + placeOf(it) : ''}`, A = a.map(line), B = b.map(line), out = [];
  A.filter((x) => !B.includes(x)).forEach((x) => out.push('removed or changed: ' + x)); B.filter((x) => !A.includes(x)).forEach((x) => out.push('now: ' + x));
  return out.length ? out.join('; ') : 'details changed';
};
export default async (req, context) => {
  const url = new URL(req.url), store = db(), origin = url.origin;
  if (req.method === 'GET') {
    const id = url.searchParams.get('id'), t = url.searchParams.get('t');
    const admin = !!KEY() && url.searchParams.get('k') === KEY();
    if (id && (t || admin)) {   // the sponsor's own request, to change it (or Ken's, with the admin key)
      const o = await store.get('o/' + clean(id, 40), { type: 'json' }); if (!o || (!admin && (!o.edit || o.edit !== await hash(t)))) return bad('We could not find that request.', 404);
      return Response.json({ order: strip(o), locked: !admin && LOCKED.includes(o.status), admin }, { headers: NS });
    }
    if (!KEY() || url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
    const { blobs } = await store.list({ prefix: 'o/' }), out = [];
    for (const b of blobs) { try { const o = await store.get(b.key, { type: 'json' }); if (o) out.push(strip(o)); } catch (e) { /* skip */ } }
    out.sort((a, b) => b.at - a.at); return Response.json({ orders: out }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }

  // ── Ken: a status, or a nomination ──
  if (b.k) {
    if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
    const o = await store.get('o/' + clean(b.id, 40), { type: 'json' }); if (!o) return bad('No such order', 404);
    if (b.nom) {
      const i = Number(b.nom.i), it = o.items[i]; if (!it || !it.nom) return bad('No such nomination', 404); const n = it.nom, act = b.nom.action;
      if (act === 'setEmail') { const em = clean(b.nom.email, 120).toLowerCase(); if (!EMAIL.test(em)) return bad('That email does not look right.', 400); if (it.dest.type === 'new') it.dest.nominee.email = em; else it.dest.contactEmail = em; await store.setJSON('o/' + o.id, o); return Response.json({ ok: true }, { headers: NS }); }
      if (act === 'called' || act === 'mailed' || act === 'note') { (n.log = n.log || []).push({ at: Date.now(), what: act === 'called' ? 'phone call made' : act === 'mailed' ? 'something mailed' : clean(b.nom.note, 200) }); if (act === 'called') n.called = Date.now(); if (act === 'mailed') n.mailed = Date.now(); await store.setJSON('o/' + o.id, o); return Response.json({ ok: true }, { headers: NS }); }
      if (act === 'setPhone') { if (it.dest.type === 'new') it.dest.nominee.phone = clean(b.nom.phone, 40); else it.dest.contactPhone = clean(b.nom.phone, 40); await store.setJSON('o/' + o.id, o); return Response.json({ ok: true }, { headers: NS }); }
      if (act === 'decline') { n.status = 'declined'; n.at = Date.now(); await store.setJSON('o/' + o.id, o); return Response.json({ ok: true }, { headers: NS }); }
      if (act === 'send' || act === 'resend') {
        const to = (it.dest.type === 'new' ? it.dest.nominee.email : it.dest.contactEmail) || clean(b.nom.email, 120).toLowerCase(); if (!EMAIL.test(to)) return bad('Add the email address of the place first.', 400);
        if (it.dest.type === 'new') it.dest.nominee.email = to; else it.dest.contactEmail = to;
        const nm = it.dest.type === 'new' ? it.dest.nominee.name : '', org = placeOf(it), sp = sponsorOf(o, it);
        const ok = await mail(to, `${sp} would like ${org} to be a MannaFish Hub`, wrap(
          `<p>Hello${nm ? ' ' + esc(nm) : ''},</p><p><b>${esc(sp)}</b> has nominated <b>${esc(org)}</b> to be a MannaFish Hub: a place that gives free Scripture decals to the people who walk in.</p>`
          + `<p>MannaFish is a free Scripture and word-study project: one word of Scripture in the middle of a fish, with its verse around it. Nothing is sold, and there is no cost to you.</p>`
          + `<p>You, or someone you choose, would be our <b>MannaFish Ambassador</b> there: the friendly face who sets out the basket.</p>`
          + `<p>If you accept, you will receive a basket of free MannaFish decals, sponsored by ${esc(sp)}, to set on your counter.</p>`
          + btn(origin + '/vision/', 'Read the vision of MannaFish') + btn(origin + '/nominate/?t=' + n.token, 'Accept the nomination')
          + `<p>If you would rather not, just ignore this email, or <a href="${esc(origin + '/nominate/?t=' + n.token + '&decline=1')}">click here to decline</a>. We will not write again.</p>`), nm);
        if (!ok) return bad('The email could not be sent just now. Please try again.', 502);
        n.status = 'invited'; n.sentAt = Date.now(); await store.setJSON('o/' + o.id, o);
        await mail(o.contact.email, `We have invited ${org}`, wrap(`<p>Hello ${esc(o.contact.name)},</p><p>We have emailed <b>${esc(org)}</b> to invite them to be a MannaFish Hub, with your sponsorship. If they accept, we will make your decals and send them, with a MannaFish basket, to them. We will let you know.</p>`));
        return Response.json({ ok: true }, { headers: NS });
      }
      return bad('Which action?', 400);
    }
    if (!STATUS.includes(b.status)) return bad('Which status?', 400); o.status = b.status; await store.setJSON('o/' + o.id, o); return Response.json({ ok: true }, { headers: NS });
  }

  // ── the sponsor's request: new, or a change to one already sent ──
  const c = b.contact || {}, name = clean(c.name, 80), email = clean(c.email, 120).toLowerCase();
  if (!name || !EMAIL.test(email)) return bad('Please add your name and email.', 400);
  const items = (Array.isArray(b.items) ? b.items.slice(0, 12) : []).map(cleanItem).filter((x) => x.fish);
  if (!items.length) return bad('Your cart is empty.', 400);
  for (const it of items) if (it.dest.type === 'new' && !it.dest.nominee.org) return bad('Please give the name of the business or place you are nominating.', 400);
  const contact = { name, email, phone: clean(c.phone, 40), city: clean(c.city, 60), note: clean(c.note, 1000) }, total = items.reduce((s, x) => s + x.qty, 0);
  const sum = (it) => `<li><b>${it.qty} × ${esc(it.title)}</b>${it.name ? ' · ' + esc(it.name) : ''}${it.url ? ' · ' + esc(it.url) : ''}${placeOf(it) ? ' · <b>for ' + esc(placeOf(it)) + ' (nomination)</b>' : ''}${it.logo ? ' · logo in the order' : ''}</li>`;

  if (b.edit) {   // a change
    const e = b.edit, o = await store.get('o/' + clean(e.id, 40), { type: 'json' }), adm = !!KEY() && e.k === KEY();
    if (!o || (!adm && (!o.edit || o.edit !== await hash(String(e.t || ''))))) return bad('We could not find that request.', 404);
    if (!adm && LOCKED.includes(o.status)) return bad('This request is already being printed. Please email us and we will see what we can do.', 409);
    const before = o.items; o.items = items.map((it) => { const old = before.find((x) => destKey(x.dest) === destKey(it.dest) && x.nom); if (it.dest.type !== 'self' && old) it.nom = old.nom; return it; });
    o.contact = contact; o.total = total; o.status = o.status === 'proof' ? 'talking' : o.status; await nominate(store, o, origin);
    const what = diffText(before, o.items); (o.rev = o.rev || []).push({ at: Date.now(), what: (adm ? 'changed by MannaFish: ' : '') + what }); await store.setJSON('o/' + o.id, o);
    if (adm) { await store.setJSON('o/' + o.id, o); return Response.json({ ok: true, id: o.id, total }, { headers: NS }); }   // Ken's own change: logged, no emails
    await mail(TO(), `MannaFish card order ${o.id} CHANGED · ${total} decals · ${name}`, `<p>${esc(name)} changed request ${esc(o.id)}: ${esc(what)}.</p><ul>${o.items.map(sum).join('')}</ul><p>See it: ${esc(origin)}/print/orders/</p>`);
    await mail(email, 'Your MannaFish request was updated', wrap(`<p>Thank you, ${esc(name)}. Your request ${esc(o.id)} is updated: ${total} decals in ${o.items.length} ${o.items.length === 1 ? 'design' : 'designs'}.</p><p>You can change it again until printing starts: <a href="${esc(origin + '/?edit=' + o.id + '.' + e.t + '#sponsor')}">change my request</a>.</p>`), name);
    return Response.json({ ok: true, id: o.id, total }, { headers: NS });
  }

  if (await limited(context && context.ip)) return bad('Please wait a little before sending another.', 429);
  const id = 'C' + Date.now().toString(36).toUpperCase(), token = rand();
  const order = { id, at: Date.now(), status: 'new', contact, items, total, edit: await hash(token), rev: [{ at: Date.now(), what: 'sent' }] };
  await nominate(store, order, origin); await store.setJSON('o/' + id, order);
  const waiting = items.filter((x) => x.nom);
  await mail(TO(), `MannaFish card order ${id} · ${total} decals · ${name}${waiting.length ? ' · ' + waiting.length + ' nomination' + (waiting.length > 1 ? 's' : '') + ' to approve' : ''}`,
    `<p>A card request (${esc(id)}): ${total} decals.</p><p><b>${esc(name)}</b> · ${esc(email)}${contact.phone ? ' · ' + esc(contact.phone) : ''}${contact.city ? ' · ' + esc(contact.city) : ''}</p><ul>${items.map(sum).join('')}</ul>`
    + (waiting.length ? `<p><b>Nominations waiting for your OK:</b> ${esc(waiting.map(placeOf).join(', '))}. Nobody has been emailed. Approve each one in ${esc(origin)}/print/orders/ and the invitation goes out.</p>` : '')
    + (contact.note ? `<p>${esc(contact.note)}</p>` : '') + `<p>See every request, with the logos: ${esc(origin)}/print/orders/</p>`);
  await mail(email, 'Your MannaFish sponsorship request', wrap(`<p>Thank you, ${esc(name)}. We have your request for ${total} MannaFish decals (number ${esc(id)}).</p>`
    + `<p>We will email you a proof of your card to approve before anything is printed. ${waiting.length ? 'We will also invite ' + esc(waiting.map(placeOf).join(', ')) + ' to be a MannaFish Hub. If they accept, we make your decals and send them, with a MannaFish basket, to them. ' : ''}</p>`
    + `<p>Changed your mind? You can change this request until printing starts: <a href="${esc(origin + '/?edit=' + id + '.' + token + '#sponsor')}">change my request</a>.</p>`), name);
  return Response.json({ ok: true, id, total, editToken: token }, { headers: NS });
};
export const config = { path: '/api/card-order' };
