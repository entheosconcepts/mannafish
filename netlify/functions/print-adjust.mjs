// The card back editor's saved layout (print/back-edit/<run>.html): per line, a size %, width %, height % and a shift in mm.
//   GET  /api/print-adjust?run=R0015        -> {adj: {block: {s, sx, sy, dx, dy}}, at}      (public: only layout numbers; tools/print/make.mjs reads it)
//   POST /api/print-adjust {k, run, adj}    -> {ok}      (k = MF_ADMIN_KEY or PROOF_KEY)
// Ken, 17 Nov: "create a tool for all the text on the back of the decal so I can determine what size it is and where it's positioned for each line."
import { getStore } from '@netlify/blobs';
const NS = { 'cache-control': 'no-store' };
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v)));
const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const runId = (r) => String(r || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
export function clean(adj) {
  const out = {};
  for (const [n, a] of Object.entries(adj && typeof adj === 'object' ? adj : {})) {
    if (!/^[A-Za-z0-9]{1,12}$/.test(n) || !a || typeof a !== 'object') continue;
    const o = {};
    for (const [k, lo, hi] of [['s', 30, 250], ['sx', 30, 250], ['sy', 30, 250], ['dx', -30, 30], ['dy', -30, 30]]) if (isFinite(a[k])) o[k] = +clamp(a[k], lo, hi).toFixed(2);
    if (Object.keys(o).length) out[n] = o;
  }
  return out;
}
export default async (req) => {
  const s = getStore('mannafish-printadjust'), url = new URL(req.url);
  if (req.method === 'GET') { const id = runId(url.searchParams.get('run')); if (!id) return Response.json({ error: 'run' }, { status: 400, headers: NS });
    return Response.json((await s.get(id, { type: 'json' })) || { adj: {}, at: null }, { headers: NS }); }
  if (req.method === 'POST') {
    if (!okOrigin(req.headers.get('origin'))) return Response.json({ error: 'origin' }, { status: 403, headers: NS });
    let b = {}; try { b = await req.json(); } catch (e) { /* empty */ }
    if (!KEY() || String(b.k || '') !== KEY()) return Response.json({ error: 'Not allowed' }, { status: 401, headers: NS });
    const id = runId(b.run); if (!id) return Response.json({ error: 'run' }, { status: 400, headers: NS });
    const j = { adj: clean(b.adj), at: new Date().toISOString() }; await s.setJSON(id, j); return Response.json({ ok: true, ...j }, { headers: NS });
  }
  return new Response('Method not allowed', { status: 405 });
};
export const config = { path: '/api/print-adjust' };
