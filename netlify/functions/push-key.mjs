import { keys } from './lib/push.mjs';
export default async () => {
  const k = await keys();
  return new Response(JSON.stringify({ publicKey: k.publicKey }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
};
export const config = { path: '/api/push-key' };
