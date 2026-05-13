const mysql = require('mysql2/promise');

let pool = null;

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://'));
}

function getPool() {
  if (!hasDatabaseUrl()) return null;
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'dateStrings=true&connectionLimit=10');
  }
  return pool;
}

async function initMysql() {
  const db = getPool();
  if (!db) return false;

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sanggar',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner VARCHAR(120) NOT NULL,
    nama_sanggar VARCHAR(255) NOT NULL,
    jenis_kesenian VARCHAR(255),
    kedudukan VARCHAR(255),
    alamat TEXT,
    no_hp VARCHAR(80),
    ketua VARCHAR(255),
    bank VARCHAR(120),
    rekening VARCHAR(120),
    status_administrasi VARCHAR(120) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner VARCHAR(120) NOT NULL,
    jenis_dokumen VARCHAR(120) NOT NULL,
    nama_sanggar VARCHAR(255),
    status VARCHAR(120) DEFAULT 'Draft',
    isi LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS curations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner VARCHAR(120) NOT NULL,
    nama_sanggar VARCHAR(255),
    status VARCHAR(120) DEFAULT 'Menunggu Pemeriksaan',
    catatan TEXT,
    skor_administrasi INT DEFAULT 0,
    skor_aktivitas INT DEFAULT 0,
    skor_sdm INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor VARCHAR(120),
    action VARCHAR(120),
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  return true;
}

async function addLog(actor, action, detail = '') {
  const db = getPool();
  if (!db) return false;
  await db.query('INSERT INTO activity_logs (actor, action, detail) VALUES (?, ?, ?)', [actor, action, detail]);
  return true;
}

function mapUser(row) {
  return { username: row.username, password: row.password, role: row.role, createdAt: row.created_at };
}

function publicUser(row) {
  return { username: row.username, role: row.role || 'user', createdAt: row.created_at };
}

function mapProfile(row) {
  return { id: String(row.id), owner: row.owner, namaSanggar: row.nama_sanggar, jenisKesenian: row.jenis_kesenian || '', kedudukan: row.kedudukan || '', alamat: row.alamat || '', noHp: row.no_hp || '', ketua: row.ketua || '', bank: row.bank || '', rekening: row.rekening || '', statusAdministrasi: row.status_administrasi || 'Draft', createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapDocument(row) {
  return { id: String(row.id), owner: row.owner, jenisDokumen: row.jenis_dokumen, namaSanggar: row.nama_sanggar || '', status: row.status || 'Draft', isi: row.isi || '', createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapCuration(row) {
  return { id: String(row.id), owner: row.owner, namaSanggar: row.nama_sanggar || '', status: row.status || '', catatan: row.catatan || '', skorAdministrasi: row.skor_administrasi || 0, skorAktivitas: row.skor_aktivitas || 0, skorSDM: row.skor_sdm || 0, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapLog(row) {
  return { id: String(row.id), actor: row.actor, action: row.action, detail: row.detail || '', createdAt: row.created_at };
}

module.exports = {
  hasDatabaseUrl,
  getPool,
  initMysql,
  addLog,
  mapUser,
  publicUser,
  mapProfile,
  mapDocument,
  mapCuration,
  mapLog
};
