// The manna rhythm (MANNAFISH brief, section 5): each word lasts two weeks; one verse a
// day Sunday to Friday; nothing on Saturday, the Sabbath. Twelve verses per word = two
// weeks of six gathering days. The cycle starts on START (a Sunday) with the first word.
import WORDS from './words.json';

export const START = Date.UTC(2026, 9, 4); // Sunday 4 Oct 2026

// Today's date in Wilmington, as a UTC midnight timestamp, and its weekday (0 = Sunday).
export function easternToday(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(now).map(x => [x.type, x.value]));
  const t = Date.UTC(+p.year, +p.month - 1, +p.day);
  return { t, dow: new Date(t).getUTCDay() };
}

// What goes out on a given day, or null on the Sabbath.
export function todaysManna(now = new Date()) {
  const { t, dow } = easternToday(now);
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

export function notificationFor(m) {
  return {
    title: 'Today’s MannaFish: ' + m.title.toUpperCase(),
    body: m.ref + ' — “' + m.snippet + '”' + (m.friday ? '  · A double portion: read the verse on the fish too.' : ''),
    url: m.url
  };
}
