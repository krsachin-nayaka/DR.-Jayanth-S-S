-- =========================================================================
-- DR. JAYANTH S S NEURO CARE CLINIC - SUPABASE POSTGRESQL SCHEMA
-- Project ID: roiosxwzdffjawbfboch
-- =========================================================================

-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  visit_type TEXT DEFAULT 'in_person',
  fee INTEGER DEFAULT 800,
  medical_notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance & Concurrency Indexes
CREATE INDEX IF NOT EXISTS idx_supabase_appts_lookup 
ON public.appointments (booking_reference, patient_phone);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supabase_no_double_booking 
ON public.appointments (doctor_id, appointment_date, time_slot) 
WHERE status != 'cancelled';

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anon public key to insert appointments
DROP POLICY IF EXISTS "Enable insert for anon key" ON public.appointments;
CREATE POLICY "Enable insert for anon key" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- Allow anon public key to select appointments
DROP POLICY IF EXISTS "Enable select for anon key" ON public.appointments;
CREATE POLICY "Enable select for anon key" 
ON public.appointments 
FOR SELECT 
USING (true);

-- Allow anon public key to update appointments (reschedule/cancel)
DROP POLICY IF EXISTS "Enable update for anon key" ON public.appointments;
CREATE POLICY "Enable update for anon key" 
ON public.appointments 
FOR UPDATE 
USING (true);
