const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL belum diisi');
    process.exit(1);
  }

  if (!fs.existsSync(DB_FILE)) {
    console.error('db.json tidak ditemukan');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');

  const db = await mysql.createPool(process.env.DATABASE_URL);

  console.log('Migrasi users...');
  for (const u of raw.users || []) {
    await db.query(
      'INSERT IGNORE INTO users (username,password,role,created_at) VALUES (?,?,?,?)',
      [u.username, u.password, u.role || 'user', u.createdAt || new Date()]
    );
  }

  console.log('Migrasi profiles...');
  for (const p of raw.profiles || []) {
    await db.query(
      'INSERT INTO profiles (owner,nama_sanggar,jenis_kesenian,kedudukan,alamat,no_hp,ketua,bank,rekening,status_administrasi,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [p.owner,p.namaSanggar,p.jenisKesenian,p.kedudukan,p.alamat,p.noHp,p.ketua,p.bank,p.rekening,p.statusAdministrasi,p.createdAt || new Date(),p.updatedAt || new Date()]
    );
  }

  console.log('Migrasi documents...');
  for (const d of raw.documents || []) {
    await db.query(
      'INSERT INTO documents (owner,jenis_dokumen,nama_sanggar,status,isi,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
      [d.owner,d.jenisDokumen,d.namaSanggar,d.status,d.isi,d.createdAt || new Date(),d.updatedAt || new Date()]
    );
  }

  console.log('Migrasi curations...');
  for (const c of raw.curations || []) {
    await db.query(
      'INSERT INTO curations (owner,nama_sanggar,status,catatan,skor_administrasi,skor_aktivitas,skor_sdm,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [c.owner,c.namaSanggar,c.status,c.catatan,c.skorAdministrasi || 0,c.skorAktivitas || 0,c.skorSDM || 0,c.createdAt || new Date(),c.updatedAt || new Date()]
    );
  }

  console.log('Migrasi logs...');
  for (const l of raw.logs || []) {
    await db.query(
      'INSERT INTO activity_logs (actor,action,detail,created_at) VALUES (?,?,?,?)',
      [l.actor,l.action,l.detail,l.createdAt || new Date()]
    );
  }

  console.log('Migrasi selesai');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
