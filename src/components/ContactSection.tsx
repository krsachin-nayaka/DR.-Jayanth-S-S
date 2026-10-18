import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink, Send, CheckCircle2, Navigation } from 'lucide-react';
import { ClinicInfo } from '../types.ts';

interface ContactSectionProps {
  clinic: ClinicInfo | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ clinic }) => {
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formMessage) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-semibold text-teal-700 tracking-wider uppercase mb-2">Location & Getting Here</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Clinic Address & Contact
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Conveniently situated in Central Bengaluru at Apollo Hospitals Seshadripuram with direct metro and railway connectivity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Col: Contact Details & Hours */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
              
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Clinic Address</h4>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    Dr. Jayanth S S Neurology Clinic<br />
                    Apollo Hospitals, Room 204, OPD Wing<br />
                    Old No. 28, 1, Platform Rd, VV Giri Colony, Seshadripuram<br />
                    Bengaluru, Karnataka 560020
                  </p>
                  <a
                    href="https://share.google/ngFEFvWuzwTjT2xAh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 mt-2.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open in Google Maps Navigation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-teal-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Direct Phone Numbers</h4>
                  <p className="text-sm text-slate-700 mt-1">
                    <span className="font-medium text-slate-900">OPD Appointments:</span> <a href="tel:+918062784054" className="text-teal-700 hover:underline">+91 80 6278 4054</a>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <span className="font-medium text-slate-900">Hospital General Desk:</span> <a href="tel:08062972761" className="hover:underline">080 6297 2761</a>
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-teal-600 shrink-0 mt-1" />
                <div className="w-full">
                  <h4 className="font-bold text-slate-900 text-sm">Consultation Timings</h4>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Monday – Saturday</span>
                      <span className="font-semibold text-slate-900">10:00 AM – 07:00 PM</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Sunday</span>
                      <span className="font-semibold text-rose-600">Closed (Emergency on-call)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Transit tips */}
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 space-y-2 text-xs text-teal-900">
              <p className="font-bold flex items-center gap-1.5">
                <span>Public Transit & Parking Advice</span>
              </p>
              <ul className="space-y-1 list-disc list-inside text-teal-800">
                <li><span className="font-semibold">Namma Metro:</span> Mantri Square Sampige Road Station (Green Line) is only 350 meters away.</li>
                <li><span className="font-semibold">Railway:</span> KSR Bengaluru City Junction (Majestic) is 1.2 km away.</li>
                <li><span className="font-semibold">Valet & Parking:</span> Dedicated multi-level hospital basement parking available.</li>
              </ul>
            </div>

          </div>

          {/* Right Col: Inquiry & Contact Form */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900">Send a General Medical Inquiry</h3>
            <p className="text-xs text-slate-600 mt-1 mb-6">
              Have questions about second opinions, report reviews, or treatment candidacy? Send a message to our clinical administrative team.
            </p>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-emerald-900 text-base">Inquiry Received</h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="font-semibold">{formName}</span>. Our clinic care coordinator will review your inquiry and contact you at <span className="font-semibold">{formPhone}</span> within 24 business hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormName('');
                    setFormPhone('');
                    setFormEmail('');
                    setFormMessage('');
                  }}
                  className="mt-3 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S. Narayanan"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98450 12345"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Clinical Inquiry / Medical Question *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your query or previous diagnosis (e.g. Seeking consultation for Botox treatment for recurrent hemifacial spasm)..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-400">
                    Patient medical privacy is strictly protected under clinical guidelines.
                  </p>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
