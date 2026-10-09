// The devotional forms (Free Daily Devotional, and the word-study sign-up) also post here,
// so email sign-ups start getting the daily MannaFish. New email sign-ups get a welcome email
// with today's word right away (on Saturday, the rest day, the welcome shows Friday's word).
import { subscribe, deliver, siteOf } from './lib/devo.mjs';
import { hasMail } from './lib/mail.mjs';
import { todaysManna } from './lib/manna.mjs';
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let f; try { f = Object.fromEntries(new URLSearchParams(await req.text())); } catch (e) { return new Response('Bad request', { status: 400 }); }
  if (f['bot-field']) return Response.json({ ok: true });
  let r; try { r = await subscribe(f, new Date(), siteOf(new URL(req.url).origin)); } catch (e) { return new Response('Check the ' + e.message, { status: 400 }); }
  let welcomed = false;
  if (r.isNew && r.rec.by === 'Email' && hasMail()) {
    const now = new Date();
    const m = todaysManna(now, r.rec.tz) || todaysManna(new Date(now.getTime() - 86400000), r.rec.tz);
    try { await deliver(r.rec, m, { welcome: true }); welcomed = true; } catch (e) { console.log('welcome failed', String(e).slice(0, 200)); }
  }
  return Response.json({ ok: true, welcomed });
};
export const config = { path: '/api/devo-subscribe' };
