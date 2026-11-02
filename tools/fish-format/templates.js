// Ken's template averages from the edit sheet (Ken, 2 Nov: "if I select three fish that are four-letter words ... find the average
// of all of them and use that as the default for a four-letter word inside a fish. Same rule applies for 2 ... 9. Also the top
// line and the bottom line"). The sheet's 📋 Copy the averages gives templates.json; build.js and build-lang.js then draw every
// fish that has no hand setting of its own with it: the word's size, left/right, up/down and width from the average of the
// templates with the same number of letters (other lengths keep the rule), the verse lines' size and place from the average.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'templates.json');
function load() { if (!fs.existsSync(FILE)) return null; const t = JSON.parse(fs.readFileSync(FILE, 'utf8')); return t && (t.word || t.top || t.bot) ? t : null; }
const letters = (w) => Array.from(String(w)).filter((c) => /\p{L}/u.test(c) && !/\p{M}/u.test(c)).length;
const EYE = 1900 * 1.03;   // a word never wider than the eye (as on the sheet)
function apply(F, E, f, P, R, T) {
  if (!T) return P; const o = {}, w = T.word && T.word[letters(f.word)];
  if (w) { let size = w.size; const ink = F.runBox(E, f.word, 100), iw = (ink.x2 - ink.x1) / 100 * (w.ww || 1); if (size * iw > EYE) size = EYE / iw;
    o.wl = { size, dx: w.dx || 0, dy: w.dy || 0, ww: w.ww || 1, hh: w.hh || 1 }; }
  if (T.top) o.tl = { size: T.top.size, slide: T.top.slide || 0, lw: 1 };
  if (T.bot) o.bl = { size: T.bot.size, slide: T.bot.slide || 0, lw: 1 };
  return Object.keys(o).length ? F.fromSheet(E, f, o, R, P) : P;
}
module.exports = { load, apply, letters };
