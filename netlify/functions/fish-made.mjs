// A fish someone made from a verse ("Make it a MannaFish") is reported to Ken (Ken, 12 Nov: "make sure when a user does that I get a notification of the
// fish design they made and a screenshot, to approve or ban inappropriate designs under my brand").
//   POST /api/fish-made {word, top, bot, ref, tag, verse, png: 'data:image/png;base64,...', email?, id?}  -> {ok, flagged}
//   GET  /api/fish-made?img=<id>                                  -> the picture (the link inside Ken's email)
// Every report is kept (blob mannafish-madefish, m/<id>) and emailed to Ken with the picture. It is marked CHECK when
//   - the words on the fish are not the words of the verse (the KJV on the server is the judge, so only Scripture can ride on a fish), or
//   - OpenAI's free moderation check flags the text, or
//   - the reference does not name a real verse.
// The phone also refuses to keep or share a fish whose words are not from its verse (fish-lang/makefish.js), so this is the second lock.
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';
import { verseText, norm } from './lib/kjvlib.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const okRef = (r) => { try { return okOrigin(new URL(r).origin); } catch (e) { return false; } };
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TO = () => process.env.MF_FISH_TO || process.env.MF_STORIES_TO || process.env.MF_PROOF_TO || FROM.email;
const SITE = (req) => { try { const u = new URL(req.url); return u.origin; } catch (e) { return 'https://manna-fish.com'; } };
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
async function limited(ip, max) {
  try { const s = getStore('mannafish-limits'), k = `fm/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0; if (n >= max) return true; await s.set(k, String(n + 1)); } catch (e) { /* never block */ }
  return false;
}
// the words on a fish (the two curves; "..." marks where the verse is cut) must be in the verse, in order
export function fromVerse(f, real) {
  const v = norm(real); if (!v) return { ok: false, why: 'the reference is not a verse in the KJV' };
  const parts = [f.top, f.bot].map((x) => norm(String(x || '').replace(/\.{2,}|…/g, ' '))).filter(Boolean);
  let from = 0;
  for (const p of parts) { const i = v.indexOf(p, from); if (i < 0) return { ok: false, why: 'the words on the fish are not the words of the verse' }; from = i + p.length; }
  const w = norm(f.word); if (w && !(' ' + v + ' ').includes(' ' + w + ' ') && !new RegExp('(^| )' + w.replace(/[^a-z0-9\' ]/g, '') + '(s|es|ed|ing|eth|est)?( |$)').test(v)) return { ok: false, why: 'the middle word is not in the verse' };
  return { ok: true };
}
async function moderate(text) {
  const key = process.env.OPENAI_API_KEY; if (!key) return null;
  try { const r = await fetch('https://api.openai.com/v1/moderations', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ model: 'omni-moderation-latest', input: text }) });
    if (!r.ok) return null; const j = await r.json(); const x = j.results && j.results[0]; return x ? { flagged: !!x.flagged, cats: Object.keys(x.categories || {}).filter((k) => x.categories[k]) } : null; } catch (e) { return null; }
}
export default async (req, context) => {
  const url = new URL(req.url), s = getStore('mannafish-madefish');
  if (req.method === 'GET') {
    const id = (url.searchParams.get('img') || '').replace(/[^a-f0-9]/g, '').slice(0, 20); if (!id) return new Response('No', { status: 404 });
    const png = await s.get('p/' + id, { type: 'arrayBuffer' }); if (!png) return new Response('Not found', { status: 404 });
    return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'private, max-age=86400' } });
  }
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  if (!(okOrigin(req.headers.get('origin')) || okRef(req.headers.get('referer')))) return Response.json({ error: 'Not allowed' }, { status: 403 });
  let b; try { b = await req.json(); } catch (e) { return Response.json({ error: 'Bad request' }, { status: 400 }); }
  if (b.hp) return Response.json({ ok: true });
  const ip = context && context.ip;
  if (await limited(ip, 30)) return Response.json({ error: 'Please wait a little' }, { status: 429 });
  const f = { word: clean(b.word, 40), top: clean(b.top, 200), bot: clean(b.bot, 200), ref: clean(b.ref, 60), tag: clean(b.tag, 20), verse: clean(b.verse, 600) };
  if (!f.word) return Response.json({ error: 'Word' }, { status: 400 });
  const real = verseText(f.ref), kjv = !f.tag || /KJV/i.test(f.tag);
  const chk = kjv ? fromVerse(f, real) : { ok: true, other: true };
  const mod = await moderate([f.word, f.top, f.bot].join(' · '));
  const flagged = !chk.ok || !!(mod && mod.flagged);
  const id = rid(), by = clean(b.email, 120), rec = { id, ...f, by, flagged, why: [!chk.ok ? chk.why : '', mod && mod.flagged ? 'flagged by the moderation check: ' + mod.cats.join(', ') : '', chk.other ? 'another Bible version, words not checked' : ''].filter(Boolean), at: new Date().toISOString() };
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.png || ''));
  if (m && m[1].length < 700000) { try { await s.set('p/' + id, Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0))); rec.pic = true; } catch (e) { /* the record still goes */ } }
  await s.setJSON('m/' + id, rec);
  if (hasMail()) {
    const site = SITE(req), img = rec.pic ? `${site}/api/fish-made?img=${id}` : '';
    try { await sendMail({ to: TO(), subject: (flagged ? '⚠️ CHECK: ' : '') + `A MannaFish was made: ${f.word}${f.ref ? ' (' + f.ref + ')' : ''}`,
      html: `<div style="font:15px/1.5 Arial,sans-serif;color:#111">${flagged ? `<p style="background:#fdecea;border:1px solid #e5736a;padding:8px 10px;border-radius:8px"><b>Please check this one:</b> ${esc(rec.why.join('; '))}.</p>` : ''}`
        + (img ? `<p><img src="${img}" alt="${esc(f.word)}" style="max-width:100%;width:560px;background:#000;border-radius:8px"></p>` : '')
        + `<p><b>${esc(f.word)}</b> · ${esc(f.ref)}${f.tag ? ' ' + esc(f.tag) : ''}</p><p>On the fish: “${esc(f.top)}” … “${esc(f.bot)}”</p>${real ? `<p style="color:#555">The verse: ${esc(real)}</p>` : ''}`
        + `<p style="color:#555">Made by: ${esc(by || 'someone not signed in')}${ip ? ' · ' + esc(String(ip).split('.').slice(0, 2).join('.') + '.x.x') : ''}</p><p style="color:#888;font-size:12px">Fish id ${id}. Kept in the Blobs store mannafish-madefish.</p></div>`,
      text: `${flagged ? 'CHECK: ' + rec.why.join('; ') + '\n' : ''}A MannaFish was made: ${f.word} (${f.ref}). On the fish: "${f.top}" ... "${f.bot}". By ${by || 'someone not signed in'}. Picture: ${img}`, tag: 'fish-made' }); } catch (e) { console.log('fish-made mail failed', String(e).slice(0, 160)); }
  }
  return Response.json({ ok: true, flagged }, { headers: { 'cache-control': 'no-store' } });
};
export const config = { path: '/api/fish-made' };
