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
  const [showPassword, setShowPassword] = useState(false);

  // Password Validation Logic
  const passwordRules = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };
  const strengthScore = Object.values(passwordRules).filter(Boolean).length;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if password is too weak
    if (strengthScore < 3) {
      setMessage({ text: 'Please meet all password requirements.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await api.post('/patients/register', formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      setMessage({ text: 'Registration Successful! Securing your sanctuary...', type: 'success' });
      
      // Redirect to dashboard after 1.5 seconds!
      setTimeout(() => navigate('/dashboard'), 1500);

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
    <div className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-primary min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* --- Left Side: Editorial Image & Branding --- */}
        <section className="hidden md:flex md:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Clinical Excellence" 
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105" 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 via-primary/40 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <Link to="/" className="mb-8 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-white text-sm">verified_user</span>
              <span className="text-white text-xs font-medium tracking-wider uppercase font-headline">Clinical Standard Verified</span>
            </Link>
            
            <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-white leading-tight mb-6">
              Begin your <br/>
              <span className="text-secondary-fixed">journey.</span>
            </h1>
            
            <p className="text-primary-fixed text-lg leading-relaxed max-w-md">
              Join a digital sanctuary of personalized care where every heartbeat is understood and your privacy is absolute.
            </p>
          </div>
        </section>

        {/* --- Right Side: Registration Form --- */}
        <section className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-surface overflow-y-auto relative">
          
          {/* UPDATED: Back to Home Button added here */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary bg-surface-container-lowest hover:bg-surface-container-low rounded-full border border-outline-variant/50 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Home
            </Link>
          </div>

          <div className="w-full max-w-md my-auto pt-12 md:pt-0">
            
            {/* Mobile Branding Header */}
            <div className="md:hidden flex items-center gap-2 mb-10">
              <div className="bg-primary p-2 rounded-lg">
                <span className="material-symbols-outlined text-white">health_and_safety</span>
              </div>
              <span className="font-headline font-bold text-2xl text-primary tracking-tight">CareSync</span>
            </div>
            
            <header className="mb-8">
              <h2 className="font-headline font-bold text-3xl text-on-surface mb-2">Create Account</h2>
              <p className="text-on-surface-variant font-body">Set up your secure digital health profile.</p>
            </header>

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

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="name">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">person</span>
                  </div>
                  <input 
                    id="name" name="name" type="text"
                    value={formData.name} onChange={handleChange} required
                    className="block w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                    placeholder="Jane Doe" 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                  </div>
                  <input 
                    id="email" name="email" type="email"
                    value={formData.email} onChange={handleChange} required
                    className="block w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                    placeholder="jane@caresync.com" 
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="contactNumber">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">call</span>
                  </div>
                  <input 
                    id="contactNumber" name="contactNumber" type="tel"
                    value={formData.contactNumber} onChange={handleChange} required
                    className="block w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="password">Secure Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input 
                    id="password" name="password" 
                    type={showPassword ? "text" : "password"}
                    value={formData.password} onChange={handleChange} required
                    className="block w-full pl-12 pr-12 py-4 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                    placeholder="••••••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>

                {/* Password Strength Checker */}
                {formData.password.length > 0 && (
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

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70" 
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                {!isLoading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-on-surface-variant text-sm">
                Already have an account? 
                <Link to="/login" className="text-primary font-bold hover:underline ml-1">Sign In</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientRegister;