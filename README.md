# Management Keuangan — Traveloka Theme

Frontend: HTML + Tailwind + JS (SPA sederhana)  
Backend: Vercel Serverless + GitHub JSON (Contents API)

## Deploy Cepat
1. Fork/clone repo ini.
2. Pastikan di repo target ada file:
   - `Database/users.json` → `[]`
   - `Database/transactions.json` → `[]`
3. Deploy ke Vercel (Import Git repo).
4. Set Environment Variables:
   - `GITHUB_TOKEN`, `GH_OWNER`, `GH_REPO`, `USERS_FILE_PATH`, `TX_FILE_PATH`, `GH_BRANCH`.
5. Buka domain Vercel → gunakan Register lalu Login.

## Endpoint
- POST `/api/register` `{name, phone, password}`
- POST `/api/login` `{phone, password}`
- POST `/api/add-transaction` `{userId, type, source, method, amount, item}`
- GET `/api/list-transactions?userId=...`
- PUT `/api/update-transaction` `{id, userId, ...opsional}`
- DELETE `/api/delete-transaction` `{id, userId}`

> Catatan: Password di-hash SHA-256 sebagai demo. Untuk produksi, gunakan bcrypt/argon2.