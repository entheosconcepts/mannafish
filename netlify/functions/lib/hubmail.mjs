// Emails to the people who host MannaFish Hubs (Ken, 3 Nov: "a back-end system ... email campaigns for every hub that says, need a
// restock ... automatic email campaigns, check out our new t-shirts, request a catch of the day or catch of the month, catch of the
// quarter"). The emails themselves, the one-tap answers in them, and the automatic sends. Used by hub-mail.mjs (Ken's side and the
// hosts' taps) and hub-mail-daily.mjs (every morning).
//   restock   "How are the MannaFish at <Hub>?"  ✅ plenty · ⚠️ running low · ❌ all out   (automatic every N days)
//   catch     "Choose your Catch of the Month / Quarter"  -> /hubs/catch/: the host picks the fish they want next
//   monthly   "Your month as a MannaFish Hub": loves, fish that arrived, the most-loved fish, and the Catch button   (1st of the month)
//   welcome   "Welcome, you are a MannaFish Hub"   (when a Hub opens with a host email)
//   news      anything Ken writes: new T-shirts, Christmas, a thank-you ...
// Every email has the business address and a link to stop them; a host who stops gets nothing automatic or sent to all.
import { sendMail, hasMail, FROM } from './mail.mjs';
import { fishInfo } from './manna.mjs';
import CATCH from './catch.json';

export const SITE = 'https://manna-fish.com';
export const ADDRESS = 'MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405';
export const KINDS = ['restock', 'catch', 'monthly', 'welcome', 'news'];
export const DEFAULTS = { auto: { restock: true, monthly: true, welcome: true }, restockDays: 21 };
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SECRET = () => process.env.MF_HUB_MAIL_SECRET || process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || 'mannafish';

// the link in a host's email: the Hub's id, signed, so only that host's email can answer for that Hub
export async function token(id) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('hub:' + id));
  return Array.from(new Uint8Array(s).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function tokenOk(id, t) { return !!id && !!t && (await token(id)) === String(t); }

// this month and this quarter, by the calendar in Wilmington
export function periodOf(now = new Date(), every = 'month') {
  const d = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })), y = d.getFullYear(), m = d.getMonth();
  if (every === 'quarter') { const q = Math.floor(m / 3) + 1; return { key: `${y}-Q${q}`, name: `the Quarter (${['January–March', 'April–June', 'July–September', 'October–December'][q - 1]} ${y})`, short: 'Quarter' }; }
  return { key: `${y}-${String(m + 1).padStart(2, '0')}`, name: `the Month (${d.toLocaleString('en-US', { month: 'long' })} ${y})`, short: 'Month' };
}
// every fish a host can choose for their Catch
export function fishList() {
  return CATCH.order.map((k) => { const f = fishInfo(k); return f ? { key: k, title: f.title, ref: f.ref, img: CATCH.fish[k] ? `/fish/${k}.svg` : `/fish/en/${k}.svg` } : null; }).filter(Boolean);
}

function button(href, text, color) {
  return `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 18px;border-radius:999px;background:${color || '#2a5fb0'};color:#fff;text-decoration:none;font:700 15px Arial,sans-serif">${text}</a>`;
}
// one email: the logo, a heading, the words, the buttons, and the footer with the address and the link to stop
export function frame({ heading, paras, buttons, image, stop }) {
  return `<div style="background:#f3f5f6;padding:18px 10px"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;font:16px/1.55 Georgia,serif;color:#16202a">`
    + `<div style="background:#000;padding:14px 20px"><img src="${SITE}/w/img/logo-email.png" alt="MannaFish" width="140" style="display:block;height:auto;border:0"></div>`
    + (image ? `<img src="${esc(image)}" alt="" width="560" style="display:block;width:100%;height:auto;border:0">` : '')
    + `<div style="padding:20px 22px"><h1 style="font:800 22px/1.25 Arial,sans-serif;margin:0 0 12px;color:#000">${heading}</h1>`
    + paras.filter(Boolean).map((p) => `<p style="margin:0 0 14px">${p}</p>`).join('')
    + (buttons && buttons.length ? `<p style="margin:6px 0 4px">${buttons.join('')}</p>` : '') + `</div>`
    + `<div style="padding:14px 22px;border-top:1px solid #e3e8ea;font:12px/1.5 Arial,sans-serif;color:#6b7a80">You get these as the host of a MannaFish Hub. Just reply to this email to reach Ken.<br>${esc(ADDRESS)}`
    + (stop ? `<br><a href="${esc(stop)}" style="color:#6b7a80">Stop these emails</a>` : '') + `</div></div></div>`;
}
const textOf = (html) => html.replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)').replace(/<br>/g, '\n').replace(/<\/p>|<\/h1>/g, '\n\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim();

// the words of each kind of email, for one Hub; info = {loves, top:[{word,n}], arrived:[{word,kind,qty}]} for the monthly
export async function build(kind, hub, opt = {}) {
  const t = await token(hub.id), base = `${SITE}/api/hub-mail/r?h=${encodeURIComponent(hub.id)}&t=${t}`, stop = base + '&a=stop';
  const hi = hub.hostName ? `Hi ${esc(hub.hostName.split(' ')[0])},` : 'Hi,', name = esc(hub.name);
  const every = hub.catchEvery === 'quarter' ? 'quarter' : 'month', P = periodOf(opt.now || new Date(), opt.period || every);
  const catchUrl = `${SITE}/hubs/catch/?h=${encodeURIComponent(hub.id)}&t=${t}&p=${opt.period || every}`;
  if (kind === 'restock') {
    const subject = `How are the MannaFish at ${hub.name}?`;
    return { subject, html: frame({ heading: `How are the MannaFish at ${name}?`, stop,
      paras: [hi, 'Just checking in. One tap lets us know if it is time to send more.', '<i>Gather up the fragments that remain, that nothing be lost</i> (John 6:12).'],
      buttons: [button(base + '&a=ok', '✅ We have plenty', '#1f7a4d'), button(base + '&a=low', '⚠️ Running low', '#b8860b'), button(base + '&a=out', '❌ All out', '#c8423c')] }) };
  }
  if (kind === 'catch') {
    const subject = `Choose your Catch of ${P.short === 'Month' ? 'the Month' : 'the Quarter'} for ${hub.name}`;
    return { subject, html: frame({ heading: `Choose your Catch of ${esc(P.name)}`, stop,
      paras: [hi, `Pick the MannaFish you would like at ${name} next: a word for your customers, your church or your town. We print it and send it, free to give away.`, 'Not sure? Choose “Surprise us” and we will pick one that fits the season.'],
      buttons: [button(catchUrl, '🐟 Choose our Catch')] }) };
  }
  if (kind === 'monthly') {
    const i = opt.info || {}, top = (i.top || []).slice(0, 5), got = i.arrived || [];
    const subject = `Your month as a MannaFish Hub: ${hub.name}`;
    return { subject, html: frame({ heading: `Thank you for being a MannaFish Hub`, stop,
      paras: [hi, `Here is ${name} this past month.`,
        i.loves ? `People have loved <b>${i.loves}</b> fish for ${name} so far${top.length ? ', most of all ' + top.map((x) => `<b>${esc(x.word)}</b> (${x.n})`).join(', ') : ''}. When the loves reach your Hub’s number, we print the most-loved and send them.` : '',
        got.length ? 'Arrived this month: ' + got.map((x) => `${esc(x.word)} ${esc(x.kind)}s${x.qty ? ' (' + x.qty + ')' : ''}`).join(', ') + '.' : '',
        `Every fish someone takes is a word of Scripture going home with them. <i>So shall my word be that goeth forth out of my mouth: it shall not return unto me void</i> (Isaiah 55:11).`,
        opt.noCatch ? 'How is your stock?' : `How is your stock? And would you like to choose your Catch of ${esc(P.name)}?`],
      buttons: [button(base + '&a=ok', '✅ Plenty', '#1f7a4d'), button(base + '&a=low', '⚠️ Running low', '#b8860b')].concat(opt.noCatch ? [] : [button(catchUrl, '🐟 Choose our Catch')]) }) };
  }
  if (kind === 'welcome') {
    const subject = `Welcome, ${hub.name} is a MannaFish Hub`;
    return { subject, html: frame({ heading: `Welcome to MannaFish, ${name}!`, stop,
      paras: [hi, 'Thank you for giving MannaFish away. People in your area can now find you on the map and love the fish they want at your Hub. When enough of them do, we print those fish and send them to you.',
        '<b>Take 2:</b> each person takes two, one to keep and one to give away. If you notice fish going faster than they should, just reply and let us know.',
        `Every few weeks we will check in with one tap to see if you need more, and each ${every} you can choose your Catch: the fish you would like next.`],
      buttons: [button(`${SITE}/hubs/?hub=${encodeURIComponent(hub.id)}`, 'See your Hub on the map'), button(catchUrl, '🐟 Choose your first Catch')] }) };
  }
  // news: Ken's own words (new T-shirts, a season, a thank-you)
  const n = opt.news || {}, paras = String(n.body || '').split(/\n\s*\n/).map((p) => esc(p.trim()).replace(/\n/g, '<br>')).filter(Boolean);
  const btn = n.button && /^https?:\/\//.test(n.link || '') ? [button(n.link, esc(n.button))] : [];
  if (n.restock) btn.push(button(base + '&a=low', '⚠️ We need a restock', '#b8860b'));
  if (n.catch) btn.push(button(catchUrl, '🐟 Choose our Catch'));
  return { subject: String(n.subject || 'News from MannaFish').slice(0, 140), html: frame({ heading: esc(n.heading || n.subject || 'News from MannaFish'), stop, image: /^https?:\/\//.test(n.image || '') ? n.image : '', paras: [hi].concat(paras), buttons: btn }) };
}

// send one email to one Hub's host (nothing when they asked to stop, unless it is a test to Ken)
export async function sendTo(hub, kind, opt = {}) {
  const to = opt.test ? opt.test : hub.owner;
  if (!to) return { skipped: 'no email' };
  if (hub.mailOff && !opt.test) return { skipped: 'stopped' };
  if (!hasMail()) return { skipped: 'no mail key' };
  const m = await build(kind, hub, opt);
  await sendMail({ to, name: opt.test ? undefined : hub.hostName || undefined, subject: (opt.test ? '[Test] ' : '') + m.subject, html: m.html, text: textOf(m.html), tag: 'hub-' + kind });
  return { sent: true, subject: m.subject };
}
export { FROM };

// ── the Hubs and what has been sent (the same store as hubs.mjs: s/<id> the Hub, c/<id> its loves; hm/... the emails)
import { getStore } from '@netlify/blobs';
export const db = () => getStore({ name: 'mannafish-stations', consistency: 'strong' });
const statusOf = (st) => st.status || (st.open === false ? 'closed' : 'active');
export async function hubs(s) { const { blobs } = await s.list({ prefix: 's/' }), out = [];
  for (const b of blobs) { const st = await s.get(b.key, { type: 'json' }); if (st && st.id !== 'anywhere') { st.status = statusOf(st); out.push(st); } } return out; }
export async function settings(s) { const c = (await s.get('hm/cfg', { type: 'json' })) || {}; return { ...DEFAULTS, ...c, auto: { ...DEFAULTS.auto, ...(c.auto || {}) } }; }
export async function infoOf(s, st, now = Date.now()) {
  const c = (await s.get('c/' + st.id, { type: 'json' })) || { total: 0, fish: {}, words: {} };
  const top = Object.entries(c.fish || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => ({ word: (c.words || {})[k.split('|')[0]] || k.split('|')[0].slice(2), n }));
  const arrived = (st.stock || []).filter((x) => x.status === 'in' && now - Date.parse(x.at || 0) < 32 * 86400000).map((x) => ({ word: x.word, kind: x.kind, qty: x.qty }));
  return { loves: c.total || 0, top, arrived };
}
// every email sent is written down (newest first in the admin page)
export async function logSend(s, entry) { const at = new Date().toISOString(), id = at.replace(/[^0-9]/g, '') + Math.random().toString(36).slice(2, 6);
  await s.setJSON('hm/log/' + id, { id, at, ...entry }); }
const day = (now) => new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
// every morning (hub-mail-daily.mjs): the restock check when it is due, the monthly note on the 1st, a welcome for a new Hub
export async function runAuto(now = new Date()) {
  const s = db(), C = await settings(s), d = day(now), first = d.getDate() === 1, month = periodOf(now).key, out = [];
  for (const st of await hubs(s)) {
    if (st.status !== 'active' || !st.owner || st.mailOff) continue;
    let did = null;
    let noCatch = false;
    // a welcome only for a Hub opened in the last week (the Hubs already open when this began are not welcomed again)
    if (C.auto.welcome && !st.welcomed && st.opened && now - Date.parse(st.opened) < 7 * 86400000) { did = 'welcome'; st.welcomed = now.toISOString(); st.lastCheck = st.lastCheck || now.toISOString(); }
    else if (C.auto.monthly && first && st.lastMonthly !== month) {
      const q = (d.getMonth() % 3) === 0;   // a Hub that chose its Catch each quarter is asked on the quarter's first month only
      did = 'monthly'; st.lastMonthly = month; st.lastCheck = now.toISOString(); noCatch = st.catchEvery === 'off' || (st.catchEvery === 'quarter' && !q);
    } else if (C.auto.restock) {
      const every = Math.max(3, Number(st.restockDays) || C.restockDays || 21), since = Date.parse(st.lastCheck || st.opened || st.created || 0) || 0;
      if (now - since >= every * 86400000) { did = 'restock'; st.lastCheck = now.toISOString(); }
    }
    if (!did) continue;
    try { const info = did === 'monthly' ? await infoOf(s, st, +now) : null;
      const r = await sendTo(st, did, { info, now, noCatch }); await s.setJSON('s/' + st.id, st);
      if (r.sent) { await logSend(s, { kind: did, auto: true, subject: r.subject, to: [{ id: st.id, name: st.name, email: st.owner }] }); out.push(st.id + ':' + did); } }
    catch (e) { out.push(st.id + ':error'); }
  }
  return out;
}
