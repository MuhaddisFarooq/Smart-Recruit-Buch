import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3309),
  user: process.env.DB_USER ?? "muhaddis",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "hospital_portal",
  waitForConnections: true,
  connectionLimit: 10,
});

const SUPER_EMAIL = "superadmin12@gmail.com";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        try {
          if (!creds?.email || !creds?.password) {
            console.log("[auth] missing email/password");
            return null;
          }

          const [rows] = await pool.query(
            "SELECT id, email, password, role FROM users WHERE email = ? LIMIT 1",
            [creds.email]
          ) as any;

          const user = rows?.[0];
          if (!user) {
            console.log("[auth] no user for", creds.email);
            return null;
          }

          const ok = await bcrypt.compare(creds.password, user.password);
          if (!ok) {
            console.log("[auth] bad password");
            return null;
          }

          if (!(user.email === SUPER_EMAIL && user.role === "superadmin")) {
            console.log("[auth] not superadmin", user.email, user.role);
            throw new Error("Only SuperAdmin can sign in.");
          }

          console.log("[auth] login ok for", user.email);
          return { id: String(user.id), email: user.email, role: user.role } as any;
        } catch (e) {
          console.error("[auth] authorize error:", e);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = (user as any).role;
        // @ts-ignore
        token.accessToken = "local";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.role = token.role as string;
        // @ts-ignore
        session.user.accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
  },
};
