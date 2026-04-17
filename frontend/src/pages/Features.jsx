
const Features = () => {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      <br />
      <br />
      <main className="flex-1 max-w-7xl mx-auto w-full py-16 px-6">
        <header className="text-center mb-16">
          <h1 className="font-headline font-black text-4xl md:text-5xl text-primary mb-4">Platform Features</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            Everything you need to manage patient outcomes and clinical workflows in one unified digital ecosystem.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-4xl text-primary mb-4 block">smart_toy</span>
            <h3 className="font-headline font-bold text-2xl mb-3">AI Medical Analysis</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Upload complex clinical reports and let our AI engine instantly generate summaries, flag critical abnormalities, and recommend the correct medical specialization for faster triage.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">dashboard</span>
            <h3 className="font-headline font-bold text-2xl mb-3">Role-Based Dashboards</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Dedicated, customized interfaces for Patients, Doctors, and Administrators. Each portal is optimized to show exactly the data needed without clutter.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-4xl text-tertiary mb-4 block">fact_check</span>
            <h3 className="font-headline font-bold text-2xl mb-3">Strict Verification System</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Every medical professional on CareSync passes through a rigorous admin approval pipeline, ensuring patients only interact with verified, licensed specialists.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-4xl text-error mb-4 block">mark_email_read</span>
            <h3 className="font-headline font-bold text-2xl mb-3">Automated Communications</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Real-time email notifications for account approvals, password resets, and appointment updates keep the entire network synchronized seamlessly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Features;