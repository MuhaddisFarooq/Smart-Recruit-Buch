import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateUsersTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart-recruit',
    });

    console.log('Connected to database');

    // Add all profile-related columns matching the SmartRecruiters design
    const columnsToAdd = [
        // Basic info
        { name: 'first_name', type: 'VARCHAR(100)' },
        { name: 'last_name', type: 'VARCHAR(100)' },
        { name: 'position', type: 'VARCHAR(150)' },
        { name: 'show_profile_on_jobs', type: 'BOOLEAN DEFAULT FALSE' },

        // Contact information
        { name: 'street_address', type: 'VARCHAR(255)' },
        { name: 'city', type: 'VARCHAR(100)' },
        { name: 'country', type: 'VARCHAR(100)' },
        { name: 'zip_code', type: 'VARCHAR(20)' },
        { name: 'work_phone_code', type: 'VARCHAR(10)' },
        { name: 'work_phone', type: 'VARCHAR(50)' },
        { name: 'cell_phone_code', type: 'VARCHAR(10)' },
        { name: 'cell_phone', type: 'VARCHAR(50)' },

        // Locale preferences
        { name: 'language', type: 'VARCHAR(50) DEFAULT "English"' },
        { name: 'timezone', type: 'VARCHAR(100)' },

        // Avatar
        { name: 'avatar_url', type: 'VARCHAR(255)' },

        // Social links (keeping these for other features)
        { name: 'linkedin_url', type: 'VARCHAR(255)' },
        { name: 'facebook_url', type: 'VARCHAR(255)' },
        { name: 'twitter_url', type: 'VARCHAR(255)' },
        { name: 'website_url', type: 'VARCHAR(255)' },

        // Other
        { name: 'bio', type: 'TEXT' },
        { name: 'resume_url', type: 'VARCHAR(255)' },
        { name: 'phone', type: 'VARCHAR(50)' },
        { name: 'notifications_email', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'notifications_sms', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
    ];

    for (const col of columnsToAdd) {
        try {
            await connection.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
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
    console.log('\n✅ Done! Users table updated with all profile fields.');
}

updateUsersTable().catch(console.error);
