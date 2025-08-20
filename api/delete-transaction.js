// api/delete-transaction.js
import { ok, bad, githubGetJSON, githubPutJSON } from './_github.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, { preflight: true });
  if (req.method !== 'DELETE') return bad(res, 'Method not allowed', 405);
  try {
    const { id, userId } = await readJSON(req);
    if (!id || !userId) return bad(res, 'id/userId required');

    const txPath = process.env.TX_FILE_PATH;
    const { data: txs, sha } = await githubGetJSON(txPath);

    const next = txs.filter(t => !(t.id === id && t.userId === userId));
    if (next.length === txs.length) return bad(res, 'Transaksi tidak ditemukan', 404);

    await githubPutJSON(txPath, next, sha);
    return ok(res, { id });
  } catch (e) {
    return bad(res, e.message, 500);
  }
}

function readJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (e) { reject(e); }
    });
  });
}