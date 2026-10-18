import React from 'react';
import consultationImg from '../assets/images/hero_clinic_consultation_1792321978672.jpg';
import receptionImg from '../assets/images/clinic_reception_interior_1792321980082.jpg';
import diagnosticsImg from '../assets/images/facility_neuro_diagnostics_1792321980138.jpg';
import { ShieldCheck, Sparkles, Building2, Eye } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const facilities = [
    {
      title: 'Neurology Consultation Suite',
      description: 'Ergonomic doctor chamber equipped with high-resolution digital neuroimaging viewing displays, comfortable patient examination bedding, and privacy screens.',
      image: consultationImg,
      location: 'OPD Chamber 204'
    },
    {
      title: 'Patient Reception & Waiting Lounge',
      description: 'Spacious, sanitized outpatient lounge featuring dedicated reception counters, accessible seating, and tranquil atmosphere.',
      image: receptionImg,
      location: 'Ground & 2nd Floor OPD'
    },
    {
      title: 'Neurophysiology Diagnostic Suite',
      description: 'Dedicated electrodiagnostic testing facility for Electroencephalogram (EEG), Nerve Conduction Velocity (NCV), and Electromyography (EMG).',
      image: diagnosticsImg,
      location: 'Neuro-Diagnostics Wing'
    }
  ];

  return (
    <section id="facilities" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">Hospital Infrastructure</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Clinic Facilities & Diagnostic Suite
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Our outpatient practice is situated within the multi-specialty infrastructure of Apollo Hospitals Seshadripuram, equipped with round-the-clock emergency neuro-intensive care, 3T MRI, CT angiography, and certified sterile procedure rooms.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {facilities.map((f, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={f.image}
                    alt={f.title}
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                    {f.location}
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <div className="flex items-center gap-2 text-xs text-teal-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>NABH & JCI Accredited Hospital Standards</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Features row */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <p className="font-bold text-slate-900 text-sm">Wheelchair Accessible</p>
            <p className="text-xs text-slate-500 mt-1">Barrier-free ramps & elevators</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <p className="font-bold text-slate-900 text-sm">3T MRI & 128-Slice CT</p>
            <p className="text-xs text-slate-500 mt-1">On-premise fast neuroimaging</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <p className="font-bold text-slate-900 text-sm">Emergency Stroke Care</p>
            <p className="text-xs text-slate-500 mt-1">24/7 cath lab & ICU support</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <p className="font-bold text-slate-900 text-sm">Pharmacy & Pathology</p>
            <p className="text-xs text-slate-500 mt-1">Full in-house diagnostic services</p>
          </div>
        </div>

      </div>
    </section>
  );
};
