import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db, generateId, generateBookingReference, hashPassword, verifyPassword } from './db.ts';
import { syncAppointmentToSupabase, updateSupabaseAppointmentStatus, checkSupabaseStatus, supabase } from './supabase.ts';

export const apiRouter = Router();

// Middleware: Authenticate Admin Session
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.prepare(`
    SELECT s.token, s.user_id, s.expires_at, u.username, u.email, u.name, u.role
    FROM admin_sessions s
    JOIN admin_users u ON s.user_id = u.id
    WHERE s.token = ? AND u.is_active = 1
  `).get(token) as any;

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  (req as any).user = session;
  next();
}

// ==========================================
// 1. PUBLIC CLINIC & DIRECTORY ENDPOINTS
// ==========================================

// Get clinic profile & operating hours
apiRouter.get('/clinic', (_req: Request, res: Response) => {
  const clinic = db.prepare('SELECT * FROM clinic_info LIMIT 1').get() as any;
  if (!clinic) return res.status(404).json({ error: 'Clinic details not found' });
  
  res.json({
    ...clinic,
    hours: JSON.parse(clinic.hours_json || '[]')
  });
});

// Get doctors
apiRouter.get('/doctors', (_req: Request, res: Response) => {
  const doctors = db.prepare('SELECT * FROM doctors WHERE is_active = 1 ORDER BY experience_years DESC').all() as any[];
  const formatted = doctors.map(d => ({
    ...d,
    specialties: JSON.parse(d.specialties_json || '[]')
  }));
  res.json(formatted);
});

// Get services
apiRouter.get('/services', (_req: Request, res: Response) => {
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC').all();
  res.json(services);
});

// Calculate real-time available time slots for a given doctor & date
apiRouter.get('/availability', (req: Request, res: Response) => {
  const { doctorId, date } = req.query as { doctorId?: string; date?: string };

  if (!doctorId || !date) {
    return res.status(400).json({ error: 'Missing required doctorId or date parameter' });
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
  }

  // Check if date is in the past
  const targetDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (targetDate.getTime() < today.getTime()) {
    return res.status(400).json({ error: 'Cannot book appointments for past dates' });
  }

  // Check if clinic holiday
  const holiday = db.prepare('SELECT reason FROM clinic_holidays WHERE holiday_date = ?').get(date) as any;
  if (holiday) {
    return res.json({
      isOpen: false,
      reason: `Clinic is closed on this date (${holiday.reason})`,
      slots: []
    });
  }

  // Check day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) {
    return res.json({
      isOpen: false,
      reason: 'The clinic is closed on Sundays for scheduled outpatient appointments. Emergency services are available on call.',
      slots: []
    });
  }

  // Fetch doctor schedule for this day
  const schedule = db.prepare(`
    SELECT * FROM doctor_schedules 
    WHERE doctor_id = ? AND day_of_week = ?
  `).get(doctorId, dayOfWeek) as any;

  if (!schedule) {
    return res.json({
      isOpen: false,
      reason: 'The selected doctor does not hold regular clinic hours on this day.',
      slots: []
    });
  }

  // Generate slots
  const [startH, startM] = schedule.start_time.split(':').map(Number);
  const [endH, endM] = schedule.end_time.split(':').map(Number);
  const slotMinutes = schedule.slot_duration_minutes || 30;

  let [breakStartH, breakStartM] = [-1, -1];
  let [breakEndH, breakEndM] = [-1, -1];
  if (schedule.break_start && schedule.break_end) {
    [breakStartH, breakStartM] = schedule.break_start.split(':').map(Number);
    [breakEndH, breakEndM] = schedule.break_end.split(':').map(Number);
  }

  const bookedAppointments = db.prepare(`
    SELECT time_slot FROM appointments
    WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'
  `).all(doctorId, date) as { time_slot: string }[];

  const bookedSet = new Set(bookedAppointments.map(b => b.time_slot));

  // Determine current time cutoff if date is today
  const isToday = targetDate.toDateString() === new Date().toDateString();
  const currentMinutesFromMidnight = new Date().getHours() * 60 + new Date().getMinutes();

  const slots: { time: string; display: string; available: boolean; reason?: string }[] = [];
  let currentMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  const breakStartTotal = breakStartH >= 0 ? breakStartH * 60 + breakStartM : -1;
  const breakEndTotal = breakEndH >= 0 ? breakEndH * 60 + breakEndM : -1;

  while (currentMin + slotMinutes <= endMin) {
    // Check if within break
    const isInBreak = breakStartTotal >= 0 && currentMin >= breakStartTotal && currentMin < breakEndTotal;
    
    const h = Math.floor(currentMin / 60);
    const m = currentMin % 60;
    const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayTime = `${displayH}:${String(m).padStart(2, '0')} ${period}`;

    if (isInBreak) {
      currentMin += slotMinutes;
      continue;
    }

    const isPastTime = isToday && currentMin <= (currentMinutesFromMidnight + 15); // 15 min buffer
    const isBooked = bookedSet.has(time24) || bookedSet.has(displayTime);

    let available = true;
    let reason: string | undefined = undefined;

    if (isPastTime) {
      available = false;
      reason = 'Time slot has passed';
    } else if (isBooked) {
      available = false;
      reason = 'Already booked';
    }

    slots.push({
      time: time24,
      display: displayTime,
      available,
      reason
    });

    currentMin += slotMinutes;
  }

  res.json({
    isOpen: true,
    doctorId,
    date,
    totalSlots: slots.length,
    availableSlots: slots.filter(s => s.available).length,
    slots
  });
});

// ==========================================
// 2. APPOINTMENT BOOKING & PATIENT MANAGEMENT
// ==========================================

// Create new appointment (Strict server-side validation & ACID transaction to prevent double booking)
apiRouter.post('/appointments', (req: Request, res: Response) => {
  const {
    doctorId,
    serviceId,
    appointmentDate,
    timeSlot,
    patientName,
    patientPhone,
    patientEmail,
    patientAge,
    patientGender,
    visitType = 'in_person',
    medicalNotes = ''
  } = req.body;

  // Basic validation
  if (!doctorId || !serviceId || !appointmentDate || !timeSlot) {
    return res.status(400).json({ error: 'Please choose doctor, service, date, and time slot.' });
  }

  if (!patientName || !patientName.trim()) {
    return res.status(400).json({ error: 'Patient full name is required.' });
  }

  const cleanPhone = String(patientPhone || '').replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
  }

  if (!patientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address for appointment confirmation.' });
  }

  const ageNum = Number(patientAge);
  if (!ageNum || ageNum < 1 || ageNum > 125) {
    return res.status(400).json({ error: 'Please enter a valid patient age.' });
  }

  // Verify doctor exists
  const doctor = db.prepare('SELECT id, name, consultation_fee, room_no FROM doctors WHERE id = ? AND is_active = 1').get(doctorId) as any;
  if (!doctor) {
    return res.status(404).json({ error: 'Selected doctor is not currently available.' });
  }

  // Verify service exists
  const service = db.prepare('SELECT id, name, fee, duration_minutes FROM services WHERE id = ? AND is_active = 1').get(serviceId) as any;
  if (!service) {
    return res.status(404).json({ error: 'Selected medical service was not found.' });
  }

  // Verify date not in past
  const targetDate = new Date(appointmentDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (targetDate.getTime() < today.getTime()) {
    return res.status(400).json({ error: 'Cannot book appointments for past dates.' });
  }

  // Check holiday
  const holiday = db.prepare('SELECT reason FROM clinic_holidays WHERE holiday_date = ?').get(appointmentDate) as any;
  if (holiday) {
    return res.status(400).json({ error: `The clinic is closed on ${appointmentDate} for ${holiday.reason}.` });
  }

  const bookingRef = generateBookingReference();
  const appointmentId = generateId();
  const now = new Date().toISOString();

  try {
    // Atomically check and insert
    db.exec('BEGIN TRANSACTION;');

    const existingConflict = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'cancelled'
    `).get(doctorId, appointmentDate, timeSlot);

    if (existingConflict) {
      db.exec('ROLLBACK;');
      return res.status(409).json({
        error: 'This specific time slot has just been reserved by another patient. Please select an alternate time slot.'
      });
    }

    db.prepare(`
      INSERT INTO appointments (
        id, booking_reference, doctor_id, service_id, appointment_date, time_slot,
        status, patient_name, patient_phone, patient_email, patient_age, patient_gender,
        visit_type, medical_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appointmentId,
      bookingRef,
      doctorId,
      serviceId,
      appointmentDate,
      timeSlot,
      'confirmed',
      patientName.trim(),
      patientPhone.trim(),
      patientEmail.trim().toLowerCase(),
      ageNum,
      patientGender || 'Prefer not to say',
      visitType,
      medicalNotes ? medicalNotes.trim() : '',
      now,
      now
    );

    // Audit log entry
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      'system',
      'APPOINTMENT_BOOKED',
      'appointment',
      appointmentId,
      JSON.stringify({ bookingRef, doctor: doctor.name, service: service.name, date: appointmentDate, slot: timeSlot }),
      now
    );

    db.exec('COMMIT;');

    // Sync to Supabase in background
    syncAppointmentToSupabase({
      id: appointmentId,
      booking_reference: bookingRef,
      doctor_id: doctorId,
      doctor_name: doctor.name,
      service_id: serviceId,
      service_name: service.name,
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      status: 'confirmed',
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim(),
      patient_email: patientEmail.trim().toLowerCase(),
      patient_age: ageNum,
      patient_gender: patientGender || 'Prefer not to say',
      visit_type: visitType,
      fee: service.fee || doctor.consultation_fee,
      medical_notes: medicalNotes ? medicalNotes.trim() : null,
      created_at: now
    }).catch((e) => console.warn('[Supabase Sync Notice]:', e.message));

    res.status(201).json({
      success: true,
      message: 'Appointment successfully confirmed and scheduled in clinic database.',
      appointment: {
        id: appointmentId,
        bookingReference: bookingRef,
        doctorName: doctor.name,
        doctorRoom: doctor.room_no,
        serviceName: service.name,
        appointmentDate,
        timeSlot,
        fee: service.fee || doctor.consultation_fee,
        durationMinutes: service.duration_minutes,
        visitType,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim().toLowerCase(),
        status: 'confirmed',
        createdAt: now
      }
    });
  } catch (err: any) {
    try { db.exec('ROLLBACK;'); } catch {}
    if (err.message && (err.message.includes('idx_no_double_booking') || err.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({
        error: 'Double-booking prevented: This slot is already reserved for another appointment. Please pick another time slot.'
      });
    }
    console.error('Booking insertion error:', err);
    res.status(500).json({ error: 'A database error occurred while creating your appointment. Please try again.' });
  }
});

// Patient Booking Lookup
apiRouter.get('/appointments/lookup', (req: Request, res: Response) => {
  const { reference, phone } = req.query as { reference?: string; phone?: string };

  if (!reference || !phone) {
    return res.status(400).json({ error: 'Please provide both your Booking Reference and registered Contact Phone number.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const refClean = String(reference).trim().toUpperCase();

  const appt = db.prepare(`
    SELECT a.*, d.name AS doctor_name, d.specialty AS doctor_specialty, d.room_no,
           s.name AS service_name, s.fee AS service_fee, s.duration_minutes
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    JOIN services s ON a.service_id = s.id
    WHERE a.booking_reference = ?
  `).get(refClean) as any;

  if (!appt) {
    return res.status(404).json({ error: 'No booking record found for the provided reference number.' });
  }

  // Check phone match (last 10 digits comparison)
  const apptPhoneDigits = String(appt.patient_phone).replace(/\D/g, '');
  if (!apptPhoneDigits.endsWith(cleanPhone) && !cleanPhone.endsWith(apptPhoneDigits)) {
    return res.status(403).json({ error: 'The phone number provided does not match the registered booking phone.' });
  }

  res.json({
    id: appt.id,
    bookingReference: appt.booking_reference,
    doctorName: appt.doctor_name,
    doctorSpecialty: appt.doctor_specialty,
    doctorRoom: appt.room_no,
    serviceName: appt.service_name,
    fee: appt.service_fee,
    durationMinutes: appt.duration_minutes,
    appointmentDate: appt.appointment_date,
    timeSlot: appt.time_slot,
    status: appt.status,
    patientName: appt.patient_name,
    patientPhone: appt.patient_phone,
    patientEmail: appt.patient_email,
    visitType: appt.visit_type,
    medicalNotes: appt.medical_notes,
    createdAt: appt.created_at
  });
});

// Patient Rescheduling
apiRouter.post('/appointments/reschedule', (req: Request, res: Response) => {
  const { reference, phone, newDate, newTimeSlot } = req.body;

  if (!reference || !phone || !newDate || !newTimeSlot) {
    return res.status(400).json({ error: 'Reference, phone, new date, and new time slot are required.' });
  }

  const appt = db.prepare(`
    SELECT * FROM appointments WHERE booking_reference = ?
  `).get(String(reference).trim().toUpperCase()) as any;

  if (!appt) {
    return res.status(404).json({ error: 'Booking reference not found.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const apptPhoneDigits = String(appt.patient_phone).replace(/\D/g, '');
  if (!apptPhoneDigits.endsWith(cleanPhone)) {
    return res.status(403).json({ error: 'Phone verification failed.' });
  }

  if (appt.status === 'cancelled') {
    return res.status(400).json({ error: 'Cancelled appointments cannot be rescheduled. Please book a new appointment.' });
  }

  try {
    db.exec('BEGIN TRANSACTION;');

    // Check if slot available
    const conflict = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'cancelled' AND id != ?
    `).get(appt.doctor_id, newDate, newTimeSlot, appt.id);

    if (conflict) {
      db.exec('ROLLBACK;');
      return res.status(409).json({ error: 'The chosen new time slot is unavailable.' });
    }

    db.prepare(`
      UPDATE appointments 
      SET appointment_date = ?, time_slot = ?, status = 'rescheduled', updated_at = ?
      WHERE id = ?
    `).run(newDate, newTimeSlot, new Date().toISOString(), appt.id);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      'patient',
      'APPOINTMENT_RESCHEDULED',
      'appointment',
      appt.id,
      JSON.stringify({ oldDate: appt.appointment_date, oldSlot: appt.time_slot, newDate, newTimeSlot }),
      new Date().toISOString()
    );

    db.exec('COMMIT;');

    updateSupabaseAppointmentStatus(appt.booking_reference, {
      status: 'rescheduled',
      appointment_date: newDate,
      time_slot: newTimeSlot
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Appointment successfully rescheduled.',
      newDate,
      newTimeSlot
    });
  } catch (err: any) {
    try { db.exec('ROLLBACK;'); } catch {}
    res.status(500).json({ error: 'Could not reschedule appointment: ' + err.message });
  }
});

// Patient Cancellation
apiRouter.post('/appointments/cancel', (req: Request, res: Response) => {
  const { reference, phone, reason = 'Patient requested cancellation' } = req.body;

  if (!reference || !phone) {
    return res.status(400).json({ error: 'Booking reference and phone are required.' });
  }

  const appt = db.prepare(`
    SELECT * FROM appointments WHERE booking_reference = ?
  `).get(String(reference).trim().toUpperCase()) as any;

  if (!appt) {
    return res.status(404).json({ error: 'Booking reference not found.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const apptPhoneDigits = String(appt.patient_phone).replace(/\D/g, '');
  if (!apptPhoneDigits.endsWith(cleanPhone)) {
    return res.status(403).json({ error: 'Phone verification failed.' });
  }

  if (appt.status === 'cancelled') {
    return res.status(400).json({ error: 'This appointment has already been cancelled.' });
  }

  db.prepare(`
    UPDATE appointments
    SET status = 'cancelled', cancellation_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(reason, new Date().toISOString(), appt.id);

  updateSupabaseAppointmentStatus(appt.booking_reference, {
    status: 'cancelled',
    cancellation_reason: reason
  }).catch(() => {});

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(),
    'patient',
    'APPOINTMENT_CANCELLED',
    'appointment',
    appt.id,
    JSON.stringify({ reason }),
    new Date().toISOString()
  );

  res.json({
    success: true,
    message: 'Appointment has been cancelled. The time slot is now available for other patients.'
  });
});

// ==========================================
// 3. ADMIN AUTHENTICATION
// ==========================================

// Rate limiting map for admin login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= 20) {
    const minsLeft = Math.ceil((attempt.resetAt - now) / 60000);
    return res.status(429).json({ error: `Too many failed login attempts. Please wait ${minsLeft} minute(s) before trying again.` });
  }
  if (attempt && attempt.resetAt <= now) {
    loginAttempts.delete(ip);
  }

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username or email and password are required.' });
  }

  const cleanId = String(identifier).trim();
  const user = db.prepare(`
    SELECT * FROM admin_users 
    WHERE (username = ? OR email = ?) AND is_active = 1
  `).get(cleanId, cleanId.toLowerCase()) as any;

  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    const cur = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    cur.count++;
    loginAttempts.set(ip, cur);
    return res.status(401).json({ error: 'Invalid login credentials. Please verify your username/email and password.' });
  }

  // Clear attempts on success
  loginAttempts.delete(ip);

  // Generate session token (valid 24h)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO admin_sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, user.id, expiresAt, new Date().toISOString());

  db.prepare(`
    UPDATE admin_users SET last_login = ? WHERE id = ?
  `).run(new Date().toISOString(), user.id);

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(generateId(), user.id, 'ADMIN_LOGIN_SUCCESS', 'auth', user.id, ip, new Date().toISOString());

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    id: user.user_id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

apiRouter.post('/auth/change-password', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const fullUser = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(user.user_id) as any;
  if (!fullUser || !verifyPassword(currentPassword, fullUser.password_hash, fullUser.salt)) {
    return res.status(401).json({ error: 'Current password is not correct.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare(`
    UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?
  `).run(hash, salt, user.user_id);

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(generateId(), user.user_id, 'PASSWORD_CHANGED', 'admin_user', user.user_id, new Date().toISOString());

  res.json({ success: true, message: 'Password updated successfully.' });
});

// ==========================================
// 4. SECURE ADMIN DASHBOARD OPERATIONS
// ==========================================

// Get all appointments with filters
apiRouter.get('/admin/appointments', requireAdmin, (req: Request, res: Response) => {
  const { date, status, search } = req.query as { date?: string; status?: string; search?: string };

  let query = `
    SELECT a.*, d.name AS doctor_name, s.name AS service_name, s.fee AS service_fee
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    JOIN services s ON a.service_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    query += ` AND a.appointment_date = ?`;
    params.push(date);
  }

  if (status && status !== 'all') {
    query += ` AND a.status = ?`;
    params.push(status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query += ` AND (a.patient_name LIKE ? OR a.patient_phone LIKE ? OR a.booking_reference LIKE ?)`;
    params.push(term, term, term);
  }

  query += ` ORDER BY a.appointment_date DESC, a.time_slot ASC LIMIT 200`;

  const appointments = db.prepare(query).all(...params);
  res.json(appointments);
});

// Update appointment status
apiRouter.patch('/admin/appointments/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const user = (req as any).user;

  if (!['confirmed', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status.' });
  }

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any;
  if (!appt) return res.status(404).json({ error: 'Appointment not found.' });

  db.prepare(`
    UPDATE appointments 
    SET status = ?, medical_notes = COALESCE(?, medical_notes), updated_at = ?
    WHERE id = ?
  `).run(status, notes || null, new Date().toISOString(), id);

  updateSupabaseAppointmentStatus(appt.booking_reference, { status }).catch(() => {});

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(),
    user.user_id,
    'APPOINTMENT_STATUS_UPDATE',
    'appointment',
    id,
    JSON.stringify({ previous: appt.status, newStatus: status, notes }),
    new Date().toISOString()
  );

  res.json({ success: true, message: `Status updated to ${status}.` });
});

// Admin stats
apiRouter.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalBookings = (db.prepare('SELECT COUNT(*) as count FROM appointments').get() as any).count;
  const confirmedCount = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'").get() as any).count;
  const completedCount = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'").get() as any).count;
  const cancelledCount = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'").get() as any).count;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = (db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != "cancelled"').get(todayStr) as any).count;

  // Estimated revenue from confirmed & completed
  const revenueEst = (db.prepare(`
    SELECT SUM(s.fee) as total
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.status IN ('confirmed', 'completed')
  `).get() as any).total || 0;

  // Services distribution
  const serviceDistribution = db.prepare(`
    SELECT s.name, COUNT(a.id) as count
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    GROUP BY s.id
    ORDER BY count DESC
    LIMIT 5
  `).all();

  res.json({
    totalBookings,
    confirmedCount,
    completedCount,
    cancelledCount,
    todayBookings,
    revenueEstimate: revenueEst,
    serviceDistribution
  });
});

// Admin clinic holidays management
apiRouter.get('/admin/holidays', requireAdmin, (_req: Request, res: Response) => {
  const holidays = db.prepare('SELECT * FROM clinic_holidays ORDER BY holiday_date ASC').all();
  res.json(holidays);
});

apiRouter.post('/admin/holidays', requireAdmin, (req: Request, res: Response) => {
  const { date, reason } = req.body;
  if (!date || !reason) return res.status(400).json({ error: 'Date and reason are required.' });

  try {
    db.prepare(`
      INSERT INTO clinic_holidays (id, holiday_date, reason, created_at)
      VALUES (?, ?, ?, ?)
    `).run(generateId(), date, reason, new Date().toISOString());

    res.json({ success: true, message: 'Holiday scheduled successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: 'Holiday date already exists or invalid: ' + err.message });
  }
});

apiRouter.delete('/admin/holidays/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM clinic_holidays WHERE id = ?').run(id);
  res.json({ success: true, message: 'Holiday removed.' });
});

// Update service fee and duration
apiRouter.put('/admin/services/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { fee, durationMinutes, name, description, is_active } = req.body;
  const user = (req as any).user;

  const feeNum = Number(fee);
  if (isNaN(feeNum) || feeNum < 0) {
    return res.status(400).json({ error: 'Valid consultation fee is required.' });
  }

  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  db.prepare(`
    UPDATE services 
    SET fee = ?, 
        duration_minutes = COALESCE(?, duration_minutes),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    feeNum,
    durationMinutes ? Number(durationMinutes) : null,
    name || null,
    description || null,
    is_active !== undefined ? Number(is_active) : null,
    id
  );

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(),
    user.user_id,
    'SERVICE_FEE_UPDATED',
    'service',
    id,
    JSON.stringify({ service: existing.name, oldFee: existing.fee, newFee: feeNum }),
    new Date().toISOString()
  );

  res.json({
    success: true,
    message: `Consultation fee for ${existing.name} updated to ₹${feeNum}.`,
    serviceId: id,
    fee: feeNum
  });
});

// Update Doctor base consultation fee
apiRouter.put('/admin/doctors/:id/fee', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { consultationFee } = req.body;
  const user = (req as any).user;

  const feeNum = Number(consultationFee);
  if (isNaN(feeNum) || feeNum < 0) {
    return res.status(400).json({ error: 'Valid consultation fee is required.' });
  }

  const doc = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id) as any;
  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found.' });
  }

  db.prepare(`
    UPDATE doctors SET consultation_fee = ? WHERE id = ?
  `).run(feeNum, id);

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(),
    user.user_id,
    'DOCTOR_FEE_UPDATED',
    'doctor',
    id,
    JSON.stringify({ doctor: doc.name, oldFee: doc.consultation_fee, newFee: feeNum }),
    new Date().toISOString()
  );

  res.json({
    success: true,
    message: `Consultation fee for ${doc.name} updated to ₹${feeNum}.`,
    consultationFee: feeNum
  });
});


// Export appointments as CSV
apiRouter.get('/admin/export', requireAdmin, (_req: Request, res: Response) => {
  const appts = db.prepare(`
    SELECT a.booking_reference, a.appointment_date, a.time_slot, a.status,
           a.patient_name, a.patient_phone, a.patient_email, a.patient_age, a.patient_gender,
           a.visit_type, d.name as doctor_name, s.name as service_name, s.fee, a.created_at
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    JOIN services s ON a.service_id = s.id
    ORDER BY a.appointment_date DESC, a.time_slot ASC
  `).all() as any[];

  const headers = ['Reference', 'Date', 'Time', 'Status', 'Patient Name', 'Phone', 'Email', 'Age', 'Gender', 'Visit Type', 'Doctor', 'Service', 'Fee (INR)', 'Booked On'];
  const rows = appts.map(a => [
    `"${a.booking_reference}"`,
    `"${a.appointment_date}"`,
    `"${a.time_slot}"`,
    `"${a.status}"`,
    `"${a.patient_name.replace(/"/g, '""')}"`,
    `"${a.patient_phone}"`,
    `"${a.patient_email}"`,
    a.patient_age,
    `"${a.patient_gender}"`,
    `"${a.visit_type}"`,
    `"${a.doctor_name}"`,
    `"${a.service_name}"`,
    a.fee,
    `"${a.created_at}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=appointments_export_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

// Audit logs
apiRouter.get('/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50
  `).all();
  res.json(logs);
});

// Check Supabase status
apiRouter.get('/admin/supabase-status', requireAdmin, async (_req: Request, res: Response) => {
  const status = await checkSupabaseStatus();
  res.json({
    projectId: 'roiosxwzdffjawbfboch',
    url: 'https://roiosxwzdffjawbfboch.supabase.co',
    ...status
  });
});

// Sync all existing bookings to Supabase
apiRouter.post('/admin/supabase-sync-all', requireAdmin, async (_req: Request, res: Response) => {
  const allAppts = db.prepare(`
    SELECT a.*, d.name AS doctor_name, s.name AS service_name, s.fee AS fee
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN services s ON a.service_id = s.id
  `).all() as any[];

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const appt of allAppts) {
    const res = await syncAppointmentToSupabase(appt);
    if (res.success) {
      synced++;
    } else {
      failed++;
      if (res.error && !errors.includes(res.error)) errors.push(res.error);
    }
  }

  res.json({
    total: allAppts.length,
    synced,
    failed,
    errors
  });
});
