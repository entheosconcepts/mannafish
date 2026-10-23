// Texts sent back to the MannaFish number (Twilio calls this; in Twilio, the number's "A message comes in" webhook is
// https://manna-fish.com/api/sms-in, HTTP POST). YES starts the devotional; STOP ends it (Twilio also stops sending and
// replies itself, as it does to HELP and START); anything else, a prayer request or a thank-you, is emailed to MannaFish.
import { e164, fromTwilio } from './lib/sms.mjs';
import { findByPhone, confirm, stopAll } from './lib/devotext.mjs';
import { store } from './lib/devo.mjs';
import { sendMail, hasMail, FROM } from './lib/mail.mjs';

const STOP = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT', 'REVOKE', 'PARAR', 'ALTO']);
const START = new Set(['START', 'UNSTOP']);
const YES = new Set(['YES', 'Y', 'YEP', 'YEAH', 'SI', 'SÍ', 'S']);
const HELP = new Set(['HELP', 'INFO', 'AYUDA']);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const twiml = (msg) => new Response('<?xml version="1.0" encoding="UTF-8"?><Response>' + (msg ? '<Message>' + esc(msg) + '</Message>' : '') + '</Response>',
  { headers: { 'content-type': 'text/xml; charset=utf-8' } });

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const params = Object.fromEntries(new URLSearchParams(await req.text()));
  // only Twilio may tell us someone said YES or STOP (it signs each request with the auth token)
  const url = process.env.TWILIO_WEBHOOK_URL || req.url;
  if (!fromTwilio(url, params, req.headers.get('x-twilio-signature'))) return new Response('Not allowed', { status: 403 });
  const from = e164(params.From), body = String(params.Body || '').trim(), w = body.toUpperCase().replace(/[^A-ZÍ]/g, '');
  const now = new Date();
  if (STOP.has(w)) { await stopAll(from, 'replied ' + w, now); return twiml(''); }
  if (HELP.has(w)) return twiml('');   // Twilio answers HELP with the message set in its Advanced Opt-Out
  const all = await findByPhone(from);
  if (START.has(w)) {   // back after a STOP: Twilio lets texts through again; start where they were
    if (all.length) await store().setJSON(all[0].key, { ...all[0].rec, unsub: false, smsOk: now.toISOString(), updated: now.toISOString() });
    return twiml('');
  }
  if (YES.has(w)) {
    if (!all.length) return twiml('MannaFish: to get the free devotional by text, sign up at manna-fish.com (choose "Text message").');
    return twiml(await confirm(from, now));
  }
  // anything else: to MannaFish's inbox, so a prayer request is never lost
  const who = all.length ? all[0].rec : null;
  if (hasMail() && body) {
    try {
      await sendMail({ to: process.env.MF_TEXT_TO || FROM.email, name: 'MannaFish', subject: 'Text from ' + (who && who.name ? who.name + ' ' : '') + from + ': ' + body.slice(0, 50),
        text: `${who && who.name ? who.name + ' ' : ''}(${from}) texted the MannaFish number:\n\n${body}\n\n${who ? 'Signed up for the ' + (who.freq || 'Daily') + ' devotional by text' + (who.smsOk ? '' : ' (has not replied YES yet)') + '.' : 'Not signed up for texts.'}\nReply by texting them from your own phone, or by email if they gave one.`,
        html: `<p><b>${esc(who && who.name ? who.name + ' ' : '')}(${esc(from)})</b> texted the MannaFish number:</p><blockquote style="font:17px/1.5 Georgia,serif">${esc(body)}</blockquote><p style="color:#666">${who ? 'Signed up for the ' + esc(who.freq || 'Daily') + ' devotional by text' + (who.smsOk ? '' : ' (has not replied YES yet)') + '.' : 'Not signed up for texts.'}</p>`,
        tag: 'text-reply' });
    } catch (e) { console.log('text reply email failed', String(e).slice(0, 200)); }
  }
  const es = who && who.lang === 'es';
  return twiml(es ? 'MannaFish: ¡gracias! Su mensaje llegó al equipo de MannaFish. Responda STOP para cancelar.' : 'MannaFish: thank you! Your message went to the MannaFish team. Reply STOP to end.');
};
export const config = { path: '/api/sms-in' };
