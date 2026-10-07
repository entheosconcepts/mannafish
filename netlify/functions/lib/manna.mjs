// The manna rhythm (MANNAFISH brief, section 5): each word lasts two weeks; one verse a
// day Sunday to Friday; nothing on Saturday, the Sabbath. Twelve verses per word = two
// weeks of six gathering days. The cycle starts on START (a Sunday) with the first word.
import WORDS from './words.json';
import ES from './es.json';

export const START = Date.UTC(2026, 9, 4); // Sunday 4 Oct 2026

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
  const days = Math.floor((t - START) / 86400000);
  const week = Math.floor(days / 7);
  const n = WORDS.order.length;
  const key = WORDS.order[((Math.floor(week / 2) % n) + n) % n];
  const w = WORDS.words[key];
  const i = (((week % 2) + 2) % 2) * 6 + dow;   // 0..11
  const r = w.refs[i % w.refs.length];
  return {
    key, title: w.title, refIndex: i % w.refs.length, ref: r[0], snippet: r[1],
    friday: dow === 5,
    url: '/?w=' + key.toLowerCase() + '&r=' + (i % w.refs.length)
  };
}

export function notificationFor(m, lang = 'en') {
  if (lang === 'es') {
    const mm = m.ref.match(/^(.*?)\s+(\d+:\d+.*)$/);
    const ref = mm ? (ES.books[mm[1]] || mm[1]) + ' ' + mm[2] : m.ref;
    return {
      title: 'MannaFish de hoy: ' + (ES.titles[m.key] || m.title).toUpperCase(),
      body: ref + ' \u2014 toca para leer.' + (m.friday ? '  \u00b7 Doble porci\u00f3n: lee tambi\u00e9n el vers\u00edculo del pez.' : ''),
      url: m.url + '&lang=es'
    };
  }
  return {
    title: 'Today\u2019s MannaFish: ' + m.title.toUpperCase(),
    body: m.ref + ' \u2014 \u201c' + m.snippet + '\u201d' + (m.friday ? '  \u00b7 A double portion: read the verse on the fish too.' : ''),
    url: m.url
  };
}
