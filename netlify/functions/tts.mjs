// Read today's fish aloud in a natural voice. It only reads the site's own verse lines (by word and
// language), so it cannot be used as a free reader for anything else. Until a voice key is added in
// Netlify (OPENAI_API_KEY), it answers 501 and the page uses the phone's or computer's own voice.
// Each clip is made once and kept in Blobs, so a verse costs a fraction of a cent one time only.
import { getStore } from '@netlify/blobs';
import SPEAK from './lib/speak.json';
const VOICE = process.env.MF_TTS_VOICE || 'sage';
export default async (req) => {
  const u = new URL(req.url), lang = u.searchParams.get('lang') === 'es' ? 'es' : 'en', key = String(u.searchParams.get('w') || '').toUpperCase();
  const text = (SPEAK[lang] || {})[key];
  if (!text) return new Response('Unknown word', { status: 404 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response('No voice key yet', { status: 501 });
  const store = getStore('mannafish-tts'), id = `${lang}/${key}-${VOICE}.mp3`;
  let audio = await store.get(id, { type: 'arrayBuffer' });
  if (!audio) {
    const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST',
      headers: { 'authorization': 'Bearer ' + apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: VOICE, input: text, response_format: 'mp3',
        instructions: lang === 'es' ? 'Lee con calma y calidez, como un devocional.' : 'Read calmly and warmly, like a devotional.' }) });
    if (!r.ok) return new Response('Voice service error', { status: 502 });
    audio = await r.arrayBuffer();
    await store.set(id, audio);
  }
  return new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=86400' } });
};
export const config = { path: '/api/tts' };
