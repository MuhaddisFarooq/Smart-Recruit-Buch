// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import bcrypt from "bcryptjs";
import { saveOptimizedImage } from "../_helpers/image-processing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}
async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }

// cache whether a column exists so we don't SHOW COLUMNS on every request
let hasGroupIdCol: boolean | undefined;
async function ensureHasGroupIdColumn(): Promise<boolean> {
  if (typeof hasGroupIdCol === "boolean") return hasGroupIdCol;
  const cols = await query<any>("SHOW COLUMNS FROM users LIKE 'group_id'");
  hasGroupIdCol = cols.length > 0;
  return hasGroupIdCol;
}

/** GET (list with simple paging & search) */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 25), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const where: string[] = [];
    const args: any[] = [];

    if (q) {
      where.push("(employee_id LIKE ? OR name LIKE ? OR email LIKE ? OR department LIKE ? OR designation LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await query<any>(
      `SELECT id, employee_id, name, email, department, designation, picture, role, status, addedBy, addedDate
       FROM users ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    return NextResponse.json({ data: rows });
  } catch (e: any) {
    console.error("[users:GET list]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** POST (create user) - accepts JSON or multipart/form-data */
export async function POST(req: NextRequest) {
  try {
    const actor = await actorFromSession();
    const now = new Date();
    const ct = (req.headers.get("content-type") || "").toLowerCase();

    // REQUIRED fields
    let employee_id = "";
    let name = "";
    let department = "";
    let designation = "";
    let email = "";
    let password = "";
    let status = "active";
    let role = "user";
    let pictureRel: string | null = null;
    let group_id: number | null = null;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      employee_id = String(fd.get("employee_id") || "");
      name        = String(fd.get("name") || "");
      department  = String(fd.get("department") || "");
      designation = String(fd.get("designation") || "");
      email       = String(fd.get("email") || "").trim().toLowerCase();
      password    = String(fd.get("password") || "");
      status      = (String(fd.get("status") || "active").toLowerCase() === "inactive" ? "inactive" : "active");
      role        = String(fd.get("role") || "user");

      const gid = fd.get("group_id");
      if (gid !== null && gid !== undefined && String(gid).trim() !== "") {
        const n = Number(gid);
        if (Number.isFinite(n)) group_id = n;
      }

      const file = fd.get("picture") as File | null;
      if (file && file.size > 0) pictureRel = await saveOptimizedImage(file, "users", null, 98);
    } else {
      const b: any = await req.json().catch(() => ({}));
      employee_id = String(b.employee_id || "");
      name        = String(b.name || "");
      department  = String(b.department || "");
      designation = String(b.designation || "");
      email       = String(b.email || "").trim().toLowerCase();
      password    = String(b.password || "");
      status      = (String(b.status || "active").toLowerCase() === "inactive" ? "inactive" : "active");
      role        = String(b.role || "user");

      if (b.group_id !== undefined && b.group_id !== null && String(b.group_id).trim() !== "") {
        const n = Number(b.group_id);
        if (Number.isFinite(n)) group_id = n;
      }
    }

    // validation
    if (!employee_id || !name) return NextResponse.json({ error: "employee_id and name are required" }, { status: 400 });
    if (!email)                return NextResponse.json({ error: "email is required" }, { status: 400 });
    if (!password)             return NextResponse.json({ error: "password is required" }, { status: 400 });

    // validate role and check permissions
    const validRoles = ["superadmin", "admin", "user"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // get current user's role to validate creation permissions
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role || "user";
    
    // role hierarchy validation
    const canCreate = (currentRole: string, targetRole: string): boolean => {
      if (currentRole === "superadmin") return true; // can create any role
      if (currentRole === "admin") return ["admin", "user"].includes(targetRole);
      if (currentRole === "user") return targetRole === "user";
      return false;
    };

    if (!canCreate(currentUserRole, role)) {
      return NextResponse.json({ 
        error: `Insufficient permissions. ${currentUserRole} cannot create ${role} users.` 
      }, { status: 403 });
    }

    // unique email (lower-cased)
    const existing = await query<{ cnt: number }>("SELECT COUNT(*) AS cnt FROM users WHERE email=?", [email]);
    if (existing[0]?.cnt > 0) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // build dynamic INSERT (include group_id only if column exists)
    const cols = [
      "employee_id",
      "name",
      "department",
      "designation",
      "email",
      "password",
      "picture",
      "status",
      "role",
      "addedBy",
      "addedDate",
    ];
    const placeholders = ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?"];
    const args: any[] = [
      employee_id,
      name,
      department,
      designation,
      email,
      hashed,
      pictureRel,
      status,
      role,
      actor,
      now,
    ];

    if (await ensureHasGroupIdColumn()) {
      cols.splice(8, 0, "group_id");           // insert before role
      placeholders.splice(8, 0, "?");
      args.splice(8, 0, group_id);
    }

    const sql = `INSERT INTO users (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`;
    const res = await execute(sql, args);

    return NextResponse.json({ ok: true, id: (res as any).insertId });
  } catch (e: any) {
    console.error("[users:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
