// Email devotional subscribers, kept in this site's own Netlify Blobs store (like the phone
// notifications). Daily = every gathering day (Sunday–Friday, Saturday is rest): the same fish all week,
// the next two verses from the back of the decal each day; Weekly = Sundays (the week's fish; the devotional
// on the site picks up where the person left off); Monthly = the first Sunday of the month. All at 7am where the person is.
// Text sign-ups are kept too, and start receiving once texting is set up.
import { getStore } from '@netlify/blobs';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { localNow, todaysManna, welcomeManna, sabbathRest, SEND_HOUR, DEFAULT_TZ, validTz } from './manna.mjs';
import WORDS from './words.json';
import { sendMail } from './mail.mjs';
import FISH from './fishlines.json';
import ES from './es.json';
import IMG from './email-img.json';

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
  const refEs = (r) => { const mm = r.match(/^(.*?)\s+(\d+:\d+.*)$/); return es && mm ? (ES.books[mm[1]] || mm[1]) + ' ' + mm[2] : r; };
  const ref = refEs(m.ref);
  const refs = (m.refs || [{ ref: m.ref, snippet: m.snippet, url: m.url }]).map((x) => ({ ref: refEs(x.ref), snip: es ? '' : ' — “' + x.snippet + '”', url: SITE() + x.url + (es ? '&lang=es' : '') }));
  const read = SITE() + m.url + (es ? '&lang=es' : '');
  const img = SITE() + (es ? '/w/img/es/' + m.key.toLowerCase() + '.jpg' : '/w/img/' + m.key.toLowerCase() + '.png');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = es
    ? { dbl: 'Tu porción doble', dblNote: 'En el sexto día recogieron doble porción (Éxodo 16:22). El versículo de hoy, y uno para el día de reposo.', sab: 'Para el día de reposo', sabRead: 'Leerlo', sabSub: ' · porción doble',
        sub: 'MannaFish de hoy: ' + word, hello: opts.welcome ? '¡Bienvenido! Tu primer MannaFish:' : 'La palabra de hoy', today: 'El versículo de hoy', read: 'Leer el capítulo', listen: 'Ver el MannaFish de hoy', fish: 'El versículo del pez', why: 'Recibes esto porque te suscribiste en manna-fish.com.', stop: 'Cancelar suscripción' }
    : { dbl: 'Your double portion', dblNote: 'On the sixth day they gathered twice as much (Exodus 16:22). Today’s verse, and one for the Sabbath.', sab: 'For the Sabbath', sabRead: 'Read it', sabSub: ' · a double portion',
        sub: 'Today’s MannaFish: ' + word, hello: opts.welcome ? 'Welcome! Your first MannaFish:' : 'Today’s word', today: 'Today’s verse', read: 'Read the chapter', listen: 'See today’s MannaFish', fish: 'The verse on the fish', why: 'You are getting this because you signed up at manna-fish.com.', stop: 'Unsubscribe' };
  const snippet = es ? '' : ' — “' + m.snippet + '”';
  // Ken, 13 Oct: one fish a week -- which day of the week's fish this is; the weekly email says the site picks up where they left off
  const dayLine = m.day ? (es ? `Día ${m.day} de ${m.days} con ${word}` : `Day ${m.day} of ${m.days} with ${word}`) : '';
  const weekNote = opts.weekly ? (es ? 'Tu pez para esta semana. Abre el devocional cualquier día: continúa donde lo dejaste.' : 'Your fish for this week. Open the devotional any day: it picks up where you left off.') : '';
  // Ken, 9 Oct: the email in the site's own look -- black, white lettering, MannaFish blue, the logo in its own font
  const logo = SITE() + '/w/img/logo-email.png';
  // Ken, 9 Oct: no audio from the email (it felt invasive) -- this button opens the day's fish on the site
  const listen = SITE() + '/?w=' + m.key.toLowerCase() + (es ? '&lang=es' : '');
  // Ken, 11 Oct: Friday is a double portion (Exodus 16:22, 29) -- today's verse, and the verse on the fish for the Sabbath
  const dbl = !!m.friday;
  const fishIdx = WORDS.words[m.key].refs.findIndex((r) => r[0] === FISH.en[m.key].ref);
  const sabLink = SITE() + '/?w=' + m.key.toLowerCase() + (fishIdx >= 0 ? '&r=' + fishIdx : '') + (es ? '&lang=es' : '');
  // Ken, 11 Oct: Gmail on iPhone (dark mode) flips an email's colours -- black turned white. It leaves pictures alone,
  // so the black is a background picture, the blue headings and the buttons are pictures (tools/email-img), the
  // white lettering goes through Gmail's blend-mode fix (gw), and the grey borders are gone.
  // Ken, 11 Oct: no "Today's word" or "Today's verse" headings -- the fish, then the verse
  const P = SITE() + '/w/img/email/', L = es ? 'es' : 'en';
  const BG = `background-color:#000000;background-image:url(${P}bk.png);`;
  const td = (style, inner, align = 'center') => `<tr><td bgcolor="#000000" align="${align}" style="${BG}${style}">${inner}</td></tr>`;
  const gw = (t) => `<div class="gmail-screen"><div class="gmail-diff">${t}</div></div>`;
  const pic = (k, alt, css) => { const [w, h] = IMG[L + '-' + k] || [200, 18];
    return `<img src="${P}${L}-${k}.png" width="${w}" height="${h}" alt="${esc(alt)}" style="border:0;${css}">`; };
  const head = (k, alt) => pic(k, alt, 'display:block;margin:0 auto;color:#2a5fb0;font:900 15px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase');
  const button = (href, k, alt) => `<a href="${href}" style="display:inline-block;margin:5px;text-decoration:none">${pic(k, alt, 'display:inline-block;vertical-align:middle;color:#ffffff;font:bold 16px Arial,sans-serif')}</a>`;
  const rule = td('padding:0 22px;font-size:0;line-height:0', `<img src="${P}rule.png" width="516" height="1" alt="" style="display:block;width:100%;height:1px;border:0">`);
  const html = `<!doctype html><html style="background:#000"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="only dark"><meta name="supported-color-schemes" content="dark">
<style>:root{color-scheme:only dark}body,table,td{background-color:#000000 !important}u + .body .gmail-screen{background:#000;mix-blend-mode:screen}u + .body .gmail-diff{background:#000;mix-blend-mode:difference}</style></head>
<body class="body" bgcolor="#000000" style="margin:0;padding:0;${BG}font-family:Georgia,serif;color:#eaf0f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="${BG}"><tr><td align="center" bgcolor="#000000" style="padding:20px 10px;${BG}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="max-width:560px;${BG}">
${td('padding:22px 20px 18px', `<a href="${SITE()}${es ? '/?lang=es' : '/'}" style="text-decoration:none"><img src="${logo}" width="200" alt="MannaFish" style="width:200px;height:auto;display:block;border:0;color:#fff;font:bold 26px Arial,sans-serif"></a>`)}
${rule}
${opts.welcome ? td('padding:24px 22px 4px', head('welcome', T.hello)) : ''}
${td('padding:16px 18px', `<a href="${read}" style="text-decoration:none"><img src="${img}" width="524" alt="${esc(word)}" style="width:100%;max-width:524px;height:auto;border-radius:8px;display:block;border:0"></a>`, 'left')}
${dbl ? td('padding:6px 22px 0', pic('dbl', T.dbl, 'display:block;margin:0 auto;color:#2a5fb0;font:900 19px Arial,sans-serif')) + '\n'
  + td('padding:6px 30px 14px;font:italic 15px/1.55 Georgia,serif;color:#c6d2d4', gw(esc(T.dblNote))) : ''}
${dayLine ? td('padding:4px 26px 0;font:bold 13px/1.5 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8fb3e8', gw(esc(dayLine))) : ''}
${weekNote ? td('padding:4px 26px 0;font:italic 15px/1.55 Georgia,serif;color:#c6d2d4', gw(esc(weekNote))) : ''}
${refs.map((x) => td('padding:8px 26px 0;font:19px/1.55 Georgia,serif;color:#eaf0f0', gw(`<a href="${x.url}" style="color:#ffffff;text-decoration:none"><b style="color:#ffffff">${esc(x.ref)}</b></a>${esc(x.snip)}`))).join('\n')}
${td('padding:16px 12px 20px;font-size:0', button(listen, 'listen', T.listen) + button(read, 'read', T.read))}
${rule}
${td('padding:16px 22px 0', head(dbl ? 'sab' : 'fish', dbl ? T.sab : T.fish))}
${td(`padding:8px 26px ${dbl ? '0' : '22px'};font:${dbl ? 'normal 19px/1.55' : 'italic 17px/1.55'} Georgia,serif;color:${dbl ? '#eaf0f0' : '#c6d2d4'}`,
  gw(`“${esc(f.top)} ${esc(f.bottom)}”<br><span style="font:${dbl ? 'bold 15px' : 'normal 13px'} Arial,sans-serif;color:${dbl ? '#ffffff' : '#8a9aa0'}">${esc(f.ref)}</span>`))}
${dbl ? td('padding:16px 12px 24px;font-size:0', button(sabLink, 'sabread', T.sabRead)) : ''}
${rule}
${td('padding:16px 22px 22px;font:12px/1.7 Arial,sans-serif;color:#8a9aa0', gw(`${esc(T.why)} <a href="${unsub}" style="color:#8a9aa0">${esc(T.stop)}</a> · <a href="${SITE()}/privacy/" style="color:#8a9aa0">${es ? 'Privacidad' : 'Privacy'}</a><br>${esc(ADDRESS())}`))}
</table></td></tr></table></body></html>`;
  const text = `${T.hello.replace(/:$/, '')}: ${word}\n\n${dbl ? T.dbl + ' — ' + T.dblNote + '\n\n' : ''}${dayLine ? dayLine + '\n' : ''}${weekNote ? weekNote + '\n' : ''}${refs.map((x) => T.today + ': ' + x.ref + x.snip + '\n' + x.url).join('\n')}\n${T.listen}: ${listen}\n${T.read}: ${read}\n\n${dbl ? T.sab : T.fish}: “${f.top} ${f.bottom}” ${f.ref}${dbl ? '\n' + T.sabRead + ': ' + sabLink : ''}\n\n${T.why}\n${T.stop}: ${unsub}\n${ADDRESS()}`;
  LINK = keep;
  return { subject: T.sub + (dbl ? T.sabSub : ''), html, text };
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
    if (rec.welcomeDue && !sabbathRest(now, tz)) {
      try { await deliver(rec, welcomeManna(now, tz), { welcome: true }); rec.welcomeDue = false; await s.setJSON(b.key, rec); sent++; }
      catch (e) { failed++; console.log('held welcome failed', b.key, String(e).slice(0, 200)); }
    }
    if (here.hour < SEND_HOUR || rec.lastSent === here.date || !dueToday(rec.freq, here)) { skipped++; continue; }
    const m = todaysManna(now, tz);
    if (!m) { skipped++; continue; }
    try { await deliver(rec, m, { weekly: rec.freq === 'Weekly' }); sent++; await s.setJSON(b.key, { ...rec, lastSent: here.date }); }
    catch (e) { failed++; console.log('devo email failed', b.key, String(e).slice(0, 200)); }
  }
  return { sent, failed, skipped, total: blobs.length };
}
