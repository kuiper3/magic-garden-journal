// api/config.js
// Vercel serverless function — exposes public env vars to the browser.
// Only the anon key and URL are returned. Never expose SERVICE_ROLE_KEY or JWT_SECRET.
// Called once on boot by js/lib/supabase.js before initialising the client.

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({
    supabaseUrl:  process.env.SUPABASE_URL,
    supabaseAnon: process.env.SUPABASE_ANON_KEY,
  });
}
