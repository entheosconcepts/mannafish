// The card maker is a premium (sponsor) feature (Ken, 26 Nov: "gray it out, the user would have to pay a premium price ... sponsor MannaFish and get premium access").
// There is no payment yet, so for now only the admin key opens it (MF_ADMIN_KEY or PROOF_KEY, sent as x-mf-key). Setting MF_CARD_FREE=1 opens it to everyone.
// When accounts can pay, this one function is where "is this person a sponsor?" will be checked.
export const premiumOk = (req) => {
  if (process.env.MF_CARD_FREE === '1') return true;
  const k = process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
  return !!k && req.headers.get('x-mf-key') === k;
};
export const premiumNo = () => Response.json({ error: 'premium', msg: 'This is a premium feature for sponsors of MannaFish. It is coming soon.' }, { status: 402, headers: { 'cache-control': 'no-store' } });
