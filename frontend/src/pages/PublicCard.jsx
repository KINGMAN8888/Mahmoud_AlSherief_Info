import { useState, useCallback, useEffect } from 'react';
import {
  Download, Share2, Phone, Mail, Globe, MapPin,
  Sun, Moon, Navigation, ChevronRight,
} from 'lucide-react';
import { useVCard } from '../hooks/useVCard.js';
import LinkCard from '../components/LinkCard.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

/* ── vCard download ───────────────────────────────────────── */
const clean = (s = '') => String(s).replace(/[\r\n;]/g, ' ');

function downloadVcf(data) {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
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
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${data.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function shareProfile(data) {
  if (navigator.share) {
    try { await navigator.share({ title: `${data.name} — ${data.title}`, url: window.location.href }); }
    catch { /* cancelled */ }
  } else {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* silent */ }
  }
}

/* ── Translations ─────────────────────────────────────────── */
const T = {
  ar: {
    save: 'حفظ جهة الاتصال', share: 'مشاركة',
    contact: 'معلومات الاتصال', connect: 'وسائل التواصل',
    locations: 'الفروع والمواقع',
    phone_label: 'الهاتف', email_label: 'البريد الإلكتروني', web_label: 'الموقع',
    ceo_tag: 'رئيس تنفيذي', verified_tag: 'موثّق',
    error: 'تعذّر تحميل البيانات', retry: 'إعادة المحاولة',
    digital: 'البطاقة الرقمية',
  },
  en: {
    save: 'Save Contact', share: 'Share',
    contact: 'Contact Info', connect: 'Connect',
    locations: 'Offices & Branches',
    phone_label: 'Phone', email_label: 'Email', web_label: 'Website',
    ceo_tag: 'CEO', verified_tag: 'Verified',
    error: 'Failed to load profile', retry: 'Retry',
    digital: 'Digital Business Card',
  },
};

/* ══════════════════════════════════════════════════════════════
   ISLAMIC ORNAMENT — inline SVG divider between sections
══════════════════════════════════════════════════════════════ */
function IslamicOrnament() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 18px', opacity: 0.75 }}>
      <svg width="180" height="18" viewBox="0 0 180 18" fill="none" aria-hidden="true">
        {/* Left dashed line */}
        <line x1="0" y1="9" x2="70" y2="9"
          stroke="var(--border-gold)" strokeWidth="0.6" strokeDasharray="3 3" />
        {/* Left small diamond */}
        <path d="M74,6 L77,9 L74,12 L71,9 Z"
          fill="var(--gold)" opacity="0.45" />
        {/* Central 8-star */}
        <path d="M90,3.5 L91.8,7.2 L95.5,6 L93.5,9.5 L97,11.5 L93.2,11.5 L92,15.5 L90,12 L88,15.5 L86.8,11.5 L83,11.5 L86.5,9.5 L84.5,6 L88.2,7.2 Z"
          fill="none" stroke="var(--gold)" strokeWidth="0.8" />
        <circle cx="90" cy="9" r="1.8" fill="var(--gold)" opacity="0.9" />
        {/* Right small diamond */}
        <path d="M106,6 L109,9 L106,12 L103,9 Z"
          fill="var(--gold)" opacity="0.45" />
        {/* Right dashed line */}
        <line x1="110" y1="9" x2="180" y2="9"
          stroke="var(--border-gold)" strokeWidth="0.6" strokeDasharray="3 3" />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROFILE HERO CARD — neumorphic + Islamic inner pattern
══════════════════════════════════════════════════════════════ */
function ProfileHeroCard({ data, onDownload, onShare, lang }) {
  const t = T[lang];

  return (
    <div
      className="profile-hero-card animate-fade-up d2"
      style={{ margin: '0 18px', padding: '30px 24px 26px', overflow: 'hidden' }}
    >
      {/* ── Islamic star pattern overlay (inner card) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path fill='none' stroke='%23c9a227' stroke-opacity='.14' stroke-width='.6' d='M56,40 L46.1,42.5 L51.3,51.3 L42.5,46.1 L40,56 L37.5,46.1 L28.7,51.3 L33.9,42.5 L24,40 L33.9,37.5 L28.7,28.7 L37.5,33.9 L40,24 L42.5,33.9 L51.3,28.7 L46.1,37.5 Z'/></svg>")`,
          backgroundSize: '80px 80px',
          backgroundPosition: '0 0',
          animation: 'islamicDrift 55s linear infinite',
          opacity: 0.5,
        }}
      />

      {/* ── Gold radial glow at top-center ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(201,162,39,0.09) 0%, transparent 70%)',
        }}
      />

      {/* ── Status dot removed ── */}

      {/* ── Gold star badge removed ── */}

      {/* ── Avatar ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative' }}>
          {/* Outer glow ring — always visible, pulsing */}
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, var(--gold) 0%, transparent 30%, var(--gold-light) 60%, transparent 80%, var(--gold) 100%)',
              opacity: 0.4,
              animation: 'ornamentSpin 12s linear infinite',
            }}
          />
          <div
            className="neum-avatar-frame"
            style={{
              width: 116, height: 116, borderRadius: '50%',
              background: 'var(--neum-bg)',
              padding: 5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <img
              src={data.profile_image}
              alt={data.name}
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%', objectFit: 'cover', display: 'block',
              }}
            />
          </div>
          <div className="avatar-glow-ring" />
        </div>
      </div>

      {/* ── Name, title, company ── */}
      <div
        className="profile-info-block"
        style={{ textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 18 }}
      >
        <h2
          className="profile-name"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            margin: '0 0 7px', lineHeight: 1.15,
          }}
        >
          {data.name}
        </h2>

        <div
          className="gold-shimmer"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10, fontWeight: 800,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: 7,
          }}
        >
          {data.title}
        </div>

        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          {data.company}
        </p>
      </div>

      {/* ── Tags ── */}
      <div
        style={{
          display: 'flex', justifyContent: 'center', gap: 8,
          marginBottom: 24, position: 'relative', zIndex: 2,
        }}
      >
        <span
          className="profile-tag"
          style={{
            padding: '5px 16px', borderRadius: 99,
            background: 'linear-gradient(135deg, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.08) 100%)',
            border: '1px solid var(--border-gold)',
            fontFamily: 'var(--font-arabic)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--gold)',
            boxShadow: '0 2px 8px var(--gold-aura)',
          }}
        >
          {t.ceo_tag}
        </span>

        <span
          className="profile-tag neum-btn"
          style={{
            padding: '5px 16px', borderRadius: 99,
            background: 'var(--neum-bg)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-arabic)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
          }}
        >
          {t.verified_tag}
        </span>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 2 }}>
        <button
          onClick={onDownload}
          style={{
            flex: 1, height: 54, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--gold-light) 30%, var(--gold) 65%, #7a5800 100%)',
            color: '#000', border: 'none', cursor: 'pointer',
            fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'var(--font-ui)',
            fontSize: 13, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 24px rgba(201,162,39,0.35), 0 2px 6px rgba(0,0,0,0.3)',
            transition: 'filter 0.2s, transform 0.15s, box-shadow 0.2s',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,162,39,0.5), 0 2px 8px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(201,162,39,0.35), 0 2px 6px rgba(0,0,0,0.3)';
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'none')}
        >
          <Download size={15} strokeWidth={2.5} />
          {t.save}
        </button>

        <button
          onClick={onShare}
          aria-label={t.share}
          className="neum-btn"
          style={{
            width: 54, height: 54, borderRadius: 16, flexShrink: 0,
            background: 'var(--neum-bg)',
            border: '1px solid var(--border-gold)',
            color: 'var(--gold)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 16px var(--gold-glow)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
        >
          <Share2 size={17} strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Gold border ring on hover ── */}
      <div className="card-hover-ring" />
    </div>
  );
}

/* ── Section header ──────────────────────────────────────── */
function SectionHead({ num, label }) {
  return (
    <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      {/* Tiny 8-star ornament before number */}
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path
          d="M6,0.5 L7,3.5 L10,2 L8.5,5 L11.5,6 L8.5,7 L10,10 L7,8.5 L6,11.5 L5,8.5 L2,10 L3.5,7 L0.5,6 L3.5,5 L2,2 L5,3.5 Z"
          fill="var(--gold)" opacity="0.7"
        />
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)', opacity: 0.7, letterSpacing: '0.06em', flexShrink: 0 }}>
        {num}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--border-gold), var(--border))' }} />
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, var(--border-gold), var(--border))' }} />
    </div>
  );
}

/* ── Contact row ─────────────────────────────────────────── */
function ContactRow({ icon: Icon, label, value, href, mono }) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--neum-bg)', boxShadow: 'var(--neum-raised)',
        border: '1px solid var(--border-gold)',
        color: 'var(--gold)',
      }}>
        <Icon size={14} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
          fontSize: 13, fontWeight: mono ? 400 : 500,
          color: 'var(--text-primary)',
          direction: 'ltr', textAlign: 'left',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </div>
      </div>
      {href && <ChevronRight size={13} style={{ color: 'var(--gold)', opacity: 0.5, flexShrink: 0 }} />}
    </div>
  );
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>
    : inner;
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function PublicCard() {
  const { data, loading, error } = useVCard();

  const [theme, setTheme] = useState(() => localStorage.getItem('vcard-theme') || 'dark');
  const [lang,  setLang]  = useState(() => localStorage.getItem('vcard-lang')  || 'ar');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vcard-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vcard-theme', next);
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => setLang(l => {
    const next = l === 'ar' ? 'en' : 'ar';
    localStorage.setItem('vcard-lang', next);
    return next;
  }), []);

  const t   = T[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isDark = theme === 'dark';

  if (loading) return <LoadingScreen />;

  if (error || !data) {
    return (
      <div className="islamic-page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-arabic)' }}>{t.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="neum-btn"
          style={{ padding: '10px 28px', borderRadius: 12, background: 'var(--neum-bg)', border: '1px solid var(--border-gold)', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 700 }}
        >
          {t.retry}
        </button>
      </div>
    );
  }

  const locations = data.locations ? data.locations.split('-').map(l => l.trim()).filter(Boolean) : [];

  const coverGrad = isDark
    ? 'linear-gradient(to bottom, rgba(7,9,15,0.0) 0%, rgba(7,9,15,0.15) 45%, rgba(20,23,39,0.9) 78%, #141727 100%)'
    : 'linear-gradient(to bottom, rgba(240,236,226,0.0) 0%, rgba(240,236,226,0.1) 45%, rgba(236,232,222,0.88) 78%, #ece8de 100%)';

  return (
    <div dir={dir} className="theme-transition islamic-page-bg" style={{ minHeight: '100vh' }}>

      {/* ── Inner card column ── */}
      <div
        className="islamic-card-bg"
        style={{
          width: '100%', maxWidth: 430, margin: '0 auto',
          minHeight: '100vh', position: 'relative',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
        }}
      >

        {/* ══ HUD BAR ══ */}
        <div
          className="animate-hud"
          style={{
            position: 'sticky', top: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 14px', height: 48,
            background: 'var(--neum-bg-alpha)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--border-gold)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Gold top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
            opacity: 0.6,
          }} />

          <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Navigation size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 300, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              21°23′N · 39°51′E
            </span>
          </div>

          <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button
              onClick={toggleLang}
              className="neum-btn"
              style={{
                fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 800,
                letterSpacing: '0.14em', padding: '0 11px', height: 28, borderRadius: 7,
                background: 'var(--neum-bg)', border: '1px solid var(--border-gold)',
                color: 'var(--gold)', cursor: 'pointer',
              }}
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>

            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
              className="neum-btn"
              style={{
                width: 28, height: 28, borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--neum-bg)', border: '1px solid var(--border-gold)',
                color: 'var(--gold)', cursor: 'pointer',
              }}
            >
              {isDark ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>

        {/* ══ HERO COVER ══ */}
        <div className="animate-hero" style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
          <img
            src={data.cover_image} alt="" aria-hidden="true"
            className="hero-pan"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: isDark
                ? 'saturate(0.35) brightness(0.55) sepia(0.15)'
                : 'saturate(0.4) brightness(0.88)',
            }}
          />
          {/* Islamic star grid overlay on hero */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path fill='none' stroke='%23c9a227' stroke-opacity='.12' stroke-width='.5' d='M56,40 L46.1,42.5 L51.3,51.3 L42.5,46.1 L40,56 L37.5,46.1 L28.7,51.3 L33.9,42.5 L24,40 L33.9,37.5 L28.7,28.7 L37.5,33.9 L40,24 L42.5,33.9 L51.3,28.7 L46.1,37.5 Z'/></svg>")`,
              backgroundSize: '80px 80px',
            }}
          />
          {/* Bottom gradient fade */}
          <div style={{ position: 'absolute', inset: 0, background: coverGrad }} />
          {/* Top gold line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, var(--gold), transparent)', opacity: 0.8 }} />
          {/* Bottom gold line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, var(--border-gold), transparent)' }} />
        </div>

        {/* ══ PROFILE HERO CARD ══ */}
        <div className="card-levitate card-halo" style={{ marginTop: -44, position: 'relative', zIndex: 10, paddingBottom: 4 }}>
          <ProfileHeroCard
            data={data}
            onDownload={() => window.open('/api/vcard/download', '_blank')}
            onShare={() => shareProfile(data)}
            lang={lang}
          />
        </div>

        {/* Islamic ornament between hero card and sections */}
        <IslamicOrnament />

        {/* ══ 01 — CONTACT INFO ══ */}
        <section className="animate-fade-up d5" style={{ padding: '0 22px', marginBottom: 28 }}>
          <SectionHead num="01" label={t.contact} />
          <div style={{
            background: 'var(--neum-bg)',
            boxShadow: 'var(--neum-inset)',
            border: '1px solid var(--border-gold)',
            borderRadius: 18,
            padding: '0 16px',
          }}>
            <ContactRow icon={Phone} label={t.phone_label} value={data.display_phone} href={`tel:${data.phone}`} mono />
            <ContactRow icon={Mail}  label={t.email_label} value={data.email}         href={`mailto:${data.email}`} />
            <ContactRow icon={Globe} label={t.web_label}   value={data.website?.replace(/^https?:\/\//, '')} href={data.website} />
          </div>
        </section>

        <IslamicOrnament />

        {/* ══ 02 — CONNECT (links) ══ */}
        <section className="animate-fade-up d6" style={{ padding: '0 22px', marginBottom: 28 }}>
          <SectionHead num="02" label={t.connect} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {data.links.map((link, i) => (
              <LinkCard key={link.id} link={link} index={i} dir={dir} lang={lang} />
            ))}
          </div>
        </section>

        <IslamicOrnament />

        {/* ══ 03 — LOCATIONS ══ */}
        <section className="animate-fade-up d7" style={{ padding: '0 22px', marginBottom: 48 }}>
          <SectionHead num="03" label={t.locations} />

          {locations.length > 0 && (
            <div dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
              {locations.map(loc => (
                <span
                  key={loc}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 99,
                    background: 'var(--neum-bg)',
                    boxShadow: 'var(--neum-raised)',
                    border: '1px solid var(--border-gold)',
                    fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--gold)',
                  }}
                >
                  <MapPin size={8} strokeWidth={2.5} />
                  {loc}
                </span>
              ))}
            </div>
          )}

          <div style={{
            background: 'var(--neum-bg)',
            boxShadow: 'var(--neum-inset)',
            border: '1px solid var(--border-gold)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--neum-bg)', boxShadow: 'var(--neum-raised)',
              border: '1px solid var(--border-gold)', color: 'var(--gold)',
              marginTop: 1,
            }}>
              <MapPin size={13} strokeWidth={1.8} />
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 300,
              color: 'var(--text-secondary)', margin: 0, lineHeight: 1.8,
              direction: 'ltr', textAlign: 'left',
            }}>
              {data.address}
            </p>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="animate-fade-up d8" style={{ textAlign: 'center', paddingBottom: 40 }}>
          {/* Islamic footer ornament */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="240" height="28" viewBox="0 0 240 28" fill="none" aria-hidden="true">
              <line x1="0" y1="14" x2="90" y2="14" stroke="var(--border-gold)" strokeWidth="0.5"/>
              <path d="M96,10 L99,14 L96,18 L93,14 Z" fill="var(--gold)" opacity="0.4"/>
              {/* Central 8-star */}
              <path d="M120,5 L122.4,10.6 L128,8 L125.4,13.6 L131,16 L125.4,18.4 L128,24 L122.4,21.4 L120,27 L117.6,21.4 L112,24 L114.6,18.4 L109,16 L114.6,13.6 L112,8 L117.6,10.6 Z"
                fill="none" stroke="var(--gold)" strokeWidth="0.9"/>
              <circle cx="120" cy="16" r="2.5" fill="var(--gold)" opacity="0.85"/>
              <path d="M144,10 L147,14 L144,18 L141,14 Z" fill="var(--gold)" opacity="0.4"/>
              <line x1="150" y1="14" x2="240" y2="14" stroke="var(--border-gold)" strokeWidth="0.5"/>
            </svg>
          </div>

          <p dir="ltr" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 300, color: 'var(--text-dim)', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            21°23′N · 39°51′E · KSA
          </p>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--text-dim)', margin: 0 }}>
            · {t.digital} ·
          </p>
        </footer>
      </div>
    </div>
  );
}
