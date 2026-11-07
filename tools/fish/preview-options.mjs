// Draws a few fish side by side for a sponsor to choose from (a word and several Bible verses): node tools/fish/preview-options.mjs options.json out-dir
//   options.json: [{"id":"A","word":"Repair","top":"...","bot":"...","ref":"Isaiah 61:4","refShort":"Isa. 61:4"}, ...]
// Writes out-dir/<id>.svg and <id>.png (white fish on black, 1000 x 500). Uses the builder's own rule; with the edit sheet's saved standard
// (/api/fish-standard) the word's size may change slightly when the fish is standardized.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { drawCustom } from '../../netlify/functions/lib/fishdraw.mjs';
const { Resvg } = createRequire(import.meta.url)('@resvg/resvg-js');
const [,, file, out] = process.argv; fs.mkdirSync(out, { recursive: true });
for (const o of JSON.parse(fs.readFileSync(file, 'utf8'))) {
  const svg = drawCustom({ k: 'X' + o.id, word: o.word, top: o.top, bot: o.bot, ref: o.ref, refShort: o.refShort });
  fs.writeFileSync(path.join(out, o.id + '.svg'), svg);
  fs.writeFileSync(path.join(out, o.id + '.png'), new Resvg(svg, { background: '#000000', fitTo: { mode: 'width', value: 1000 } }).render().asPng());
}
console.log('drawn');
