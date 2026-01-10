import { execute } from "../src/lib/db";

async function updateStatusEnum() {
    console.log("Updating job_applications status ENUM...");

    try {
        // We need to modify the column to include 'withdrawn'
        // Current: 'new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'Applied' (if any legacy exists)
        // New: 'new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn', 'Applied'

        await execute(`
            ALTER TABLE job_applications 
            MODIFY COLUMN status ENUM(
                'new', 
                'reviewed', 
                'shortlisted', 
                'interview', 
                'offered', 
                'hired', 
                'rejected', 
                'withdrawn',
                'Applied'
            ) DEFAULT 'new'
        `, []);

        console.log("✅ job_applications status ENUM updated successfully!");
    } catch (error) {
        console.error("Error updating status ENUM:", error);
    }
}

updateStatusEnum()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
