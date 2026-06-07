'use client';

import { useRouter } from 'next/navigation';

const items = [
  { title: 'Edit Profile', subtitle: 'Name, bio, photo, gender badge', href: '/m/app/profile/edit' },
  { title: 'Security Center', subtitle: 'Account deletion, access logs, and biometric protection', href: '/m/app/security' },
  { title: 'My QR Card', subtitle: 'Open your profile card and personal QR from Me', href: '/m/app/profile' },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F6F7FB', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', backgroundColor: '#fff', borderBottom: '1px solid #EEF0F4', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#111' }}>Settings</h1>
        <div style={{ width: 36 }} />
      </header>

      <div style={{ padding: 20, display: 'grid', gap: 14 }}>
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{ border: '1px solid #E8EAF0', backgroundColor: '#fff', borderRadius: 20, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{item.subtitle}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
