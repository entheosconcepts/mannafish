// Ken, 9 Oct: "send me a test email" -- this shows today's devotional email exactly as subscribers get it, in the
// browser, without sending anything.  /api/devo-preview  (?lang=es for Spanish, ?welcome=1 for the welcome email)
import { emailFor, siteOf } from './lib/devo.mjs';
import { todaysManna } from './lib/manna.mjs';
export default async (req) => {
  const u = new URL(req.url), lang = u.searchParams.get('lang') === 'es' ? 'es' : 'en';
  const now = new Date();
  const m = todaysManna(now) || todaysManna(new Date(now.getTime() - 86400000));   // Saturday: Friday's word
  const e = emailFor(m, lang, '#unsubscribe', { welcome: u.searchParams.get('welcome') === '1', site: siteOf(u.origin) });
  return new Response(e.html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
};
export const config = { path: '/api/devo-preview' };
