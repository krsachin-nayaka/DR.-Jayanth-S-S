import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'clinic.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Helper for UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Password hashing using scrypt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, actualSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: actualSalt
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  if (keyBuffer.length !== hashBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, hashBuffer);
}

// Generate human-friendly reference: NC-2026-XXXX
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `NC-${year}-${code}`;
}

export function initDatabase() {
  db.exec(`PRAGMA foreign_keys = ON;`);

  // Clinic Info table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinic_info (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      specialty TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      phone TEXT NOT NULL,
      alt_phone TEXT NOT NULL,
      email TEXT NOT NULL,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      maps_url TEXT NOT NULL,
      hours_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Doctors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      specialty TEXT NOT NULL,
      qualifications TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      consultation_fee INTEGER NOT NULL,
      avatar_url TEXT NOT NULL,
      bio TEXT NOT NULL,
      specialties_json TEXT NOT NULL,
      room_no TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Services table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      fee INTEGER NOT NULL,
      is_online_available INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Doctor Schedules (day_of_week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
      break_start TEXT,
      break_end TEXT,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );
  `);

  // Clinic Holidays / Blocked dates
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinic_holidays (
      id TEXT PRIMARY KEY,
      holiday_date TEXT NOT NULL UNIQUE,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      booking_reference TEXT NOT NULL UNIQUE,
      doctor_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
      patient_name TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      patient_age INTEGER NOT NULL,
      patient_gender TEXT NOT NULL,
      visit_type TEXT NOT NULL CHECK(visit_type IN ('in_person', 'video')),
      medical_notes TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `);

  // Index and Unique constraint for double booking prevention
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_appointments_lookup 
    ON appointments (booking_reference, patient_phone);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_no_double_booking 
    ON appointments (doctor_id, appointment_date, time_slot) 
    WHERE status != 'cancelled';
  `);

  // Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Admin sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );
  `);

  // Audit logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default data if clinic_info is empty
  seedData();
}

function seedData() {
  const existingClinic = db.prepare('SELECT id FROM clinic_info LIMIT 1').get();
  if (!existingClinic) {
    const hours = [
      { day: 'Monday', opens: '10:00 AM', closes: '07:00 PM', open: true },
      { day: 'Tuesday', opens: '10:00 AM', closes: '07:00 PM', open: true },
      { day: 'Wednesday', opens: '10:00 AM', closes: '07:00 PM', open: true },
      { day: 'Thursday', opens: '10:00 AM', closes: '07:00 PM', open: true },
      { day: 'Friday', opens: '10:00 AM', closes: '07:00 PM', open: true },
      { day: 'Saturday', opens: '10:00 AM', closes: '07:00 PM', open: true },
      { day: 'Sunday', opens: 'Closed', closes: 'Closed', open: false }
    ];

    db.prepare(`
      INSERT INTO clinic_info (
        id, name, tagline, specialty, address, city, state, pincode,
        phone, alt_phone, email, rating, review_count, maps_url, hours_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'clinic_main',
      'Dr. Jayanth S S - Neuro Care Clinic',
      'Advanced Neurology & Neuroimmunology Center',
      'Neurology & Neuroimmunology',
      'Old No. 28, 1, Platform Rd, VV Giri Colony, Seshadripuram',
      'Bengaluru',
      'Karnataka',
      '560020',
      '+91 80 6278 4054',
      '+91 80 6297 2761',
      'neurocare.seshadripuram@apollohospitals.com',
      4.9,
      161,
      'https://share.google/ngFEFvWuzwTjT2xAh',
      JSON.stringify(hours),
      new Date().toISOString()
    );
  }

  // Doctor seed
  const existingDoctor = db.prepare('SELECT id FROM doctors LIMIT 1').get();
  if (!existingDoctor) {
    const docId = 'doc_jayanth_ss';
    const specialties = [
      'Neuroimmunology & Multiple Sclerosis',
      'Acute Stroke Management & Thrombolysis',
      'Botox Therapy for Refractory Migraine',
      'Epilepsy & Seizure Disorder Management',
      'Parkinson\'s & Deep Brain Stimulation (DBS)',
      'Neuropathy & Neuro-Muscular Disorders'
    ];

    db.prepare(`
      INSERT INTO doctors (
        id, name, title, specialty, qualifications, experience_years,
        consultation_fee, avatar_url, bio, specialties_json, room_no, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      'Dr. Jayanth S S',
      'Senior Consultant Neurologist & Neuroimmunologist',
      'Neurology & Neuroimmunology',
      'MBBS (RGUHS), MD General Medicine (BLDE), DM Neurology (NIMHANS), Fellowship in Neuroimmunology',
      12,
      800,
      '/src/assets/images/doctor_jayanth_portrait_1792321979717.jpg',
      'Dr. Jayanth S S is an accomplished Consultant Neurologist with specialized post-doctoral fellowship training in Neuroimmunology and a DM in Neurology from the premier National Institute of Mental Health and Neurosciences (NIMHANS), Bengaluru. He has extensive expertise in diagnosing complex neurological disorders, acute stroke care, intractable headache disorders with botulinum toxin injection protocols, and advanced neuro-immunological conditions.',
      JSON.stringify(specialties),
      'Room 204, OPD Wing',
      1,
      new Date().toISOString()
    );

    // Doctor schedule Mon-Sat (1 to 6)
    const scheduleStmt = db.prepare(`
      INSERT INTO doctor_schedules (
        id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start, break_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let day = 1; day <= 6; day++) {
      scheduleStmt.run(
        `sched_doc_${day}`,
        docId,
        day,
        '10:00',
        '19:00',
        30,
        '13:30',
        '14:30'
      );
    }
  }

  // Services seed
  const existingService = db.prepare('SELECT id FROM services LIMIT 1').get();
  if (!existingService) {
    const defaultServices = [
      {
        id: 'srv_gen_consult',
        name: 'Neurology Consultation',
        category: 'Consultation',
        description: 'Comprehensive evaluation for neurological symptoms including headache, numbness, tremors, weakness, dizziness, and nerve pain.',
        duration_minutes: 30,
        fee: 800,
        is_online_available: 1,
        display_order: 1
      },
      {
        id: 'srv_neuroimm_eval',
        name: 'Neuroimmunology & MS Assessment',
        category: 'Specialty Care',
        description: 'Targeted assessment for Multiple Sclerosis, Neuromyelitis Optica (NMOSD), MOGAD, autoimmune encephalitis, and myasthenia gravis.',
        duration_minutes: 45,
        fee: 1200,
        is_online_available: 1,
        display_order: 2
      },
      {
        id: 'srv_migraine_botox',
        name: 'Chronic Migraine & Headache Care',
        category: 'Interventional Care',
        description: 'Clinical protocol diagnosis and candidacy screening for therapeutic botulinum toxin (Botox) therapy and CGRP monoclonal antibody treatment.',
        duration_minutes: 30,
        fee: 1000,
        is_online_available: 1,
        display_order: 3
      },
      {
        id: 'srv_stroke_tia',
        name: 'Stroke Prevention & Recovery Follow-up',
        category: 'Vascular Neurology',
        description: 'Secondary stroke prevention, neurovascular risk factor management, post-thrombolysis neuro-rehabilitation planning.',
        duration_minutes: 30,
        fee: 800,
        is_online_available: 1,
        display_order: 4
      },
      {
        id: 'srv_epilepsy',
        name: 'Epilepsy & Seizure Disorder Clinic',
        category: 'Epileptology',
        description: 'First seizure workup, antiepileptic drug optimization, EEG correlation, and refractory seizure assessment.',
        duration_minutes: 30,
        fee: 800,
        is_online_available: 1,
        display_order: 5
      },
      {
        id: 'srv_dbs_parkinsons',
        name: 'Parkinson\'s & Movement Disorders Review',
        category: 'Movement Disorders',
        description: 'Comprehensive motor staging, Deep Brain Stimulation (DBS) pre-surgical workup and post-operative programming review.',
        duration_minutes: 45,
        fee: 1200,
        is_online_available: 1,
        display_order: 6
      },
      {
        id: 'srv_video_teleconsult',
        name: 'Tele-Neurology Video Consultation',
        category: 'Virtual Care',
        description: 'Secure, high-definition online video consultation with Dr. Jayanth S S for patients requiring remote follow-up or report reviews.',
        duration_minutes: 30,
        fee: 800,
        is_online_available: 1,
        display_order: 7
      }
    ];

    const srvStmt = db.prepare(`
      INSERT INTO services (
        id, name, category, description, duration_minutes, fee, is_online_available, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of defaultServices) {
      srvStmt.run(s.id, s.name, s.category, s.description, s.duration_minutes, s.fee, s.is_online_available, s.display_order);
    }
  }

  // Admin user bootstrap:
  // Strictly adhering to Requirement #6:
  // "NEVER display admin credentials in homepage, footer, contact page, source code, HTML comments, frontend JavaScript... Store sensitive configuration in environment variables or a secure file delivered separately."
  const existingAdmin = db.prepare('SELECT id FROM admin_users LIMIT 1').get();
  if (!existingAdmin) {
    const adminId = 'admin_' + generateId().slice(0, 8);
    const username = process.env.ADMIN_DEFAULT_USERNAME || 'drjayanth.admin';
    const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@jayanthneuro.com';
    
    // Generate secure random initial password if not supplied in env
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(8).toString('hex') + 'A9!';
    const { hash, salt } = hashPassword(initialPassword);

    db.prepare(`
      INSERT INTO admin_users (
        id, username, email, name, password_hash, salt, role, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      username,
      email,
      'Dr. Jayanth S S Admin Team',
      hash,
      salt,
      'admin',
      1,
      new Date().toISOString()
    );

    // Save instructions strictly to a local private server file (not web accessible)
    // and log audit event
    const credPath = path.resolve(process.cwd(), '.admin_bootstrap_credentials.txt');
    try {
      fs.writeFileSync(credPath, [
        `=====================================================`,
        `PRIVATE CLINIC ADMIN HANDOVER CREDENTIALS`,
        `CONFIDENTIAL - DELIVER TO AUTHORIZED CLINIC OWNER ONLY`,
        `=====================================================`,
        `Admin Portal URL: /admin/login`,
        `Username: ${username}`,
        `Email: ${email}`,
        `Temporary Password: ${initialPassword}`,
        `Created At: ${new Date().toISOString()}`,
        ``,
        `IMPORTANT OWNER INSTRUCTIONS:`,
        `1. Log in to the administrative portal using these credentials.`,
        `2. Navigate to "Security & Staff" and immediately set your own secure permanent password.`,
        `3. Keep this file confidential or remove it after setting your password.`,
        `=====================================================`
      ].join('\n'), { mode: 0o600 });
    } catch {
      // non-fatal
    }

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      adminId,
      'BOOTSTRAP_ADMIN_CREATED',
      'admin_user',
      adminId,
      JSON.stringify({ username, email, source: 'system_init' }),
      new Date().toISOString()
    );
  }
}
