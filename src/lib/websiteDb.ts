
import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "srv1612.hstgr.io",
    user: "u335052771_buchwebsite",
    password: "n@sDA4?5S",
    database: "u335052771_buchwebsite",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function executeWebsiteQuery(query: string, params: any[] = []) {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        console.error("Website DB Error:", error);
        throw error;
    }
}
