// Approved line breaks for a fish's verse (Ken, 19 Nov: "determine what part of the verse is used on the fish... if it's approved by me, save it for all fish so it is uniform").
// A line set is {top, bot} for one verse + version + word, e.g. key 'Matthew 7:24|kjv|BUILD'. The sponsor builder (and Make a MannaFish) use an approved set instead of the automatic split.
//   GET  /api/fish-lines                          -> {lines:{key:{top,bot,at}}}      (public: the pages read it)
//   POST /api/fish-lines {k, key, top, bot}       -> {ok}     approve (admin key)
//   POST /api/fish-lines {k, key, remove:true}    -> {ok}     take an approval back
// The fish already drawn as files (the original 24, the year fish, the daily emails' pictures) change only when the approved lines are put into
// tools/fish-format/*-lines.json and the fish are redrawn (tools/fish/redraw-all.sh): the admin page lists what is waiting for that.
import { getStore } from '@netlify/blobs';
const NS = { 'cache-control': 'no-store' };
const bad = (m, s) => Response.json({ error: m }, { status: s, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const db = () => getStore({ name: 'mannafish-fishlines', consistency: 'strong' });
export default async (req) => {
  const s = db();
  if (req.method === 'GET') return Response.json({ lines: (await s.get('all', { type: 'json' })) || {} }, { headers: { 'cache-control': 'public, max-age=60' } });
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (!KEY() || b.k !== KEY()) return bad('Not allowed', 403);
  const key = clean(b.key, 80); if (!/^.+\|[a-z]+\|[A-Z]+$/.test(key)) return bad('Bad key', 400);
  const all = (await s.get('all', { type: 'json' })) || {};
  if (b.remove) delete all[key];
  else { const top = clean(b.top, 130), bot = clean(b.bot, 130); if (!top || !bot) return bad('Both lines are needed.', 400); all[key] = { top, bot, at: Date.now() }; }
  await s.setJSON('all', all); return Response.json({ ok: true }, { headers: NS });
};
export const config = { path: '/api/fish-lines' };
