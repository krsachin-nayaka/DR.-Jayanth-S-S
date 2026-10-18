import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { DoctorProfile } from './components/DoctorProfile.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { ReviewsSection } from './components/ReviewsSection.tsx';
import { GallerySection } from './components/GallerySection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { BookingLookupModal } from './components/BookingLookupModal.tsx';
import { PoliciesModal } from './components/PoliciesModal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { Footer } from './components/Footer.tsx';
import { ClinicInfo, Doctor, MedicalService } from './types.ts';

export default function App() {
  const [viewMode, setViewMode] = useState<'site' | 'admin'>('site');
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<MedicalService[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string>('');
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<'privacy' | 'cancellation' | 'terms'>('cancellation');

  // Handle URL navigation for /admin or #admin
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/admin') || hash === '#admin') {
        setViewMode('admin');
      } else {
        setViewMode('site');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const loadClinicData = () => {
    Promise.all([
      fetch('/api/clinic').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/doctors').then((res) => (res.ok ? res.json() : [])),
      fetch('/api/services').then((res) => (res.ok ? res.json() : []))
    ])
      .then(([clinicData, doctorsData, servicesData]) => {
        if (clinicData) setClinic(clinicData);
        if (Array.isArray(doctorsData)) setDoctors(doctorsData);
        if (Array.isArray(servicesData)) setServices(servicesData);
      })
      .catch((err) => console.error('Data loading error:', err))
      .finally(() => setLoading(false));
  };

  // Fetch initial clinic data
  useEffect(() => {
    loadClinicData();
  }, []);

  const handleOpenBookingWithService = (serviceId: string) => {
    loadClinicData();
    setPreSelectedServiceId(serviceId);
    setBookingModalOpen(true);
  };

  const handleNavigateToAdmin = () => {
    window.location.hash = '#admin';
    setViewMode('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSite = () => {
    window.location.hash = '';
    setViewMode('site');
    loadClinicData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicies = (tab: 'privacy' | 'cancellation' | 'terms') => {
    setPolicyTab(tab);
    setPoliciesModalOpen(true);
  };

  if (viewMode === 'admin') {
    return <AdminPortal onBackToSite={handleBackToSite} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-teal-600 selection:text-white">
      {/* Top Bar Contract Navbar */}
      <Navbar
        onOpenBooking={() => {
          setPreSelectedServiceId('');
          setBookingModalOpen(true);
        }}
        onOpenLookup={() => setLookupModalOpen(true)}
        onNavigateToAdmin={handleNavigateToAdmin}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero
          onOpenBooking={() => {
            setPreSelectedServiceId('');
            setBookingModalOpen(true);
          }}
          onOpenLookup={() => setLookupModalOpen(true)}
        />

        <ServicesSection
          services={services}
          onSelectService={handleOpenBookingWithService}
        />

        <DoctorProfile
          onOpenBooking={() => {
            setPreSelectedServiceId('');
            setBookingModalOpen(true);
          }}
        />

        <ReviewsSection />

        <GallerySection />

        <ContactSection clinic={clinic} />
      </main>

      {/* Footer */}
      <Footer
        onOpenBooking={() => {
          setPreSelectedServiceId('');
          setBookingModalOpen(true);
        }}
        onOpenLookup={() => setLookupModalOpen(true)}
        onOpenPolicies={handleOpenPolicies}
        onNavigateToAdmin={handleNavigateToAdmin}
      />

      {/* Appointment Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        doctors={doctors}
        services={services}
        preSelectedServiceId={preSelectedServiceId}
      />

      {/* Booking Lookup & Self-Service Reschedule Modal */}
      <BookingLookupModal
        isOpen={lookupModalOpen}
        onClose={() => setLookupModalOpen(false)}
      />

      {/* Clinic Policies Modal */}
      <PoliciesModal
        isOpen={policiesModalOpen}
        onClose={() => setPoliciesModalOpen(false)}
        defaultTab={policyTab}
      />
    </div>
  );
}
