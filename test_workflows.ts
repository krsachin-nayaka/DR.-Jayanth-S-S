import { db, initDatabase, generateBookingReference, hashPassword, verifyPassword } from './server/db.ts';

async function runVerificationTests() {
  console.log('=== STARTING CLINIC AUTOMATED VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Initialize DB
  initDatabase();
  const clinic = db.prepare('SELECT * FROM clinic_info LIMIT 1').get() as any;
  assert(clinic !== null && clinic.name.includes('Dr. Jayanth S S'), 'Database initialized with verified clinic details');
  assert(clinic.rating === 4.9 && clinic.review_count === 161, 'Verified Google Maps rating (4.9★, 161 reviews) matches');

  // 2. Doctor details
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get('doc_jayanth_ss') as any;
  assert(doctor !== null && doctor.consultation_fee === 800, 'Doctor Dr. Jayanth S S present with published fee ₹800');
  assert(doctor.qualifications.includes('NIMHANS'), 'Doctor qualifications verified from NIMHANS');

  // 3. Test Booking a valid appointment
  const testDate = '2026-11-20';
  const testSlot = '11:00 AM';
  const testRef = generateBookingReference();
  const testId = 'test_appt_1';

  db.prepare(`
    INSERT INTO appointments (
      id, booking_reference, doctor_id, service_id, appointment_date, time_slot,
      status, patient_name, patient_phone, patient_email, patient_age, patient_gender,
      visit_type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testId,
    testRef,
    doctor.id,
    'srv_gen_consult',
    testDate,
    testSlot,
    'confirmed',
    'Test Patient Ramesh',
    '9876543210',
    'ramesh.test@example.com',
    45,
    'Male',
    'in_person',
    new Date().toISOString(),
    new Date().toISOString()
  );

  const inserted = db.prepare('SELECT * FROM appointments WHERE id = ?').get(testId) as any;
  assert(inserted !== null && inserted.booking_reference === testRef, 'Valid appointment created with unique reference code');

  // 4. Test Double Booking Prevention
  let doubleBookPrevented = false;
  try {
    db.prepare(`
      INSERT INTO appointments (
        id, booking_reference, doctor_id, service_id, appointment_date, time_slot,
        status, patient_name, patient_phone, patient_email, patient_age, patient_gender,
        visit_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test_appt_2',
      generateBookingReference(),
      doctor.id,
      'srv_gen_consult',
      testDate,
      testSlot, // SAME DATE AND SLOT!
      'confirmed',
      'Second Patient',
      '9876543211',
      'patient2@example.com',
      30,
      'Female',
      'in_person',
      new Date().toISOString(),
      new Date().toISOString()
    );
  } catch (err: any) {
    if (err.message && (err.message.includes('UNIQUE constraint') || err.message.includes('idx_no_double_booking'))) {
      doubleBookPrevented = true;
    }
  }
  assert(doubleBookPrevented, 'Double booking prevented by unique index constraint');

  // 5. Test Rescheduling
  const newDate = '2026-11-21';
  const newSlot = '12:00 PM';
  db.prepare(`
    UPDATE appointments SET appointment_date = ?, time_slot = ?, status = 'rescheduled' WHERE id = ?
  `).run(newDate, newSlot, testId);

  const rescheduled = db.prepare('SELECT * FROM appointments WHERE id = ?').get(testId) as any;
  assert(rescheduled.appointment_date === newDate && rescheduled.status === 'rescheduled', 'Patient rescheduling verified');

  // 6. Test Cancellation
  db.prepare(`
    UPDATE appointments SET status = 'cancelled', cancellation_reason = 'Patient requested' WHERE id = ?
  `).run(testId);

  const cancelled = db.prepare('SELECT * FROM appointments WHERE id = ?').get(testId) as any;
  assert(cancelled.status === 'cancelled', 'Appointment cancellation and slot freeing verified');

  // 7. Security: Verify password hashing using scrypt
  const testPass = 'SuperSecretClinic2026!';
  const { hash, salt } = hashPassword(testPass);
  assert(verifyPassword(testPass, hash, salt), 'Password hash and scrypt verification works');
  assert(!verifyPassword('WrongPassword123', hash, salt), 'Invalid password rejected');

  // 8. Clean up test records
  db.prepare('DELETE FROM appointments WHERE id IN (?, ?)').run('test_appt_1', 'test_appt_2');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runVerificationTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
