// A text engine for fishfmt.js made with HarfBuzz (npm harfbuzzjs), for the languages whose letters join or reorder
// (Arabic, Hindi) and any other script: it shapes each run the way a browser does and gives every glyph's outline.
//   const E = await require('./hbengine.js').load('/path/font.ttf', {rtl:true, capChars:'אבגדה'});
// Right-to-left text (Hebrew, Arabic) is laid out in reading order: numbers and Latin letters inside it ("11:28") still read
// left to right. capChars: letters of the script whose height stands for its "capital" height (matched to Hobo's H).
const fs = require('fs'), path = require('path');
let HB = null;
async function hb() {
  if (!HB) HB = await import(process.env.HARFBUZZ || 'harfbuzzjs');
  return HB;
}
// right-to-left text: runs in the order they are seen, left to right
function runsOf(text, rtl) {
  text = String(text).replace(/[‪-‮]/g, '');
  if (!rtl) return [{ t: text, rtl: false }];
  const re = /[0-9A-Za-z]+(?:[:.,\-–][0-9A-Za-z]+)*/g, out = [];
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), rtl: true });
    out.push({ t: m[0], rtl: false }); last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), rtl: true });
  return out.reverse();
}
async function load(fontPath, opt = {}) {
  const H = await hb(), data = fs.readFileSync(fontPath);
  const blob = new H.Blob(new Uint8Array(data)), face = new H.Face(blob, 0), font = new H.Font(face), upm = face.upem;
  const shapes = {};
  // a glyph's outline, at size 1, y down
  function outline(gid) {
    if (shapes[gid]) return shapes[gid];
    const out = [];
    for (const c of font.glyphToJson(gid)) {
      const v = c.values;
      if (c.type === 'M' || c.type === 'L') out.push({ type: c.type, x: v[0] / upm, y: -v[1] / upm });
      else if (c.type === 'Q') out.push({ type: 'Q', x1: v[0] / upm, y1: -v[1] / upm, x: v[2] / upm, y: -v[3] / upm });
      else if (c.type === 'C') out.push({ type: 'C', x1: v[0] / upm, y1: -v[1] / upm, x2: v[2] / upm, y2: -v[3] / upm, x: v[4] / upm, y: -v[5] / upm });
      else if (c.type === 'Z') out.push({ type: 'Z' });
    }
    return (shapes[gid] = out);
  }
  function scaled(cmds, s, dx, dy) {
    return cmds.map((c) => { const o = { type: c.type };
      for (const k of ['x', 'x1', 'x2']) if (c[k] != null) o[k] = c[k] * s + dx;
      for (const k of ['y', 'y1', 'y2']) if (c[k] != null) o[k] = c[k] * s + dy;
      return o; });
  }
  const cache = {};
  // shape a text at size 1: glyphs in the order they are seen, each {x, adv, cmds}
  function shape1(text) {
    if (cache[text]) return cache[text];
    const glyphs = []; let pen = 0;
    for (const r of runsOf(text, opt.rtl)) {
      if (!r.t) continue;
      const buf = new H.Buffer(); buf.addText(r.t); buf.setDirection(r.rtl ? H.Direction.RTL : H.Direction.LTR);
      buf.guessSegmentProperties(); H.shape(font, buf);
      const info = buf.getGlyphInfos(), pos = buf.getGlyphPositions();
      info.forEach((g, i) => { const p = pos[i];
        glyphs.push({ x: pen + p.xOffset / upm, y: -p.yOffset / upm, adv: p.xAdvance / upm, gid: g.codepoint });
        pen += p.xAdvance / upm; });
    }
    return (cache[text] = { glyphs, adv: pen });
  }
  const E = {
    name: opt.name || path.basename(fontPath), hobo: false, rtl: !!opt.rtl,
    run(text, size) {
      const r = shape1(text);
      return { adv: r.adv * size, glyphs: r.glyphs.map((g) => ({ x: g.x * size, adv: g.adv * size, cmds: scaled(outline(g.gid), size, 0, g.y * size) })) };
    },
    tall: null,
  };
  // the script's letter height: the tallest of capChars (or of the text's own letters)
  const caps = Array.from(opt.capChars || 'H');
  let top = 0;
  for (const ch of caps) { const r = shape1(ch); for (const g of r.glyphs) for (const c of outline(g.gid)) for (const k of ['y', 'y1', 'y2']) if (c[k] != null) top = Math.max(top, -(c[k] + g.y)); }
  E.capH = opt.capH || top || 0.7;
  return E;
}
module.exports = { load, runsOf };
