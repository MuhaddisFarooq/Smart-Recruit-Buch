import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart-recruit',
  });

  console.log('Connected to database');

  // 1. Clear existing users (and related data due to foreign keys)
  console.log('Clearing existing data...');
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
  await connection.execute('TRUNCATE TABLE job_applications');
  await connection.execute('TRUNCATE TABLE job_referrals');
  await connection.execute('TRUNCATE TABLE candidate_experience');
  await connection.execute('TRUNCATE TABLE candidate_education');
  await connection.execute('TRUNCATE TABLE users');
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Cleared all user data');

  // 2. Hash passwords
  const superadminPassword = await bcrypt.hash('superadmin123', 10);
  const hrPassword = await bcrypt.hash('hr123', 10);

  // 3. Seed Superadmin
  await connection.execute(
    `INSERT INTO users (employee_id, name, department, designation, email, password, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'EMP001',
      'Super Admin',
      'Administration',
      'System Administrator',
      'superadmin@buch.com',
      superadminPassword,
      'superadmin',
      'Active'
    ]
  );
  console.log('Created Superadmin user: superadmin@buch.com / superadmin123');

  // 4. Seed HR User
  await connection.execute(
    `INSERT INTO users (employee_id, name, department, designation, email, password, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'EMP002',
      'HR Manager',
      'Human Resources',
      'HR Manager',
      'hr@buch.com',
      hrPassword,
      'hr',
      'Active'
    ]
  );
  console.log('Created HR user: hr@buch.com / hr123');

  await connection.end();
  console.log('\n✅ Done! Users seeded successfully.');
  console.log('\n📋 Available Roles: superadmin, hr, candidate');
  console.log('\n🔐 Login Credentials:');
  console.log('   Superadmin: superadmin@buch.com / superadmin123');
  console.log('   HR: hr@buch.com / hr123');
  console.log('   Candidates: Register via /register');
}

seedUsers().catch(console.error);
