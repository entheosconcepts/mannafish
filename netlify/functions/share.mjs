// Public or private (Ken, 12 Oct): "a section to make these notes public, or to make them private, to be able to share
// them with others ... same as with prayers ... a checkbox to make it public or private at any given time."
// A note or prayer marked Public gets its own link (/s/?id=...) that anyone with the link can open. Unchecking it
// removes the page. Nothing is listed anywhere; only people given the link see it. The key returned on creation is
// kept on the writer's device and is needed to change or remove the page.
//   POST   /api/share            {kind, title, text, word}      -> {id, key}
//   POST   /api/share/update     {id, key, title, text, word}   -> {ok}
//   DELETE /api/share?id=&key=                                   -> {ok}
//   GET    /api/share?id=                                        -> {kind, title, text, word, at, ed}
import { getStore } from '@netlify/blobs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const bad = (msg, status) => Response.json({ error: msg }, { status });
const db = () => getStore({ name: 'mannafish-shares', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);
const rand = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
const KINDS = ['note', 'prayer'];
async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `share/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= 40) return true; await s.set(k, String(n + 1)); } catch (e) { /* never block because the counter failed */ }
  return false;
}
function body(b) { return { title: clean(b.title, 160), text: clean(b.text, 6000), word: clean(b.word, 40) }; }

export default async (req, context) => {
  const url = new URL(req.url), sub = url.pathname.replace(/^\/api\/share\/?/, ''), s = db(), q = url.searchParams;
  if (req.method === 'GET') {
    const id = String(q.get('id') || '');
    if (!/^[0-9a-f]{16}$/.test(id)) return bad('Not found', 404);
    const r = await s.get('s/' + id, { type: 'json' });
    if (!r) return bad('Not found', 404);
    return Response.json({ kind: r.kind, title: r.title, text: r.text, word: r.word, at: r.at, ed: r.ed || null }, { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  }
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  if (req.method === 'DELETE') {
    const id = String(q.get('id') || ''), r = /^[0-9a-f]{16}$/.test(id) && await s.get('s/' + id, { type: 'json' });
    if (!r) return Response.json({ ok: true });
    if (r.key !== q.get('key')) return bad('Not allowed', 403);
    await s.delete('s/' + id); return Response.json({ ok: true });
  }
  if (req.method !== 'POST') return bad('Not allowed', 405);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (sub === 'update') {
    const id = String(b.id || ''), r = /^[0-9a-f]{16}$/.test(id) && await s.get('s/' + id, { type: 'json' });
    if (!r) return bad('Not found', 404);
    if (r.key !== b.key) return bad('Not allowed', 403);
    const x = body(b); if (!x.text && !x.title) return bad('Nothing to share', 400);
    await s.setJSON('s/' + id, { ...r, ...x, ed: new Date().toISOString() }); return Response.json({ ok: true });
  }
  if (sub !== '') return bad('Not found', 404);
  if (await limited(context && context.ip)) return bad('Please wait a little', 429);
  const x = body(b); if (!x.text && !x.title) return bad('Nothing to share', 400);
  const id = rand(8), key = rand(16);
  await s.setJSON('s/' + id, { kind: KINDS.includes(b.kind) ? b.kind : 'note', ...x, key, at: new Date().toISOString() });
  return Response.json({ id, key });
};
export const config = { path: ['/api/share', '/api/share/*'] };
