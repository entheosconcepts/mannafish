// Card orders (Ken, 3 Nov: "allow user to customize the back of the card and add to cart, and make sure the minimum is 100 decals").
// From the home page's "Make the back yours": each item is a fish, the sponsor's name, link, the words beside its QR code, a logo
// (a small picture), and how many (at least 100, in hundreds). No price and no payment here (Ken decides pricing later): the request is
// kept and emailed to MannaFish, who replies with the details and a proof. The fish are never sold; a sponsor pays for them to be
// given away.
//   POST /api/card-order {items:[{fish,title,name,url,label,logo,qty}], contact:{name,email,phone,note}} -> {ok, id}
//   GET  /api/card-order?k=<MF_ADMIN_KEY>  -> {orders:[...]}  (newest first; for /print/orders/)
//   POST /api/card-order {k, id, status:'new'|'talking'|'proof'|'printing'|'done'} -> {ok}
import { getStore } from '@netlify/blobs';
import { sendMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const NS = { 'cache-control': 'no-store' };
const bad = (msg, status) => Response.json({ error: msg }, { status, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_ORDERS_TO || process.env.MF_PROOF_TO || FROM.email;
const db = () => getStore({ name: 'mannafish-orders', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, MIN = 100;
const STATUS = ['new', 'talking', 'proof', 'printing', 'done'];
async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `cards/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= 10) return true; await s.set(k, String(n + 1)); } catch (e) { /* never blocks */ }
  return false;
}
export default async (req, context) => {
  const url = new URL(req.url), store = db();
  if (req.method === 'GET') {
    if (!KEY() || url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
    const { blobs } = await store.list({ prefix: 'o/' }), out = [];
    for (const b of blobs) { try { const o = await store.get(b.key, { type: 'json' }); if (o) out.push(o); } catch (e) { /* skip */ } }
    out.sort((a, b) => b.at - a.at); return Response.json({ orders: out }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.k) {   // admin: change an order's status
    if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
    const o = await store.get('o/' + clean(b.id, 40), { type: 'json' }); if (!o) return bad('No such order', 404);
    if (!STATUS.includes(b.status)) return bad('Which status?', 400); o.status = b.status; await store.setJSON('o/' + o.id, o); return Response.json({ ok: true }, { headers: NS });
  }
  const c = b.contact || {}, name = clean(c.name, 80), email = clean(c.email, 120).toLowerCase();
  if (!name || !EMAIL.test(email)) return bad('Please add your name and email.', 400);
  const raw = Array.isArray(b.items) ? b.items.slice(0, 12) : [];
  const items = raw.map((x) => {
    const qty = Math.max(MIN, Math.round((Number(x.qty) || MIN) / 100) * 100);
    let link = clean(x.url, 200); if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    const logo = typeof x.logo === 'string' && /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(x.logo) && x.logo.length < 1500000 ? x.logo : '';
    return { fish: clean(x.fish, 40), title: clean(x.title, 40), name: clean(x.name, 60), url: link, label: clean(x.label, 50), logo, qty };
  }).filter((x) => x.fish);
  if (!items.length) return bad('Your cart is empty.', 400);
  if (await limited(context && context.ip)) return bad('Please wait a little before sending another.', 429);
  const id = 'C' + Date.now().toString(36).toUpperCase(), total = items.reduce((s, x) => s + x.qty, 0);
  const order = { id, at: Date.now(), status: 'new', contact: { name, email, phone: clean(c.phone, 40), note: clean(c.note, 1000) }, items, total };
  await store.setJSON('o/' + id, order);
  const rows = items.map((x) => `<li><b>${x.qty} × ${esc(x.title)}</b>${x.name ? ' · ' + esc(x.name) : ''}${x.url ? ' · ' + esc(x.url) : ''}${x.label ? ' · “' + esc(x.label) + '”' : ''}${x.logo ? ' · logo attached in the order' : ''}</li>`).join('');
  const html = `<p>A card order request (${esc(id)}): ${total} decals.</p><p><b>${esc(name)}</b> · ${esc(email)}${order.contact.phone ? ' · ' + esc(order.contact.phone) : ''}</p><ul>${rows}</ul>`
    + (order.contact.note ? `<p>${esc(order.contact.note)}</p>` : '') + '<p>See every order, with the logos: /print/orders/</p>';
  try { await sendMail({ to: TO(), subject: `MannaFish card order ${id} · ${total} decals · ${name}`, html, text: html.replace(/<[^>]+>/g, ' '), tag: 'cards' }); } catch (e) { /* kept anyway */ }
  try { await sendMail({ to: email, name, subject: 'Your MannaFish card request', tag: 'cards',
    html: `<p>Thank you, ${esc(name)}. We have your request for ${total} MannaFish decals (number ${esc(id)}).</p><p>We will email you the details and a proof of your card to approve before anything is printed.</p><p>MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405</p>` }); } catch (e) { /* the request is kept */ }
  return Response.json({ ok: true, id, total }, { headers: NS });
};
export const config = { path: '/api/card-order' };
