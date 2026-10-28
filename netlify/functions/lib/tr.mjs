// The Translator's words, shared by /api/translate and /api/hear (so a spoken sentence is heard and translated in one trip).
export const NAMES = { en: 'English', es: 'Spanish', tl: 'Tagalog (Filipino)', zh: 'Simplified Chinese (Mandarin)', hi: 'Hindi',
  el: 'Modern Greek', de: 'German', ko: 'Korean', he: 'Modern Hebrew', ar: 'Modern Standard Arabic',ru:"Russian", tr: 'Turkish' };
export const MODEL = process.env.MF_TRANSLATE_MODEL || 'gpt-4.1-mini';
// the words are in one of two languages: find which, and give the other  -> {text, from, to} | {error}
export async function translatePair(H, text, A, B) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 500, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: `You translate for a Christian sharing the gospel face to face with someone who speaks another language. `
        + `The user's message is in ${NAMES[A]} (code "${A}") or ${NAMES[B]} (code "${B}"). Decide which, then translate it into the other one. `
        + `Keep the meaning and the warmth; use natural, polite, everyday wording, and the usual Bible words of the churches that speak that language. `
        + `The words are speech-to-text of someone talking, sent when they paused; they may have paused mid-thought to think of what to say. `
        + `Set "done" to false only if they clearly stopped in the middle of a thought (it ends on "and", "but", "because", "so", "the", a comma, `
        + `"um", or an unfinished clause), otherwise true. `
        + `Reply with JSON only: {"from":"<code of the message's language>","to":"<code of the other>","text":"<the translation>","done":true|false}.` },
      { role: 'user', content: text }] }) });
  if (r.status === 401 || r.status === 403) return { error: 'key', status: r.status };
  if (!r.ok) return { error: 'service', status: r.status };
  let o = {}; try { o = JSON.parse((((await r.json()).choices || [])[0] || {}).message.content || '{}'); } catch (e) { o = {}; }
  const fr = o.from === B ? B : A, out = String(o.text || '').trim();
  return out ? { text: out, from: fr, to: fr === A ? B : A, done: o.done === false ? false : !unfinished(text) } : { error: 'empty' };
}
// Ken, 28 Oct: "translate out loud for me after I'm done with my thought, not in the middle of it": words that plainly stop mid-thought
// (a joining word, a filler, a comma at the end), in the Translator's languages
const OPEN = /(,|(?<!\p{L})(and|but|or|so|because|that|the|a|to|of|with|um+|uh+|like|y|o|pero|porque|que|el|la|los|las|de|con|para|este|pues|at|pero|kasi|na|ng|und|aber|oder|weil|dass|der|die|das|mit|και|αλλά|γιατί|ότι|и|а|но|или|потому|что|чтобы|в|на|с|ну|э+|ve|ama|çünkü|ki)|[、，,和但因为])\s*$/iu;
export function unfinished(text) { return OPEN.test(String(text || '').trim()); }
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
// a prayer said aloud (or typed with thumbs): spelling, punctuation and capitals made right, the person's own words kept
// (Ken, 22 Oct: "a button to record prayers, with a little AI help to make sure it comes out correct with word spelling and punctuation")
export async function polish(H, text) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
    body: JSON.stringify({ model: MODEL, temperature: 0, max_tokens: 1200, messages: [
      { role: 'system', content: 'You tidy up a prayer or a note that someone spoke into their phone or typed quickly. Fix spelling, punctuation, '
        + 'capital letters, and words that speech-to-text clearly misheard. Keep the person’s own words, voice, language and meaning: do not add, remove, '
        + 'reword or explain anything, and do not make it more formal. Capitalize You, Your, He and His when they clearly refer to God. Keep Bible '
        + 'references as references (e.g. "John 3:16"). Reply with the corrected text only.' },
      { role: 'user', content: text }] }) });
  if (r.status === 401 || r.status === 403) return { error: 'key', status: r.status };
  if (!r.ok) return { error: 'service', status: r.status };
  const j = await r.json(), out = String((((j.choices || [])[0] || {}).message || {}).content || '').trim();
  return out ? { text: out } : { error: 'empty' };
}
