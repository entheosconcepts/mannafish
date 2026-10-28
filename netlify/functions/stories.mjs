// Manna…Fish Stories (Ken, 12 Oct): "a section where people can share their catch -- video, audio or written fish stories".
// Every story waits for MannaFish to read, hear or watch it first; only approved stories are shown on the site.
//   GET  /api/stories                          -> {stories:[...]}   the approved ones, newest first (no emails)
//   POST /api/stories {kind,title,text,name,word,lang,email,consent}  -> {id, tok}
//        written stories are ready at once; audio and video then upload in parts:
//   PUT  /api/stories/part?id=&tok=&n=         body: up to 3 MB of the recording (n = 0, 1, 2 ...)
//   POST /api/stories/done {id,tok,parts,mime,dur}   -> {ok}   (MannaFish gets an email: a story is waiting)
//   GET  /api/stories/media?id=[&k=]           -> the recording, in byte ranges (phones play video this way)
//   GET  /api/stories/admin?k=                  -> every story, waiting ones too (k = MF_ADMIN_KEY, or PROOF_KEY)
//   POST /api/stories/admin {k,id,action: approve|hide|delete, title?, text?, name?}
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status) => Response.json({ error: msg }, { status });
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_STORIES_TO || process.env.MF_PROOF_TO || FROM.email;
const PART = 3 * 1024 * 1024, MAXPARTS = { audio: 8, video: 20 };          // audio up to 24 MB, video up to 60 MB
const MIMES = { audio: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/wav'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'] };
const LANGS = ['en', 'es', 'tl', 'zh', 'hi', 'el', 'de', 'ko', 'he', 'ar', 'ru'];
const db = () => getStore({ name: 'mannafish-stories', consistency: 'strong' });
const media = () => getStore({ name: 'mannafish-stories-media', consistency: 'strong' });
const rid = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const pub = (r) => ({ id: r.id, kind: r.kind, title: r.title, text: r.text, name: r.name, word: r.word, lang: r.lang, at: r.at, mime: r.mime || '', size: r.size || 0, dur: r.dur || 0 });

async function limited(ip, what, max) {
  try {
    const s = getStore('mannafish-limits'), k = `story-${what}/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0;
    if (n >= max) return true;
    await s.set(k, String(n + 1));
  } catch (e) { /* a counter failure never blocks a story */ }
  return false;
}
async function all() {
  const s = db(), { blobs } = await s.list({ prefix: 's/' });
  const recs = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })));
  return recs.filter(Boolean).sort((a, b) => (a.at < b.at ? 1 : -1));
}
async function notify(r) {
  if (!hasMail()) return;
  const site = process.env.URL || 'https://manna-fish.com';
  const kind = { text: 'written', audio: 'audio', video: 'video' }[r.kind];
  try {
    await sendMail({ to: TO(), name: 'MannaFish', tag: 'story', subject: `New fish story waiting (${kind}): ${r.title || r.text.slice(0, 50) || 'untitled'}`,
      text: `A ${kind} fish story is waiting for you to look at it.\n\n${r.title}\n${r.text}\n\nFrom: ${r.name || 'not given'}${r.email ? ' <' + r.email + '>' : ''}\n\nApprove or hide it: ${site}/stories/admin/`,
      html: `<p style="font:16px Arial,sans-serif">A <b>${esc(kind)}</b> fish story is waiting for you to look at it.</p>`
        + (r.title ? `<p style="font:bold 18px Georgia,serif">${esc(r.title)}</p>` : '')
        + (r.text ? `<p style="font:16px/1.5 Georgia,serif;white-space:pre-wrap">${esc(r.text)}</p>` : '')
        + `<p style="font:13px Arial,sans-serif;color:#555">From: ${esc(r.name || 'not given')}${r.email ? ' &lt;' + esc(r.email) + '&gt;' : ''}</p>`
        + `<p style="font:16px Arial,sans-serif"><a href="${site}/stories/admin/">Approve or hide it</a></p>` });
  } catch (e) { console.log('story email failed', String(e).slice(0, 200)); }
}

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/stories\/?/, ''), q = url.searchParams;
  const s = db(), m = media();

  // ── the approved stories
  if (sub === '' && req.method === 'GET') {
    const list = (await all()).filter((r) => r.status === 'approved').slice(0, 200).map(pub);
    return Response.json({ stories: list }, { headers: { 'cache-control': 'public, max-age=60' } });
  }

  // ── a recording, a part at a time (video players ask for byte ranges)
  if (sub === 'media' && req.method === 'GET') {
    const r = await s.get('s/' + clean(q.get('id'), 40), { type: 'json' });
    const admin = KEY() && q.get('k') === KEY();
    if (!r || !r.parts || (r.status !== 'approved' && !admin)) return bad('Not found', 404);
    const sizes = r.sizes, total = r.size;
    let a = 0, z = total - 1, ranged = false;
    const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
    if (rg) { ranged = true; if (rg[1] === '') { a = Math.max(0, total - Number(rg[2])); } else { a = Number(rg[1]); if (rg[2] !== '') z = Math.min(z, Number(rg[2])); } }
    if (a >= total || a > z) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
    // one stored part per answer at most (keeps every answer small); the player simply asks for the next range
    let off = 0, i = 0; while (i < sizes.length && off + sizes[i] <= a) { off += sizes[i]; i++; }
    z = Math.min(z, off + sizes[i] - 1);
    if (!ranged && z < total - 1) ranged = true;
    const buf = await m.get(`${r.id}/${i}`, { type: 'arrayBuffer' });
    if (!buf) return bad('Not found', 404);
    const body = new Uint8Array(buf).subarray(a - off, z - off + 1);
    const h = { 'content-type': r.mime, 'accept-ranges': 'bytes', 'content-length': String(body.length), 'x-content-type-options': 'nosniff',
      'cache-control': admin ? 'private, no-store' : 'private, max-age=3600', vary: 'range' };   // never a shared cache: each answer is one range
    if (ranged) h['content-range'] = `bytes ${a}-${z}/${total}`;
    return new Response(body, { status: ranged ? 206 : 200, headers: h });
  }

  // ── MannaFish's review
  if (sub === 'admin') {
    if (req.method === 'GET') {
      if (!KEY() || q.get('k') !== KEY()) return bad('Not allowed', 403);
      return Response.json({ stories: (await all()).filter((r) => r.status !== 'uploading') }, { headers: { 'cache-control': 'no-store' } });
    }
    if (req.method !== 'POST') return bad('Not allowed', 405);
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
    const id = clean(b.id, 40), r = await s.get('s/' + id, { type: 'json' });
    if (!r) return bad('Not found', 404);
    if (b.action === 'delete') {
      for (let i = 0; i < (r.parts || 0); i++) await m.delete(`${id}/${i}`);
      await s.delete('s/' + id); return Response.json({ ok: true });
    }
    if (b.title != null) r.title = clean(b.title, 140);
    if (b.text != null) r.text = clean(b.text, 4000);
    if (b.name != null) r.name = clean(b.name, 60);
    if (b.action === 'approve') { r.status = 'approved'; r.approvedAt = new Date().toISOString(); }
    else if (b.action === 'hide') r.status = 'hidden';
    await s.setJSON('s/' + id, r);
    return Response.json({ ok: true, story: r });
  }

  // everything below is the site's own share form
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);

  // ── a new story
  if (sub === '' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    if (b.website) return Response.json({ id: 'x', tok: 'x' });          // a robot filled the hidden field
    const kind = ['text', 'audio', 'video'].includes(b.kind) ? b.kind : null;
    if (!kind) return bad('Which kind of story?', 400);
    if (b.consent !== true) return bad('Please agree to share your story', 400);
    const r = { id: Date.now().toString(36) + rid(6), tok: rid(16), kind, status: kind === 'text' ? 'pending' : 'uploading',
      title: clean(b.title, 140), text: clean(b.text, 4000), name: clean(b.name, 60), word: clean(b.word, 40),
      lang: LANGS.includes(b.lang) ? b.lang : 'en', email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email || '').trim()) ? String(b.email).trim().slice(0, 160) : '',
      at: new Date().toISOString() };
    if (kind === 'text' && r.text.length < 10) return bad('Please write your story', 400);
    if (await limited(context && context.ip, 'new', 8)) return bad('Please wait a little', 429);
    await s.setJSON('s/' + r.id, r);
    if (kind === 'text') await notify(r);
    return Response.json({ id: r.id, tok: r.tok });
  }

  // ── a part of a recording
  if (sub === 'part' && req.method === 'PUT') {
    const r = await s.get('s/' + clean(q.get('id'), 40), { type: 'json' }), n = Number(q.get('n'));
    if (!r || r.tok !== q.get('tok') || r.status !== 'uploading') return bad('Not allowed', 403);
    if (!Number.isInteger(n) || n < 0 || n >= MAXPARTS[r.kind]) return bad('Too long', 413);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > PART) return bad('Part too large', 413);
    await m.set(`${r.id}/${n}`, buf, { metadata: { size: buf.byteLength } });
    return Response.json({ ok: true });
  }

  // ── the recording is all there: it waits for review
  if (sub === 'done' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
    const r = await s.get('s/' + clean(b.id, 40), { type: 'json' });
    if (!r || r.tok !== b.tok || r.status !== 'uploading') return bad('Not allowed', 403);
    const parts = Number(b.parts), mime = String(b.mime || '').split(';')[0].trim().toLowerCase();
    if (!Number.isInteger(parts) || parts < 1 || parts > MAXPARTS[r.kind]) return bad('Bad recording', 400);
    if (!MIMES[r.kind].includes(mime)) return bad('That kind of file can’t be shared here', 415);
    const sizes = [];
    for (let i = 0; i < parts; i++) {
      const md = await m.getMetadata(`${r.id}/${i}`);
      if (!md) return bad('Part ' + i + ' is missing', 400);
      sizes.push(Number(md.metadata && md.metadata.size) || 0);
    }
    Object.assign(r, { status: 'pending', parts, sizes, size: sizes.reduce((x, y) => x + y, 0), mime: mime === 'video/quicktime' ? 'video/mp4' : mime,
      dur: Math.max(0, Math.min(3600, Math.round(Number(b.dur) || 0))) });
    await s.setJSON('s/' + r.id, r);
    await notify(r);
    return Response.json({ ok: true });
  }
  return bad('Not found', 404);
};
export const config = { path: ['/api/stories', '/api/stories/*'] };
