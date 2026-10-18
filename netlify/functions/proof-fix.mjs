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
    const { blobs } = await store.list({ prefix: new URL(req.url).searchParams.get('edits') ? 'edits/' : 'fix/' });   // ?edits=1: the edit sheet's batches
    const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
    return Response.json(all.filter(Boolean).sort((a, b) => (a.at < b.at ? -1 : 1)));
  }
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.website) return Response.json({ ok: true });   // a robot filled the hidden field
  // Ken, 16 Oct: the master edit sheet (/edit/) sends every change at once -- one record, one email
  if (Array.isArray(b.batch)) {
    const FIELD = { word: 'Word', top: 'Verse line 1', bot: 'Verse line 2', ref: 'Reference', gkm: 'Greek meaning', hbm: 'Hebrew meaning', design: 'Word in the middle: design fixes', dnote: 'Design note', layout: 'Word in the middle: size and position', template: 'Template (a good example)', vlayout: 'Verse lines: size and position' };
    const items = b.batch.slice(0, 1500).map((x) => ({ n: String(x.n || '').toUpperCase().slice(0, 4), lang: String(x.lang || '').slice(0, 40), en: String(x.en || '').slice(0, 40),
      field: FIELD[x.field] ? x.field : '', was: String(x.was == null ? '' : x.was).slice(0, 600), now: String(x.now == null ? '' : x.now).slice(0, 600) }))
      .filter((x) => /^(\d{1,2}[A-J]|W\d\d[A-E]|D\d{3})$/.test(x.n) && x.field && x.was !== x.now);   // W01A: the new fish, D001: the daily fish (/edit/)
    if (!items.length) return bad('No changes to send', 400);
    if (await limited(context && context.ip)) return bad('Please wait a little', 429);
    const rec = { batch: items, name: String(b.name || '').trim().slice(0, 120), note: String(b.note || '').trim().slice(0, 2000), at: new Date().toISOString() };
    await store.setJSON(`edits/${rec.at}-${Math.random().toString(36).slice(2, 7)}`, rec);
    const line = (x) => `${x.n} · ${x.en} · ${x.lang} · ${FIELD[x.field]}\n   was: ${x.was}\n   now: ${x.now}`;
    const text = `MannaFish edits: ${items.length} change${items.length === 1 ? '' : 's'}${rec.name ? ' from ' + rec.name : ''}\n${rec.note ? '\nNote: ' + rec.note + '\n' : ''}\n${items.map(line).join('\n\n')}\n\n${rec.at}`;
    if (hasMail()) {
      try {
        await sendMail({ to: TO(), name: 'MannaFish', subject: `MannaFish edits: ${items.length} change${items.length === 1 ? '' : 's'}${rec.name ? ' from ' + rec.name : ''}`, tag: 'proof', text,
          html: `<p style="font:16px Arial,sans-serif"><b>${items.length} change${items.length === 1 ? '' : 's'}</b>${rec.name ? ' from ' + esc(rec.name) : ''}</p>${rec.note ? '<p style="font:15px Georgia,serif">' + esc(rec.note) + '</p>' : ''}`
            + items.map((x) => `<p style="font:15px/1.5 Arial,sans-serif;margin:14px 0"><b>${esc(x.n)}</b> · ${esc(x.en)} · ${esc(x.lang)} · ${esc(FIELD[x.field])}<br><span style="color:#888">was:</span> ${esc(x.was)}<br><span style="color:#2a5fb0">now:</span> <b>${esc(x.now)}</b></p>`).join('')
            + `<p style="font:13px Arial,sans-serif;color:#555">Paste this email to Claude to put the changes on the site. ${esc(rec.at)}</p>` });
      } catch (e) { console.log('edits email failed', String(e).slice(0, 200)); }
    }
    return Response.json({ ok: true, n: items.length });
  }
  const n = String(b.n || '').toUpperCase().slice(0, 4), fix = String(b.fix || '').trim().slice(0, 2000);
  if (!/^\d{1,2}[A-J]$/.test(n)) return bad('Which fish?', 400);
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
