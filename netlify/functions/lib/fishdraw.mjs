// Draws a fish on the SERVER the way the edit sheet (/edit/) draws it (Ken, 6 Nov: "the visit word in the editor and the visit word in the
// email are 2 different sizes ... the standardized sizes live in the editor ... always on server side, and updated across all fish").
// The word's size and place come, in this order, from (1) the fish's own setting in the edit sheet, (2) the rule for its number of letters
// (the template averages and 📚 rules saved in the edit sheet), (3) the format builder's own rule. The verse lines the same.
// The edit sheet's state is the one copy kept on the server (blob store mannafish-edit, key state; see edit-save.mjs).
// Covers the 128 new fish (W...) and the 507 reading-plan fish (D...); the original 24 are Ken's own drawings and stay as they are.
import opentype from 'opentype.js';
import F from '../../../fish-lang/fishfmt.js';
import GEO from '../../../fish-lang/fishgeo.json' with { type: 'json' };
import DAILY from '../../../edit/daily/data.json' with { type: 'json' };
import NEWF from '../../../edit/new/data.json' with { type: 'json' };
import { HOBO_B64 } from './hobo-b64.mjs';

let E = null;
function engine() {
  if (!E) { F.setGeo(GEO); const b = Buffer.from(HOBO_B64, 'base64'); E = F.otEngine(opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))); }
  return E;
}
export const KEYRE = /^([DW])(\d{2,3})([a-z]?)$/i;
export const normKey = (k) => { const m = KEYRE.exec(String(k || '')); return m ? m[1].toUpperCase() + m[2] + m[3].toLowerCase() : ''; };
export function findFish(k) {
  const a = DAILY.fish.find((x) => x.k === k) || NEWF.fish.find((x) => x.k === k);
  return a ? { base: a, code: 'en' } : null;
}
// the same arithmetic as the edit sheet (edit/wordtool.js ruleFor, edit/index.html ruleWord, lineRule)
const letters = (w) => Array.from(String(w || '').replace(/[\s‎‏‪-‮]/g, '')).length;
function ruleFor(rules, n) {
  if (!rules) return null; const ks = Object.keys(rules).map(Number).sort((a, b) => a - b); if (!ks.length) return null;
  if (rules[n]) return Object.assign({ exact: true, n }, rules[n]);
  let lo = null, hi = null; ks.forEach((k) => { if (k < n) lo = k; if (k > n && hi == null) hi = k; });
  if (lo != null && hi != null) { const A = rules[lo], B = rules[hi], t = (n - lo) / (hi - lo);
    return { size: A.size + (B.size - A.size) * t, dx: A.dx + (B.dx - A.dx) * t, dy: A.dy + (B.dy - A.dy) * t, ww: A.ww + (B.ww - A.ww) * t, hh: (A.hh || 1) + ((B.hh || 1) - (A.hh || 1)) * t, n }; }
  const k = lo != null ? lo : hi; return Object.assign({ n }, rules[k]);
}
function ruleWord(W, n) {
  if (!W) return null; if (W[n]) return ruleFor(W, n);
  const own = {}; Object.keys(W).forEach((k) => { if (!W[k].avg) own[k] = W[k]; }); return ruleFor(own, n);
}
function lineRule(list, n) {
  list = (list || []).slice().sort((a, b) => a.n - b.n); if (!list.length) return null; let lo = null, hi = null;
  list.forEach((r) => { if (r.n <= n) lo = r; if (r.n >= n && !hi) hi = r; });
  if (lo && hi) { if (lo === hi) return { size: lo.size, slide: lo.slide, lw: lo.lw || 1 }; const t = (n - lo.n) / (hi.n - lo.n);
    return { size: lo.size + (hi.size - lo.size) * t, slide: lo.slide + (hi.slide - lo.slide) * t, lw: (lo.lw || 1) + ((hi.lw || 1) - (lo.lw || 1)) * t }; }
  const r = lo || hi; return { size: r.size, slide: r.slide, lw: r.lw || 1 };
}
// the settings one fish ends up with, and why (used by the picture and by /api/fish-standard)
export function settingsFor(k, S) { const X = findFish(k); return X ? settingsOf(X, k, S) : null; }
function settingsOf(X, k, S) {
  const own = ((S && S.d) || {})[k] || {}, rules = (S && S.rules) || { word: {}, top: {}, bot: {} };
  const val = (f) => (own[f] != null ? own[f] : X.base[f] == null ? '' : X.base[f]);
  const f = { word: val('word'), top: val('top'), bot: val('bot'), ref: val('ref'), refShort: val('ref') === X.base.ref ? (X.base.refShort || '') : '' };
  if (X.base.tag != null) f.tag = X.base.tag;   // what follows the reference, for a fish in another Bible (default " (KJV)")
  const o = {}, why = {};
  if (own.wl) { o.wl = Object.assign({ hh: 1 }, own.wl); why.word = 'set on the fish'; }
  else { const r = ruleWord((rules.word || {})[X.code], letters(f.word));
    if (r) { const v = { size: r.size, dx: r.dx, dy: r.dy, ww: r.ww, hh: r.hh || 1 }, ink = F.runBox(engine(), f.word, 100), iw = (ink.x2 - ink.x1) / 100 * v.ww, max = 1900 * 1.03 / iw;
      if (iw > 0 && v.size > max) v.size = max; o.wl = v; why.word = 'rule for ' + letters(f.word) + ' letters'; } else why.word = 'the builder rule'; }
  [['top', 'tl'], ['bot', 'bl']].forEach(([w, t]) => {
    const l = own[t];
    if (l) { o[t] = { size: l.size, slide: l.slide || 0, lw: l.lw || 1 }; why[w] = 'set on the fish'; return; }
    const r = lineRule((rules[w] || {})[X.code], String(f[w]).length);
    if (r) { o[t] = { size: r.size, slide: r.slide, lw: r.lw }; why[w] = 'line rule'; } else why[w] = 'the builder rule'; });
  return { f, o, why };
}
export function drawFish(k, S) {
  const s = settingsFor(k, S); if (!s) return null; const e = engine(), R = GEO.rule;
  return F.draw(e, s.f, F.fromSheet(e, s.f, s.o, R, F.layout(e, s.f, R)), R);
}
// a fish that is not in any list yet (a new idea for a sponsor): the same drawing, from {word, top, bot, ref, refShort}
export function drawCustom(rec, S) {
  const s = settingsOf({ base: rec, code: 'en' }, rec.k || '_', S), e = engine(), R = GEO.rule;
  return F.draw(e, s.f, F.fromSheet(e, s.f, s.o, R, F.layout(e, s.f, R)), R);
}
