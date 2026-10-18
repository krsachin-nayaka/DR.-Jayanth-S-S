# Dr. Jayanth S S – Neuro Care Clinic Appointment Booking System

Production-ready, responsive healthcare website and online appointment booking portal designed for the practice of **Dr. Jayanth S S** (Senior Consultant Neurologist & Neuroimmunologist) located at **Apollo Hospitals Seshadripuram, Bengaluru**.

---

## 1. Verified Clinic Profile

* **Clinic Name**: Dr. Jayanth S S - Neuro Care Clinic
* **Medical Specialty**: Neurology & Neuroimmunology (Pediatric & Adult)
* **Address**: Old No. 28, 1, Platform Rd, VV Giri Colony, Seshadripuram, Bengaluru, Karnataka 560020
* **Google Maps Link**: [https://share.google/ngFEFvWuzwTjT2xAh](https://share.google/ngFEFvWuzwTjT2xAh)
* **Google Rating**: **4.9 / 5.0** (based on 161+ verified Google reviews, 97% patient satisfaction)
* **Direct OPD Contact**: `+91 80 6278 4054` / `080 6297 2761`
* **Operating Hours**: Monday – Saturday: 10:00 AM – 07:00 PM (Closed Sundays for scheduled OPD; Emergency available)
* **Primary Consultant**: Dr. Jayanth S S, MBBS (RGUHS), MD General Medicine (BLDE), DM Neurology (NIMHANS), Fellowship in Neuroimmunology
* **Consultation Fee**: ₹800 (Standard OPD / Video Follow-up), ₹1,200 (Comprehensive Evaluation)

---

## 2. Key Features

1. **Full-Featured Booking Workflow**:
   * Multi-step intuitive booking process (Service → Doctor → Date → Real-Time Available Slot → Patient Details → Review → Instant Confirmation).
   * Generates human-friendly booking references (e.g., `NC-2026-X8K2`).
   * Downloadable calendar invites (`.ics` files for Apple Calendar, Google Calendar, Outlook).
   * Double-booking prevention enforced at the SQLite database engine level with unique index constraints and ACID transactions.
   * Prevents past-date selection and past-time slot reservations.
   * Auto-detection of clinic holidays and Sunday closures.

2. **Patient Self-Service Portal**:
   * Secure booking lookup via Reference Number and phone verification.
   * Instant rescheduling to open slots without calling the front desk.
   * Instant cancellation with reason recording and immediate slot release.

3. **Secure Administrative Dashboard (`/admin/login` or `#admin`)**:
   * Password-hashed authentication using native `scrypt` key derivation.
   * Rate-limited login endpoint to prevent brute-force attacks.
   * Real-time appointments table with search by patient name, phone, or reference.
   * One-click appointment status updates (`Confirmed`, `Completed`, `Cancelled`).
   * Scheduled holiday / clinic closure management.
   * Analytics on total appointments, revenue estimates, and service breakdown.
   * CSV Export for hospital records and auditing.
   * Immutable administrative audit trail for compliance.

---

## 3. Production Security Checklist

* [x] **Zero Credential Exposure**: No passwords, admin emails, or secrets are exposed in public pages, HTML, client-side JavaScript, or git repositories.
* [x] **Secure Password Storage**: Salted scrypt key derivation function (Node.js crypto).
* [x] **Brute-Force Protection**: Server-side rate limiting on `/api/auth/login`.
* [x] **Strict Input Validation**: Validates date formats, 10-digit phone numbers, valid emails, and appointment times.
* [x] **ACID Transactions**: Concurrent bookings for the same slot are safely rejected with HTTP 409 Conflict.
* [x] **Access Control**: Administrative routes require valid bearer session tokens.
* [x] **No Telemetry / No AI Slop**: Clean clinical aesthetic adhering to healthcare UX conventions.

---

## 4. Administrator Handover Instructions (CONFIDENTIAL)

> **CRITICAL SECURITY NOTE FOR CLINIC OWNER**:
> In compliance with strict healthcare security standards, default administrator credentials are never hardcoded into public code.
> 
> * **Admin Portal URL**: Navigate to the website and append `#admin` or click **"Staff Login"** in the top announcement bar or footer.
> * **Temporary Bootstrap Credentials**: Generated during the first database bootstrap and stored in the secure local server file `.admin_bootstrap_credentials.txt` (read-only permissions `0600`).
> * **First Login Action**: Log in using the temporary credentials, proceed to the **"Security & Audit Logs"** tab, and set a permanent administrator password.
> * Once updated, delete `.admin_bootstrap_credentials.txt`.

---

## 5. Development & Testing Commands

```bash
# Start full-stack development server on port 3000
npm run dev

# Run automated end-to-end booking & security tests
npm test

# Type-check and lint
npm run lint

# Compile production bundle
npm run build
```
