// A round stand-in logo for a sponsor (Ken, 1 Nov: "create a round K-Tech logo, just make it up"), with every letter drawn as a
// shape (opentype.js), so it prints the same anywhere. Replace it with the sponsor's real logo when they send one.
//   OPENTYPE=/path/to/opentype.js node tools/print/round-logo.cjs
const fs = require('fs'), path = require('path'), ot = require(process.env.OPENTYPE || 'opentype.js');
const FS = path.join(__dirname, 'node_modules/@fontsource');
const lil = ot.parse(fs.readFileSync(path.join(FS, 'lilita-one/files/lilita-one-latin-400-normal.woff')).buffer.slice(0));
const arc = ot.parse(fs.readFileSync(path.join(FS, 'archivo-narrow/files/archivo-narrow-latin-700-normal.woff')).buffer.slice(0));
const C = 300, NAVY = '#0f2a4a', GOLD = '#f2b233', WHITE = '#ffffff';
// letters set round a circle of radius r, centred on angle a0 (degrees, 0 = top), reading clockwise (top) or anticlockwise (bottom)
function ring(font, text, size, r, a0, bottom, spacing = 0) {
  const adv = [...text].map((ch) => font.getAdvanceWidth(ch, size) + spacing), total = adv.reduce((a, b) => a + b, 0) - spacing;
  let at = -total / 2, d = '';
  [...text].forEach((ch, i) => { const mid = at + adv[i] / 2 - spacing / 2, ang = (a0 + (bottom ? -1 : 1) * mid / r * 180 / Math.PI) * Math.PI / 180;
    const x = C + r * Math.sin(ang), y = C - r * Math.cos(ang), rot = bottom ? ang * 180 / Math.PI + 180 : ang * 180 / Math.PI;
    const g = font.getPath(ch, 0, 0, size), w = adv[i] - spacing;
    // the glyph centred on its point, its baseline on the circle (top) or its cap line on it (bottom), turned to the tangent
    const p = g.toPathData(2); if (p) d += `<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) translate(${(-w / 2).toFixed(2)} ${bottom ? (size * 0.72).toFixed(2) : 0})" d="${p}"/>`;
    at += adv[i]; });
  return d;
}
function centred(font, text, size, y) { const w = font.getAdvanceWidth(text, size); return `<path d="${font.getPath(text, C - w / 2, y, size).toPathData(2)}"/>`; }
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
<circle cx="300" cy="300" r="296" fill="${GOLD}"/><circle cx="300" cy="300" r="282" fill="${NAVY}"/>
<circle cx="300" cy="300" r="196" fill="none" stroke="${GOLD}" stroke-width="6"/>
<g fill="${WHITE}">${ring(lil, 'K-TECH CONSTRUCTION', 54, 222, 0, false, 3)}${ring(arc, 'PORCH ENCLOSURES', 40, 226, 180, true, 6)}</g>
<g fill="${GOLD}"><circle cx="${C - 252}" cy="${C}" r="7"/><circle cx="${C + 252}" cy="${C}" r="7"/></g>
<path d="M150 292 L300 168 L450 292" fill="none" stroke="${GOLD}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M190 290 V412 H410 V290" fill="none" stroke="${WHITE}" stroke-width="12" stroke-linejoin="round"/>
<g stroke="${WHITE}" stroke-width="6" opacity=".55"><path d="M245 300 V412M300 300 V412M355 300 V412M190 330 H410"/></g>
<rect x="244" y="284" width="112" height="124" fill="${NAVY}"/><g fill="${WHITE}">${centred(lil, 'K', 170, 405)}</g>
<g fill="${GOLD}">${centred(arc, 'BUILT ON THE ROCK', 21, 446)}</g>
</svg>`;
fs.writeFileSync(path.join(__dirname, '../../print/assets/ktech-round-logo-DRAFT.svg'), svg);
console.log('print/assets/ktech-round-logo-DRAFT.svg');
