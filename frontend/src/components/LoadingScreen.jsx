export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-transparent"
           style={{
             borderTopColor: 'var(--gold)',
             borderRightColor: 'var(--gold)',
             animation: 'spinGold 0.8s linear infinite'
           }} />
      <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
    </div>
  );
}
