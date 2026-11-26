// Send a finished greeting card by email (Ken, 26 Nov: "send it to themselves or email it to someone else"). The card is a 2-page PDF made
// in the browser; it goes as an attachment from MannaFish with the sender's name, and replies go to the sender.
// A few a day for each person, so it can't be used to spam anyone.
//   POST /api/card-send {to, fromName, fromEmail, note, pdf: base64} -> {ok:true}
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail } from './lib/mail.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status, error) => Response.json({ error: error || 'bad', msg }, { status, headers: { 'cache-control': 'no-store' } });
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const PER_DAY = 6, MAX_PDF = 4200000;
const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const one = (t, n) => String(t || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `cs/${new Date().toISOString().slice(0, 10)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= PER_DAY) return true; await s.set(k, String(n + 1)); } catch (e) { /* never block because the counter failed */ }
  return false;
}
export default async (req, context) => {
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  if (!hasMail()) return bad('Email is not set up yet', 501, 'nomail');
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const to = one(b.to, 200), fromName = one(b.fromName, 60), fromEmail = one(b.fromEmail, 200), note = one(b.note, 400), pdf = String(b.pdf || '').replace(/^data:application\/pdf;base64,/, '');
  if (!EMAIL.test(to)) return bad('That email address does not look right', 400, 'email');
  if (!/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length < 1000 || pdf.length > MAX_PDF) return bad('The card could not be read', 400, 'pdf');
  if (await limited(context && context.ip)) return bad('That is enough cards for today. Please try again tomorrow.', 429, 'busy');
  const who = fromName || 'Someone';
  const html = `<div style="font:16px/1.5 Arial,sans-serif;color:#222;max-width:520px"><p><b>${esc(who)}</b> made you a card with MannaFish.</p>${note ? `<p style="border-left:3px solid #2a5fb0;padding-left:10px">${esc(note)}</p>` : ''}<p>It is attached as a PDF. Open it to read it, or print it on both sides of one sheet (landscape, flip on the short edge) and fold it in half to make a real card.</p><p style="color:#777;font-size:13px">Sent through MannaFish (manna-fish.com). You will not get any other email from us because of this card.</p></div>`;
  try {
    await sendMail({ to, subject: `${who} sent you a card`, html, text: `${who} made you a card with MannaFish. It is attached as a PDF. Print it on both sides of one sheet and fold it in half.${note ? '\n\n' + note : ''}`,
      tag: 'card', replyTo: EMAIL.test(fromEmail) ? { email: fromEmail, name: fromName || undefined } : undefined, attachment: [{ name: 'MannaFish-card.pdf', content: pdf }] });
  } catch (e) { return bad('The email could not be sent just now', 502, 'send'); }
  return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
};
export const config = { path: '/api/card-send' };
