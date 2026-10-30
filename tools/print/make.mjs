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
//   3  the cut lines: kiss cut 1/8 in outside the fish (vinyl only), and the card edge -> -3-cut-lines.svg / .pdf
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
const CARD = { w: 4.5 * MM, h: 2.75 * MM }, BLEED = MM / 8, KISS = MM / 8, SAFE = 3;
const PW = CARD.w + 2 * BLEED, PH = CARD.h + 2 * BLEED;   // a page with bleed, fish side
const px = (mm, dpi = DPI) => Math.round(mm / MM * dpi);
const f2 = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const font = (rel) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(HERE, 'node_modules/@fontsource', rel)).toString('base64');
const dataUrl = (file) => { const b = fs.readFileSync(file), ext = path.extname(file).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext};base64,` + b.toString('base64'); };

// ── the fish ──
function fishFile(f) {
  const id = String(f.word || f.id || '').toUpperCase(), l = f.lang || 'en';
  const tries = [path.join(ROOT, 'fish', l, id + '.svg'), path.join(ROOT, 'fish', id + '.svg'), path.join(ROOT, 'fish', l, f.word + '.svg')];
  const hit = tries.find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`No fish found for ${JSON.stringify(f)} (looked in fish/${l}/ and fish/)`);
  return hit;
}
// the fish as an <svg> placed in millimetres inside another svg
function fishSvg(src, x, y, w) {
  return src.replace(/<svg\b[^>]*?viewBox="([^"]+)"[^>]*>/, (m, vb) => `<svg x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(w / 2)}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;shape-rendering:geometricPrecision" preserveAspectRatio="xMidYMid meet">`);
}

// ── in the browser: where the ink is, and the kiss cut around it ──
const BROWSER = String.raw`
window.MFload = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no;
  im.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(src.replace(/<svg\b/, '<svg width="4000" height="2000"')))); });
// the box the ink fills, in the art's own units (4000 x 2000)
window.MFbox = async (src) => { const im = await MFload(src), w = 2000, h = 1000, c = new OffscreenCanvas(w, h), x = c.getContext('2d');
  x.drawImage(im, 0, 0, w, h); const a = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (a[(y * w + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x: x0 * 2, y: y0 * 2, w: (x1 - x0 + 1) * 2, h: (y1 - y0 + 1) * 2 }; };
// the kiss cut: the fish's outline filled in (no holes), grown by r mm, traced, smoothed; points in mm on the page
window.MFcut = async (src, place, page, r, ppm) => {
  const im = await MFload(src), W = Math.ceil(page.w * ppm), H = Math.ceil(page.h * ppm), c = new OffscreenCanvas(W, H), x = c.getContext('2d');
  x.drawImage(im, place.x * ppm, place.y * ppm, place.w * ppm, place.w / 2 * ppm);
  const a = x.getImageData(0, 0, W, H).data, N = W * H, out = new Uint8Array(N), st = [];
  const push = (i) => { if (out[i] || a[i * 4 + 3] > 16) return; out[i] = 1; st.push(i); };
  for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i); } for (let j = 0; j < H; j++) { push(j * W); push(j * W + W - 1); }
  while (st.length) { const k = st.pop(), xx = k % W, yy = (k - xx) / W; if (xx > 0) push(k - 1); if (xx < W - 1) push(k + 1); if (yy > 0) push(k - W); if (yy < H - 1) push(k + W); }
  // squared distance to the nearest inside pixel (Felzenszwalb & Huttenlocher), then everything within r
  const INF = 1e20, f = new Float64Array(Math.max(W, H)), d = new Float64Array(Math.max(W, H)), v = new Int32Array(Math.max(W, H)), z = new Float64Array(Math.max(W, H) + 1), D = new Float64Array(N);
  for (let k = 0; k < N; k++) D[k] = out[k] ? INF : 0;
  const dt = (n) => { let kk = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) { let s; do { const p = v[kk]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[kk]) kk--; else break; } while (kk >= 0);
      kk++; v[kk] = q; z[kk] = s; z[kk + 1] = INF; }
    kk = 0; for (let q = 0; q < n; q++) { while (z[kk + 1] < q) kk++; const p = v[kk]; d[q] = (q - p) * (q - p) + f[p]; } };
  for (let xx = 0; xx < W; xx++) { for (let yy = 0; yy < H; yy++) f[yy] = D[yy * W + xx]; dt(H); for (let yy = 0; yy < H; yy++) D[yy * W + xx] = d[yy]; }
  for (let yy = 0; yy < H; yy++) { for (let xx = 0; xx < W; xx++) f[xx] = D[yy * W + xx]; dt(W); for (let xx = 0; xx < W; xx++) D[yy * W + xx] = d[xx]; }
  const R2 = (r * ppm) * (r * ppm), g = new Uint8Array(N); for (let k = 0; k < N; k++) g[k] = D[k] <= R2 ? 1 : 0;
  // the outline: marching squares round the outside
  const val = (i, j) => (i >= 0 && j >= 0 && i < W && j < H && g[j * W + i]) ? 1 : 0;
  let sx = -1, sy = -1; outer: for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) { const s = val(i, j) | val(i + 1, j) << 1 | val(i, j + 1) << 2 | val(i + 1, j + 1) << 3; if (s > 0 && s < 15) { sx = i; sy = j; break outer; } }
  const pts = []; let cx = sx, cy = sy, prev = 0, guard = 0; // 1 up 2 right 3 down 4 left
  do { const s = val(cx, cy) | val(cx + 1, cy) << 1 | val(cx, cy + 1) << 2 | val(cx + 1, cy + 1) << 3; let nx;
    switch (s) { case 1: nx = 1; break; case 2: nx = 2; break; case 3: nx = 2; break; case 4: nx = 4; break; case 5: nx = 1; break; case 6: nx = prev === 1 ? 4 : 2; break;
      case 7: nx = 2; break; case 8: nx = 3; break; case 9: nx = prev === 2 ? 1 : 3; break; case 10: nx = 3; break; case 11: nx = 3; break; case 12: nx = 4; break; case 13: nx = 1; break; case 14: nx = 4; break; default: nx = 2; }
    pts.push([cx + 1, cy + 1]); if (nx === 1) cy--; else if (nx === 2) cx++; else if (nx === 3) cy++; else cx--; prev = nx;
  } while ((cx !== sx || cy !== sy) && ++guard < 4e6);
  // smooth the pixel steps away, then keep only the points that matter
  let P = pts; for (let it = 0; it < 3; it++) { const Q = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; Q.push([p[0] * .75 + q[0] * .25, p[1] * .75 + q[1] * .25], [p[0] * .25 + q[0] * .75, p[1] * .25 + q[1] * .75]); } P = Q; }
  const rdp = (L, eps) => { if (L.length < 3) return L; const A = L[0], B = L[L.length - 1]; let dm = 0, im2 = 0;
    for (let i = 1; i < L.length - 1; i++) { const p = L[i], dx = B[0] - A[0], dy = B[1] - A[1], dd = Math.hypot(dx, dy) || 1, dist = Math.abs(dy * p[0] - dx * p[1] + B[0] * A[1] - B[1] * A[0]) / dd; if (dist > dm) { dm = dist; im2 = i; } }
    return dm > eps ? rdp(L.slice(0, im2 + 1), eps).slice(0, -1).concat(rdp(L.slice(im2), eps)) : [A, B]; };
  // a closed loop: split it at the point farthest from the start, simplify each half
  let far = 0, fd = 0; P.forEach((p, i) => { const dd = Math.hypot(p[0] - P[0][0], p[1] - P[0][1]); if (dd > fd) { fd = dd; far = i; } });
  P = rdp(P.slice(0, far + 1), 0.03 * ppm).slice(0, -1).concat(rdp(P.slice(far).concat([P[0]]), 0.03 * ppm).slice(0, -1));
  return P.map((p) => [p[0] / ppm, p[1] / ppm]); };
// the decal: white ink where the fish is white, nothing where it is black (the letters) or empty
window.MFink = async (src, place, page, dpi) => { const im = await MFload(src), k = dpi / 25.4, W = Math.round(page.w * k), H = Math.round(page.h * k), c = new OffscreenCanvas(W, H), x = c.getContext('2d');
  x.drawImage(im, place.x * k, place.y * k, place.w * k, place.w / 2 * k); const d = x.getImageData(0, 0, W, H), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 765; a[i + 3] = Math.round(a[i + 3] * l); a[i] = a[i + 1] = a[i + 2] = 255; }
  x.putImageData(d, 0, 0); const b = await c.convertToBlob({ type: 'image/png' }); const r = new FileReader();
  return await new Promise((ok) => { r.onload = () => ok(r.result); r.readAsDataURL(b); }); };
`;

// ── the back: the invitation template (portrait), filled from the run ──
async function backHtml(run, codes, warn) {
  const B = run.back || {}, S = run.sponsor || {}, w = CARD.h, h = CARD.w;   // portrait
  const qr = async (code) => (await QR.toString(run.qr_base + code, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } }))
    .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" width="100%" height="100%" ');
  const logo = (p, what) => { if (!p) return ''; const f = path.join(PRINT, p); if (!fs.existsSync(f)) { warn.push(`${what}: ${p} is missing`); return ''; }
    if (/DRAFT/.test(p)) warn.push(`${what} is a stand-in (${p}). Upload the original logo before printing.`); return dataUrl(f); };
  if (B.template === 'image') {
    const f = path.join(PRINT, B.image || ''); if (!B.image || !fs.existsSync(f)) throw new Error('back.image is missing');
    warn.push('The back is your own artwork: its QR codes are whatever is in the picture (no scan counts unless they point at manna-fish.com/q/...).');
    return `<div class="pg" style="background:#000"><img src="${dataUrl(f)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>`;
  }
  const L = B.left || null, Rt = B.right || null, showS = S.show !== false && S.name;
  const yl = logo(B.logo, 'The top logo'), sl = showS ? logo(S.logo, 'The sponsor logo') : '';
  return `<div class="pg"><div class="card" style="left:${BLEED}mm;top:${BLEED}mm;width:${w}mm;height:${h}mm">
  <div class="hd fit" style="top:4.2mm;height:8.4mm">${esc(B.heading || 'YOU’RE INVITED!')}</div>
  ${yl ? `<div class="lb" style="top:14.4mm;height:26mm"><img src="${yl}"></div>` : ''}
  <div class="tx fit" style="top:${yl ? 42.6 : 16}mm;height:${yl ? 18.6 : 44}mm"><span>${esc(B.text || '')}</span></div>
  <div class="qr" style="top:62mm;width:27mm;height:27mm;left:${(w - 27) / 2}mm">${await qr(codes.main)}</div>
  <div class="strip" style="top:91.2mm;height:20.4mm">
    ${L ? `<div class="col"><div class="sq">${await qr(codes.left)}</div><div class="lab fit"><span>${esc(L.label || '')}</span></div></div>` : '<div class="col"></div>'}
    <div class="col mid"><div class="sb">${showS ? (S.anonymous ? 'Freely given' : 'Sponsored by') : 'Freely given'}</div>${sl ? `<div class="sl"><img src="${sl}"></div>` : `<div class="sn fit"><span>${showS && !S.anonymous ? esc(S.name) : 'by a friend'}</span></div>`}</div>
    ${Rt ? `<div class="col"><div class="sq">${await qr(codes.right)}</div><div class="lab fit"><span>${esc(Rt.label || '')}</span></div></div>` : '<div class="col"></div>'}
  </div></div></div>`;
}
const BACKCSS = () => `@font-face{font-family:'Lilita One';src:url(${font('lilita-one/files/lilita-one-latin-400-normal.woff2')}) format('woff2')}
@font-face{font-family:'Archivo Narrow';font-weight:700;src:url(${font('archivo-narrow/files/archivo-narrow-latin-700-normal.woff2')}) format('woff2')}
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
.mid{justify-content:flex-start}.sb{font:400 2.3mm/1 'Lilita One',sans-serif;margin:.4mm 0 .8mm}.sl{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}.sl img{max-width:100%;max-height:100%;object-fit:contain}
.sn{flex:1;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;font:400 3mm/1.1 'Lilita One',sans-serif}`;
// words that don't fit get smaller until they do
const FIT = `document.querySelectorAll('.fit').forEach(function(e){ var s=parseFloat(getComputedStyle(e).fontSize), t=e.firstElementChild||e;
  for(var i=0;i<60&&(t.scrollWidth>e.clientWidth+.5||t.scrollHeight>e.clientHeight+.5||e.scrollHeight>e.clientHeight+.5);i++){ s*=.95; e.style.fontSize=s+'px'; } });`;

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
  const cut = await page.evaluate(([s2, p, pg, r]) => MFcut(s2, p, pg, r, 24), [src, place, { w: PW, h: PH }, KISS]);
  const cutD = 'M' + cut.map((p) => f2(p[0]) + ' ' + f2(p[1])).join(' L') + ' Z';

  const svgPage = (inner, w = PW, h = PH) => `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(w)}mm" height="${f2(h)}mm" viewBox="0 0 ${f2(w)} ${f2(h)}">${inner}</svg>`;
  const shot = async (html, w, h, file2, opts = {}) => {
    const p2 = await browser.newPage({ viewport: { width: px(w, opts.dpi || DPI), height: px(h, opts.dpi || DPI) }, deviceScaleFactor: 1 });
    await p2.setContent(`<html><head><style>html,body{margin:0;background:${opts.clear ? 'transparent' : '#fff'}}body>svg,.pg{display:block;width:100vw;height:100vh}${opts.css || ''}</style></head><body>${html}<script>${FIT}</script></body></html>`, { waitUntil: 'load' });
    if (opts.scale) await p2.evaluate((k) => { const e = document.querySelector('.pg'); e.style.zoom = k; }, px(w, opts.dpi || DPI) / (w / MM * 96));
    await p2.evaluate(FIT); await p2.screenshot({ path: file2, omitBackground: !!opts.clear }); await p2.close(); };
  const pdf = async (html, w, h, file2, css = '') => { const p2 = await browser.newPage();
    await p2.setContent(`<html><head><style>@page{size:${f2(w)}mm ${f2(h)}mm;margin:0}html,body{margin:0}svg{display:block}${css}</style></head><body>${html}<script>${FIT}</script></body></html>`, { waitUntil: 'load' });
    await p2.evaluate(FIT); await p2.pdf({ path: file2, width: `${f2(w)}mm`, height: `${f2(h)}mm`, printBackground: true, pageRanges: '1' }); await p2.close(); };

  // 1 the decal, white ink only (letters clear)
  const ink = await page.evaluate(([s2, p, pg, d]) => MFink(s2, p, pg, d), [src, place, { w: PW, h: PH }, DPI]);
  fs.writeFileSync(name('1-decal-white-ink.png'), Buffer.from(ink.split(',')[1], 'base64'));
  await pdf(svgPage(`<image href="${ink}" x="0" y="0" width="${f2(PW)}" height="${f2(PH)}"/>`), PW, PH, name('1-decal-white-ink.pdf'));
  // 2 the front of the backing paper: black to the bleed, the same fish in white, in the same place
  const backing = svgPage(`<rect width="${f2(PW)}" height="${f2(PH)}" fill="#000"/>${fishSvg(src, place.x, place.y, place.w)}`);
  await pdf(backing, PW, PH, name('2-backing-front.pdf'));
  await shot(backing, PW, PH, name('2-backing-front.png'));
  // 3 the cut lines: the kiss cut (vinyl only) and the card edge (through everything)
  const cuts = svgPage(`<g id="CardCut" fill="none" stroke="#ff00ff" stroke-width="0.0882"><rect x="${f2(BLEED)}" y="${f2(BLEED)}" width="${f2(CARD.w)}" height="${f2(CARD.h)}"/></g>`
    + `<g id="KissCut" fill="none" stroke="#00b7ff" stroke-width="0.0882"><path d="${cutD}"/></g>`);
  fs.writeFileSync(name('3-cut-lines.svg'), '<?xml version="1.0" encoding="UTF-8"?>\n' + cuts.replace('<svg ', '<svg version="1.1" '));
  await pdf(cuts, PW, PH, name('3-cut-lines.pdf'));
  // 4 the back of the backing paper (portrait)
  const codes = { main: id, left: id + 's', right: id + 'm' };
  const back = await backHtml(run, codes, warn), bw = CARD.h + 2 * BLEED, bh = CARD.w + 2 * BLEED;
  await pdf(back, bw, bh, name('4-back.pdf'), BACKCSS() + `.pg{width:${f2(bw)}mm;height:${f2(bh)}mm}`);
  await shot(back, bw, bh, name('4-back.png'), { css: BACKCSS(), scale: true, dpi: 600 });

  // where each QR goes
  const B = run.back || {}, links = {};
  links[codes.main] = { to: (B.qr && B.qr.to) || '', run: id, what: 'invitation' };
  if (B.left) links[codes.left] = { to: B.left.to || '', run: id, what: B.left.label || 'left' };
  if (B.right) links[codes.right] = { to: B.right.to || '', run: id, what: B.right.label || 'right' };
  Object.entries(links).forEach(([c, v]) => { if (!v.to) warn.push(`QR ${c} (${v.what}) has no web address yet: it opens manna-fish.com until one is set.`); });
  if (B.template !== 'image') warn.push(`Every QR opens ${run.qr_base}<code> (counts the scan, then goes on). That page has to be live on manna-fish.com before cards are printed.`);
  if (run.status !== 'approved' && run.status !== 'ordered' && run.status !== 'shipped' && run.status !== 'delivered') warn.push(`Status is "${run.status || 'draft'}": approve the proof before ordering.`);

  // the proof: every layer, how they go together, the back, and what still needs doing
  const P = (w, h, inner) => `<svg viewBox="0 0 ${f2(w)} ${f2(h)}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const chk = `<defs><pattern id="ck" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#d6d6d6"/><rect width="2" height="2" fill="#f3f3f3"/><rect x="2" y="2" width="2" height="2" fill="#f3f3f3"/></pattern></defs>`;
  const cutsG = `<rect x="${f2(BLEED)}" y="${f2(BLEED)}" width="${f2(CARD.w)}" height="${f2(CARD.h)}" fill="none" stroke="#ff00ff" stroke-width=".35"/><path d="${cutD}" fill="none" stroke="#00b7ff" stroke-width=".35"/>`;
  const inkImg = `<image href="${ink}" width="${f2(PW)}" height="${f2(PH)}"/>`, under = `<rect width="${f2(PW)}" height="${f2(PH)}" fill="#000"/>${fishSvg(src, place.x, place.y, place.w)}`;
  const backPng = dataUrl(name('4-back.png'));
  const panel = (n, t, sub, svg) => `<div class="p"><h3><b>${n}</b>${t}</h3><p>${sub}</p>${svg}</div>`;
  const S = run.sponsor || {};
  const proof = `<div class="sheet"><div class="top"><div><h1>${esc(run.title || id)}</h1><p class="m">Run ${esc(id)} · ${esc(run.qty || '?')} cards · card 4.5 × 2.75 in (114.3 × 69.85 mm) · 1/8 in bleed · kiss cut 1/8 in outside the fish · fish ${f2(fishMM.w).toFixed(1)} × ${f2(fishMM.h).toFixed(1)} mm${S.name ? ' · sponsored by ' + esc(S.name) + (S.anonymous ? ' (anonymous on the card)' : '') : ''}</p></div><div class="st">${esc((run.status || 'draft').toUpperCase())}</div></div>
<div class="g">
${panel(1, 'Decal · clear vinyl, white ink only', 'White ink where the fish is white. The letters and everything else stay clear. Blue line: kiss cut, vinyl only.', P(PW, PH, chk + `<rect width="${f2(PW)}" height="${f2(PH)}" fill="url(#ck)"/>` + inkImg + cutsG))}
${panel(2, 'Printed on the front of the backing paper · under the decal', 'Printed on the backing paper itself, not on the decal: black to the edge, the same fish in white, lined up exactly under the decal. It stays on the card when the decal is peeled off.', P(PW, PH, under + `<rect x="${f2(BLEED)}" y="${f2(BLEED)}" width="${f2(CARD.w)}" height="${f2(CARD.h)}" fill="none" stroke="#ff00ff" stroke-width=".35"/>`))}
${panel(3, 'On the card, before peeling', 'The clear decal sits on top of the printed backing paper (layer 2). The black printed underneath shows through the clear letters, so the fish reads white with black letters.', P(PW, PH, under + inkImg + cutsG))}
${panel(4, 'After the decal is peeled off: the print on the backing paper', 'This black and white fish is <b>not the decal</b>. It is <b>printed on the front of the backing paper</b> (layer 2), under the clear decal, and is seen once the decal is peeled away. The thin grey line is where the kiss cut was; the clear vinyl left outside it sits on the printed black. (Gold words are a note, not printed.)', P(PW, PH, under + `<path d="${cutD}" fill="none" stroke="#333" stroke-width=".35"/>`
  + `<text x="${f2(PW / 2)}" y="${f2(PH - 2.2)}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="2.5" letter-spacing=".12" fill="#f5d76e">PRINTED ON THE BACKING PAPER · SEEN AFTER THE DECAL IS PEELED OFF</text>`))}
</div>
<div class="row2"><div class="p bk"><h3><b>5</b>Back of the backing paper</h3><p>Reads upright when the card is turned on its side. Pink: the card edge.</p><img src="${backPng}"></div>
<div class="p nt"><h3>Where the QR codes go</h3><ul>${Object.entries(links).map(([c, v]) => `<li><b>${esc(run.qr_base + c)}</b><br>${esc(v.what)} → ${esc(v.to || 'not set yet (opens manna-fish.com)')}</li>`).join('')}</ul>
<h3>Before printing</h3><ul class="w">${warn.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Nothing left. Ready.</li>'}</ul>
<h3>Files for the printer</h3><ul class="f"><li>${id}-1-decal-white-ink (.png 1200 dpi, .pdf)</li><li>${id}-2-backing-front (.pdf vector, .png 1200 dpi)</li><li>${id}-3-cut-lines (.svg, .pdf)</li><li>${id}-4-back (.pdf, .png 600 dpi)</li></ul></div></div></div>`;
  const PCSS = `body{margin:0;background:#fff}.sheet{width:1500px;padding:28px;box-sizing:border-box;font:15px/1.4 Arial,sans-serif;color:#111}
.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px}h1{margin:0;font-size:24px}.m{margin:4px 0 0;color:#444}
.st{font-weight:700;border:2px solid #b45309;color:#b45309;border-radius:8px;padding:6px 12px;font-size:18px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px}.p h3{margin:0 0 2px;font-size:16px}.p h3 b{display:inline-block;background:#111;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;margin-right:8px;font-size:13px}
.p p{margin:0 0 6px;color:#444}.p svg{display:block;width:100%;border:1px solid #bbb}
.row2{display:grid;grid-template-columns:330px 1fr;gap:26px;margin-top:20px}.bk img{width:100%;border:1px solid #ff00ff}.nt ul{margin:4px 0 14px;padding-left:18px}.nt li{margin:3px 0}.nt .w li{color:#9a3412}.nt h3{margin:0}`;
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
3. **${id}-3-cut-lines** : blue (layer "KissCut") is the kiss cut, through the vinyl only, 1/8 in outside the fish. Pink (layer "CardCut") is the card edge, cut through everything.
4. **${id}-4-back** : printed on the BACK of the backing paper. It reads upright when the card is turned on its side (portrait).

Quantity: ${run.qty || '?'}. Please send a proof showing all four before taking payment.
`);
  await page.close();
  return { id, title: run.title || id, status: run.status || 'draft', qty: run.qty || 0, fish: run.fish, sponsor: S.name || '', anonymous: !!S.anonymous, codes, links, warn, made: new Date().toISOString() };
}

const arg = process.argv.slice(2), all = fs.readdirSync(path.join(PRINT, 'runs')).filter((f) => /^R\d+\.json$/.test(f)).map((f) => f.replace('.json', '')).sort();
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
