// Follow-up for Hub nominations nobody has answered (Ken, 18 Nov: "a reminder way before 14 days... a phone call and maybe something in the mail. It is about personal connections").
// Runs every morning. For each invitation Ken sent that is still open:
//   after 2 days  -> one friendly reminder email to the place (once)  and a "call them" item for Ken
//   after 5 days  -> a "mail them something" item for Ken
// The calls and the mail are Ken's: the admin page (/print/orders/) shows them under "Follow up today" and he marks them done. Nothing else is sent.
import { getStore } from '@netlify/blobs';
import { sendMail, FROM } from './lib/mail.mjs';
const DAY = 864e5, esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export default async () => {
  const s = getStore({ name: 'mannafish-orders', consistency: 'strong' }), { blobs } = await s.list({ prefix: 'o/' }), origin = process.env.URL || 'https://manna-fish.com'; let sent = 0, due = [];
  for (const b of blobs) {
    const o = await s.get(b.key, { type: 'json' }); if (!o) continue; let dirty = false;
    for (const it of o.items) {
      const n = it.nom; if (!n || n.status !== 'invited' || !n.sentAt) continue; const age = Date.now() - n.sentAt, org = it.dest.type === 'hub' ? it.dest.hubName : it.dest.nominee.org, to = it.dest.type === 'new' ? it.dest.nominee.email : it.dest.contactEmail;
      if (age > 2 * DAY && !n.reminded && to) {
        try { await sendMail({ to, subject: `A quick note about MannaFish, ${org}`, tag: 'nomination',
          html: `<div style="font:16px/1.55 Georgia,serif;max-width:34rem"><p>Hello,</p><p>We wrote a couple of days ago: someone wants <b>${esc(org)}</b> to be a MannaFish Hub, a free basket of Scripture decals for the people who walk in. No cost, nothing sold. If you have a minute, here is the page to say yes (or no): <a href="${esc(origin + '/nominate/?t=' + n.token)}">${esc(origin + '/nominate/?t=' + n.token)}</a>. A person from MannaFish may also give you a call.</p><p style="color:#5b6570;font-size:13px">MannaFish · Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405</p></div>`, text: `A quick note: ${org} was nominated to be a free MannaFish Hub. Answer here: ${origin}/nominate/?t=${n.token}` }); n.reminded = Date.now(); dirty = true; sent++; } catch (e) { /* tries again tomorrow */ }
      }
      if (age > 2 * DAY && !n.called) due.push(`CALL ${org}${it.dest.nominee && it.dest.nominee.phone ? ' ' + it.dest.nominee.phone : ''} (order ${o.id})`);
      if (age > 5 * DAY && !n.mailed) due.push(`MAIL something to ${org} (order ${o.id})`);
    }
    if (dirty) await s.setJSON(b.key, o);
  }
  if (due.length) try { await sendMail({ to: process.env.MF_ORDERS_TO || process.env.MF_PROOF_TO || FROM.email, subject: `MannaFish follow-up today: ${due.length}`, tag: 'nomination', html: `<p>Hub nominations still waiting for an answer:</p><ul>${due.map((d) => `<li>${esc(d)}</li>`).join('')}</ul><p>Mark each done in ${esc(origin)}/print/orders/</p>`, text: due.join('\n') }); } catch (e) { /* skip */ }
  return new Response(JSON.stringify({ reminded: sent, due: due.length }));
};
export const config = { schedule: '0 14 * * *' };
