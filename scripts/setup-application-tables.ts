import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function setupTables() {
    console.log("Connecting to database...");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log("Adding columns to users table...");
        const userColumns = [
            "ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
            "ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS website_url VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS resume_url VARCHAR(255)",
            "ADD COLUMN IF NOT EXISTS bio TEXT"
        ];

        // We can't use IF NOT EXISTS inside ADD COLUMN in standard MySQL for some versions, 
        // but let's try a safe approach or ignore errors if they exist. 
        // Actually, MariaDB supports IF NOT EXISTS in ADD COLUMN, MySQL 8.0+ might not perfectly.
        // Safer way: Execute each one in a try-catch for "Duplicate column name" error code 1060.

        for (const col of userColumns) {
            try {
                // Strip "IF NOT EXISTS" for better compatibility if we rely on catch, 
                // but actually let's try the modern syntax first.
                // Wait, easiest is just to try adding and ignore specific error.
                // Or check information_schema.

                // Let's rely on standard ALTER TABLE without IF NOT EXISTS and catch error.
                const cleanCol = col.replace("IF NOT EXISTS ", "");
                await connection.execute(`ALTER TABLE users ${cleanCol}`);
                console.log(`Executed: ${cleanCol}`);
            } catch (err: any) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists (skipped): ${col}`);
                } else {
                    console.warn(`Error adding column: ${col}`, err.message);
                }
            }
        }

        console.log("Creating candidate_experience table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS candidate_experience (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                description TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log("Creating candidate_education table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS candidate_education (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                institution VARCHAR(255) NOT NULL,
                major VARCHAR(255),
                degree VARCHAR(255),
                location VARCHAR(255),
                description TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log("Creating job_applications table...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS job_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                user_id INT NOT NULL,
                resume_url VARCHAR(255),
                message TEXT,
                status VARCHAR(50) DEFAULT 'Applied',
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log("Database setup completed successfully!");

    } catch (error) {
        console.error("Setup failed:", error);
    } finally {
        await connection.end();
    }
}

setupTables();
