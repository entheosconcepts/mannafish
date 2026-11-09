// The gate (Ken, 9 Nov: "keep it from being active and public until I am ready").
// On manna-fish.com only, until MF_LAUNCHED=1 is set in Netlify, the public sees one "Coming soon" page.
// Ken (and anyone he shares the link with) opens https://manna-fish.com/?preview=<MF_PREVIEW_KEY> once; a cookie then lets that phone in.
// The test site (yadamannafishtest.netlify.app) and deploy previews are never gated. No key set = nobody can preview (fails closed).
// These stay open so printed QR codes and email links keep working: /q/<code>, the QR address list, unsubscribe, the text-reply webhook.
const HOSTS = /^(www\.)?manna-fish\.com$/i;
const OPEN = [/^\/q\//, /^\/print\/links\.json$/, /^\/api\/qr/, /^\/api\/devo-unsubscribe/, /^\/api\/sms-in/, /^\/\.netlify\//, /^\/robots\.txt$/];

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>MannaFish: coming soon</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f14;color:#f2f4f7;font:18px/1.55 Georgia,serif;text-align:center;padding:24px}
main{max-width:30rem}h1{font:800 2rem/1.15 system-ui,sans-serif;margin:0 0 .6rem}p{margin:.4rem 0;color:#c9d1db}small{display:block;margin-top:1.6rem;color:#8b96a5;font:14px system-ui,sans-serif}</style></head>
<body><main><h1>MannaFish is coming soon</h1><p>One word of Scripture in the middle of a fish, with its verse around it.</p>
<p>A free Bible app and a daily devotional, on the way.</p><small>Entheos Concepts, Wilmington, NC</small></main></body></html>`;

const cookieOf = (req, name) => { const m = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)').exec(req.headers.get('cookie') || ''); return m ? decodeURIComponent(m[1]) : ''; };
const same = (a, b) => { if (!a || !b || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export default async (request, context) => {
  const url = new URL(request.url);
  if (!HOSTS.test(url.hostname)) return context.next();                       // the test site and previews: never gated
  const env = (k) => (typeof Netlify !== 'undefined' && Netlify.env ? Netlify.env.get(k) : '') || '';
  if (env('MF_LAUNCHED') === '1') return context.next();                     // launched
  if (OPEN.some((r) => r.test(url.pathname))) return context.next();
  const key = env('MF_PREVIEW_KEY');
  const given = url.searchParams.get('preview');
  if (key && same(given || '', key)) {                                        // first visit with the private link: set the cookie, drop the key from the address
    url.searchParams.delete('preview');
    return new Response(null, { status: 302, headers: { location: url.pathname + (url.search || ''), 'set-cookie': `mf-preview=${encodeURIComponent(key)}; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`, 'cache-control': 'no-store' } });
  }
  if (key && same(cookieOf(request, 'mf-preview'), key)) return context.next();
  return new Response(PAGE, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
};

export const config = { path: '/*', excludedPath: ['/.netlify/*'] };
