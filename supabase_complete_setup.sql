-- =========================================================================
-- DR. JAYANTH S S - NEURO CARE CLINIC
-- COMPLETE SUPABASE POSTGRESQL DATABASE SETUP SCRIPT
-- Target Project ID: roiosxwzdffjawbfboch
-- =========================================================================

-- 1. CLINIC INFORMATION TABLE
CREATE TABLE IF NOT EXISTS public.clinic_info (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  specialty TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  email TEXT,
  rating NUMERIC(2,1) DEFAULT 4.9,
  review_count INTEGER DEFAULT 161,
  maps_url TEXT,
  hours_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  consultation_fee INTEGER NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  specialties JSONB,
  room_no TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEDICAL SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  fee INTEGER NOT NULL,
  is_online_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0
);

-- 4. CLINIC HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS public.clinic_holidays (
  id TEXT PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  visit_type TEXT DEFAULT 'in_person' CHECK (visit_type IN ('in_person', 'video')),
  fee INTEGER DEFAULT 800,
  medical_notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- INDEXES & CONSTRAINTS FOR PERFORMANCE AND DOUBLE-BOOKING PREVENTION
-- -------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_supabase_appts_lookup 
ON public.appointments (booking_reference, patient_phone);

CREATE INDEX IF NOT EXISTS idx_supabase_appts_date 
ON public.appointments (appointment_date, time_slot);

-- Prevent two patients from booking the same doctor, date, and slot concurrently
CREATE UNIQUE INDEX IF NOT EXISTS idx_supabase_no_double_booking 
ON public.appointments (doctor_id, appointment_date, time_slot) 
WHERE status != 'cancelled';

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES (Enables your Publishable / Anon Key)
-- -------------------------------------------------------------------------

ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anon key full read access to clinic directory
CREATE POLICY "Public read clinic_info" ON public.clinic_info FOR SELECT USING (true);
CREATE POLICY "Public read doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public read holidays" ON public.clinic_holidays FOR SELECT USING (true);

-- Allow public booking operations on appointments
CREATE POLICY "Public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public update appointments" ON public.appointments FOR UPDATE USING (true);

-- -------------------------------------------------------------------------
-- SEED VERIFIED CLINIC DATA
-- -------------------------------------------------------------------------

-- Insert Clinic Info
INSERT INTO public.clinic_info (
  id, name, tagline, specialty, address, city, state, pincode,
  phone, alt_phone, email, rating, review_count, maps_url, hours_json
) VALUES (
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
  '[
    {"day": "Monday", "opens": "10:00 AM", "closes": "07:00 PM", "open": true},
    {"day": "Tuesday", "opens": "10:00 AM", "closes": "07:00 PM", "open": true},
    {"day": "Wednesday", "opens": "10:00 AM", "closes": "07:00 PM", "open": true},
    {"day": "Thursday", "opens": "10:00 AM", "closes": "07:00 PM", "open": true},
    {"day": "Friday", "opens": "10:00 AM", "closes": "07:00 PM", "open": true},
    {"day": "Saturday", "opens": "10:00 AM", "closes": "07:00 PM", "open": true},
    {"day": "Sunday", "opens": "Closed", "closes": "Closed", "open": false}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert Doctor Dr. Jayanth S S
INSERT INTO public.doctors (
  id, name, title, specialty, qualifications, experience_years,
  consultation_fee, bio, room_no, is_active, specialties
) VALUES (
  'doc_jayanth_ss',
  'Dr. Jayanth S S',
  'Senior Consultant Neurologist & Neuroimmunologist',
  'Neurology & Neuroimmunology',
  'MBBS (RGUHS), MD General Medicine (BLDE), DM Neurology (NIMHANS), Fellowship in Neuroimmunology',
  12,
  800,
  'Dr. Jayanth S S is an accomplished Consultant Neurologist with specialized post-doctoral fellowship training in Neuroimmunology and a DM in Neurology from the premier National Institute of Mental Health and Neurosciences (NIMHANS), Bengaluru. He has extensive expertise in diagnosing complex neurological disorders, acute stroke care, intractable headache disorders with botulinum toxin injection protocols, and advanced neuro-immunological conditions.',
  'Room 204, OPD Wing, Apollo Hospitals',
  true,
  '[
    "Neuroimmunology & Multiple Sclerosis",
    "Acute Stroke Management & Thrombolysis",
    "Botox Therapy for Refractory Migraine",
    "Epilepsy & Seizure Disorder Management",
    "Parkinsons & Deep Brain Stimulation (DBS)",
    "Neuropathy & Neuro-Muscular Disorders"
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert Verified Medical Services
INSERT INTO public.services (id, name, category, description, duration_minutes, fee, is_online_available, display_order)
VALUES
  ('srv_gen_consult', 'Neurology Consultation', 'Consultation', 'Comprehensive evaluation for neurological symptoms including headache, numbness, tremors, weakness, dizziness, and nerve pain.', 30, 800, true, 1),
  ('srv_neuroimm_eval', 'Neuroimmunology & MS Assessment', 'Specialty Care', 'Targeted assessment for Multiple Sclerosis, Neuromyelitis Optica (NMOSD), MOGAD, autoimmune encephalitis, and myasthenia gravis.', 45, 1200, true, 2),
  ('srv_migraine_botox', 'Chronic Migraine & Headache Care', 'Interventional Care', 'Clinical protocol diagnosis and candidacy screening for therapeutic botulinum toxin (Botox) therapy and CGRP monoclonal antibody treatment.', 30, 1000, true, 3),
  ('srv_stroke_tia', 'Stroke Prevention & Recovery Follow-up', 'Vascular Neurology', 'Secondary stroke prevention, neurovascular risk factor management, post-thrombolysis neuro-rehabilitation planning.', 30, 800, true, 4),
  ('srv_epilepsy', 'Epilepsy & Seizure Disorder Clinic', 'Epileptology', 'First seizure workup, antiepileptic drug optimization, EEG correlation, and refractory seizure assessment.', 30, 800, true, 5),
  ('srv_dbs_parkinsons', 'Parkinsons & Movement Disorders Review', 'Movement Disorders', 'Comprehensive motor staging, Deep Brain Stimulation (DBS) pre-surgical workup and post-operative programming review.', 45, 1200, true, 6),
  ('srv_video_teleconsult', 'Tele-Neurology Video Consultation', 'Virtual Care', 'Secure, high-definition online video consultation with Dr. Jayanth S S for patients requiring remote follow-up or report reviews.', 30, 800, true, 7)
ON CONFLICT (id) DO NOTHING;
