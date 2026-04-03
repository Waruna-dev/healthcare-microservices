// src/pages/public/AboutUs.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      {/* Navigation Bar (Optional, adapt to your actual navbar) */}
      <nav className="p-6 flex justify-between items-center bg-surface border-b border-outline-variant/30">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-symbols-outlined text-white">health_and_safety</span>
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">CareSync</span>
        </Link>
        <Link to="/" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
          Back to Home
        </Link>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-primary py-24 px-6 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Medical Professionals" 
              className="w-full h-full object-cover opacity-20 mix-blend-luminosity" 
              src="https://images.unsplash.com/photo-1551076805-e18690c5e53b?auto=format&fit=crop&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="font-headline font-black text-5xl md:text-6xl text-white tracking-tight mb-6">
              Bridging the Gap Between <br className="hidden md:block"/> Data and Compassion.
            </h1>
            <p className="text-primary-fixed text-lg md:text-xl leading-relaxed">
              CareSync is a state-of-the-art digital health platform designed to unify patient records, empower doctors with AI-driven insights, and redefine the standard of clinical excellence in Sri Lanka and beyond.
            </p>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-on-surface mb-4">Our Core Pillars</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">We built CareSync on a foundation of trust, technology, and transparency to ensure every heartbeat is understood.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-container text-primary rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">psychiatry</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-3">AI-Powered Precision</h3>
              <p className="text-on-surface-variant leading-relaxed">
                We leverage advanced artificial intelligence to analyze uploaded medical reports, instantly extracting critical insights and abnormalities to assist doctors in making faster, life-saving decisions.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-secondary-container text-secondary rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">enhanced_encryption</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-3">Absolute Security</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Your medical data is your sanctuary. From encrypted records to strict deletion policies for rejected applications, we guarantee that your sensitive information remains entirely confidential.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-tertiary-container text-tertiary rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">diversity_1</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-3">Unified Ecosystem</h3>
              <p className="text-on-surface-variant leading-relaxed">
                By seamlessly connecting patients with top-tier, verified specialists, CareSync eliminates the friction of traditional healthcare, creating a synchronized network of healing.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-6 bg-surface-container-low text-center">
          <h2 className="font-headline font-bold text-3xl mb-6">Ready to experience modern healthcare?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-colors">
              Join as a Patient
            </Link>
            <Link to="/doctor/register" className="px-8 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl border border-outline-variant/30 hover:bg-outline-variant/20 transition-colors">
              Apply as a Doctor
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-on-surface-variant text-sm border-t border-outline-variant/30">
        <p>&copy; {new Date().getFullYear()} CareSync. Quality Care by Design.</p>
      </footer>
    </div>
  );
};

export default AboutUs;