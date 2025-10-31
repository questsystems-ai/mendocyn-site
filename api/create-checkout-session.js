// POST /api/create-checkout-session
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.STRIPE_SECRET_KEY;
  const price  = process.env.PRICE_ID;
  const site   = process.env.SITE_URL || `https://${req.headers.host}`;

  if (!secret || !price) {
    return res.status(500).json({ error: 'Stripe env vars missing (STRIPE_SECRET_KEY, PRICE_ID)' });
  }

  // Stripe Checkout expects application/x-www-form-urlencoded
  const body = new URLSearchParams({
    'mode': 'payment',
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    // where to send users after payment success/cancel
    'success_url': `${site}/success.html`,
    'cancel_url':  `${site}/preorder.html`,
    // helpful metadata / descriptors
    'payment_intent_data[description]': 'Pre-order: Box of 10 enzyme dose kits',
    'metadata[order_type]': 'preorder',
    // this helps collect an email you can use for updates/refunds
    'customer_creation': 'always',
  });

  try {
    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const text = await resp.text();
    if (!resp.ok) {
      try {
        const j = JSON.parse(text);
        return res.status(resp.status).json({ error: j.error?.message || text });
      } catch {
        return res.status(resp.status).json({ error: text });
      }
    }
    const data = JSON.parse(text);
    return res.status(200).json({ url: data.url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
