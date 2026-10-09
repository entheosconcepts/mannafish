// "▶ Listen" in the devotional email (Ken, 9 Oct): one tap plays the day's MannaFish aloud in the phone's own
// player -- the word, today's verse and the verse on the fish -- in the subscriber's language, in a natural voice.
// Email apps cannot run a player inside the email, so the button links here and this answers with the audio.
//   GET /api/listen?w=rest&r=7&lang=en[&v=sage]
// Each day's clip is made once and kept in Blobs. Without the voice key it sends the person to the reader instead.
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import WORDS from './lib/words.json';
import ES from './lib/es.json';
import SPEAK from './lib/speak.json';
const VOICE = process.env.MF_TTS_VOICE || 'sage';
const VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'];
const SITE = () => (process.env.URL || 'https://manna-fish.com').replace(/\/$/, '');

async function verseText(ref, lang) {
  const m = ref.match(/^(.*?)\s+(\d+):(\d+)/); if (!m) return '';
  const [, book, ch, vs] = m;
  try {
    if (lang === 'es') {   // Reina-Valera 1909, the same chapters the site's reader shows
      const r = await fetch(`${SITE()}/fish-lang/bible/es/${book.replace(/ /g, '_')}-${ch}.json`);
      if (r.ok) { const j = await r.json(); return String(j.t[+vs - 1] || ''); }
      return '';
    }
    const r = await fetch(`https://bible-api.com/${encodeURIComponent(`${book} ${ch}:${vs}`)}?translation=kjv`);
    if (r.ok) { const j = await r.json(); return String(j.text || '').replace(/\s+/g, ' ').trim(); }
  } catch (e) { /* fall through: the clip is made without the full verse */ }
  return '';
}

function sendAudio(req, audio) {
  // phones ask for the sound in pieces ("Range"); answer the same way so it plays everywhere
  const buf = new Uint8Array(audio), n = buf.length, H = { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=86400', 'content-disposition': 'inline; filename="mannafish.mp3"' };
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (m) {
    let a = m[1] === '' ? n - +m[2] : +m[1], b = m[1] !== '' && m[2] !== '' ? +m[2] : n - 1;
    a = Math.max(0, a); b = Math.min(n - 1, b);
    if (a > b) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${n}` } });
    return new Response(buf.slice(a, b + 1), { status: 206, headers: { ...H, 'content-range': `bytes ${a}-${b}/${n}`, 'content-length': String(b - a + 1) } });
  }
  return new Response(req.method === 'HEAD' ? null : buf, { headers: { ...H, 'content-length': String(n) } });
}

export default async (req) => {
  const u = new URL(req.url), key = String(u.searchParams.get('w') || '').toUpperCase();
  const lang = u.searchParams.get('lang') === 'es' ? 'es' : 'en', i = +u.searchParams.get('r') || 0;
  const voice = VOICES.includes(u.searchParams.get('v')) ? u.searchParams.get('v') : VOICE;
  const w = WORDS.words[key];
  if (!w || !w.refs[i]) return new Response('Unknown word', { status: 404 });
  const reader = `${SITE()}/?w=${key.toLowerCase()}&r=${i}${lang === 'es' ? '&lang=es' : ''}`;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.redirect(reader, 302);

  const ref = w.refs[i][0], es = lang === 'es';
  const mm = ref.match(/^(.*?)\s+(\d+:\d+.*)$/), refSaid = es && mm ? (ES.books[mm[1]] || mm[1]) + ' ' + mm[2] : ref;
  const title = es ? (ES.titles[key] || w.title) : w.title;
  const fish = ((SPEAK[lang] || {})[key] || {}).verse || '';
  const verse = await verseText(ref, lang);
  const script = es
    ? `MannaFish de hoy. ${title}. ${refSaid}. ${verse} ... Y el versículo del pez: ${fish}`
    : `Today's MannaFish. ${title}. ${refSaid}. ${verse} ... And the verse on the fish: ${fish}`;

  const store = getStore('mannafish-tts');
  const id = `listen/${lang}/${key}-${i}-${voice}-${createHash('sha256').update(script).digest('hex').slice(0, 8)}.mp3`;
  let audio = await store.get(id, { type: 'arrayBuffer' });
  if (!audio) {
    const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST',
      headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: script, response_format: 'mp3',
        instructions: es ? 'Lee con calma y calidez, como un devocional, con una pausa breve entre las partes.'
          : 'Read calmly and warmly, like a short morning devotional, with a brief pause between the parts.' }) });
    if (!r.ok) return Response.redirect(reader, 302);
    audio = await r.arrayBuffer();
    await store.set(id, audio);
  }
  return sendAudio(req, audio);
};
export const config = { path: '/api/listen' };
