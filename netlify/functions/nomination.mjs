// The nominee's side of a Hub nomination (18 Nov). A sponsor nominated a place; Ken approved; the place got an email with a link to /nominate/?t=<token>.
//   GET  /api/nomination?t=<token>  -> {org, sponsor, qty, status}
//   POST /api/nomination {t, action:'accept'|'decline', contact:{name,email,phone}, ship:{line1,line2,city,state,zip}} -> {ok}
// Accepting emails Ken ("make and ship this") and the sponsor. Nothing is charged to the place. Only works once Ken has sent the invitation.
import { getStore } from '@netlify/blobs';
import { sendMail, FROM } from './lib/mail.mjs';
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const NS = { 'cache-control': 'no-store' };
const bad = (m, s) => Response.json({ error: m }, { status: s, headers: NS });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TO = () => process.env.MF_ORDERS_TO || process.env.MF_PROOF_TO || FROM.email;
const ADDRESS = 'MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405';
const wrap = (b) => `<div style="font:16px/1.55 Georgia,serif;color:#1c2228;max-width:34rem">${b}<p style="color:#5b6570;font-size:13px;margin-top:22px">${ADDRESS}</p></div>`;
const mail = async (to, subject, html) => { try { await sendMail({ to, subject, html, text: html.replace(/<[^>]+>/g, ' '), tag: 'nomination' }); return true; } catch (e) { return false; } };
async function find(t) {
  t = String(t || ''); if (!/^[0-9a-f]{32}$/.test(t)) return null;
  const s = getStore({ name: 'mannafish-orders', consistency: 'strong' }), ref = await s.get('nm/' + t, { type: 'json' }); if (!ref) return null;
  const o = await s.get('o/' + ref.orderId, { type: 'json' }); const it = o && o.items[ref.i]; if (!it || !it.nom || it.nom.token !== t) return null;
  return { s, o, it };
}
export default async (req) => {
  const url = new URL(req.url);
  if (req.method === 'GET') {
    const f = await find(url.searchParams.get('t')); if (!f) return bad('This link is not valid.', 404);
    const { o, it } = f, org = it.dest.type === 'hub' ? it.dest.hubName : it.dest.nominee.org;
    return Response.json({ org, sponsor: it.name || (it.cfg && (it.cfg.name || it.cfg.text)) || o.contact.name, qty: it.qty, status: it.nom.status }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const f = await find(b.t); if (!f) return bad('This link is not valid.', 404);
  const { s, o, it } = f, n = it.nom, org = it.dest.type === 'hub' ? it.dest.hubName : it.dest.nominee.org, sp = it.name || (it.cfg && (it.cfg.name || it.cfg.text)) || o.contact.name;
  if (n.status === 'pending') return bad('This invitation is not ready yet.', 409);
  if (n.status === 'accepted' || n.status === 'declined') return Response.json({ ok: true, already: n.status }, { headers: NS });
  if (b.action === 'decline') { n.status = 'declined'; n.at = Date.now(); await s.setJSON('o/' + o.id, o); await mail(TO(), `${org} declined the MannaFish Hub nomination`, wrap(`<p>${esc(org)} declined (order ${esc(o.id)}, sponsor ${esc(sp)}). Nothing to ship.</p>`)); return Response.json({ ok: true }, { headers: NS }); }
  if (b.action !== 'accept') return bad('Which action?', 400);
  const c = b.contact || {}, a = b.ship || {}, name = clean(c.name, 80), email = clean(c.email, 120).toLowerCase();
  if (!name || !EMAIL.test(email)) return bad('Please add your name and email.', 400);
  const ship = { line1: clean(a.line1, 100), line2: clean(a.line2, 100), city: clean(a.city, 60), state: clean(a.state, 30), zip: clean(a.zip, 12) };
  if (!ship.line1 || !ship.city || !ship.state || !ship.zip) return bad('Please add the street address where the basket should be sent.', 400);
  n.status = 'accepted'; n.at = Date.now(); n.contact = { name, email, phone: clean(c.phone, 40) }; n.ship = ship; await s.setJSON('o/' + o.id, o);
  const addr = `${esc(ship.line1)}${ship.line2 ? ', ' + esc(ship.line2) : ''}, ${esc(ship.city)} ${esc(ship.state)} ${esc(ship.zip)}`;
  await mail(TO(), `ACCEPTED: ${org} will be a MannaFish Hub (order ${o.id})`, wrap(`<p><b>${esc(org)}</b> accepted. Make and ship ${it.qty} × ${esc(it.title)} (sponsored by ${esc(sp)}), with a MannaFish basket.</p><p>${esc(name)} · ${esc(email)}${n.contact.phone ? ' · ' + esc(n.contact.phone) : ''}<br>${addr}</p><p>Order: ${esc(new URL(req.url).origin)}/print/orders/</p>`));
  await mail(o.contact.email, `${org} accepted: they are a MannaFish Hub`, wrap(`<p>Good news, ${esc(o.contact.name)}: <b>${esc(org)}</b> accepted your nomination. We will make your decals and send them, with a MannaFish basket, to them.</p>`));
  await mail(email, 'Welcome, MannaFish Hub', wrap(`<p>Thank you, ${esc(name)}. ${esc(org)} is now a MannaFish Hub. Your basket of free decals, sponsored by ${esc(sp)}, is being prepared and will be sent to ${addr}.</p><p>No cost to you, ever.</p>`));
  return Response.json({ ok: true }, { headers: NS });
};
export const config = { path: '/api/nomination' };
