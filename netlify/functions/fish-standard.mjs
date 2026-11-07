// The word-size standard, readable by Ken's tools (no password: it holds only sizes and places, no text, notes or names).
//   GET /api/fish-standard           -> {ver, at, rules: {word, top, bot}, own: {fish id: {wl, tl, bl}}}
//   GET /api/fish-standard?k=D007    -> what one fish ends up with, and why ("set on the fish", "rule for 5 letters", "the builder rule")
// It is the edit sheet's saved state (edit-save.mjs), so the sheet, the daily email pictures (fish-img.mjs) and Claude's build
// tools (tools/fish/sync-standard.mjs) all read one copy.
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const u = new URL(req.url);
  let rec = null;
  try { rec = await getStore({ name: 'mannafish-edit', consistency: 'strong' }).get('state', { type: 'json' }); } catch (e) { /* none yet */ }
  const S = rec && rec.state || null, head = { 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
  const k = u.searchParams.get('k');
  if (k) {
    const { settingsFor, normKey } = await import('./lib/fishdraw.mjs'), id = normKey(k), r = id && settingsFor(id, S);
    if (!r) return Response.json({ error: 'Not a W or D fish' }, { status: 404, headers: head });
    return Response.json({ k: id, word: r.f.word, settings: r.o, why: r.why, ver: rec ? rec.ver : 0 }, { headers: head });
  }
  const own = {};
  if (S && S.d) Object.keys(S.d).forEach((id) => { const o = S.d[id] || {}, x = {}; ['wl', 'tl', 'bl'].forEach((f) => { if (o[f]) x[f] = o[f]; }); if (Object.keys(x).length) own[id] = x; });
  return Response.json({ ver: rec ? rec.ver : 0, at: rec ? rec.at : '', rules: S && S.rules || { word: {}, top: {}, bot: {} }, own }, { headers: head });
};
export const config = { path: '/api/fish-standard' };
