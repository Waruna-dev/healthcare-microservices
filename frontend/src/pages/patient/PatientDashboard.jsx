// src/pages/patient/PatientDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Activity, Moon, Footprints, 
  BrainCircuit, FileText, UploadCloud, ShieldCheck, 
  Bell, Settings, LogOut, ChevronRight, AlertTriangle, CheckCircle2,
  ClipboardList, Stethoscope, User
} from 'lucide-react';
import api from '../../services/api';

// Sparkles component for AI icon
const Sparkles = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4M3 5h4"/>
  </svg>
);

// Appointment Card Component
const AppointmentCard = ({ appointment, onStatusUpdate, onPaymentComplete }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning-container text-warning';
      case 'accepted': return 'bg-primary-fixed text-primary';
      case 'completed': return 'bg-secondary-container text-secondary';
      case 'rejected': return 'bg-error-container text-error';
      case 'cancelled': return 'bg-surface-container-low text-on-surface-variant';
      default: return 'bg-surface-container-low text-on-surface-variant';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning-container text-warning';
      case 'completed': return 'bg-secondary-container text-secondary';
      case 'failed': return 'bg-error-container text-error';
      default: return 'bg-surface-container-low text-on-surface-variant';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewDetails = () => {
    navigate(`/appointments/${appointment._id}`, { state: { appointment } });
  };

  const handleJoinCall = () => {
    navigate(`/telemedicine/${appointment._id}`);
  };

  const canJoinCall = appointment.paymentStatus === 'completed' && 
                      appointment.status === 'accepted' &&
                      appointment.telemedicineLink;

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-ambient border border-outline-variant/30 overflow-hidden hover:shadow-elevated transition-all duration-300">
      <div className={`h-1.5 ${
        appointment.status === 'pending' ? 'bg-warning' :
        appointment.status === 'accepted' ? 'bg-primary' :
        appointment.status === 'completed' ? 'bg-secondary' :
        'bg-outline'
      }`} />
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-fixed rounded-xl">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Dr. {appointment.doctorName}</h3>
              <p className="text-sm text-on-surface-variant">{appointment.doctorSpecialty}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Calendar className="w-4 h-4 text-outline" />
            <span>{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Clock className="w-4 h-4 text-outline" />
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-outline-variant/30 mb-4">
          <div>
            <p className="text-xs text-on-surface-variant">Consultation Fee</p>
            <p className="font-semibold text-on-surface">LKR {appointment.consultationFee?.toLocaleString() || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant">Payment Status</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPaymentStatusColor(appointment.paymentStatus)}`}>
              {appointment.paymentStatus === 'pending' ? 'Payment Pending' : 
               appointment.paymentStatus === 'completed' ? 'Paid' : 
               appointment.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
          >
            View Details
          </button>
          
          {appointment.paymentStatus === 'pending' && appointment.status === 'accepted' && (
            <button
              onClick={() => onPaymentComplete?.(appointment)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:shadow-md transition-all"
            >
              Pay Now
            </button>
          )}
          
          {canJoinCall && (
            <button
              onClick={handleJoinCall}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-secondary rounded-xl hover:shadow-md transition-all"
            >
              Join Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Patient' });
  
  const [isUploading, setIsUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const fileInputRef = useRef(null);
  
  // --- NEW: Dropdown State & Ref ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser).patient || JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.uploadedReports) {
        setReports(parsedUser.uploadedReports);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // --- NEW: Close dropdown when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast("Please upload a valid PDF document.", "error");
      return;
    }

    const formData = new FormData();
    formData.append('reportFile', file); 

    setIsUploading(true);
    try {
      const response = await api.post('/patients/upload-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setReports(response.data.reports); 
      
      const storedUserString = localStorage.getItem('user');
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        if (storedUser.patient) {
          storedUser.patient.uploadedReports = response.data.reports;
        } else {
          storedUser.uploadedReports = response.data.reports;
        }
        localStorage.setItem('user', JSON.stringify(storedUser));
      }

      setTimeout(() => showToast("Report uploaded and AI analysis complete!", "success"), 500);
      
    } catch (error) {
      console.error("Upload failed:", error);
      showToast(error.response?.data?.message || "Failed to upload report.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file) => {
    if (!file) return;
    try {
      const actualFilename = file.filePath.split(/[\\/]/).pop();
      const response = await api.get(`/patients/reports/${actualFilename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      showToast("Failed to securely download the report.", "error");
    }
  };

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } } };

  // Grab the latest AI analysis data
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const aiData = latestReport?.aiAnalysis;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get upcoming appointment (first pending or accepted)
  const upcomingAppointment = appointments.find(
    apt => apt.status === 'pending' || apt.status === 'accepted'
  );

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface antialiased flex flex-col relative overflow-hidden">
      
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-elevated flex items-center gap-3 font-bold text-sm backdrop-blur-md border ${
              toast.type === 'success' 
                ? 'bg-primary/90 text-white border-white/20' 
                : 'bg-error/90 text-white border-white/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30 shadow-ambient">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-extrabold text-primary font-headline tracking-tighter hover:opacity-80 transition-opacity">
              CareSync
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm text-on-surface-variant">
              <span className="text-primary border-b-2 border-primary pb-1">Sanctuary</span>
              <Link to="/doctor/listing" className="hover:text-primary cursor-pointer transition-colors">Specialists</Link>
              <Link to="/appointments/all" className="hover:text-primary cursor-pointer transition-colors">Appointments</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all">
              <Bell size={20} />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-all flex items-center justify-center bg-primary-container text-primary font-bold shadow-sm hover:shadow-md"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0) || <User size={20} />
                )}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 bg-surface-container-lowest rounded-2xl shadow-elevated border border-outline-variant/30 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/50">
                      <p className="font-bold text-on-surface truncate">{user.name}</p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{user.email || 'Patient Account'}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <Settings size={18} /> Account Settings
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error-container/50 text-sm font-bold text-error transition-colors w-full text-left"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-6 md:px-8 max-w-7xl mx-auto w-full">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface">
              Welcome Back, <span className="text-primary">{user.name?.split(' ')[0] || 'Patient'}</span>
            </h1>
            <p className="text-on-surface-variant font-medium text-lg">Your digital sanctuary is secure and optimized.</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 shadow-ambient border border-outline-variant/30">
            <div className="relative flex items-center justify-center">
              <ShieldCheck className="text-secondary" size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">System Status</span>
              <span className="text-sm font-bold text-secondary">E2E Encryption Active</span>
            </div>
          </div>
        </section>

        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { title: "Heart Rate", val: "72", unit: "bpm", icon: <Heart size={24} />, color: "text-error", bg: "bg-error-container" },
                { title: "Blood Pressure", val: "118/78", unit: "mmHg", icon: <Activity size={24} />, color: "text-primary", bg: "bg-primary-fixed" },
                { title: "O2 Saturation", val: "99", unit: "%", icon: <BrainCircuit size={24} />, color: "text-secondary", bg: "bg-secondary-container" },
                { title: "Daily Steps", val: "6,240", unit: "steps", icon: <Footprints size={24} />, color: "text-tertiary", bg: "bg-tertiary-fixed" },
              ].map((metric, idx) => (
                <motion.div key={idx} variants={itemVars} className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-ambient hover:shadow-elevated transition-all border border-outline-variant/30 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${metric.bg} flex items-center justify-center mb-6 ${metric.color} group-hover:scale-110 transition-transform`}>
                    {metric.icon}
                  </div>
                  <span className="text-sm font-bold text-on-surface-variant block mb-2">{metric.title}</span>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black font-headline">{metric.val}</h3>
                    <span className="text-xs font-bold text-on-surface-variant">{metric.unit}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* AI Analysis Card */}
            <motion.div variants={itemVars} className="bg-primary p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden text-on-primary shadow-elevated">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-widest uppercase mb-4">
                      <Sparkles size={14} /> AI Analysis Engine
                    </div>
                    <h2 className="text-3xl font-black font-headline leading-tight">Proactive Insights</h2>
                  </div>
                  
                  <button 
                    onClick={() => latestReport && handleDownload(latestReport)}
                    className="px-5 py-2.5 rounded-full bg-white text-primary font-bold text-sm shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    disabled={!latestReport || isUploading}
                  >
                    View Full Report
                  </button>
                </div>

                <div className="space-y-4">
                  {/* State 1: Uploading & Analyzing */}
                  {isUploading && (
                    <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <BrainCircuit size={20} className="animate-spin-slow" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Analyzing Document...</h4>
                        <p className="text-white/80 text-sm leading-relaxed">CareSync AI is extracting and processing your lab results.</p>
                      </div>
                    </div>
                  )}

                  {/* State 2: Analysis Completed Successfully */}
                  {!isUploading && aiData?.status === 'completed' && (
                    <>
                      <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                          <ClipboardList size={20} />
                        </div>
                        <div className="w-full">
                          <h4 className="font-bold text-lg mb-1">{aiData.summaryTitle || 'Health Analysis Complete'}</h4>
                          <p className="text-white/80 text-sm leading-relaxed">{aiData.summaryDescription || 'Your health metrics have been analyzed successfully.'}</p>
                        </div>
                      </div>

                      <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white ${aiData.urgencyLevel === 'high' ? 'bg-error' : 'bg-tertiary'}`}>
                          {aiData.urgencyLevel === 'high' ? <AlertTriangle size={20} /> : <Stethoscope size={20} />}
                        </div>
                        <div className="w-full">
                          <h4 className="font-bold text-lg mb-1">Recommended Action</h4>
                          
                          {aiData.abnormalitiesFound?.length > 0 ? (
                            <div className="mb-4 mt-2">
                              <p className="text-white/90 text-sm font-semibold mb-2">Flagged Findings:</p>
                              <ul className="space-y-2 mb-3 bg-black/10 rounded-xl p-4 border border-white/10">
                                {aiData.abnormalitiesFound.slice(0, 3).map((metric, i) => (
                                  <li key={i} className="text-white/80 text-sm flex items-start gap-3">
                                    <span className="opacity-50 mt-0.5">•</span>
                                    <span className="leading-snug">{metric}</span>
                                  </li>
                                ))}
                              </ul>
                              <p className="text-white/80 text-sm leading-relaxed">
                                Consider consulting a <strong>{aiData.recommendedSpecialization || 'specialist'}</strong> for a detailed review.
                              </p>
                            </div>
                          ) : (
                            <p className="text-white/80 text-sm leading-relaxed mb-3">
                              No major abnormalities detected. Consider consulting a <strong>{aiData.recommendedSpecialization || 'specialist'}</strong> for a standard review.
                            </p>
                          )}

                          <Link to="/doctor/listing" className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors">
                            Book {aiData.recommendedSpecialization || 'Appointment'}
                          </Link>
                        </div>
                      </div>
                    </>
                  )}

                  {!isUploading && aiData?.status === 'failed' && (
                    <div className="flex gap-5 p-5 rounded-2xl bg-error-container/20 backdrop-blur-md border border-error/30 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-error text-white flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 text-white">Analysis Failed</h4>
                        <p className="text-white/80 text-sm leading-relaxed">
                          We safely stored your document in the vault, but our AI couldn't read the text. Ensure the PDF is a text document, not a scanned image.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isUploading && (!aiData || aiData.status === 'pending') && reports.length === 0 && (
                    <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                        <UploadCloud size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Awaiting Data</h4>
                        <p className="text-white/80 text-sm leading-relaxed">Upload a medical report or lab result in the Records Vault to unlock proactive, AI-driven health insights.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* APPOINTMENTS SECTION - Only Upcoming */}
            <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-fixed text-primary rounded-lg"><Calendar size={20} /></div>
                <h2 className="text-xl font-bold font-headline">Your Appointments</h2>
                {appointments.length > 1 && (
                  <Link 
                    to="/appointments/all" 
                    className="ml-auto text-sm text-primary hover:text-primary-hover font-medium"
                  >
                    View All ({appointments.length})
                  </Link>
                )}
              </div>
              
              {loadingAppointments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : upcomingAppointment ? (
                <AppointmentCard
                  appointment={upcomingAppointment}
                  onStatusUpdate={handleAppointmentUpdate}
                  onPaymentComplete={handlePaymentComplete}
                />
              ) : appointments.length > 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="text-outline mx-auto mb-3" />
                  <p className="text-on-surface-variant">No active appointments</p>
                  <p className="text-sm text-on-surface-variant/70 mt-1">Your past appointments are in "View All"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={48} className="text-outline mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm">No appointments scheduled</p>
                  <Link 
                    to="/doctor/listing" 
                    className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Book Your First Appointment
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Records Vault */}
            <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-fixed text-primary rounded-lg"><FileText size={20} /></div>
                <h2 className="text-xl font-bold font-headline">Records Vault</h2>
              </div>
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-outline-variant/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors cursor-pointer group mb-6 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  {isUploading ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <UploadCloud size={28} />}
                </div>
                <h4 className="font-bold text-on-surface mb-2">{isUploading ? 'Uploading securely...' : 'Upload Medical Report'}</h4>
                <p className="text-xs text-on-surface-variant max-w-[200px]">Securely upload PDF lab results or doctor notes for AI analysis.</p>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Recently Processed</h5>
                {reports.length > 0 ? (
                  [...reports].reverse().slice(0, 3).map((file, idx) => (
                    <div key={idx} onClick={() => handleDownload(file)} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center"><FileText size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-on-surface truncate max-w-[150px]">{file.fileName}</p>
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">Click to download</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-outline" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-lowest/50">
                    <div className="w-10 h-10 bg-surface-container-low rounded-full flex items-center justify-center text-outline mb-3">
                      <FileText size={18} />
                    </div>
                    <p className="text-sm font-bold text-on-surface">Vault is empty</p>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-[180px]">Your securely processed medical reports will appear here.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Access Control */}
            <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-secondary-container text-secondary rounded-lg"><ShieldCheck size={20} /></div>
                <h2 className="text-xl font-bold font-headline">Access Control</h2>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-on-surface">Data Sharing</p>
                    <p className="text-xs text-on-surface-variant">2 Authorized Providers</p>
                  </div>
                  <button className="text-xs font-bold text-primary hover:underline">Manage</button>
                </div>
                <div className="w-full h-px bg-outline-variant/30"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-on-surface">Biometric Sync</p>
                    <p className="text-xs text-on-surface-variant">Apple Health Connected</p>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const Sparkles = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4M3 5h4"/>
  </svg>
);

export default PatientDashboard;