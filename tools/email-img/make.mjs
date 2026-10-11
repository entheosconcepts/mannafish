// Ken, 11 Oct: Gmail on iPhone flips the colours of an email when the phone is in dark mode
// (black turns white, the MannaFish blue goes pale). Pictures are never flipped, so the coloured
// parts of the email -- the blue headings and the buttons -- are pictures made here.
// Run with playwright installed:  node tools/email-img/make.mjs  (writes w/img/email/*.png and lib/email-img.json;
// set CHROME to a Chromium path if playwright has no browser of its own)
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = new URL('../../w/img/email/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const H = 'font:900 15px Liberation Sans,Arial,sans-serif;padding-left:.14em;letter-spacing:.14em;text-transform:uppercase;color:#2a5fb0';
const H2 = 'font:900 19px Liberation Sans,Arial,sans-serif;padding-left:.12em;letter-spacing:.12em;text-transform:uppercase;color:#2a5fb0';
const B = 'display:inline-block;color:#fff;font:bold 16px Liberation Sans,Arial,sans-serif;padding:13px 26px;border-radius:999px;white-space:nowrap';
const BF = B + ';background:#2a5fb0', BO = B + ';background:#000;box-shadow:inset 0 0 0 1px #2a5fb0';
const ITEMS = {
  en: { welcome: [H, 'Welcome! Your first MannaFish:'], word: [H, 'Today’s word'], today: [H, 'Today’s verse'], fish: [H, 'The verse on the fish'],
    dbl: [H2, 'Your double portion'], sab: [H, 'For the Sabbath'], listen: [BF, 'See today’s MannaFish'], read: [BO, 'Read the chapter'], sabread: [BO, 'Read it'] },
  es: { welcome: [H, '¡Bienvenido! Tu primer MannaFish:'], word: [H, 'La palabra de hoy'], today: [H, 'El versículo de hoy'], fish: [H, 'El versículo del pez'],
    dbl: [H2, 'Tu porción doble'], sab: [H, 'Para el día de reposo'], listen: [BF, 'Ver el MannaFish de hoy'], read: [BO, 'Leer el capítulo'], sabread: [BO, 'Leerlo'] },
};
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const p = await b.newPage({ deviceScaleFactor: 2 });
const sizes = {};
for (const [l, set] of Object.entries(ITEMS)) for (const [k, [css, txt]] of Object.entries(set)) {
  await p.setContent(`<body style="margin:0;background:transparent"><span id=x style="display:inline-block;${css}">${txt}</span></body>`);
  const el = await p.$('#x'), bb = await el.boundingBox();
  await el.screenshot({ path: OUT + `${l}-${k}.png`, omitBackground: true });
  sizes[`${l}-${k}`] = [Math.round(bb.width), Math.round(bb.height)];
}
// a black dot for the backgrounds (Gmail leaves background pictures alone) and the thin dividing line
await p.setContent('<body style="margin:0"><div id=k style="width:4px;height:4px;background:#000"></div><div id=r style="width:520px;height:1px;background:#1f2a33"></div></body>');
await (await p.$('#k')).screenshot({ path: OUT + 'bk.png' });
await (await p.$('#r')).screenshot({ path: OUT + 'rule.png' });
fs.writeFileSync(new URL('../../netlify/functions/lib/email-img.json', import.meta.url), JSON.stringify(sizes) + '\n');
await b.close();
console.log(sizes);
