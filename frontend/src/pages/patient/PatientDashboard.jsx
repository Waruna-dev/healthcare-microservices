// src/pages/patient/PatientDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Activity, Moon, Footprints, 
  BrainCircuit, FileText, UploadCloud, ShieldCheck, 
  Bell, Settings, LogOut, ChevronRight, AlertTriangle, CheckCircle2,
  ClipboardList, Stethoscope, User, Calendar, X, Clock
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className={`h-1.5 ${
        appointment.status === 'pending' ? 'bg-yellow-500' :
        appointment.status === 'accepted' ? 'bg-blue-500' :
        appointment.status === 'completed' ? 'bg-green-500' :
        'bg-gray-400'
      }`} />
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dr. {appointment.doctorName}</h3>
              <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
          <div>
            <p className="text-xs text-gray-500">Consultation Fee</p>
            <p className="font-semibold text-gray-900">LKR {appointment.consultationFee?.toLocaleString() || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Payment Status</p>
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
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
          
          {appointment.paymentStatus === 'pending' && appointment.status === 'accepted' && (
            <button
              onClick={() => onPaymentComplete?.(appointment)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-md transition-all"
            >
              Pay Now
            </button>
          )}
          
          {canJoinCall && (
            <button
              onClick={handleJoinCall}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-md transition-all"
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
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const fileInputRef = useRef(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Get patient info from localStorage
  const getPatientInfo = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const patient = userData.patient || userData;
        return {
          patientId: patient._id || patient.id,
          patientName: patient.name || 'Patient',
          patientEmail: patient.email || 'patient@example.com'
        };
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    return {
      patientId: null,
      patientName: 'Patient',
      patientEmail: 'patient@example.com'
    };
  };

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    const patientInfo = getPatientInfo();
    if (!patientInfo.patientId) {
      const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      setAppointments(savedAppointments);
      return;
    }
    
    try {
      setLoadingAppointments(true);
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching appointments for patient:', patientInfo.patientId);
      
      const response = await fetch(`http://localhost:5015/api/appointments/patient/${patientInfo.patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('📊 Appointments response:', data);
      
      if (data.success) {
        setAppointments(data.appointments || []);
        localStorage.setItem('appointments', JSON.stringify(data.appointments || []));
      } else {
        const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        setAppointments(savedAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      setAppointments(savedAppointments);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const patient = parsedUser.patient || parsedUser;
          setUser(patient);
          if (patient.uploadedReports) {
            setReports(patient.uploadedReports);
          }
        } else {
          navigate('/login');
          return;
        }
        
        await fetchAppointments();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAppointmentUpdate = (updatedAppointment) => {
    setAppointments(prevAppointments => 
      prevAppointments.map(a => 
        a._id === updatedAppointment._id ? updatedAppointment : a
      )
    );
    const updatedAppointments = appointments.map(a => 
      a._id === updatedAppointment._id ? updatedAppointment : a
    );
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    showToast(`Appointment ${updatedAppointment.status} successfully!`, 'success');
  };

  const handlePaymentComplete = (appointment) => {
    navigate(`/payment/${appointment._id}`, { state: { appointment } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('appointments');
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

      showToast("Report uploaded and AI analysis complete!", "success");
      
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
      const actualFilename = file.filePath?.split(/[\\/]/).pop();
      if (!actualFilename) return;
      
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

  const latestReport = reports?.length > 0 ? reports[reports.length - 1] : null;
  const aiData = latestReport?.aiAnalysis;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="bg-gray-50 min-h-screen">
      
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            {toast.message}
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-70">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 w-full z-50 bg-white shadow-sm border-b">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-extrabold text-blue-600">
              CareSync
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-gray-600">
              <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</span>
              <Link to="/doctor/listing" className="hover:text-blue-600 transition-colors">
                Specialists
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm hover:shadow-md transition-all"
              >
                {user.name?.charAt(0) || 'P'}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-lg border overflow-hidden z-50"
                  >
                    <div className="p-4 border-b bg-gray-50">
                      <p className="font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user.email || 'Patient Account'}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                      >
                        <Settings size={18} /> Account Settings
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600 transition-colors w-full text-left"
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
              Welcome Back, <span className="text-blue-600">{user.name?.split(' ')[0] || 'Patient'}</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg">Your health dashboard is ready</p>
          </div>
          <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border">
            <ShieldCheck className="text-green-600" size={24} />
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-1">System Status</span>
              <span className="text-sm font-bold text-green-600">Secure Connection</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { title: "Heart Rate", val: "72", unit: "bpm", icon: <Heart size={24} />, color: "text-red-500", bg: "bg-red-50" },
                { title: "Blood Pressure", val: "118/78", unit: "mmHg", icon: <Activity size={24} />, color: "text-blue-600", bg: "bg-blue-50" },
                { title: "O2 Saturation", val: "99", unit: "%", icon: <BrainCircuit size={24} />, color: "text-green-600", bg: "bg-green-50" },
                { title: "Daily Steps", val: "6,240", unit: "steps", icon: <Footprints size={24} />, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((metric, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border">
                  <div className={`w-12 h-12 rounded-2xl ${metric.bg} flex items-center justify-center mb-6 ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <span className="text-sm font-bold text-gray-500 block mb-2">{metric.title}</span>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black">{metric.val}</h3>
                    <span className="text-xs font-bold text-gray-500">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis Card */}
            <div className="bg-blue-600 p-8 md:p-10 rounded-3xl relative overflow-hidden text-white shadow-lg">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10 flex-wrap gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-xs font-bold uppercase mb-4">
                      <Sparkles size={14} /> AI Analysis Engine
                    </div>
                    <h2 className="text-3xl font-black leading-tight">Proactive Insights</h2>
                  </div>
                  
                  <button 
                    onClick={() => latestReport && handleDownload(latestReport)}
                    className="px-5 py-2.5 rounded-full bg-white text-blue-600 font-bold text-sm shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                    disabled={!latestReport || isUploading}
                  >
                    View Full Report
                  </button>
                </div>

                <div className="space-y-4">
                  {isUploading && (
                    <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <BrainCircuit size={20} className="animate-spin" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Analyzing Document...</h4>
                        <p className="text-white/80 text-sm">AI is extracting and processing your lab results.</p>
                      </div>
                    </div>
                  )}

                  {!isUploading && aiData?.status === 'completed' && (
                    <>
                      <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                        <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                          <ClipboardList size={20} />
                        </div>
                        <div className="w-full">
                          <h4 className="font-bold text-lg mb-1">{aiData.summaryTitle || 'Health Analysis Complete'}</h4>
                          <p className="text-white/80 text-sm">{aiData.summaryDescription || 'Your health metrics have been analyzed successfully.'}</p>
                        </div>
                      </div>

                      <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white ${aiData.urgencyLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                          {aiData.urgencyLevel === 'high' ? <AlertTriangle size={20} /> : <Stethoscope size={20} />}
                        </div>
                        <div className="w-full">
                          <h4 className="font-bold text-lg mb-1">Recommended Action</h4>
                          {aiData.abnormalitiesFound?.length > 0 ? (
                            <div>
                              <p className="text-white/90 text-sm font-semibold mb-2">Flagged Findings:</p>
                              <ul className="space-y-1 mb-3">
                                {aiData.abnormalitiesFound.slice(0, 3).map((metric, i) => (
                                  <li key={i} className="text-white/80 text-sm">• {metric}</li>
                                ))}
                              </ul>
                              <p className="text-white/80 text-sm">
                                Consider consulting a <strong>{aiData.recommendedSpecialization || 'specialist'}</strong>
                              </p>
                            </div>
                          ) : (
                            <p className="text-white/80 text-sm">No major abnormalities detected.</p>
                          )}
                          <Link to="/doctor/listing" className="inline-block mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold">
                            Book Appointment →
                          </Link>
                        </div>
                      </div>
                    </>
                  )}

                  {!isUploading && (!aiData || aiData.status === 'pending') && reports.length === 0 && (
                    <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                      <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                        <UploadCloud size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Awaiting Data</h4>
                        <p className="text-white/80 text-sm">Upload a medical report to unlock AI-driven health insights.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* APPOINTMENTS SECTION - Only Upcoming */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
                <h2 className="text-xl font-bold">Your Appointments</h2>
                {appointments.length > 1 && (
                  <Link 
                    to="/appointments/all" 
                    className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All ({appointments.length})
                  </Link>
                )}
              </div>
              
              {loadingAppointments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : upcomingAppointment ? (
                <AppointmentCard
                  appointment={upcomingAppointment}
                  onStatusUpdate={handleAppointmentUpdate}
                  onPaymentComplete={handlePaymentComplete}
                />
              ) : appointments.length > 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active appointments</p>
                  <p className="text-sm text-gray-400 mt-1">Your past appointments are in "View All"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No appointments scheduled</p>
                  <Link 
                    to="/doctor/listing" 
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Book Your First Appointment
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-8">
            {/* Records Vault */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                <h2 className="text-xl font-bold">Records Vault</h2>
              </div>
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group mb-6 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  {isUploading ? <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <UploadCloud size={28} />}
                </div>
                <h4 className="font-bold text-gray-800 mb-2">{isUploading ? 'Uploading securely...' : 'Upload Medical Report'}</h4>
                <p className="text-xs text-gray-500 max-w-[200px]">Upload PDF lab results for AI analysis</p>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Recently Processed</h5>
                {reports.length > 0 ? (
                  [...reports].reverse().slice(0, 3).map((file, idx) => (
                    <div key={idx} onClick={() => handleDownload(file)} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><FileText size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 truncate max-w-[150px]">{file.fileName}</p>
                          <p className="text-[10px] text-blue-600 font-bold mt-1">Click to download</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <FileText size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Vault is empty</p>
                    <p className="text-xs text-gray-400 mt-1">Upload your first report</p>
                  </div>
                )}
              </div>
            </div>

            {/* Access Control */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ShieldCheck size={20} /></div>
                <h2 className="text-xl font-bold">Access Control</h2>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-gray-800">Data Sharing</p>
                    <p className="text-xs text-gray-500">2 Authorized Providers</p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Manage</button>
                </div>
                <div className="w-full h-px bg-gray-200"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-gray-800">Biometric Sync</p>
                    <p className="text-xs text-gray-500">Apple Health Connected</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;