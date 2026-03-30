// src/pages/patient/PatientDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Activity, Moon, Footprints, 
  BrainCircuit, FileText, UploadCloud, ShieldCheck, 
  Bell, Settings, LogOut, ChevronRight
} from 'lucide-react';
import api from '../../services/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Patient' });
  
  // Upload State Variables
  const [isUploading, setIsUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const fileInputRef = useRef(null);

  // 1. Fetch the user's data on load
  // 1. Fetch the user's data on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser).patient || JSON.parse(storedUser);
      setUser(parsedUser);
      
      // FIX: Tell React to load the historical reports into the UI!
      if (parsedUser.uploadedReports) {
        setReports(parsedUser.uploadedReports);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 2. File Upload Function
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF document.");
      return;
    }

    const formData = new FormData();
    formData.append('reportFile', file); // Must match your Multer configuration!

    setIsUploading(true);
    try {
      const response = await api.post('/patients/upload-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // 1. Updates the screen instantly
      setReports(response.data.reports); 
      
      // --- THE NEW MEMORY FIX STARTS HERE ---
      // 2. Updates the browser's memory so it survives a refresh!
      const storedUserString = localStorage.getItem('user');
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        // Handle both possible structures of your user object
        if (storedUser.patient) {
          storedUser.patient.uploadedReports = response.data.reports;
        } else {
          storedUser.uploadedReports = response.data.reports;
        }
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
      // --- THE NEW MEMORY FIX ENDS HERE ---

      alert("Report uploaded successfully!");
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error.response?.data?.message || "Failed to upload report.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface antialiased flex flex-col">
      
      {/* --- DASHBOARD NAVBAR --- */}
      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30 shadow-ambient">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            {/* FIXED: Added Link to route back to Home */}
            <Link to="/" className="text-2xl font-extrabold text-primary font-headline tracking-tighter hover:opacity-80 transition-opacity">
              CareSync
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm text-on-surface-variant">
              <span className="text-primary border-b-2 border-primary pb-1">Sanctuary</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Records</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Specialists</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all">
              <Bell size={20} />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all">
              <Settings size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-error-container text-error rounded-xl font-bold text-sm hover:opacity-80 transition-opacity"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 px-6 md:px-8 max-w-7xl mx-auto w-full">
        
        {/* --- GREETING SECTION --- */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface">
              Good morning, <span className="text-primary">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="text-on-surface-variant font-medium text-lg">Your digital sanctuary is secure and optimized.</p>
          </div>
          
          <div className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 shadow-ambient border border-outline-variant/30">
            <div className="relative flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle className="text-surface-container-high" cx="24" cy="24" fill="transparent" r="20" strokeWidth="4"></circle>
                <circle className="text-secondary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="10" strokeWidth="4" strokeLinecap="round"></circle>
              </svg>
              <ShieldCheck className="absolute text-secondary" size={16} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">System Status</span>
              <span className="text-sm font-bold text-secondary">E2E Encryption Active</span>
            </div>
          </div>
        </section>

        {/* --- MAIN BENTO GRID --- */}
        <motion.div 
          variants={containerVars} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          
          {/* LEFT COLUMN: Vitals & AI Diagnostics (Task 1 & 3) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Task 1: Real-Time Biometrics Grid */}
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

            {/* Task 3: AI Smart Diagnostics */}
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
                  <button className="px-5 py-2.5 rounded-full bg-white text-primary font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                    View Full Report
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Lipid Panel Normalized</h4>
                      <p className="text-white/80 text-sm leading-relaxed">Based on the PDF lab results uploaded yesterday, your LDL cholesterol has dropped by 15%, entering the optimal clinical range.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-tertiary text-white flex items-center justify-center shrink-0">
                      <Moon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Sleep Deprivation Alert</h4>
                      <p className="text-white/80 text-sm leading-relaxed">Biometric data indicates a 20% reduction in REM sleep over the last 3 days. Consider adjusting your evening routine.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Records Vault & Privacy (Task 2, 4, 5) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Task 2: Unified Medical Records Vault */}
            <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-fixed text-primary rounded-lg"><FileText size={20} /></div>
                <h2 className="text-xl font-bold font-headline">Records Vault</h2>
              </div>
              
              {/* FIXED: HIDDEN FILE INPUT */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf"
                className="hidden" 
              />

              {/* FIXED: PDF Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed border-outline-variant/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors cursor-pointer group mb-6 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UploadCloud size={28} />
                  )}
                </div>
                <h4 className="font-bold text-on-surface mb-2">
                  {isUploading ? 'Uploading securely...' : 'Upload Medical Report'}
                </h4>
                <p className="text-xs text-on-surface-variant max-w-[200px]">Securely upload PDF lab results or doctor notes for AI analysis.</p>
              </div>

              {/* Recent Files */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Recently Processed</h5>
                
                {/* Dynamically render uploaded reports if any, else show mocks */}
                {reports.length > 0 ? (
                  reports.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center"><FileText size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-on-surface truncate max-w-[150px]">{file.fileName}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">Just now</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-outline" />
                    </div>
                  ))
                ) : (
                  // Mock data placeholder until they upload
                  [
                    { name: "Blood_Work_Q1_2026.pdf", date: "Today, 09:41 AM" },
                    { name: "Cardiology_Consult.pdf", date: "Mar 28, 2026" }
                  ].map((file, idx) => (
                    <div key={`mock-${idx}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center"><FileText size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-on-surface truncate max-w-[150px]">{file.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">{file.date}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-outline" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Task 4 & 5: Zero-Trust Privacy Settings */}
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

// SVG Icon Helper
const Sparkles = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4M3 5h4"/>
  </svg>
);

export default PatientDashboard;