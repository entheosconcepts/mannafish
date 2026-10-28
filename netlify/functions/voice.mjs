// Ken's own voice (Ken, 12 Oct): "can we record in my own voice?" Ken records the lines that stay the same (the welcome,
// the prayers, the vision, Cast your line, the tour) on /?record; the site plays his recording instead of the computer
// voice wherever that exact line is read aloud. Each line is keyed by a short hash of its text, so a changed line simply
// has no recording until it is recorded again.
//   GET    /api/voice                         -> {v:{<lang>:{<hash>:<version>}}}   which lines have a recording
//   GET    /api/voice/clip?l=&h=&t=           -> the recording (t = version, so a re-recording is never served stale)
//   PUT    /api/voice/clip?k=&l=&h=  body: audio (up to 4 MB)  -> {ok, t}   (k = MF_ADMIN_KEY, or PROOF_KEY)
//   DELETE /api/voice/clip?k=&l=&h=                              -> {ok}
import { getStore } from '@netlify/blobs';

const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const LANGS = ['en', 'es', 'tl', 'zh', 'hi', 'el', 'de', 'ko', 'he', 'ar', 'ru'];
const TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/wav'];
const MAX = 4 * 1024 * 1024;
const bad = (msg, status) => Response.json({ error: msg }, { status });
const db = () => getStore({ name: 'mannafish-voice', consistency: 'strong' });

export default async (req) => {
  const url = new URL(req.url), q = url.searchParams, sub = url.pathname.replace(/^\/api\/voice\/?/, ''), s = db();
  if (sub === '' && req.method === 'GET') {
    const idx = (await s.get('index', { type: 'json' })) || {};
    return Response.json({ v: idx }, { headers: { 'cache-control': 'public, max-age=60' } });
  }
  if (sub !== 'clip') return bad('Not found', 404);
  const l = q.get('l'), h = String(q.get('h') || '');
  if (!LANGS.includes(l) || !/^[0-9a-f]{1,8}-\d{1,5}$/.test(h)) return bad('Which line?', 400);
  const key = `clip/${l}/${h}`;
  if (req.method === 'GET') {
    const r = await s.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!r || !r.data) return bad('Not found', 404);
    return new Response(r.data, { headers: { 'content-type': (r.metadata && r.metadata.type) || 'audio/mp4', 'accept-ranges': 'none',
      'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
  }
  if (!KEY() || q.get('k') !== KEY()) return bad('Not allowed', 403);
  const idx = (await s.get('index', { type: 'json' })) || {};
  if (req.method === 'DELETE') {
    await s.delete(key); if (idx[l]) { delete idx[l][h]; await s.setJSON('index', idx); }
    return Response.json({ ok: true });
  }
  if (req.method !== 'PUT') return bad('Not allowed', 405);
  const type = String(req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!TYPES.includes(type)) return bad('That kind of recording cannot be used', 415);
  const buf = await req.arrayBuffer();
  if (!buf.byteLength) return bad('Nothing recorded', 400);
  if (buf.byteLength > MAX) return bad('Too long', 413);
  const t = Date.now().toString(36);
  await s.set(key, buf, { metadata: { type, t, size: buf.byteLength } });
  (idx[l] = idx[l] || {})[h] = t; await s.setJSON('index', idx);
  return Response.json({ ok: true, t });
};
export const config = { path: ['/api/voice', '/api/voice/*'] };
