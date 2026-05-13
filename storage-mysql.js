const bcrypt = require('bcrypt');
const { getPool, initMysql, publicUser, mapProfile, mapDocument, mapCuration, mapLog } = require('./database');

async function init() { await initMysql(); }

async function counts() {
  const db = getPool();
  const [[u]] = await db.query('SELECT COUNT(*) total FROM users');
  const [[p]] = await db.query('SELECT COUNT(*) total FROM profiles');
  const [[d]] = await db.query('SELECT COUNT(*) total FROM documents');
  const [[c]] = await db.query('SELECT COUNT(*) total FROM curations');
  return { users: u.total, profiles: p.total, documents: d.total, curations: c.total };
}

async function registerUser({ username, password, role }) {
  const db = getPool();
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username,password,role) VALUES (?,?,?)', [username, hash, role || 'sanggar']);
  await addLog(username, 'REGISTER', `Akun role ${role || 'sanggar'} dibuat`);
  return { username, role: role || 'sanggar' };
}

async function findUser(username) {
  const [rows] = await getPool().query('SELECT * FROM users WHERE LOWER(username)=LOWER(?) LIMIT 1', [username]);
  return rows[0] || null;
}

async function addLog(actor, action, detail = '') {
  await getPool().query('INSERT INTO activity_logs (actor, action, detail) VALUES (?, ?, ?)', [actor, action, detail]);
}

async function summary() {
  const c = await counts();
  const [logs] = await getPool().query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 8');
  return { ...c, latestLogs: logs.map(mapLog) };
}

async function listProfiles(user) {
  const sql = user.role === 'sanggar' ? 'SELECT * FROM profiles WHERE owner=? ORDER BY id DESC' : 'SELECT * FROM profiles ORDER BY id DESC';
  const [rows] = await getPool().query(sql, user.role === 'sanggar' ? [user.username] : []);
  return rows.map(mapProfile);
}

async function saveProfile(user, b) {
  const [r] = await getPool().query(
    'INSERT INTO profiles (owner,nama_sanggar,jenis_kesenian,kedudukan,alamat,no_hp,ketua,bank,rekening,status_administrasi) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [user.username, b.namaSanggar, b.jenisKesenian || '', b.kedudukan || '', b.alamat || '', b.noHp || '', b.ketua || '', b.bank || '', b.rekening || '', b.statusAdministrasi || 'Draft']
  );
  await addLog(user.username, 'SIMPAN_PROFIL', b.namaSanggar);
  return { id: r.insertId, ...b, owner: user.username };
}

async function listDocuments(user) {
  const sql = user.role === 'sanggar' ? 'SELECT * FROM documents WHERE owner=? ORDER BY id DESC' : 'SELECT * FROM documents ORDER BY id DESC';
  const [rows] = await getPool().query(sql, user.role === 'sanggar' ? [user.username] : []);
  return rows.map(mapDocument);
}

async function saveDocument(user, b, isi) {
  const [r] = await getPool().query(
    'INSERT INTO documents (owner,jenis_dokumen,nama_sanggar,status,isi) VALUES (?,?,?,?,?)',
    [user.username, b.jenisDokumen, b.namaSanggar || '', b.status || 'Draft', isi]
  );
  await addLog(user.username, 'SIMPAN_DOKUMEN', b.jenisDokumen);
  return { id: r.insertId, owner: user.username, jenisDokumen: b.jenisDokumen, namaSanggar: b.namaSanggar || '', status: b.status || 'Draft', isi };
}

async function listCurations(user) {
  const sql = user.role === 'sanggar' ? 'SELECT * FROM curations WHERE owner=? ORDER BY id DESC' : 'SELECT * FROM curations ORDER BY id DESC';
  const [rows] = await getPool().query(sql, user.role === 'sanggar' ? [user.username] : []);
  return rows.map(mapCuration);
}

async function saveCuration(user, b) {
  const owner = user.role === 'sanggar' ? user.username : (b.owner || user.username);
  const [r] = await getPool().query(
    'INSERT INTO curations (owner,nama_sanggar,status,catatan,skor_administrasi,skor_aktivitas,skor_sdm) VALUES (?,?,?,?,?,?,?)',
    [owner, b.namaSanggar || '', b.status || 'Menunggu Pemeriksaan', b.catatan || '', Number(b.skorAdministrasi || 0), Number(b.skorAktivitas || 0), Number(b.skorSDM || 0)]
  );
  await addLog(user.username, 'SIMPAN_KURASI', b.namaSanggar || b.status || 'Kurasi');
  return { id: r.insertId, owner, ...b };
}

async function logs() {
  const [rows] = await getPool().query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 100');
  return rows.map(mapLog);
}

async function exportData() {
  const db = getPool();
  const [users] = await db.query('SELECT username,role,created_at FROM users');
  const [profiles] = await db.query('SELECT * FROM profiles');
  const [documents] = await db.query('SELECT * FROM documents');
  const [curations] = await db.query('SELECT * FROM curations');
  const [activityLogs] = await db.query('SELECT * FROM activity_logs');
  return { users, profiles, documents, curations, activityLogs };
}

module.exports = { init, counts, registerUser, findUser, publicUser, addLog, summary, listProfiles, saveProfile, listDocuments, saveDocument, listCurations, saveCuration, logs, exportData };
