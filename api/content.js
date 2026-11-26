import { list } from '@vercel/blob';
// returns the newest saved content.json (or {} if nothing saved yet)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({});
  try {
    const { blobs } = await list({ prefix: 'content/' });
    if (!blobs.length) return res.status(200).json({});
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!r.ok) throw new Error('could not read content (' + r.status + ')');
    return res.status(200).json(await r.json());
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
