// Texting, through Twilio (Ken, 23 Oct: "i want people to get the devotional by text").
// Netlify environment settings: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID (or TWILIO_FROM,
// the MannaFish number as +1...). Until they are set, text sign-ups are kept and nothing is sent.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const hasSms = () => !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM));

// a phone number the way the phone companies write it: +19105551234 (a 10-digit number is taken as US/Canada)
export function e164(p) {
  const s = String(p || '').trim(), d = s.replace(/\D/g, '');
  if (!d) return '';
  if (s.startsWith('+')) return '+' + d;
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d[0] === '1') return '+' + d;
  return '+' + d;
}

// the plain letters every phone shows (curly quotes and dashes would make each text cost two or three times as much)
export function plain(t) {
  return String(t || '').replace(/[“”«»„]/g, '"').replace(/[‘’‚]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/ /g, ' ');
}

// send one text  -> {sid}; throws an Error with .code (Twilio's error number) when it is refused
export async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN;
  const f = new URLSearchParams({ To: e164(to), Body: plain(body).slice(0, 1200) });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) f.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
  else f.set('From', e164(process.env.TWILIO_FROM));
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: 'POST',
    headers: { authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' }, body: f });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('text not sent: ' + (j.message || r.status)); e.code = j.code || r.status; throw e; }
  return { sid: j.sid };
}
// Twilio's error numbers that mean "never text this number again": replied STOP (21610), not a mobile number or not valid
export const DEAD = new Set([21610, 21211, 21612, 21614, 21408]);

// a message from Twilio is really from Twilio: X-Twilio-Signature is an HMAC of the address and the form, with the auth token
export function fromTwilio(url, params, sig) {
  const tok = process.env.TWILIO_AUTH_TOKEN; if (!tok || !sig) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('');
  const want = createHmac('sha1', tok).update(data).digest('base64');
  const a = Buffer.from(want), b = Buffer.from(String(sig));
  return a.length === b.length && timingSafeEqual(a, b);
}
