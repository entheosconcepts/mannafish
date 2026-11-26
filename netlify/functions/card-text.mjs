// Greeting card words (Ken, 26 Nov: "create a birthday card, anniversary card, Christmas card ... say what you want the card to say
// and what you want it to look like, and then you build it"). The person says what they want; this writes the front words, a short
// saying or poem for the inside, a short personal line, and a description for the background picture (made by /api/picture, kind 'card').
// Everything it writes can be changed by the person on the page. Written with AI: the page says so.
//   POST /api/card-text {occasion, brief, to, from, verse, ref} -> {title, saying, message, picture}
import { getStore } from '@netlify/blobs';
import { MODEL } from './lib/tr.mjs';
import { premiumOk, premiumNo } from './lib/premium.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, error) => Response.json({ error: error || 'bad', msg }, { status, headers: { 'cache-control': 'no-store' } });
const PER_HOUR = 20;
const clean = (t, n) => String(t || '').replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, n);
async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `ct/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= PER_HOUR) return true; await s.set(k, String(n + 1)); } catch (e) { /* never block because the counter failed */ }
  return false;
}
const RULES = `You write words for a printed greeting card inside a free Christian app called MannaFish.
- Warm, kind, family-friendly and simple. Never mean, romantic-explicit, political or insulting. No made-up facts about real people.
- If a Bible verse is given, you may point to it gently, but never change or invent Scripture; the page shows the verse itself.
- "title" is the short front line (for example "Happy Birthday", "Happy Anniversary", "Merry Christmas"), 1 to 5 words.
- "saying" is a little special saying or short poem for the inside, 2 to 8 short lines separated by \\n. It may rhyme or not.
- "message" is one or two warm sentences in the sender's voice, without a signature.
- "picture" is a short description of a pretty background image for the front (scenery, flowers, light, patterns). No people, no words, no letters.
Return ONLY valid JSON with those four keys.`;

export default async (req, context) => {
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  if (!premiumOk(req)) return premiumNo();
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const key = process.env.OPENAI_TRANSLATE_KEY || process.env.OPENAI_API_KEY;
  if (!key) return bad('Not set up yet', 501, 'nokey');
  const occasion = clean(b.occasion, 40) || 'birthday', brief = clean(b.brief, 500), to = clean(b.to, 60), from = clean(b.from, 60), verse = clean(b.verse, 400), ref = clean(b.ref, 60);
  if (await limited(context && context.ip)) return bad('Please wait a little and try again', 429, 'busy');
  const user = `Occasion: ${occasion}\n${to ? 'For: ' + to + '\n' : ''}${from ? 'From: ' + from + '\n' : ''}${verse ? 'Bible verse the sender chose (' + (ref || 'reference') + '): "' + verse.replace(/"/g, "'") + '"\n' : ''}${brief ? 'What the sender asked for, in their words: "' + brief.replace(/"/g, "'") + '"\n' : 'The sender gave no extra wishes; make it lovely.\n'}Reply with JSON: {"title": "...", "saying": "...", "message": "...", "picture": "..."}`;
  let r;
  try {
    r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, temperature: 0.8, max_tokens: 600, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: RULES }, { role: 'user', content: user }] }),
      signal: AbortSignal.timeout(25000) });
  } catch (e) { return bad('The writer could not be reached', 502); }
  if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
  if (!r.ok) return bad('The writer had a problem', 502);
  let o; try { o = JSON.parse((await r.json()).choices[0].message.content); } catch (e) { return bad('The answer could not be read', 502); }
  const out = { title: clean(o.title, 60), saying: String(o.saying || '').replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 500), message: clean(o.message, 300), picture: clean(o.picture, 200) };
  if (!out.title && !out.saying) return bad('The answer was empty', 502);
  return Response.json(out, { headers: { 'cache-control': 'no-store' } });
};
export const config = { path: '/api/card-text' };
