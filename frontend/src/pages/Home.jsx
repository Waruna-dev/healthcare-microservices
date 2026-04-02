// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Stethoscope, Fingerprint, Sparkles } from 'lucide-react';

// Import our new separated components!
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  // Framer Motion Animation Variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
  };

  return (
    <div className="mesh-bg min-h-screen text-on-surface overflow-hidden flex flex-col">
      
      {/* 1. Header Component */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="pt-32 pb-20 flex-grow">
        
        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-12 gap-16 items-center min-h-[80vh]">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="lg:col-span-7 space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container text-secondary text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Platform is Live
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-6xl md:text-7xl lg:text-8xl font-black font-headline leading-[1.05] tracking-tighter text-on-surface">
              Healthcare <br/>
              <span className="text-primary relative inline-block">
                Reimagined.
                <motion.span 
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute bottom-2 left-0 w-full h-4 bg-primary/20 -z-10 rounded-full blur-sm origin-left"
                />
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl text-on-surface-variant max-w-xl leading-relaxed font-light">
              Step into the digital sanctuary. We empower your health journey through absolute clinical precision, intuitive design, and military-grade privacy.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-wrap gap-5 pt-4">
              <Link to="/register" className="group flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-lg shadow-elevated hover:-translate-y-1 transition-all duration-300">
                Create Account
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="flex items-center gap-3 glass-card px-8 py-4 rounded-full text-on-surface font-bold text-lg hover:bg-surface-bright transition-all duration-300">
                Patient Login
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Floating Visuals */}
          <div className="lg:col-span-5 relative hidden md:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 bg-surface-container-lowest/80 backdrop-blur-24 rounded-[2.5rem] p-8 shadow-elevated border border-outline-variant/50"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-headline font-bold text-xl">Vitals Overview</h3>
                  <p className="text-sm text-on-surface-variant">Live Biometric Sync</p>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary"
                >
                  <Activity size={24} />
                </motion.div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Heart Rate", val: "72 bpm", color: "bg-secondary-container text-secondary" },
                  { label: "Blood Pressure", val: "118/76", color: "bg-primary-fixed text-primary" },
                  { label: "O2 Saturation", val: "99%", color: "bg-surface-container-low text-on-surface-variant" }
                ].map((item, idx) => (
                  <motion.div key={idx} whileHover={{ scale: 1.02, x: 5 }} className="flex justify-between items-center p-4 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer">
                    <span className="font-medium text-on-surface-variant">{item.label}</span>
                    <span className={`px-4 py-1.5 rounded-full font-bold text-sm ${item.color}`}>{item.val}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 z-20 glass-card p-6 rounded-3xl shadow-elevated"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary"></span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Status</p>
                  <p className="font-headline font-bold text-on-surface">Optimal Health</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section id="clinical" className="max-w-7xl mx-auto px-6 md:px-8 py-32 mt-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter mb-6">
              The Anatomy of <span className="text-primary italic">Better Care</span>
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              We stripped away the noise of traditional healthcare portals to create an experience focused purely on clarity, security, and actionable insights.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Stethoscope size={32} />, title: "Unified Records", desc: "Your entire medical history, prescriptions, and lab results consolidated into a single, beautiful sanctuary.", bg: "bg-surface-container-lowest", text: "text-on-surface", iconBg: "bg-primary", iconText: "text-on-primary" },
              { icon: <Sparkles size={32} />, title: "Smart Diagnostics", desc: "Advanced algorithms analyze your uploaded medical reports, providing proactive health alerts before they become critical.", bg: "bg-primary text-on-primary", text: "text-white/80", iconBg: "bg-white/20", iconText: "text-white" },
              { icon: <Fingerprint size={32} />, title: "Zero-Trust Privacy", desc: "Military-grade end-to-end encryption ensures your most sensitive information remains exclusively yours.", bg: "bg-surface-container-lowest", text: "text-on-surface-variant", iconBg: "bg-on-surface", iconText: "text-surface" }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeUp} whileHover={{ y: -10 }} className={`${feature.bg} p-10 rounded-[2rem] shadow-ambient border border-outline-variant/30 relative overflow-hidden group`}>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-current opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <div className={`w-16 h-16 rounded-2xl ${feature.iconBg} ${feature.iconText} flex items-center justify-center mb-8 shadow-elevated`}>{feature.icon}</div>
                <h3 className="text-2xl font-bold font-headline mb-4">{feature.title}</h3>
                <p className={`${feature.text} leading-relaxed font-medium`}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>

      {/* 3. Footer Component */}
      <Footer />
      
    </div>
  );
};

export default Home;