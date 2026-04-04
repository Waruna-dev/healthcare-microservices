// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, LogIn, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // --- NEW: Session State ---
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Track scroll for the glass effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- NEW: Check for Logged In User on Load ---
  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Safely extract user data whether it's nested (parsed.patient/parsed.doctor) or flat
        const userData = parsed.patient || parsed.doctor || parsed;
        setUser(userData);
      }
    };
    
    checkSession();
    
    // Optional: Listen for storage changes in case they log in on another tab
    window.addEventListener('storage', checkSession);
    return () => window.removeEventListener('storage', checkSession);
  }, []);

  // --- NEW: Handle Logout ---
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setMobileMenuOpen(false);
    navigate('/'); // Send them back to home page
  };

  // Determine correct dashboard path based on role
  const dashboardPath = user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 w-full z-[100] transition-colors duration-500 ${
          isScrolled ? "bg-surface/80 backdrop-blur-24 border-b border-outline-variant py-4 shadow-ambient" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-elevated"
            >
              <HeartPulse size={24} />
            </motion.div>
            <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">CareSync</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-10 font-headline font-semibold text-sm text-on-surface-variant">
            <a href="#sanctuary" className="hover:text-primary transition-colors">The Sanctuary</a>
            <a href="#clinical" className="hover:text-primary transition-colors">Clinical Precision</a>
            <a href="#security" className="hover:text-primary transition-colors">Security</a>
          </div>

          {/* --- UPDATED: Desktop Auth Buttons --- */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              // IF LOGGED IN: Show Dashboard & Logout
              <>
                <Link to={dashboardPath} className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm bg-primary text-white shadow-elevated hover:bg-primary-container hover:-translate-y-0.5 transition-all duration-300">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm bg-error-container text-error shadow-ambient hover:bg-error hover:text-white transition-all duration-300">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              // IF LOGGED OUT: Show Sign In & Join
              <>
                <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm bg-surface-container-lowest text-primary shadow-ambient hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
                  <LogIn size={16} /> Sign In
                </Link>
                <Link to="/register" className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-primary text-on-primary shadow-elevated hover:bg-primary-container hover:-translate-y-0.5 transition-all duration-300">
                  Join CareSync
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>

      {/* --- UPDATED: Mobile Menu Dropdown --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-20 left-0 w-full bg-surface-container-lowest border-b border-outline-variant z-50 md:hidden overflow-hidden shadow-elevated"
          >
            <div className="flex flex-col p-6 gap-4 font-headline font-bold text-lg">
              {user ? (
                <>
                  <div className="flex items-center gap-3 mb-2 p-3 bg-surface-container-low rounded-2xl">
                     <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold overflow-hidden border border-primary/20">
                       {user.profilePicture ? (
                         <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                       ) : (
                         user.name.charAt(0)
                       )}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-on-surface">{user.name}</p>
                       <p className="text-xs text-on-surface-variant font-normal">{user.email}</p>
                     </div>
                  </div>
                  <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)} className="w-full py-4 flex justify-center items-center gap-2 bg-primary text-white text-center rounded-2xl shadow-ambient">
                    <LayoutDashboard size={18}/> Go to Dashboard
                  </Link>
                  <button onClick={handleLogout} className="w-full py-4 flex justify-center items-center gap-2 bg-error-container text-error text-center rounded-2xl">
                    <LogOut size={18}/> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 bg-surface-container-low text-primary text-center rounded-2xl">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 bg-primary text-on-primary text-center rounded-2xl shadow-ambient">Create Account</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;