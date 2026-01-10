import { execute } from "../src/lib/db";

async function createJobApplicationsTable() {
    console.log("Creating job_applications table...");

    await execute(`
        CREATE TABLE IF NOT EXISTS job_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            cover_letter TEXT,
            resume_path VARCHAR(500),
            status ENUM('new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected') DEFAULT 'new',
            applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id VARCHAR(255),
            notes TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            INDEX idx_job_id (job_id),
            INDEX idx_email (email),
            INDEX idx_status (status)
        )
    `, []);

    console.log("✅ job_applications table created successfully!");
}

createJobApplicationsTable()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
