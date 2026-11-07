// Redraws the saved fish pictures (fish/<id>.svg and the email fallback w/img/<id>.png) from the word-size standard kept on the server.
// The standard is the edit sheet's saved state (edit-save.mjs), readable without a password at /api/fish-standard. The email pictures and the
// edit sheet already follow it live; this keeps the saved files (the site's fish pages, the print tool, the fallback picture) in step.
//   node tools/fish/redraw-standard.mjs                 -> says how many fish would change (touches nothing)
//   node tools/fish/redraw-standard.mjs --write         -> writes the changed fish/<id>.svg
//   node tools/fish/redraw-standard.mjs --write --png   -> and the w/img/<id>.png of each changed fish
//   --url <address> | --file <standard.json>            (default: the test site)
// Needs: npm install in the repo root (opentype.js, @resvg/resvg-js).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { drawFish, findFish } from '../../netlify/functions/lib/fishdraw.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), a = process.argv.slice(2), has = (f) => a.includes(f), arg = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
const std = arg('--file') ? JSON.parse(fs.readFileSync(arg('--file'), 'utf8')) : await (await fetch(arg('--url', 'https://yadamannafishtest.netlify.app/api/fish-standard'))).json();
if (!std || !std.rules) { console.error('No standard came back.'); process.exit(1); }
const S = { d: std.own || {}, rules: std.rules };
console.log('standard version', std.ver, '| word rules for', Object.keys((std.rules.word || {}).en || {}).join(', ') || 'no letter counts yet', '| fish with their own setting:', Object.keys(S.d).length);
const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'netlify/functions/lib/catch.json'), 'utf8')).fish).filter((k) => /^[DW]\d/.test(k) && findFish(k));
let changed = [];
for (const k of keys) { const svg = drawFish(k, S), f = path.join(ROOT, 'fish', k + '.svg'); if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== svg) changed.push([k, svg, f]); }
console.log(keys.length, 'fish checked,', changed.length, 'differ from the saved pictures:', changed.slice(0, 12).map((c) => c[0]).join(' ') + (changed.length > 12 ? ' …' : ''));
if (has('--write')) {
  let Resvg = null; if (has('--png')) ({ Resvg } = await import('@resvg/resvg-js'));
  for (const [k, svg, f] of changed) { fs.writeFileSync(f, svg); if (Resvg) fs.writeFileSync(path.join(ROOT, 'w/img', k.toLowerCase() + '.png'), new Resvg(svg, { background: '#000000', fitTo: { mode: 'width', value: 1000 } }).render().asPng()); }
  console.log('written', changed.length, has('--png') ? '(svg and png)' : '(svg only)');
} else if (changed.length) console.log('Nothing written. Add --write to save them.');
