import React, { useState } from 'react';
import { X, Shield, Clock, FileText, AlertTriangle } from 'lucide-react';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'cancellation' | 'terms';
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'cancellation'
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'cancellation' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base font-heading">Clinic Policies & Information</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cancellation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'cancellation'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancellation & Rescheduling
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'privacy'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Patient Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'terms'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Consultation Terms
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {activeTab === 'cancellation' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Appointment Cancellation & Rescheduling Policy</span>
              </h4>
              <p>
                We understand that unexpected clinical and personal scheduling changes happen. To ensure equal access for neurological patients requiring urgent care, please adhere to our clinic guidelines:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><span className="font-semibold text-slate-900">Zero Cancellation Penalty:</span> Patients can cancel or reschedule any upcoming booking free of charge up to 2 hours prior to the scheduled slot using the online portal or phone desk.</li>
                <li><span className="font-semibold text-slate-900">Instant Slot Release:</span> Once cancelled, the time slot is immediately released to the clinic calendar for other waiting patients.</li>
                <li><span className="font-semibold text-slate-900">Late Arrivals:</span> If a patient arrives more than 20 minutes past their scheduled slot, the clinic coordinator will do their utmost to accommodate the patient at the nearest subsequent opening without compromising other patients' consultation lengths.</li>
              </ul>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Patient Health Data & Privacy Disclosures</span>
              </h4>
              <p>
                Dr. Jayanth S S Clinic maintains strict adherence to Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations and Digital Information Security in Healthcare guidelines:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><span className="font-semibold text-slate-900">Confidentiality:</span> All patient medical histories, symptoms, imaging reports, and notes are strictly restricted to treating medical personnel.</li>
                <li><span className="font-semibold text-slate-900">Zero Commercial Data Sharing:</span> We never sell, lease, or share patient phone numbers or clinical information with insurance brokers or pharmaceutical third-parties.</li>
                <li><span className="font-semibold text-slate-900">Secure Database:</span> Data is stored on authenticated servers with encrypted sessions and database-level constraints.</li>
              </ul>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Consultation & Medical Care Terms</span>
              </h4>
              <p>
                Please review our standard consultation protocol:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><span className="font-semibold text-slate-900">Payment Methods:</span> Consultation fees are settled at the OPD registration counter on Platform Road via UPI, Credit/Debit cards, or Cash.</li>
                <li><span className="font-semibold text-slate-900">Prior Medical Records:</span> Patients are advised to bring physical or digital copies of previous brain MRI, CT scans, blood investigations, and past prescription slips.</li>
                <li><span className="font-semibold text-slate-900">Emergency Protocol:</span> This website is strictly intended for scheduling planned outpatient consultations. If experiencing sudden facial drooping, speech difficulty, or severe acute paralysis, immediately dial hospital emergency at 080 6278 4054 or visit the Emergency Room.</li>
              </ul>
            </div>
          )}

        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Understood & Close
          </button>
        </div>

      </div>
    </div>
  );
};
