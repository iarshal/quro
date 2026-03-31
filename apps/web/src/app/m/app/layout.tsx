import { MobileTabBar } from '@/components/MobileTabBar';

export default function MobileAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS Safari
          paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0))', // Space for tab bar
        }}
      >
        {children}
      </div>

      {/* Tab Bar */}
      <MobileTabBar />
    </div>
  );
}
