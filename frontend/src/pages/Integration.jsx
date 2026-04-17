const Integration = () => {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
      <br />
      <br />

      <main className="flex-1 max-w-5xl mx-auto w-full py-16 px-6">
        <header className="text-center mb-16">
          <h1 className="font-headline font-black text-4xl md:text-5xl text-primary mb-4">System Architecture</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            CareSync is built on a highly scalable, distributed microservices architecture designed for reliability and speed.
          </p>
        </header>

        <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] border border-outline-variant/30 shadow-sm relative overflow-hidden">
          {/* Centered background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Flex column centering the content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
            
            <div className="mb-12">
              <h3 className="font-bold text-xl mb-4 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-primary">hub</span> 
                API Gateway Hub
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                All client requests are securely routed through a central Node.js API Gateway, which handles proxying, CORS management, and traffic distribution to dedicated domain services.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center justify-center gap-2">
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