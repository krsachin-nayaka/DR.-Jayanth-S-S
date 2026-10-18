import React from 'react';
import { ShieldCheck, Phone, MapPin, Lock, Heart } from 'lucide-react';

interface FooterProps {
  onOpenPolicies: (tab: 'privacy' | 'cancellation' | 'terms') => void;
  onNavigateToAdmin: () => void;
  onOpenLookup: () => void;
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicies,
  onNavigateToAdmin,
  onOpenLookup,
  onOpenBooking,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Col 1: Brand & Clinical Practice */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
              <span className="text-lg font-bold text-white tracking-tight font-heading">
                Dr. Jayanth S S · Neuro Care Clinic
              </span>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Specialized clinical outpatient neurology practice led by Dr. Jayanth S S (DM Neurology NIMHANS, Fellowship in Neuroimmunology). Providing comprehensive care for stroke, migraine, neuroimmunological disorders, epilepsy, and Parkinson's.
            </p>

            <div className="pt-2 text-slate-400 text-xs space-y-1">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Room 204, OPD Wing, Apollo Hospitals, Old No. 28, Platform Rd, Seshadripuram, Bengaluru 560020</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>OPD Phone: +91 80 6278 4054 / 080 6297 2761</span>
              </p>
            </div>
          </div>

          {/* Col 2: Patient Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Patient Services</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenBooking}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Book New Appointment
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenLookup}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Find / Reschedule Booking
                </button>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Consultation Fees & Services
                </a>
              </li>
              <li>
                <a href="#doctor" className="hover:text-white transition-colors">
                  Doctor Qualifications & Bio
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-white transition-colors">
                  Google Patient Ratings (4.9★)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Policies & Hospital Protocols */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Clinical Policies & Protocols</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onOpenPolicies('cancellation')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cancellation & Rescheduling Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Patient Privacy & Health Data Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicies('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Outpatient Consultation Guidelines
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={onNavigateToAdmin}
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-400 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorized Staff Administration Portal</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Emergency Disclaimer & Legal Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © {new Date().getFullYear()} Dr. Jayanth S S Clinic. All rights reserved.
          </p>
          <p className="text-center sm:text-right max-w-md">
            Emergency Notice: For acute neurological symptoms (sudden paralysis, severe trauma, speech loss), proceed immediately to the 24/7 Apollo Emergency Department.
          </p>
        </div>

      </div>
    </footer>
  );
};
