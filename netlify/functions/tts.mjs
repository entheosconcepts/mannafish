// Speaks a fish aloud in a natural voice: just the word in the middle, or the verse on the fish,
// in any of the fish's languages (all ten: en, es, tl, zh, hi, el, de, ko, he, ar). It only reads the site's own lines, so it
// cannot be used as a free reader for anything else. Until a voice key is added in Netlify
// (OPENAI_API_KEY), it answers 501 and the page uses the phone's or computer's own voice.
// Each clip is made once and kept in Blobs, so a line costs a fraction of a cent one time only.
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import SPEAK from './lib/speak.json';
import TONGUE from './lib/tongue.json';
const VOICE = process.env.MF_TTS_VOICE || 'sage';
// the listener may pick another natural voice (Ken, 9 Oct)
const VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'];
const HOW = { en: 'Read calmly and warmly, like a devotional.', es: 'Lee con calma y calidez, como un devocional.' };
const NAME = { en: 'English', es: 'Spanish', tl: 'Tagalog', zh: 'Chinese', hi: 'Hindi', el: 'Greek', de: 'German', ko: 'Korean', he: 'Hebrew', ar: 'Arabic' };
// one word on its own: the voice could say another word (Ken, 25 Oct: Spanish "Cree" was heard as "Pray"), so it is told to say just
// that word, as written, in its own language
const ONE = (lang, w) => `Say only this one ${NAME[lang] || ''} word, exactly as written, pronounced in ${NAME[lang] || 'its own language'}: "${w}". Do not translate it and do not add any other word. Say it calmly and warmly.`;
// one word on its own is kept as a WAV with a little quiet after it (Ken, 26 Oct: Spanish "Goza" stopped before the end of
// the word; the last moment of a very short MP3 can be lost when a phone plays it): recorded as raw sound and wrapped here
function wav(pcm, rate = 24000) {
  const data = Buffer.concat([Buffer.from(pcm), Buffer.alloc(Math.round(rate * 0.35) * 2)]), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
export default async (req) => {
  const u = new URL(req.url), lang = String(u.searchParams.get('lang') || 'en'), key = String(u.searchParams.get('w') || '').toUpperCase();
  const part = u.searchParams.get('part') === 'word' ? 'word' : 'verse';
  // Every Tongue (8 Oct): a ready-made phrase or one of its four verses, by id (?p=pray_for&lang=ko)
  const pid = String(u.searchParams.get('p') || ''), voice = VOICES.includes(u.searchParams.get('v')) ? u.searchParams.get('v') : VOICE;
  const row = pid && [...TONGUE.phrases, ...TONGUE.verses].find((x) => x.id === pid);
  const text = pid ? (row && row.t[lang]) : ((SPEAK[lang] || {})[key] || {})[part];
  if (!text) return new Response('Unknown word', { status: 404 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response('No voice key yet', { status: 501 });
  // the clip's name carries a short fingerprint of its words, so a corrected line is recorded afresh
  const how = pid ? 'Speak warmly, clearly and a little slowly, like a kind friend talking face to face, in the language of the text.' : part === 'word' ? ONE(lang, text) : HOW[lang] || 'Read calmly and warmly, like a devotional, in the language of the text.';
  const word = part === 'word' && !pid;
  const fp = createHash('sha256').update(text + (word ? '|one2' : '')).digest('hex').slice(0, 8);
  const store = getStore('mannafish-tts'), id = pid ? `${lang}/tongue-${pid}-${voice}-${fp}.mp3` : `${lang}/${key}-${part}-${voice}-${fp}.${word ? 'wav' : 'mp3'}`;
  let audio = await store.get(id, { type: 'arrayBuffer' });
  if (!audio) {
    const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST',
      headers: { 'authorization': 'Bearer ' + apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: word ? text + '.' : text, response_format: word ? 'pcm' : 'mp3',
        instructions: how }) });
    if (!r.ok) return new Response('Voice service error', { status: 502 });
    audio = await r.arrayBuffer();
    if (word) audio = wav(audio);
    await store.set(id, audio);
  }
  // kept by Netlify's CDN too (Ken, 11 Oct: the delay before a fish is heard); a corrected line is new after a week at most
  return new Response(audio, { headers: { 'content-type': word ? 'audio/wav' : 'audio/mpeg', 'cache-control': 'public, max-age=86400', 'netlify-cdn-cache-control': 'public, max-age=604800, durable', 'netlify-vary': 'query' } });
};
export const config = { path: '/api/tts' };
