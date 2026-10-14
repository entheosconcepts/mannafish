// Bible versions that are not in bible-api.com (Ken, 15 Oct: "make kjv, nkjv, niv, nlt, net or whatever versions are available").
//   GET /api/bible?list=1                      -> {versions:['net', ...]}  which of these this site can give
//   GET /api/bible?v=net&b=Matthew&c=11        -> {t:[verse 1, verse 2, ...]}
// NET: the NET Bible's own free service (labs.bible.org), no key; shown with its copyright line.
// ESV: only when ESV_API_KEY is set in Netlify (a free key for non-commercial use from api.esv.org); not stored here.
// NIV, NKJV and NLT are not offered: their publishers do not allow them without a licence.
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const okRef = (r) => { try { return okOrigin(new URL(r).origin); } catch (e) { return false; } };
const bad = (msg, status) => Response.json({ error: msg }, { status });
const BOOK = /^[1-3]?\s?[A-Za-z][A-Za-z ]{1,24}$/;
export default async (req) => {
  if (!(okOrigin(req.headers.get('origin')) || req.headers.get('sec-fetch-site') === 'same-origin' || okRef(req.headers.get('referer')))) return bad('Not allowed', 403);
  const q = new URL(req.url).searchParams, esvKey = process.env.ESV_API_KEY || '';
  if (q.get('list')) return Response.json({ versions: ['net', ...(esvKey ? ['esv'] : [])] }, { headers: { 'cache-control': 'public, max-age=3600' } });
  const v = q.get('v'), b = String(q.get('b') || '').trim(), c = parseInt(q.get('c'), 10);
  if (!BOOK.test(b) || !(c >= 1 && c <= 150)) return bad('Which chapter?', 400);
  try {
    if (v === 'net') {
      const r = await fetch('https://labs.bible.org/api/?type=json&formatting=plain&passage=' + encodeURIComponent(b + ' ' + c));
      if (!r.ok) return bad('NET not available', 502);
      const rows = await r.json(), t = [];
      (Array.isArray(rows) ? rows : []).forEach((x) => { const n = parseInt(x.verse, 10); if (n > 0) t[n - 1] = String(x.text || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); });
      if (!t.length) return bad('Not found', 404);
      return Response.json({ t, note: 'NET Bible® © 1996–2016 Biblical Studies Press, L.L.C. Used by permission.' }, { headers: { 'cache-control': 'public, max-age=604800' } });
    }
    if (v === 'esv' && esvKey) {
      const u = 'https://api.esv.org/v3/passage/text/?q=' + encodeURIComponent(b + ' ' + c) + '&include-passage-references=false&include-verse-numbers=true&include-first-verse-numbers=true'
        + '&include-footnotes=false&include-footnote-body=false&include-headings=false&include-short-copyright=false&include-selahs=true&indent-paragraphs=0&indent-poetry=false&indent-declares=0&indent-psalm-doxology=0';
      const r = await fetch(u, { headers: { authorization: 'Token ' + esvKey } });
      if (!r.ok) return bad('ESV not available', 502);
      const text = ((await r.json()).passages || [])[0] || '', t = [];
      text.split(/\[(\d+)\]/).forEach((part, i, all) => { if (i % 2 === 1) { const n = parseInt(part, 10); t[n - 1] = String(all[i + 1] || '').replace(/\s+/g, ' ').trim(); } });
      if (!t.length) return bad('Not found', 404);
      return Response.json({ t, note: 'ESV® © 2001 Crossway. Used by permission. All rights reserved.' }, { headers: { 'cache-control': 'private, max-age=3600' } });
    }
  } catch (e) { return bad('Could not reach the Bible service', 502); }
  return bad('Unknown version', 400);
};
export const config = { path: '/api/bible' };
