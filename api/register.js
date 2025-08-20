// api/register.js
import { ok, bad, githubGetJSON, githubPutJSON, hashPassword, nowISO, id } from './_github.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return ok(res, { preflight: true });
  if (req.method !== 'POST') return bad(res, 'Method not allowed', 405);
  try {
    const { name, phone, password } = await readJSON(req);
    if (!name || !phone || !password) return bad(res, 'name/phone/password required');

    const usersPath = process.env.USERS_FILE_PATH;
    const { data: users, sha } = await githubGetJSON(usersPath);

    if (users.find(u => u.phone === phone)) return bad(res, 'Nomor sudah terdaftar', 409);

    const user = {
      id: id(),
      name,
      phone,
      passwordHash: hashPassword(password),
      createdAt: nowISO()
    };
    const next = [...users, user];
    await githubPutJSON(usersPath, next, sha);

    // minimal token (JWT bisa, tapi simple token cukup untuk demo)
    const token = simpleToken(user.id, user.phone);
    return ok(res, { token, user: { id: user.id, name: user.name, phone: user.phone } }, 201);
  } catch (e) {
    return bad(res, e.message, 500);
  }
}

function simpleToken(uid, phone) {
  const raw = `${uid}:${phone}:${Date.now()}`;
  return Buffer.from(raw, 'utf8').toString('base64');
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