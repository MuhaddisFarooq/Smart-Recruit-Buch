// src/lib/db.ts
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false,
  timezone: "Z",
});

export async function query<T = any>(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
