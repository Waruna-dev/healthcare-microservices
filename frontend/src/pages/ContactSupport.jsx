// src/pages/public/ContactSupport.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactSupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitting');

    // Simulate an API call to your backend
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      <br />
      <br />
      <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-6 lg:px-8">
        
        {/* Header */}
        <header className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="font-headline font-black text-4xl md:text-5xl text-primary tracking-tight mb-4">
            How can we help you?
          </h1>
          <p className="text-on-surface-variant text-lg">
            Whether you are a patient needing help with your dashboard, or a doctor experiencing verification issues, our support team is here for you.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-3 bg-surface p-8 md:p-10 rounded-[2rem] shadow-sm border border-outline-variant/30">
            <h2 className="font-headline font-bold text-2xl mb-6">Send us a message</h2>
            
            {status === 'success' && (
              <div className="mb-8 p-4 bg-secondary-container text-secondary rounded-xl font-medium flex items-center gap-3">
                <span className="material-symbols-outlined">check_circle</span>
                Your message has been sent successfully. We will get back to you shortly!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="name">Your Name</label>
                  <input 
                    id="name" name="name" type="text" required
                    value={formData.name} onChange={handleChange}
                    className="block w-full px-4 py-3.5 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                    placeholder="Jane Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="email">Email Address</label>
                  <input 
                    id="email" name="email" type="email" required
                    value={formData.email} onChange={handleChange}
                    className="block w-full px-4 py-3.5 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                    placeholder="jane@example.com" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="subject">Subject</label>
                <input 
                  id="subject" name="subject" type="text" required
                  value={formData.subject} onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface" 
                  placeholder="How can we help?" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="message">Message</label>
                <textarea 
                  id="message" name="message" rows="5" required
                  value={formData.message} onChange={handleChange}
                  className="block w-full px-4 py-3.5 bg-surface-container-lowest border-0 rounded-xl ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all placeholder:text-outline outline-none text-on-surface resize-none" 
                  placeholder="Please describe your issue in detail..." 
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={status === 'submitting'}
                className="w-full sm:w-auto mt-2 py-3.5 px-8 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 ml-auto" 
              >
                <span>{status === 'submitting' ? 'Sending...' : 'Send Message'}</span>
                {status !== 'submitting' && <span className="material-symbols-outlined text-lg">send</span>}
              </button>
            </form>
          </div>

          {/* Right Column: Direct Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-container text-primary rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-1">Email Support</h3>
                <p className="text-sm text-on-surface-variant mb-2">Our team usually responds within 2 hours during business days.</p>
                <a href="mailto:support@caresync.lk" className="text-primary font-bold hover:underline">support@caresync.lk</a>
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary-container text-secondary rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">call</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-1">Call Us</h3>
                <p className="text-sm text-on-surface-variant mb-2">Available Mon-Fri, 9am - 6pm (IST).</p>
                <a href="tel:+94112345678" className="text-primary font-bold hover:underline">+94 11 234 5678</a>
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex items-start gap-4">
              <div className="w-12 h-12 bg-tertiary-container text-tertiary rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-1">Headquarters</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  CareSync Technologies (Pvt) Ltd.<br/>
                  123 Innovation Drive,<br/>
                  Colombo 03, Sri Lanka
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
      
    </div>
  );
};

export default ContactSupport;