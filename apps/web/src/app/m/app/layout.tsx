import { MobileTabBar } from '../../../components/MobileTabBar';

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
        backgroundColor: '#EDEDED',
      }}
    >
      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0))',
        }}
      >
        {children}
      </div>

      {/* Tab Bar */}
      <MobileTabBar />
    </div>
  );
}
