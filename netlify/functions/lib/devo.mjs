// Email devotional subscribers, kept in this site's own Netlify Blobs store (like the phone
// notifications). Daily = every gathering day (Sunday–Friday, Saturday is rest);
// Weekly = Sundays; Monthly = the first Sunday of the month. All at 7am where the person is.
// Text sign-ups are kept too, and start receiving once texting is set up.
import { getStore } from '@netlify/blobs';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { localNow, todaysManna, SEND_HOUR, DEFAULT_TZ, validTz } from './manna.mjs';
import { sendMail } from './mail.mjs';
import FISH from './fishlines.json';
import ES from './es.json';

export const store = () => getStore('mannafish-devo');
export const idFor = (email) => 'sub/' + createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex').slice(0, 40);
// Ken, 9 Oct: the links in an email go back to the site the person signed up on (the test site while testing,
// manna-fish.com once live). MF_LINK_URL in Netlify overrides it for everyone.
let LINK = null;
const SITE = () => (process.env.MF_LINK_URL || LINK || process.env.URL || 'https://manna-fish.com').replace(/\/$/, '');
export function siteOf(origin) { try { const u = new URL(origin);
  return u.protocol === 'https:' && /(^|\.)(manna-fish\.com|netlify\.app)$/.test(u.hostname) ? u.origin : null; } catch (e) { return null; } }
const ADDRESS = () => process.env.MF_MAIL_ADDRESS || 'MannaFish · Yadah Collaborative · 4563 Technology Dr, Unit 6, Wilmington, NC 28405';
const FREQS = ['Daily', 'Weekly', 'Monthly'];

async function secret() {
  const s = store(); let k = await s.get('unsub-secret');
  if (!k) { k = randomBytes(24).toString('hex'); await s.set('unsub-secret', k); }
  return k;
}
export async function tokenFor(email) { return createHmac('sha256', await secret()).update(String(email).trim().toLowerCase()).digest('hex').slice(0, 32); }
export async function unsubUrl(email) { return SITE() + '/api/devo-unsubscribe?e=' + encodeURIComponent(email) + '&t=' + await tokenFor(email); }

// a word on a day: the day's verse, and the verse on the fish
export function emailFor(m, lang, unsub, opts = {}) {
  const keep = LINK; if (opts.site) LINK = opts.site;
  const es = lang === 'es', f = FISH[es ? 'es' : 'en'][m.key];
  const word = es ? (ES.titles[m.key] || m.title) : m.title;
  const mm = m.ref.match(/^(.*?)\s+(\d+:\d+.*)$/);
  const ref = es && mm ? (ES.books[mm[1]] || mm[1]) + ' ' + mm[2] : m.ref;
  const read = SITE() + m.url + (es ? '&lang=es' : '');
  const img = SITE() + (es ? '/w/img/es/' + m.key.toLowerCase() + '.jpg' : '/w/img/' + m.key.toLowerCase() + '.png');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = es
    ? { sub: 'MannaFish de hoy: ' + word, hello: opts.welcome ? '¡Bienvenido! Tu primer MannaFish:' : 'La palabra de hoy', today: 'El versículo de hoy', read: 'Leer el capítulo', listen: 'Escuchar', fish: 'El versículo del pez', why: 'Recibes esto porque te suscribiste en manna-fish.com.', stop: 'Cancelar suscripción' }
    : { sub: 'Today’s MannaFish: ' + word, hello: opts.welcome ? 'Welcome! Your first MannaFish:' : 'Today’s word', today: 'Today’s verse', read: 'Read the chapter', listen: 'Listen', fish: 'The verse on the fish', why: 'You are getting this because you signed up at manna-fish.com.', stop: 'Unsubscribe' };
  const snippet = es ? '' : ' — “' + m.snippet + '”';
  // Ken, 9 Oct: the email in the site's own look -- black, white lettering, MannaFish blue, the logo in its own font
  const logo = SITE() + '/w/img/logo-email.png';
  const lab = 'font:bold 12px Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#4a7fd6';
  // Ken, 9 Oct: always black, in every mail app and in both light and dark mode (bgcolor for the apps that ignore styles)
  // Listen opens the day's fish on the site, the same as Read the chapter, and starts reading the verse aloud
  const listen = read + '&listen=1';
  const btn = 'display:inline-block;color:#ffffff;text-decoration:none;font:bold 16px Arial,sans-serif;padding:13px 26px;border-radius:999px;margin:4px 5px';
  const html = `<!doctype html><html style="background:#000"><head><meta charset="utf-8"><meta name="color-scheme" content="only dark"><meta name="supported-color-schemes" content="dark">
<style>:root{color-scheme:only dark}body,table,td{background-color:#000000 !important}u + .body,[data-ogsc] body{background:#000 !important}</style></head>
<body class="body" bgcolor="#000000" style="margin:0;padding:0;background:#000000;font-family:Georgia,serif;color:#eaf0f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background:#000000"><tr><td align="center" bgcolor="#000000" style="padding:20px 10px;background:#000000">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="max-width:560px;background:#000000;border:1px solid #1f2a33;border-radius:14px;overflow:hidden">
<tr><td align="center" style="background:#000;padding:22px 20px 18px;border-bottom:1px solid #1f2a33"><a href="${SITE()}${es ? '/?lang=es' : '/'}" style="text-decoration:none"><img src="${logo}" width="200" alt="MannaFish" style="width:200px;height:auto;display:block;border:0;color:#fff;font:bold 26px Arial,sans-serif"></a></td></tr>
<tr><td align="center" style="padding:24px 22px 4px;${lab}">${esc(T.hello)}</td></tr>
<tr><td style="padding:16px 18px"><a href="${read}" style="text-decoration:none"><img src="${img}" width="524" alt="${esc(word)}" style="width:100%;max-width:524px;height:auto;border-radius:8px;display:block;background:#000;border:1px solid #1f2a33"></a></td></tr>
<tr><td align="center" style="padding:6px 22px 0;${lab}">${esc(T.today)}</td></tr>
<tr><td align="center" style="padding:8px 26px 0;font:19px/1.55 Georgia,serif;color:#eaf0f0"><b style="color:#ffffff">${esc(ref)}</b>${esc(snippet)}</td></tr>
<tr><td align="center" style="padding:18px 16px 22px"><a href="${listen}" style="${btn};background:#2a5fb0">&#9654;&#xFE0E;&nbsp; ${esc(T.listen)}</a><a href="${read}" style="${btn};background:#000000;border:1px solid #4a7fd6">${esc(T.read)}</a></td></tr>
<tr><td align="center" style="padding:16px 22px 0;border-top:1px solid #1f2a33;${lab}">${esc(T.fish)}</td></tr>
<tr><td align="center" style="padding:8px 26px 22px;font:italic 17px/1.55 Georgia,serif;color:#c6d2d4">“${esc(f.top)} ${esc(f.bottom)}”<br><span style="font:normal 13px Arial,sans-serif;color:#8a9aa0">${esc(f.ref)}</span></td></tr>
<tr><td align="center" style="padding:16px 22px 22px;border-top:1px solid #1f2a33;font:12px/1.7 Arial,sans-serif;color:#8a9aa0">${esc(T.why)} <a href="${unsub}" style="color:#8a9aa0">${esc(T.stop)}</a> · <a href="${SITE()}/privacy/" style="color:#8a9aa0">${es ? 'Privacidad' : 'Privacy'}</a><br>${esc(ADDRESS())}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${T.hello.replace(/:$/, '')}: ${word}\n\n${T.today}: ${ref}${snippet}\n${T.listen}: ${listen}\n${T.read}: ${read}\n\n${T.fish}: “${f.top} ${f.bottom}” ${f.ref}\n\n${T.why}\n${T.stop}: ${unsub}\n${ADDRESS()}`;
  LINK = keep;
  return { subject: T.sub, html, text };
}

export async function deliver(rec, m, opts) {
  LINK = rec.site || null;
  const unsub = await unsubUrl(rec.email);
  const e = emailFor(m, rec.lang, unsub, opts); LINK = null;
  return sendMail({ to: rec.email, name: rec.name, subject: e.subject, html: e.html, text: e.text, tag: 'devotional',
    headers: { 'List-Unsubscribe': '<' + unsub + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}

// save or update a sign-up; returns { rec, isNew }
export async function subscribe(f, now = new Date(), site = null) {
  const by = f['send-by'] === 'Text' ? 'Text' : 'Email';
  const email = String(f.email || '').trim().slice(0, 200), phone = String(f.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  if (by === 'Email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('email');
  if (by === 'Text' && phone.replace(/\D/g, '').length < 10) throw new Error('phone');
  const key = by === 'Email' ? idFor(email) : 'text/' + createHash('sha256').update(phone).digest('hex').slice(0, 40);
  const s = store(), old = await s.get(key, { type: 'json' });
  const rec = { ...(old || {}), by, email, phone, name: String(f.name || '').slice(0, 120),
    freq: FREQS.includes(f['how-often']) ? f['how-often'] : 'Daily',
    tz: validTz(f['time-zone']) ? f['time-zone'] : DEFAULT_TZ, lang: f.language === 'es' ? 'es' : 'en',
    form: f['form-name'] || '', site: site || (old && old.site) || null, unsub: false, at: (old && old.at) || now.toISOString(), updated: now.toISOString() };
  await s.setJSON(key, rec);
  return { rec, key, isNew: !old || old.unsub };
}

// is today one of this person's days?
export function dueToday(freq, here) {
  if (freq === 'Weekly') return here.dow === 0;
  if (freq === 'Monthly') return here.dow === 0 && +here.date.slice(8, 10) <= 7;
  return true;
}

// run every hour: email everyone for whom it is now 7am or later today and who has not had today's yet
export async function sendDue(now = new Date()) {
  const s = store(); const { blobs } = await s.list({ prefix: 'sub/' });
  let sent = 0, failed = 0, skipped = 0;
  for (const b of blobs) {
    const rec = await s.get(b.key, { type: 'json' });
    if (!rec || rec.unsub || rec.by !== 'Email') { skipped++; continue; }
    const tz = rec.tz || DEFAULT_TZ, here = localNow(now, tz);
    if (here.hour < SEND_HOUR || rec.lastSent === here.date || !dueToday(rec.freq, here)) { skipped++; continue; }
    const m = todaysManna(now, tz);
    if (!m) { skipped++; continue; }
    try { await deliver(rec, m); sent++; await s.setJSON(b.key, { ...rec, lastSent: here.date }); }
    catch (e) { failed++; console.log('devo email failed', b.key, String(e).slice(0, 200)); }
  }
  return { sent, failed, skipped, total: blobs.length };
}
