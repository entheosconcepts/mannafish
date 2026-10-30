// The Translator's words, shared by /api/translate and /api/hear (so a spoken sentence is heard and translated in one trip).
export const NAMES = { en: 'English', es: 'Spanish', tl: 'Tagalog (Filipino)', zh: 'Simplified Chinese (Mandarin)', hi: 'Hindi',
  el: 'Modern Greek', de: 'German', ko: 'Korean', he: 'Modern Hebrew', ar: 'Modern Standard Arabic',ru:"Russian", tr: 'Turkish',
  fr: 'French', pt: 'Brazilian Portuguese', ht: 'Haitian Creole', vi: 'Vietnamese', ja: 'Japanese', it: 'Italian', pl: 'Polish',
  uk: 'Ukrainian', fa: 'Persian (Farsi)', ur: 'Urdu', sw: 'Swahili' };
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
// Ken, 30 Oct: "any way for the translator to detect what language is spoken?" -- their language isn't chosen yet: find it from what
// they said, and translate it into the Christian's language A. Words in A itself wait for them to speak ({first:true}). Once a language
// the Translator doesn't list has been found, other ({code, name}) carries it, so A's words are translated into it.
//   -> {first:true, from:A} | {text, from, to, done, detected:{code, name, known}} | {error}
export async function translateDetect(H, text, A, other) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: H,
    body: JSON.stringify({ model: MODEL, temperature: 0.1, max_tokens: 500, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: `You translate for a Christian sharing the gospel face to face with someone who speaks another language. `
        + `The Christian speaks ${NAMES[A]} (code "${A}"). The user's message is speech-to-text of one of them talking. `
        + (other ? `The other person speaks ${other.name} (code "${other.code}"). If the message is in ${NAMES[A]}, translate it into ${other.name}; otherwise translate it into ${NAMES[A]}. `
          : `First identify the language of the message (ignore a foreign word or name here and there). If it is ${NAMES[A]}, do not translate: give "text" as "". Otherwise translate it into ${NAMES[A]}. `)
        + `Keep the meaning and the warmth; use natural, polite, everyday wording, and the usual Bible words of the churches that speak that language. `
        + `Set "done" to false only if they clearly stopped in the middle of a thought, otherwise true. `
        + `Reply with JSON only: {"lang":"<ISO 639-1 code of the message's language>","name":"<that language's name in English>","text":"<the translation>","done":true|false}.` },
      { role: 'user', content: text }] }) });
  if (r.status === 401 || r.status === 403) return { error: 'key', status: r.status };
  if (!r.ok) return { error: 'service', status: r.status };
  let o = {}; try { o = JSON.parse((((await r.json()).choices || [])[0] || {}).message.content || '{}'); } catch (e) { o = {}; }
  const code = String(o.lang || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3), name = String(o.name || '').slice(0, 40), out = String(o.text || '').trim();
  const done = o.done === false ? false : !unfinished(text);
  if (!code) return { error: 'empty' };
  if (code === A) return other ? (out ? { text: out, from: A, to: other.code, done } : { error: 'empty' }) : { first: true, from: A };
  if (!out) return { error: 'empty' };
  return { text: out, from: code, to: A, done, detected: other ? null : { code, name: name || code, known: !!NAMES[code] } };
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
