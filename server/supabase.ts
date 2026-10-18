import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'roiosxwzdffjawbfboch';
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_VaJAUV2G7h7CsDXTcvlIMw_A1fzJuwG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseSyncResult {
  connected: boolean;
  tableReady: boolean;
  message: string;
}

// Check connection and whether table exists
export async function checkSupabaseStatus(): Promise<SupabaseSyncResult> {
  try {
    const { data, error } = await supabase.from('appointments').select('id').limit(1);
    if (error) {
      if (error.message.includes('schema cache') || error.code === 'PGRST204' || error.code === '42P01') {
        return {
          connected: true,
          tableReady: false,
          message: 'Connected to Supabase project roiosxwzdffjawbfboch. Table "appointments" has not been created yet in Supabase.'
        };
      }
      return {
        connected: false,
        tableReady: false,
        message: `Supabase returned error: ${error.message}`
      };
    }
    return {
      connected: true,
      tableReady: true,
      message: `Connected to Supabase project roiosxwzdffjawbfboch! Table "appointments" is active (${data?.length || 0} sample rows accessible).`
    };
  } catch (err: any) {
    return {
      connected: false,
      tableReady: false,
      message: `Failed to connect to Supabase: ${err.message}`
    };
  }
}

// Sync an appointment to Supabase
export async function syncAppointmentToSupabase(appointment: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: appointment.id,
      booking_reference: appointment.booking_reference || appointment.bookingReference,
      doctor_id: appointment.doctor_id || appointment.doctorId,
      doctor_name: appointment.doctor_name || appointment.doctorName,
      service_id: appointment.service_id || appointment.serviceId,
      service_name: appointment.service_name || appointment.serviceName,
      appointment_date: appointment.appointment_date || appointment.appointmentDate,
      time_slot: appointment.time_slot || appointment.timeSlot,
      status: appointment.status,
      patient_name: appointment.patient_name || appointment.patientName,
      patient_phone: appointment.patient_phone || appointment.patientPhone,
      patient_email: appointment.patient_email || appointment.patientEmail,
      patient_age: appointment.patient_age || appointment.patientAge,
      patient_gender: appointment.patient_gender || appointment.patientGender,
      visit_type: appointment.visit_type || appointment.visitType,
      fee: appointment.fee,
      medical_notes: appointment.medical_notes || appointment.medicalNotes || null,
      created_at: appointment.created_at || appointment.createdAt || new Date().toISOString(),
      updated_at: appointment.updated_at || new Date().toISOString()
    };

    const { error } = await supabase.from('appointments').upsert(payload, { onConflict: 'booking_reference' });
    if (error) {
      console.warn('[Supabase Sync Warning]:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Supabase Sync]: Synced appointment', payload.booking_reference);
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Sync Error]:', err.message);
    return { success: false, error: err.message };
  }
}

// Sync appointment cancellation or reschedule to Supabase
export async function updateSupabaseAppointmentStatus(
  bookingReference: string,
  updates: { status: string; appointment_date?: string; time_slot?: string; cancellation_reason?: string }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('booking_reference', bookingReference);

    if (error) {
      console.warn('[Supabase Update Warning]:', error.message);
    } else {
      console.log('[Supabase Update]: Updated appointment', bookingReference);
    }
  } catch (err: any) {
    console.warn('[Supabase Update Error]:', err.message);
  }
}
