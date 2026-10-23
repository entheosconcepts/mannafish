// The devotional forms (Free Daily Devotional, and the word-study sign-up) also post here,
// so email sign-ups start getting the daily MannaFish. New email sign-ups get a welcome email
// with today's word right away -- except over the Sabbath (6pm Friday to 9pm Saturday), when it waits until 9pm Saturday.
import { subscribe, deliver, siteOf, store, welcomeFor } from './lib/devo.mjs';
import { hasMail } from './lib/mail.mjs';
import { sabbathRest } from './lib/manna.mjs';
import { hasSms } from './lib/sms.mjs';
import { askConfirm } from './lib/devotext.mjs';
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let f; try { f = Object.fromEntries(new URLSearchParams(await req.text())); } catch (e) { return new Response('Bad request', { status: 400 }); }
  if (f['bot-field']) return Response.json({ ok: true });
  let r; try { r = await subscribe(f, new Date(), siteOf(new URL(req.url).origin)); } catch (e) { return new Response('Check the ' + e.message, { status: 400 }); }
  let welcomed = false, held = false;
  if (r.isNew && r.rec.by === 'Email' && hasMail()) {
    const now = new Date();
    // Ken, 11 Oct: no welcome emails over the Sabbath (6pm Friday to 9pm Saturday); it goes out at 9pm Saturday
    if (sabbathRest(now, r.rec.tz)) { held = true; await store().setJSON(r.key, { ...r.rec, welcomeDue: true }); }
    else { try { await deliver(r.rec, welcomeFor(r.rec, now, r.rec.tz), { welcome: true }); welcomed = true; } catch (e) { console.log('welcome failed', String(e).slice(0, 200)); } }
  }
  // a text sign-up: one text right away asking them to reply YES (Ken, 23 Oct); before Twilio is set up, it is asked once it is
  let text = null;
  if (r.rec.by === 'Text') {
    if (r.rec.smsOk && !r.rec.unsub) text = 'on';
    else if (hasSms() && !(r.rec.smsAsked && Date.now() - Date.parse(r.rec.smsAsked) < 10 * 60 * 1000)) {
      try { await askConfirm(r.key, r.rec); text = 'asked'; } catch (e) { console.log('confirm text failed', e.code || '', String(e.message || e).slice(0, 200)); text = 'bad'; }
    } else text = hasSms() ? 'asked' : 'later';
  }
  return Response.json({ ok: true, welcomed, held, text, already: !r.isNew, was: r.was, freq: r.rec.freq });
};
export const config = { path: '/api/devo-subscribe' };
