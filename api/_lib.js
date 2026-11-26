// shared helpers for the admin API
export const PASS = process.env.ADMIN_PASSCODE || 'kayz1234';
export function authed(req) {
  const p = req.headers['x-admin-pass'] || (req.body && req.body.pass) || '';
  return typeof p === 'string' && p === PASS;
}
export function storageReady(res) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  res.status(503).json({ error: 'Storage is not connected yet. In Vercel open your project → Storage → Create → Blob (public) → connect it to this project, then Redeploy.' });
  return false;
}
