// Every Tongue (Ken, 8 Oct): live help for talking with someone in another language.
//   POST /api/translate {text, to, from}  -> {text}   typed or spoken words, translated
//   POST /api/say       {text, lang}      -> mp3      a natural voice for those words
// Uses the same OpenAI key as the fish voice (OPENAI_API_KEY), or OPENAI_TRANSLATE_KEY if set. Translating
// needs the key to allow "Chat completions" (OpenAI → API keys → Permissions); without it this answers 503
// {error:'key'} and the page says what to change. Only the site's own pages may call it, with short texts and
// an hourly limit per visitor, so it cannot be used as a free translator by others.
import { getStore } from '@netlify/blobs';
const NAMES = { en: 'English', es: 'Spanish', tl: 'Tagalog (Filipino)', zh: 'Simplified Chinese (Mandarin)', hi: 'Hindi',
  el: 'Modern Greek', de: 'German', ko: 'Korean', he: 'Modern Hebrew' };
const MODEL = process.env.MF_TRANSLATE_MODEL || 'gpt-4.1-mini';
const VOICE = process.env.MF_TTS_VOICE || 'sage';
const VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'];
const MAX = 300, PER_HOUR = 80, SAY_PER_HOUR = 400;  // the Bible reader reads a chapter verse by verse
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, error) => Response.json({ error: error || 'bad', msg }, { status });
async function limited(ip, kind, max = PER_HOUR) {
  try {
    const s = getStore('mannafish-limits'), k = `${kind}/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0;
    if (n >= max) return true;
    await s.set(k, String(n + 1));
  } catch (e) { /* never block a conversation because the counter failed */ }
  return false;
}
async function sha(t) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export default async (req, context) => {
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const text = String(b.text || '').trim();
  if (!text) return bad('Nothing to say', 400);
  if (text.length > MAX) return bad('Too long', 413, 'long');
  const apiKey = process.env.OPENAI_TRANSLATE_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return bad('No key yet', 501, 'nokey');
  const say = new URL(req.url).pathname.endsWith('/say');
  if (!say && await limited(context && context.ip, 'tr')) return bad('Please wait a little', 429, 'busy');
  const H = { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' };

  if (say) {
    const lang = NAMES[b.lang] ? b.lang : 'en';
    const voice = VOICES.includes(b.voice) ? b.voice : VOICE;
    const store = getStore('mannafish-tts'), id = `live/${lang}-${await sha(voice + '|' + text)}.mp3`;
    let audio = await store.get(id, { type: 'arrayBuffer' });
    if (!audio) {
      // only new recordings count toward the hourly limit; anything said before is simply played again
      if (await limited(context && context.ip, 'say', SAY_PER_HOUR)) return bad('Please wait a little', 429, 'busy');
      const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers: H,
        body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text, response_format: 'mp3',
          instructions: `Speak warmly, clearly and a little slowly, like a kind friend talking face to face, in ${NAMES[lang]}.` }) });
      if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
      if (!r.ok) return bad('Voice service error', 502);
      audio = await r.arrayBuffer();
      await store.set(id, audio);
    }
    return new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=86400' } });
  }

  // the Translator's one microphone: the words are in one of two languages; find which, and give the other
  const pair = Array.isArray(b.pair) && b.pair.length === 2 && NAMES[b.pair[0]] && NAMES[b.pair[1]] && b.pair[0] !== b.pair[1] ? b.pair : null;
  if (pair && !NAMES[b.to]) {
    const [A, B] = pair;
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
      body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 500, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: `You translate for a Christian sharing the gospel face to face with someone who speaks another language. `
          + `The user's message is in ${NAMES[A]} (code "${A}") or ${NAMES[B]} (code "${B}"). Decide which, then translate it into the other one. `
          + `Keep the meaning and the warmth; use natural, polite, everyday wording, and the usual Bible words of the churches that speak that language. `
          + `Reply with JSON only: {"from":"<code of the message's language>","to":"<code of the other>","text":"<the translation>"}.` },
        { role: 'user', content: text }] }) });
    if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
    if (!r.ok) return bad('Translation service error', 502);
    let o = {}; try { o = JSON.parse((((await r.json()).choices || [])[0] || {}).message.content || '{}'); } catch (e) { o = {}; }
    const fr = o.from === B ? B : A, out = String(o.text || '').trim();
    if (!out) return bad('No translation', 502);
    return Response.json({ text: out, from: fr, to: fr === A ? B : A });
  }
  const to = NAMES[b.to] ? b.to : 'es', from = NAMES[b.from] ? b.from : null;
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 400, messages: [
      { role: 'system', content: `You translate for a Christian sharing the gospel face to face with someone who speaks another language. `
        + `Translate the user's message ${from ? 'from ' + NAMES[from] + ' ' : ''}into ${NAMES[to]}. Keep the meaning and the warmth; `
        + `use natural, polite, everyday wording, and the usual Bible words of ${NAMES[to]}-speaking churches for God, Jesus, prayer, sin, grace and the like. `
        + `Reply with the translation only: no notes, quotes or explanations. If the message is already in ${NAMES[to]}, return it unchanged.` },
      { role: 'user', content: text }] }) });
  if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
  if (!r.ok) return bad('Translation service error', 502);
  const j = await r.json(), out = String((((j.choices || [])[0] || {}).message || {}).content || '').trim();
  if (!out) return bad('No translation', 502);
  return Response.json({ text: out, to });
};
export const config = { path: ['/api/translate', '/api/say'] };
