import { authed } from './_lib.js';
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!authed(req)) return res.status(401).json({ error: 'Wrong passcode' });
  return res.status(200).json({ ok: true, storage: !!process.env.BLOB_READ_WRITE_TOKEN });
}
