// The printer's files for a sponsored MannaFish run (Ken, 30 Oct: "we provide the exact print files that they will need ...
// so when I give you an image you can update it for me easily and we can print whatever fish and whatever backing").
//
//   cd tools/print && npm install        (once: the QR code maker and two fonts)
//   node tools/print/make.mjs R0001      (one run)      node tools/print/make.mjs --all      (every run)
//
// A run is one order: print/runs/<id>.json says which fish, how many, who sponsors it, and what goes on the back.
// Out come, in print/out/<id>/, the files the printer needs for the card (4.5 x 2.75 in, StickerApp rounds it to 2.8):
//   1  the decal: clear vinyl, white ink only, the letters left clear              -> -1-decal-white-ink.png / .pdf
//   2  the front of the backing paper, under the decal: black, the same fish white   -> -2-backing-front.pdf / .png
//   3  the cut lines: CutContour, 1/8 in outside the fish (vinyl only), and ThroughCut, the card edge -> -3-cut-lines.pdf / .svg
//   4  the back of the backing paper: the invitation, from the template or Ken's image -> -4-back.pdf / .png
// plus a proof sheet to check and send (-proof.png / .pdf) and notes for the printer (-printer-notes.md).
// It also writes print/runs.json (every run, for /print/admin/) and print/links.json (where each QR code goes: every
// code on a card opens manna-fish.com/q/<code>, which counts the scan and sends the person on -- netlify/functions/qr.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const QR = require('qrcode');

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..'), PRINT = path.join(ROOT, 'print');
const MM = 25.4, DPI = 1200;
// the card, in millimetres: 4.5 x 2.75 in. The fish side is landscape; the back reads portrait (turn the card).
const CARD = { w: 4.5 * MM, h: 2.75 * MM }, BLEED = MM / 8, KISS = MM / 8, CUTGAP = MM / 16, SAFE = 3;   // CUTGAP: the kiss cut is 1/16 in outside the fish (Ken, 17 Nov: 'less than 1/8 in'); KISS only keeps the fish size and the card margin as they were
const PW = CARD.w + 2 * BLEED, PH = CARD.h + 2 * BLEED;   // a page with bleed, fish side
const px = (mm, dpi = DPI) => Math.round(mm / MM * dpi);
const f2 = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const font = (rel) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(HERE, 'node_modules/@fontsource', rel)).toString('base64');
const dataUrl = (file) => { const b = fs.readFileSync(file), ext = path.extname(file).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext};base64,` + b.toString('base64'); };

// ── the fish ──
function fishFile(f) {
  if (f.svg) { const p = path.join(PRINT, f.svg); if (!fs.existsSync(p)) throw new Error('No fish file ' + p); return p; }
  const id = String(f.word || f.id || '').toUpperCase(), l = f.lang || 'en';
  const tries = [path.join(ROOT, 'fish', l, id + '.svg'), path.join(ROOT, 'fish', id + '.svg'), path.join(ROOT, 'fish', l, f.word + '.svg'), path.join(ROOT, 'fish', String(f.id || f.word) + '.svg')];
  const hit = tries.find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`No fish found for ${JSON.stringify(f)} (looked in fish/${l}/ and fish/)`);
  return hit;
}
// the fish as an <svg> placed in millimetres inside another svg
function fishSvg(src, x, y, w) {
  return src.replace(/<svg\b[^>]*?viewBox="([^"]+)"[^>]*>/, (m, vb) => `<svg x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(w / 2)}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;shape-rendering:geometricPrecision" preserveAspectRatio="xMidYMid meet">`);
}

// ── in the browser: where the ink is, and the kiss cut around it ──
const BROWSER = fs.readFileSync(path.join(PRINT, 'kit', 'browser.js'), 'utf8');

// the word study of each of the 24 fish, the same as on the site: Greek, Hebrew, meanings, and the verses to look up
let WORDS = null;
let KIT = false;   // --kit: write the sponsor page's templates (print/kit/), with markers where a sponsor's own words go
function wordData(id) {
  if (!WORDS) { const s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), i = s.indexOf('var DATA={') + 9; let d = 0, q = null, j = i;
    for (; j < s.length; j++) { const c = s[j]; if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'") q = c; else if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
    WORDS = JSON.parse(s.slice(i, j + 1)); }
  const k = String(id).toUpperCase(), own = path.join(PRINT, 'study', k + '.json');
  // the other fish: a word study written for print, in print/study/<WORD>.json (the same fields)
  return WORDS[k] || (fs.existsSync(own) ? JSON.parse(fs.readFileSync(own, 'utf8')) : null);
}
// the Strong's numbers of a word study (index.html: BELIEVE:['4100','539'] = Greek G4100, Hebrew H539)
function strongsOf(k) { const m = new RegExp("\\b" + String(k).toUpperCase() + ":\\['(\\d+)','(\\d+)'\\]").exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); return m ? { g: 'G' + m[1], h: 'H' + m[2] } : {}; }
// the site's own Greek and Hebrew font, and the MannaFish lettering
const GKHB = () => { const m = /font-family:'MFGkHb';src:url\((data:font\/ttf;base64,[A-Za-z0-9+/=]+)\)/.exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); return m ? m[1] : ''; };

// what a QR code holds: manna-fish.com/q/<code> (counts the scan, then sends the person on), or with "qr_direct": true the web
// address itself (Ken, 1 Nov: "make sure QR codes work": works the day it is printed, but scans are not counted), tagged for the
// sponsor's own site so their visits show where they came from
function qrUrl(run, code) {
  if (!run.qr_direct) return run.qr_base + code;
  const B = run.back || {}, id = run.id, to = code === id + 's' ? B.left && B.left.to : code === id + 'm' ? B.right && B.right.to : B.qr && B.qr.to;
  if (!to) return run.qr_base + code;
  const u = new URL(to); if (!/(^|\.)manna-fish\.com$/.test(u.hostname)) { u.searchParams.set('utm_source', 'mannafish'); u.searchParams.set('utm_medium', 'card'); u.searchParams.set('utm_campaign', code); }
  return u.toString();
}
const landscape = (run) => (run.back || {}).orientation === 'landscape';
// ── the back (portrait), filled from the run: "invite" (Ken's invitation card), "study" (the word study, like the old
// word-study card), or "image" (Ken's own finished artwork). Both templates end with the same strip: two QR codes and who gave it.
// the card back editor's saved layout (print/back-edit/<run>.html -> /api/print-adjust): the site's copy if it can be reached, else print/adjust/<run>.json
async function loadAdjust(id) {
  const file = path.join(PRINT, 'adjust', id + '.json'); let adj = {};
  try { adj = JSON.parse(fs.readFileSync(file, 'utf8')).adj || {}; } catch (e) { /* none yet */ }
  try { const base = process.env.MF_SITE || 'https://yadamannafishtest.netlify.app', r = await fetch(`${base}/api/print-adjust?run=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(4000) });
    if (r.ok) { const j = await r.json(); if (j.adj && Object.keys(j.adj).length) { adj = j.adj; fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify({ run: id, adj, at: j.at }, null, 1) + '\n'); } } } catch (e) { /* the site could not be reached: use the file */ }
  return adj;
}
async function backHtml(run, codes, warn) {
  const B = run.back || {}, S = run.sponsor || {}, F = run.for || null, w = CARD.h, h = CARD.w;
  const qr = async (code, inv) => KIT ? `§QR:${code}§` : (await QR.toString(qrUrl(run, code), { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: inv ? { dark: '#ffffff', light: '#000000' } : { dark: '#000000', light: '#ffffff' } }))
    .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" width="100%" height="100%" ');
  const logo = (p, what) => { if (KIT && p) return p; if (!p) return ''; const f = path.join(PRINT, p); if (!fs.existsSync(f)) { warn.push(`${what}: ${p} is missing`); return ''; }
    if (/DRAFT/.test(p)) warn.push(`${what} is a stand-in (${p}). Upload the original logo before printing.`); return dataUrl(f); };
  if (B.template === 'image') {
    const f = path.join(PRINT, B.image || ''); if (!B.image || !fs.existsSync(f)) throw new Error('back.image is missing');
    warn.push('The back is your own artwork: its QR codes are whatever is in the picture (no scan counts unless they point at manna-fish.com/q/...).');
    return `<div class="pg" style="background:#000"><img src="${dataUrl(f)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>`;
  }
  // who it's from: a gift through someone (the sponsor stays anonymous), the sponsor by name, or simply freely given
  let credit, ml = '', mn = '', verse = false;
  if (F && F.name) { credit = B.credit || 'A gift to you through'; ml = logo(F.logo, `The logo of ${F.name}`); mn = F.name; }
  else if (S.name && S.show !== false && !S.anonymous) { credit = B.credit || 'Sponsored by'; ml = logo(S.logo, 'The sponsor logo'); mn = S.name; }
  else { credit = B.credit || 'Freely given'; mn = B.freely || '“Freely ye have received, freely give.” Matthew 10:8'; verse = true; }   // no sponsor named
  const L = B.left || null, Rt = B.right || null;
  const strip = async (top, ht) => `<div class="strip${ht > 30 ? ' big' : ''}" style="top:${top}mm;height:${ht}mm">
    ${L ? `<div class="col"><div class="sq">${await qr(codes.left)}</div><div class="lab fit"><span>${esc(L.label || '')}</span></div></div>` : '<div class="col"></div>'}
    <div class="col mid"><div class="sb">${esc(credit)}</div>${ml ? `<div class="sl"><img src="${ml}"></div>` : `<div class="sn fit${verse ? ' sv' : ''}"><span>${esc(mn)}</span></div>`}</div>
    ${Rt ? `<div class="col"><div class="sq">${await qr(codes.right)}</div><div class="lab fit"><span>${esc(Rt.label || '')}</span></div></div>` : '<div class="col"></div>'}
  </div>`;
  const open = `<div class="pg"><div class="card" style="left:${BLEED}mm;top:${BLEED}mm;width:${w}mm;height:${h}mm">`;
  // the word study back held the same way as the fish (Ken, 1 Nov: "let me see this card back in landscape orientation"):
  // Greek | the word | Hebrew across the top, the verses in three columns, then the QR codes with their words beside them
  if (B.template === 'study' && landscape(run)) {
    const d = wordData(run.fish.study || run.fish.word); if (!d) throw new Error(`No word study for ${run.fish.word}`);
    const refs = (d.refs || []).slice(0, B.refs || 9), W = CARD.w, H = CARD.h;   // Ken, 3 Nov: nine verses (3 x 3)
    const lang = (k, wd, lg, snd, m) => `<div class="lg"><div class="k">${k}</div><div class="ow fit" lang="${lg}"><span>${esc(wd)}</span></div><div class="tr">(${esc(snd)})</div><div class="mn fit"><span>${esc(m)}</span></div></div>`;
    const side = async (code, X, right) => X ? `<div class="col ql${right ? ' r' : ''}">${right ? `<div class="lab fit"><span>${esc(X.label || '')}</span></div>` : ''}<div class="sq">${await qr(code)}</div>${right ? '' : `<div class="lab fit"><span>${esc(X.label || '')}</span></div>`}</div>` : '<div class="col"></div>';
    // Ken, 6 Nov: "one option like this ... remove 'Trace it through Scripture' and move everything up so we can add the QR codes on the bottom right
    // and bottom left with 'Sponsored by' in the middle": the word big across the top, Greek | Hebrew under it, nine verses, then the strip
    if (B.layout === 'stack') {
      const big = refs.length <= 4;
      if (big) { refs.forEach((r) => { if (String(r[1]).length > 72) warn.push(`Verse ${r[0]} is ${String(r[1]).length} letters: the words are shrunk to fit two lines. Keep a quoted verse to 72 letters or fewer so it stays at full size.`); });
        [d.gkm, d.hbm].forEach((t) => { if (String(t || '').length > 92) warn.push(`A definition is ${String(t).length} letters: it needs more than two lines. Keep a definition to 92 letters or fewer.`); }); }   /* the larger all-caps back (Ken, 17 Nov): bigger title, labels in capitals */
      const st = { ...strongsOf(run.fish.word), ...strongsOf(run.fish.study || run.fish.word) };
      // Ken, 6 Nov: the strip on black, no white box; the QR codes inverted (white on black), away from the edges, each with its words under it in white
      const sideV = async (code, X, sd) => X ? `<div class="col qv"><div class="sq" data-b="qr${sd}">${await qr(code, true)}</div><div class="lab fit" data-b="lab${sd}"><span>${esc(X.label || '').replace(/\n/g, '<br>')}</span></div></div>` : '<div class="col"></div>';
      // a definition longer than one line (Ken, 17 Nov: "I left space under the Greek and Hebrew for a 2nd line in case there is more for the definition"):
      // a line break in the word study ("\n") is kept; a long one (over 46 letters) is split in two near the middle, at a comma or a space
      const defLines = (m) => { const t = String(m || ''); if (t.includes('\n')) return t.split('\n'); if (t.length <= 46) return [t];
        let best = -1, bd = 1e9; for (let i = 1; i < t.length - 1; i++) if (t[i] === ' ') { const d = Math.abs(i - t.length / 2) - (/[,;.]/.test(t[i - 1]) ? 6 : 0); if (d < bd) { bd = d; best = i; } }
        return best < 0 ? [t] : [t.slice(0, best).trim(), t.slice(best + 1).trim()]; };
      const two = false;   // (the layout is the same for one or two lines: a second line drops into the free space under the first)   // a two-line definition on either side: both sides keep room for it
      const l4b = (k, wd, lg, snd, m, sn) => { const q = lg === 'he' ? 'h' : 'g'; return `<div class="l4 l4b${two ? ' two' : ''}">${sn ? `<div class="st4" data-b="${q}strong">${esc((B.words && B.words.strongs) || 'STRONG’S')} ${esc(sn)}</div>` : ''}<div class="ow4 sx" data-b="${q}word" lang="${lg}"><span>${esc(wd)}</span></div><div class="r2 fit" data-b="${q}label"><span><b class="k">${k}</b> (${esc(snd)})</span></div><div class="mn4 fitw" data-b="${q}def"><span>${defLines(m).map(esc).join('<br>')}</span></div></div>`; };
      const l4 = (k, wd, lg, snd, m, sn) => `<div class="l4"><div class="r1 fit"><span class="rr"><span class="k">${k}</span><span class="ow" lang="${lg}">${esc(wd)}</span><span class="tr">(${esc(snd)})</span></span></div><div class="mn4 fit"><span>${esc(m)}</span></div>${sn ? `<div class="st4">${esc((B.words && B.words.strongs) || 'STRONG’S')} ${esc(sn)}</div>` : ''}</div>`;
      const adj = await loadAdjust(run.id || '');
      return `<script>window.MF_ADJ=${JSON.stringify(adj)}</script><div class="pg" style="width:${f2(W + 2 * BLEED)}mm;height:${f2(H + 2 * BLEED)}mm"><div class="card" style="left:${BLEED}mm;top:${BLEED}mm;width:${W}mm;height:${H}mm">
  <div class="wt4 fit${big ? ' wbig' : ''}" data-b="title" style="top:${big ? 1.5 : 0.9}mm;height:${big ? 8 : 6.6}mm"><span>${esc(B.heading || d.title)}</span></div>
  ${big && B.kicker ? `${B.kicker.logo ? `<div class="kick kl" data-b="kickL"><img src="${dataUrl(path.join(ROOT, B.kicker.logo))}"></div>` : ''}${B.kicker.note ? `<div class="kick kn" data-b="kickN">${esc(B.kicker.note)}</div>` : ''}<div class="kick kr" data-b="kickR">${esc(B.kicker.right || '').replace(/\n/g, '<br>')}</div>` : ''}
  <div class="gh4" style="top:${big ? 9.3 : 8.1}mm;height:${big ? 18.1 : 13.9}mm">${(big ? l4b : l4)((B.words && B.words.greek) || 'GREEK', d.gkw, 'el', d.gks, d.gkm, d.gst || st.g)}<div class="dv"></div>${(big ? l4b : l4)((B.words && B.words.hebrew) || 'HEBREW', d.hbw, 'he', d.hbs, d.hbm, d.hst || st.h)}</div>
  <div class="rf rf3 rf4${big ? ' rfbig' : ''}" style="top:${big ? 27.4 : 22.6}mm;height:${big ? 18.4 : 21.4}mm">${refs.map((r, i) => `<div><b data-b="r${i + 1}n">${esc(r[0])}</b><i class="${big ? 'fit ' : ''}" data-b="r${i + 1}q">“${esc(r[1])}”</i></div>`).join('')}</div>
  <div class="strip inv${big ? ' up' : ''}" style="top:${big ? 46.2 : 46.0}mm;height:${big ? 21.8 : 22.4}mm">${await sideV(codes.left, L, 'L')}
    <div class="col mid"><div class="sb" data-b="sponsor">${esc(credit)}</div>${ml ? `<div class="sl" data-b="logo"><img src="${ml}"></div>` : `<div class="sn fit${verse ? ' sv' : ''}"><span>${esc(mn)}</span></div>`}</div>
    ${await sideV(codes.right, Rt, 'R')}</div></div></div>`;
    }
    return `<div class="pg" style="width:${f2(W + 2 * BLEED)}mm;height:${f2(H + 2 * BLEED)}mm"><div class="card" style="left:${BLEED}mm;top:${BLEED}mm;width:${W}mm;height:${H}mm">
  <div class="gh3" style="top:2.6mm;height:15.6mm">${lang('GREEK', d.gkw, 'el', d.gks, d.gkm)}<div class="wt3 fit"><span>${esc(B.heading || d.title)}</span></div>${lang('HEBREW', d.hbw, 'he', d.hbs, d.hbm)}</div>
  <div class="hq fit" style="top:18.8mm;height:4mm"><span>${esc(B.text || 'Still hungry? Do this word study & look up the following Scriptures')}</span></div>
  <div class="rf rf3" style="top:23.2mm;height:21.8mm">${refs.map((r) => `<div><b>${esc(r[0])}</b><i>“${esc(r[1])}”</i></div>`).join('')}</div>
  <div class="strip land" style="top:45.6mm;height:21.6mm">${await side(codes.left, L, false)}
    <div class="col mid"><div class="sb">${esc(credit)}</div>${ml ? `<div class="sl"><img src="${ml}"></div>` : `<div class="sn fit${verse ? ' sv' : ''}"><span>${esc(mn)}</span></div>`}</div>
    ${await side(codes.right, Rt, true)}</div></div></div>`;
  }
  if (B.template === 'study') {
    const d = wordData(run.fish.study || run.fish.word); if (!d) throw new Error(`No word study for ${run.fish.word}: add print/study/${String(run.fish.word).toUpperCase()}.json`);
    const refs = (d.refs || []).slice(0, B.refs || 10);
    // fewer verses (Ken, 1 Nov: "less references so QR codes go on bottom"): the verses take only the rows they need and the strip
    // with the QR codes and the sponsor's logo grows into the room left
    const rows = Math.ceil(refs.length / 2), rfH = rows <= 3 ? rows * 8.6 : 44.8, stTop = 44.8 + rfH + (rows <= 3 ? 1.8 : 1.6), stH = 111.6 - stTop;
    const lang = (k, wd, lg, snd, m) => `<div class="lg"><div class="k">${k}</div><div class="ow fit" lang="${lg}"><span>${esc(wd)}</span></div><div class="tr">(${esc(snd)})</div><div class="mn fit"><span>${esc(m)}</span></div></div>`;
    return `${open}
  <div class="wt fit" style="top:3.4mm;height:10.6mm"><span>${esc(B.heading || d.title)}</span></div>
  <div class="gh" style="top:15mm;height:21.4mm">${lang('GREEK', d.gkw, 'el', d.gks, d.gkm)}${lang('HEBREW', d.hbw, 'he', d.hbs, d.hbm)}</div>
  <div class="hq fit" style="top:37.6mm;height:6.4mm"><span>${esc(B.text || 'Still hungry? Do this word study & look up the following Scriptures')}</span></div>
  <div class="rf" style="top:44.8mm;height:${f2(rfH)}mm">${refs.map((r) => `<div><b>${esc(r[0])}</b><i>“${esc(r[1])}”</i></div>`).join('')}</div>
  ${await strip(f2(stTop), f2(stH))}</div></div>`;
  }
  const yl = logo(B.logo, 'The top logo');
  return `${open}
  <div class="hd fit" style="top:4.2mm;height:8.4mm">${esc(B.heading || 'YOU’RE INVITED!')}</div>
  ${yl ? `<div class="lb" style="top:14.4mm;height:26mm"><img src="${yl}"></div>` : ''}
  <div class="tx fit" style="top:${yl ? 42.6 : 16}mm;height:${yl ? 18.6 : 44}mm"><span>${esc(B.text || '')}</span></div>
  <div class="qr" style="top:62mm;width:27mm;height:27mm;left:${(w - 27) / 2}mm">${await qr(codes.main)}</div>
  ${await strip(91.2, 20.4)}</div></div>`;
}
const BACKCSS = () => `@font-face{font-family:'Lilita One';src:url(${font('lilita-one/files/lilita-one-latin-400-normal.woff2')}) format('woff2')}
@font-face{font-family:'Archivo Narrow';font-weight:700;src:url(${font('archivo-narrow/files/archivo-narrow-latin-700-normal.woff2')}) format('woff2')}
@font-face{font-family:'Spectral';font-style:normal;src:url(${font('spectral/files/spectral-latin-400-normal.woff2')}) format('woff2')}
@font-face{font-family:'Spectral';font-style:italic;src:url(${font('spectral/files/spectral-latin-400-italic.woff2')}) format('woff2')}
@font-face{font-family:'MFHobo';src:url(${dataUrl(path.join(ROOT, 'fish-lang/hobo.woff2')).replace('image/woff2', 'font/woff2')}) format('woff2')}
@font-face{font-family:'MFGkHb';src:url(${GKHB()}) format('truetype')}
.pg{position:relative;width:${CARD.h + 2 * BLEED}mm;height:${CARD.w + 2 * BLEED}mm;background:#000;overflow:hidden}
.card{position:absolute;color:#fff;font-family:'Archivo Narrow',sans-serif}
.card>div{position:absolute;left:0;right:0}
.hd{font:400 7.4mm/1 'Lilita One',sans-serif;text-align:center;letter-spacing:.02em;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.lb{left:6.5mm!important;right:6.5mm!important;background:#fff;display:flex;align-items:center;justify-content:center;padding:1.6mm}
.lb img{max-width:100%;max-height:100%;object-fit:contain}
.tx{left:3.5mm!important;right:3.5mm!important;display:flex;align-items:center;justify-content:center;text-align:center;font:400 4.3mm/1.12 'Lilita One',sans-serif;text-transform:uppercase}
.qr{background:#fff}.qr svg,.sq svg{display:block}
.strip{left:2.6mm!important;right:2.6mm!important;background:#fff;color:#000;display:grid;grid-template-columns:1fr 1.15fr 1fr;grid-template-rows:minmax(0,1fr);gap:1.2mm;padding:1.2mm;box-sizing:border-box}
.col{display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-width:0;min-height:0;height:100%;overflow:hidden}
.sq{width:12.6mm;height:12.6mm}.lab{width:100%;height:5.2mm;display:flex;align-items:center;justify-content:center;text-align:center;font:400 2.5mm/1.05 'Lilita One',sans-serif}
.mid{justify-content:flex-start}.sb{font:400 2.3mm/1 'Lilita One',sans-serif;margin:.4mm 0 .8mm;text-align:center}.sl{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}.sl img{max-width:100%;max-height:100%;object-fit:contain}
.strip.big{grid-template-columns:1fr 1fr 1fr;gap:1.6mm;padding:1.6mm}.strip.big .sq{width:19.5mm;height:19.5mm}.strip.big .lab{height:9mm;font-size:2.9mm;line-height:1.08}
.strip.big .sb{font-size:2.8mm;margin:.6mm 0 1.2mm}.strip.big .col{justify-content:flex-start;gap:1mm}.strip.big .sl{flex:none;width:100%;height:24.5mm}
.gh3{left:3mm!important;right:3mm!important;display:grid;grid-template-columns:1fr .9fr 1fr;gap:1.8mm}.gh3 .lg .ow{height:5.6mm}
.wt3{font:400 12mm/1 'MFHobo',sans-serif;display:flex;align-items:center;justify-content:center;white-space:nowrap;min-width:0}
.rf.rf3{left:3mm!important;right:3mm!important;grid-template-columns:1fr 1fr 1fr}
.strip.land{left:3mm!important;right:3mm!important;grid-template-columns:1fr .78fr 1fr;gap:2mm;padding:1.4mm}
.strip.land .ql{flex-direction:row;align-items:center;justify-content:center;gap:1.6mm}.strip.land .sq{width:18.4mm;height:18.4mm;flex:none}
.strip.land .lab{flex:1;width:auto;height:15mm;font-size:3.1mm;line-height:1.1;justify-content:flex-start;text-align:left}.strip.land .r .lab{justify-content:flex-end;text-align:right}
.strip.land .mid{justify-content:center}.strip.land .sb{font-size:2.6mm;margin:0 0 .8mm}.strip.land .sl{flex:none;height:15.4mm}
.sn{flex:1;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;font:400 3mm/1.1 'Lilita One',sans-serif}.sn.sv{font:italic 400 2.5mm/1.2 'Spectral',serif;padding:0 .6mm}
.wt{font:400 10mm/1 'MFHobo',sans-serif;text-align:center;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.gh{left:2.6mm!important;right:2.6mm!important;display:grid;grid-template-columns:1fr 1fr;gap:1.6mm}
.lg{border:.25mm solid rgba(255,255,255,.5);border-radius:1.6mm;padding:1.1mm;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0;overflow:hidden}
.lg .k{font:700 1.8mm/1 'Archivo Narrow',sans-serif;letter-spacing:.3mm;color:#8fb8ff}
.lg .ow{font:400 5.2mm/1.15 'MFGkHb',serif;height:6.6mm;width:100%;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.lg .tr{font:italic 400 2.1mm/1.2 'Spectral',serif;color:#cfd8dc}
.lg .mn{font:italic 400 2.2mm/1.2 'Spectral',serif;flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;margin-top:.4mm}
.hq{left:3mm!important;right:3mm!important;font:400 2.8mm/1.12 'Lilita One',sans-serif;text-transform:uppercase;text-align:center;display:flex;align-items:center;justify-content:center}
.rf{left:2.6mm!important;right:2.6mm!important;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr);gap:.8mm 1.6mm}
.rf div{border-top:.2mm solid rgba(255,255,255,.25);padding-top:.7mm;text-align:center;overflow:hidden;min-height:0}
.rf b{display:block;font:700 2.4mm/1.1 'Archivo Narrow',sans-serif;color:#8fb8ff}
.wt4{font:400 8.8mm/1 'MFHobo',sans-serif;display:flex;align-items:center;justify-content:center;white-space:nowrap;left:3.2mm!important;right:3.2mm!important}
.gh4{left:3.2mm!important;right:3.2mm!important;display:grid;grid-template-columns:1fr .25mm 1fr;gap:2.2mm;border-top:.25mm solid rgba(255,255,255,.3);padding:.8mm 0}
.gh4 .dv{background:rgba(255,255,255,.3)}
.l4{padding-bottom:.9mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5mm;min-width:0;text-align:center}
.l4 .r1{width:100%;font-size:1mm;display:flex;align-items:baseline;justify-content:center;white-space:nowrap}
.l4 .rr{display:inline-flex;align-items:baseline;gap:1.5em}
.l4 .k{font:700 1.9em/1 'Archivo Narrow',sans-serif;letter-spacing:.16em;color:#8fb8ff}
.l4 .ow{font:400 5em/1.1 'MFGkHb',serif}.l4 .tr{font:italic 400 2.2em/1.2 'Spectral',serif;color:#cfd8dc}
.l4 .mn4{font:italic 400 2.5mm/1.2 'Spectral',serif;width:100%;display:flex;align-items:center;justify-content:center;white-space:nowrap;height:3.2mm}
.l4 .st4{font:700 1.8mm/1 'Archivo Narrow',sans-serif;letter-spacing:.25mm;color:#8fb8ff;border-bottom:.2mm solid #8fb8ff;padding-bottom:.3mm}
.strip.inv{border-top:.25mm solid rgba(255,255,255,.3);padding-top:.8mm!important;box-sizing:border-box;background:none;color:#fff;left:3.2mm!important;right:3.2mm!important;padding:0;gap:2mm;grid-template-columns:23mm 1fr 23mm}
.strip.inv .qv{justify-content:space-between;gap:.9mm}.strip.inv .qv .sq{width:15.2mm;height:15.2mm}
.strip.inv .qv .lab{height:5.8mm;width:100%;color:#fff;font-size:2.6mm;line-height:1.05;white-space:normal;align-items:flex-start;text-align:center}
.strip.inv .mid{justify-content:space-between;padding:0}.strip.inv .sb{color:#fff;font-size:2.8mm;margin:0;line-height:1}.strip.inv .sl{flex:none;height:17.4mm}
.rf4{left:3.2mm!important;right:3.2mm!important;grid-auto-rows:auto;align-content:space-around;row-gap:1mm}.rf4 div{padding-top:.4mm;overflow:visible}.rf4 i{font-size:1.8mm;line-height:1.05;margin-top:0}.rf4 b{font-size:2.3mm;line-height:1.05}
.kick{position:absolute;top:2.6mm;width:32mm;font:700 2.7mm/1.15 'Archivo Narrow',sans-serif;letter-spacing:.25mm;color:#8fb8ff;text-transform:uppercase}.kick.kl{left:3.2mm;right:auto;top:2.6mm;width:28mm}.kick.kl img{width:100%;display:block}.kick.kn{left:3.2mm;top:7mm;width:28mm;font-size:2.2mm;letter-spacing:.42mm;white-space:nowrap;text-align:center}.l4b.two{gap:.15mm}.l4b.two .ow4{height:5.2mm}.l4b.two .r2{height:3.8mm}.l4b.two .mn4{height:5.3mm}.kick.kr{right:3.2mm;left:auto;text-align:right}.wt4.wbig{font-size:8mm}.l4b{gap:.3mm;padding-bottom:.4mm;justify-content:flex-start;padding-top:.3mm}.l4b .ow4{font:400 5.2mm/1 'MFGkHb',serif;height:6mm;width:100%;display:flex;align-items:center;justify-content:center;white-space:nowrap}.l4b .ow4{position:relative;top:-.65mm}.l4b .ow4[lang=he]{top:-.9mm}.l4b .ow4 span{display:inline-block;flex:none;transform-origin:center}.l4b .r2{width:100%;font:400 3.9mm/1.1 'Spectral',serif;color:#cfd8dc;white-space:nowrap;text-align:center;height:4.2mm}.l4b .r2 .k{font:700 1em/1 'Archivo Narrow',sans-serif;font-style:normal;letter-spacing:.1em;color:#8fb8ff}.l4b .mn4{align-items:flex-start;text-align:center;overflow:visible;height:3.4mm;font:italic 600 2.3mm/1.1 'Archivo Narrow',sans-serif;text-transform:uppercase;letter-spacing:.05mm}.strip.inv.up .sb{text-transform:uppercase;font-size:2.7mm}.strip.inv.up .sl{height:18mm}.rf.rfbig b{text-transform:uppercase}.strip.inv.up .lab{text-transform:uppercase;height:7.6mm;font-size:2.5mm}.strip.inv.up{grid-template-columns:27mm 1fr 27mm}
.rf.rfbig{grid-template-columns:1fr 1fr;gap:.5mm 3mm;align-content:space-between}.rfbig div{padding-top:.3mm}.rf.rfbig b{font-size:2.6mm}.rf.rfbig i{height:5.5mm;overflow:hidden;font:700 2.5mm/1.1 'Archivo Narrow',sans-serif;font-style:normal;text-transform:uppercase;letter-spacing:.08mm;margin-top:.3mm}
.rf i{display:block;font:italic 400 2mm/1.15 'Spectral',serif;color:#e6ecef;margin-top:.3mm}`;
// words that don't fit get smaller until they do
const APPLY = `(function(){ ['label','def'].forEach(function(k){ var a=document.querySelector('[data-b=g'+k+']'), b=document.querySelector('[data-b=h'+k+']'); if(a&&b){ var m=Math.min(parseFloat(getComputedStyle(a).fontSize),parseFloat(getComputedStyle(b).fontSize)); a.style.fontSize=b.style.fontSize=m+'px'; } });  var A=window.MF_ADJ||{}; document.querySelectorAll('[data-b]').forEach(function(e){ var a=A[e.getAttribute('data-b')]; if(/def$/.test(e.getAttribute('data-b'))) e.style.width=(a?100/(((a.s||100)/100)*((a.sx||100)/100)):100)+'%'; if(!a){ e.style.transform=''; return; } var s=(a.s||100)/100, x=s*(a.sx||100)/100, y=s*(a.sy||100)/100; e.style.transformOrigin=/def$/.test(e.getAttribute('data-b'))?'center top':'center center'; e.style.transform='translate('+(a.dx||0)+'mm,'+(a.dy||0)+'mm) scale('+x+','+y+')'; }); })();`;
const FIT0 = `document.querySelectorAll('.sxf').forEach(function(e){ var t=e.firstElementChild; t.style.transform=''; e.style.fontSize=''; e.style.width='100%'; e.style.alignSelf=''; try{ var c=e.closest('.card'), L=c&&c.querySelector('[data-b=qrL]'), R=c&&c.querySelector('[data-b=qrR]'); if(L&&R&&e.getAttribute('data-b')==='sponsor'){ var cr=c.getBoundingClientRect(), k=cr.width/c.offsetWidth, ppm=c.offsetWidth/114.3, mid=c.offsetWidth/2, MA=window.MF_ADJ||{}, lr=(L.getBoundingClientRect().right-cr.left)/k+((MA.qrL||{}).dx||0)*ppm, rl=(R.getBoundingClientRect().left-cr.left)/k+((MA.qrR||{}).dx||0)*ppm, half=Math.min(mid-lr,rl-mid)-6.35*ppm; if(half*2>e.clientWidth){ e.style.width=(half*2)+'px'; e.style.alignSelf='center'; } } for(var q=e.parentNode;q&&q!==c;q=q.parentNode) q.style.overflow='visible'; }catch(x){} var cw=e.clientWidth*0.98, sw=t.scrollWidth; var Ad=(window.MF_ADJ||{})[e.getAttribute('data-b')]||{}; if(sw<cw&&e.className.indexOf('nar')>=0&&(Ad.s||100)===100&&(Ad.sx||100)===100){ var g=Math.min(1.2,cw/sw); e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*g)+'px'; sw=t.scrollWidth; } if(sw>cw){ var k=cw/sw; if(k<0.6){ e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*(k/0.6))+'px'; sw=t.scrollWidth; k=Math.min(1,cw/sw); } t.style.transform='scaleX('+k+')'; } }); document.querySelectorAll('.fitw').forEach(function(e){ var a=(window.MF_ADJ||{})[e.getAttribute('data-b')]||{}; e.style.width=(100/(((a.s||100)/100)*((a.sx||100)/100)))+'%'; var s=parseFloat(getComputedStyle(e).fontSize), t=e.firstElementChild||e; for(var i=0;i<60&&t.scrollWidth>e.clientWidth+.5;i++){ s*=.95; e.style.fontSize=s+'px'; } }); document.querySelectorAll('.sx').forEach(function(e){ var t=e.firstElementChild; t.style.transform=''; var cw=e.clientWidth*0.97, sw=t.scrollWidth; if(sw>cw) t.style.transform='scaleX('+(cw/sw)+')'; }); document.querySelectorAll('.fit').forEach(function(e){ var s=parseFloat(getComputedStyle(e).fontSize), t=e.firstElementChild||e;
  for(var i=0;i<60&&(t.scrollWidth>e.clientWidth+.5||t.scrollHeight>e.clientHeight+.5||e.scrollHeight>e.clientHeight+.5);i++){ s*=.95; e.style.fontSize=s+'px'; } });`;
const FIT = FIT0 + APPLY;

// the cut lines as a small PDF written by hand, so each line can be a named spot colour (Chromium can't make those)
function cutPdf(file, kiss) {
  const k = 72 / MM, X = (x) => (x * k).toFixed(3), Y = (y) => ((PH - y) * k).toFixed(3);
  let c = '0.25 w 1 J 1 j\n/CS1 CS 1 SCN\n' + kiss.map((p, i) => `${X(p[0])} ${Y(p[1])} ${i ? 'l' : 'm'}`).join('\n') + '\nh S\n';
  c += `/CS2 CS 1 SCN\n${X(BLEED)} ${Y(BLEED + CARD.h)} ${(CARD.w * k).toFixed(3)} ${(CARD.h * k).toFixed(3)} re S\n`;
  const sep = (n, cmyk) => `[/Separation /${n} /DeviceCMYK << /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [${cmyk}] /N 1 >>]`;
  const trim = [BLEED * k, BLEED * k, (BLEED + CARD.w) * k, (BLEED + CARD.h) * k].map((n) => n.toFixed(3)).join(' ');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${(PW * k).toFixed(3)} ${(PH * k).toFixed(3)}] /TrimBox [${trim}] /Resources << /ColorSpace << /CS1 ${sep('CutContour', '0 1 0 0')} /CS2 ${sep('ThroughCut', '1 0 0 0')} >> >> /Contents 4 0 R >>`,
    `<< /Length ${c.length} >>\nstream\n${c}endstream`];
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fs.writeFileSync(file, Buffer.from(pdf, 'latin1'));
}

async function make(id, browser) {
  const file = path.join(PRINT, 'runs', id + '.json'), run = JSON.parse(fs.readFileSync(file, 'utf8')), warn = [];
  run.qr_base = run.qr_base || 'https://manna-fish.com/q/';
  const out = path.join(PRINT, 'out', id); fs.mkdirSync(out, { recursive: true });
  const name = (s) => path.join(out, `${id}-${s}`);
  const page = await browser.newPage(); await page.setContent('<html><body></body></html>'); await page.addScriptTag({ content: BROWSER });
  const src = fs.readFileSync(fishFile(run.fish), 'utf8');

  // where the fish goes: as big as fits with the kiss cut 3 mm inside the card edge (or the width the run asks for)
  const box = await page.evaluate((s) => MFbox(s), src);
  const maxW = CARD.w - 2 * (SAFE + KISS), maxH = CARD.h - 2 * (SAFE + KISS);
  let s = Math.min(maxW / box.w, maxH / box.h); if (run.fish.width_mm) s = Math.min(s, run.fish.width_mm / box.w);
  const fw = 4000 * s, place = { x: BLEED + (CARD.w - box.w * s) / 2 - box.x * s, y: BLEED + (CARD.h - box.h * s) / 2 - box.y * s, w: fw };
  const fishMM = { w: box.w * s, h: box.h * s };
  const cut = await page.evaluate(([s2, p, pg, r]) => MFcut(s2, p, pg, r, 24), [src, place, { w: PW, h: PH }, CUTGAP]);
  const cutD = 'M' + cut.map((p) => f2(p[0]) + ' ' + f2(p[1])).join(' L') + ' Z';

  const svgPage = (inner, w = PW, h = PH) => `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}mm" height="${f2(h)}mm" viewBox="0 0 ${f2(w)} ${f2(h)}">${inner}</svg>`;
  const shot = async (html, w, h, file2, opts = {}) => {
    const p2 = await browser.newPage({ viewport: { width: px(w, opts.dpi || DPI), height: px(h, opts.dpi || DPI) }, deviceScaleFactor: 1 });
    await p2.setContent(`<html><head><style>html,body{margin:0;background:${opts.clear ? 'transparent' : '#fff'}}body>svg,.pg{display:block;width:100vw;height:100vh}${opts.css || ''}</style></head><body>${html}<script>${FIT}</script></body></html>`, { waitUntil: 'load' });
    if (opts.scale) await p2.evaluate((k) => { const e = document.querySelector('.pg'); e.style.zoom = k; }, px(w, opts.dpi || DPI) / (w / MM * 96));
    await p2.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('.fit,.fitw').forEach((e) => { e.style.fontSize = ''; }); }); await p2.evaluate(FIT); await p2.screenshot({ path: file2, omitBackground: !!opts.clear }); await p2.close(); };
  const pdf = async (html, w, h, file2, css = '') => { const p2 = await browser.newPage();
    await p2.setContent(`<html><head><style>@page{size:${f2(w)}mm ${f2(h)}mm;margin:0}html,body{margin:0}svg{display:block}${css}</style></head><body>${html}<script>${FIT}</script></body></html>`, { waitUntil: 'load' });
    await p2.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('.fit,.fitw').forEach((e) => { e.style.fontSize = ''; }); }); await p2.evaluate(FIT); await p2.pdf({ path: file2, width: `${f2(w)}mm`, height: `${f2(h)}mm`, printBackground: true, pageRanges: '1' }); await p2.close(); };

  // 1 the decal, white ink only (letters clear)
  const ink = await page.evaluate(([s2, p, pg, d]) => MFink(s2, p, pg, d), [src, place, { w: PW, h: PH }, DPI]);
  fs.writeFileSync(name('1-decal-white-ink.png'), Buffer.from(ink.split(',')[1], 'base64'));
  await pdf(svgPage(`<image href="${ink}" x="0" y="0" width="${f2(PW)}" height="${f2(PH)}"/>`), PW, PH, name('1-decal-white-ink.pdf'));
  // 2 the front of the backing paper: black to the bleed, the same fish in white, in the same place
  const backing = svgPage(`<rect width="${f2(PW)}" height="${f2(PH)}" fill="#000"/>${fishSvg(src, place.x, place.y, place.w)}`);
  await pdf(backing, PW, PH, name('2-backing-front.pdf'));
  await shot(backing, PW, PH, name('2-backing-front.png'));
  // 3 the cut lines: the kiss cut (vinyl only) and the card edge (through everything)
  // named the way cutting machines expect: CutContour (the kiss cut, magenta) and ThroughCut (the card edge, cyan). In the PDF
  // both are spot colours, so the printer's software finds them by name; the SVG names the layers the same.
  const cuts = svgPage(`<g id="CutContour" fill="none" stroke="#ff00ff" stroke-width="0.0882"><path d="${cutD}"/></g>`
    + `<g id="ThroughCut" fill="none" stroke="#00b7ff" stroke-width="0.0882"><rect x="${f2(BLEED)}" y="${f2(BLEED)}" width="${f2(CARD.w)}" height="${f2(CARD.h)}"/></g>`);
  fs.writeFileSync(name('3-cut-lines.svg'), '<?xml version="1.0" encoding="UTF-8"?>\n' + cuts.replace('<svg ', '<svg version="1.1" '));
  cutPdf(name('3-cut-lines.pdf'), cut);
  // 4 the back of the backing paper (portrait)
  const codes = { main: id, left: id + 's', right: id + 'm' };
  const LAND = landscape(run), back = await backHtml(run, codes, warn), bw = (LAND ? CARD.w : CARD.h) + 2 * BLEED, bh = (LAND ? CARD.h : CARD.w) + 2 * BLEED;
  if (back.includes('data-b=')) { fs.mkdirSync(path.join(PRINT, 'back-edit'), { recursive: true });   // the editor page for this back: the same back, with handles
    fs.writeFileSync(path.join(PRINT, 'back-edit', id + '.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Card back editor ${id}</title><style>${BACKCSS()}</style></head><body><script>window.MF_RUN=${JSON.stringify(id)}</script><div id="stage">${back}</div><script>window.MF_FIT=function(){ document.querySelectorAll('.fit,.fitw').forEach(function(e){ e.style.fontSize=''; }); ${FIT.replace(/<\/script/g, '<\\/script')} }; MF_FIT(); if (document.fonts) document.fonts.ready.then(function(){ MF_FIT(); window.dispatchEvent(new Event('mf-fit')); });</script><script src="../back-edit.js"></script></body></html>`);
    // the same editor as a page for the Claude panel (a published Artifact): its own file, Save goes to the page's database
    fs.writeFileSync(path.join(PRINT, 'back-edit', id + '.artifact.html'), `<title>${esc((run.sponsor && run.sponsor.name) || id)} Back Editor</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>${BACKCSS()}</style>\n<script>window.MF_RUN=${JSON.stringify(id)};window.MF_ARTIFACT=true</script>\n<div id="stage">${back}</div>\n<script>window.MF_FIT=function(){ document.querySelectorAll('.fit,.fitw').forEach(function(e){ e.style.fontSize=''; }); ${FIT.replace(/<\/script/g, '<\\/script')} }; MF_FIT(); if (document.fonts) document.fonts.ready.then(function(){ MF_FIT(); window.dispatchEvent(new Event('mf-fit')); });</script>\n<script>${fs.readFileSync(path.join(PRINT, 'back-edit.js'), 'utf8').replace(/<\/script/g, '<\\/script')}</script>`); }
  await pdf(back, bw, bh, name('4-back.pdf'), BACKCSS() + `.pg{width:${f2(bw)}mm!important;height:${f2(bh)}mm!important}`);
  await shot(back, bw, bh, name('4-back.png'), { css: BACKCSS() + `.pg{width:${f2(bw)}mm!important;height:${f2(bh)}mm!important}`, scale: true, dpi: 600 });

  // where each QR goes
  const B = run.back || {}, links = {};
  if (B.template === 'invite' || !B.template || B.qr) links[codes.main] = { to: (B.qr && B.qr.to) || '', run: id, what: 'invitation' };
  if (B.left) links[codes.left] = { to: B.left.to || '', run: id, what: B.left.label || 'left' };
  if (B.right) links[codes.right] = { to: B.right.to || '', run: id, what: B.right.label || 'right' };
  Object.entries(links).forEach(([c, v]) => { if (!v.to) warn.push(`QR ${c} (${v.what}) has no web address yet: it opens manna-fish.com until one is set.`); });
  if (B.template !== 'image' && !run.qr_direct) warn.push(`Every QR opens ${run.qr_base}<code> (counts the scan, then goes on). That page has to be live on manna-fish.com before cards are printed.`);
  if (run.qr_direct) Object.values(links).forEach((v) => { if (/manna-fish\.com/.test(v.to || '')) warn.push(`QR "${v.what}" opens ${v.to}: the devotional (?devo=1) only opens there once the new site is live on manna-fish.com.`); });
  if (run.status !== 'approved' && run.status !== 'ordered' && run.status !== 'shipped' && run.status !== 'delivered') warn.push(`Status is "${run.status || 'draft'}": approve the proof before ordering.`);

  // the proof: every layer, how they go together, the back, and what still needs doing
  const P = (w, h, inner) => `<svg viewBox="0 0 ${f2(w)} ${f2(h)}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const chk = `<defs><pattern id="ck" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#d6d6d6"/><rect width="2" height="2" fill="#f3f3f3"/><rect x="2" y="2" width="2" height="2" fill="#f3f3f3"/></pattern></defs>`;
  const cutsG = `<rect x="${f2(BLEED)}" y="${f2(BLEED)}" width="${f2(CARD.w)}" height="${f2(CARD.h)}" fill="none" stroke="#00b7ff" stroke-width=".35"/><path d="${cutD}" fill="none" stroke="#ff00ff" stroke-width=".35"/>`;
  const inkImg = `<image href="${ink}" width="${f2(PW)}" height="${f2(PH)}"/>`, under = `<rect width="${f2(PW)}" height="${f2(PH)}" fill="#000"/>${fishSvg(src, place.x, place.y, place.w)}`;
  const backPng = dataUrl(name('4-back.png'));
  const panel = (n, t, sub, svg) => `<div class="p"><h3><b>${n}</b>${t}</h3><p>${sub}</p>${svg}</div>`;
  const S = run.sponsor || {};
  const proof = `<div class="sheet"><div class="top"><div><h1>${esc(run.title || id)}</h1><p class="m">Run ${esc(id)} · ${esc(run.qty || '?')} cards · card 4.5 × 2.75 in (114.3 × 69.85 mm) · 1/8 in bleed · kiss cut 1/8 in outside the fish · fish ${f2(fishMM.w).toFixed(1)} × ${f2(fishMM.h).toFixed(1)} mm${S.name ? ' · sponsored by ' + esc(S.name) + (S.anonymous ? ' (anonymous on the card)' : '') : ''}</p></div><div class="st">${esc((run.status || 'draft').toUpperCase())}</div></div>
<div class="g">
${panel(1, 'Decal · clear vinyl, white ink only', 'White ink where the fish is white. The letters and everything else stay clear. Pink line: about where the kiss cut goes, vinyl only (the printer draws the real one). Blue: the card edge.', P(PW, PH, chk + `<rect width="${f2(PW)}" height="${f2(PH)}" fill="url(#ck)"/>` + inkImg + cutsG))}
${panel(2, 'Printed on the front of the backing paper · under the decal', 'Printed on the backing paper itself, not on the decal: black to the edge, the same fish in white, lined up exactly under the decal. It stays on the card when the decal is peeled off.', P(PW, PH, under + `<rect x="${f2(BLEED)}" y="${f2(BLEED)}" width="${f2(CARD.w)}" height="${f2(CARD.h)}" fill="none" stroke="#00b7ff" stroke-width=".35"/>`))}
${panel(3, 'On the card, before peeling', 'The clear decal sits on top of the printed backing paper (layer 2). The black printed underneath shows through the clear letters, so the fish reads white with black letters.', P(PW, PH, under + inkImg + cutsG))}
${panel(4, 'After the decal is peeled off: the print on the backing paper', 'This black and white fish is <b>not the decal</b>. It is <b>printed on the front of the backing paper</b> (layer 2), under the clear decal, and is seen once the decal is peeled away. The thin grey line is where the kiss cut was; the clear vinyl left outside it sits on the printed black. (Gold words are a note, not printed.)', P(PW, PH, under + `<path d="${cutD}" fill="none" stroke="#333" stroke-width=".35"/>`
  + `<text x="${f2(PW / 2)}" y="${f2(PH - 2.2)}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="2.5" letter-spacing=".12" fill="#f5d76e">PRINTED ON THE BACKING PAPER · SEEN AFTER THE DECAL IS PEELED OFF</text>`))}
</div>
<div class="row2${LAND ? ' land' : ''}"><div class="p bk"><h3><b>5</b>Back of the backing paper</h3><p>${LAND ? 'Reads upright held the same way as the fish (landscape).' : 'Reads upright when the card is turned on its side.'} Blue: the card edge.</p><img src="${backPng}"></div>
<div class="p nt"><h3>Where the QR codes go</h3><ul>${Object.entries(links).map(([c, v]) => `<li><b>${esc(qrUrl(run, c))}</b><br>${esc(v.what)}${run.qr_direct ? ' (straight to the address, scans not counted)' : ' → ' + esc(v.to || 'not set yet (opens manna-fish.com)')}</li>`).join('')}</ul>
<h3>Before printing</h3><ul class="w">${warn.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Nothing left. Ready.</li>'}</ul>
<h3>Files for the printer</h3><ul class="f"><li>${id}-1-decal-white-ink (.png 1200 dpi, .pdf)</li><li>${id}-2-backing-front (.pdf vector, .png 1200 dpi)</li><li>${id}-3-cut-lines (.pdf with CutContour and ThroughCut, .svg): kept here, sent only if the printer asks${run.send_cut_file ? ' (this run sends it)' : ''}</li><li>${id}-4-back (.pdf, .png 600 dpi)</li><li>All of them together: ${id}-print-files.zip</li></ul></div></div></div>`;
  const PCSS = `body{margin:0;background:#fff}.sheet{width:1500px;padding:28px;box-sizing:border-box;font:15px/1.4 Arial,sans-serif;color:#111}
.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px}h1{margin:0;font-size:24px}.m{margin:4px 0 0;color:#444}
.st{font-weight:700;border:2px solid #b45309;color:#b45309;border-radius:8px;padding:6px 12px;font-size:18px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px}.p h3{margin:0 0 2px;font-size:16px}.p h3 b{display:inline-block;background:#111;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;margin-right:8px;font-size:13px}
.p p{margin:0 0 6px;color:#444}.p svg{display:block;width:100%;border:1px solid #bbb}
.row2{display:grid;grid-template-columns:330px 1fr;gap:26px;margin-top:20px}.row2.land{grid-template-columns:560px 1fr}.bk img{width:100%;border:1px solid #00b7ff}.nt ul{margin:4px 0 14px;padding-left:18px}.nt li{margin:3px 0}.nt .w li{color:#9a3412}.nt h3{margin:0}`;
  const pp = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1.5 });
  await pp.setContent(`<html><head><style>${PCSS}</style></head><body>${proof}</body></html>`, { waitUntil: 'load' });
  await pp.screenshot({ path: name('proof.png'), fullPage: true });
  const ph = await pp.evaluate(() => document.querySelector('.sheet').offsetHeight);
  await pp.pdf({ path: name('proof.pdf'), width: '1500px', height: (ph + 4) + 'px', printBackground: true, pageRanges: '1' }); await pp.close();

  // notes for the printer
  fs.writeFileSync(name('printer-notes.md'), `# ${run.title || id} (run ${id})

Card: 4.5 x 2.75 in (114.3 x 69.85 mm), custom size (not 2.8 in). Every file includes a 1/8 in (3.175 mm) bleed on each side, so the fish-side files are ${f2(PW)} x ${f2(PH)} mm and the back is ${f2(bw)} x ${f2(bh)} mm. All files line up with each other at the same size.

1. **${id}-1-decal-white-ink** : clear vinyl, white ink only. White where the fish is white; the letters and everything else are clear (no ink).
2. **${id}-2-backing-front** : printed on the FRONT of the backing paper, under the decal (not the back of the paper). Black over the whole card, the same fish in white, lined up exactly under the decal.
${run.send_cut_file ? `3. **${id}-3-cut-lines** : two spot colours. **CutContour** (magenta) is the kiss cut, through the vinyl only, 1/16 in outside the fish. **ThroughCut** (cyan) is the card edge, cut through everything. The SVG has the same two layers.` : `3. **Cut lines (R0015-3-cut-lines)** : THE FRONT DECAL IS KISS CUT. Cut through the clear vinyl only, in the shape of the fish, about 1/8 in (3 mm) or less outside the fish (magenta CutContour). Do not cut the backing paper there, so the card stays whole when the decal is peeled off. Then cut the card edge all the way through at 4.5 x 2.75 in (blue ThroughCut). You know the right distance for your machines; our cut line file is ready if you would rather use it.`}
4. **${id}-4-back** : printed on the BACK of the backing paper. ${LAND ? 'It reads upright held the same way as the fish side (landscape).' : 'It reads upright when the card is turned on its side (portrait).'}

The decal's white ink is the PNG (1200 dpi, transparent where there is no ink); the PDF holds the same picture. Colours are RGB: please convert to your press colours, and use a rich black for the black areas if that is what you recommend.

Quantity: ${run.qty || '?'}. Please send a proof showing all four before taking payment.
`);
  // everything the printer needs in one file to attach
  const zip = name('print-files.zip'); try { fs.unlinkSync(zip); } catch (e) { /* first time */ }
  const { execFileSync } = await import('node:child_process');
  execFileSync('zip', ['-j', '-q', zip].concat(['1-decal-white-ink.png', '1-decal-white-ink.pdf', '2-backing-front.pdf', '2-backing-front.png', '4-back.pdf', '4-back.png', 'printer-notes.md', 'proof.pdf'].concat(run.send_cut_file ? ['3-cut-lines.pdf', '3-cut-lines.svg'] : []).map(name)));
  await page.close();
  return { id, title: run.title || id, status: run.status || 'draft', qty: run.qty || 0, fish: run.fish, sponsor: S.name || '', anonymous: !!S.anonymous, codes, links, warn, editor: back.includes('data-b='), made: new Date().toISOString() };
}

const arg = process.argv.slice(2), all = fs.readdirSync(path.join(PRINT, 'runs')).filter((f) => /^R\d+\.json$/.test(f)).map((f) => f.replace('.json', '')).sort();
async function buildKit() {
  KIT = true; process.env.MF_SITE = 'http://127.0.0.1:9'; wordData('BUILD');
  const t = (k) => `§${k}§`;
  WORDS['§TPL§'] = { title: t('T'), gkw: t('GKW'), gks: t('GKS'), gkm: t('GKM'), gst: t('GST'), hbw: t('HBW'), hbs: t('HBS'), hbm: t('HBM'), hst: t('HST'), refs: [1, 2, 3, 4].map((n) => [t(`R${n}N`), t(`R${n}Q`)]) };
  const mk = (logo) => ({ id: 'KIT', fish: { id: 'X', word: 'X', study: '§TPL§' }, sponsor: { name: t('NAME'), logo: logo ? t('LOGO') : undefined, show: true }, qr_direct: true,
    back: { template: 'study', refs: 4, orientation: 'landscape', layout: 'stack', credit: t('CREDIT'), left: { label: t('LABL'), to: 'x' }, right: { label: t('LABR'), to: 'x' },
      kicker: { logo: 'brand/mannafish-wordmark-fish-wide.png', note: 'Not for resale', right: 'A Word Study\nDevotional' } } });
  const out = path.join(PRINT, 'kit'); fs.mkdirSync(out, { recursive: true });
  for (const [nm, logo] of [['logo', true], ['text', false]]) {
    const h = await backHtml(mk(logo), { main: 'KIT', left: 'L', right: 'R' }, []);
    fs.writeFileSync(path.join(out, `back-${nm}.tpl.html`), h.replace(/^<script>window\.MF_ADJ=[^<]*<\/script>/, ''));
  }
  fs.writeFileSync(path.join(out, 'back.css'), BACKCSS());
  fs.writeFileSync(path.join(out, 'fit.js'), `/* the same fit step the printer files use: window.MFfit(adj) after the back is on the page and the fonts are loaded */\nwindow.MFfit = function (adj) { window.MF_ADJ = adj || {}; document.querySelectorAll('.fit,.fitw').forEach(function (e) { e.style.fontSize = ''; }); ${FIT} };\n`);
  const a = path.join(PRINT, 'adjust', 'R0015.json'); if (fs.existsSync(a)) fs.writeFileSync(path.join(out, 'default-adj.json'), JSON.stringify(JSON.parse(fs.readFileSync(a, 'utf8')).adj, null, 1) + '\n');
  console.log('kit written to print/kit/');
}
if (arg.includes('--kit')) { await buildKit(); process.exit(0); }
const ids = arg.includes('--all') || !arg.length ? all : arg;
const browser = await chromium.launch();
const done = [];
for (const id of ids) { process.stdout.write(`${id} ... `); const r = await make(id, browser); done.push(r); console.log(`done (${r.warn.length} to check)`); r.warn.forEach((w) => console.log('   - ' + w)); }
await browser.close();
// the list of runs and where every QR goes (the site serves both: /print/admin/ and /q/<code>)
const idxF = path.join(PRINT, 'runs.json'), idx = fs.existsSync(idxF) ? JSON.parse(fs.readFileSync(idxF, 'utf8')) : { runs: [] };
done.forEach((r) => { const { links, ...rest } = r; idx.runs = idx.runs.filter((x) => x.id !== r.id).concat([rest]); });
idx.runs.sort((a, b) => a.id.localeCompare(b.id)); fs.writeFileSync(idxF, JSON.stringify(idx, null, 1) + '\n');
const lkF = path.join(PRINT, 'links.json'), lk = fs.existsSync(lkF) ? JSON.parse(fs.readFileSync(lkF, 'utf8')) : {};
done.forEach((r) => Object.assign(lk, r.links)); fs.writeFileSync(lkF, JSON.stringify(lk, null, 1) + '\n');
