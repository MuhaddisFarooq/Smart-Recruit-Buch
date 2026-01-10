const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log("Connecting to DB...");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_recruiter',
    });

    try {
        const jobId = process.argv[2] || 3;
        console.log(`--- Job ID ${jobId} ---`);

        const [jobs] = await connection.execute('SELECT id, status FROM jobs WHERE id = ?', [jobId]);
        console.log('Job:', jobs);

        const [counts] = await connection.execute('SELECT status, COUNT(*) as c FROM job_applications WHERE job_id = ? GROUP BY status', [jobId]);
        console.log('Counts:', counts);

        const [apps] = await connection.execute('SELECT id, job_id, user_id FROM job_applications WHERE job_id = ?', [jobId]);
        console.log('Apps:', apps);

    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

run();
