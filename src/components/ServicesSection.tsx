import React, { useState } from 'react';
import { Calendar, Clock, Video, ArrowRight, Activity, ShieldCheck, Zap } from 'lucide-react';
import { MedicalService } from '../types.ts';

interface ServicesSectionProps {
  services: MedicalService[];
  onSelectService: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', 'Consultation', 'Specialty Care', 'Interventional Care', 'Vascular Neurology', 'Virtual Care'];

  const filteredServices = filter === 'all'
    ? services
    : services.filter(s => s.category.toLowerCase() === filter.toLowerCase());

  return (
    <section id="services" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">Verified Treatments & Consultations</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Clinical Neurology Services
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Clear, transparent consultation fees with zero hidden charges. Choose a specialized consultation service to reserve your preferred appointment slot online.
            </p>
          </div>

          {/* Interactive filter tabs (functional buttons adhering to zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Services' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-teal-700 uppercase tracking-wider">{service.category}</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{service.duration_minutes} mins</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Consultation Fee</span>
                  <span className="text-xl font-bold text-slate-900 font-heading tabular-nums">
                    ₹{service.fee}
                  </span>
                </div>

                <button
                  onClick={() => onSelectService(service.id)}
                  className="px-4 py-2 text-xs font-semibold text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-600 border border-teal-200 hover:border-teal-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Note on Procedures */}
        <div className="mt-12 bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Hospital Inpatient & Emergency Coverage</p>
              <p className="text-xs text-slate-500">For acute stroke emergencies or urgent admissions, visit the Apollo Hospitals Seshadripuram Emergency Room immediately.</p>
            </div>
          </div>
          <a
            href="tel:+918062784054"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            Emergency Contact: 080 6278 4054
          </a>
        </div>

      </div>
    </section>
  );
};
