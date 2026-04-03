// src/pages/public/Security.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Security = () => {
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

      <main className="flex-1 max-w-4xl mx-auto w-full py-16 px-6 text-center">
        <span className="material-symbols-outlined text-6xl text-secondary mb-6 inline-block">shield_lock</span>
        <h1 className="font-headline font-black text-4xl md:text-5xl text-primary mb-6">Enterprise-Grade Security</h1>
        <p className="text-on-surface-variant text-lg mb-12">
          In healthcare, data protection isn't a feature—it's the foundation. Here is how we protect your sanctuary.
        </p>

        <div className="space-y-6 text-left">
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex gap-4">
            <span className="material-symbols-outlined text-primary mt-1">password</span>
            <div>
              <h3 className="font-bold text-xl mb-1">Irreversible Password Hashing</h3>
              <p className="text-on-surface-variant">We utilize advanced bcrypt algorithms with automated salting. Your passwords are never stored in plain text, making them mathematically impossible to reverse-engineer.</p>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex gap-4">
            <span className="material-symbols-outlined text-error mt-1">delete_forever</span>
            <div>
              <h3 className="font-bold text-xl mb-1">Zero-Retention Rejection Policy</h3>
              <p className="text-on-surface-variant">If a doctor's application is denied by administration, all submitted credentials, personal data, and files are permanently purged from our databases instantly.</p>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex gap-4">
            <span className="material-symbols-outlined text-tertiary mt-1">vpn_key</span>
            <div>
              <h3 className="font-bold text-xl mb-1">Secure JWT Authentication</h3>
              <p className="text-on-surface-variant">Session management is handled via secure, time-limited JSON Web Tokens (JWT), ensuring that authorized access is strictly validated on every single request.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Security;