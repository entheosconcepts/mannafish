// The edit sheet, kept on the server (Ken, 19 Oct): "whatever I save is only on this device, but that's a problem. Can you put this
// on the server side so if I save something from any device, the changes are saved?"
// One shared copy of everything in /edit/ (changes, saved points, Ready marks, rules), behind Ken's admin password.
//   GET  /api/edit-save                 (header x-mf-key)  -> {state, ver, at, by} or {state:null, ver:0}; 401 wrong password
//   POST /api/edit-save {state, base, by} (header x-mf-key) -> {ok, ver, at}
//        409 {error:'newer', state, ver, at, by} when another device saved since `base`: merge and send again
// The last 40 copies are kept under h/ in case one ever needs to come back.
import { getStore } from '@netlify/blobs';

const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (msg, status, extra) => Response.json({ error: msg, ...(extra || {}) }, { status });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const db = () => getStore({ name: 'mannafish-edit', consistency: 'strong' });
const KEEP = 40;

export default async (req) => {
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const k = KEY();
  if (!k) return bad('The admin password is not set up on the server yet', 501);
  if ((req.headers.get('x-mf-key') || '') !== k) return bad('That password is not right', 401);
  const s = db();
  const cur = (await s.get('state', { type: 'json' })) || { state: null, ver: 0, at: '', by: '' };
  if (req.method === 'GET') return Response.json(cur, { headers: { 'cache-control': 'no-store' } });
  if (req.method !== 'POST') return bad('GET or POST', 405);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (!b || typeof b.state !== 'object' || !b.state || !b.state.d) return bad('Nothing to save', 400);
  const raw = JSON.stringify(b.state);
  if (raw.length > 4e6) return bad('Too big to save', 413);
  if (+b.base !== cur.ver) return bad('newer', 409, cur);
  const rec = { state: b.state, ver: cur.ver + 1, at: new Date().toISOString(), by: String(b.by || '').slice(0, 80) };
  await s.setJSON('state', rec);
  try {   // a dated copy, and only the newest few kept
    await s.setJSON(`h/${rec.at}`, rec);
    const { blobs } = await s.list({ prefix: 'h/' });
    const old = blobs.map((x) => x.key).sort().slice(0, Math.max(0, blobs.length - KEEP));
    await Promise.all(old.map((key) => s.delete(key)));
  } catch (e) { /* the copies are a safety net; the save itself already happened */ }
  return Response.json({ ok: true, ver: rec.ver, at: rec.at });
};

export const config = { path: '/api/edit-save' };
