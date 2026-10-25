// Keep the test site out of Google, but not manna-fish.com (Ken, 25 Oct: before launch, "fixing the 'hide from Google' setting so
// the real site can be found"). _headers applies to every site this branch deploys to, so the noindex is added here instead, only
// when the address is a netlify.app one (the test site and deploy previews).
export default async (request, context) => {
  const res = await context.next();
  if (new URL(request.url).hostname.endsWith('.netlify.app')) res.headers.set('X-Robots-Tag', 'noindex');
  return res;
};
export const config = { path: '/*', excludedPath: ['/api/*', '/.netlify/*'] };
