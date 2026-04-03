// src/pages/patient/PatientProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, Bell, AlertTriangle, ArrowLeft, 
  Camera, Save, Trash2, Phone, Mail, ShieldAlert, 
  CheckCircle, X, Info
} from 'lucide-react';
import api from '../../services/api';

const PatientProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Popup States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });

  // Form States
  const [profileData, setProfileData] = useState({ name: '', email: '', contactNumber: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  // --- NEW: Password Visibility States ---
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

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

  // Helper to trigger custom notifications
  const triggerToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ ...toast, show: false }), 4000);
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // --- NEW: Password Validation Logic ---
  const passwordRules = {
    length: passwordData.newPassword.length >= 8,
    number: /\d/.test(passwordData.newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)
  };
  const strengthScore = Object.values(passwordRules).filter(Boolean).length;

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    let cleanPhone = '';
    if (profileData.contactNumber) {
      cleanPhone = profileData.contactNumber.trim().replace(/\s+/g, '');
      const slPhoneRegex = /^(?:0|\+94)\d{9}$/;
      
      if (!slPhoneRegex.test(cleanPhone)) {
        triggerToast('Please enter a valid Sri Lankan phone number.', 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = { ...profileData, contactNumber: cleanPhone };
      const response = await api.put('/patients/profile', payload);
      
      const updatedPatient = response.data;
      setUser(updatedPatient);

      const storageObj = JSON.parse(localStorage.getItem('user'));
      if (storageObj.patient) storageObj.patient = updatedPatient;
      else Object.assign(storageObj, updatedPatient);
      localStorage.setItem('user', JSON.stringify(storageObj));
      
      triggerToast('Profile updated successfully!', 'success');
    } catch (error) {
      triggerToast(error.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // --- NEW: Block submission if password is too weak ---
    if (strengthScore < 3) {
      triggerToast('Please meet all new password requirements.', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      triggerToast('New passwords do not match!', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.put('/patients/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      triggerToast('Password changed securely.', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ current: false, new: false, confirm: false }); // Reset eyes
    } catch (error) {
      triggerToast(error.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await api.delete('/patients/account');
      localStorage.clear();
      navigate('/register');
    } catch (error) {
      triggerToast("Failed to delete account.", "error");
      setShowDeleteModal(false);
    } finally {
      setIsLoading(false);
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
    <div className="bg-surface min-h-screen font-body text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      
      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border min-w-[320px] ${
              toast.type === 'error' ? 'bg-error-container text-error border-error/20' : 'bg-surface-container-highest text-primary border-primary/20'
            }`}
          >
            {toast.type === 'error' ? <ShieldAlert size={20}/> : <CheckCircle size={20}/>}
            <span className="font-bold text-sm">{toast.text}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant/30 relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-error-container text-error rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-3 text-error">Delete Account?</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                This will permanently erase your medical history and AI analysis. This action is <span className="text-error font-bold italic text-base">irreversible.</span>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDeleteAccount}
                  className="w-full py-4 bg-error text-white font-bold rounded-2xl shadow-lg shadow-error/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Processing...' : 'Yes, Delete Permanently'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl hover:bg-surface-container-highest transition-all"
                >
                  Keep My Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30">
        <div className="flex items-center px-8 py-4 max-w-7xl mx-auto gap-6">
          <Link to="/dashboard" className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold font-headline text-primary">Profile & Settings</h1>
        </div>
      </header>

      <main className="flex-1 py-10 px-6 md:px-8 max-w-7xl mx-auto w-full">
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
                  onClick={() => { setActiveTab(tab.id); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? tab.id === 'danger' ? 'bg-error-container text-error shadow-sm' : 'bg-primary text-white shadow-md' 
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
                    <h2 className="text-2xl font-bold font-headline text-primary">Personal Details</h2>
                    <p className="text-on-surface-variant text-sm mt-1">Update your demographic and basic medical information.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface ml-1 flex items-center gap-2">Full Name <Info size={14} className="text-outline"/></label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                          <input name="name" value={profileData.name} onChange={handleProfileChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface ml-1 flex items-center gap-2">Email Address <Mail size={14} className="text-outline"/></label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                          <input name="email" type="email" value={profileData.email} onChange={handleProfileChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface ml-1 flex items-center gap-2">Phone Number <Phone size={14} className="text-outline"/></label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                          <input name="contactNumber" value={profileData.contactNumber} onChange={handleProfileChange} className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="0712345678 or +94712345678" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" disabled={isLoading} className="px-8 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-xl hover:bg-primary-container transition-all flex items-center gap-2 active:scale-95">
                        <Save size={18} /> {isLoading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-headline text-primary">Security & Password</h2>
                    <p className="text-on-surface-variant text-sm mt-1">Ensure your sanctuary remains locked and secure.</p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                    
                    {/* CURRENT PASSWORD */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface ml-1">Current Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPasswords.current ? "text" : "password"} 
                          name="currentPassword" required 
                          value={passwordData.currentPassword} onChange={handlePasswordChange} 
                          className="w-full pl-12 pr-12 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" 
                        />
                        <button 
                          type="button" onClick={() => togglePasswordVisibility('current')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showPasswords.current ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-px bg-outline-variant/20 my-6"></div>

                    {/* NEW PASSWORD & STRENGTH CHECKER */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface ml-1 text-primary">New Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPasswords.new ? "text" : "password"} 
                          name="newPassword" required 
                          value={passwordData.newPassword} onChange={handlePasswordChange} 
                          className="w-full pl-12 pr-12 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" 
                        />
                        <button 
                          type="button" onClick={() => togglePasswordVisibility('new')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showPasswords.new ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>

                      {/* Password Strength UI */}
                      {passwordData.newPassword.length > 0 && (
                        <div className="pt-2 px-1">
                          <div className="flex gap-1 mb-2">
                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${strengthScore >= 1 ? 'bg-error' : 'bg-surface-container-high'}`}></div>
                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${strengthScore >= 2 ? 'bg-tertiary' : 'bg-surface-container-high'}`}></div>
                            <div className={`h-1.5 flex-1 rounded-full transition-colors ${strengthScore >= 3 ? 'bg-secondary' : 'bg-surface-container-high'}`}></div>
                          </div>
                          <div className="flex flex-col gap-1 mt-2 text-xs text-on-surface-variant font-medium">
                            <span className={`flex items-center gap-1 ${passwordRules.length ? 'text-secondary' : ''}`}>
                              <span className="material-symbols-outlined text-[14px]">{passwordRules.length ? 'check_circle' : 'radio_button_unchecked'}</span> 8+ characters
                            </span>
                            <span className={`flex items-center gap-1 ${passwordRules.number ? 'text-secondary' : ''}`}>
                              <span className="material-symbols-outlined text-[14px]">{passwordRules.number ? 'check_circle' : 'radio_button_unchecked'}</span> At least one number
                            </span>
                            <span className={`flex items-center gap-1 ${passwordRules.special ? 'text-secondary' : ''}`}>
                              <span className="material-symbols-outlined text-[14px]">{passwordRules.special ? 'check_circle' : 'radio_button_unchecked'}</span> One special character (!@#$)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CONFIRM NEW PASSWORD */}
                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-bold text-on-surface ml-1 text-primary">Confirm New Password</label>
                      <div className="relative group">
                        <ShieldAlert size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPasswords.confirm ? "text" : "password"} 
                          name="confirmPassword" required 
                          value={passwordData.confirmPassword} onChange={handlePasswordChange} 
                          className="w-full pl-12 pr-12 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" 
                        />
                        <button 
                          type="button" onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showPasswords.confirm ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button type="submit" disabled={isLoading} className="px-8 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-xl hover:bg-primary-container transition-all flex items-center gap-2 active:scale-95">
                        <Lock size={18} /> {isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'danger' && (
                <motion.div key="danger" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-error-container/10 p-8 rounded-[2rem] border border-error/20">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-headline text-error flex items-center gap-2">
                      <AlertTriangle size={24} /> Danger Zone
                    </h2>
                    <p className="text-error/70 text-sm mt-1 font-medium">Permanent and irreversible account actions.</p>
                  </div>

                  <div className="bg-white/40 p-8 rounded-3xl border border-error/10">
                    <h4 className="font-bold text-on-surface text-lg mb-2">Delete Patient Account</h4>
                    <p className="text-sm text-on-surface-variant mb-8 leading-relaxed max-w-2xl">
                      Once you delete your account, there is no going back. All of your uploaded medical records, AI insights, and connected biometric data will be permanently wiped from our servers to comply with HIPAA regulations.
                    </p>
                    <button 
                      onClick={() => setShowDeleteModal(true)} 
                      className="px-8 py-4 bg-error text-white font-bold rounded-2xl shadow-xl shadow-error/20 hover:bg-error/90 transition-all flex items-center gap-2 active:scale-95"
                    >
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