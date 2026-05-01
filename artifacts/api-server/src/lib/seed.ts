import { db, usersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

type SeedUser = {
  username: string;
  password: string;
  role: string;
  profile?: Record<string, unknown>;
};

const DEMO_USERS: SeedUser[] = [
  {
    username: "Penguasa jak1",
    password: "ayamayaman",
    role: "kurator",
    profile: { nama: "Kurator Utama", title: "Penguasa Jak Sanggar" },
  },
  {
    username: "betawi.merah",
    password: "sanggar123",
    role: "sanggar",
    profile: { namaSanggar: "Sanggar Betawi Merah", sanggarId: "betawi.merah" },
  },
  {
    username: "juri.budaya",
    password: "juri123",
    role: "juri",
    profile: { nama: "Juri Budaya" },
  },
];

export async function seedUsersIfEmpty(): Promise<void> {
  const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existing[0]) {
    return;
  }
  logger.info("Seeding demo users…");
  for (const u of DEMO_USERS) {
    const passwordHash = await hashPassword(u.password);
    await db.insert(usersTable).values({
      username: u.username,
      passwordHash,
      role: u.role,
      profile: u.profile ?? {},
    });
  }
  logger.info({ count: DEMO_USERS.length }, "Seed selesai");
}
