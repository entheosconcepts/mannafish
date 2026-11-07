// Today's MannaFish for the Bible page (Ken, 7 Nov: "keep the word of the day up top like the devo, but make it collapsible").
// GET /api/today-fish?tz=America/New_York&lang=en -> {key, title, ref, top, bottom, img, saturday?}
// The same fish the daily email and the Today page use (lib/manna.mjs); on Saturday (rest) it shows Sunday's.
import { welcomeCatch, fishInfo, validTz, DEFAULT_TZ } from './lib/manna.mjs';

export default async (req) => {
  const u = new URL(req.url), tz = validTz(u.searchParams.get('tz') || '') ? u.searchParams.get('tz') : DEFAULT_TZ, lang = u.searchParams.get('lang') === 'es' ? 'es' : 'en';
  const c = welcomeCatch(new Date(), tz, lang);
  if (!c) return Response.json({ error: 'No fish today' }, { status: 404 });
  const f = fishInfo(c.key, lang) || {};
  const core = !c.extra;
  return Response.json({ key: c.key, title: f.title || c.title, ref: f.ref || c.ref, top: f.top || '', bottom: f.bottom || '',
    img: core ? `/fish/${lang}/${c.key}.svg` : `/fish/${c.key}.svg`, link: c.url }, { headers: { 'cache-control': 'public, max-age=600' } });
};
export const config = { path: '/api/today-fish' };
