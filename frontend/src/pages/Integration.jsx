// src/pages/public/Integration.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Integration = () => {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      <nav className="p-6 flex justify-between items-center bg-surface border-b border-outline-variant/30">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-symbols-outlined text-white">health_and_safety</span>
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">CareSync</span>
        </Link>
        <Link to="/" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Back to Home</Link>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full py-16 px-6">
        <header className="text-center mb-16">
          <h1 className="font-headline font-black text-4xl md:text-5xl text-primary mb-4">System Architecture</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            CareSync is built on a highly scalable, distributed microservices architecture designed for reliability and speed.
          </p>
        </header>

        <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] border border-outline-variant/30 shadow-sm relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">hub</span> 
                API Gateway Hub
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                All client requests are securely routed through a central Node.js API Gateway, which handles proxying, CORS management, and traffic distribution to dedicated domain services.
              </p>
              
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">database</span> 
                Distributed Data
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                Patient records, doctor profiles, and administrative logs are isolated across distinct MongoDB instances, preventing data bottlenecking and ensuring system resilience.
              </p>
            </div>
          
          </div>
        </div>
      </main>
    </div>
  );
};

export default Integration;