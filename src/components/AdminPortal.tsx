import React, { useState, useEffect } from 'react';
import {
  Lock, User, KeyRound, ShieldAlert, LogOut, Calendar, Download, Search,
  CheckCircle2, Clock, AlertCircle, RefreshCw, ChevronRight, BarChart3,
  CalendarDays, Settings, Trash2, ArrowLeft, Eye, ShieldCheck, Database, Copy, Check, IndianRupee
} from 'lucide-react';
import { Appointment, AdminStats, AuditLog } from '../types.ts';

interface AdminPortalProps {
  onBackToSite: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToSite }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('clinic_admin_token'));
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'appointments' | 'stats' | 'fees' | 'holidays' | 'security' | 'supabase'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Consultation Services & Fees state
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any | null>(null);
  const [feeInputs, setFeeInputs] = useState<{ [id: string]: number }>({});
  const [durationInputs, setDurationInputs] = useState<{ [id: string]: number }>({});
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [docFeeInput, setDocFeeInput] = useState<number>(800);
  const [savingDocFee, setSavingDocFee] = useState<boolean>(false);
  const [feeToast, setFeeToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabase integration state
  const [supabaseStatus, setSupabaseStatus] = useState<any | null>(null);
  const [checkingSupabase, setCheckingSupabase] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected appointment details modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Holidays state
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayReason, setNewHolidayReason] = useState('');

  // Security & Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Verify existing token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (res.ok) {
            const user = await res.json();
            setCurrentUser(user);
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  // Load appointments
  const fetchAppointments = () => {
    if (!token) return;
    setLoadingAppts(true);
    let url = `/api/admin/appointments?status=${encodeURIComponent(filterStatus)}`;
    if (filterDate) url += `&date=${encodeURIComponent(filterDate)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load appointments:', err))
      .finally(() => setLoadingAppts(false));
  };

  useEffect(() => {
    if (token && activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [token, activeTab, filterDate, filterStatus, searchQuery]);

  // Load stats
  useEffect(() => {
    if (token && activeTab === 'stats') {
      fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error('Failed to load stats:', err));
    }
  }, [token, activeTab]);

  // Load holidays
  const fetchHolidays = () => {
    if (!token) return;
    fetch('/api/admin/holidays', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setHolidays(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    if (token && activeTab === 'holidays') {
      fetchHolidays();
    }
  }, [token, activeTab]);

  // Load audit logs
  useEffect(() => {
    if (token && activeTab === 'security') {
      fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setAuditLogs(Array.isArray(data) ? data : []));
    }
  }, [token, activeTab]);

  // Load Services & Doctor Fee
  const fetchServicesAndDoctor = () => {
    setLoadingServices(true);
    Promise.all([
      fetch('/api/services').then((r) => r.json()),
      fetch('/api/doctors').then((r) => r.json())
    ])
      .then(([svcs, docs]) => {
        if (Array.isArray(svcs)) {
          setServicesList(svcs);
          const initialFees: { [id: string]: number } = {};
          const initialDurations: { [id: string]: number } = {};
          svcs.forEach((s) => {
            initialFees[s.id] = s.fee;
            initialDurations[s.id] = s.duration_minutes;
          });
          setFeeInputs(initialFees);
          setDurationInputs(initialDurations);
        }
        if (Array.isArray(docs) && docs.length > 0) {
          setDoctorProfile(docs[0]);
          setDocFeeInput(docs[0].consultation_fee);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingServices(false));
  };

  useEffect(() => {
    if (token && activeTab === 'fees') {
      fetchServicesAndDoctor();
    }
  }, [token, activeTab]);

  const handleSaveServiceFee = async (serviceId: string) => {
    if (!token) return;
    setSavingServiceId(serviceId);
    setFeeToast(null);

    const newFee = feeInputs[serviceId];
    const newDuration = durationInputs[serviceId];

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fee: newFee, durationMinutes: newDuration })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update fee');

      setFeeToast({ type: 'success', text: data.message || 'Consultation fee updated.' });
      fetchServicesAndDoctor();
      setTimeout(() => setFeeToast(null), 4000);
    } catch (err: any) {
      setFeeToast({ type: 'error', text: err.message || 'Error updating fee' });
    } finally {
      setSavingServiceId(null);
    }
  };

  const handleSaveDoctorFee = async () => {
    if (!token || !doctorProfile) return;
    setSavingDocFee(true);
    setFeeToast(null);

    try {
      const res = await fetch(`/api/admin/doctors/${doctorProfile.id}/fee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ consultationFee: docFeeInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update doctor fee');

      setFeeToast({ type: 'success', text: data.message || 'Doctor baseline fee updated.' });
      fetchServicesAndDoctor();
      setTimeout(() => setFeeToast(null), 4000);
    } catch (err: any) {
      setFeeToast({ type: 'error', text: err.message || 'Error updating doctor fee' });
    } finally {
      setSavingDocFee(false);
    }
  };

  // Load Supabase status
  const fetchSupabaseStatus = () => {
    if (!token) return;
    setCheckingSupabase(true);
    fetch('/api/admin/supabase-status', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSupabaseStatus(data))
      .catch(err => console.error(err))
      .finally(() => setCheckingSupabase(false));
  };

  useEffect(() => {
    if (token && activeTab === 'supabase') {
      fetchSupabaseStatus();
    }
  }, [token, activeTab]);

  const handleSyncAllSupabase = async () => {
    if (!token) return;
    setSyncingSupabase(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/supabase-sync-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSyncResult(data);
      fetchSupabaseStatus();
    } catch (err: any) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('clinic_admin_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }
    localStorage.removeItem('clinic_admin_token');
    setToken(null);
    setCurrentUser(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/admin/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
        );
        if (selectedAppt && selectedAppt.id === id) {
          setSelectedAppt({ ...selectedAppt, status: newStatus as any });
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newHolidayDate || !newHolidayReason) return;

    try {
      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: newHolidayDate, reason: newHolidayReason })
      });

      if (res.ok) {
        setNewHolidayDate('');
        setNewHolidayReason('');
        fetchHolidays();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');

      setPasswordMsg({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Unable to update password.' });
    }
  };

  const handleExportCSV = () => {
    if (!token) return;
    window.open(`/api/admin/export?token=${token}`, '_blank');
  };

  // If NOT logged in, show secure login form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <button
            onClick={onBackToSite}
            className="flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Clinic Website</span>
          </button>

          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6 text-white" />
          </div>

          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white font-heading">
            Clinic Administrative Portal
          </h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Dr. Jayanth S S · Neuro Care Clinic Staff Access
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800 border border-slate-700/80 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Staff Identifier (Username or Email)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter staff username or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
              <p className="text-[11px] text-slate-400 leading-normal">
                Restricted to authorized clinic staff. All login attempts and IP addresses are audited for patient confidentiality.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (Logged In)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSite}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-bold text-base font-heading text-white">
                Clinic Admin Console
              </span>
              <span className="hidden sm:inline-block text-xs text-teal-400 ml-2 font-medium">
                · {currentUser.name} ({currentUser.role})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-slate-800 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Appointments & Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'stats'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Booking Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'fees'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Consultation Fees & Services</span>
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'holidays'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Clinic Closures & Holidays</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Audit Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'supabase'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud Sync</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* =========================================
            TAB 1: APPOINTMENTS MANAGEMENT
            ========================================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            
            {/* Filter & Actions Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, phone, ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>

                {(filterDate || filterStatus !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterDate('');
                      setFilterStatus('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-teal-700 hover:underline font-medium"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={fetchAppointments}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg"
                  title="Refresh List"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loadingAppts ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Loading appointment records...
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No matching appointments found.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {appt.booking_reference}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900">{appt.appointment_date}</span>
                            <span className="block text-[11px] text-slate-500">{appt.time_slot}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-900">{appt.patient_name}</span>
                            <span className="block text-[11px] text-slate-500">{appt.patient_phone} · {appt.patient_age}y</span>
                          </td>
                          <td className="px-4 py-3">
                            <span>{appt.service_name}</span>
                            <span className="block text-[11px] text-teal-700 font-medium">₹{appt.fee || appt.service_fee}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              appt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              appt.status === 'rescheduled' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedAppt(appt)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            TAB 2: BOOKING ANALYTICS
            ========================================= */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Total Bookings</span>
                <p className="text-2xl font-bold font-heading text-slate-900 mt-1 tabular-nums">
                  {stats.totalBookings}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Today's Scheduled</span>
                <p className="text-2xl font-bold font-heading text-teal-700 mt-1 tabular-nums">
                  {stats.todayBookings}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Completed Visits</span>
                <p className="text-2xl font-bold font-heading text-blue-700 mt-1 tabular-nums">
                  {stats.completedCount}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Estimated OPD Revenue</span>
                <p className="text-2xl font-bold font-heading text-emerald-700 mt-1 tabular-nums">
                  ₹{stats.revenueEstimate.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4">Top Requested Neurology Services</h3>
              <div className="space-y-3">
                {stats.serviceDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium w-1/2">{item.name}</span>
                    <div className="flex-1 max-w-xs mx-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (item.count / Math.max(1, stats.totalBookings)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{item.count} bookings</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB: CONSULTATION FEES & SERVICES
            ========================================= */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Consultation Fees & Service Price Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure fees and appointment durations. Changes take effect immediately for all patient bookings.
                </p>
              </div>

              <button
                onClick={fetchServicesAndDoctor}
                disabled={loadingServices}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingServices ? 'animate-spin' : ''}`} />
                <span>Refresh Prices</span>
              </button>
            </div>

            {/* Toast notice */}
            {feeToast && (
              <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
                feeToast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {feeToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{feeToast.text}</span>
              </div>
            )}

            {/* Doctor Base Fee Card */}
            {doctorProfile && (
              <div className="bg-gradient-to-r from-teal-50/70 to-emerald-50/40 border border-teal-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                      Lead Consultant OPD Baseline Fee
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {doctorProfile.name} ({doctorProfile.title})
                    </h4>
                    <p className="text-xs text-slate-600">
                      Baseline consultation fee applied across general outpatient clinical evaluations.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={docFeeInput}
                        onChange={(e) => setDocFeeInput(Number(e.target.value))}
                        className="w-32 pl-7 pr-3 py-2 text-sm font-bold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                      />
                    </div>
                    <button
                      onClick={handleSaveDoctorFee}
                      disabled={savingDocFee}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingDocFee ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Update Base Fee</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Services Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Individual Services & Procedure Fees</h4>
                <span className="text-xs text-slate-500">{servicesList.length} Services Configured</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Medical Service</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Duration (Mins)</th>
                      <th className="px-4 py-3">Consultation Fee (₹ INR)</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loadingServices ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          Loading services & current prices...
                        </td>
                      </tr>
                    ) : (
                      servicesList.map((svc) => (
                        <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{svc.name}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">{svc.description}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-600 font-medium">{svc.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="10"
                                step="5"
                                max="120"
                                value={durationInputs[svc.id] ?? svc.duration_minutes}
                                onChange={(e) =>
                                  setDurationInputs((prev) => ({
                                    ...prev,
                                    [svc.id]: Number(e.target.value)
                                  }))
                                }
                                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white text-center"
                              />
                              <span className="text-slate-500 text-[11px]">mins</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-700">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                value={feeInputs[svc.id] ?? svc.fee}
                                onChange={(e) =>
                                  setFeeInputs((prev) => ({
                                    ...prev,
                                    [svc.id]: Number(e.target.value)
                                  }))
                                }
                                className="w-24 px-2.5 py-1 text-xs font-bold text-slate-900 border border-slate-300 rounded font-mono bg-white"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleSaveServiceFee(svc.id)}
                              disabled={savingServiceId === svc.id}
                              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {savingServiceId === svc.id ? 'Saving...' : 'Save Fee'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            TAB 3: CLINIC CLOSURES & HOLIDAYS
            ========================================= */}
        {activeTab === 'holidays' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-2">Block Date / Schedule Holiday</h3>
              <p className="text-xs text-slate-500 mb-4">
                Blocked dates are instantly removed from the patient appointment calendar.
              </p>

              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Closure Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Conference, Facility Maintenance"
                    value={newHolidayReason}
                    onChange={(e) => setNewHolidayReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg"
                >
                  Block This Date
                </button>
              </form>
            </div>

            <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4">Scheduled Clinic Holidays</h3>
              {holidays.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No scheduled holidays. Regular Monday–Saturday hours apply.</p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{h.holiday_date}</span>
                        <span className="text-slate-600 ml-2">({h.reason})</span>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 4: SECURITY & AUDIT LOGS
            ========================================= */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-2">Change Administrator Password</h3>
              <p className="text-xs text-slate-500 mb-4">
                Maintain strict password discipline. Must be at least 8 characters.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Current Password *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                {passwordMsg && (
                  <div className={`p-2.5 rounded-lg text-xs ${
                    passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {passwordMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Update Admin Password
                </button>
              </form>
            </div>

            <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-2">Recent Security Audit Logs</h3>
              <p className="text-xs text-slate-500 mb-4">
                Immutable audit records of critical administrative actions.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-teal-800">{log.action}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    {log.details_json && (
                      <p className="text-slate-600 text-[11px] font-mono truncate">{log.details_json}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            TAB 5: SUPABASE CLOUD DATABASE
            ========================================= */}
        {activeTab === 'supabase' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Supabase Cloud PostgreSQL Database</h3>
                    <p className="text-xs text-slate-500">Connected to your project: <span className="font-mono text-slate-700 font-semibold">roiosxwzdffjawbfboch</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSupabaseStatus}
                    disabled={checkingSupabase}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingSupabase ? 'animate-spin' : ''}`} />
                    <span>Check Schema Status</span>
                  </button>

                  <button
                    onClick={handleSyncAllSupabase}
                    disabled={syncingSupabase}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{syncingSupabase ? 'Syncing...' : 'Sync All Bookings'}</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="mt-6">
                {checkingSupabase ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Querying Supabase API at https://roiosxwzdffjawbfboch.supabase.co...</span>
                  </div>
                ) : supabaseStatus ? (
                  <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                    supabaseStatus.tableReady
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : supabaseStatus.connected
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {supabaseStatus.tableReady ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Supabase Table Ready & Syncing Live</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Action Required: Run SQL Table Creation</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed">{supabaseStatus.message}</p>
                  </div>
                ) : null}

                {syncResult && (
                  <div className={`mt-3 p-3.5 rounded-xl border text-xs ${
                    syncResult.failed === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <p className="font-bold">Sync Result:</p>
                    <p>Total records: {syncResult.total} · Synced: {syncResult.synced} · Failed: {syncResult.failed}</p>
                    {syncResult.errors && syncResult.errors.length > 0 && (
                      <p className="mt-1 font-mono text-[11px] text-rose-700">{syncResult.errors.join('; ')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Step-by-step setup guide */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <h4 className="font-bold text-sm text-slate-900">How to activate the Supabase PostgreSQL table (1 minute setup):</h4>
                
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li>
                    Open your project: <a href="https://supabase.com/dashboard/project/roiosxwzdffjawbfboch/sql/new" target="_blank" rel="noopener noreferrer" className="text-teal-700 font-semibold underline">Supabase SQL Editor (Project roiosxwzdffjawbfboch)</a>.
                  </li>
                  <li>
                    Copy the SQL script below and paste it into the editor.
                  </li>
                  <li>
                    Click <span className="font-semibold text-slate-900">"Run"</span>. Once finished, click <span className="font-semibold text-teal-700">"Sync All Bookings"</span> above!
                  </li>
                </ol>

                {/* SQL Code Block with Copy button */}
                <div className="relative mt-2">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-slate-400 text-[11px] rounded-t-lg font-mono">
                    <span>supabase_schema.sql</span>
                    <button
                      onClick={() => {
                        const sql = `CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  visit_type TEXT DEFAULT 'in_person',
  fee INTEGER DEFAULT 800,
  medical_notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for anon key" ON public.appointments;
CREATE POLICY "Enable insert for anon key" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for anon key" ON public.appointments;
CREATE POLICY "Enable select for anon key" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable update for anon key" ON public.appointments;
CREATE POLICY "Enable update for anon key" ON public.appointments FOR UPDATE USING (true);`;
                        navigator.clipboard.writeText(sql);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2500);
                      }}
                      className="text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL to Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-300 text-[11px] font-mono rounded-b-lg overflow-x-auto max-h-48">
{`CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  visit_type TEXT DEFAULT 'in_person',
  fee INTEGER DEFAULT 800,
  medical_notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon key" ON public.appointments FOR ALL USING (true);`}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Appointment Detail & Status Update Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Manage Appointment {selectedAppt.booking_reference}</h3>
              <button
                onClick={() => setSelectedAppt(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <p><span className="font-bold">Patient:</span> {selectedAppt.patient_name} ({selectedAppt.patient_age}y, {selectedAppt.patient_gender})</p>
                <p><span className="font-bold">Contact:</span> {selectedAppt.patient_phone} · {selectedAppt.patient_email}</p>
                <p><span className="font-bold">Date & Slot:</span> {selectedAppt.appointment_date} at {selectedAppt.time_slot}</p>
                <p><span className="font-bold">Service:</span> {selectedAppt.service_name} (₹{selectedAppt.fee || selectedAppt.service_fee})</p>
                {selectedAppt.medical_notes && (
                  <p><span className="font-bold">Patient Notes:</span> {selectedAppt.medical_notes}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-2">Update Appointment Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'confirmed')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      selectedAppt.status === 'confirmed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Confirmed
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'completed')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      selectedAppt.status === 'completed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'cancelled')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      selectedAppt.status === 'cancelled' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
