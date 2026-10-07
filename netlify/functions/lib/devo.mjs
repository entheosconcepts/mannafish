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
const SITE = () => (process.env.URL || 'https://manna-fish.com').replace(/\/$/, '');
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
  const es = lang === 'es', f = FISH[es ? 'es' : 'en'][m.key];
  const word = es ? (ES.titles[m.key] || m.title) : m.title;
  const mm = m.ref.match(/^(.*?)\s+(\d+:\d+.*)$/);
  const ref = es && mm ? (ES.books[mm[1]] || mm[1]) + ' ' + mm[2] : m.ref;
  const read = SITE() + m.url + (es ? '&lang=es' : '');
  const img = SITE() + (es ? '/w/img/es/' + m.key.toLowerCase() + '.jpg' : '/w/img/' + m.key.toLowerCase() + '.png');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = es
    ? { sub: 'MannaFish de hoy: ' + word, hello: opts.welcome ? '¡Bienvenido! Tu primer MannaFish:' : 'La palabra de hoy', today: 'El versículo de hoy', read: 'Leer el capítulo', fish: 'El versículo del pez', why: 'Recibes esto porque te suscribiste en manna-fish.com.', stop: 'Cancelar suscripción' }
    : { sub: 'Today’s MannaFish: ' + word, hello: opts.welcome ? 'Welcome! Your first MannaFish:' : 'Today’s word', today: 'Today’s verse', read: 'Read the chapter', fish: 'The verse on the fish', why: 'You are getting this because you signed up at manna-fish.com.', stop: 'Unsubscribe' };
  const snippet = es ? '' : ' — “' + m.snippet + '”';
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Georgia,serif;color:#14181d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:#000;padding:14px 20px;font:bold 22px Arial,sans-serif;color:#fff">Manna<span style="color:#2a5fb0">Fish</span></td></tr>
<tr><td style="padding:20px 22px 6px;font:13px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">${esc(T.hello)}</td></tr>
<tr><td style="padding:0 22px;font:bold 34px Georgia,serif">${esc(word)}</td></tr>
<tr><td style="padding:14px 22px"><img src="${img}" width="516" alt="${esc(word)}" style="width:100%;max-width:516px;height:auto;border-radius:6px;display:block;background:#000"></td></tr>
<tr><td style="padding:4px 22px 0;font:13px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">${esc(T.today)}</td></tr>
<tr><td style="padding:6px 22px 0;font:19px/1.5 Georgia,serif"><b>${esc(ref)}</b>${esc(snippet)}</td></tr>
<tr><td style="padding:16px 22px"><a href="${read}" style="display:inline-block;background:#2a5fb0;color:#fff;text-decoration:none;font:bold 15px Arial,sans-serif;padding:11px 20px;border-radius:999px">${esc(T.read)}</a></td></tr>
<tr><td style="padding:6px 22px 0;font:13px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">${esc(T.fish)}</td></tr>
<tr><td style="padding:6px 22px 20px;font:italic 17px/1.5 Georgia,serif">“${esc(f.top)} ${esc(f.bottom)}”<br><span style="font-style:normal;font-size:14px;color:#6b7280">${esc(f.ref)}</span></td></tr>
<tr><td style="padding:14px 22px 20px;border-top:1px solid #eee;font:12px/1.6 Arial,sans-serif;color:#6b7280">${esc(T.why)} <a href="${unsub}" style="color:#6b7280">${esc(T.stop)}</a><br>${esc(ADDRESS())}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${T.hello}: ${word}\n\n${T.today}: ${ref}${snippet}\n${T.read}: ${read}\n\n${T.fish}: “${f.top} ${f.bottom}” ${f.ref}\n\n${T.why}\n${T.stop}: ${unsub}\n${ADDRESS()}`;
  return { subject: T.sub, html, text };
}

export async function deliver(rec, m, opts) {
  const unsub = await unsubUrl(rec.email);
  const e = emailFor(m, rec.lang, unsub, opts);
  return sendMail({ to: rec.email, name: rec.name, subject: e.subject, html: e.html, text: e.text, tag: 'devotional',
    headers: { 'List-Unsubscribe': '<' + unsub + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}

// save or update a sign-up; returns { rec, isNew }
export async function subscribe(f, now = new Date()) {
  const by = f['send-by'] === 'Text' ? 'Text' : 'Email';
  const email = String(f.email || '').trim().slice(0, 200), phone = String(f.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  if (by === 'Email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('email');
  if (by === 'Text' && phone.replace(/\D/g, '').length < 10) throw new Error('phone');
  const key = by === 'Email' ? idFor(email) : 'text/' + createHash('sha256').update(phone).digest('hex').slice(0, 40);
  const s = store(), old = await s.get(key, { type: 'json' });
  const rec = { ...(old || {}), by, email, phone, name: String(f.name || '').slice(0, 120),
    freq: FREQS.includes(f['how-often']) ? f['how-often'] : 'Daily',
    tz: validTz(f['time-zone']) ? f['time-zone'] : DEFAULT_TZ, lang: f.language === 'es' ? 'es' : 'en',
    form: f['form-name'] || '', unsub: false, at: (old && old.at) || now.toISOString(), updated: now.toISOString() };
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
