// MannaFish Translator (Ken, 9 Oct): "someone can speak in Spanish, and if one speaks in English it translates
// to Spanish, real quick and real easy". The page records a few seconds of speech and sends it here; this turns it
// into text with OpenAI's speech-to-text (works the same on every phone, and hears which language was spoken).
//   POST /api/hear[?lang=es]   body: the recording (audio/webm, audio/mp4, audio/ogg ...)  ->  {text}
// Only the site's own pages may call it, recordings up to 4 MB (about a minute), with an hourly limit per visitor.
import { getStore } from '@netlify/blobs';
const MODEL = process.env.MF_HEAR_MODEL || 'gpt-4o-mini-transcribe';
const LANGS = ['en', 'es', 'tl', 'zh', 'hi', 'el', 'de', 'ko', 'he'];
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
  const j = await r.json();
  return Response.json({ text: String(j.text || '').trim() });
};
export const config = { path: '/api/hear' };
