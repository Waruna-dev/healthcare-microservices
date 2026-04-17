// src/pages/admin/PlatformOverview.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 🚨 FIX: Import your central API instance instead of raw axios!
import api from '../../services/api'; 
import { 
  Users, UserPlus, ShieldAlert, CheckCircle2, 
  Stethoscope, ArrowUpRight, ArrowDownRight, Minus,
  X, Check, XCircle, AlertTriangle 
} from 'lucide-react';

const PlatformOverview = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0, growthPercentage: 0,
    demographics: { patients: 0, specialists: 0, supportStaff: 0 }
  });

  const [pendingDoctors, setPendingDoctors] = useState([]);
  
  // Modal States
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

  // Fetch Dashboard Data
  const fetchDashboardStats = async () => {
    try {
      // 🚨 FIX: Use the 'api' instance. It automatically goes through your API Gateway
      // and automatically attaches the adminToken!
      const response = await api.get('/admin/demographics');
      if (response.data.success) {
        setStats(response.data.data);
        setPendingDoctors(response.data.data.pendingDoctors || []);
      }
    } catch (error) {
      console.error("Failed to fetch demographics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // 1. OPEN MODAL & FETCH DOCTOR DETAILS
  const handleReviewClick = async (doctorId) => {
    try {
      // 🚨 FIX: Routed through API Gateway
      const response = await api.get(`/admin/doctors/${doctorId}`);
      if (response.data.success) {
        setSelectedDoctor(response.data.data);
        setIsModalOpen(true);
      }
    } catch (error) {
      showToast("Failed to fetch doctor details", "error");
    }
  };

  // 2. APPROVE DOCTOR
  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      // 🚨 FIX: Routed through API Gateway
      const response = await api.put(`/admin/doctors/${selectedDoctor._id}/approve`, { 
        name: selectedDoctor.name, 
        email: selectedDoctor.email 
      });

      if (response.data.success) {
        showToast("Doctor approved! Temporary password sent via email.");
        setIsModalOpen(false);
        await fetchDashboardStats(); 
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to approve doctor", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. CONFIRM & REJECT DOCTOR
  const confirmReject = async () => {
    setIsActionLoading(true);
    try {
      // 🚨 FIX: Routed through API Gateway
      const response = await api.put(`/admin/doctors/${selectedDoctor._id}/reject`, { 
        name: selectedDoctor.name, 
        email: selectedDoctor.email 
      });

      if (response.data.success) {
        showToast("Doctor registration rejected and data deleted.", "error");
        setIsRejectConfirmOpen(false); 
        setIsModalOpen(false); 
        await fetchDashboardStats(); 
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to reject doctor", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const calculateWidth = (value) => {
    if (stats.totalUsers === 0) return '0%';
    return `${(value / stats.totalUsers) * 100}%`;
  };

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } } };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-elevated flex items-center gap-3 font-bold text-sm text-white backdrop-blur-md ${toast.type === 'error' ? 'bg-error/90' : 'bg-primary/90'}`}
          >
            <CheckCircle2 size={20} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DOCTOR REVIEW MODAL --- */}
      <AnimatePresence>
        {isModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30"
            >
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                <h2 className="text-xl font-bold font-headline text-on-surface">Review Doctor Profile</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Full Name</p>
                    <p className="font-bold text-on-surface">Dr. {selectedDoctor.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Specialty</p>
                    <p className="font-medium text-on-surface px-2 py-1 bg-primary-container text-primary rounded-md inline-block text-sm">{selectedDoctor.specialty || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email</p>
                    <p className="font-medium text-on-surface">{selectedDoctor.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Phone</p>
                    <p className="font-medium text-on-surface">{selectedDoctor.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 bg-surface-container p-4 rounded-xl mt-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Medical License Number</p>
                    <p className="font-mono text-lg font-bold text-on-surface tracking-widest">{selectedDoctor.licenseNumber || 'PENDING VERIFICATION'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low border-t border-outline-variant/30 flex gap-4">
                <button 
                  onClick={() => setIsRejectConfirmOpen(true)} 
                  disabled={isActionLoading}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-error bg-error-container hover:bg-error hover:text-white transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={18} /> Reject
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={isActionLoading}
                  className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isActionLoading ? 'Processing...' : <><Check size={18} /> Approve & Send Password</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM REJECT CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {isRejectConfirmOpen && selectedDoctor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Reject Registration?</h3>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                Are you sure you want to reject and permanently delete the registration for <span className="font-bold text-on-surface">Dr. {selectedDoctor.name}</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setIsRejectConfirmOpen(false)} 
                  disabled={isActionLoading}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-on-surface hover:bg-surface-container-low transition-colors border border-outline-variant/50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReject} 
                  disabled={isActionLoading}
                  className="flex-1 px-5 py-3 rounded-xl font-bold bg-error text-white shadow-md hover:bg-error/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isActionLoading ? 'Processing...' : 'Yes, Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Platform Overview</h1>
            <p className="text-on-surface-variant font-medium mt-1">Real-time pulse of the CareSync network.</p>
          </div>
          <div className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            System Operational
          </div>
        </header>

        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* --- 1. NETWORK GROWTH CARD --- */}
          <motion.div variants={itemVars} className="bg-[#4338CA] text-white p-8 rounded-[2rem] shadow-lg flex flex-col justify-between relative overflow-hidden h-full min-h-[400px]">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 inline-flex text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
                <UserPlus size={14} /> Network Growth
              </div>
              <h3 className="text-6xl font-black font-headline mb-2">
                {isLoading ? '...' : stats.totalUsers.toLocaleString()}
              </h3>
              <p className="text-indigo-200 text-sm font-medium">Total Active Users</p>
            </div>
            
            <div className="relative z-10 mt-auto pt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">This Month</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {stats.growthPercentage > 0 ? '+' : ''}{stats.growthPercentage}% 
                    {stats.growthPercentage > 0 && <ArrowUpRight size={24} className="text-[#F97316]" />}
                  </p>
                </div>
                <div className="h-10 w-24 flex items-end gap-1">
                  {[40, 55, 45, 70, 85, 100].map((h, i) => (
                    <div key={i} className="w-full bg-[#8B5CF6] rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- 2. DEMOGRAPHICS CARD --- */}
          <motion.div variants={itemVars} className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users size={20} /></div>
              <h2 className="text-xl font-bold font-headline text-gray-900">Demographics</h2>
            </div>
            
            <div className="space-y-6 mt-4">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-gray-700">Patients</span>
                  <span className="text-indigo-600">{stats.demographics.patients.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: calculateWidth(stats.demographics.patients) }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-gray-700">Doctors</span>
                  <span className="text-emerald-600">{stats.demographics.specialists.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: calculateWidth(stats.demographics.specialists) }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-gray-700">Support Staff</span>
                  <span className="text-amber-700">{stats.demographics.supportStaff.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-amber-700 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: calculateWidth(stats.demographics.supportStaff) }}></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- 3. ACTION REQUIRED CARD --- */}
          <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-error-container text-error rounded-lg"><ShieldAlert size={20} /></div>
              <h2 className="text-xl font-bold font-headline">Action Required</h2>
              <span className="ml-auto bg-error text-white text-xs font-bold px-2 py-1 rounded-full">{pendingDoctors.length}</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              <AnimatePresence>
                {pendingDoctors.length > 0 ? (
                  pendingDoctors.map((doc) => (
                    <motion.div 
                      key={doc._id}
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/50 group"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        <div className="text-secondary">
                          <Stethoscope size={20} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-on-surface leading-tight truncate max-w-[120px]">Dr. {doc.name}</p>
                           <p className="text-xs text-on-surface-variant">Pending Verification</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleReviewClick(doc._id)} 
                        className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm shrink-0 active:scale-95"
                      >
                        Review
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-10 text-center flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-surface-container-low rounded-full flex items-center justify-center text-secondary mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="font-bold text-on-surface">All caught up!</p>
                    <p className="text-sm text-on-surface-variant">No doctor profiles pending review.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default PlatformOverview;