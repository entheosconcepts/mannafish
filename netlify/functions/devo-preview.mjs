// Ken, 9 Oct: "send me a test email" -- this shows today's devotional email exactly as subscribers get it, in the
// browser, without sending anything.  /api/devo-preview  (?lang=es for Spanish, ?welcome=1 for the welcome email, ?friday=1 for Friday's double portion, ?freq=weekly|monthly)
import { emailFor, siteOf } from './lib/devo.mjs';
import { todaysManna, todaysCatch } from './lib/manna.mjs';
export default async (req) => {
  const u = new URL(req.url), lang = u.searchParams.get('lang') === 'es' ? 'es' : 'en';
  const now = new Date();
  // ?friday=1 shows the coming Friday's email (the double portion)
  const fr = { weekly: 'Weekly', monthly: 'Monthly' }[u.searchParams.get('freq')] || 'Daily';   // ?freq=weekly or ?freq=monthly
  // Ken, 19 Oct: Daily is the catch of the day, a different fish each day (two on Friday); Weekly and Monthly the week's fish
  const pick = fr === 'Daily' ? todaysCatch : todaysManna;
  let m = pick(now) || pick(new Date(now.getTime() - 86400000));   // Saturday: Friday's
  if (u.searchParams.get('friday') === '1') for (let d = 0; d < 7; d++) { const x = pick(new Date(now.getTime() + d * 86400000)); if (x && x.friday) { m = x; break; } }
  const e = emailFor(m, lang, '#unsubscribe', { welcome: u.searchParams.get('welcome') === '1', site: siteOf(u.origin), freq: fr, weekly: fr === 'Weekly' });
  return new Response(e.html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
};
export const config = { path: '/api/devo-preview' };
