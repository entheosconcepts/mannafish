// The email picture of every fish in the daily catch that has none yet: w/img/<id>.png, 1000 x 500, white fish on black, 4 greys
// (about 20 KB each; email can't show the SVG). node tools/fish/catch-img.mjs  (then: /usr/bin/python3 tools/fish/catch-img.py)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), C = JSON.parse(fs.readFileSync(path.join(ROOT, 'netlify/functions/lib/catch.json'), 'utf8'));
const todo = Object.keys(C.fish).filter((k) => !fs.existsSync(path.join(ROOT, 'w/img', k.toLowerCase() + '.png')));
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1000, height: 500 } });
for (const k of todo) { await p.setContent('<body style="margin:0;background:#000"><div style="width:1000px;height:500px">' + fs.readFileSync(path.join(ROOT, 'fish', k + '.svg'), 'utf8') + '</div></body>');
  await p.screenshot({ path: path.join(ROOT, 'w/img', k.toLowerCase() + '.png') }); }
await b.close(); console.log(todo.length, 'pictures made');
