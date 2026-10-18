import React, { useState } from 'react';
import { X, Search, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, RotateCcw, Ban } from 'lucide-react';
import { Appointment } from '../types.ts';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReference?: string;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({
  isOpen,
  onClose,
  initialReference = ''
}) => {
  const [reference, setReference] = useState<string>(initialReference);
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newSlot, setNewSlot] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Personal schedule conflict');

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !phone.trim()) {
      setError('Please enter both booking reference and registered phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setActionSuccess('');
    setActionError('');
    setIsRescheduling(false);
    setIsCancelling(false);

    try {
      const res = await fetch(`/api/appointments/lookup?reference=${encodeURIComponent(reference.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to locate appointment');
      }
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || 'No appointment found with matching details.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRescheduleSlots = async (selectedDateStr: string) => {
    setNewDate(selectedDateStr);
    setNewSlot('');
    if (!appointment || !selectedDateStr) return;

    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/availability?doctorId=${encodeURIComponent(appointment.doctor_id || 'doc_jayanth_ss')}&date=${encodeURIComponent(selectedDateStr)}`);
      const data = await res.json();
      if (res.ok && data.slots) {
        setAvailableSlots(data.slots.filter((s: any) => s.available));
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleExecuteReschedule = async () => {
    if (!appointment || !newDate || !newSlot) return;
    setActionError('');

    try {
      const res = await fetch('/api/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: appointment.booking_reference,
          phone,
          newDate,
          newTimeSlot: newSlot
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reschedule failed');

      setActionSuccess(`Appointment successfully moved to ${newDate} at ${newSlot}.`);
      setAppointment({
        ...appointment,
        appointment_date: newDate,
        time_slot: newSlot,
        status: 'rescheduled'
      });
      setIsRescheduling(false);
    } catch (err: any) {
      setActionError(err.message || 'Unable to reschedule');
    }
  };

  const handleExecuteCancel = async () => {
    if (!appointment) return;
    setActionError('');

    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: appointment.booking_reference,
          phone,
          reason: cancelReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');

      setActionSuccess('Appointment has been cancelled successfully.');
      setAppointment({
        ...appointment,
        status: 'cancelled',
        cancellation_reason: cancelReason
      });
      setIsCancelling(false);
    } catch (err: any) {
      setActionError(err.message || 'Unable to cancel appointment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base font-heading">Find & Manage Appointment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Lookup Form */}
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Booking Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NC-2026-X8K2"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Registered Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? 'Searching Records...' : 'Locate Appointment'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Appointment Details Display */}
          {appointment && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Reference</span>
                  <span className="text-base font-bold font-mono text-slate-900">{appointment.booking_reference}</span>
                </div>
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded font-semibold capitalize ${
                    appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'rescheduled' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <p className="text-slate-400">Doctor</p>
                  <p className="font-semibold text-slate-900">{appointment.doctor_name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Service</p>
                  <p className="font-semibold text-slate-900">{appointment.service_name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Date & Slot</p>
                  <p className="font-semibold text-slate-900">{appointment.appointment_date} at {appointment.time_slot}</p>
                </div>
                <div>
                  <p className="text-slate-400">Consultation Fee</p>
                  <p className="font-semibold text-slate-900">₹{appointment.fee}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">Patient</p>
                  <p className="font-medium text-slate-900">{appointment.patient_name} ({appointment.patient_phone})</p>
                </div>
              </div>

              {/* Action Buttons if active */}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && !isRescheduling && !isCancelling && (
                <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(true)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Reschedule Slot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCancelling(true)}
                    className="flex-1 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Appointment</span>
                  </button>
                </div>
              )}

              {/* Rescheduling Form */}
              {isRescheduling && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-900">Choose New Appointment Date & Time:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newDate}
                      onChange={(e) => handleLoadRescheduleSlots(e.target.value)}
                      className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none"
                    />

                    {slotsLoading ? (
                      <p className="text-xs text-slate-500 py-2">Loading slots...</p>
                    ) : (
                      <select
                        value={newSlot}
                        onChange={(e) => setNewSlot(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none"
                      >
                        <option value="">Select new time slot</option>
                        {availableSlots.map((s, idx) => (
                          <option key={idx} value={s.time}>{s.display}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRescheduling(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!newDate || !newSlot}
                      onClick={handleExecuteReschedule}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      Confirm Reschedule
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel Confirmation Form */}
              {isCancelling && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-rose-900">Confirm Appointment Cancellation:</p>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelling(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Keep Booking
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteCancel}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
