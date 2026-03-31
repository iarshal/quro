export default function EmptyChatSelectionPage() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        gap: 'var(--space-4)',
      }}
    >
      <div style={{ fontSize: '48px' }}>💬</div>
      <h2
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'var(--text-xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.5px',
        }}
      >
        Select a conversation
      </h2>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          maxWidth: '300px',
          lineHeight: 1.5,
        }}
      >
        Choose a friend from the sidebar or scan a new QR code via the mobile app to start an encrypted chat.
      </p>
    </div>
  );
}
