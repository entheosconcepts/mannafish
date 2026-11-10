// Every fish in the pot, for "Catch a fish and share it" (Ken, 10 Nov): GET /api/catch-list?lang=en -> {fish: [{k, t: word, r: reference, v: a few words of the verse, core: true for the original 24}]}
import { CATCHORDER, CATCHFISH, fishInfo } from './lib/manna.mjs';

export default async (req) => {
  const lang = new URL(req.url).searchParams.get('lang') === 'es' ? 'es' : 'en';
  const fish = [];
  for (const k of CATCHORDER) {
    const f = fishInfo(k, lang); if (!f) continue;
    const x = CATCHFISH[k];
    fish.push({ k, t: f.title, r: f.ref, v: (x && x.snip) || [f.top, f.bottom].filter(Boolean).join(' '), core: !x });
  }
  return Response.json({ fish }, { headers: { 'cache-control': 'public, max-age=3600' } });
};
export const config = { path: '/api/catch-list' };
