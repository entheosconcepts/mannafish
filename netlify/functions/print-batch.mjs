// The print batch (Ken, 18 Nov: "go to MannaFish and send the print files from there to myself or download them... for multiple sponsorships at the same time... so I'm not playing the in-between guy").
// Admin only (MF_ADMIN_KEY), except the download links, which carry their own long random token.
//   GET  /api/print-batch?k=KEY                 -> {queue:[{o,n}], letter:{subject,body}|null}     the cards picked for printing, and the saved letter
//   POST {k,op:'queue',items:[{o,n}]}           save the picked cards (order id + card number)
//   POST {k,op:'letter',subject,body}           save the letter to the print company
//   POST {k,op:'part',id,fi,i,data}             one piece (base64, up to about 3 MB) of file fi of upload id (the browser makes each card's zip and sends it in pieces)
//   POST {k,op:'publish',id,title,files:[{name,parts,size}],to:'me'|'company',company:{email,name},subject,body,list}  keep the files for 30 days behind a link, and email the link
//   GET  /api/print-batch?t=TOKEN               -> a plain page listing the files;  &f=N downloads file N
import { getStore } from '@netlify/blobs';
import { sendMail, FROM } from './lib/mail.mjs';
const NS = { 'cache-control': 'no-store' };
const bad = (m, s) => Response.json({ error: m }, { status: s, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const TO = () => process.env.MF_ORDERS_TO || process.env.MF_PROOF_TO || FROM.email;
const db = () => getStore({ name: 'mannafish-printbatch', consistency: 'strong' });
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ').slice(0, n);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/, ID = /^[a-z0-9]{6,24}$/i, DAY = 864e5;
const safeName = (n) => clean(n, 120).replace(/[^\w.\- ()]+/g, '_') || 'file';
const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const para = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
export default async (req) => {
  const url = new URL(req.url), s = db(), origin = url.origin;
  if (req.method === 'GET' && url.searchParams.get('t')) {   // a download link
    const t = url.searchParams.get('t'); if (!/^[0-9a-f]{32}$/.test(t)) return bad('This link is not valid.', 404);
    const m = await s.get('b/' + t, { type: 'json' }); if (!m || (!m.keep && Date.now() - m.at > 30 * DAY)) return bad('This link has expired.', 404);
    const f = url.searchParams.get('f');
    if (f != null) {
      const F = m.files[Number(f)]; if (!F) return bad('No such file', 404);
      const n = F.parts; for (let i = 0; i < n; i++) if ((await s.get(`p/${m.id}/${Number(f)}/${i}`)) == null) return bad('This file is incomplete.', 404);
      let i = 0;   // sent as a stream, a piece at a time (a function's ordinary reply is limited to about 6 MB)
      const body = new ReadableStream({ async pull(c) { if (i >= n) { c.close(); return; } c.enqueue(b64(await s.get(`p/${m.id}/${Number(f)}/${i++}`))); } });
      return new Response(body, { headers: { 'content-type': /\.pdf$/i.test(F.name) ? 'application/pdf' : /\.txt$/i.test(F.name) ? 'text/plain; charset=utf-8' : 'application/zip', 'content-disposition': `attachment; filename="${safeName(F.name)}"`, 'cache-control': 'private, no-store' } });
    }
    return new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>MannaFish print files</title><body style="font:17px/1.6 system-ui,sans-serif;max-width:640px;margin:24px auto;padding:0 16px"><h1 style="font-size:1.4rem">${esc(m.title)}</h1><p>Print files from MannaFish. This link works for 30 days.</p><ul>${m.files.map((F, i) => `<li><a href="?t=${t}&f=${i}">${esc(F.name)}</a> (${Math.round(F.size / 1024)} KB)</li>`).join('')}</ul>${m.list ? `<pre style="white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:8px;font:14px/1.5 system-ui">${esc(m.list)}</pre>` : ''}<p style="color:#666;font-size:14px">${esc('MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405')}</p>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store' } });
  }
  if (!KEY()) return bad('Not allowed', 403);
  if (req.method === 'GET') {
    if (url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
    return Response.json({ queue: (await s.get('queue', { type: 'json' })) || [], letter: (await s.get('letter', { type: 'json' })) || null }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.k !== KEY()) return bad('Not allowed', 403);
  if (b.op === 'queue') { const q = (Array.isArray(b.items) ? b.items : []).slice(0, 200).map((x) => ({ o: clean(x.o, 40), n: Math.max(1, Math.min(99, Number(x.n) || 1)) })).filter((x) => x.o); await s.setJSON('queue', q); return Response.json({ ok: true, n: q.length }, { headers: NS }); }
  if (b.op === 'letter') { await s.setJSON('letter', { subject: clean(b.subject, 200), body: clean(b.body, 12000) }); return Response.json({ ok: true }, { headers: NS }); }
  if (b.op === 'part') {
    if (!ID.test(b.id || '') || !(Number(b.fi) >= 0 && Number(b.fi) < 60) || !(Number(b.i) >= 0 && Number(b.i) < 400) || typeof b.data !== 'string' || b.data.length > 4800000) return bad('Bad piece', 400);
    await s.set(`p/${b.id}/${Number(b.fi)}/${Number(b.i)}`, b.data); return Response.json({ ok: true }, { headers: NS });
  }
  if (b.op === 'publish') {
    if (!ID.test(b.id || '')) return bad('Bad id', 400);
    const files = (Array.isArray(b.files) ? b.files : []).slice(0, 60).map((f) => ({ name: safeName(f.name), parts: Number(f.parts) || 0, size: Number(f.size) || 0 }));
    if (!files.length) return bad('No files', 400);
    for (const [fi, f] of files.entries()) for (let i = 0; i < f.parts; i++) if ((await s.get(`p/${b.id}/${fi}/${i}`)) == null) return bad('A file did not finish uploading. Please try again.', 409);
    const t = rand(), title = clean(b.title, 120) || 'MannaFish print files', list = clean(b.list, 6000);
    await s.setJSON('b/' + t, { id: b.id, title, files, list, at: Date.now(), keep: b.to === 'none' });
    const link = `${origin}/api/print-batch?t=${t}`, links = files.map((f, i) => `<li><a href="${esc(link + '&f=' + i)}">${esc(f.name)}</a></li>`).join('');
    const box = `<p><b>Print files</b> (the links work for 30 days):</p><ul>${links}</ul><p>Or see them all on one page: <a href="${esc(link)}">${esc(link)}</a></p>${list ? `<pre style="white-space:pre-wrap;font:14px/1.5 system-ui;background:#f4f4f4;padding:10px;border-radius:8px">${esc(list)}</pre>` : ''}`;
    const text = (h) => h.replace(/<br>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '');
    if (b.to === 'none') return Response.json({ ok: true, link, token: t, files: files.map((f, i) => ({ name: f.name, size: f.size, token: t, i })) }, { headers: NS });   // kept for the history, no email
    try {
      if (b.to === 'company') {
        const em = clean(b.company && b.company.email, 120).toLowerCase(); if (!EMAIL.test(em)) return bad('Please add the email address of the print company.', 400);
        const html = `<div style="font:16px/1.55 Georgia,serif;color:#1c2228;max-width:36rem">${para(clean(b.body, 12000))}${box}</div>`;
        await sendMail({ to: em, name: clean(b.company && b.company.name, 80), subject: clean(b.subject, 200) || title, html, text: text(html), tag: 'print', replyTo: { email: TO() } });
        await sendMail({ to: TO(), subject: 'Copy: ' + (clean(b.subject, 200) || title), html: `<p>This was sent to ${esc(em)}:</p>${html}`, text: text(html), tag: 'print' });
      } else {
        const html = `<div style="font:16px/1.55 Georgia,serif;color:#1c2228;max-width:36rem"><p>${esc(title)}</p>${box}</div>`;
        await sendMail({ to: TO(), subject: 'MannaFish print files: ' + title, html, text: text(html), tag: 'print' });
      }
    } catch (e) { return bad('The email could not be sent just now. The files are saved: ' + link, 502); }
    return Response.json({ ok: true, link }, { headers: NS });
  }
  return bad('Which action?', 400);
};
export const config = { path: '/api/print-batch' };
