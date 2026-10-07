// Speaks a fish aloud in a natural voice: just the word in the middle, or the verse on the fish,
// in any of the fish's languages (en, es, tl, zh, hi, el). It only reads the site's own lines, so it
// cannot be used as a free reader for anything else. Until a voice key is added in Netlify
// (OPENAI_API_KEY), it answers 501 and the page uses the phone's or computer's own voice.
// Each clip is made once and kept in Blobs, so a line costs a fraction of a cent one time only.
import { getStore } from '@netlify/blobs';
import SPEAK from './lib/speak.json';
const VOICE = process.env.MF_TTS_VOICE || 'sage';
const HOW = { en: 'Read calmly and warmly, like a devotional.', es: 'Lee con calma y calidez, como un devocional.' };
export default async (req) => {
  const u = new URL(req.url), lang = String(u.searchParams.get('lang') || 'en'), key = String(u.searchParams.get('w') || '').toUpperCase();
  const part = u.searchParams.get('part') === 'word' ? 'word' : 'verse';
  const text = ((SPEAK[lang] || {})[key] || {})[part];
  if (!text) return new Response('Unknown word', { status: 404 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response('No voice key yet', { status: 501 });
  const store = getStore('mannafish-tts'), id = `${lang}/${key}-${part}-${VOICE}.mp3`;
  let audio = await store.get(id, { type: 'arrayBuffer' });
  if (!audio) {
    const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST',
      headers: { 'authorization': 'Bearer ' + apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: VOICE, input: text, response_format: 'mp3',
        instructions: HOW[lang] || 'Read calmly and warmly, like a devotional, in the language of the text.' }) });
    if (!r.ok) return new Response('Voice service error', { status: 502 });
    audio = await r.arrayBuffer();
    await store.set(id, audio);
  }
  return new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=86400' } });
};
export const config = { path: '/api/tts' };
