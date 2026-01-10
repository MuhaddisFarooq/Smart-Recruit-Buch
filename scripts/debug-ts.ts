import { query } from "../src/lib/db";

async function debugJobData() {
    console.log("Starting Debug...");
    try {
        const jobId = "3"; // Hardcoding for certainty based on screenshot URL in previous context if visible, or just assuming 3.
        // Wait, user provided localhost:3000/jobs/3 in the screenshot URL bar? No, I can't see the URL bar clearly but I'll assume 3 based on my previous run attempt.
        // Actually, let's fetch ALL jobs to find the one with title "Manager Blood Bank" to be sure.

        const jobs: any[] = await query("SELECT id, job_title, status FROM jobs WHERE job_title LIKE '%Blood Bank%' LIMIT 1");
        if (jobs.length === 0) {
            console.log("No job found with title 'Blood Bank'");
            return;
        }

        const job = jobs[0];
        console.log("Found Job:", job);

        const apps = await query("SELECT id, user_id, status FROM job_applications WHERE job_id = ?", [job.id]);
        console.log(`Found ${apps.length} applications for Job ID ${job.id}`);
        console.log(JSON.stringify(apps, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

debugJobData();
