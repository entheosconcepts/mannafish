// "Explain this passage" and "How might this apply to my life?" (Ken, 7 Nov: Bible-app study help, free for everyone).
//   POST /api/explain {b: 'Galatians', c: 6, v1: 1, v2: 10, lang: 'en'}                        -> the explanation (made once per passage and language, then kept)
//   POST /api/explain {b, c, v1, v2, lang, situation: 'I am afraid of losing my job'}          -> a personal reply (never kept; not stored anywhere)
// The passage text is read here from the site's own King James files, never taken from the person, so this can only explain Scripture
// (it is not a general chat). Written with AI: it is told to stay within the widely shared Christian faith, to say when Christians
// differ, not to invent facts, and to point to a pastor or a crisis line where that matters. The page says plainly that it is AI.
import { getStore } from '@netlify/blobs';
import { MODEL } from './lib/tr.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, error) => Response.json({ error: error || 'bad', msg }, { status });
const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
const LANG = { en: 'English', es: 'Spanish', tl: 'Tagalog', zh: 'Chinese', hi: 'Hindi', el: 'Greek', de: 'German', ko: 'Korean', he: 'Hebrew', ar: 'Arabic', ru: 'Russian' };
const EXPLAIN_PER_HOUR = 40, PERSONAL_PER_HOUR = 10;

async function limited(ip, kind, max) {
  try {
    const s = getStore('mannafish-limits'), k = `${kind}/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= max) return true; await s.set(k, String(n + 1));
  } catch (e) { /* never block because the counter failed */ }
  return false;
}
const RULES = `You are a careful, humble Bible study guide inside a free app called MannaFish. You help an ordinary person understand a short Bible passage and live it out.
Rules you always follow:
- Stay within the historic Christian faith that Christians everywhere share (the Apostles' and Nicene creeds). Do not promote one denomination.
- Use only the passage you are given and well-known background. Never invent facts, dates, quotations, or Hebrew and Greek words you are not sure of.
- If sincere Christians differ about something in the passage, say so fairly in one sentence.
- Be warm, plain and short. Explain any big word you use. Do not preach at the reader or shame them.
- Do not give medical, legal or financial advice. Never claim to speak for God; you are a helper, and Scripture is the authority.
Return ONLY valid JSON.`;

export default async (req, context) => {
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const book = BOOKS.indexOf(String(b.b || '')) >= 0 ? String(b.b) : '', c = parseInt(b.c, 10), lang = LANG[b.lang] ? b.lang : 'en';
  if (!book || !(c >= 1 && c <= 150)) return bad('Which passage?', 400);
  const key = process.env.OPENAI_TRANSLATE_KEY || process.env.OPENAI_API_KEY;
  if (!key) return bad('Not set up yet', 501, 'nokey');
  // the passage, from the site's own files
  let verses;
  try { const r = await fetch(new URL(`/fish-lang/bible/kjv/${book.replace(/ /g, '_')}-${c}.json`, req.url)); if (!r.ok) throw 0; verses = (await r.json()).t || []; } catch (e) { return bad('That chapter could not be read', 404); }
  const v1 = Math.max(1, parseInt(b.v1, 10) || 1), v2 = Math.min(verses.length, Math.max(v1, parseInt(b.v2, 10) || Math.min(verses.length, v1 + 9)));
  if (v1 > verses.length || v2 - v1 > 29) return bad('Choose a shorter passage', 400);
  const text = verses.slice(v1 - 1, v2).map((t, i) => `${v1 + i}. ${t}`).join('\n'), ref = `${book} ${c}:${v1}${v2 > v1 ? '-' + v2 : ''}`;
  const personal = typeof b.situation === 'string' && b.situation.trim().length > 0;
  const store = getStore('mannafish-explain'), id = `e/${lang}/${book.replace(/ /g, '_')}/${c}/${v1}-${v2}`;
  if (!personal) { try { const hit = await store.get(id, { type: 'json' }); if (hit) return Response.json({ ...hit, ref, cached: true }, { headers: { 'cache-control': 'public, max-age=3600' } }); } catch (e) { /* make it */ } }
  if (await limited(context && context.ip, personal ? 'xp' : 'ex', personal ? PERSONAL_PER_HOUR : EXPLAIN_PER_HOUR)) return bad('Please wait a little and try again', 429, 'busy');
  const L = LANG[lang];
  const user = personal
    ? `Passage (${ref}, King James Version):\n${text}\n\nThe reader says (in their own words): "${String(b.situation).trim().slice(0, 500).replace(/"/g, "'")}"\n\nWrite in ${L}. Reply with JSON: {"message": "3 to 5 warm, plain sentences connecting this passage to what they shared, without pretending to know their whole story", "steps": ["2 or 3 small, practical next steps"], "prayer": "a short prayer of 2 to 3 sentences"}. If they mention thoughts of harming themselves or someone else, or abuse, keep the Bible part to one sentence, respond with real compassion, and urge them to contact local emergency services or a crisis line right away (in the United States call or text 988) and to tell a trusted person.`
    : `Passage (${ref}, King James Version):\n${text}\n\nWrite in ${L}. Reply with JSON: {"summary": "2 or 3 sentences: what this passage says", "context": "1 to 3 sentences: who is speaking, to whom, when or where, and why", "understand": ["3 or 4 short strings: the main ideas in plain words"], "keywords": [{"word": "an important word in the passage", "meaning": "what it means here in plain words"}] (up to 3), "apply": ["3 short, practical ways to live this out today"], "questions": ["3 reflection questions"], "prayer": "a short prayer of 2 to 3 sentences"}`;
  let r;
  try {
    r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, temperature: personal ? 0.5 : 0.3, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: RULES }, { role: 'user', content: user }] }) });
  } catch (e) { return bad('The helper could not be reached', 502); }
  if (r.status === 401 || r.status === 403) return bad('Key not allowed', 503, 'key');
  if (!r.ok) return bad('The helper had a problem', 502);
  let out; try { out = JSON.parse((await r.json()).choices[0].message.content); } catch (e) { return bad('The answer could not be read', 502); }
  const arr = (x, n) => (Array.isArray(x) ? x.map((s) => String(s).slice(0, 400)).slice(0, n) : []);
  const clean = personal
    ? { message: String(out.message || '').slice(0, 1200), steps: arr(out.steps, 3), prayer: String(out.prayer || '').slice(0, 500) }
    : { summary: String(out.summary || '').slice(0, 700), context: String(out.context || '').slice(0, 700), understand: arr(out.understand, 4),
        keywords: (Array.isArray(out.keywords) ? out.keywords : []).slice(0, 3).map((k) => ({ word: String(k.word || '').slice(0, 40), meaning: String(k.meaning || '').slice(0, 250) })),
        apply: arr(out.apply, 3), questions: arr(out.questions, 3), prayer: String(out.prayer || '').slice(0, 500) };
  if (!personal && clean.summary) { try { await store.setJSON(id, clean); } catch (e) { /* still answer */ } }
  return Response.json({ ...clean, ref }, { headers: { 'cache-control': personal ? 'no-store' : 'public, max-age=3600' } });
};
export const config = { path: '/api/explain' };
