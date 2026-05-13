const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error('ADMIN_USERNAME dan ADMIN_PASSWORD wajib diisi.');
  console.error('Contoh: ADMIN_USERNAME=admin ADMIN_PASSWORD=123456 node scripts/create-admin.js');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password minimal 6 karakter.');
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], profiles: [], documents: [], curations: [], logs: [] }, null, 2));
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');
  db.users = db.users || [];
  db.profiles = db.profiles || [];
  db.documents = db.documents || [];
  db.curations = db.curations || [];
  db.logs = db.logs || [];

  const existingIndex = db.users.findIndex(u => String(u.username).toLowerCase() === username.toLowerCase());
  const adminUser = {
    username,
    password: await bcrypt.hash(password, 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) db.users[existingIndex] = { ...db.users[existingIndex], ...adminUser };
  else db.users.push(adminUser);

  db.logs.unshift({
    id: Date.now().toString(),
    actor: 'system',
    action: 'CREATE_ADMIN',
    detail: 'Admin dibuat atau direset melalui script VPS',
    createdAt: new Date().toISOString()
  });

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log('Admin berhasil dibuat/direset:', username);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
