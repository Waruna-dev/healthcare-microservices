// src/pages/patient/PatientRegister.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PatientRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Send data to the API Gateway
      const response = await api.post('/patients/register', formData);
      
      // Save JWT token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      setMessage({ text: 'Registration Successful! Welcome to CareSync.', type: 'success' });
      
      // Optional: Redirect to dashboard after a short delay
      // setTimeout(() => navigate('/dashboard'), 2000);

    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Registration failed. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-surface antialiased min-h-screen flex flex-col">
      
      {/* Minimal Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-24 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary font-headline">CareSync</Link>
          <div className="flex items-center gap-6">
            <span className="text-on-surface-variant text-sm font-medium hidden sm:block">Already have an account?</span>
            <Link to="/login" className="text-primary font-semibold hover:bg-surface-container-low px-4 py-2 rounded-xl transition-all active:scale-95 duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 md:px-8 pt-24 pb-12">
        {/* Main Registration Card */}
        <div className="w-full max-w-5xl bg-surface-container-lowest/80 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-elevated flex flex-col md:flex-row min-h-[700px] border border-outline-variant/30">
          
          {/* Left Panel: Editorial/Branding */}
          <div className="w-full md:w-5/12 relative p-12 flex flex-col justify-between overflow-hidden">
            {/* Abstract Gradient Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-primary-container to-secondary opacity-95"></div>
            
            <div className="relative z-10">
              <div className="text-white text-3xl font-headline font-extrabold tracking-tight mb-4">CareSync</div>
              <div className="h-1 w-12 bg-secondary-fixed rounded-full"></div>
            </div>
            
            <div className="relative z-10 py-10">
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-white leading-tight mb-6">
                Empowering your health journey.
              </h1>
              <p className="text-white/80 text-lg font-medium max-w-xs leading-relaxed">
                Join a sanctuary of personalized care where every heartbeat is understood and every goal is supported.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center gap-4 text-white/90">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-sm font-medium tracking-wide uppercase">Clinical Grade Privacy</span>
            </div>
          </div>

          {/* Right Panel: Registration Form */}
          <div className="w-full md:w-7/12 p-8 md:p-12 bg-surface-container-lowest">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Step 1 of 2</span>
              </div>
              <h2 className="text-3xl font-headline font-bold text-on-surface">Basic Information</h2>
              <p className="text-on-surface-variant mt-2 font-medium">Let's start with the essentials for your digital health profile.</p>
            </div>

            {/* Dynamic Status Message */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
                message.type === 'error' ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'
              }`}>
                <span className="material-symbols-outlined">
                  {message.type === 'error' ? 'error' : 'check_circle'}
                </span>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identity Section */}
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-bold text-on-surface mb-2 px-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">person</span>
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright outline-none transition-all text-on-surface placeholder:text-outline/60 font-medium" 
                      placeholder="Jane Doe" 
                      type="text"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-on-surface mb-2 px-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">mail</span>
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright outline-none transition-all text-on-surface placeholder:text-outline/60 font-medium" 
                      placeholder="jane@example.com" 
                      type="email"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-on-surface mb-2 px-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">lock</span>
                    <input 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright outline-none transition-all text-on-surface placeholder:text-outline/60 font-medium" 
                      placeholder="••••••••" 
                      type="password"
                    />
                  </div>
                </div>
              </div>

              {/* Healthcare Details Section */}
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-surface-variant"></div>
                  <span className="text-xs font-bold text-outline uppercase tracking-widest px-2">Contact Details</span>
                  <div className="h-px flex-1 bg-surface-variant"></div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-on-surface mb-2 px-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">call</span>
                    <input 
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright outline-none transition-all text-on-surface placeholder:text-outline/60 font-medium" 
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isLoading}
                  className="w-full py-5 bg-primary text-white font-headline font-bold text-lg rounded-xl shadow-ambient hover:shadow-elevated hover:bg-primary-container active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70" 
                  type="submit"
                >
                  {isLoading ? 'Creating Account...' : 'Create My Account'}
                  {!isLoading && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
                
                <p className="text-center mt-6 text-xs text-on-surface-variant font-medium leading-relaxed">
                  By clicking "Create My Account", you agree to our <br className="sm:hidden" />
                  <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-8 border-t border-outline-variant/20 bg-surface">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 w-full max-w-7xl mx-auto gap-4">
          <div className="text-sm font-bold text-on-surface font-headline">CareSync</div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:text-primary transition-colors font-semibold" href="#">Privacy</a>
            <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:text-primary transition-colors font-semibold" href="#">Terms</a>
            <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:text-primary transition-colors font-semibold" href="#">Contact</a>
          </div>
          <div className="text-on-surface-variant text-xs uppercase tracking-widest font-semibold">© 2026 CareSync</div>
        </div>
      </footer>
    </div>
  );
};

export default PatientRegister;