import { handleUpload } from '@vercel/blob/client';
import { PASS, storageReady } from './_lib.js';
// issues short-lived upload tokens so the admin page can upload big files (music, video) straight to Blob storage
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!storageReady(res)) return;
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (clientPayload !== PASS) throw new Error('Wrong passcode');
        if (!pathname.startsWith('media/')) throw new Error('Bad path');
        return {
          allowedContentTypes: ['audio/*', 'video/*', 'image/*', 'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream', 'text/plain'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true
        };
      }
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}
