// shared helpers for the admin API
export const PASS = process.env.ADMIN_PASSCODE || 'kayz1234';
export function authed(req) {
  const p = req.headers['x-admin-pass'] || (req.body && req.body.pass) || '';
  return typeof p === 'string' && p === PASS;
}
/* Finds the Blob store credentials however Vercel connected it:
   - a classic read-write token (BLOB_READ_WRITE_TOKEN, or a renamed *_READ_WRITE_TOKEN)
   - or the newer OIDC connection (BLOB_STORE_ID, or a renamed *_STORE_ID) */
export function blobCreds() {
  const env = process.env, keys = Object.keys(env);
  let token = env.BLOB_READ_WRITE_TOKEN || '';
  if (!token) { const k = keys.find(k => /READ_WRITE_TOKEN$/.test(k) && /^vercel_blob_rw_/.test(env[k] || '')); if (k) token = env[k]; }
  let storeId = env.BLOB_STORE_ID || '';
  if (!storeId) { const k = keys.find(k => /_STORE_ID$/.test(k) && /^store_/.test(env[k] || '')); if (k) storeId = env[k]; }
  const mode = token ? 'token' : storeId ? 'oidc' : 'none';
  const opts = token ? { token } : storeId ? { storeId } : {};
  const names = keys.filter(k => /BLOB|READ_WRITE|STORE_ID/.test(k)).sort();
  return { mode, token, storeId, opts, names };
}
export function storageReady(res) {
  const c = blobCreds();
  if (c.mode !== 'none') return c;
  res.status(503).json({ error: 'Storage is not connected yet. In Vercel: Storage tab, create a Blob store (Public) and connect it to this project, then Redeploy. Storage settings found: ' + (c.names.join(', ') || 'none') });
  return null;
}
