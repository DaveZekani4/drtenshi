import { authed, blobCreds } from './_lib.js';
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!authed(req)) return res.status(401).json({ error: 'Wrong passcode' });
  const c = blobCreds();
  return res.status(200).json({ ok: true, storage: c.mode !== 'none', mode: c.mode, found: c.names });
}
