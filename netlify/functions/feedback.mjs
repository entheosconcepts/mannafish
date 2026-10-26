// "Tell us what you think" (Ken, 25 Oct), and the testers' feedback for the tweak launch (Ken, 26 Oct: "easy for everyone to click a
// button and audio record changes needed, suggestions, bugs, thoughts about each feature"). Every page's ••• has it, the devotional
// email links to it, and testers (a ?tester=1 link) get a 🎙 button on every page (fish-lang/feedback.js).
//   POST /api/feedback {kind, feature, fish, text, name, email, page, lang, audio:{b64,mime,sec}, image:{b64,mime}}  -> {ok, id}
//        kept here (Netlify Blobs: mannafish-feedback, the recordings and pictures in mannafish-feedback-media); a voice note is written
//        out as text (OpenAI, when OPENAI_API_KEY is set); then emailed to MannaFish (MF_FEEDBACK_TO, else the site's own address)
//   GET  /api/feedback/media?id=&t=&w=a|i   -> the voice note or the picture (t: the private token in the email)
//   GET  /api/feedback/admin?k=             -> every one, newest first (k = MF_ADMIN_KEY, or PROOF_KEY)
//   POST /api/feedback/admin {k, id, done}  -> mark one done (or not)
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (msg, status) => Response.json({ ok: false, error: msg }, { status });
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const rid = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
const TO = () => process.env.MF_FEEDBACK_TO || process.env.MF_STORIES_TO || FROM.email;
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const db = () => getStore({ name: 'mannafish-feedback', consistency: 'strong' });
const media = () => getStore({ name: 'mannafish-feedback-media', consistency: 'strong' });
const KINDS = { bug: '🐞 Bug', idea: '💡 Idea', design: '🎨 Fish design', thought: '💭 Thought', love: '❤️ Love it',
  good: '🙂 Good', confused: '😕 Confusing', broken: '🐞 Something is broken' };   // the last three: the first version's faces
const AUD = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/wav'], IMG = ['image/jpeg', 'image/png', 'image/webp'];
const EXT = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/aac': 'm4a', 'audio/x-m4a': 'm4a', 'audio/wav': 'wav' };

async function limited(ip) {
  try {
    const s = getStore('mannafish-limits'), k = `feedback/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0; if (n >= 30) return true; await s.set(k, String(n + 1));
  } catch (e) { /* a counter failure never blocks feedback */ }
  return false;
}
function b64(x, types, max) {
  if (!x || !x.b64) return null; const mime = String(x.mime || '').split(';')[0].trim().toLowerCase();
  if (!types.includes(mime)) return null; const buf = Buffer.from(String(x.b64), 'base64');
  return buf.length && buf.length <= max ? { buf, mime } : null;
}
// a voice note, written out (the same speech service as the translator)
async function heard(a) {
  const key = process.env.OPENAI_TRANSLATE_KEY || process.env.OPENAI_API_KEY; if (!key || !a) return '';
  try {
    const fd = new FormData(); fd.append('file', new Blob([a.buf], { type: a.mime }), 'note.' + (EXT[a.mime] || 'webm'));
    fd.append('model', process.env.MF_HEAR_MODEL || 'gpt-4o-mini-transcribe');
    fd.append('prompt', 'Feedback about the MannaFish website: the devotional, the fish, the Bible, Time with God, the game, decals.');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: 'Bearer ' + key }, body: fd });
    if (!r.ok) return ''; return String((await r.json()).text || '').trim();
  } catch (e) { return ''; }
}
async function tell(r) {
  if (!hasMail()) return;
  const site = process.env.URL || 'https://manna-fish.com', who = (r.name || 'Someone') + (r.email ? ' <' + r.email + '>' : '');
  const m = (w) => `${site}/api/feedback/media?id=${r.id}&t=${r.tok}&w=${w}`, head = [KINDS[r.kind], r.feature, r.fish].filter(Boolean).join(' · ');
  try {
    await sendMail({ to: TO(), name: 'MannaFish', tag: 'feedback', subject: `💬 ${r.tester ? 'Tester' : 'Feedback'}${head ? ': ' + head : ''}${r.name ? ' — ' + r.name : ''}`,
      text: `${who} on ${r.page || 'the site'}\n${head}\n\n${r.text || ''}${r.heard ? '\n\nVoice note: ' + r.heard : ''}${r.audio ? '\nListen: ' + m('a') : ''}${r.image ? '\nPicture: ' + m('i') : ''}\n\nAll feedback: ${site}/feedback/admin/\n${r.ua}`,
      html: `<p style="font:15px Arial,sans-serif;color:#555">${esc(who)} on <a href="${esc(site + (r.page || '/'))}">${esc(r.page || 'the site')}</a></p>`
        + (head ? `<p style="font:18px Arial,sans-serif"><b>${esc(head)}</b></p>` : '')
        + (r.text ? `<p style="font:17px/1.5 Georgia,serif;white-space:pre-wrap">${esc(r.text)}</p>` : '')
        + (r.audio ? `<p style="font:16px/1.5 Georgia,serif"><a href="${m('a')}">▶ Listen to the voice note</a> (${r.audio.sec || '?'} s)${r.heard ? `<br><i>“${esc(r.heard)}”</i>` : ''}</p>` : '')
        + (r.image ? `<p><a href="${m('i')}"><img src="${m('i')}" alt="Picture" style="max-width:100%;border-radius:8px"></a></p>` : '')
        + `<p style="font:14px Arial,sans-serif"><a href="${site}/feedback/admin/">All feedback</a></p><p style="font:12px Arial,sans-serif;color:#999">${esc(r.ua)}</p>` });
  } catch (e) { console.log('feedback email failed', String(e).slice(0, 200)); }
}

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/feedback\/?/, '');
  if (sub === 'media') {
    const r = await db().get('f/' + clean(url.searchParams.get('id'), 40), { type: 'json' });
    const w = url.searchParams.get('w') === 'i' ? 'image' : 'audio', t = url.searchParams.get('t') || '', k = url.searchParams.get('k') || '';
    if (!r || !r[w] || !(t === r.tok || (KEY() && k === KEY()))) return bad('Not found', 404);
    const buf = await media().get(r.id + '/' + (w === 'image' ? 'i' : 'a'), { type: 'arrayBuffer' }); if (!buf) return bad('Not found', 404);
    return new Response(buf, { headers: { 'content-type': r[w].mime, 'cache-control': 'private, max-age=86400' } });
  }
  if (sub === 'admin') {
    if (req.method === 'GET') {
      if (!KEY() || url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
      const s = db(), { blobs } = await s.list({ prefix: 'f/' }), out = [];
      for (const b of blobs) { const r = await s.get(b.key, { type: 'json' }); if (r) out.push(r); }
      out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
      return Response.json({ items: out.slice(0, 500) }, { headers: { 'cache-control': 'no-store' } });
    }
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
    const s = db(), r = await s.get('f/' + clean(b.id, 40), { type: 'json' }); if (!r) return bad('Not found', 404);
    r.done = !!b.done; await s.setJSON('f/' + r.id, r); return Response.json({ ok: true });
  }
  if (req.method !== 'POST' || sub) return bad('Not found', 404);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('That was too big to send. Try a shorter voice note.', 413); }
  if (b.hp) return Response.json({ ok: true });                     // a robot filled the hidden field
  const a = b64(b.audio, AUD, 4.5 * 1024 * 1024), im = b64(b.image, IMG, 2.5 * 1024 * 1024);
  const r = { id: Date.now().toString(36) + rid(3), tok: rid(12), at: new Date().toISOString(), kind: KINDS[b.kind || b.mood] ? (b.kind || b.mood) : '',
    feature: clean(b.feature, 40), fish: clean(b.fish, 80), text: clean(b.text, 3000), name: clean(b.name, 80), email: clean(b.email, 160),
    page: clean(b.page, 200), lang: clean(b.lang, 5), tester: !!b.tester, ua: clean(req.headers.get('user-agent'), 200), done: false,
    audio: a ? { mime: a.mime, sec: Math.max(0, Math.min(600, parseInt(b.audio.sec, 10) || 0)) } : null, image: im ? { mime: im.mime } : null, heard: '' };
  if (!r.text && !r.kind && !a && !im) return bad('Tell us a little first', 400);
  if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) r.email = '';
  if (await limited(context && context.ip)) return bad('Please wait a little', 429);
  if (a) await media().set(r.id + '/a', a.buf);
  if (im) await media().set(r.id + '/i', im.buf);
  await db().setJSON('f/' + r.id, r);
  // the voice note is written out and the email sent after the answer, so the tester is not kept waiting
  const after = (async () => { if (a) { r.heard = await heard(a); if (r.heard) await db().setJSON('f/' + r.id, r); } await tell(r); })();
  if (context && context.waitUntil) context.waitUntil(after); else await after;
  return Response.json({ ok: true, id: r.id });
};
export const config = { path: ['/api/feedback', '/api/feedback/*'] };
