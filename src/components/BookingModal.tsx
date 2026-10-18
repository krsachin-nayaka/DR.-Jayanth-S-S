import React, { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, CheckCircle2, User, Phone, Mail, AlertCircle,
  ChevronRight, ChevronLeft, MapPin, Download, Check, Stethoscope, Video
} from 'lucide-react';
import { Doctor, MedicalService, TimeSlot, AvailabilityResponse } from '../types.ts';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  services: MedicalService[];
  preSelectedServiceId?: string;
  onBookingSuccess?: (bookingRef: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  doctors,
  services,
  preSelectedServiceId,
  onBookingSuccess
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [visitType, setVisitType] = useState<'in_person' | 'video'>('in_person');

  // Patient inputs
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [medicalNotes, setMedicalNotes] = useState<string>('');

  // Availability state
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [slotError, setSlotError] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Initialize doctor & service
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors]);

  useEffect(() => {
    if (preSelectedServiceId) {
      setSelectedServiceId(preSelectedServiceId);
      const svc = services.find(s => s.id === preSelectedServiceId);
      if (svc && svc.id === 'srv_video_teleconsult') {
        setVisitType('video');
      }
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [preSelectedServiceId, services]);

  // Set default date to tomorrow or earliest valid weekday
  useEffect(() => {
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (tomorrow.getDay() === 0) {
        // If Sunday, push to Monday
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [selectedDate]);

  // Fetch real-time available slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    setLoadingSlots(true);
    setSlotError('');
    setSelectedTimeSlot('');

    fetch(`/api/availability?doctorId=${encodeURIComponent(selectedDoctorId)}&date=${encodeURIComponent(selectedDate)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load availability');
        }
        setAvailability(data);
      })
      .catch((err) => {
        console.error('Availability fetch error:', err);
        setSlotError(err.message || 'Unable to check doctor schedules');
        setAvailability(null);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDoctorId, selectedDate]);

  if (!isOpen) return null;

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          serviceId: selectedServiceId,
          appointmentDate: selectedDate,
          timeSlot: selectedTimeSlot,
          patientName,
          patientPhone,
          patientEmail,
          patientAge: parseInt(patientAge, 10),
          patientGender,
          visitType,
          medicalNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Appointment booking failed');
      }

      setConfirmedBooking(data.appointment);
      setStep(5); // Show final confirmation screen
      if (onBookingSuccess) {
        onBookingSuccess(data.appointment.bookingReference);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Could not complete appointment. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate .ics calendar download
  const downloadICS = () => {
    if (!confirmedBooking) return;
    const { bookingReference, appointmentDate, timeSlot, doctorName, serviceName } = confirmedBooking;
    
    // Parse time slot (HH:MM or HH:MM AM/PM)
    let [hoursStr, minsStr] = timeSlot.split(':');
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr || '0', 10);
    if (timeSlot.toLowerCase().includes('pm') && hours < 12) hours += 12;
    if (timeSlot.toLowerCase().includes('am') && hours === 12) hours = 0;

    const [y, m, d] = appointmentDate.split('-').map(Number);
    const startDate = new Date(Date.UTC(y, m - 1, d, hours, mins));
    const endDate = new Date(Date.UTC(y, m - 1, d, hours, mins + 30));

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dr. Jayanth S S Clinic//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${bookingReference}@jayanthneuro.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:Clinic Appointment: ${doctorName} (${serviceName})`,
      `DESCRIPTION:Appointment Reference: ${bookingReference}\\nDoctor: ${doctorName}\\nLocation: Room 204, Apollo Hospitals, Seshadripuram, Bengaluru. Direct OPD: +91 80 6278 4054`,
      `LOCATION:Apollo Hospitals, Old No. 28, Platform Rd, Seshadripuram, Bengaluru, Karnataka 560020`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appointment_${bookingReference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for tomorrow's date string for input min
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base font-heading">
              {confirmedBooking ? 'Appointment Confirmed' : 'Book Clinic Appointment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar (if not confirmed) */}
        {!confirmedBooking && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs font-medium text-slate-500">
            <span className={step >= 1 ? 'text-teal-700 font-bold' : ''}>1. Service & Doctor</span>
            <span>·</span>
            <span className={step >= 2 ? 'text-teal-700 font-bold' : ''}>2. Date & Time</span>
            <span>·</span>
            <span className={step >= 3 ? 'text-teal-700 font-bold' : ''}>3. Patient Details</span>
            <span>·</span>
            <span className={step >= 4 ? 'text-teal-700 font-bold' : ''}>4. Review & Confirm</span>
          </div>
        )}

        <div className="p-6">
          
          {/* =========================================
              STEP 1: SELECT SERVICE & DOCTOR
              ========================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Select Medical Consultation Service
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        if (srv.id === 'srv_video_teleconsult') setVisitType('video');
                        else setVisitType('in_person');
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                        selectedServiceId === srv.id
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">{srv.name}</p>
                          {srv.category === 'Virtual Care' && (
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              <Video className="w-3 h-3" /> Online
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{srv.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">₹{srv.fee}</span>
                        <span className="block text-[11px] text-slate-400">{srv.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Consulting Doctor
                </label>
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-teal-600 bg-teal-50/40 flex items-center gap-3"
                  >
                    <img
                      src={doc.avatar_url}
                      alt={doc.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                      <p className="text-xs text-teal-800 font-medium">{doc.title}</p>
                      <p className="text-[11px] text-slate-500">{doc.qualifications} · {doc.room_no}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Select Date & Time</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              STEP 2: DATE & TIME SLOT SELECTOR
              ========================================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="appt-date-picker" className="block text-sm font-bold text-slate-900 mb-2">
                    Consultation Date
                  </label>
                  <input
                    id="appt-date-picker"
                    type="date"
                    min={getMinDate()}
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Regular OPD: Mon – Sat (Sundays closed for routine visits)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisitType('in_person')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        visitType === 'in_person'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>In-Clinic Visit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitType('video')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        visitType === 'video'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Consult</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {visitType === 'in_person' ? 'Apollo Seshadripuram Room 204' : 'Secure HD tele-consultation link sent via SMS'}
                  </p>
                </div>
              </div>

              {/* Slots Section */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Available Time Slots
                </label>

                {loadingSlots ? (
                  <div className="py-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying doctor schedule & current bookings...</span>
                  </div>
                ) : slotError ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    <p className="font-semibold">Notice:</p>
                    <p className="mt-0.5">{slotError}</p>
                  </div>
                ) : availability && !availability.isOpen ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    <p className="font-semibold">Closed on this date</p>
                    <p className="mt-0.5">{availability.reason}</p>
                    <p className="mt-2 text-slate-600">Please choose another date from Monday to Saturday.</p>
                  </div>
                ) : availability && availability.slots.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {availability.slots.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSelectedTimeSlot(s.time)}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                            selectedTimeSlot === s.time
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : s.available
                              ? 'bg-white hover:border-teal-500 text-slate-800 border-slate-200'
                              : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                          }`}
                          title={s.reason || (s.available ? 'Available' : 'Unavailable')}
                        >
                          {s.display}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300" />
                        <span>Available</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-teal-600" />
                        <span>Selected</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-slate-200" />
                        <span>Booked / Past</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No available slots for the selected date.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedTimeSlot}
                  onClick={() => setStep(3)}
                  className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    selectedTimeSlot
                      ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Patient Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              STEP 3: PATIENT CONTACT DETAILS
              ========================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Patient Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Used for SMS booking confirmation & rescheduling</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="patient@example.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="e.g. 45"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Gender
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Symptoms / Reason for Visit (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Recurrent migraines, previous stroke review, limb numbness..."
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!patientName.trim() || !patientPhone.trim() || !patientEmail.trim() || !patientAge}
                  onClick={() => setStep(4)}
                  className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    patientName.trim() && patientPhone.trim() && patientEmail.trim() && patientAge
                      ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Review Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              STEP 4: REVIEW & CONFIRM
              ========================================= */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Service</span>
                  <span className="text-sm font-bold text-slate-900">{currentService.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Doctor</span>
                  <span className="text-sm font-bold text-slate-900">{currentDoctor.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Scheduled Date</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedDate}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Time Slot</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedTimeSlot}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Patient</span>
                  <span className="text-sm font-semibold text-slate-900">{patientName} ({patientAge}y, {patientGender})</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Contact</span>
                  <span className="text-sm text-slate-700">{patientPhone} · {patientEmail}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700">Total Consultation Fee</span>
                  <span className="text-lg font-bold text-teal-700 tabular-nums">₹{currentService.fee}</span>
                </div>
              </div>

              {submitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-normal">
                By confirming, your appointment slot will be permanently reserved in the clinic database. Consultation fees are payable upon arrival at the OPD reception or via UPI on consultation day. Free cancellation or rescheduling available up to 2 hours prior.
              </p>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Booking...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              STEP 5: CONFIRMATION SUCCESS DISPLAY
              ========================================= */}
          {confirmedBooking && (
            <div className="text-center space-y-6 py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-2xl font-bold text-slate-900">Appointment Scheduled!</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Your appointment has been recorded in the clinic calendar.
                </p>
              </div>

              {/* Reference Code Card */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 max-w-sm mx-auto space-y-1">
                <span className="text-xs text-teal-800 font-medium uppercase tracking-wider">Booking Reference</span>
                <p className="text-2xl font-mono font-bold text-teal-900 tracking-wider">
                  {confirmedBooking.bookingReference}
                </p>
                <p className="text-[11px] text-teal-700">Save this reference to check, reschedule, or cancel your visit</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-700 space-y-1.5 max-w-md mx-auto">
                <p><span className="font-semibold">Doctor:</span> {confirmedBooking.doctorName}</p>
                <p><span className="font-semibold">Service:</span> {confirmedBooking.serviceName}</p>
                <p><span className="font-semibold">Date & Time:</span> {confirmedBooking.appointmentDate} at {confirmedBooking.timeSlot}</p>
                <p><span className="font-semibold">Location:</span> Room 204, OPD Wing, Apollo Hospitals, Platform Rd, Seshadripuram</p>
                <p><span className="font-semibold">Patient:</span> {confirmedBooking.patientName} ({confirmedBooking.patientPhone})</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadICS}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add to Apple / Google Calendar (.ics)</span>
                </button>

                <a
                  href="https://share.google/ngFEFvWuzwTjT2xAh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Google Maps Directions</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                >
                  Done / Close Window
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
