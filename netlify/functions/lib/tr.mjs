// The Translator's words, shared by /api/translate and /api/hear (so a spoken sentence is heard and translated in one trip).
export const NAMES = { en: 'English', es: 'Spanish', tl: 'Tagalog (Filipino)', zh: 'Simplified Chinese (Mandarin)', hi: 'Hindi',
  el: 'Modern Greek', de: 'German', ko: 'Korean', he: 'Modern Hebrew', ar: 'Modern Standard Arabic', tr: 'Turkish' };
export const MODEL = process.env.MF_TRANSLATE_MODEL || 'gpt-4.1-mini';
// the words are in one of two languages: find which, and give the other  -> {text, from, to} | {error}
export async function translatePair(H, text, A, B) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 500, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: `You translate for a Christian sharing the gospel face to face with someone who speaks another language. `
        + `The user's message is in ${NAMES[A]} (code "${A}") or ${NAMES[B]} (code "${B}"). Decide which, then translate it into the other one. `
        + `Keep the meaning and the warmth; use natural, polite, everyday wording, and the usual Bible words of the churches that speak that language. `
        + `Reply with JSON only: {"from":"<code of the message's language>","to":"<code of the other>","text":"<the translation>"}.` },
      { role: 'user', content: text }] }) });
  if (r.status === 401 || r.status === 403) return { error: 'key', status: r.status };
  if (!r.ok) return { error: 'service', status: r.status };
  let o = {}; try { o = JSON.parse((((await r.json()).choices || [])[0] || {}).message.content || '{}'); } catch (e) { o = {}; }
  const fr = o.from === B ? B : A, out = String(o.text || '').trim();
  return out ? { text: out, from: fr, to: fr === A ? B : A } : { error: 'empty' };
}
// into one language  -> {text, to} | {error}
export async function translateTo(H, text, from, to) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 400, messages: [
      { role: 'system', content: `You translate for a Christian sharing the gospel face to face with someone who speaks another language. `
        + `Translate the user's message ${from ? 'from ' + NAMES[from] + ' ' : ''}into ${NAMES[to]}. Keep the meaning and the warmth; `
        + `use natural, polite, everyday wording, and the usual Bible words of ${NAMES[to]}-speaking churches for God, Jesus, prayer, sin, grace and the like. `
        + `Reply with the translation only: no notes, quotes or explanations. If the message is already in ${NAMES[to]}, return it unchanged.` },
      { role: 'user', content: text }] }) });
  if (r.status === 401 || r.status === 403) return { error: 'key', status: r.status };
  if (!r.ok) return { error: 'service', status: r.status };
  const j = await r.json(), out = String((((j.choices || [])[0] || {}).message || {}).content || '').trim();
  return out ? { text: out, to } : { error: 'empty' };
}
