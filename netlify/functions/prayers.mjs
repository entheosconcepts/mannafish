// The MannaFish prayer archive (Ken, 8 Nov): short prayers written by people, not by AI, read to the listener before the devotional.
//   GET  /api/prayers?l=en&last=<id>      -> {prayer:{id,text,by}|null}   one approved prayer at random (not the one just heard)
//   POST /api/prayers {text,by,l,own:true}-> a prayer sent in; it waits (pending) until Ken approves it. Nothing plays before that.
//   Admin (header x-mf-key = MF_ADMIN_KEY):
//   GET  /api/prayers?admin=1             -> {pending:[...], approved:{en:[...],es:[...]}}
//   POST /api/prayers {action:'approve'|'reject'|'delete'|'add', id?, text?, by?, l?}
// Rules for a prayer: 15 to 200 characters (about 5 to 10 seconds spoken), no links, email addresses or phone numbers, written by the sender (they tick that).
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (msg, status = 400) => Response.json({ error: msg }, { status });
const LANGS = ['en', 'es'];
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const problem = (t) => {
  if (t.length < 15) return 'Please write a little more (at least 15 characters).';
  if (t.length > 200) return 'Please keep it short: 200 characters or less (about 10 seconds spoken).';
  if (/https?:|www\.|\.(com|net|org|co|io|us)\b|@/i.test(t)) return 'Please leave out web addresses and email addresses.';
  if (/\d[\d\s().-]{6,}\d/.test(t)) return 'Please leave out phone numbers.';
  return '';
};
const db = () => getStore({ name: 'mannafish-prayers', consistency: 'strong' });
const get = async (s, k, d) => (await s.get(k, { type: 'json' })) || d;

export default async (req) => {
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const s = db(), u = new URL(req.url), admin = (req.headers.get('x-mf-key') || '') === KEY() && !!KEY();
  if (req.method === 'GET') {
    if (u.searchParams.get('admin')) {
      if (!admin) return bad('That password is not right', 401);
      const approved = {}; for (const l of LANGS) approved[l] = await get(s, 'ap-' + l, []);
      return Response.json({ pending: await get(s, 'pending', []), approved }, { headers: { 'cache-control': 'no-store' } });
    }
    const l = LANGS.includes(u.searchParams.get('l')) ? u.searchParams.get('l') : 'en', last = u.searchParams.get('last') || '';
    const all = await get(s, 'ap-' + l, []), pool = all.length > 1 ? all.filter((p) => p.id !== last) : all;
    const p = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    return Response.json({ prayer: p ? { id: p.id, text: p.text, by: p.by || '' } : null }, { headers: { 'cache-control': 'no-store' } });
  }
  if (req.method !== 'POST') return bad('GET or POST', 405);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request'); }
  const l = LANGS.includes(b && b.l) ? b.l : 'en';
  if (b && b.action) {
    if (!admin) return bad('That password is not right', 401);
    const pending = await get(s, 'pending', []), ap = await get(s, 'ap-' + l, []);
    if (b.action === 'add') {   // Ken's own prayers: approved at once
      const t = clean(b.text, 200), pr = problem(t); if (pr) return bad(pr);
      ap.push({ id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: t, by: clean(b.by, 40), at: new Date().toISOString() });
      await s.setJSON('ap-' + l, ap); return Response.json({ ok: true, count: ap.length });
    }
    const id = String(b.id || '');
    if (b.action === 'approve' || b.action === 'reject') {
      const i = pending.findIndex((p) => p.id === id); if (i < 0) return bad('That prayer is not waiting', 404);
      const [p] = pending.splice(i, 1);
      if (b.action === 'approve') { const t = clean(b.text || p.text, 200), pr = problem(t); if (pr) return bad(pr); const al = await get(s, 'ap-' + p.l, []); al.push({ id: p.id, text: t, by: p.by, at: new Date().toISOString() }); await s.setJSON('ap-' + p.l, al); }
      await s.setJSON('pending', pending); return Response.json({ ok: true });
    }
    if (b.action === 'delete') { await s.setJSON('ap-' + l, ap.filter((p) => p.id !== id)); return Response.json({ ok: true }); }
    return bad('Unknown action');
  }
  // a prayer sent in by a listener
  if (!b || b.own !== true) return bad('Please tick that you wrote this yourself, not with AI.');
  const t = clean(b.text, 400), pr = problem(t); if (pr) return bad(pr);
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim(), day = new Date().toISOString().slice(0, 10);
  const rk = 'rl/' + day + '/' + createHash('sha256').update(ip + '|mf-prayers').digest('hex').slice(0, 16), n = (await get(s, rk, { n: 0 })).n;
  if (n >= 5) return bad('That is enough prayers for today. Thank you! Please try again tomorrow.', 429);
  await s.setJSON(rk, { n: n + 1 });
  const pending = await get(s, 'pending', []);
  if (pending.length >= 500) return bad('Prayers are waiting to be read; please try again later.', 503);
  pending.push({ id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: t, by: clean(b.by, 40), l, at: new Date().toISOString() });
  await s.setJSON('pending', pending);
  return Response.json({ ok: true });
};
export const config = { path: '/api/prayers' };
