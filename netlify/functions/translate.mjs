// Every Tongue (Ken, 8 Oct): live help for talking with someone in another language.
//   POST /api/translate {text, to, from}  -> {text}   typed or spoken words, translated
//   POST /api/say       {text, lang}      -> mp3      a natural voice for those words
//   POST /api/translate {gloss:1, ...}    -> {base, meaning, note}   one word of a verse, explained
// Uses the same OpenAI key as the fish voice (OPENAI_API_KEY), or OPENAI_TRANSLATE_KEY if set. Translating
// needs the key to allow "Chat completions" (OpenAI → API keys → Permissions); without it this answers 503
// {error:'key'} and the page says what to change. Only the site's own pages may call it, with short texts and
// an hourly limit per visitor, so it cannot be used as a free translator by others.
import { getStore } from '@netlify/blobs';
import { NAMES, MODEL, translatePair, translateTo } from './lib/tr.mjs';
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
// Ken, 11 Oct: "there's a delay" before a recording plays -- the voice can also be asked for by GET
// (/api/say?t=<text>&l=<lang>&v=<voice>), so the browser and Netlify's CDN keep every clip once it is made.
const okRef = (r) => { try { return okOrigin(new URL(r).origin); } catch (e) { return false; } };
export default async (req, context) => {
  const get = req.method === 'GET';
  if (get) {
    if (!new URL(req.url).pathname.endsWith('/say')) return bad('POST only', 405);
    if (!(okOrigin(req.headers.get('origin')) || req.headers.get('sec-fetch-site') === 'same-origin' || okRef(req.headers.get('referer')))) return bad('Not allowed', 403);
  } else {
    if (req.method !== 'POST') return bad('POST only', 405);
    if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  }
  let b; if (get) { const q = new URL(req.url).searchParams; b = { text: q.get('t') || '', lang: q.get('l') || '', voice: q.get('v') || '' }; }
  else { try { b = await req.json(); } catch (e) { return bad('Bad request', 400); } }
  const text = String(b.text || '').trim();
  if (!text) return bad('Nothing to say', 400);
  if (text.length > MAX) return bad('Too long', 413, 'long');
  const apiKey = process.env.OPENAI_TRANSLATE_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return bad('No key yet', 501, 'nokey');
  const say = new URL(req.url).pathname.endsWith('/say');
  const H = { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' };

  // Ken, 15 Oct: "see that word in Hebrew or Greek or any other language from a little drop down".
  //   POST /api/translate {pick:1, text:word, verse, cands:[gloss,...]} -> {i}  which original word this English word translates.
  //     Only the verse's own original words can be the answer, so nothing is made up; each answer is kept.
  //   POST /api/translate {equiv:1, text:word, verse, from, to} -> {word, translit}  the word as that language would say it here.
  if (b.pick || b.equiv) {
    const verse = String(b.verse || '').trim().slice(0, 400);
    if (text.length > 60) return bad('Too long', 413, 'long');
    const cands = b.pick && Array.isArray(b.cands) ? b.cands.slice(0, 80).map((x) => String(x || '').slice(0, 40)) : null;
    const toL = NAMES[b.to] ? b.to : null, fromN = NAMES[b.from] || 'English';
    if (b.pick && !(cands && cands.length)) return bad('No words', 400);
    if (b.equiv && !toL) return bad('Which language?', 400);
    const store = getStore('mannafish-gloss'), id = (b.pick ? 'p/' : `e/${toL}-`) + await sha((b.from || '') + '|' + text + '|' + verse + '|' + (cands || []).join('~'));
    try { const hit = await store.get(id, { type: 'json' }); if (hit) return Response.json(hit); } catch (e) { /* look it up */ }
    if (await limited(context && context.ip, 'gl', 300)) return bad('Please wait a little', 429, 'busy');
    const sys = b.pick
      ? 'You align one word of an English Bible verse with the original-language text. You are given the English word, the English verse, and a numbered list of the '
        + 'English glosses of the original words, in order. Reply with JSON only: {"i": <the number of the gloss that this English word translates>}. '
        + 'If none fits, give the closest.'
      : `You help a Bible reader. Give the word that ${NAMES[toL]} would use for this ${fromN} word as it is used in this verse, the way a faithful ${NAMES[toL]} Bible would put it. `
        + `Reply with JSON only: {"word":"<the word in ${NAMES[toL]}>","translit":"<how it sounds in Latin letters, only if ${NAMES[toL]} is not written in Latin letters, else empty>"}.`;
    const user = b.pick ? `English word: ${text}\nEnglish verse: ${verse}\nGlosses:\n${cands.map((g, i) => i + ': ' + g).join('\n')}`
                        : `Word: ${text}\nVerse: ${verse}`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
      body: JSON.stringify({ model: MODEL, temperature: 0, max_tokens: 80, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }) });
    if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
    if (!r.ok) return bad('Translation service error', 502);
    let o = {}; try { o = JSON.parse((((await r.json()).choices || [])[0] || {}).message.content || '{}'); } catch (e) { o = {}; }
    let out;
    if (b.pick) { const i = parseInt(o.i, 10); if (!(i >= 0 && i < cands.length)) return bad('No match', 502); out = { i }; }
    else { out = { word: String(o.word || '').slice(0, 60), translit: String(o.translit || '').slice(0, 60) }; if (!out.word) return bad('No word', 502); }
    try { await store.setJSON(id, out); } catch (e) { /* still answer */ }
    return Response.json(out);
  }
  // Ken, 11 Oct: tap one word in a passage -> what it means in that verse, in the reader's own language.
  //   POST /api/translate {gloss:1, text:word, verse, from, to, hint?} -> {base, meaning, note}
  // Each answer is kept, so a word in a verse is only ever looked up once for each language.
  if (b.gloss) {
    const SRC = { ...NAMES, hbo: 'Biblical Hebrew', grc: 'Koine Greek' };
    const fromN = SRC[b.from] || 'the language of the verse', toL = NAMES[b.to] ? b.to : 'en';
    const verse = String(b.verse || '').trim().slice(0, 400), hint = String(b.hint || '').slice(0, 80);
    if (text.length > 60) return bad('Too long', 413, 'long');
    const store = getStore('mannafish-gloss'), id = `g/${toL}-${await sha((b.from || '') + '|' + text + '|' + verse)}`;
    try { const hit = await store.get(id, { type: 'json' }); if (hit) return Response.json(hit); } catch (e) { /* look it up */ }
    if (await limited(context && context.ip, 'gl', 300)) return bad('Please wait a little', 429, 'busy');
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
      body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 220, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: `You help an ordinary Christian reader understand one word of the Bible. The word is from the verse given, written in ${fromN}. `
          + `Explain it simply and faithfully, in ${NAMES[toL]}, as it is used in that verse. Reply with JSON only: `
          + `{"base":"the word's dictionary form in ${fromN}","meaning":"what it means here, in ${NAMES[toL]}, at most 10 words","note":"one short, plain sentence in ${NAMES[toL]} on how the word is used in this verse"}.` },
        { role: 'user', content: `Word: ${text}${hint ? `\nA word-by-word gloss gives: ${hint}` : ''}\nVerse: ${verse}` }] }) });
    if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
    if (!r.ok) return bad('Translation service error', 502);
    let o = {}; try { o = JSON.parse((((await r.json()).choices || [])[0] || {}).message.content || '{}'); } catch (e) { o = {}; }
    const out = { base: String(o.base || '').slice(0, 80), meaning: String(o.meaning || '').slice(0, 160), note: String(o.note || '').slice(0, 300) };
    if (!out.meaning) return bad('No meaning', 502);
    try { await store.setJSON(id, out); } catch (e) { /* still answer */ }
    return Response.json(out);
  }

  if (!say && await limited(context && context.ip, 'tr')) return bad('Please wait a little', 429, 'busy');

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
      // Ken, 21 Oct: "there is a great delay" -- the sound goes to the phone as it is made, not after the whole clip is done;
      // a copy is kept (in the background) so the same words come back at once next time
      if (r.body && context && context.waitUntil) {
        const [toPhone, toStore] = r.body.tee();
        context.waitUntil(new Response(toStore).arrayBuffer().then((buf) => buf.byteLength > 1000 ? store.set(id, buf) : null).catch(() => {}));
        return new Response(toPhone, { headers: get
          ? { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000, immutable', 'netlify-cdn-cache-control': 'public, max-age=31536000, durable', 'netlify-vary': 'query' }
          : { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=86400' } });
      }
      audio = await r.arrayBuffer();
      await store.set(id, audio);
    }
    // the address holds the exact words and voice, so a clip never changes: keep it everywhere for a year
    return new Response(audio, { headers: get
      ? { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000, immutable', 'netlify-cdn-cache-control': 'public, max-age=31536000, durable', 'netlify-vary': 'query' }
      : { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=86400' } });
  }

  // the Translator's one microphone: the words are in one of two languages; find which, and give the other (lib/tr.mjs)
  const fail = (o) => o.error === 'key' ? bad('Key not allowed', 503, 'key') : bad(o.error === 'empty' ? 'No translation' : 'Translation service error', 502);
  const pair = Array.isArray(b.pair) && b.pair.length === 2 && NAMES[b.pair[0]] && NAMES[b.pair[1]] && b.pair[0] !== b.pair[1] ? b.pair : null;
  if (pair && !NAMES[b.to]) { const o = await translatePair(H, text, pair[0], pair[1]); return o.error ? fail(o) : Response.json(o); }
  const to = NAMES[b.to] ? b.to : 'es', from = NAMES[b.from] ? b.from : null;
  const o = await translateTo(H, text, from, to); return o.error ? fail(o) : Response.json(o);
};
export const config = { path: ['/api/translate', '/api/say'] };
