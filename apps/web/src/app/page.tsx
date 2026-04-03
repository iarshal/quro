// @ts-nocheck

/**
 * Quro Landing Page — Corporate Enterprise Aesthetic (English)
 * Inspired by NetEase YiDun / Tencent Cloud Enterprise aesthetics
 */

import QRCode from 'qrcode';

export default async function LandingPage() {
  const qrSrc = await QRCode.toDataURL('quro://session/demo-session', {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 220,
    color: { dark: '#111111', light: '#FFFFFF' },
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .nav-link { transition: color 0.2s; color: #4B5563; text-decoration: none; font-size: 15px; font-weight: 500; }
        .nav-link:hover { color: #2563EB; }
        .product-card { transition: all 0.3s ease; border: 1px solid #E5E7EB; background: #fff; border-radius: 12px; padding: 32px 24px; }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(37,99,235,0.08); border-color: #BFDBFE; }
        .animate-slide-left { animation: slideInLeft 0.8s ease-out forwards; }
        .animate-pop-in { animation: popIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; }
      `}</style>

      {/* ═══════════════════════ NAV ═══════════════════════ */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px', position: 'relative', zIndex: 10,
        backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Quro Shield</span>
            <span style={{ fontSize: 13, color: '#6B7280', borderLeft: '1px solid #E5E7EB', paddingLeft: 12, marginLeft: 2 }}>
              EN ∨
            </span>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link" style={{ color: '#2563EB', position: 'relative' }}>
              Products
              <div style={{ position: 'absolute', bottom: -20, left: '10%', width: '80%', height: 3, backgroundColor: '#2563EB', borderRadius: '3px 3px 0 0' }} />
            </a>
            <a href="#" className="nav-link">Solutions</a>
            <a href="#" className="nav-link">Live Demo</a>
            <a href="#" className="nav-link">Pricing</a>
            <a href="#" className="nav-link">Help Center</a>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <a href="/m/welcome" style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', padding: '6px 16px', border: '1px solid #D1D5DB', borderRadius: 20, textDecoration: 'none' }}>
            Account
          </a>
          <a href="/m/agreement?mode=login" style={{ fontSize: 14, fontWeight: 500, color: '#fff', backgroundColor: '#B91C1C', padding: '7px 20px', borderRadius: 20, textDecoration: 'none', boxShadow: '0 4px 12px rgba(185,28,28,0.2)' }}>
            Face Log In
          </a>
        </div>
      </nav>

      {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
      <div style={{
        backgroundColor: '#F0F5FF',
        backgroundImage: 'radial-gradient(circle at 100% 50%, #E0E7FF 0%, #F5F8FF 50%, transparent 100%), linear-gradient(0deg, #FFFFFF 0%, #F0F5FF 100%)',
        padding: '80px 80px 0',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {/* Abstract grid background */}
        <div style={{
          position: 'absolute', inset: 0, 
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', width: '100%', maxWidth: 1200, position: 'relative', zIndex: 10 }}>
          {/* Left text */}
          <div className="animate-slide-left" style={{ flex: 1, paddingTop: 40 }}>
            <h1 style={{ fontSize: 56, fontWeight: 900, color: '#1E293B', marginBottom: 16 }}>
              Real-Name Authentication
            </h1>
            <p style={{ fontSize: 18, color: '#475569', marginBottom: 20, maxWidth: 480, lineHeight: 1.6 }}>
              Verify identity authenticity instantly with secure on-device face validation and localized liveness checks.
            </p>
            
            <div style={{ 
              display: 'inline-block', padding: '6px 14px', backgroundColor: '#FECACA', 
              color: '#B91C1C', borderRadius: 6, fontSize: 13, fontWeight: 600, marginBottom: 32
            }}>
              [NEW] Upgraded for Quro Zero-Cloud Architecture
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <a href="/m/agreement?mode=register" style={{
                backgroundColor: '#B91C1C', color: '#fff', fontSize: 16, fontWeight: 600,
                padding: '12px 36px', borderRadius: 30, textDecoration: 'none', boxShadow: '0 8px 20px rgba(185,28,28,0.25)',
                display: 'inline-block'
              }}>
                New Registration
              </a>
              <a href="/m/agreement?mode=login" style={{
                backgroundColor: '#fff', color: '#B91C1C', border: '1px solid #B91C1C', fontSize: 16, fontWeight: 600,
                padding: '12px 36px', borderRadius: 30, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Face Log In
              </a>
            </div>
          </div>

          {/* Right illustration / graphic */}
          <div 
            className="animate-pop-in"
            style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'flex-end' }}
          >
            <div style={{ position: 'relative', width: 440, height: 440, animation: 'float 6s ease-in-out infinite' }}>
              {/* Glassmorphism Shield/Person graphic mimicking the reference */}
              <div style={{ position: 'absolute', top: 40, right: 40, width: 280, height: 280, borderRadius: '50%', background: 'linear-gradient(135deg, #60A5FA, #2563EB)', boxShadow: '0 20px 40px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)' }} />
              </div>
              <div style={{ position: 'absolute', top: 100, right: 140, width: 200, height: 200, borderRadius: '20px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>

              {/* Login QR block floated left */}
              <div style={{ position: 'absolute', bottom: 40, left: 0, background: '#fff', padding: 20, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={qrSrc} alt="Login QR" width={160} height={160} style={{ borderRadius: 8, mixBlendMode: 'multiply' }} />
                <div style={{ marginTop: 12, fontSize: 13, color: '#4B5563', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                  Scan to Log In
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ SUB NAV ═══════════════════════ */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 60, padding: '20px 0' }}>
          <div style={{ color: '#B91C1C', fontSize: 16, fontWeight: 600, position: 'relative' }}>
            Features
            <div style={{ position: 'absolute', bottom: -20, left: '20%', width: '60%', height: 3, backgroundColor: '#B91C1C' }} />
          </div>
          <div style={{ color: '#4B5563', fontSize: 16, fontWeight: 500 }}>Use Cases</div>
          <div style={{ color: '#4B5563', fontSize: 16, fontWeight: 500 }}>Integration</div>
          <div style={{ color: '#4B5563', fontSize: 16, fontWeight: 500 }}>Customers</div>
          <div style={{ color: '#4B5563', fontSize: 16, fontWeight: 500 }}>Documentation</div>
        </div>
      </div>

      {/* ═══════════════════════ PRODUCT INTRODUCTION ═══════════════════════ */}
      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 48 }}>
          Platform Features
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {/* Card 1 */}
          <div className="product-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>Real-Name Certification</h3>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>Core biometric facial modeling captures real-world identity instantly for seamless, passwordless login access.</p>
          </div>

          {/* Card 2 */}
          <div className="product-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>Local Storage Architecture</h3>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>Reject cloud uploads. All facial biometric data, chat logs, and friend lists are encrypted strictly offline via IndexedDB.</p>
          </div>

          {/* Card 3 */}
          <div className="product-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>E2E Secure Communication</h3>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>Utilizing a unique Quro Code for decentralized routing, ensuring a tamper-proof and zero-hijack encrypted chat ecosystem.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer style={{ backgroundColor: '#111', color: '#666', padding: '40px 0', textAlign: 'center', fontSize: 13 }}>
        <p style={{ marginBottom: 8 }}>&copy; {new Date().getFullYear()} Quro Shield · Securing Digital Identity Authenticity</p>
        <p>Value-Added Telecom License: B2-20260401   |   Cloud Security Authority No. 33010000000001</p>
      </footer>
    </div>
  );
}
