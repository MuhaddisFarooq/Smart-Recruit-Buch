import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateJobsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart-recruit',
    });

    console.log('Connected to database');

    // Add new columns for the Create Job wizard and Edit Job form
    const columnsToAdd = [
        { name: 'work_location_type', type: 'VARCHAR(50)' },
        { name: 'job_language', type: 'VARCHAR(100)' },
        { name: 'description', type: 'TEXT' },
        { name: 'video_url', type: 'VARCHAR(255)' },
        { name: 'industry', type: 'VARCHAR(150)' },
        { name: 'job_function', type: 'VARCHAR(150)' },
        { name: 'experience_level', type: 'VARCHAR(100)' },
        { name: 'salary_from', type: 'VARCHAR(50)' },
        { name: 'salary_to', type: 'VARCHAR(50)' },
        { name: 'currency', type: 'VARCHAR(20)' },
        { name: 'salary_period', type: 'VARCHAR(50)' },
        { name: 'hiring_team', type: 'TEXT' },
        // New location fields
        { name: 'city', type: 'VARCHAR(100)' },
        { name: 'state', type: 'VARCHAR(100)' },
        { name: 'postal_code', type: 'VARCHAR(20)' },
        { name: 'country', type: 'VARCHAR(100)' },
        // Auto unpublish
        { name: 'auto_unpublish_date', type: 'DATE' },
    ];

    for (const col of columnsToAdd) {
        try {
            await connection.execute(`ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`);
            console.log(`Added column: ${col.name}`);
        } catch (error: any) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column already exists: ${col.name}`);
            } else {
                console.error(`Error adding ${col.name}:`, error.message);
            }
        }
    }

    await connection.end();
    console.log('\n✅ Done! Jobs table updated with all fields.');
}

updateJobsTable().catch(console.error);
