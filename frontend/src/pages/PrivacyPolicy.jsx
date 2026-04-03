// src/pages/public/PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      {/* Navigation Bar */}
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

      <main className="flex-1 max-w-4xl mx-auto w-full py-12 px-6">
        <header className="mb-12 border-b border-outline-variant/30 pb-8">
          <h1 className="font-headline font-black text-4xl md:text-5xl text-primary tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-on-surface-variant text-lg">Effective Date: April 2026</p>
        </header>

        <article className="space-y-8 text-on-surface leading-relaxed">
          
          <section>
            <h2 className="font-headline font-bold text-2xl mb-4 text-on-surface">1. Introduction</h2>
            <p className="text-on-surface-variant">
              At CareSync, your privacy is our highest priority. This Privacy Policy outlines how we collect, use, protect, and handle your Personally Identifiable Information (PII) and Protected Health Information (PHI) when you use our website, mobile applications, and connected healthcare services.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-2xl mb-4 text-on-surface">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-on-surface-variant">
              <li><strong>Patient Data:</strong> Full name, email address, contact numbers, residential address, medical history, and uploaded laboratory or clinical reports.</li>
              <li><strong>Doctor Data:</strong> Professional credentials, medical license numbers, clinical experience, specializations, and contact details.</li>
              <li><strong>System Data:</strong> Authentication tokens (JWT), encrypted passwords (bcrypt), and access logs for security monitoring.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-bold text-2xl mb-4 text-on-surface">3. AI Analysis & Medical Reports</h2>
            <p className="text-on-surface-variant mb-3">
              CareSync utilizes Artificial Intelligence to analyze uploaded medical reports. By uploading a report, you consent to our automated systems scanning the document to generate summaries, identify abnormalities, and recommend specializations. 
            </p>
            <div className="p-4 bg-primary-container/30 border-l-4 border-primary rounded-r-lg text-sm text-on-surface">
              <strong>Strict Confidentiality:</strong> AI processing is conducted securely. We do not use your personal medical data to publicly train external language models. Your health data remains within your private clinical dashboard.
            </div>
          </section>

          <section>
            <h2 className="font-headline font-bold text-2xl mb-4 text-on-surface">4. Strict Data Deletion Policy</h2>
            <p className="text-on-surface-variant">
              We uphold the highest standard of data minimalism. If a medical professional applies to join the CareSync network and their application is <strong>rejected</strong> by our administration team, all submitted personal data, credentials, and files are permanently and irreversibly deleted from our databases. We do not retain rejected applicant data.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-2xl mb-4 text-on-surface">5. Data Security</h2>
            <p className="text-on-surface-variant">
              We implement a variety of security measures to maintain the safety of your personal information, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-on-surface-variant">
              <li>Secure Socket Layer (SSL) encryption for data in transit.</li>
              <li>Bcrypt hashing algorithms for all user passwords.</li>
              <li>Microservice architecture ensuring strict access controls.</li>
              <li>Role-based Access Control (RBAC) preventing unauthorized viewing of medical records.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-bold text-2xl mb-4 text-on-surface">6. Contact Us</h2>
            <p className="text-on-surface-variant">
              If there are any questions regarding this privacy policy or if you wish to exercise your right to have your data completely erased from our system, you may contact our Data Protection Officer at:
            </p>
            <p className="font-bold mt-2 text-primary">privacy@caresync.lk</p>
          </section>

        </article>
      </main>

      <footer className="py-8 text-center text-on-surface-variant text-sm border-t border-outline-variant/30 mt-12">
        <p>&copy; {new Date().getFullYear()} CareSync. Quality Care by Design.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;