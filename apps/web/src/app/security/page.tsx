export default function WebSecurityCenterPage() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <h2
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.8px',
          marginBottom: 'var(--space-2)',
        }}
      >
        Security Center
      </h2>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-8)',
        }}
      >
        Manage your active sessions and view scan history.
      </p>

      <div
        style={{
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-brand-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            💻
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Current Desktop Session
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success)', marginTop: 4 }}>
              Active and Secure
            </div>
          </div>
          <button
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: '#FFF0EE',
              color: 'var(--color-error)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}
