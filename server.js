const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SECRET_KEY = process.env.SECRET_KEY || (IS_PRODUCTION ? '' : 'dev_secret_key_ganti_saat_produksi');
if (!SECRET_KEY) throw new Error('SECRET_KEY wajib diisi pada mode production.');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const OLD_USERS_FILE = path.join(__dirname, 'users.json');
const MASTER_KURATOR_USERNAME = process.env.MASTER_KURATOR_USERNAME || 'kurator';
const MASTER_KURATOR_PASSWORD = process.env.MASTER_KURATOR_PASSWORD || '123456';

const PUBLIC_REGISTER_ROLES = ['sanggar', 'seniman', 'juri', 'jasa_sewa'];
const KURATOR_MANAGED_ROLES = ['admin', 'operator', 'kurator', 'verifikator', 'user'];
const ALL_ROLES = ['master_kurator', ...KURATOR_MANAGED_ROLES, ...PUBLIC_REGISTER_ROLES];
const DATA_ACCESS_ROLES = ['master_kurator', 'admin', 'operator', 'kurator', 'verifikator'];

const ROLE_LABELS = {
  master_kurator: 'Master Kurator',
  admin: 'Admin',
  operator: 'Operator',
  kurator: 'Kurator',
  verifikator: 'Verifikator',
  user: 'User Internal',
  sanggar: 'Sanggar',
  seniman: 'Seniman',
  juri: 'Juri',
  jasa_sewa: 'Jasa Sewa'
};

function normalizeRole(role) {
  return String(role || 'sanggar').trim().toLowerCase().replace(/\s+/g, '_');
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const users = fs.existsSync(OLD_USERS_FILE) ? JSON.parse(fs.readFileSync(OLD_USERS_FILE, 'utf8') || '[]') : [];
    fs.writeFileSync(DB_FILE, JSON.stringify({ users, profiles: [], documents: [], curations: [], logs: [] }, null, 2));
  }
  ensureMasterKurator();
}

function ensureMasterKurator() {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');
  db.users = db.users || [];
  const existing = db.users.find(u => u.username.toLowerCase() === MASTER_KURATOR_USERNAME.toLowerCase());
  const now = new Date().toISOString();
  if (!existing) {
    const hash = bcrypt.hashSync(MASTER_KURATOR_PASSWORD, 10);
    db.users.push({ username: MASTER_KURATOR_USERNAME, password: hash, role: 'master_kurator', createdBy: 'system', createdAt: now, updatedAt: now });
    db.logs = db.logs || [];
    db.logs.unshift({ id: Date.now().toString(), actor: 'system', action: 'INIT_MASTER_KURATOR', detail: `Akun master kurator ${MASTER_KURATOR_USERNAME} dibuat`, createdAt: now });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } else if (existing.role !== 'master_kurator') {
    existing.role = 'master_kurator';
    existing.updatedAt = now;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
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
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function sanitizeUser(user) {
  const role = normalizeRole(user.role || 'user');
  return { username: user.username, role, roleLabel: ROLE_LABELS[role] || role, createdBy: user.createdBy || '', createdAt: user.createdAt, updatedAt: user.updatedAt || '' };
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

function requireMasterKurator(req, res, next) {
  if (req.user?.role !== 'master_kurator') return res.status(403).json({ message: 'Akses ditolak. Hanya akun master kurator/kurator utama yang dapat mengelola akun selain register mandiri.' });
  next();
}

function canSeeAllData(role) {
  return DATA_ACCESS_ROLES.includes(role);
}

app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || (IS_PRODUCTION ? '' : '*');
  if (origin) res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  const db = readDb();
  res.json({ status: 'ok', app: 'Jak Sanggar', port: Number(PORT), users: db.users.length, profiles: db.profiles.length, documents: db.documents.length, curations: db.curations.length, publicRegisterRoles: PUBLIC_REGISTER_ROLES, managedRoles: KURATOR_MANAGED_ROLES, time: new Date().toISOString() });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const role = normalizeRole(req.body?.role || 'sanggar');
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });
    if (!PUBLIC_REGISTER_ROLES.includes(role)) return res.status(403).json({ message: 'Pendaftaran mandiri hanya untuk akun sanggar, seniman, juri, dan jasa sewa. Akun selain itu dibuat oleh akun kurator/master kurator.' });

    const db = readDb();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ message: 'Username sudah terdaftar' });

    const now = new Date().toISOString();
    const user = { username, password: await bcrypt.hash(password, 10), role, createdBy: 'self_register', createdAt: now, updatedAt: now };
    db.users.push(user);
    db.logs.unshift({ id: Date.now().toString(), actor: username, action: 'REGISTER_MANDIRI', detail: `Akun ${ROLE_LABELS[role] || role} dibuat mandiri`, createdAt: now });
    writeDb(db);
    res.status(201).json({ message: 'Akun berhasil didaftarkan', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server gagal memproses register' });
  }
});

app.post('/api/users', auth, requireMasterKurator, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const role = normalizeRole(req.body?.role);
    if (!username || !password || !role) return res.status(400).json({ message: 'Username, password, dan role wajib diisi' });
    if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });
    if (!KURATOR_MANAGED_ROLES.includes(role)) return res.status(400).json({ message: 'Akun kurator hanya dapat membuat role: admin, operator, kurator, verifikator, atau user internal.' });

    const db = readDb();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ message: 'Username sudah terdaftar' });

    const now = new Date().toISOString();
    const user = { username, password: await bcrypt.hash(password, 10), role, createdBy: req.user.username, createdAt: now, updatedAt: now };
    db.users.push(user);
    db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'BUAT_AKUN_INTERNAL', detail: `Membuat akun ${username} sebagai ${ROLE_LABELS[role] || role}`, createdAt: now });
    writeDb(db);
    res.status(201).json({ message: 'Akun berhasil dibuat oleh kurator', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server gagal membuat akun' });
  }
});

app.get('/api/users', auth, requireMasterKurator, (req, res) => {
  const db = readDb();
  res.json(db.users.map(sanitizeUser));
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User belum terdaftar. Silakan register terlebih dahulu.' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Password salah' });
    const role = normalizeRole(user.role || 'user');
    const token = jwt.sign({ username: user.username, role }, SECRET_KEY, { expiresIn: '1d' });
    addLog(user.username, 'LOGIN', 'Pengguna berhasil login');
    res.json({ message: 'Login berhasil', token, user: sanitizeUser({ ...user, role }) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server gagal memproses login' });
  }
});

app.get('/api/me', auth, (req, res) => res.json({ user: { ...req.user, roleLabel: ROLE_LABELS[req.user.role] || req.user.role } }));

app.get('/api/summary', auth, (req, res) => {
  const db = readDb();
  res.json({
    users: canSeeAllData(req.user.role) ? db.users.length : 1,
    profiles: canSeeAllData(req.user.role) ? db.profiles.length : db.profiles.filter(p => p.owner === req.user.username).length,
    documents: canSeeAllData(req.user.role) ? db.documents.length : db.documents.filter(d => d.owner === req.user.username).length,
    curations: canSeeAllData(req.user.role) ? db.curations.length : db.curations.filter(c => c.owner === req.user.username).length,
    latestLogs: db.logs.slice(0, 8)
  });
});

app.get('/api/profiles', auth, (req, res) => {
  const db = readDb();
  if (!canSeeAllData(req.user.role)) return res.json(db.profiles.filter(p => p.owner === req.user.username));
  res.json(db.profiles);
});

app.post('/api/profiles', auth, (req, res) => {
  const db = readDb();
  const body = req.body || {};
  if (!body.namaSanggar) return res.status(400).json({ message: 'Nama sanggar wajib diisi' });
  const profile = {
    id: body.id || Date.now().toString(),
    owner: body.owner && canSeeAllData(req.user.role) ? body.owner : req.user.username,
    ownerRole: req.user.role,
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
  const idx = db.profiles.findIndex(p => p.id === profile.id && (p.owner === req.user.username || canSeeAllData(req.user.role)));
  if (idx >= 0) db.profiles[idx] = { ...db.profiles[idx], ...profile };
  else db.profiles.push(profile);
  db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'SIMPAN_PROFIL', detail: profile.namaSanggar, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ message: 'Profil berhasil disimpan', profile });
});

app.get('/api/documents', auth, (req, res) => {
  const db = readDb();
  if (!canSeeAllData(req.user.role)) return res.json(db.documents.filter(d => d.owner === req.user.username));
  res.json(db.documents);
});

app.post('/api/documents', auth, (req, res) => {
  const db = readDb();
  const body = req.body || {};
  if (!body.jenisDokumen) return res.status(400).json({ message: 'Jenis dokumen wajib dipilih' });
  const document = {
    id: body.id || Date.now().toString(),
    owner: body.owner && canSeeAllData(req.user.role) ? body.owner : req.user.username,
    jenisDokumen: body.jenisDokumen,
    namaSanggar: body.namaSanggar || '',
    status: body.status || 'Draft',
    isi: body.isi || generateDocumentText(body),
    updatedAt: new Date().toISOString(),
    createdAt: body.createdAt || new Date().toISOString()
  };
  const idx = db.documents.findIndex(d => d.id === document.id && (d.owner === req.user.username || canSeeAllData(req.user.role)));
  if (idx >= 0) db.documents[idx] = { ...db.documents[idx], ...document };
  else db.documents.push(document);
  db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'SIMPAN_DOKUMEN', detail: document.jenisDokumen, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ message: 'Dokumen berhasil disimpan', document });
});

function generateDocumentText(body) {
  const nama = body.namaSanggar || '................................';
  if (body.jenisDokumen === 'Berita Acara Pembentukan Organisasi' || body.jenisDokumen === 'Berita Acara') return `BERITA ACARA PEMBENTUKAN ORGANISASI\n${nama}\n\nPada hari ini telah dilaksanakan musyawarah pembentukan organisasi/sanggar. Peserta rapat menyepakati pembentukan ${nama}, susunan pengurus, tugas dan fungsi, serta kelengkapan administrasi internal.`;
  if (body.jenisDokumen === 'Berita Acara Pembentukan Sanggar') return `BERITA ACARA PEMBENTUKAN SANGGAR\n${nama}\n\nPara pihak menyepakati pembentukan ${nama} sebagai wadah kegiatan seni, pelatihan, pembinaan, pengembangan, pementasan, dan tata kelola administrasi sanggar.`;
  if (body.jenisDokumen === 'SK Pembentukan Sanggar' || body.jenisDokumen === 'SK Pembentukan') return `SURAT KEPUTUSAN\nTENTANG PEMBENTUKAN SANGGAR ${nama}\n\nKESATU: Membentuk ${nama} sebagai wadah kegiatan seni dan kebudayaan.\nKEDUA: Menetapkan tugas dan fungsi sanggar sebagaimana diatur dalam lampiran.\nKETIGA: Keputusan ini berlaku sejak tanggal ditetapkan.`;
  if (body.jenisDokumen === 'SK Pengangkatan Pengurus') return `SURAT KEPUTUSAN\nTENTANG PENGANGKATAN PENGURUS ${nama}\n\nKESATU: Mengangkat pengurus ${nama}.\nKEDUA: Pengurus melaksanakan tugas sesuai struktur dan fungsi.\nKETIGA: Susunan pengurus tercantum dalam lampiran keputusan.`;
  if (body.jenisDokumen === 'Anggaran Dasar') return `ANGGARAN DASAR ${nama}\n\nDokumen ini mengatur nama, kedudukan, asas, tujuan, fungsi, keanggotaan, musyawarah, kepengurusan, keuangan, atribut, dan perubahan anggaran dasar.`;
  if (body.jenisDokumen === 'Anggaran Rumah Tangga') return `ANGGARAN RUMAH TANGGA ${nama}\n\nDokumen ini mengatur tata kerja, mekanisme rapat, administrasi, tugas pengurus, penambahan jenis kesenian, atribut, dan tata kelola internal sanggar.`;
  return `DOKUMEN ${body.jenisDokumen || ''} ${nama}`;
}

app.get('/api/curations', auth, (req, res) => {
  const db = readDb();
  if (!canSeeAllData(req.user.role)) return res.json(db.curations.filter(c => c.owner === req.user.username));
  res.json(db.curations);
});

app.post('/api/curations', auth, (req, res) => {
  const db = readDb();
  const body = req.body || {};
  const curation = {
    id: body.id || Date.now().toString(),
    owner: body.owner && canSeeAllData(req.user.role) ? body.owner : req.user.username,
    namaSanggar: body.namaSanggar || '',
    status: body.status || 'Menunggu Pemeriksaan',
    catatan: body.catatan || '',
    skorAdministrasi: Number(body.skorAdministrasi || 0),
    skorAktivitas: Number(body.skorAktivitas || 0),
    skorSDM: Number(body.skorSDM || 0),
    updatedAt: new Date().toISOString(),
    createdAt: body.createdAt || new Date().toISOString()
  };
  if (!canSeeAllData(req.user.role)) curation.owner = req.user.username;
  const idx = db.curations.findIndex(c => c.id === curation.id && (c.owner === req.user.username || canSeeAllData(req.user.role)));
  if (idx >= 0) db.curations[idx] = { ...db.curations[idx], ...curation };
  else db.curations.push(curation);
  db.logs.unshift({ id: Date.now().toString(), actor: req.user.username, action: 'SIMPAN_KURASI', detail: curation.namaSanggar || curation.status, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ message: 'Data kurasi berhasil disimpan', curation });
});

app.get('/api/logs', auth, (req, res) => {
  const db = readDb();
  if (req.user.role !== 'master_kurator' && req.user.role !== 'admin') return res.json(db.logs.filter(l => l.actor === req.user.username).slice(0, 100));
  res.json(db.logs.slice(0, 100));
});

app.get('/api/export', auth, (req, res) => {
  if (req.user.role !== 'master_kurator' && req.user.role !== 'admin') return res.status(403).json({ message: 'Export seluruh data hanya untuk master kurator dan admin.' });
  const db = readDb();
  res.json({ exportedAt: new Date().toISOString(), data: db });
});

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan', path: req.originalUrl }));

ensureDb();
app.listen(PORT, '0.0.0.0', () => console.log(`Jak Sanggar running on http://0.0.0.0:${PORT}`));
