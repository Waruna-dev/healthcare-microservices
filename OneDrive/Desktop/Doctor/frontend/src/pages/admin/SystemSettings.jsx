// src/components/admin/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // <-- Added for redirection
import axios from 'axios';
import { 
  User, Mail, Lock, ShieldPlus, Save, 
  CheckCircle2, AlertTriangle, Key, Trash2 // <-- Added Trash2 icon
} from 'lucide-react';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'SuperAdmin' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('adminUser'));
    if (storedUser) {
      setProfile(prev => ({ ...prev, name: storedUser.name, email: storedUser.email }));
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // --- HANDLER: Update Profile ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put('http://localhost:5002/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast("Profile updated successfully!");
        localStorage.setItem('adminUser', JSON.stringify(response.data.data));
        setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- HANDLER: Add New Admin ---
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5002/register', newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast(`Admin ${newAdmin.name} added successfully!`);
        setNewAdmin({ name: '', email: '', password: '', role: 'SuperAdmin' });
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to add new admin", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // --- HANDLER: Delete Account ---
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your admin account? This action cannot be undone."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete('http://localhost:5002/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Clear auth data and redirect to login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete account", "error");
    } finally {
      setIsDeleting(false);
    }
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
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-elevated flex items-center gap-3 font-bold text-sm backdrop-blur-md text-white
              ${toast.type === 'error' ? 'bg-error/90' : 'bg-primary/90'}
            `}
          >
            {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">System Settings</h1>
          <p className="text-on-surface-variant font-medium mt-1">Manage your profile and platform administrators.</p>
        </header>

        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- 1. UPDATE PROFILE CARD --- */}
          <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary-container text-primary rounded-lg"><User size={24} /></div>
              <h2 className="text-2xl font-bold font-headline text-on-surface">My Profile</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input 
                    type="text" 
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input 
                    type="email" 
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30">
                <p className="text-sm font-bold text-on-surface mb-4">Change Password (Optional)</p>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      type="password" 
                      placeholder="Current Password"
                      value={profile.currentPassword}
                      onChange={(e) => setProfile({...profile, currentPassword: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                    <input 
                      type="password" 
                      placeholder="New Password"
                      value={profile.newPassword}
                      onChange={(e) => setProfile({...profile, newPassword: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
              >
                {isUpdating ? <span className="animate-pulse">Updating...</span> : <><Save size={18} /> Save Changes</>}
              </button>
            </form>

            {/* DANGER ZONE - Account Deletion */}
            <div className="mt-8 pt-6 border-t border-error/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-error text-sm">Danger Zone</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Permanently delete your admin account.</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-error-container text-error rounded-xl font-bold text-sm hover:bg-error hover:text-white transition-colors"
                >
                  {isDeleting ? 'Deleting...' : <><Trash2 size={16} /> Delete Account</>}
                </button>
              </div>
            </div>
          </motion.div>

          {/* --- 2. ADD NEW ADMIN CARD --- */}
          <motion.div variants={itemVars} className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient border border-outline-variant/30 h-fit">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-secondary-container text-secondary rounded-lg"><ShieldPlus size={24} /></div>
              <h2 className="text-2xl font-bold font-headline text-on-surface">Add Administrator</h2>
            </div>
            
            <form onSubmit={handleAddAdmin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Admin Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Jane Doe"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input 
                    type="email" 
                    required
                    placeholder="jane.doe@caresync.com"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Temporary Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input 
                    type="password" 
                    required
                    placeholder="Set a secure password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all text-sm"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-white font-bold py-3.5 rounded-xl hover:bg-secondary/90 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
              >
                {isAdding ? <span className="animate-pulse">Creating...</span> : <><ShieldPlus size={18} /> Create Admin</>}
              </button>
            </form>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default SystemSettings;