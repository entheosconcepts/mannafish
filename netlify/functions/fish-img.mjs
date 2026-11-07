// A fish picture drawn on the server from the edit sheet's saved settings (Ken, 6 Nov: the word in the email was smaller than in the editor).
//   GET /api/fish-img?k=D007            -> PNG, 1000 x 500, white fish on black (what the daily email shows)
//   GET /api/fish-img?k=D007&fmt=svg    -> the SVG
//   GET /api/fish-standard              -> the rules and hand settings behind it (see fish-standard.mjs)
// The word's size and place follow the edit sheet: the fish's own setting, else the rule for its letters, else the builder's rule (lib/fishdraw.mjs).
// Anything that goes wrong (or a fish that is not a W or D fish, such as the original 24) sends the person to the saved picture
// /w/img/<k>.png instead, so an email never shows a broken picture.
import { getStore } from '@netlify/blobs';

let memo = null;
async function state() {
  if (memo && Date.now() - memo.t < 60e3) return memo.s;
  let s = null;
  try { const rec = await getStore({ name: 'mannafish-edit', consistency: 'strong' }).get('state', { type: 'json' }); s = rec && rec.state || null; } catch (e) { /* the builder's own rule */ }
  memo = { t: Date.now(), s }; return s;
}
export default async (req) => {
  const u = new URL(req.url), raw = u.searchParams.get('k') || '', svgOut = u.searchParams.get('fmt') === 'svg';
  const back = (k) => Response.redirect(new URL('/w/img/' + String(k || raw).toLowerCase().replace(/[^a-z0-9]/g, '') + '.png', u.origin), 302);
  try {
    const { drawFish, normKey } = await import('./lib/fishdraw.mjs'), k = normKey(raw);
    if (!k) return back();
    const svg = drawFish(k, await state()); if (!svg) return back(k);
    const cache = { 'cache-control': 'public, max-age=300', 'netlify-cdn-cache-control': 'public, max-age=300, stale-while-revalidate=86400', 'access-control-allow-origin': '*' };
    if (svgOut) return new Response(svg, { headers: { 'content-type': 'image/svg+xml', ...cache } });
    const { Resvg } = await import('@resvg/resvg-js');
    const png = new Resvg(svg, { background: '#000000', fitTo: { mode: 'width', value: Math.min(2000, Math.max(200, +u.searchParams.get('w') || 1000)) } }).render().asPng();
    return new Response(png, { headers: { 'content-type': 'image/png', ...cache } });
  } catch (e) { return back(); }
};
export const config = { path: '/api/fish-img' };
