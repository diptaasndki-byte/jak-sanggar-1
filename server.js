const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'ganti_secret_key_ini_di_env';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const OLD_USERS_FILE = path.join(__dirname, 'users.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const users = fs.existsSync(OLD_USERS_FILE) ? JSON.parse(fs.readFileSync(OLD_USERS_FILE, 'utf8') || '[]') : [];
    fs.writeFileSync(DB_FILE, JSON.stringify({ users, profiles: [], documents: [], curations: [], logs: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');
  return {
    users: db.users || [],
    profiles: db.profiles || [],
    documents: db.documents || [],
    curations: db.curations || [],
    logs: db.logs || []
  };
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function sanitizeUser(user) {
  return { username: user.username, role: user.role || 'user', createdAt: user.createdAt };
}

function addLog(actor, action, detail = '') {
  const db = readDb();
  db.logs.unshift({ id: Date.now().toString(), actor, action, detail, createdAt: new Date().toISOString() });
  db.logs = db.logs.slice(0, 200);
  writeDb(db);
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token tidak ada. Silakan login ulang.' });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  const db = readDb();
  res.json({
    status: 'ok',
    app: 'Jak Sanggar',
    port: Number(PORT),
    users: db.users.length,
    profiles: db.profiles.length,
    documents: db.documents.length,
    curations: db.curations.length,
    time: new Date().toISOString()
  });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'sanggar' } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });
    const allowedRoles = ['admin', 'operator', 'kurator', 'sanggar', 'user'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Role tidak valid' });

    const db = readDb();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ message: 'Username sudah terdaftar' });
    }

    const user = { username, password: await bcrypt.hash(password, 10), role, createdAt: new Date().toISOString() };
    db.users.push(user);
    db.logs.unshift({ id: Date.now().toString(), actor: username, action: 'REGISTER', detail: `Akun role ${role} dibuat`, createdAt: new Date().toISOString() });
    writeDb(db);
    res.status(201).json({ message: 'User berhasil didaftarkan', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server gagal memproses register' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User belum terdaftar. Silakan register terlebih dahulu.' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Password salah' });
    const token = jwt.sign({ username: user.username, role: user.role || 'user' }, SECRET_KEY, { expiresIn: '1d' });
    addLog(user.username, 'LOGIN', 'Pengguna berhasil login');
    res.json({ message: 'Login berhasil', token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server gagal memproses login' });
  }
});

app.get('/api/me', auth, (req, res) => res.json({ user: req.user }));

app.get('/api/summary', auth, (req, res) => {
  const db = readDb();
  res.json({
    users: db.users.length,
    profiles: db.profiles.length,
    documents: db.documents.length,
    curations: db.curations.length,
    latestLogs: db.logs.slice(0, 8)
  });
});

app.get('/api/profiles', auth, (req, res) => {
  const db = readDb();
  if (req.user.role === 'sanggar') return res.json(db.profiles.filter(p => p.owner === req.user.username));
  res.json(db.profiles);
});

app.post('/api/profiles', auth, (req, res) => {
  const db = readDb();
  const body = req.body || {};
  if (!body.namaSanggar) return res.status(400).json({ message: 'Nama sanggar wajib diisi' });
  const profile = {
    id: body.id || Date.now().toString(),
    owner: req.user.username,
    namaSanggar: body.namaSanggar,
    jenisKesenian: body.jenisKesenian || '',
    kedudukan: body.kedudukan || 'Komunitas/Sanggar Mandiri',
    alamat: body.alamat || '',
    noHp: body.noHp || '',
    ketua: body.ketua || '',
    bank: body.bank || '',
    rekening: body.rekening || '',
    statusAdministrasi: body.statusAdministrasi || 'Draft',
    updatedAt: new Date().toISOString(),
    createdAt: body.createdAt || new Date().toISOString()
  };
  const idx = db.profiles.findIndex(p => p.id === profile.id && (p.owner === req.user.username || req.user.role !== 'sanggar'));
  if (idx >= 0) db.profiles[idx] = { ...db.profiles[idx], ...profile };
  else db.profiles.push(profile);
  db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'SIMPAN_PROFIL', detail: profile.namaSanggar, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ message: 'Profil sanggar berhasil disimpan', profile });
});

app.get('/api/documents', auth, (req, res) => {
  const db = readDb();
  if (req.user.role === 'sanggar') return res.json(db.documents.filter(d => d.owner === req.user.username));
  res.json(db.documents);
});

app.post('/api/documents', auth, (req, res) => {
  const db = readDb();
  const body = req.body || {};
  if (!body.jenisDokumen) return res.status(400).json({ message: 'Jenis dokumen wajib dipilih' });
  const document = {
    id: body.id || Date.now().toString(),
    owner: req.user.username,
    jenisDokumen: body.jenisDokumen,
    namaSanggar: body.namaSanggar || '',
    status: body.status || 'Draft',
    isi: body.isi || generateDocumentText(body),
    updatedAt: new Date().toISOString(),
    createdAt: body.createdAt || new Date().toISOString()
  };
  const idx = db.documents.findIndex(d => d.id === document.id && (d.owner === req.user.username || req.user.role !== 'sanggar'));
  if (idx >= 0) db.documents[idx] = { ...db.documents[idx], ...document };
  else db.documents.push(document);
  db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'SIMPAN_DOKUMEN', detail: document.jenisDokumen, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ message: 'Dokumen berhasil disimpan', document });
});

function generateDocumentText(body) {
  const nama = body.namaSanggar || '................................';
  if (body.jenisDokumen === 'Berita Acara') return `BERITA ACARA PEMBENTUKAN ${nama}\n\nPada hari ini telah dilaksanakan musyawarah pembentukan organisasi sanggar. Peserta rapat menyepakati pembentukan ${nama}, susunan pengurus, tugas dan fungsi, serta kelengkapan administrasi internal sanggar.`;
  if (body.jenisDokumen === 'SK Pembentukan') return `SURAT KEPUTUSAN\nTENTANG PEMBENTUKAN ORGANISASI DAN PENGANGKATAN PENGURUS ${nama}\n\nMenetapkan pembentukan ${nama} sebagai wadah pembinaan, pelatihan, pengembangan, pelestarian, produksi karya, dan kegiatan kesenian.`;
  if (body.jenisDokumen === 'Anggaran Dasar') return `ANGGARAN DASAR ${nama}\n\nDokumen ini mengatur nama, kedudukan, asas, tujuan, fungsi, keanggotaan, musyawarah, kepengurusan, keuangan, atribut, dan perubahan anggaran dasar.`;
  if (body.jenisDokumen === 'Anggaran Rumah Tangga') return `ANGGARAN RUMAH TANGGA ${nama}\n\nDokumen ini mengatur tata kerja, mekanisme rapat, administrasi, tugas pengurus, penambahan jenis kesenian, atribut, dan tata kelola internal sanggar.`;
  return `DOKUMEN ${body.jenisDokumen || ''} ${nama}`;
}

app.get('/api/curations', auth, (req, res) => {
  const db = readDb();
  if (req.user.role === 'sanggar') return res.json(db.curations.filter(c => c.owner === req.user.username));
  res.json(db.curations);
});

app.post('/api/curations', auth, (req, res) => {
  const db = readDb();
  const body = req.body || {};
  const curation = {
    id: body.id || Date.now().toString(),
    owner: body.owner || req.user.username,
    namaSanggar: body.namaSanggar || '',
    status: body.status || 'Menunggu Pemeriksaan',
    catatan: body.catatan || '',
    skorAdministrasi: Number(body.skorAdministrasi || 0),
    skorAktivitas: Number(body.skorAktivitas || 0),
    skorSDM: Number(body.skorSDM || 0),
    updatedAt: new Date().toISOString(),
    createdAt: body.createdAt || new Date().toISOString()
  };
  if (req.user.role === 'sanggar') curation.owner = req.user.username;
  const idx = db.curations.findIndex(c => c.id === curation.id && (c.owner === req.user.username || req.user.role !== 'sanggar'));
  if (idx >= 0) db.curations[idx] = { ...db.curations[idx], ...curation };
  else db.curations.push(curation);
  db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'SIMPAN_KURASI', detail: curation.namaSanggar || curation.status, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ message: 'Data kurasi berhasil disimpan', curation });
});

app.get('/api/logs', auth, (req, res) => {
  const db = readDb();
  res.json(db.logs.slice(0, 100));
});

app.get('/api/export', auth, (req, res) => {
  const db = readDb();
  res.json({ exportedAt: new Date().toISOString(), data: db });
});

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan', path: req.originalUrl }));

ensureDb();
app.listen(PORT, '0.0.0.0', () => console.log(`Jak Sanggar running on http://0.0.0.0:${PORT}`));
