// api/add-transaction.js
import { ok, bad, githubGetJSON, githubPutJSON, id, nowISO } from './_github.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, { preflight: true });
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);
  try {
    const txPath = process.env.TX_FILE_PATH;
    const { data: txs, sha } = await githubGetJSON(txPath);

    const { userId, type, source, method, amount, item } = await readJSON(req);
    if (!userId || !type || !source || !method || !amount || !item) {
      return bad(res, 'Missing fields');
    }

    const entry = {
      id: id(),
      userId,
      type,        // 'pemasukan' | 'pengeluaran'
      source,      // 'uang saku' | 'keluarga' | 'teman' | 'job'
      method,      // 'cash' | 'e-wallet' | 'rekening'
      amount: Number(amount),
      item,
      createdAt: nowISO()
    };
    const next = [...txs, entry];
    await githubPutJSON(txPath, next, sha);

    return ok(res, entry, 201);
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