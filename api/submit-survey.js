// Vercel serverless function: /api/submit-survey
// Inserts into Supabase via REST (no npm deps needed).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const payload = req.body || {};

    const url = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !serviceRole) return res.status(500).json({ error: 'Missing Supabase env vars' });

    const resp = await fetch(`${url}/rest/v1/survey_responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    if (!resp.ok) {
      let err = text;
      try { err = JSON.parse(text).message || text; } catch {}
      return res.status(resp.status).json({ error: err });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
