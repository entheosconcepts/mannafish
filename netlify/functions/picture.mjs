// Picture verse (Ken, 30 Oct): "got a picture verse in mind? Create one here ... or upload image here, and overlay scripture".
// A picture is made from a few words the person types, on the server with OpenAI, so the key never reaches the phone.
// The verse is put on the picture in the browser (/picture/); only the background is made here, never words.
// Each visitor can make a few a day (uploading their own photo is free and has no limit), and there is a daily cap for
// everyone together so the bill can't run away.
//   GET  /api/picture                 -> {left}
//   POST /api/picture {prompt, shape} -> {img: data URL (jpeg), left}
// Settings (Netlify environment variables, all optional): PICTURE_MODEL (default gpt-image-1), PICTURE_QUALITY
// (default low: fastest and cheapest), PICTURE_PER_DAY (default 3), PICTURE_ALL_DAY (default 300).
import { getStore } from '@netlify/blobs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, code) => Response.json({ error: msg, code: code || '' }, { status, headers: { 'cache-control': 'no-store' } });
const env = (k, d) => (globalThis.Netlify && Netlify.env.get(k)) || process.env[k] || d;
const PER_DAY = () => Math.max(0, Number(env('PICTURE_PER_DAY', 3)) || 0);
const ALL_DAY = () => Math.max(0, Number(env('PICTURE_ALL_DAY', 300)) || 0);
const SIZES = { square: '1024x1024', tall: '1024x1536', story: '1024x1536' };

const day = () => new Date().toISOString().slice(0, 10);
async function used(ip) {
  try { const s = getStore('mannafish-limits'); return [Number(await s.get(`pic/${day()}/${ip || 'x'}`)) || 0, Number(await s.get(`pic-all/${day()}`)) || 0]; }
  catch (e) { return [0, 0]; }
}
async function count(ip, by) {
  try { const s = getStore('mannafish-limits'), [me, all] = await used(ip);
    await s.set(`pic/${day()}/${ip || 'x'}`, String(Math.max(0, me + by))); await s.set(`pic-all/${day()}`, String(Math.max(0, all + by))); } catch (e) { /* never block because the counter failed */ }
}

// the person's words go inside a frame that keeps the picture a background: no writing in it, no real people
function frame(words) {
  return 'A beautiful, reverent background image for a Bible verse card: ' + words + '. '
    + 'Leave calm, uncluttered space where a verse can be written over it. '
    + 'Do not include any text, words, letters, numbers, logos, signatures or watermarks. '
    + 'Do not show any real, famous or identifiable person.';
}

export default async (req, context) => {
  const ip = context && context.ip;
  if (req.method === 'GET') { const [me] = await used(ip); return Response.json({ left: Math.max(0, PER_DAY() - me) }, { headers: { 'cache-control': 'no-store' } }); }
  if (req.method !== 'POST') return bad('Not allowed', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const key = env('OPENAI_API_KEY', '');
  if (!key) return bad('Pictures are not set up yet', 503, 'off');
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const words = String(b.prompt || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (words.length < 3) return bad('Say what the picture should show', 400, 'empty');
  const [me, all] = await used(ip);
  if (me >= PER_DAY()) return bad('No more pictures today', 429, 'mine');
  if (all >= ALL_DAY()) return bad('No more pictures today', 429, 'all');
  await count(ip, 1);
  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env('PICTURE_MODEL', 'gpt-image-1'), prompt: frame(words), size: SIZES[b.shape] || SIZES.square,
        quality: env('PICTURE_QUALITY', 'low'), n: 1, output_format: 'jpeg', output_compression: 88, moderation: 'auto' }),
      signal: AbortSignal.timeout(27000) });
    const j = await r.json().catch(() => ({}));
    const b64 = j && j.data && j.data[0] && j.data[0].b64_json;
    if (!r.ok || !b64) {
      await count(ip, -1);   // a picture that wasn't made doesn't count
      const blocked = /moderation|safety|content_policy/i.test(JSON.stringify(j.error || ''));
      return bad(blocked ? 'That picture can’t be made' : 'The picture couldn’t be made just now', blocked ? 422 : 502, blocked ? 'blocked' : 'failed');
    }
    return Response.json({ img: 'data:image/jpeg;base64,' + b64, left: Math.max(0, PER_DAY() - me - 1) }, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    await count(ip, -1);
    return bad('The picture couldn’t be made just now', 504, 'slow');
  }
};

export const config = { path: '/api/picture' };
