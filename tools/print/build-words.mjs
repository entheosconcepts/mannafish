// node tools/print/build-words.mjs  -> print/kit/words.json: for every fish word, a word study the sponsor page fills in by itself
//   (Ken, 17 Nov: "they choose the word ... the word study populates automatically").
// Order of trust: a study written and checked by hand (print/study/*.json for BUILD, CAST, REPAIR, TRUST, SEEK) -> the site's own study of the original 24
// -> one made from the Strong's lexicon and concordance in fish-lang/bible/: the Greek and the Hebrew words that the KJV most often renders with this word,
// and four verses that use it (two Old Testament, two New), each cut to the clause around the word (72 letters or fewer).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), BIBLE = path.join(ROOT, 'fish-lang/bible');
const BOOKS = '1_Chronicles 1_Corinthians 1_John 1_Kings 1_Peter 1_Samuel 1_Thessalonians 1_Timothy 2_Chronicles 2_Corinthians 2_John 2_Kings 2_Peter 2_Samuel 2_Thessalonians 2_Timothy 3_John Acts Amos Colossians Daniel Deuteronomy Ecclesiastes Ephesians Esther Exodus Ezekiel Ezra Galatians Genesis Habakkuk Haggai Hebrews Hosea Isaiah James Jeremiah Job Joel John Jonah Joshua Jude Judges Lamentations Leviticus Luke Malachi Mark Matthew Micah Nahum Nehemiah Numbers Obadiah Philemon Philippians Proverbs Psalm Revelation Romans Ruth Song_of_Solomon Titus Zechariah Zephaniah'.split(' ');
const CANON = 'Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth 1_Samuel 2_Samuel 1_Kings 2_Kings 1_Chronicles 2_Chronicles Ezra Nehemiah Esther Job Psalm Proverbs Ecclesiastes Song_of_Solomon Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi Matthew Mark Luke John Acts Romans 1_Corinthians 2_Corinthians Galatians Ephesians Philippians Colossians 1_Thessalonians 2_Thessalonians 1_Timothy 2_Timothy Titus Philemon Hebrews James 1_Peter 2_Peter 1_John 2_John 3_John Jude Revelation'.split(' ');
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
// the fish and their words, read from the same files the site's functions use (lib/catch.json, lib/words.json)
const CATCH = rd(path.join(ROOT, 'netlify/functions/lib/catch.json')), WORDSJ = rd(path.join(ROOT, 'netlify/functions/lib/words.json'));
const FISHLINES = rd(path.join(ROOT, 'netlify/functions/lib/fishlines.json'));
const fishRefOf = (k) => (FISHLINES.en[k] && FISHLINES.en[k].ref) || (CATCH.fish[k] && CATCH.fish[k].ref) || '';
const CATCHORDER = CATCH.order, fishInfo = (k) => WORDSJ.words[k] ? { title: WORDSJ.words[k].title } : (CATCH.fish[k] ? { title: CATCH.fish[k].title } : null);
const chap = {}; const kjv = (b, c) => chap[b + '-' + c] || (chap[b + '-' + c] = (() => { try { return rd(path.join(BIBLE, 'kjv', `${CANON[b]}-${c}.json`)).t; } catch (e) { return []; } })());
const name = (b) => CANON[b].replace(/_/g, ' ').replace(/^(\d) /, '$1 ').replace('Song of Solomon', 'Song of Solomon');
// the lexicon: every Strong's entry with the KJV words that translate it
const LEX = {}; for (const f of fs.readdirSync(path.join(BIBLE, 'lex'))) Object.assign(LEX, rd(path.join(BIBLE, 'lex', f)));
const CONC = {}; const conc = (sn) => { const f = sn[0] + Math.floor(parseInt(sn.slice(1), 10) / 100) * 0; return null; };
const concFor = (sn) => { const m = fs.readdirSync(path.join(BIBLE, 'conc')); return m; };
const stem = (w) => { let s = w.toLowerCase().replace(/[^a-z]/g, ''); for (const suf of ['ing', 'ed', 'es', 'e', 's']) if (s.endsWith(suf) && s.length - suf.length >= 3) { s = s.slice(0, -suf.length); break; } return s; };
const IRREG = { build: ['built'], bring: ['brought'], give: ['gave', 'given'], go: ['went', 'gone'], come: ['came'], find: ['found'], hear: ['heard'], teach: ['taught'], seek: ['sought'], know: ['knew', 'known'], make: ['made'], take: ['took', 'taken'], see: ['saw', 'seen'], keep: ['kept'], leave: ['left'], lead: ['led'], hold: ['held'], sing: ['sang', 'sung'], speak: ['spoke', 'spoken'], stand: ['stood'], think: ['thought'], run: ['ran'], rise: ['rose', 'risen'], arise: ['arose', 'arisen'], fight: ['fought'], feed: ['fed'], eat: ['ate', 'eaten'], drink: ['drank', 'drunk'], sit: ['sat'], lay: ['laid'], say: ['said'], tell: ['told'], send: ['sent'], spend: ['spent'], bear: ['bore', 'borne'], bind: ['bound'], break: ['broke', 'broken'], choose: ['chose', 'chosen'], forgive: ['forgave', 'forgiven'], grow: ['grew', 'grown'], write: ['wrote', 'written'], pay: ['paid'], lose: ['lost'], meet: ['met'], hide: ['hid', 'hidden'], fall: ['fell', 'fallen'], flee: ['fled'], draw: ['drew', 'drawn'] };
const formsOf = (word) => { const w = word.toLowerCase(), st = stem(w), suf = st.length >= 4 ? 'e|s|es|ed|d|ing|eth|est|er|ers' : 'e|s|es|ed|ing|eth|est'; return `\\b(?:${st}(?:${suf})?${(IRREG[w] || []).map((x) => '|' + x).join('')})\\b`; };
const sn4 = (k) => k[0] + String(parseInt(k.slice(1), 10));
// the best Greek and Hebrew entry for a word: the one whose KJV renderings that match it add up highest
function best(word, lang) {
  const st = stem(word); let top = null;
  for (const [k, e] of Object.entries(LEX)) { if (k[0] !== lang) continue;
    let n = 0; for (const [w, c] of e.k || []) { const x = w.toLowerCase(); if (x === st || (x.startsWith(st) && x.length <= st.length + 3)) n += c; }
    if (n && (!top || n > top.n || (n === top.n && e.n > top.e.n))) top = { k, e, n }; }
  return top;
}
function clean(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function gloss(e) { let g = clean(e.g), d = clean(e.d).replace(/\(AS\)|†/g, '').trim();
  d = d.replace(/^[^a-z]*(?=[a-z])/i, ''); const first = d.split(/[;:.]/)[0].trim();
  let t = first.length >= 8 && first.length <= 70 ? first : g; t = t.charAt(0).toUpperCase() + t.slice(1); if (!/[.!?]$/.test(t)) t += '.'; return t.length > 92 ? t.slice(0, 89).replace(/[,;\s]+\S*$/, '') + '.' : t; }
// the clause of a verse around the word, 72 letters or fewer
function snippet(text, st) {
  const t = clean(text).replace(/[“”"]/g, ''); if (t.length <= 72) return t.replace(/[,;:.\s]+$/, '');
  const parts = t.split(/(?<=[,;:])\s+/); let i = parts.findIndex((p) => p.toLowerCase().includes(st)); if (i < 0) return '';
  let out = parts[i]; for (let a = 1; out.length < 34 && (parts[i + a] || parts[i - a]); a++) { const nx = parts[i + a]; if (nx && (out + ' ' + nx).length <= 72) out += ' ' + nx; else { const pv = parts[i - a]; if (pv && (pv + ' ' + out).length <= 72) out = pv + ' ' + out; else break; } }
  out = out.replace(/[,;:.\s]+$/, ''); return out.length <= 72 ? out : '';
}
function verses(word, hbk, grk) {
  const st = stem(word), re = new RegExp(formsOf(word), 'i'), DIR = path.join(BIBLE, 'conc');
  const concAll = (sn) => { for (const f of fs.readdirSync(DIR)) { if (f[0] !== sn[0]) continue; const c = CONCCACHE[f] || (CONCCACHE[f] = rd(path.join(DIR, f))); const v = c[sn4(sn)]; if (v) return v; } return []; };
  const per = [hbk, grk].map((sn) => { if (!sn) return []; const got = [];
    for (const [b, c, v] of concAll(sn)) { const txt = (kjv(b, c) || [])[v - 1]; if (!txt) continue; const s = snippet(txt, st); if (s && s.length >= 14 && re.test(s)) got.push({ ref: `${name(b)} ${c}:${v}`, s }); }
    const pick = []; for (const q of [0.15, 0.55, 0.35, 0.8, 0.05, 0.7, 0.25, 0.9]) { const x = got[Math.min(got.length - 1, Math.floor(got.length * q))]; if (x && !pick.includes(x)) pick.push(x); }
    return pick; });
  const out = [...per[0].slice(0, 2), ...per[1].slice(0, 2)];
  for (const x of [...per[0].slice(2), ...per[1].slice(2)]) { if (out.length >= 4) break; if (!out.some((o) => o.ref === x.ref)) out.push(x); }
  return out.slice(0, 4).map((x) => [x.ref, x.s]);
}
const CONCCACHE = {};
const HAND = { BUILD: 'BUILD-KT', CAST: 'CAST', REPAIR: 'REPAIR-KT4', TRUST: 'TRUST-FMT', SEEK: 'SEEK-FMT' };
// the site's own studies of the original 24 (index.html, var DATA): Ken's Greek, Hebrew and verse choices, with the quoted words widened to the clause around them
let SITE = {}; { const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), i = h.indexOf('var DATA={') + 9; let d = 0, q = null, j = i;
  for (; j < h.length; j++) { const c = h[j]; if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") q = c; else if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  try { SITE = JSON.parse(h.slice(i, j + 1)); } catch (e) { /* none */ } }
const refOf = (r) => { const m = /^(.*) (\d+):(\d+)$/.exec(r); if (!m) return null; const b = CANON.findIndex((x) => x.replace(/_/g, ' ') === m[1]); return b < 0 ? null : { b, c: +m[2], v: +m[3] }; };
function widen(ref, snip) { const r = refOf(ref), txt = r && (kjv(r.b, r.c) || [])[r.v - 1]; if (!txt) return snip; const t = clean(txt), at = t.toLowerCase().indexOf(String(snip).toLowerCase()); if (at < 0) return snip;
  if (t.length <= 72) return t.replace(/[,;:.\s]+$/, ''); const parts = t.split(/(?<=[,;:])\s+/); let pos = 0, i = parts.findIndex((p) => { const e = pos + p.length; const hit = at < e; pos = e + 1; return hit; }); if (i < 0) return snip;
  let out = parts[i]; for (let a = 1; out.length < 40 && (parts[i + a] || parts[i - a]); a++) { const nx = parts[i + a]; if (nx && (out + ' ' + nx).length <= 72) out += ' ' + nx; else { const pv = parts[i - a]; if (pv && (pv + ' ' + out).length <= 72) out = pv + ' ' + out; else break; } }
  out = out.replace(/[,;:.\s]+$/, ''); return out.length <= 72 && out.length >= snip.length ? out : snip; }
const index = {}, words = {};
for (const k of CATCHORDER) { const f = fishInfo(k, 'en'); if (!f || !f.title) continue; const W = f.title.trim(), key = W.toUpperCase(); (index[key] = index[key] || { word: W, fish: [] }).fish.push(k); }
// more verses of a study, to swap in for one the fish already carries (Ken, 18 Nov): the rest of a hand-written study's list, or the site's own list of the original 24
const FULL = { BUILD: 'BUILD', REPAIR: 'REPAIR' };
function altOf(key, have) { const out = []; const add = (r) => { if (!r || have.has(r[0]) || out.some((o) => o[0] === r[0])) return; out.push([r[0], widen(r[0], r[1])]); };
  if (SITE[key]) (SITE[key].refs || []).forEach(add);
  else if (FULL[key]) { try { (rd(path.join(ROOT, 'print/study', FULL[key] + '.json')).refs || []).forEach(add); } catch (e) { /* none */ } }
  return out.slice(0, 8); }
let made = 0, hand = 0, short = [];
for (const [key, ent] of Object.entries(index)) {
  const own = HAND[key] && path.join(ROOT, 'print/study', HAND[key] + '.json');
  if (own && fs.existsSync(own)) { words[key] = { ...rd(own), by: 'hand' }; hand++; continue; }
  if (SITE[key]) { const x = SITE[key]; words[key] = { title: x.title, by: 'site', gkw: x.gkw, gks: x.gks, gkm: x.gkm, gst: x.gst, hbw: x.hbw, hbs: x.hbs, hbm: x.hbm, hst: x.hst, refs: (x.refs || []).slice(0, 4).map((r) => [r[0], widen(r[0], r[1])]) }; hand++; continue; }
  const h = best(ent.word, 'H'), g = best(ent.word, 'G');
  const d = { title: ent.word, by: 'lexicon' };
  if (g) Object.assign(d, { gkw: g.e.l, gks: clean(g.e.t), gkm: gloss(g.e), gst: sn4(g.k) }); if (h) Object.assign(d, { hbw: h.e.l, hbs: clean(h.e.t), hbm: gloss(h.e), hst: sn4(h.k) });
  d.refs = verses(ent.word, h && h.k, g && g.k);
  if (!g || !h || d.refs.length < 4) short.push(`${ent.word}(${g ? 'G' : '-'}${h ? 'H' : '-'} ${d.refs.length})`);
  words[key] = d; made++;
}
// the other verses that use each word (Ken, 17 Nov: "let them choose from a list of scriptures"): print/kit/verses.json, loaded when a sponsor opens the list
const KV = []; for (let b = 0; b < CANON.length; b++) for (let c = 1; ; c++) { const t = kjv(b, c); if (!t || !t.length) break; t.forEach((txt, i) => KV.push([`${name(b)} ${c}:${i + 1}`, clean(txt)])); }
const verseList = {}; const formMap = {};
for (const [key, ent] of Object.entries(index)) { const f = formsOf(ent.word), re = new RegExp(f, 'i'); formMap[key] = f;
  const hit = KV.filter((v) => v[1].length <= 175 && re.test(v[1])), pick = [], n = Math.min(14, hit.length);
  for (let i = 0; i < n; i++) pick.push(hit[Math.floor((i + 0.5) * hit.length / n)]);
  const study = ((words[key] && words[key].refs) || []).map((r) => { const rr = refOf(r[0]), t = rr && (kjv(rr.b, rr.c) || [])[rr.v - 1]; return t ? [r[0], clean(t)] : null; }).filter(Boolean);
  const seen = new Set(), out = []; for (const v of [...study.map((x) => [...x, 1]), ...pick.map((x) => [...x, 0])]) { if (seen.has(v[0])) continue; seen.add(v[0]); out.push(v); }
  verseList[key] = out.slice(0, 20); }
fs.writeFileSync(path.join(ROOT, 'print/kit/verses.json'), JSON.stringify(verseList));
for (const [key, w] of Object.entries(words)) w.alt = altOf(key, new Set((w.refs || []).map((r) => r[0])));
const list = Object.entries(index).map(([key, e]) => ({ w: e.word, k: e.fish[0], ok: !!(words[key] && words[key].gkw && words[key].hbw && words[key].refs.length >= 4), f: formMap[key], r: fishRefOf(e.fish[0]) })).sort((a, b) => a.w.localeCompare(b.w));
fs.writeFileSync(path.join(ROOT, 'print/kit/words.json'), JSON.stringify({ list, words }));
console.log(`${list.length} words: ${hand} by hand, ${made} from the lexicon; ${list.filter((x) => x.ok).length} complete. Incomplete: ${short.length}`); if (process.argv.includes('--show')) console.log(short.join(', '));
