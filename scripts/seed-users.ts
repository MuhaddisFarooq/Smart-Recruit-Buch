// scripts/seed-users.ts
import { config as loadEnv } from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

// 1) Load env FIRST (.env.local, then .env)
const root = process.cwd();
loadEnv({ path: path.join(root, ".env.local") });
loadEnv({ path: path.join(root, ".env") });

type SeedUser = {
  employee_id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  password: string; // plain; will be hashed
  role: "superadmin" | "admin";
};

const SEED_USERS: SeedUser[] = [
  {
    employee_id: "SA0001",
    name: "Root Superadmin",
    department: "IT",
    designation: "Super Admin",
    email: "superadmin@buchhospital.com",
    password: "superadmin123!",
    role: "superadmin",
  },
  {
    employee_id: "AD0001",
    name: "Site Admin",
    department: "IT",
    designation: "Admin",
    email: "admin@buchhospital.ccom",
    password: "admin123!",
    role: "admin",
  },
];

async function main() {
  // 2) Log effective target & guard env
  const { DB_HOST, DB_PORT, DB_USER, DB_NAME } = process.env;
  console.log(
    `Seeding into mysql://${DB_USER ?? "(unset)"}@${DB_HOST ?? "127.0.0.1"}:${DB_PORT ?? "3306"}/${DB_NAME ?? "(unset)"}`
  );
  if (!DB_USER || !DB_NAME) {
    console.error("❌ Missing DB_USER or DB_NAME in env (.env/.env.local).");
    process.exit(1);
  }

  // 3) Import DB AFTER env is loaded (no top-level await)
  const { query, execute, pool } = await import("../src/lib/db");

  async function upsertUser(u: SeedUser, addedBy = "seed") {
    const email = u.email.trim().toLowerCase();
    const now = new Date();

    const existing = await query<{ id: number }>(
      "SELECT id FROM users WHERE LOWER(email)=? LIMIT 1",
      [email]
    );

    if (existing[0]?.id) {
      await execute(
        "UPDATE users SET role=?, status='active', updatedBy=?, updatedDate=? WHERE id=?",
        [u.role, addedBy, now, existing[0].id]
      );
      console.log(`✓ updated ${email} -> role ${u.role}`);
      return existing[0].id;
    }

    const hash = await bcrypt.hash(u.password, 10);
    const res = await execute(
      `INSERT INTO users
        (employee_id, name, department, designation, email, password, picture, status, role, addedBy, addedDate)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 'active', ?, ?, ?)`,
      [u.employee_id, u.name, u.department, u.designation, email, hash, u.role, addedBy, now]
    );
    console.log(`✓ inserted ${email} as ${u.role} (id ${res.insertId})`);
    return res.insertId;
  }

  const addedBy = process.env.SEED_ADDED_BY?.trim() || "seed";
  for (const u of SEED_USERS) {
    await upsertUser(u, addedBy);
  }

  await pool.end();
  console.log("✅ Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
