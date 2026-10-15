// The manna rhythm. Ken, 13 Oct: one fish a week -- the same word Sunday to Friday, going through
// the verses on the back of the decal in order, two a day (twelve verses over six gathering days);
// nothing on Saturday, the Sabbath. (It was one verse a day over two weeks.) The cycle starts on
// START (a Sunday) with the first word.
import WORDS from './words.json';
import ES from './es.json';

export const START = Date.UTC(2026, 9, 11); // Sunday 11 Oct 2026 (Rest)
export const DAYS = 6;   // gathering days in a week

export const DEFAULT_TZ = 'America/New_York';
export const SEND_HOUR = 7;   // 7am in each person's own time zone (Ken, 6 Oct)

export function validTz(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return !!tz; } catch (e) { return false; }
}

// The date and hour where the person is: date as a UTC-midnight timestamp, weekday 0 = Sunday.
export function localNow(now = new Date(), tz = DEFAULT_TZ) {
  if (!validTz(tz)) tz = DEFAULT_TZ;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23'
  }).formatToParts(now).map(x => [x.type, x.value]));
  const t = Date.UTC(+p.year, +p.month - 1, +p.day);
  return { t, dow: new Date(t).getUTCDay(), hour: +p.hour, date: new Date(t).toISOString().slice(0, 10) };
}

// What goes out on a given day where the person is, or null on the Sabbath.
export function todaysManna(now = new Date(), tz = DEFAULT_TZ) {
  const { t, dow } = localNow(now, tz);
  if (dow === 6) return null;
  const wk = Math.floor(Math.floor((t - START) / 86400000) / 7);
  const n = WORDS.order.length;
  const key = WORDS.order[((wk % n) + n) % n];
  const w = WORDS.words[key];
  const refs = dayRefs(w.refs.length, dow).map((i) => ({ i, ref: w.refs[i][0], snippet: w.refs[i][1], url: '/?w=' + key.toLowerCase() + '&r=' + i }));
  // Ken, 15 Oct: the whole week in the email -- each day's date and verses, so "Day 4" makes sense
  const week = [];
  for (let d = 0; d < DAYS; d++) week.push({ day: d + 1, t: t + (d - dow) * 86400000,
    refs: dayRefs(w.refs.length, d).map((i) => ({ i, ref: w.refs[i][0], url: '/?w=' + key.toLowerCase() + '&r=' + i })) });
  return {
    key, title: w.title, day: dow + 1, days: DAYS, refs, week, t,
    refIndex: refs[0].i, ref: refs[0].ref, snippet: refs[0].snippet,
    friday: dow === 5,
    url: refs[0].url
  };
}

// Ken, 16 Oct: "if it's a monthly I would like to see a list of every day of the month" -- each day of the month of t
// (a UTC midnight): its fish and verses; Friday is the double portion, Saturday the Sabbath (no verses)
export function mannaOn(t) {
  const dow = new Date(t).getUTCDay(), wk = Math.floor(Math.floor((t - START) / 86400000) / 7), n = WORDS.order.length;
  const key = WORDS.order[((wk % n) + n) % n], w = WORDS.words[key];
  return { t, dow, key, title: w.title, friday: dow === 5, sabbath: dow === 6,
    refs: dow === 6 ? [] : dayRefs(w.refs.length, dow).map((i) => ({ i, ref: w.refs[i][0], url: '/?w=' + key.toLowerCase() + '&r=' + i })) };
}
export function monthOf(t) {
  const d = new Date(t), y = d.getUTCFullYear(), mo = d.getUTCMonth(), out = [];
  for (let x = Date.UTC(y, mo, 1); new Date(x).getUTCMonth() === mo; x += 86400000) out.push(mannaOn(x));
  return out;
}

// Ken, 16 Oct: "the whole year with links on the email" -- the 52 weeks of the MannaFish year holding t (years run
// from 11 Oct 2026), each week's fish and its Sunday
export function yearOf(t) {
  const wk = Math.floor(Math.floor((t - START) / 86400000) / 7), y = Math.max(0, Math.floor(wk / 52)), n = WORDS.order.length, out = [];
  for (let i = 0; i < 52; i++) { const w = y * 52 + i, key = WORDS.order[((w % n) + n) % n];
    out.push({ n: i + 1, key, title: WORDS.words[key].title, t: START + w * 7 * 86400000, now: w === wk, past: w < wk }); }
  return out;
}

// the verses for day d (0 = Sunday) of a word with c verses, in order: twelve make two a day
export function dayRefs(c, d) { const a = Math.floor(d * c / DAYS), z = Math.floor((d + 1) * c / DAYS), r = []; for (let i = a; i < z; i++) r.push(i); return r; }

// Ken, 11 Oct: welcome emails rest over the Sabbath -- from 6pm Friday until 9pm Saturday where the person is;
// one asked for then is sent at 9pm Saturday, with Sunday's word
export const REST_FROM = 18, REST_UNTIL = 21;
export function sabbathRest(now = new Date(), tz = DEFAULT_TZ) {
  const h = localNow(now, tz); return (h.dow === 5 && h.hour >= REST_FROM) || (h.dow === 6 && h.hour < REST_UNTIL);
}
export function welcomeManna(now = new Date(), tz = DEFAULT_TZ) {
  return todaysManna(now, tz) || todaysManna(new Date(now.getTime() + 86400000), tz);
}

export function notificationFor(m, lang = 'en') {
  if (lang === 'es') {
    const ref = (m.refs || [m]).map((x) => { const mm = x.ref.match(/^(.*?)\s+(\d+:\d+.*)$/); return mm ? (ES.books[mm[1]] || mm[1]) + ' ' + mm[2] : x.ref; }).join(' · ');
    return {
      title: 'MannaFish de hoy: ' + (ES.titles[m.key] || m.title).toUpperCase(),
      body: ref + ' \u2014 toca para leer.' + (m.friday ? '  \u00b7 Porci\u00f3n doble: el vers\u00edculo de hoy y uno para el d\u00eda de reposo.' : ''),
      url: m.url + '&lang=es'
    };
  }
  return {
    title: 'Today\u2019s MannaFish: ' + m.title.toUpperCase(),
    body: (m.refs || [m]).map((x) => x.ref).join(' \u00b7 ') + ' \u2014 \u201c' + m.snippet + '\u201d' + (m.friday ? '  \u00b7 A double portion: today\u2019s verse and one for the Sabbath.' : ''),
    url: m.url
  };
}
