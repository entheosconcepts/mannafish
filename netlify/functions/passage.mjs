// The passage a verse belongs to, for "In context" in the devotional and any future MannaFish app (Ken, 27 Oct: "reveal and
// read the whole chapter, or if it's between chapters, back up to where it is relevant, and read through till it is clearly
// done with the context"). Passages are by chapter and verse (fish-lang/bible/sect/, made by tools/bible-sect/build.py from the
// Berean Standard Bible's headings and the KJV's paragraphs), so they fit every version and language.
//   GET /api/passage?ref=Romans+8:1            (or ?b=44&c=8&v=1; book 0 = Genesis)
//   -> {ref:"Romans 8:1", b,c,v, title:"Struggling with Sin", range:"Romans 7:13–8:11", from:{c,v}, to:{c,v},
//       verses:[{c,v,t}]}   (the text is the KJV, this site's own copy; other versions fill in the same verses)
const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
const bad = (msg, status) => Response.json({ error: msg }, { status });
function book(name) {
  const n = String(name || '').toLowerCase().replace(/\s+/g, ' ').replace(/^psalms\b/, 'psalm').trim();
  let i = BOOKS.findIndex((b) => b.toLowerCase() === n);
  if (i < 0 && n.length >= 3) i = BOOKS.findIndex((b) => b.toLowerCase().startsWith(n));
  return i;
}
export default async (req) => {
  const u = new URL(req.url), q = u.searchParams;
  let b, c, v;
  if (q.get('ref')) {
    const m = /^(.+?)\s+(\d+):(\d+)$/.exec(q.get('ref').trim()); if (!m) return bad('Write the verse like "John 3:16"', 400);
    b = book(m[1]); c = +m[2]; v = +m[3];
  } else { b = +q.get('b'); c = +q.get('c'); v = +q.get('v'); }
  if (!(b >= 0 && b < 66) || !(c > 0) || !(v > 0)) return bad('Unknown verse', 400);
  const name = BOOKS[b].replace(/ /g, '_');
  const r = await fetch(new URL('/fish-lang/bible/sect/' + name + '.json', u.origin)); if (!r.ok) return bad('Not available', 502);
  const at = (x) => x[0] * 1000 + x[1], me = c * 1000 + v;
  const p = (await r.json()).find((x) => at(x) <= me && me <= x[2] * 1000 + x[3]); if (!p) return bad('Unknown verse', 404);
  const verses = [];
  for (let cc = p[0]; cc <= p[2]; cc++) {
    const k = await fetch(new URL('/fish-lang/bible/kjv/' + name + '-' + cc + '.json', u.origin)).then((x) => x.ok ? x.json() : null).catch(() => null);
    if (!k) return bad('Not available', 502);
    const v0 = cc === p[0] ? p[1] : 1, v1 = cc === p[2] ? p[3] : k.t.length;
    for (let vv = v0; vv <= v1; vv++) verses.push({ c: cc, v: vv, t: k.t[vv - 1] || '' });
  }
  const range = BOOKS[b] + ' ' + p[0] + ':' + p[1] + '–' + (p[2] !== p[0] ? p[2] + ':' : '') + p[3];
  return Response.json({ ref: BOOKS[b] + ' ' + c + ':' + v, b, c, v, title: p[4], range, from: { c: p[0], v: p[1] }, to: { c: p[2], v: p[3] }, verses },
    { headers: { 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' } });
};
export const config = { path: '/api/passage' };
