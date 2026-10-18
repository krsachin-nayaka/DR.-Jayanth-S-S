import React from 'react';
import { Calendar, ShieldCheck, Star, MapPin, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import heroImage from '../assets/images/hero_clinic_consultation_1792321978672.jpg';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenLookup: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenLookup }) => {
  return (
    <section className="relative bg-gradient-to-b from-slate-100/70 via-white to-slate-50 pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Verification banner */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Verified Healthcare Practice · Apollo Hospitals Seshadripuram, Bengaluru</span>
        </div>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Clinical Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]" style={{ textWrap: 'balance' }}>
              Specialized Neurological & Neuroimmunology Care
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
              Led by <span className="font-semibold text-slate-900">Dr. Jayanth S S</span>, Senior Consultant Neurologist 
              trained at the National Institute of Mental Health & Neurosciences (NIMHANS). Offering specialized clinical care 
              for acute stroke prevention, intractable migraine botox therapies, neuroimmunology, and movement disorders.
            </p>

            {/* Core credentials checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>DM Neurology from NIMHANS Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Post-Doctoral Fellowship in Neuroimmunology</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Certified Botox Protocol for Refractory Migraine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Transparent OPD Consultation: ₹800</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="px-6 py-3.5 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                <span>Schedule Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenLookup}
                className="px-5 py-3.5 text-base font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Find / Manage Booking</span>
              </button>
            </div>

            {/* Location anchor */}
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Platform Rd, Seshadripuram, Bengaluru (350m from Sampige Road Metro)</span>
            </div>
          </div>

          {/* Right Column: Visual Anchor */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg bg-white">
              <img
                src={heroImage}
                alt="Dr. Jayanth S S Neurology Clinic Consultation Room"
                className="w-full h-80 sm:h-96 object-cover"
                loading="eager"
              />
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Consultation Suite & Diagnostic OPD</p>
                  <p className="text-xs text-slate-500">Room 204, Apollo Hospitals Seshadripuram</p>
                </div>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                  OPD Mon – Sat
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column KPI Trust Strip below hero split */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-bold font-heading text-slate-900 tabular-nums">4.9 / 5.0</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">161+ Verified Google Reviews</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-teal-600">
              <Award className="w-5 h-5 text-teal-600" />
              <span className="text-2xl font-bold font-heading text-slate-900 tabular-nums">12+ Years</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Clinical & Surgical Experience</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-900">
              <span className="text-2xl font-bold font-heading tabular-nums">₹800</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Standard OPD Consultation Fee</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold font-heading text-slate-900 tabular-nums">97%</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Patient Satisfaction Rate</p>
          </div>
        </div>

      </div>
    </section>
  );
};
