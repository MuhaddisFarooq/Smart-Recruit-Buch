// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ensure Node runtime

async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }
function sanitize(n: string) { return n.replace(/[^a-zA-Z0-9._-]+/g, "_"); }

async function requireActor() {
  const s = await getServerSession(authOptions).catch(() => null);
  if (!s?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  return { actor: s.user.email || s.user.name || "system" } as const;
}

async function saveCompressedJpeg(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), "public", "uploads", "users");
  await ensureDir(folder);
  const base = sanitize(file.name || "user.jpg").replace(/\.(png|webp|gif|bmp|tiff)$/i, ".jpg");
  const out = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${base}`;
  const abs = path.join(folder, out);
  await sharp(buf).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(abs);
  return `users/${out}`;
}

// cache column presence
let hasGroupIdCol: boolean | undefined;
async function ensureHasGroupIdColumn(): Promise<boolean> {
  if (typeof hasGroupIdCol === "boolean") return hasGroupIdCol;
  const cols = await query<any>("SHOW COLUMNS FROM users LIKE 'group_id'");
  hasGroupIdCol = cols.length > 0;
  return hasGroupIdCol;
}

/** GET one */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>("SELECT * FROM users WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[users:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH one (JSON or multipart) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    // must be logged in
    const auth = await requireActor();
    if ("error" in auth) return auth.error;
    const actor = auth.actor;
    const now = new Date();

    const ct = (req.headers.get("content-type") || "").toLowerCase();

    // quick toggle path
    if (ct.includes("application/json")) {
      const b: any = await req.json().catch(() => ({}));
      if (b?._toggleStatus) {
        const [{ status = "inactive" } = {}] = await query<{ status: string }>(
          "SELECT status FROM users WHERE id=? LIMIT 1",
          [num]
        );
        const newStatus = status === "active" ? "inactive" : "active";
        await execute(
          "UPDATE users SET status=?, updatedBy=?, updatedDate=? WHERE id=?",
          [newStatus, actor, now, num]
        );
        return NextResponse.json({ ok: true, status: newStatus });
      }
    }

    let employee_id: string | undefined;
    let name: string | undefined;
    let department: string | undefined;
    let designation: string | undefined;
    let status: string | undefined;
    let email: string | undefined;
    let password: string | undefined;
    let pictureRel: string | undefined;
    let group_id: number | null | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("employee_id")) employee_id = String(fd.get("employee_id") || "");
      if (fd.has("name"))        name        = String(fd.get("name") || "");
      if (fd.has("department"))  department  = String(fd.get("department") || "");
      if (fd.has("designation")) designation = String(fd.get("designation") || "");
      if (fd.has("status"))      status      = (String(fd.get("status") || "active").toLowerCase() === "inactive" ? "inactive" : "active");
      if (fd.has("email"))       email       = String(fd.get("email") || "").trim().toLowerCase();
      if (fd.has("password"))    password    = String(fd.get("password") || "");

      if (fd.has("group_id")) {
        const raw = String(fd.get("group_id") ?? "").trim();
        if (raw === "") group_id = null;
        else {
          const n = Number(raw);
          if (Number.isFinite(n)) group_id = n;
        }
      }

      const file = fd.get("picture") as File | null;
      if (file && file.size > 0) {
        pictureRel = await saveCompressedJpeg(file);
        const old = await query<{ picture: string | null }>("SELECT picture FROM users WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.picture;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else {
      const b: any = await req.json().catch(() => ({}));
      if ("employee_id" in b) employee_id = String(b.employee_id || "");
      if ("name" in b)        name        = String(b.name || "");
      if ("department" in b)  department  = String(b.department || "");
      if ("designation" in b) designation = String(b.designation || "");
      if ("status" in b)      status      = (String(b.status || "active").toLowerCase() === "inactive" ? "inactive" : "active");
      if ("email" in b)       email       = String(b.email || "").trim().toLowerCase();
      if ("password" in b)    password    = String(b.password || "");

      if ("group_id" in b) {
        const raw = String(b.group_id ?? "").trim();
        if (raw === "") group_id = null;
        else {
          const n = Number(raw);
          if (Number.isFinite(n)) group_id = n;
        }
      }
    }

    // if email is provided, enforce non-empty + uniqueness (excluding self)
    if (email !== undefined) {
      if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
      const exists = await query<{ cnt: number }>(
        "SELECT COUNT(*) AS cnt FROM users WHERE email=? AND id<>?",
        [email, num]
      );
      if (exists[0]?.cnt > 0) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    // build dynamic UPDATE
    const sets: string[] = ["updatedBy=?", "updatedDate=?"];
    const args: any[] = [actor, now];

    if (employee_id !== undefined) { sets.push("employee_id=?"); args.push(employee_id); }
    if (name !== undefined)        { sets.push("name=?");        args.push(name); }
    if (department !== undefined)  { sets.push("department=?");  args.push(department); }
    if (designation !== undefined) { sets.push("designation=?"); args.push(designation); }
    if (status !== undefined)      { sets.push("status=?");      args.push(status); }
    if (email !== undefined)       { sets.push("email=?");       args.push(email); }
    if (password !== undefined && password) {
      const hashed = await bcrypt.hash(password, 10);
      sets.push("password=?"); args.push(hashed);
    }
    if (pictureRel !== undefined)  { sets.push("picture=?");     args.push(pictureRel); }

    if (await ensureHasGroupIdColumn()) {
      if (group_id !== undefined) { sets.push("group_id=?"); args.push(group_id); }
    }

    await execute(`UPDATE users SET ${sets.join(", ")} WHERE id=?`, [...args, num]);

    // Handle group assignment via user_group_members table (fallback if no group_id column)
    if (group_id !== undefined && !(await ensureHasGroupIdColumn())) {
      // Remove existing group memberships for this user
      await execute("DELETE FROM user_group_members WHERE user_id=?", [num]);
      
      // Add new group membership if group_id is provided
      if (group_id !== null) {
        await execute(
          "INSERT INTO user_group_members (user_id, group_id, addedBy, addedDate) VALUES (?, ?, ?, ?)",
          [num, group_id, actor, now]
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[users:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** DELETE one */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    // require session for destructive action
    const auth = await requireActor();
    if ("error" in auth) return auth.error;

    const old = await query<{ picture: string | null }>("SELECT picture FROM users WHERE id=? LIMIT 1", [num]);
    const oldRel = old[0]?.picture;
    if (oldRel) {
      const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
      fs.unlink(absOld).catch(() => void 0);
    }
    await execute("DELETE FROM users WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[users:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
