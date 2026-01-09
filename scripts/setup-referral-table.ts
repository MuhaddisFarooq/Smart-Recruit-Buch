import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupReferralTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart-recruit',
    });

    console.log('Connected to database');

    // Create job_referrals table
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS job_referrals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            
            -- Referral (friend) details
            referral_first_name VARCHAR(100) NOT NULL,
            referral_last_name VARCHAR(100) NOT NULL,
            referral_email VARCHAR(255) NOT NULL,
            referral_phone VARCHAR(50),
            relationship VARCHAR(100) NOT NULL,
            recommendation TEXT,
            referral_resume_url VARCHAR(255),
            
            -- Referrer (user) details
            referrer_first_name VARCHAR(100) NOT NULL,
            referrer_last_name VARCHAR(100) NOT NULL,
            referrer_email VARCHAR(255) NOT NULL,
            referrer_user_id INT,
            
            -- Metadata
            status VARCHAR(50) DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    console.log('Created job_referrals table');

    await connection.end();
    console.log('Done!');
}

setupReferralTable().catch(console.error);
