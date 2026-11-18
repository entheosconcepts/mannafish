// A sponsor's work in progress on /sponsor/ (Ken, 17 Nov: "save automatically, and pick up where you left off"; more than one decal per order).
// The page saves itself here a moment after every change, under a long random number that only that browser (and anyone given the link) knows.
//   POST /api/sponsor-draft {id?, data} -> {ok, id}        GET /api/sponsor-draft?id=<32 hex> -> {data, at}
import { getStore } from '@netlify/blobs';
const NS = { 'cache-control': 'no-store' };
const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (m, s) => Response.json({ error: m }, { status: s, headers: NS });
const ID = /^[a-f0-9]{32}$/, MAX = 4500000;
const str = (s, n) => String(s == null ? '' : s).slice(0, n);
const img = (u) => typeof u === 'string' && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(u) && u.length < 1500000 ? u : '';
export function clean(d) {
  const cards = (Array.isArray(d && d.cards) ? d.cards : []).slice(0, 12).map((c) => ({ word: str(c.word, 40), fishId: str(c.fishId, 40), verse: c.verse && c.verse.top ? { ref: str(c.verse.ref, 40), top: str(c.verse.top, 130), bot: str(c.verse.bot, 130) } : null,
    vref: str(c.vref, 60), url: str(c.url, 200), qrTo: c.qrTo === 'app' ? 'app' : 'link', logoAspect: isFinite(c.logoAspect) ? Math.max(0, Math.min(12, +Number(c.logoAspect).toFixed(3))) : 0, q1: str(c.q1, 24), q2: str(c.q2, 24), by: ['logo', 'name', 'text'].includes(c.by) ? c.by : 'logo', logoId: str(c.logoId, 40), logoName: str(c.logoName, 80), name: str(c.name, 60), text: str(c.text, 120), credit: str(String(c.credit == null ? '' : c.credit).replace(/\s+/g, ' ').trim(), 100), qty: Math.max(100, Math.min(100000, Math.round((Number(c.qty) || 100) / 100) * 100)) }));
  const logos = {}; for (const [k, v] of Object.entries(d && d.logos && typeof d.logos === 'object' ? d.logos : {}).slice(0, 12)) { const u = img(v); if (u) logos[str(k, 40)] = u; }
  const ct = (d && d.contact) || {};
  return { cards, active: Math.max(0, Math.min(cards.length - 1, Number(d && d.active) || 0)), logos, contact: { name: str(ct.name, 80), email: str(ct.email, 120), phone: str(ct.phone, 40), note: str(ct.note, 800) } };
}
export default async (req, context) => {
  const store = getStore({ name: 'mannafish-sponsordraft', consistency: 'strong' }), url = new URL(req.url);
  if (req.method === 'GET') { const id = url.searchParams.get('id') || ''; if (!ID.test(id)) return bad('Not found', 404); const o = await store.get('d/' + id, { type: 'json' }); return o ? Response.json(o, { headers: NS }) : bad('Not found', 404); }
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const raw = await req.text(); if (raw.length > MAX) return bad('That is too large to save. Try a smaller logo.', 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return bad('Bad request', 400); }
  try { const l = getStore('mannafish-limits'), k = `sdraft/${new Date().toISOString().slice(0, 13)}/${(context && context.ip) || 'x'}`, n = Number(await l.get(k)) || 0; if (n >= 400) return bad('Please wait a little.', 429); await l.set(k, String(n + 1)); } catch (e) { /* never blocks */ }
  let id = typeof b.id === 'string' && ID.test(b.id) ? b.id : ''; if (!id) id = crypto.randomUUID().replace(/-/g, '');
  await store.setJSON('d/' + id, { data: clean(b.data), at: Date.now() });
  return Response.json({ ok: true, id }, { headers: NS });
};
export const config = { path: '/api/sponsor-draft' };
