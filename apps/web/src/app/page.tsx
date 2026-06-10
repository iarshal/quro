'use client';

import Link from 'next/link';
import { Shield, Video, Zap, ArrowRight, CheckCircle2, Globe, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MouseGlow } from '../components/MouseGlow';

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface overflow-x-hidden selection:bg-primary/20 min-h-screen">
      <MouseGlow />
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.04),0_10px_50px_rgba(0,88,190,0.06)]">
        <nav className="flex justify-between items-center w-full px-6 md:px-12 py-6 max-w-screen-2xl mx-auto">
          <div className="text-[1.75rem] font-bold tracking-tighter text-primary">Quro</div>
          <div className="hidden md:flex items-center gap-10">
            <Link className="font-body text-[1rem] tracking-tight text-on-surface-variant/80 hover:text-primary transition-all duration-300" href="#">Features</Link>
            <Link className="font-body text-[1rem] tracking-tight text-on-surface-variant/80 hover:text-primary transition-all duration-300" href="#">Privacy</Link>
            <Link className="font-body text-[1rem] tracking-tight text-on-surface-variant/80 hover:text-primary transition-all duration-300" href="#">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <button className="px-6 py-2.5 bg-primary text-on-primary font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 cursor-pointer">
                Get Started
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative pt-32 ethereal-gradient min-h-screen">
        {/* Hero Section */}
        <section className="relative px-6 md:px-12 pt-20 pb-32 max-w-screen-2xl mx-auto flex flex-col items-center text-center">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
          
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-8 rounded-full bg-primary/5 text-primary text-[0.6875rem] font-bold uppercase tracking-[0.2em]"
          >
            The Digital Mirage
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[3.5rem] md:text-[5rem] font-bold tracking-tighter leading-[1.1] text-on-surface max-w-4xl mb-8"
          >
            Ethereal Connectivity
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[1.125rem] text-on-surface-variant max-w-2xl mb-12 leading-relaxed"
          >
            Experience a communication interface projected into your space. Zero-cloud, local-first, and private by design. Your data never leaves the glass.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-6 items-center"
          >
            <Link href="/auth">
              <button className="group relative px-10 py-5 bg-primary text-on-primary font-bold rounded-xl overflow-hidden shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight size={18} />
                </span>
              </button>
            </Link>
          </motion.div>

          {/* Hero Image / Visual Element */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-24 w-full max-w-5xl mx-auto relative group"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-3xl rounded-[2rem] opacity-50"></div>
            <div className="relative glass-card rounded-[2rem] p-4 border border-white/50 shadow-2xl overflow-hidden aspect-[16/9]">
              <img 
                className="w-full h-full object-cover rounded-[1.5rem]" 
                alt="A sophisticated abstract 3D landscape" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD45HLk7r9TuJel9tga3Dxhoyul1ijMC-jKVNDeV4BK6MOra9vZmiom7yPuHx-CKf1XF19KvQq3gvIVEr57q3XmvRJK8EcanlpKY0bqrLagYwPHBfUsbXDoEBMGZwK_DLjABBlFpptx-PTsD121sM_tvj0lM-n4jRWXTmkp_OlAMpYEBPN2HLOTqrioO-2qrgD3GBfhFLW8N2vFTJTdUD9lMwrtMjZfiqJvXtyGDMwGskaTOcCUaiU9KsrhSyvvu0dje2KbNNOC3eeZ"
              />
              
              {/* Floating UI Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 flex items-center justify-center">
                <div className="glass-card p-8 rounded-[1.5rem] shadow-2xl border border-white/60 flex flex-col gap-4 animate-float">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="text-primary" size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-[1rem] font-semibold text-on-surface">Private Communcations</div>
                      <div className="text-[0.75rem] text-on-surface-variant">Verified High-Fidelity Calls</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="px-6 md:px-12 py-32 max-w-screen-2xl mx-auto bg-surface-container-low/50 rounded-t-[3rem]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Column 1: Zero-Friction */}
            <div className="group flex flex-col items-start p-10 rounded-[1.4rem] bg-surface-container-lowest transition-all hover:translate-y-[-8px] hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-transparent hover:border-white/60">
              <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <Zap size={28} />
              </div>
              <h3 className="text-[1.75rem] font-semibold tracking-tight text-on-surface mb-4">Zero-Friction Web Chat</h3>
              <p className="text-[1rem] text-on-surface-variant leading-relaxed">
                Instant connection without account silos. Quro leverages peer-to-peer protocols to ensure speed that feels like thought.
              </p>
              <div className="mt-8 pt-8 border-t border-surface-variant w-full">
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">Optimized for Latency</span>
              </div>
            </div>

            {/* Column 2: Universal Video */}
            <div className="group flex flex-col items-start p-10 rounded-[1.4rem] bg-surface-container-lowest transition-all hover:translate-y-[-8px] hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-transparent hover:border-white/60">
              <div className="w-14 h-14 rounded-xl bg-secondary/5 flex items-center justify-center mb-8 group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <Video size={28} />
              </div>
              <h3 className="text-[1.75rem] font-semibold tracking-tight text-on-surface mb-4">Universal Video Calls</h3>
              <p className="text-[1rem] text-on-surface-variant leading-relaxed">
                Borderless communication rendered with spatial precision. Experience high-fidelity audio and 4K visuals through a minimal lens.
              </p>
              <div className="mt-8 pt-8 border-t border-surface-variant w-full">
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-secondary">Spatial Computing Ready</span>
              </div>
            </div>

            {/* Column 3: Privacy First */}
            <div className="group flex flex-col items-start p-10 rounded-[1.4rem] bg-surface-container-lowest transition-all hover:translate-y-[-8px] hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-transparent hover:border-white/60">
              <div className="w-14 h-14 rounded-xl bg-tertiary/5 flex items-center justify-center mb-8 group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                <Shield size={28} />
              </div>
              <h3 className="text-[1.75rem] font-semibold tracking-tight text-on-surface mb-4">Privacy First</h3>
              <p className="text-[1rem] text-on-surface-variant leading-relaxed">
                Zero-knowledge encryption is not an option—it’s the foundation. Your keys never leave your machine, ensuring total data sovereignty.
              </p>
              <div className="mt-8 pt-8 border-t border-surface-variant w-full">
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-tertiary">Zero-Cloud Integrity</span>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Asymmetric Section */}
        <section className="px-6 md:px-12 py-40 max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center gap-24">
          <div className="flex-1 relative order-2 md:order-1">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]"></div>
            <img 
              className="w-full rounded-[2rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 relative z-10" 
              alt="Macro close-up" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCr7SxzxwKqSW8RxkKhfZkSqi-BzKOIzYVCah2QQBpxPzy8-lAT8uwOtQ2MX9Hur19aqILPYaofknYst5HjcNFDintOcd7k1i7vQ6pTiiM1LyagyRocPf4YyXMqBqtThSxP4NZC3et16co2OOKgJl9BKat87WUZRBqC2cizj1mhHPD62SxzyaQLoxjHYPhDgnH6YBPSa3gb2AF0_GBd4WDJ1I-e3JYHC2yCW04roEUHbgTGgiuFNx8VVteS3Fn5WzW-KTHjHY2C6OF"
            />
          </div>
          <div className="flex-1 order-1 md:order-2">
            <h2 className="text-[2.5rem] font-bold text-on-surface mb-6 leading-tight">Designed for modern creators.</h2>
            <p className="text-[1.125rem] text-on-surface-variant mb-10 leading-relaxed">
              We believe privacy shouldn't be a trade-off for performance. Quro bridges the gap between secure communication and incredible speed. Everything just works, instantly.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-primary mt-1" size={24} />
                <div>
                  <p className="font-semibold text-on-surface text-[1.125rem]">Zero Friction Access</p>
                  <p className="text-[0.9375rem] text-on-surface-variant">No bulky downloads required for your guests.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-primary mt-1" size={24} />
                <div>
                  <p className="font-semibold text-on-surface text-[1.125rem]">Real-time Sync</p>
                  <p className="text-[0.9375rem] text-on-surface-variant">WebSockets power lightning fast text and video delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Canvas */}
        <section className="px-6 md:px-12 py-32">
          <div className="max-w-screen-xl mx-auto rounded-[3rem] bg-primary relative overflow-hidden px-6 md:px-12 py-24 text-center">
            {/* Mesh Gradient Pattern */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,transparent_100%)]"></div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-[3rem] font-bold text-on-primary tracking-tighter mb-8">Ready for a private future?</h2>
              <p className="text-on-primary/80 text-[1.125rem] max-w-xl mb-12">
                Join 50,000+ early adopters who have secured their digital sovereignty. Your link is waiting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <button className="px-6 md:px-12 py-5 bg-white text-primary font-bold rounded-xl shadow-xl hover:scale-105 transition-transform cursor-pointer">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 py-10 max-w-screen-2xl mx-auto gap-6 border-t border-surface-container">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-[1.25rem] font-black text-on-surface uppercase tracking-widest">Quro</div>
            <div className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70">© 2026 Quro. Zero-Cloud Local-First.</div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <Link className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Terms of Service</Link>
            <Link className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Privacy Policy</Link>
            <Link className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Security Audit</Link>
            <Link className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Contact</Link>
          </div>
          
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant opacity-80 hover:opacity-100 transition-all cursor-pointer">
              <Globe size={20} />
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-on-surface-variant opacity-80 hover:opacity-100 transition-all cursor-pointer">
              <Share2 size={20} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
