#!/usr/bin/env node
// A header card for a retail display (Ken, 10 Nov): a 6 x 4 in landscape card that sits above a tray of free MannaFish decals.
//   node tools/print/header.mjs R0012 [--direct]      (uses the run's fish, sponsor logo and language; QR to the free devotional)
// Writes print/out/headers/<run>-header-<counted|direct>.png (600 dpi, 1/8 in bleed) and .pdf. The fish are free and given away: "Take one".
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url); const { chromium } = require('playwright'); const QR = require('qrcode');
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..'), PRINT = path.join(ROOT, 'print');
const run = process.argv[2], direct = process.argv.includes('--direct');
if (!/^R\d+$/.test(run || '')) { console.error('Which run? node tools/print/header.mjs R0012 [--direct]'); process.exit(1); }
const R = JSON.parse(fs.readFileSync(path.join(PRINT, 'runs', run + '.json'), 'utf8')), es = R.fish.lang === 'es', S = R.sponsor || {};
const font = (rel) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(HERE, 'node_modules/@fontsource', rel)).toString('base64');
const img = (p) => { const f = path.join(PRINT, p), ext = path.extname(f).slice(1).replace('svg', 'svg+xml'); return `data:image/${ext};base64,` + fs.readFileSync(f).toString('base64'); };
const front = 'data:image/png;base64,' + fs.readFileSync(path.join(PRINT, 'out', run, run + '-2-backing-front.png')).toString('base64');
const code = run + 'h', to = (R.back && R.back.right && R.back.right.to) || 'https://manna-fish.com/devotional';
const url = direct ? to + (to.includes('?') ? '&' : '?') + 'utm_source=mannafish&utm_medium=header&utm_campaign=' + code : 'https://manna-fish.com/q/' + code;
const qr = await QR.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#ffffff', light: '#000000' } });
const T = es ? { take: 'LLEVA UNO.', free: 'Es gratis.', line: 'Una palabra de la Biblia en medio de un pez.', by: 'Patrocinado por', qr: 'Devocional\nMannaFish gratis' }
  : { take: 'TAKE ONE.', free: "It's free.", line: 'One word of Scripture in the middle of a fish.', by: 'Sponsored by', qr: 'Free MannaFish\ndevotional' };
const logo = S.logo ? `<img class="lg" src="${img(S.logo)}">` : `<b class="nm">${S.name || ''}</b>`;
const W = 6.25, H = 4.25;   // 6 x 4 in plus 1/8 in bleed
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:'Lilita One';src:url(${font('lilita-one/files/lilita-one-latin-400-normal.woff2')}) format('woff2')}
@font-face{font-family:'Spectral';font-style:italic;src:url(${font('spectral/files/spectral-latin-400-italic.woff2')}) format('woff2')}
@page{size:${W}in ${H}in;margin:0}*{box-sizing:border-box}html,body{margin:0;width:${W}in;height:${H}in;background:#000;color:#fff;overflow:hidden}
.c{position:relative;width:${W}in;height:${H}in}
.fish{position:absolute;left:.05in;top:.2in;width:3.55in;height:2.37in;background:url(${front}) center/contain no-repeat}
.hole{position:absolute;left:50%;top:.2in;width:.3in;height:.3in;margin-left:-.15in;border:.02in dashed #777;border-radius:50%}
.r{position:absolute;left:3.5in;right:.3in;top:.55in;text-align:center}
.take{white-space:nowrap;font:400 .46in/1 'Lilita One',sans-serif;letter-spacing:.01em}.free{font:400 .3in/1.1 'Lilita One',sans-serif;margin-top:.05in}
.ln{font:italic 400 .16in/1.3 'Spectral',serif;margin-top:.14in;color:#d8dde3}
.strip{position:absolute;left:.3in;right:.3in;bottom:.3in;height:1.15in;border-top:.015in solid #555;display:flex;align-items:center;justify-content:space-between;padding-top:.08in}
.by{width:3.1in;text-align:center;font:400 .15in/1 'Lilita One',sans-serif}.by .lg{display:block;max-height:.86in;max-width:2.9in;margin:.04in auto 0;object-fit:contain}.nm{font:400 .26in/1.1 'Lilita One',sans-serif;display:block;margin-top:.1in}
.q{display:flex;align-items:center;gap:.14in;text-align:left;font:400 .17in/1.15 'Lilita One',sans-serif;white-space:pre-line}.q svg{width:.95in;height:.95in}
</style><div class="c"><div class="hole"></div><div class="fish"></div>
<div class="r"><div class="take">${T.take}</div><div class="free">${T.free}</div><div class="ln">${T.line}</div></div>
<div class="strip"><div class="by">${T.by}${logo}</div><div class="q">${qr}<span>${T.qr}</span></div></div></div>`;
const out = path.join(PRINT, 'out', 'headers'); fs.mkdirSync(out, { recursive: true });
const base = path.join(out, `${run}-header-${direct ? 'direct' : 'counted'}`);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: Math.round(W * 96), height: Math.round(H * 96) }, deviceScaleFactor: 6.25 })).newPage();
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: base + '.png' }); await p.pdf({ path: base + '.pdf', width: W + 'in', height: H + 'in', printBackground: true });
await b.close();
if (!direct) { const lf = path.join(PRINT, 'links.json'), L = JSON.parse(fs.readFileSync(lf, 'utf8')); L[code] = { to, run, what: T.qr.replace('\n', ' ') }; fs.writeFileSync(lf, JSON.stringify(L, null, 1) + '\n'); }
console.log('wrote', path.relative(ROOT, base) + '.png/.pdf', '\n QR:', url);
