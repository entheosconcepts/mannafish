// Cross references for any verse, for every version and any future MannaFish app (Ken, 27 Oct: "reference icon ... clickable
// links ... forward compatible and built on server side"). The same data the Bible page uses (fish-lang/bible/xref/, made by
// tools/bible-xref/build.py from OpenBible.info, CC BY): by book, chapter and verse, so it fits every translation and language.
//   GET /api/xref?ref=Revelation+2:7            (or ?b=65&c=2&v=7; book 0 = Genesis)   [&all=1: every reference, not just the strong]
//   -> {ref:"Revelation 2:7", b,c,v, strong:n, refs:[{ref:"Revelation 2:17", b,c,v, to:{c,v}|null, text:"…" (KJV)}]}
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
  const file = (i) => new URL('/fish-lang/bible/xref/' + BOOKS[i].replace(/ /g, '_') + '.json', u.origin);
  const r = await fetch(file(b)); if (!r.ok) return bad('Not available', 502);
  const J = await r.json(), L = J[c + ':' + v] || [], strong = (J._k || {})[c + ':' + v] || 0;
  const list = q.get('all') ? L : L.slice(0, strong || L.length);
  // each reference's first verse in the KJV (this site's own copy), so a reader sees what it says before going there
  const chap = {};
  const kjv = (bb, cc) => chap[bb + ':' + cc] || (chap[bb + ':' + cc] = fetch(new URL('/fish-lang/bible/kjv/' + BOOKS[bb].replace(/ /g, '_') + '-' + cc + '.json', u.origin)).then((x) => x.ok ? x.json() : null).catch(() => null));
  const refs = await Promise.all(list.map(async (x) => {
    const to = x[4] ? { c: x[3] || x[1], v: x[4] } : null, k = await kjv(x[0], x[1]);
    return { ref: BOOKS[x[0]] + ' ' + x[1] + ':' + x[2] + (to ? (to.c !== x[1] ? '–' + to.c + ':' + to.v : '–' + to.v) : ''), b: x[0], c: x[1], v: x[2], to, text: k && k.t[x[2] - 1] || '' };
  }));
  return Response.json({ ref: BOOKS[b] + ' ' + c + ':' + v, b, c, v, strong, refs },
    { headers: { 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' } });
};
export const config = { path: '/api/xref' };
