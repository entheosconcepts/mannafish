// The QR codes on printed MannaFish cards (Ken, 30 Oct: "manage and monitor everything right here").
// Every code on a card opens manna-fish.com/q/<code>: the scan is counted, then the person is sent where that code goes.
// Where each code goes is print/links.json, written by tools/print/make.mjs from the runs in print/runs/, so a code
// already printed can be pointed somewhere new without reprinting.
//   GET /q/<code>               -> counts it, sends the person on (manna-fish.com when the code has no address yet)
//   GET /api/qr/stats?k=        -> {codes: {code: {n, days: {date: n}, last}}}  (k = MF_ADMIN_KEY, or PROOF_KEY)
import { getStore } from '@netlify/blobs';

const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const HOME = 'https://manna-fish.com/';
const db = () => getStore({ name: 'mannafish-qr', consistency: 'strong' });

export default async (req, context) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/qr/stats')) {
    if (!KEY() || url.searchParams.get('k') !== KEY()) return Response.json({ error: 'Not allowed' }, { status: 403 });
    const s = db(), { blobs } = await s.list(), codes = {};
    for (const b of blobs) codes[b.key] = await s.get(b.key, { type: 'json' });
    return Response.json({ codes }, { headers: { 'cache-control': 'no-store' } });
  }
  const code = String((context.params && context.params.code) || url.pathname.split('/').pop() || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);
  let to = '';
  try { const r = await fetch(new URL('/print/links.json', url.origin)); if (r.ok) { const L = await r.json(); to = (L[code] && L[code].to) || ''; } } catch (e) { /* send them home */ }
  if (!/^https?:\/\//.test(to)) to = HOME;
  if (code) {
    try { const s = db(), d = new Date().toISOString().slice(0, 10), o = (await s.get(code, { type: 'json' })) || { n: 0, days: {} };
      o.n++; o.days[d] = (o.days[d] || 0) + 1; o.last = new Date().toISOString(); await s.setJSON(code, o); } catch (e) { /* never block the person because the counter failed */ }
  }
  return new Response(null, { status: 302, headers: { location: to, 'cache-control': 'no-store' } });
};

export const config = { path: ['/q/:code', '/api/qr/stats'] };
