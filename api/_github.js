// api/_github.js
import crypto from 'node:crypto';

const owner = process.env.wanz-code;
const repo = process.env.management;
const branch = process.env.main || 'main';
const token = process.env.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;

const base = `https://api.github.com/repos/${owner}/${repo}/contents`;

function ok(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify({ success: true, data }));
}

function bad(res, message, status = 400) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify({ success: false, message }));
}

async function githubGetJSON(path) {
  const url = `${base}/${encodeURIComponent(path)}?ref=${branch}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vercel-fn',
      Accept: 'application/vnd.github+json'
    }
  });
  if (!r.ok) throw new Error(`GitHub GET failed: ${r.status}`);
  const json = await r.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  return { data: JSON.parse(content || '[]'), sha: json.sha };
}

async function githubPutJSON(path, nextData, sha) {
  const url = `${base}/${encodeURIComponent(path)}`;
  const body = {
    message: `update ${path} ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(nextData, null, 2), 'utf8').toString('base64'),
    sha,
    branch
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'vercel-fn',
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`GitHub PUT failed: ${r.status} ${t}`);
  }
  return await r.json();
}

function hashPassword(pw) {
  // fast hash (bukan bcrypt) untuk demo; bisa ganti argon/bcrypt di backend lain
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function nowISO() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

export { ok, bad, githubGetJSON, githubPutJSON, hashPassword, nowISO, id };