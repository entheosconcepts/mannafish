// The fish format rule's settings, kept on the server so the rule tool (/edit/rule/) can change them and everything that draws a fish can follow.
//   GET  /api/fish-rule            -> {rule: {minW:{2..4: share of the eye's width}, steps:{3..7: letter height against a 7-letter word}}, at}   (public: pages draw with it)
//   POST /api/fish-rule {k, rule}  -> {ok, rule}   (k = MF_ADMIN_KEY or PROOF_KEY; the numbers are kept inside safe limits)
// Ken, 13 Nov: "get this rule tool more accessible and working so we can put it on auto pilot". tools/fish/pull-rule.mjs fetches this before a redraw.
import { getStore } from '@netlify/blobs';
const NS = { 'cache-control': 'no-store' };
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v)));
const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
export function clean(r) {
  const out = { minW: {}, steps: {} };
  for (const n of [2, 3, 4]) if (r && r.minW && isFinite(r.minW[n])) out.minW[n] = +clamp(r.minW[n], 0.3, 0.75).toFixed(3);
  for (const n of [3, 4, 5, 6, 7]) if (r && r.steps && isFinite(r.steps[n])) out.steps[n] = +clamp(r.steps[n], 0.9, 1.6).toFixed(3);
  return out;
}
export default async (req) => {
  const s = getStore('mannafish-fishrule');
  if (req.method === 'GET') { const j = (await s.get('rule', { type: 'json' })) || { rule: { minW: {}, steps: {} }, at: null }; return Response.json(j, { headers: NS }); }
  if (req.method === 'POST') {
    if (!okOrigin(req.headers.get('origin'))) return Response.json({ error: 'origin' }, { status: 403, headers: NS });
    let b = {}; try { b = await req.json(); } catch (e) { /* empty */ }
    if (!KEY() || String(b.k || '') !== KEY()) return Response.json({ error: 'Not allowed' }, { status: 401, headers: NS });
    const rule = clean(b.rule), j = { rule, at: new Date().toISOString() };
    await s.setJSON('rule', j); return Response.json({ ok: true, ...j }, { headers: NS });
  }
  return new Response('Method not allowed', { status: 405 });
};
export const config = { path: '/api/fish-rule' };
