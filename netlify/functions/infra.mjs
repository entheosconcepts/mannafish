// The Infrastructure page's numbers (admin only): who is signed up, and the starting guesses for the cost calculator.
//   GET /api/infra?k=<MF_ADMIN_KEY or PROOF_KEY>  ->  {counts:{total,email,text,smsOk,unsub,freq:{},lang:{},week,month}, defaults, at}
// Ken, 17 Nov: "build the numbers page ... how many signed up for text and what their usage is ... scenarios". Reads only; nothing is changed.
import { store } from './lib/devo.mjs';
import DEFAULTS from './lib/infra-defaults.json' with { type: 'json' };
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const NS = { 'cache-control': 'no-store' };
export default async (req) => {
  const k = new URL(req.url).searchParams.get('k') || req.headers.get('x-admin-key') || '';
  if (!KEY() || k !== KEY()) return Response.json({ error: 'Not allowed' }, { status: 401, headers: NS });
  const s = store(), c = { total: 0, email: 0, text: 0, smsOk: 0, unsub: 0, freq: {}, lang: {}, week: 0, month: 0, capped: false };
  const now = Date.now(); let n = 0;
  try {
    const { blobs } = await s.list();
    for (const b of blobs) { if (++n > 6000) { c.capped = true; break; }
      const r = await s.get(b.key, { type: 'json' }).catch(() => null); if (!r || !r.by) continue;
      if (r.unsub) { c.unsub++; continue; }
      c.total++; if (r.by === 'Text') { c.text++; if (r.smsOk) c.smsOk++; } else c.email++;
      c.freq[r.freq || 'Daily'] = (c.freq[r.freq || 'Daily'] || 0) + 1; c.lang[r.lang || 'en'] = (c.lang[r.lang || 'en'] || 0) + 1;
      const t = Date.parse(r.at || ''); if (t) { if (now - t < 7 * 864e5) c.week++; if (now - t < 30 * 864e5) c.month++; } }
  } catch (e) { return Response.json({ error: 'Could not read the sign-ups: ' + String(e.message || e).slice(0, 120) }, { status: 500, headers: NS }); }
  return Response.json({ counts: c, defaults: DEFAULTS, at: new Date().toISOString() }, { headers: NS });
};
export const config = { path: '/api/infra' };
