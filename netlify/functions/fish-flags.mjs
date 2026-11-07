// Marks on fish from the review page (/fish/review/): "Edit" = fix this fish to the word-size standard, "Remove" = take it out.
// Ken, 7 Nov: "an admin page ... with all available fish so I can check a box to remove or a box to edit ... No one uses this yet, so no password."
// Marks only; nothing is edited or deleted by them. Claude reads the list (the page's "Copy my list") and does the work when Ken says so.
//   GET  /api/fish-flags                          -> {flags: {<fish id>: {edit?: true, remove?: true}}, at}
//   POST /api/fish-flags {id|ids, edit?, remove?}  -> sets (or clears, with false) a mark on those fish
//   POST /api/fish-flags {clear: 'edit'|'remove'|'all'} -> clears one kind of mark, or all
// Only the site's own pages may write. NOTE: there is no password on purpose while nobody uses the site; add MF_ADMIN_KEY before "push it live".
import { getStore } from '@netlify/blobs';

const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (msg, status) => Response.json({ error: msg }, { status });
const ID = /^[A-Za-z0-9_-]{2,16}$/;

export default async (req) => {
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const s = getStore({ name: 'mannafish-flags', consistency: 'strong' });
  const cur = (await s.get('all', { type: 'json' })) || { flags: {}, at: '' };
  if (req.method === 'GET') return Response.json(cur, { headers: { 'cache-control': 'no-store' } });
  if (req.method !== 'POST') return bad('GET or POST', 405);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const flags = cur.flags || {};
  if (b && b.clear) {
    const k = b.clear === 'edit' || b.clear === 'remove' ? b.clear : b.clear === 'all' ? '' : null; if (k === null) return bad('Clear edit, remove or all', 400);
    Object.keys(flags).forEach((id) => { if (!k) delete flags[id]; else { delete flags[id][k]; if (!flags[id].edit && !flags[id].remove) delete flags[id]; } });
  } else {
    const ids = (Array.isArray(b && b.ids) ? b.ids : [b && b.id]).filter((x) => typeof x === 'string' && ID.test(x)).slice(0, 700);
    if (!ids.length) return bad('Which fish?', 400);
    ids.forEach((id) => { const f = flags[id] || {};
      ['edit', 'remove'].forEach((k) => { if (b[k] === true) f[k] = true; else if (b[k] === false) delete f[k]; });
      if (f.edit || f.remove) flags[id] = f; else delete flags[id]; });
  }
  if (Object.keys(flags).length > 2000) return bad('Too many marks', 413);
  const rec = { flags, at: new Date().toISOString() };
  await s.setJSON('all', rec);
  return Response.json(rec, { headers: { 'cache-control': 'no-store' } });
};
export const config = { path: '/api/fish-flags' };
