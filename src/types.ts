export interface ClinicInfo {
  id: string;
  name: string;
  tagline: string;
  specialty: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alt_phone: string;
  email: string;
  rating: number;
  review_count: number;
  maps_url: string;
  hours: {
    day: string;
    opens: string;
    closes: string;
    open: boolean;
  }[];
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  qualifications: string;
  experience_years: number;
  consultation_fee: number;
  avatar_url: string;
  bio: string;
  specialties: string[];
  room_no: string;
  is_active: number;
}

export interface MedicalService {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  fee: number;
  is_online_available: number;
  display_order: number;
}

export interface TimeSlot {
  time: string;
  display: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityResponse {
  isOpen: boolean;
  reason?: string;
  doctorId: string;
  date: string;
  totalSlots: number;
  availableSlots: number;
  slots: TimeSlot[];
}

export interface Appointment {
  id: string;
  booking_reference: string;
  doctor_id: string;
  service_id: string;
  doctor_name: string;
  doctor_specialty?: string;
  doctor_room?: string;
  service_name: string;
  service_fee?: number;
  fee?: number;
  duration_minutes?: number;
  appointment_date: string;
  time_slot: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  patient_age: number;
  patient_gender: string;
  visit_type: 'in_person' | 'video';
  medical_notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface AdminStats {
  totalBookings: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  todayBookings: number;
  revenueEstimate: number;
  serviceDistribution: { name: string; count: number }[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details_json: string;
  ip_address?: string;
  created_at: string;
}
