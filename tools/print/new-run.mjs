#!/usr/bin/env node
// A new sponsored card in one command (Ken, 7 Nov: "when I give you somebody's logo and the address of their website, it should just take you there").
//   node tools/print/new-run.mjs --name "Market Street Tires" --logo /path/logo.png --url https://their-site.com --word REPAIR
//        [--lang en|es] [--left "Free tire check"] [--svg print/assets/repair-fish.svg] [--study REPAIR] [--qty 100] [--no-build]
// With no --name it is a MannaFish card: the left QR says "Got Eternal Life?" (its web address still to be set in the run file).
// It uses print/templates/sponsor-back.json, copies the logo into print/assets/, writes the next print/runs/R000n.json and builds it.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), PRINT = path.join(ROOT, 'print');
const A = {}; const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) { if (!argv[i].startsWith('--')) continue; const k = argv[i].slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) A[k] = true; else { A[k] = n; i++; } }
const die = (m) => { console.error('\n' + m + '\n'); process.exit(1); };
if (!A.word) die('Which word? Add --word REPAIR');
const lang = A.lang === 'es' ? 'es' : 'en', word = String(A.word).toUpperCase(), T = JSON.parse(fs.readFileSync(path.join(PRINT, 'templates/sponsor-back.json'), 'utf8'));
const self = !A.name;
const fishSvg = A.svg ? String(A.svg) : null;
if (!fishSvg && !['fish/' + lang + '/' + word + '.svg', 'fish/' + word + '.svg'].some((p) => fs.existsSync(path.join(ROOT, p)))) die(`There is no fish file for ${word}. Draw one (tools/fish/preview-options.mjs), save it under print/assets/ and add --svg print/assets/<file>.svg`);
const studyKey = String(A.study || word).toUpperCase();
if (!fs.existsSync(path.join(PRINT, 'study', studyKey + '.json'))) { const idx = fs.existsSync(path.join(ROOT, 'index.html')) && fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('"' + word + '": {"title"'); if (!idx) die(`There is no word study for ${word}. Write print/study/${studyKey}.json (copy print/study/REPAIR.json) and run again.`); }
const nums = fs.readdirSync(path.join(PRINT, 'runs')).map((f) => +(/^R(\d+)\.json$/.exec(f) || [])[1]).filter(Boolean), id = 'R' + String(Math.max(0, ...nums) + 1).padStart(4, '0');
const back = JSON.parse(JSON.stringify(T[lang].back)), leftLabel = A.left ? String(A.left) : self ? (lang === 'es' ? T.self.left_label_es : T.self.left_label) : (lang === 'es' ? 'Su sitio web' : 'Visit us');
back.left.label = leftLabel; back.left.to = A.url ? String(A.url) : (T.self.to || '');
let sponsor;
if (self) sponsor = { name: '', anonymous: true };
else {
  let logo = '';
  if (A.logo) { const src = path.resolve(String(A.logo)); if (!fs.existsSync(src)) die('I cannot find the logo file: ' + src); const slug = String(A.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); const ext = path.extname(src).toLowerCase(); logo = 'assets/' + slug + '-logo' + ext; fs.copyFileSync(src, path.join(PRINT, logo)); }
  sponsor = { name: String(A.name), logo, show: true };
}
const warn = []; if (!self && !A.logo) warn.push('No logo given: the card shows the sponsor name instead.'); if (!back.left.to) warn.push('The left QR code has no web address yet: set back.left.to in ' + id + '.json.');
const run = { id, title: `${word[0] + word.slice(1).toLowerCase()} · ${self ? 'MannaFish' : sponsor.name} (${lang})`, status: 'draft', qty: +A.qty || 100,
  fish: { id: word, word, lang, study: studyKey, ...(fishSvg ? { svg: fishSvg.replace(/^print\//, '') } : {}) }, sponsor, ship_to: '', qr_direct: false, back,
  notes: `Made with tools/print/new-run.mjs. ${warn.join(' ')}`.trim() };
fs.writeFileSync(path.join(PRINT, 'runs', id + '.json'), JSON.stringify(run, null, 1));
console.log(`Wrote print/runs/${id}.json` + (warn.length ? '\n  ! ' + warn.join('\n  ! ') : ''));
if (!A['no-build']) { const r = spawnSync('node', [path.join(ROOT, 'tools/print/make.mjs'), id], { stdio: 'inherit', cwd: ROOT }); if (r.status) process.exit(r.status); console.log(`\nLook at print/out/${id}/${id}-proof.png and ${id}-4-back.png`); }
