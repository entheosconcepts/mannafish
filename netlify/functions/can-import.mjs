// Importing notes (Ken, 12 Oct): "I would like to be the only one who can import notes, unless I provide
// administrative permission to somebody I know." The page asks here, with the signed-in person's session, whether to
// show "Import notes". The answer comes from MF_IMPORTERS in Netlify: the email addresses allowed, separated by commas.
// With nothing set, nobody sees it.
//   GET /api/can-import   (header Authorization: Bearer <session token>)  -> {ok: true|false}
const SB_URL = process.env.SUPABASE_URL || 'https://oblttpxqjvaglwfdszdg.supabase.co';
const SB_PUB = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Nl4EDkBHlrnEqFVcL_oGvQ_J-X-t3Wc';

export default async (req) => {
  const allowed = String(process.env.MF_IMPORTERS || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
  const tok = String(req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!allowed.length || !tok) return Response.json({ ok: false });
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_PUB, authorization: 'Bearer ' + tok } });
    if (!r.ok) return Response.json({ ok: false });
    const u = await r.json(), email = String(u.email || '').toLowerCase();
    return Response.json({ ok: !!email && allowed.includes(email) }, { headers: { 'cache-control': 'no-store' } });
  } catch (e) { return Response.json({ ok: false }); }
};
export const config = { path: '/api/can-import' };
