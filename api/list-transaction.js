// api/list-transactions.js
import { ok, bad, githubGetJSON } from './_github.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, { preflight: true });
  if (req.method !== 'GET') return bad(res, 'Method not allowed', 405);
  try {
    const userId = new URL(req.url, 'http://x').searchParams.get('userId');
    if (!userId) return bad(res, 'userId required');

    const txPath = process.env.TX_FILE_PATH;
    const { data: txs } = await githubGetJSON(txPath);

    const list = txs.filter(t => t.userId === userId).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    return ok(res, list);
  } catch (e) {
    return bad(res, e.message, 500);
  }
}