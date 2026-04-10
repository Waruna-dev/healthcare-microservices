import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Settings, LogOut, User, FileText
} from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation items configuration
  const navItems = [
    { path: '/patient/dashboard', label: 'Dashboard' },
    { path: '/doctor/listing', label: 'Specialists' },
    { path: '/appointments/all', label: 'Appointments' },
    { path: '/prescriptions', label: 'Prescriptions', icon: FileText }
  ];

  return (
    <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-outline-variant/30 shadow-ambient">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <Link 
            to="/" 
            className="text-2xl font-extrabold text-primary font-headline tracking-tighter hover:opacity-80 transition-opacity"
          >
            CareSync
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm text-on-surface-variant">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${location.pathname === item.path 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'hover:text-primary'} transition-colors flex items-center gap-2`}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side - Notifications & Profile */}
        <div className="flex items-center gap-4">
          <button 
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-all flex items-center justify-center bg-primary-container text-primary font-bold shadow-sm hover:shadow-md"
              aria-label="Profile menu"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || <User size={20} />
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
                    <p className="font-bold text-on-surface truncate">{user?.name || 'Patient'}</p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {user?.email || 'Patient Account'}
                    </p>
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
                      onClick={onLogout} 
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
  );
};

export default Header;