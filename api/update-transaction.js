// api/update-transaction.js
import { ok, bad, githubGetJSON, githubPutJSON } from './_github.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, { preflight: true });
  if (req.method !== 'PUT') return bad(res, 'Method not allowed', 405);
  try {
    const { id, userId, type, source, method, amount, item } = await readJSON(req);
    if (!id || !userId) return bad(res, 'id/userId required');

    const txPath = process.env.TX_FILE_PATH;
    const { data: txs, sha } = await githubGetJSON(txPath);

    const idx = txs.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return bad(res, 'Transaksi tidak ditemukan', 404);

    const old = txs[idx];
    const upd = {
      ...old,
      type: type ?? old.type,
      source: source ?? old.source,
      method: method ?? old.method,
      amount: amount != null ? Number(amount) : old.amount,
      item: item ?? old.item
    };
    const next = [...txs];
    next[idx] = upd;

    await githubPutJSON(txPath, next, sha);
    return ok(res, upd);
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