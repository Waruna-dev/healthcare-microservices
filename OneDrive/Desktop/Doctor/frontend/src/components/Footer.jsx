// src/components/Footer.jsx
import React from 'react';
import { ShieldCheck, Fingerprint, Activity } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-outline-variant/30 bg-surface-container-lowest pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <span className="text-3xl font-black text-primary font-headline block mb-4">CareSync</span>
            <p className="text-on-surface-variant max-w-sm leading-relaxed font-medium">
              The Digital Sanctuary for Modern Care. Empowering the global healthcare community with secure, intelligent technology.
            </p>
          </div>
          <div>
            <h5 className="font-bold font-headline mb-6 text-sm uppercase tracking-widest text-on-surface">Platform</h5>
            <ul className="space-y-4 text-on-surface-variant text-sm font-medium">
              <li><a className="hover:text-primary transition-colors" href="/features">Features</a></li>
              <li><a className="hover:text-primary transition-colors" href="/security">Security</a></li>
              <li><a className="hover:text-primary transition-colors" href="/integration">Integration</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold font-headline mb-6 text-sm uppercase tracking-widest text-on-surface">Company</h5>
            <ul className="space-y-4 text-on-surface-variant text-sm font-medium">
              <li><a className="hover:text-primary transition-colors" href="/about">About Us</a></li>
              <li><a className="hover:text-primary transition-colors" href="/support">Contact Support</a></li>
              <li><a className="hover:text-primary transition-colors" href="/privacy-policy">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline-variant/30 pt-8">
          <p className="text-xs text-on-surface-variant font-medium tracking-wide">
            © 2026 CareSync. All rights reserved.
          </p>
          <div className="flex gap-5 text-primary">
            <Activity className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
            <ShieldCheck className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
            <Fingerprint className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;