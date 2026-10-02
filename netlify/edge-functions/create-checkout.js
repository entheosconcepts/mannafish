export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

  // Price in cents based on total quantity
  function getUnitAmount(totalQty) {
    if (totalQty >= 100) return 100;  // $1.00
    if (totalQty >= 50)  return 120;  // $1.20
    if (totalQty >= 25)  return 160;  // $1.60
    if (totalQty >= 10)  return 200;  // $2.00
    if (totalQty >= 5)   return 240;  // $2.40
    if (totalQty >= 2)   return 266;  // $2.66
    return 299;                        // $2.99
  }

  try {
    const { cart } = await request.json();

    if (!cart || cart.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const unitAmount = getUnitAmount(totalQty);
    const wordList = cart.map(item => `${item.qty}× ${item.word}`).join(', ');

    // Build line items with custom name per word so customer sees their selections
    const body = new URLSearchParams();
    body.append('payment_method_types[]', 'card');
    body.append('mode', 'payment');
    body.append('success_url', 'https://manna-fish.com/?order=success');
    body.append('cancel_url', 'https://manna-fish.com/?order=cancelled');
    body.append('shipping_address_collection[allowed_countries][]', 'US');
    body.append('custom_text[submit][message]', 'Free shipping on all orders — ships within 2–3 business days.');
    body.append('metadata[words]', wordList);
    body.append('metadata[total_qty]', totalQty);

    cart.forEach((item, i) => {
      body.append(`line_items[${i}][price_data][currency]`, 'usd');
      body.append(`line_items[${i}][price_data][unit_amount]`, unitAmount);
      body.append(`line_items[${i}][price_data][product_data][name]`, `MannaFish™ Decal — ${item.word}`);
      body.append(`line_items[${i}][price_data][product_data][description]`, 'Clear Vinyl · 4″ × 2″ · Weatherproof · Made in the USA');
      body.append(`line_items[${i}][quantity]`, item.qty);
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
