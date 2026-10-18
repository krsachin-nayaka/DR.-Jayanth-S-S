import React from 'react';
import { Award, GraduationCap, Clock, Stethoscope, CheckCircle2, Calendar } from 'lucide-react';
import doctorPortrait from '../assets/images/doctor_jayanth_portrait_1792321979717.jpg';

interface DoctorProfileProps {
  onOpenBooking: () => void;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({ onOpenBooking }) => {
  const credentials = [
    {
      degree: 'DM in Neurology',
      institution: 'National Institute of Mental Health and Neurosciences (NIMHANS), Bengaluru',
      detail: 'India\'s premier apex neurosciences institute. Advanced clinical residency and doctoral training in neuromuscular and CNS disorders.'
    },
    {
      degree: 'Post-Doctoral Fellowship in Neuroimmunology',
      institution: 'Specialized Center of Neuroimmunology',
      detail: 'Advanced fellowship focusing on autoimmune demyelinating CNS diseases (MS, NMOSD, MOGAD) and therapeutic immunosuppression.'
    },
    {
      degree: 'MD in General Medicine',
      institution: 'BLDE University',
      detail: 'In-depth clinical grounding in systemic internal medicine, cardiovascular risk management, and critical care.'
    },
    {
      degree: 'MBBS',
      institution: 'Rajiv Gandhi University of Health Sciences (RGUHS)',
      detail: 'Registered Medical Practitioner under Karnataka Medical Council.'
    }
  ];

  const focusAreas = [
    'Neuroimmunology & Multiple Sclerosis (MS)',
    'Intractable Migraine & Botulinum Toxin (Botox) Therapy',
    'Acute Stroke Thrombolysis & Secondary Stroke Prevention',
    'Parkinson\'s Disease & Deep Brain Stimulation (DBS) Evaluation',
    'Refractory Epilepsy & Clinical Neurophysiology (EEG)',
    'Neuropathy, Myasthenia Gravis & Muscle Disorders'
  ];

  return (
    <section id="doctor" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">Verified Medical Specialist</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Consultant Neurologist & Neuroimmunologist
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Direct clinical consultations with verified credentials, specialized NIMHANS doctoral training, and over 12+ years of dedicated neurology practice in Bengaluru.
          </p>
        </div>

        {/* Doctor Main Showcase Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Doctor Photo & Quick Info */}
            <div className="lg:col-span-4 space-y-5">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white aspect-square">
                <img
                  src={doctorPortrait}
                  alt="Dr. Jayanth S S, Neurologist Bengaluru"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>

              <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Consultation Fee</span>
                  <span className="font-bold text-slate-900 text-base tabular-nums">₹800</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Experience</span>
                  <span className="font-medium text-slate-900 tabular-nums">12+ Years</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">OPD Clinic</span>
                  <span className="font-medium text-slate-900">Room 204, Apollo Hospitals</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Consultation Days</span>
                  <span className="font-medium text-slate-900">Monday – Saturday</span>
                </div>
              </div>

              <button
                onClick={onOpenBooking}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment with Dr. Jayanth</span>
              </button>
            </div>

            {/* Right Col: Biography, Credentials & Areas of Focus */}
            <div className="lg:col-span-8 space-y-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Dr. Jayanth S S</h3>
                <p className="text-sm font-medium text-teal-800 mt-1">
                  Senior Consultant Neurologist & Neuroimmunologist · Apollo Hospitals, Seshadripuram
                </p>
                <p className="mt-4 text-slate-700 leading-relaxed text-sm sm:text-base">
                  Dr. Jayanth S S is recognized for his clinical precision, empathetic patient communication, and evidence-based approach to complex neurological disorders. Having completed his DM in Neurology from the premier National Institute of Mental Health and Neurosciences (NIMHANS), followed by a Post-Doctoral Fellowship in Neuroimmunology, he provides specialized outpatient and inpatient management for patients across Karnataka and southern India.
                </p>
              </div>

              {/* Verified Clinical Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                  <GraduationCap className="w-5 h-5 text-teal-600" />
                  <h4>Verified Qualifications & Training</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {credentials.map((cred, idx) => (
                    <div key={idx} className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-1.5">
                      <p className="text-sm font-bold text-slate-900">{cred.degree}</p>
                      <p className="text-xs font-medium text-teal-700">{cred.institution}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{cred.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Clinical Focus Areas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  <h4>Sub-Specialty Expertise</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {focusAreas.map((area, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/70 border border-slate-200/60 rounded-lg p-2.5 text-xs text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
