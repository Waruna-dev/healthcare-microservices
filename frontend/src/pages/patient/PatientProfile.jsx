// src/pages/patient/PatientProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, Bell, AlertTriangle, ArrowLeft, 
  Camera, Save, Trash2, Phone, Mail, ShieldAlert
} from 'lucide-react';
import api from '../../services/api';

const PatientProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form States
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    contactNumber: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load User Data on Component Mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser).patient || JSON.parse(storedUser);
      setUser(parsed);
      setProfileData({
        name: parsed.name || '',
        email: parsed.email || '',
        contactNumber: parsed.contactNumber || ''
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Handlers for Input Changes
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await api.put('/patients/profile', profileData);
      
      const updatedPatient = response.data;
      setUser(updatedPatient);

      const storageObj = JSON.parse(localStorage.getItem('user'));
      if (storageObj.patient) storageObj.patient = updatedPatient;
      else Object.assign(storageObj, updatedPatient);
      localStorage.setItem('user', JSON.stringify(storageObj));
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to update profile.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await api.put('/patients/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setMessage({ text: 'Password changed securely.', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to change password.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you absolutely sure? This action cannot be undone and all medical records will be permanently erased.");
    if (!confirmDelete) return;

    try {
      await api.delete('/patients/account');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/register');
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete account. Please contact support.");
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Details', icon: <User size={18} /> },
    { id: 'security', label: 'Security & Password', icon: <Lock size={18} /> },
    { id: 'preferences', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={18} /> }
  ];

  if (!user) return null;

  return (
    <div className="bg-surface min-h-screen font-body text-on-surface antialiased flex flex-col">
      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30">
        <div className="flex items-center px-8 py-4 max-w-7xl mx-auto gap-6">
          <Link to="/dashboard" className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold font-headline">Profile & Settings</h1>
        </div>
      </header>

      <main className="flex-1 py-10 px-6 md:px-8 max-w-7xl mx-auto w-full">
        {message.text && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-8 p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            message.type === 'error' ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'
          }`}>
            <span className="material-symbols-outlined">{message.type === 'error' ? 'error' : 'check_circle'}</span>
            {message.text}
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0 space-y-2">
            <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-ambient border border-outline-variant/30 mb-6 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-4">
                <div className="w-20 h-20 bg-primary-container text-primary rounded-full flex items-center justify-center text-3xl font-bold font-headline shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <h3 className="font-bold text-lg font-headline truncate w-full">{user.name}</h3>
              <p className="text-xs text-on-surface-variant">Patient ID: {user._id?.slice(-6).toUpperCase() || 'N/A'}</p>
            </div>

            <nav className="bg-surface-container-lowest p-3 rounded-[2rem] shadow-ambient border border-outline-variant/30 flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMessage({text:'', type:''}); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? tab.id === 'danger' ? 'bg-error-container text-error' : 'bg-primary text-white shadow-md' 
                      : tab.id === 'danger' ? 'text-error/70 hover:bg-error-container/50' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-headline">Personal Details</h2>
                    <p className="text-on-surface-variant text-sm mt-1">Update your demographic and basic medical information.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface ml-1">Full Name</label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                          <input name="name" value={profileData.name} onChange={handleProfileChange} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                      </div>

                      {/* Email - FULLY FIX AND EDITABLE NOW */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface ml-1">Email Address</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                          <input 
                            name="email" 
                            type="email"
                            value={profileData.email} 
                            onChange={handleProfileChange} 
                            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" 
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface ml-1">Phone Number</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                          <input name="contactNumber" value={profileData.contactNumber} onChange={handleProfileChange} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" disabled={isLoading} className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-container transition-colors flex items-center gap-2">
                        <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-headline">Security & Password</h2>
                    <p className="text-on-surface-variant text-sm mt-1">Ensure your sanctuary remains locked and secure.</p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface ml-1">Current Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input type="password" name="currentPassword" required value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                      </div>
                    </div>

                    <div className="w-full h-px bg-outline-variant/30 my-6"></div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface ml-1">New Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input type="password" name="newPassword" required value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface ml-1">Confirm New Password</label>
                      <div className="relative">
                        <ShieldAlert size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input type="password" name="confirmPassword" required value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button type="submit" disabled={isLoading} className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-container transition-colors flex items-center gap-2">
                        <Lock size={18} /> {isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-headline">Communication Preferences</h2>
                    <p className="text-on-surface-variant text-sm mt-1">Control how CareSync interacts with you.</p>
                  </div>

                  <div className="space-y-6 max-w-lg">
                    <div className="flex items-center justify-between p-4 border border-outline-variant/50 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-on-surface">Email Notifications</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Receive AI analysis summaries and appointment reminders via email.</p>
                      </div>
                      <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer flex-shrink-0 transition-colors">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-outline-variant/50 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-on-surface">SMS Critical Alerts</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Get immediate text messages for abnormal biometric readings.</p>
                      </div>
                      <div className="w-12 h-6 bg-surface-variant rounded-full relative cursor-pointer flex-shrink-0 transition-colors">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'danger' && (
                <motion.div key="danger" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-error-container/20 p-8 rounded-[2rem] border border-error/30">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-headline text-error flex items-center gap-2">
                      <AlertTriangle size={24} /> Danger Zone
                    </h2>
                    <p className="text-on-surface-variant text-sm mt-1">Permanent and irreversible account actions.</p>
                  </div>

                  <div className="bg-white/50 p-6 rounded-2xl border border-error/20">
                    <h4 className="font-bold text-on-surface mb-2">Delete Patient Account</h4>
                    <p className="text-sm text-on-surface-variant mb-6 leading-relaxed max-w-2xl">
                      Once you delete your account, there is no going back. All of your uploaded medical records, AI insights, and connected biometric data will be permanently wiped from our servers to comply with HIPAA and GDPR regulations.
                    </p>
                    <button onClick={handleDeleteAccount} className="px-6 py-3 bg-error text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
                      <Trash2 size={18} /> Permanently Delete Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;