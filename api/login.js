// api/login.js
import { ok, bad, githubGetJSON, hashPassword } from './_github.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, { preflight: true });
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);
  try {
    const { phone, password } = await readJSON(req);
    if (!phone || !password) return bad(res, 'phone/password required');

    const usersPath = process.env.USERS_FILE_PATH;
    const { data: users } = await githubGetJSON(usersPath);

    const u = users.find(x => x.phone === phone);
    if (!u) return bad(res, 'Akun tidak ditemukan', 404);

    if (u.passwordHash !== hashPassword(password)) return bad(res, 'Password salah', 401);

    const token = Buffer.from(`${u.id}:${u.phone}:${Date.now()}`, 'utf8').toString('base64');
    return ok(res, { token, user: { id: u.id, name: u.name, phone: u.phone } });
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