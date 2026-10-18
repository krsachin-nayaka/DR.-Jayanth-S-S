import React, { useState } from 'react';
import { Calendar, Search, ShieldAlert, Phone, Clock, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenLookup: () => void;
  onNavigateToAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenLookup,
  onNavigateToAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Clinical Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>Direct OPD: +91 80 6278 4054</span>
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Mon – Sat: 10:00 AM – 7:00 PM (Apollo Seshadripuram)</span>
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={onOpenLookup}
              className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-xs font-medium transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Find / Reschedule Booking</span>
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={onNavigateToAdmin}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs transition-colors"
              title="Clinic Staff Portal"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" aria-hidden="true" />
            <span className="font-heading">Dr. Jayanth S S · Neuro Care</span>
          </a>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => scrollToSection('services')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Services & Fees
            </button>
            <button
              onClick={() => scrollToSection('doctor')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Doctor Profile
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Google Ratings (4.9★)
            </button>
            <button
              onClick={() => scrollToSection('facilities')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Facilities
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
            >
              Location & Hours
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenBooking}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenBooking}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-md"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <button
              onClick={() => scrollToSection('services')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
            >
              Services & Fees
            </button>
            <button
              onClick={() => scrollToSection('doctor')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
            >
              Doctor Profile & Credentials
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
            >
              Google Ratings & Reviews
            </button>
            <button
              onClick={() => scrollToSection('facilities')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
            >
              Clinic Facilities & Diagnostic Suite
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
            >
              Address & Transit Directions
            </button>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full py-2.5 text-center text-sm font-semibold text-white bg-teal-600 rounded-lg"
              >
                Book Appointment
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLookup();
                }}
                className="w-full py-2 text-center text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
              >
                Find Existing Appointment
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
