// Proofreading the fish (Ken, 11 Oct): "Suggest a fix" on /proof/ -- anyone with the link can send a correction for
// one numbered fish (e.g. 14C) without signing in. Each one is saved and emailed to MannaFish.
//   POST /api/proof-fix {n, word, lang, fix, name}  -> {ok}
//   GET  /api/proof-fix?k=<PROOF_KEY>               -> every suggestion so far (only when PROOF_KEY is set in Netlify)
import { getStore } from '@netlify/blobs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status) => Response.json({ error: msg }, { status });
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TO = () => process.env.MF_PROOF_TO || FROM.email;
async function limited(ip) {
  try {
    const s = getStore('mannafish-limits'), k = `proof/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`;
    const n = Number(await s.get(k)) || 0;
    if (n >= 60) return true;
    await s.set(k, String(n + 1));
  } catch (e) { /* a counter failure never blocks a correction */ }
  return false;
}
export default async (req, context) => {
  const store = getStore('mannafish-proof');
  if (req.method === 'GET') {
    const k = new URL(req.url).searchParams.get('k');
    if (!process.env.PROOF_KEY || k !== process.env.PROOF_KEY) return bad('Not allowed', 403);
    const { blobs } = await store.list({ prefix: 'fix/' });
    const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
    return Response.json(all.filter(Boolean).sort((a, b) => (a.at < b.at ? -1 : 1)));
  }
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.website) return Response.json({ ok: true });   // a robot filled the hidden field
  const n = String(b.n || '').toUpperCase().slice(0, 4), fix = String(b.fix || '').trim().slice(0, 2000);
  if (!/^\d{1,2}[A-I]$/.test(n)) return bad('Which fish?', 400);
  if (!fix) return bad('Please write the correction', 400);
  if (await limited(context && context.ip)) return bad('Please wait a little', 429);
  const rec = { n, word: String(b.word || '').slice(0, 80), lang: String(b.lang || '').slice(0, 40), fix, name: String(b.name || '').trim().slice(0, 120), via: String(b.via || '').slice(0, 40), at: new Date().toISOString() };
  await store.setJSON(`fix/${rec.at}-${n}-${Math.random().toString(36).slice(2, 7)}`, rec);
  if (hasMail()) {
    try {
      await sendMail({ to: TO(), name: 'MannaFish', subject: `Fish ${n} correction: ${rec.word} (${rec.lang})${/^native/.test(rec.via) ? ' · native speaker' : ''}`, tag: 'proof',
        text: `Fish ${n} — ${rec.word} (${rec.lang})\n\n${fix}\n\nFrom: ${rec.name || 'not given'}${rec.via ? ' (' + rec.via + ')' : ''}\n${rec.at}`,
        html: `<p style="font:16px Arial,sans-serif"><b>Fish ${esc(n)}</b> — ${esc(rec.word)} (${esc(rec.lang)})</p><p style="font:16px/1.5 Georgia,serif;white-space:pre-wrap">${esc(fix)}</p><p style="font:13px Arial,sans-serif;color:#555">From: ${esc(rec.name || 'not given')}${rec.via ? ' (' + esc(rec.via) + ')' : ''} · ${esc(rec.at)}</p>` });
    } catch (e) { console.log('proof email failed', String(e).slice(0, 200)); }
  }
  return Response.json({ ok: true });
};
export const config = { path: '/api/proof-fix' };
