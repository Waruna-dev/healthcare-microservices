// src/pages/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send credentials to the Admin Service via the API Gateway
      const response = await api.post('/admin/login', formData);
      
      const { token, ...adminUser } = response.data;

      // Save strictly as Admin data to prevent conflicting with Patient data
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(adminUser));

      // Redirect to the dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body text-on-surface">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant/30">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary-container text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold font-headline tracking-wide">CareSync <span className="text-primary">Admin</span></h1>
          <p className="text-sm text-on-surface-variant mt-2">Sign in to access the secure management portal.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error-container text-error text-sm font-bold rounded-xl text-center border border-error/20">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold ml-1">Admin Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email} 
                onChange={handleChange} 
                className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                placeholder="admin@caresync.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold ml-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input 
                type="password" 
                name="password"
                required
                value={formData.password} 
                onChange={handleChange} 
                className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-container transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Authenticating...' : 'Access Portal'} <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;