import { put, list, del } from '@vercel/blob';
import { authed, storageReady } from './_lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!authed(req)) return res.status(401).json({ error: 'Wrong passcode' });
  if (!storageReady(res)) return;
  try {
    const content = req.body && req.body.content;
    if (!content || typeof content !== 'object') return res.status(400).json({ error: 'Nothing to save' });
    const body = JSON.stringify(content);
    if (body.length > 900000) return res.status(413).json({ error: 'Content too large' });
    const blob = await put('content/content.json', body, { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
    // keep only the newest copy
    const { blobs } = await list({ prefix: 'content/' });
    const old = blobs.filter(b => b.url !== blob.url).map(b => b.url);
    if (old.length) await del(old);
    // remove media files that were replaced or removed in the admin panel
    const gone = Array.isArray(req.body.remove) ? req.body.remove.filter(u => typeof u === 'string' && /\.public\.blob\.vercel-storage\.com\/media\//.test(u)) : [];
    if (gone.length) { try { await del(gone); } catch (e) { } }
    return res.status(200).json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
