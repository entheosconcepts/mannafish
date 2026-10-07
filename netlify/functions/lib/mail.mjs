// Sends one email through Brevo (account: Yadah Collaborative, domain manna-fish.com).
// Needs BREVO_API_KEY in Netlify. From MannaFish <2fish@manna-fish.com> unless MF_FROM_EMAIL is set.
export const FROM = { name: process.env.MF_FROM_NAME || 'MannaFish', email: process.env.MF_FROM_EMAIL || '2fish@manna-fish.com' };
export const hasMail = () => !!process.env.BREVO_API_KEY;
export async function sendMail({ to, name, subject, html, text, headers, tag }) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: FROM, replyTo: FROM, to: [{ email: to, ...(name ? { name } : {}) }], subject,
      htmlContent: html, textContent: text, headers: headers || {}, tags: tag ? [tag] : undefined })
  });
  if (!r.ok) throw new Error('Brevo ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}
