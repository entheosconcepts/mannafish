// MannaFish Translator (Ken, 9 Oct): "someone can speak in Spanish, and if one speaks in English it translates
// to Spanish, real quick and real easy". The page records a few seconds of speech and sends it here; this turns it
// into text with OpenAI's speech-to-text (works the same on every phone, and hears which language was spoken).
//   POST /api/hear[?lang=es]   body: the recording (audio/webm, audio/mp4, audio/ogg ...)  ->  {text}
//   ...&pair=en,es (or &to=es)  -> {text, tr:{text,from,to}}: heard and translated in one trip (Ken, 21 Oct: "a great delay")
//   ...&polish=1               -> {text, raw}: a spoken prayer, its spelling and punctuation made right (Time with God)
//   ...&prev=<words>          the same thought, carried on after a pause: heard, joined to prev, and the whole translated
//                             (tr.done false: the words stop mid-thought, so the page keeps listening before it speaks)
//   GET  /api/hear?warm=1      -> 204, so the first sentence does not wait for the function to wake up
// Only the site's own pages may call it, recordings up to 4 MB (about a minute), with an hourly limit per visitor.
import { getStore } from '@netlify/blobs';
import { NAMES, translatePair, translateTo, polish, unfinished } from './lib/tr.mjs';
const MODEL = process.env.MF_HEAR_MODEL || 'gpt-4o-mini-transcribe';
const LANGS = ['en', 'es', 'tl', 'zh', 'hi', 'el', 'de', 'ko', 'he', 'ar', 'tr', 'ru'];
const PER_HOUR = 150, MAX = 4 * 1024 * 1024;
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, error) => Response.json({ error: error || 'bad', msg }, { status });
async function limited(ip) {
  try {
    const s = getStore('mannafish-limits'), k = `hear/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0;
    if (n >= PER_HOUR) return true;
    await s.set(k, String(n + 1));
  } catch (e) { /* never block a conversation because the counter failed */ }
  return false;
}
const EXT = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
export default async (req, context) => {
  if (req.method === 'GET' && new URL(req.url).searchParams.get('warm')) return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const apiKey = process.env.OPENAI_TRANSLATE_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return bad('No key yet', 501, 'nokey');
  const type = String(req.headers.get('content-type') || 'audio/webm').split(';')[0].trim().toLowerCase();
  const audio = await req.arrayBuffer();
  if (!audio.byteLength) return bad('Nothing heard', 400, 'empty');
  if (audio.byteLength > MAX) return bad('Too long', 413, 'long');
  if (await limited(context && context.ip)) return bad('Please wait a little', 429, 'busy');
  const lang = new URL(req.url).searchParams.get('lang');
  const fd = new FormData();
  fd.append('file', new Blob([audio], { type }), 'speech.' + (EXT[type] || 'webm'));
  fd.append('model', MODEL);
  if (LANGS.includes(lang)) fd.append('language', lang);
  fd.append('prompt', 'A friendly conversation about Jesus, prayer, the Bible and everyday life.');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: 'Bearer ' + apiKey }, body: fd });
  if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
  if (!r.ok) return bad('Speech service error', 502);
  const j = await r.json(), q = new URL(req.url).searchParams, heard = String(j.text || '').trim(), prev = String(q.get('prev') || '').trim().slice(0, 600);
  const text = prev && heard ? prev + ' ' + heard : heard;
  // a prayer said aloud: tidied (spelling, punctuation, capitals), the person's words kept
  if (text && q.get('polish')) {
    try { const o = await polish({ authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' }, text.slice(0, 2000)); if (!o.error) return Response.json({ text: o.text, raw: text }); } catch (e) {}
    return Response.json({ text, raw: text });
  }
  // and translated straight away, when the page says into what
  const pair = String(q.get('pair') || '').split(','), to = q.get('to');
  if (text && text.length <= 900 && ((pair.length === 2 && NAMES[pair[0]] && NAMES[pair[1]] && pair[0] !== pair[1]) || NAMES[to])) {
    const H = { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' };
    try {
      const o = NAMES[to] ? await translateTo(H, text, LANGS.includes(lang) ? lang : null, to) : await translatePair(H, text, pair[0], pair[1]);
      if (!o.error) return Response.json({ text, heard, tr: NAMES[to] ? { text: o.text, from: LANGS.includes(lang) ? lang : null, to, done: !unfinished(text) } : o });
    } catch (e) { /* the page asks /api/translate itself */ }
  }
  return Response.json({ text, heard });
};
export const config = { path: '/api/hear' };
