#!/usr/bin/env node
// Draw a fish that is not in any list (a sponsor idea, another language) with the site's own fish engine, the same drawing as the edit sheet and the daily email.
//   node tools/print/draw-custom.mjs <out.svg> '<json>'      e.g. '{"word":"Reparen","top":"...y reparen los portillos del templo","bot":"donde quiera que se hallare abertura.","ref":"2 Reyes 12:5","tag":" (RVR1909)"}'
// tag is what follows the reference (default " (KJV)"); refShort is the short form for narrow places. Uses the rules saved in the edit sheet when
// MF_FISH_STATE points at a JSON copy of them; otherwise the builder's own rules.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [out, json] = process.argv.slice(2);
if (!out || !json) { console.error("usage: draw-custom.mjs out.svg '{\"word\":...}'"); process.exit(1); }
const { drawCustom } = await import(path.join(ROOT, 'netlify/functions/lib/fishdraw.mjs'));
const S = process.env.MF_FISH_STATE ? JSON.parse(fs.readFileSync(process.env.MF_FISH_STATE, 'utf8')) : null;
const svg = drawCustom({ k: '_custom', ...JSON.parse(json) }, S);
if (!svg) { console.error('could not draw it'); process.exit(1); }
fs.writeFileSync(out, svg); console.log('wrote', out, svg.length, 'bytes');
