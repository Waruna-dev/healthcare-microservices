// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, Stethoscope, Settings, 
  LogOut, Menu, X, Bell, ShieldCheck 
} from 'lucide-react';
import ManagePatients from './ManagePatients';
import PlatformOverview from './PlatformOverview';
import SystemSettings from './SystemSettings';
import ManageDoctor from './ManageDoctor';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // Defaulting to the page we just built!
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Authentication Check
  useEffect(() => {
    // We check for 'adminUser' specifically so it doesn't conflict with a regular patient login
    const storedAdmin = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');

    if (storedAdmin && token) {
      setAdminUser(JSON.parse(storedAdmin));
    } else {
      // If no admin is logged in, kick them back to the admin login page
      navigate('/admin/login');
    }
  }, [navigate]);

  // 2. Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // 3. Sidebar Navigation Links
  const navLinks = [
    { id: 'overview', label: 'Platform Overview', icon: <Activity size={20} /> },
    { id: 'patients', label: 'Manage Patients', icon: <Users size={20} /> },
    { id: 'doctors', label: 'Manage Doctors', icon: <Stethoscope size={20} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={20} /> },
  ];

  if (!adminUser) return null; // Prevent flickering before redirect

  return (
    <div className="flex h-screen bg-surface font-body text-on-surface overflow-hidden">
      
      {/* --- MOBILE OVERLAY --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-surface-container-lowest border-r border-outline-variant/30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck size={28} />
            <span className="text-xl font-bold font-headline tracking-wide">CareSync <span className="text-on-surface">Admin</span></span>
          </div>
          <button className="lg:hidden text-on-surface-variant" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Main Menu</p>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setIsMobileMenuOpen(false); // Close mobile menu on click
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === link.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer (Admin Profile & Logout) */}
        <div className="p-4 border-t border-outline-variant/30">
          <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-container text-primary rounded-full flex items-center justify-center font-bold font-headline">
              {adminUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-on-surface truncate">{adminUser.name}</p>
              <p className="text-xs text-on-surface-variant truncate">{adminUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-error font-bold rounded-xl hover:bg-error-container/50 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold font-headline hidden sm:block">
              {navLinks.find(link => link.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'patients' && <ManagePatients />}
          
          {/* Placeholders for future pages */}
          {activeTab === 'overview' && <PlatformOverview />}
          
          {activeTab === 'doctors' && <ManageDoctor />}

          {activeTab === 'settings' && <SystemSettings />}
        </div>
      </main>

    </div>
  );
};

export default AdminDashboard;