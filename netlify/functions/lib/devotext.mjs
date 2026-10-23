// The devotional by text (Ken, 23 Oct: "i want people to get the devotional by text").
// Text sign-ups are kept with the email ones (mannafish-devo, keys text/...). A new one gets one text asking them to reply YES;
// after YES, the same devotional as the email comes as a short text at 7am where they are: the fish of the day with the words on
// it and a link to read and listen (Daily: Sunday to Friday, two on Friday; Weekly: Sundays; Monthly: the first Sunday). Nothing
// on the Sabbath. STOP ends it; anything else they text back (a prayer request) is emailed to MannaFish.
import { store, dueToday } from './devo.mjs';
import { localNow, todaysManna, welcomeManna, todaysCatch, welcomeCatch, sabbathRest, SEND_HOUR, DEFAULT_TZ } from './manna.mjs';
import { sendSms, e164, DEAD } from './sms.mjs';
import WORDS from './words.json';
import FISH from './fishlines.json';
import ES from './es.json';

const SITE = (site) => (process.env.MF_LINK_URL || site || process.env.URL || 'https://manna-fish.com').replace(/\/$/, '');
const weekly = (freq) => freq === 'Weekly' || freq === 'Monthly';
const refEs = (r) => { const m = String(r).match(/^(.*?)\s+(\d+:\d+.*)$/); return m ? (ES.books[m[1]] || m[1]) + ' ' + m[2] : r; };

// one devotional text  (m: todaysCatch for Daily, todaysManna for Weekly and Monthly)
export function textFor(m, { lang = 'en', freq = 'Daily', site = null, welcome = false } = {}) {
  const es = lang === 'es', base = SITE(site), L = es ? '&lang=es' : '';
  const word = (k) => (es ? ES.titles[k] : null) || WORDS.words[k].title;
  const fish = (k, url) => { const f = FISH[es ? 'es' : 'en'][k]; return `"${f.top} ${f.bottom}" ${f.ref}\n${base}${url}${L}`; };
  const stop = es ? 'Responda STOP para cancelar.' : 'Reply STOP to end.';
  if (!weekly(freq)) {
    const two = m.second;
    const head = welcome
      ? (es ? `¡Bienvenido a MannaFish! Su primera palabra: ${word(m.key)}` : `Welcome to MannaFish! Your first word: ${word(m.key)}`)
      : two ? (es ? `MannaFish: porción doble hoy: ${word(m.key)} y ${word(two.key)}` : `MannaFish: a double portion today: ${word(m.key)} and ${word(two.key)}`)
      : (es ? `MannaFish: la palabra de hoy es ${word(m.key)}` : `MannaFish: today's word is ${word(m.key)}`);
    return [head, fish(m.key, m.url), two ? fish(two.key, two.url) : '', stop].filter(Boolean).join('\n');
  }
  const head = welcome
    ? (es ? `¡Bienvenido a MannaFish! La palabra de esta semana: ${word(m.key)}` : `Welcome to MannaFish! This week's word: ${word(m.key)}`)
    : (es ? `MannaFish: la palabra de esta semana es ${word(m.key)} (día ${m.day} de ${m.days})` : `MannaFish: this week's word is ${word(m.key)} (day ${m.day} of ${m.days})`);
  const verse = es ? refEs(m.ref) : `"${m.snippet}" ${m.ref}`;
  return [head, verse, base + m.url + L, stop].join('\n');
}
// today's (or, on the Sabbath, the next) devotional for this person
export function todayFor(rec, now = new Date()) { const tz = rec.tz || DEFAULT_TZ; return weekly(rec.freq) ? todaysManna(now, tz) : todaysCatch(now, tz); }
export function welcomeFor(rec, now = new Date()) { const tz = rec.tz || DEFAULT_TZ; return weekly(rec.freq) ? welcomeManna(now, tz) : welcomeCatch(now, tz); }

// the one text that asks them to say yes (the phone companies require it)
export function confirmText(rec) {
  const es = rec.lang === 'es';
  const how = es ? { Daily: 'diario, de domingo a viernes', Weekly: 'semanal, los domingos', Monthly: 'mensual, el primer domingo' }
                 : { Daily: 'daily, Sunday to Friday', Weekly: 'weekly, on Sundays', Monthly: 'monthly, the first Sunday' };
  return es
    ? `MannaFish: responda SÍ para recibir el devocional gratuito de MannaFish por mensaje de texto (${how[rec.freq] || how.Daily}). Pueden aplicarse tarifas de mensajes y datos. Responda HELP para ayuda, STOP para cancelar.`
    : `MannaFish: reply YES to get the free MannaFish devotional by text (${how[rec.freq] || how.Daily}). Msg & data rates may apply. Reply HELP for help, STOP to cancel.`;
}
export const HELP_TEXT = 'MannaFish devotional: a free Bible verse by text, up to 2 msgs/day. Msg & data rates may apply. Reply STOP to cancel. Help: 2fish@manna-fish.com or manna-fish.com/privacy';

export async function askConfirm(key, rec, now = new Date()) {
  await sendSms(rec.phone, confirmText(rec));
  const r = { ...rec, smsAsked: now.toISOString() }; await store().setJSON(key, r); return r;
}

// every text sign-up for this number (one person may have signed up more than once)
export async function findByPhone(phone) {
  const want = e164(phone), s = store(), out = [];
  if (!want) return out;
  const { blobs } = await s.list({ prefix: 'text/' });
  for (const b of blobs) { const rec = await s.get(b.key, { type: 'json' }); if (rec && e164(rec.phone) === want) out.push({ key: b.key, rec }); }
  out.sort((a, b) => String(b.rec.updated || b.rec.at || '').localeCompare(String(a.rec.updated || a.rec.at || '')));
  return out;
}
export async function stopAll(phone, why, now = new Date()) {
  for (const { key, rec } of await findByPhone(phone)) if (!rec.unsub) await store().setJSON(key, { ...rec, unsub: true, unsubAt: now.toISOString(), unsubWhy: why });
}

// they replied YES: texts start; the first one now (or after the Sabbath)  -> the reply to send back
export async function confirm(phone, now = new Date()) {
  const all = await findByPhone(phone); if (!all.length) return null;
  const { key, rec } = all[0], tz = rec.tz || DEFAULT_TZ, here = localNow(now, tz);
  for (const o of all.slice(1)) if (!o.rec.unsub) await store().setJSON(o.key, { ...o.rec, unsub: true, merged: key });
  const es = rec.lang === 'es', r = { ...rec, unsub: false, smsOk: now.toISOString(), updated: now.toISOString() };
  if (sabbathRest(now, tz)) {
    await store().setJSON(key, { ...r, welcomeDue: true });
    return es ? '¡Listo! Su primer MannaFish llegará después del día de reposo (el sábado por la noche). Responda STOP para cancelar.'
              : "You're in! Your first MannaFish comes after the Sabbath (Saturday evening). Reply STOP to end.";
  }
  await store().setJSON(key, { ...r, welcomeDue: false, lastSent: here.date });
  return textFor(welcomeFor(rec, now), { lang: rec.lang, freq: rec.freq, site: rec.site, welcome: true });
}

// every hour: ask the new sign-ups (in the daytime), and text everyone for whom it is now 7am or later and who has not had today's yet
export async function sendDueTexts(now = new Date()) {
  const s = store(); const { blobs } = await s.list({ prefix: 'text/' });
  let sent = 0, asked = 0, failed = 0, skipped = 0, stopped = 0, merged = 0;
  const recs = [];
  for (const b of blobs) { const rec = await s.get(b.key, { type: 'json' }); if (rec && !rec.unsub && rec.by === 'Text' && e164(rec.phone)) recs.push({ key: b.key, rec }); else skipped++; }
  // one number, one text: the newest sign-up for each number is the one
  const byNum = new Map();
  for (const x of recs) { const n = e164(x.rec.phone); if (!byNum.has(n)) byNum.set(n, []); byNum.get(n).push(x); }
  for (const group of byNum.values()) {
    group.sort((a, b) => String(b.rec.updated || b.rec.at || '').localeCompare(String(a.rec.updated || a.rec.at || '')));
    const k = group[0];
    for (const o of group.slice(1)) {
      if (o.rec.smsOk && !k.rec.smsOk) k.rec.smsOk = o.rec.smsOk;
      if (o.rec.lastSent && (!k.rec.lastSent || o.rec.lastSent > k.rec.lastSent)) k.rec.lastSent = o.rec.lastSent;
      if (o.rec.smsAsked && !k.rec.smsAsked) k.rec.smsAsked = o.rec.smsAsked;
      await s.setJSON(o.key, { ...o.rec, unsub: true, merged: k.key }); merged++;
    }
    if (group.length > 1) await s.setJSON(k.key, k.rec);
    let { key, rec } = k;
    const tz = rec.tz || DEFAULT_TZ, here = localNow(now, tz), rest = sabbathRest(now, tz);
    const fail = async (e, what) => { failed++; console.log('devo text failed', what, key, e.code || '', String(e.message || e).slice(0, 160));
      if (DEAD.has(+e.code)) { await s.setJSON(key, { ...rec, unsub: true, unsubAt: now.toISOString(), unsubWhy: 'twilio ' + e.code }); stopped++; } };
    try {
      if (!rec.smsOk) {   // not said yes yet: ask once, in the daytime and not on the Sabbath
        if (!rec.smsAsked && here.hour >= 9 && here.hour < 20 && !rest) { rec = await askConfirm(key, rec, now); asked++; } else skipped++;
        continue;
      }
      if (rec.welcomeDue && !rest) {
        await sendSms(rec.phone, textFor(welcomeFor(rec, now), { lang: rec.lang, freq: rec.freq, site: rec.site, welcome: true }));
        rec = { ...rec, welcomeDue: false, lastSent: here.date }; await s.setJSON(key, rec); sent++; continue;
      }
      if (here.hour < SEND_HOUR || rec.lastSent === here.date || !dueToday(rec.freq, here)) { skipped++; continue; }
      const m = todayFor(rec, now); if (!m) { skipped++; continue; }
      await sendSms(rec.phone, textFor(m, { lang: rec.lang, freq: rec.freq, site: rec.site }));
      await s.setJSON(key, { ...rec, lastSent: here.date }); sent++;
    } catch (e) { await fail(e, rec.smsOk ? 'daily' : 'ask'); }
  }
  return { sent, asked, failed, stopped, skipped, merged, total: blobs.length };
}
