import { Download, Share2, Plane } from 'lucide-react';
import { useVCard } from '../hooks/useVCard.js';
import LinkCard from '../components/LinkCard.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

// Sanitize field values for vCard format — strip chars that break vCard lines
const clean = (s = '') => String(s).replace(/[\r\n;]/g, ' ');

function downloadVcf(data) {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${clean(data.name)}`,
    `N;CHARSET=UTF-8:${clean(data.name)};;;;`,
    `TITLE;CHARSET=UTF-8:${clean(data.title)}`,
    `ORG;CHARSET=UTF-8:${clean(data.company)}`,
    `TEL;TYPE=WORK,VOICE:${clean(data.phone)}`,
    `EMAIL;TYPE=WORK:${clean(data.email)}`,
    `URL:${clean(data.website)}`,
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${clean(data.address)}`,
    `NOTE;CHARSET=UTF-8:${clean(data.locations)}`,
    'END:VCARD',
  ].join('\n');
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function shareProfile(data) {
  if (navigator.share) {
    try {
      await navigator.share({ title: `${data.name} — ${data.title}`, url: window.location.href });
    } catch {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
  }
}

export default function PublicCard() {
  const { data, loading, error } = useVCard();

  if (loading) return <LoadingScreen />;

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3"
           style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>تعذّر تحميل البيانات</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--gold)' }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}
         className="flex justify-center">
      <div className="w-full max-w-md relative"
           style={{ background: 'var(--bg-card)', minHeight: '100vh', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>

        {/* Radial glow top */}
        <div className="absolute top-0 left-0 w-full h-72 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />

        {/* Cover image */}
        <div className="relative h-52 overflow-hidden">
          <img src={data.cover_image} alt={`صورة غلاف ${data.name}`}
               className="w-full h-full object-cover"
               style={{ opacity: 0.5, mixBlendMode: 'luminosity' }} />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to bottom, transparent 20%, var(--bg-card) 100%)' }} />
          {/* Watermark */}
          <div className="absolute top-5 right-5 flex items-center gap-2" style={{ opacity: 0.25 }}>
            <Plane size={28} style={{ color: 'var(--gold)', transform: 'rotate(45deg)' }} />
            <span style={{ color: 'var(--gold)', fontFamily: 'serif', fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>7</span>
          </div>
        </div>

        {/* Profile section */}
        <div className="px-6 -mt-20 relative z-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full overflow-hidden mb-5 animate-fade-in"
               style={{
                 border: '4px solid var(--bg-card)',
                 boxShadow: '0 0 0 2px var(--gold), 0 8px 32px rgba(212,175,55,0.25)'
               }}>
            <img src={data.profile_image} alt={data.name} className="w-full h-full object-cover" />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold mb-1 animate-fade-up animate-delay-1"
              style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
            {data.name}
          </h1>

          {/* Title */}
          <p className="text-xs font-semibold tracking-widest uppercase mb-3 animate-fade-up animate-delay-2 gold-shimmer">
            {data.title}
          </p>

          {/* Company */}
          <p className="text-sm mb-6 animate-fade-up animate-delay-3"
             style={{ color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.6 }}>
            {data.company}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 w-full mb-8 animate-fade-up animate-delay-4">
            <button
              onClick={() => downloadVcf(data)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--gold) 0%, #b38f21 100%)',
                color: '#000',
                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                fontFamily: 'Tajawal, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <Download size={18} />
              حفظ جهة الاتصال
            </button>
            <button
              onClick={() => shareProfile(data)}
              aria-label="مشاركة الملف الشخصي"
              className="flex items-center justify-center p-3 rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--gold)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 mb-6 animate-fade-up animate-delay-4"
             style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />

        {/* Links */}
        <div className="px-6 space-y-3 pb-10">
          {data.links.map((link, i) => (
            <LinkCard key={link.id} link={link} index={i} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-10 text-center" dir="rtl">
          <div className="mb-3 flex justify-center">
            <Plane size={20} style={{ color: 'var(--border)', transform: 'rotate(45deg)' }} />
          </div>
          <p className="text-xs tracking-widest uppercase mb-2"
             style={{ color: '#444', fontFamily: 'Inter, sans-serif' }}>
            {data.locations}
          </p>
          <p className="text-xs leading-relaxed mx-auto max-w-xs"
             style={{ color: '#333' }}>
            {data.address}
          </p>
        </div>
      </div>
    </div>
  );
}
