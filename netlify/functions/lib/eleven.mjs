// ElevenLabs voices (Ken, 6 Nov). The key lives only in Netlify (ELEVENLABS_API_KEY). A voice is named "el:<its ElevenLabs id>" everywhere
// in MannaFish, so it can sit beside the built-in voices in the same lists. ElevenLabs is metered, so:
//   - a clip is made once and kept (same as the other voices),
//   - this month's characters are counted (ELEVENLABS_MONTHLY_CHARS, default 30000), and when the month's allowance is used up,
//     or ElevenLabs cannot answer, the same words are read by the built-in voice instead. Nothing ever just goes silent.
import { getStore } from '@netlify/blobs';
export const EL = /^el:[A-Za-z0-9]{10,40}$/;
export const isEl = (v) => EL.test(String(v || ''));
export const elevenOn = () => !!process.env.ELEVENLABS_API_KEY;
const MODEL = () => process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
let memo = null;
// every voice in Ken's ElevenLabs account (a copy is kept for an hour)
export async function elevenVoices() {
  if (!elevenOn()) return [];
  if (memo && Date.now() - memo.t < 3600e3) return memo.v;
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
    if (!r.ok) return [];
    const j = await r.json();
    const v = (j.voices || []).filter((x) => /^[A-Za-z0-9]{10,40}$/.test(x.voice_id || '')).map((x) => {
      const L = x.labels || {};
      return { id: 'el:' + x.voice_id, name: String(x.name || 'Voice').slice(0, 40), sounds: [L.gender, L.age, L.accent, L.descriptive || L.use_case].filter(Boolean).join(', ') || String(x.category || '') };
    });
    memo = { t: Date.now(), v };
    return v;
  } catch (e) { return []; }
}
// ask for n characters of this month's allowance; false = used up
export async function elevenBudget(n) {
  const max = Number(process.env.ELEVENLABS_MONTHLY_CHARS) || 30000;
  try {
    const s = getStore('mannafish-limits'), k = 'eleven/' + new Date().toISOString().slice(0, 7), used = Number(await s.get(k)) || 0;
    if (used + n > max) return false;
    await s.set(k, String(used + n));
  } catch (e) { /* the counter failing must not silence a voice */ }
  return true;
}
// speak: the answer is ElevenLabs' own response (mp3, or raw 24 kHz sound when format is 'pcm_24000')
export function elevenSpeak(id, text, format = 'mp3_44100_128') {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(String(id).slice(3))}?output_format=${format}`, {
    method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: MODEL() }) });
}
