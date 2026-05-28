export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

  const PRICE_IDS = {
    1:   'price_1TTYZRRtZxkXbvGED2CshtmH',  // $2.99
    2:   'price_1Tc5RWRtZxkXbvGEZ7AYAkOQ',  // $2.66
    5:   'price_1Tc5WgRtZxkXbvGEA8ozxAVd',  // $2.40
    10:  'price_1Tc5YeRtZxkXbvGEMAYe9xRw',  // $2.00
    25:  'price_1Tc5ZWRtZxkXbvGEBrZ1PHSN',  // $1.60
    50:  'price_1Tc5aIRtZxkXbvGEEH2WxThQ',  // $1.20
    100: 'price_1Tc5b7RtZxkXbvGEUcnv5GX6'   // $1.00
  };

  function getPriceId(totalQty) {
    if (totalQty >= 100) return PRICE_IDS[100];
    if (totalQty >= 50)  return PRICE_IDS[50];
    if (totalQty >= 25)  return PRICE_IDS[25];
    if (totalQty >= 10)  return PRICE_IDS[10];
    if (totalQty >= 5)   return PRICE_IDS[5];
    if (totalQty >= 2)   return PRICE_IDS[2];
    return PRICE_IDS[1];
  }

  try {
    const { cart } = await request.json();

    if (!cart || cart.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const priceId = getPriceId(totalQty);
    const wordList = cart.map(item => `${item.qty}× ${item.word}`).join(', ');

    // Build line items
    const lineItems = cart.map(item => ({
      price: priceId,
      quantity: item.qty,
      adjustable_quantity: { enabled: false }
    }));

    // Call Stripe API directly (no SDK needed for Edge Functions)
    const body = new URLSearchParams();
    body.append('payment_method_types[]', 'card');
    body.append('mode', 'payment');
    body.append('success_url', 'https://manna-fish.com/?order=success');
    body.append('cancel_url', 'https://manna-fish.com/?order=cancelled');
    body.append('shipping_address_collection[allowed_countries][]', 'US');
    body.append('custom_text[submit][message]', 'Free shipping on all orders — ships within 2–3 business days.');
    body.append('metadata[words]', wordList);
    body.append('metadata[total_qty]', totalQty);

    lineItems.forEach((item, i) => {
      body.append(`line_items[${i}][price]`, item.price);
      body.append(`line_items[${i}][quantity]`, item.quantity);
      body.append(`line_items[${i}][adjustable_quantity][enabled]`, 'false');
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), { status: 500 });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export const config = { path: '/.netlify/functions/create-checkout' };
