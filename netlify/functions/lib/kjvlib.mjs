// The whole KJV on the server (netlify/functions/lib/kjv.json, made by tools/bible/kjv-all.py).
//   verseText('John 3:16') -> the verse (a range 'John 3:16-17' is joined); search('hope') -> [{ref, text}]
import K from './kjv.json';

const BI = {}; K.forEach((b, i) => { BI[b.n.toLowerCase()] = i; });
const ALIAS = { psalms: 'psalm', ps: 'psalm', 'song of songs': 'song of solomon', songs: 'song of solomon' };
export function parseRef(ref) {
  const m = /^\s*((?:[1-3]\s*)?[A-Za-z][A-Za-z ]*?)\s*(\d+)\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?/.exec(String(ref || ''));
  if (!m) return null;
  let n = m[1].toLowerCase().replace(/\s+/g, ' ').replace(/^(\d)\s/, '$1 '); n = ALIAS[n] || n;
  const bi = BI[n]; if (bi == null) return null;
  return { b: bi, c: +m[2], v1: +m[3], v2: +(m[4] || m[3]) };
}
export function verseText(ref) {
  const p = parseRef(ref); if (!p) return '';
  const ch = (K[p.b].c[p.c - 1]) || []; const out = [];
  for (let v = p.v1; v <= Math.min(p.v2, p.v1 + 30); v++) if (ch[v - 1]) out.push(ch[v - 1]);
  return out.join(' ');
}
export const norm = (s) => String(s || '').toLowerCase().replace(/[“”"‘’]/g, '').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
// every verse with the word in it (whole word, a few endings allowed), spread evenly through the Bible when there are many
export function search(q, max = 40) {
  const w = String(q || '').toLowerCase().replace(/[^a-z' -]/g, '').trim(); if (w.length < 2) return { total: 0, results: [] };
  const re = new RegExp("(^|[^a-z'])" + w.replace(/[-' ]+/g, "[-' ]+") + "(s|es|ed|d|ing|eth|est|th)?($|[^a-z'])", 'i');
  const all = [];
  K.forEach((b) => b.c.forEach((ch, ci) => ch.forEach((t, vi) => { if (t && t.length <= 260 && re.test(t)) all.push({ ref: `${b.n} ${ci + 1}:${vi + 1}`, text: t }); })));
  if (all.length <= max) return { total: all.length, results: all };
  const step = all.length / max, out = []; for (let i = 0; i < max; i++) out.push(all[Math.floor(i * step)]);
  return { total: all.length, results: out };
}
