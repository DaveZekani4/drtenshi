import { handleUpload, handleUploadPresigned } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { PASS, storageReady } from './_lib.js';
const TYPES = ['audio/*', 'video/*', 'image/*', 'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream', 'text/plain'];
const MAX = 500 * 1024 * 1024;
function check(pathname, clientPayload) {
  if (clientPayload !== PASS) throw new Error('Wrong passcode');
  if (!pathname.startsWith('media/')) throw new Error('Bad path');
}
// gives the admin page permission to upload big files (music, video) straight to Blob storage
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const c = storageReady(res); if (!c) return;
  try {
    if (c.mode === 'token') {
      const json = await handleUpload({
        body: req.body, request: req, token: c.token,
        onBeforeGenerateToken: async (pathname, clientPayload) => { check(pathname, clientPayload); return { allowedContentTypes: TYPES, maximumSizeInBytes: MAX, addRandomSuffix: true }; }
      });
      return res.status(200).json(json);
    }
    // OIDC-connected store (no static token): presigned uploads
    const json = await handleUploadPresigned({
      body: req.body, request: req, webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || 'unused',
      getSignedToken: async (pathname, clientPayload) => {
        check(pathname, clientPayload);
        const token = await issueSignedToken({ pathname, operations: ['put'], allowedContentTypes: TYPES, maximumSizeInBytes: MAX, ...c.opts });
        return { token, urlOptions: { addRandomSuffix: true, allowedContentTypes: TYPES, maximumSizeInBytes: MAX } };
      }
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}
