import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";

type SeedUser = {
  username: string;
  password: string;
  role: string;
  profile?: Record<string, unknown>;
};

// Akun demo lengkap untuk semua peran yang dipromosikan di halaman Login.
// Catatan: role "sewa" tidak diseed di server karena bersifat client-side only
// (lihat lib/auth.tsx — login sewa via fallback lokal).
const DEMO_USERS: SeedUser[] = [
  {
    username: "Penguasa jak1",
    password: "ayamayaman",
    role: "kurator",
    profile: { nama: "Kurator Utama", title: "Penguasa Jak Sanggar" },
  },
  {
    username: "admin1",
    password: "admin123",
    role: "admin",
    profile: { nama: "Admin Utama" },
  },
  {
    username: "juri1",
    password: "juri123",
    role: "juri",
    profile: { nama: "Juri Budaya" },
  },
  {
    username: "betawi.merah",
    password: "sanggar123",
    role: "sanggar",
    profile: { namaSanggar: "Sanggar Betawi Merah", sanggarId: "betawi.merah" },
  },
  {
    username: "kembang.setaman",
    password: "sanggar123",
    role: "sanggar",
    profile: { namaSanggar: "Sanggar Kembang Setaman", sanggarId: "kembang.setaman" },
  },
  {
    username: "pelatih.iwan",
    password: "pelatih123",
    role: "pelatih",
    profile: { nama: "Iwan Saputra" },
  },
  {
    username: "pelatih.nia",
    password: "pelatih123",
    role: "pelatih",
    profile: { nama: "Nia Kartika" },
  },
  {
    username: "ayu.tari",
    password: "seniman123",
    role: "seniman",
    profile: { nama: "Ayu Tari" },
  },
  {
    username: "budi.gambang",
    password: "seniman123",
    role: "seniman",
    profile: { nama: "Budi Gambang" },
  },
  {
    username: "citra.teater",
    password: "seniman123",
    role: "seniman",
    profile: { nama: "Citra Wulandari" },
  },
];

export async function seedUsersIfEmpty(): Promise<void> {
  // Pendekatan idempoten per-user: tambahkan akun demo yang belum ada
  // tanpa menyentuh akun yang sudah dibuat. Ini memastikan akun demo baru
  // (mis. admin/pelatih/seniman) muncul walau DB sudah berisi seed lama.
  let inserted = 0;
  for (const u of DEMO_USERS) {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, u.username))
      .limit(1);
    if (existing[0]) continue;
    const passwordHash = await hashPassword(u.password);
    await db.insert(usersTable).values({
      username: u.username,
      passwordHash,
      role: u.role,
      profile: u.profile ?? {},
    });
    inserted += 1;
  }
  if (inserted > 0) {
    logger.info({ inserted, total: DEMO_USERS.length }, "Seed demo users selesai");
  }
}
