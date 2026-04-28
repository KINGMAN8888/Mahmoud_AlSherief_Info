export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14,
      }}
    >
      <div
        className="spin-gold"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--gold)',
          borderRightColor: 'var(--gold)',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 9, fontWeight: 800,
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
          margin: 0,
        }}
      >
        LOADING
      </p>
    </div>
  );
}
