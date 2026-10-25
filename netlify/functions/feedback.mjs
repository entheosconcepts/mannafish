// "Tell us what you think" (Ken, 25 Oct: before launch, a simple way for the first readers to say what they like, what confused them,
// and what they would change). Every page's ••• has it (fish-lang/feedback.js), and the devotional email links to it.
//   POST /api/feedback {mood, text, name, email, page, lang}  -> {ok}
//   kept here (Netlify Blobs, mannafish-feedback) and emailed to MannaFish (MF_FEEDBACK_TO, else the site's own address)
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (msg, status) => Response.json({ ok: false, error: msg }, { status });
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const TO = () => process.env.MF_FEEDBACK_TO || process.env.MF_STORIES_TO || FROM.email;
const MOODS = { love: '😊 Love it', good: '🙂 Good', confused: '😕 Confusing', broken: '🐞 Something is broken' };

async function limited(ip) {
  try {
    const s = getStore('mannafish-limits'), k = `feedback/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0; if (n >= 10) return true; await s.set(k, String(n + 1));
  } catch (e) { /* a counter failure never blocks feedback */ }
  return false;
}

export default async (req, context) => {
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.hp) return Response.json({ ok: true });                     // a robot filled the hidden field
  const r = { at: new Date().toISOString(), mood: MOODS[b.mood] ? b.mood : '', text: clean(b.text, 3000), name: clean(b.name, 80), email: clean(b.email, 160),
    page: clean(b.page, 200), lang: clean(b.lang, 5), ua: clean(req.headers.get('user-agent'), 200) };
  if (!r.text && !r.mood) return bad('Tell us a little first', 400);
  if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) r.email = '';
  if (await limited(context && context.ip)) return bad('Please wait a little', 429);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  try { await getStore({ name: 'mannafish-feedback', consistency: 'strong' }).setJSON('f/' + id, r); } catch (e) { console.log('feedback not kept', String(e).slice(0, 160)); }
  if (hasMail()) {
    const who = (r.name || 'Someone') + (r.email ? ' <' + r.email + '>' : '');
    try {
      await sendMail({ to: TO(), name: 'MannaFish', tag: 'feedback', subject: `💬 Feedback${r.mood ? ': ' + MOODS[r.mood] : ''}${r.name ? ' from ' + r.name : ''}`,
        text: `${who} on ${r.page || 'the site'}:\n\n${r.mood ? MOODS[r.mood] + '\n\n' : ''}${r.text}\n\n${r.ua}`,
        html: `<p style="font:15px Arial,sans-serif;color:#555">${esc(who)} on <b>${esc(r.page || 'the site')}</b></p>`
          + (r.mood ? `<p style="font:18px Arial,sans-serif">${esc(MOODS[r.mood])}</p>` : '')
          + `<p style="font:17px/1.5 Georgia,serif;white-space:pre-wrap">${esc(r.text)}</p><p style="font:12px Arial,sans-serif;color:#999">${esc(r.ua)}</p>` });
    } catch (e) { console.log('feedback email failed', String(e).slice(0, 200)); }
  }
  return Response.json({ ok: true });
};
export const config = { path: '/api/feedback' };
