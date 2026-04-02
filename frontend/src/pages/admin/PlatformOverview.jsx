// src/pages/admin/PlatformOverview.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Users, UserPlus, ShieldAlert, CheckCircle2, 
  AlertTriangle, Stethoscope, Ticket, ArrowUpRight,
  ArrowDownRight, Minus // <-- Added missing icons for dynamic percentages
} from 'lucide-react';

const PlatformOverview = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(true);

  // 1. Live Data State for the Dashboard
  const [stats, setStats] = useState({
    totalUsers: 0,
    growthPercentage: 0,
    demographics: { patients: 0, specialists: 0, supportStaff: 0 }
  });

  // 2. Action Items State
  const [actionItems, setActionItems] = useState([
    { id: 1, type: 'warning', title: '14 Doctor Profiles Pending Verification', icon: <Stethoscope size={20} /> },
    { id: 2, type: 'info', title: '3 Support Tickets Escalated', icon: <Ticket size={20} /> },
    { id: 3, type: 'critical', title: '1 System Alert: API Latency', icon: <AlertTriangle size={20} /> },
  ]);

  // 3. Fetch Data on Mount
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        // Pointing to your Admin Service (Port 5002)
        const response = await axios.get('http://localhost:5002/demographics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch demographics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleResolveAction = (id, title) => {
    setActionItems(current => current.filter(item => item.id !== id));
    showToast(`Action resolved: ${title.split(' ')[1]} updated.`);
  };

  // Helper for progress bars
  const calculateWidth = (value) => {
    if (stats.totalUsers === 0) return '0%';
    return `${(value / stats.totalUsers) * 100}%`;
  };

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } } };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-elevated flex items-center gap-3 font-bold text-sm bg-primary/90 text-white backdrop-blur-md"
          >
            <CheckCircle2 size={20} />
            {toast.message}
          </motion.div>
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

        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- 1. NETWORK GROWTH CARD --- */}
          <motion.div variants={itemVars} className="bg-[#4338CA] text-white p-8 rounded-[2rem] shadow-lg flex flex-col justify-between relative overflow-hidden">
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
            
            <div className="relative z-10 mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">This Month</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  {/* Dynamic Math Sign & Number */}
                  {stats.growthPercentage > 0 ? '+' : ''}{stats.growthPercentage}% 
                  
                  {/* Dynamic Icons */}
                  {stats.growthPercentage > 0 && <ArrowUpRight size={24} className="text-[#F97316]" />}
                  {stats.growthPercentage < 0 && <ArrowDownRight size={24} className="text-red-400" />}
                  {stats.growthPercentage === 0 && <Minus size={24} className="text-indigo-300" />}
                </p>
              </div>
              <div className="h-10 w-24 flex items-end gap-1">
                {[40, 55, 45, 70, 85, 100].map((h, i) => (
                  <div key={i} className="w-full bg-[#8B5CF6] rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                ))}
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
                  <span className="text-gray-700">Specialists</span>
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
              <span className="ml-auto bg-error text-white text-xs font-bold px-2 py-1 rounded-full">{actionItems.length}</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {actionItems.length > 0 ? (
                  actionItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/50 group"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        <div className={`
                          ${item.type === 'critical' ? 'text-error' : ''}
                          ${item.type === 'warning' ? 'text-secondary' : ''}
                          ${item.type === 'info' ? 'text-primary' : ''}
                        `}>
                          {item.icon}
                        </div>
                        <p className="text-sm font-bold text-on-surface leading-tight">{item.title}</p>
                      </div>
                      <button 
                        onClick={() => handleResolveAction(item.id, item.title)}
                        className="px-3 py-1.5 text-xs font-bold text-primary bg-primary-container rounded-lg hover:bg-primary hover:text-white transition-colors shrink-0"
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
                    <p className="text-sm text-on-surface-variant">No pending actions required.</p>
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