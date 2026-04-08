// src/pages/public/AboutUs.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">

      <main className="flex-1">
        {/* UPDATED: Clean Light Hero Section to respect the Navbar */}
        <section className="relative py-24 px-6 overflow-hidden flex flex-col items-center text-center">
          {/* Subtle background glow so it isn't boring, but doesn't clash with Navbar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto pt-8">
            <h1 className="font-headline font-black text-5xl md:text-6xl text-primary tracking-tight mb-6">
              Bridging the Gap Between <br className="hidden md:block"/> Data and Compassion.
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
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

    </div>
  );
};

export default AboutUs;