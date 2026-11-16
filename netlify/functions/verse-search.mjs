// Verses with a word in them, for "make a MannaFish from a verse" when no fish has that word yet (Ken, 12 Nov).
//   GET /api/verse-search?q=hope  ->  {total, results:[{ref, text}]}   (the KJV; up to 40, spread through the Bible)
import { search } from './lib/kjvlib.mjs';
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const okRef = (r) => { try { return okOrigin(new URL(r).origin); } catch (e) { return false; } };
export default async (req) => {
  if (!(okOrigin(req.headers.get('origin')) || req.headers.get('sec-fetch-site') === 'same-origin' || okRef(req.headers.get('referer')))) return Response.json({ error: 'Not allowed' }, { status: 403 });
  const q = new URL(req.url).searchParams.get('q') || '';
  return Response.json(search(q), { headers: { 'cache-control': 'public, max-age=3600' } });
};
export const config = { path: '/api/verse-search' };
