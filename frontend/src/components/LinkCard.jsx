import {
  Phone, MessageCircle, Mail, Globe, MapPin,
  Briefcase, Instagram, Twitter, Linkedin, Youtube, Facebook,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const ICONS = {
  Phone, MessageCircle, Mail, Globe, MapPin,
  Briefcase, Instagram, Twitter, Linkedin, Youtube, Facebook,
};


/* Type → accent colors via CSS variables */
const TYPE_VAR = {
  phone:    { bg: 'var(--ac-phone)',   color: 'var(--ac-phone-c)'   },
  whatsapp: { bg: 'var(--ac-msg)',     color: 'var(--ac-msg-c)'     },
  email:    { bg: 'var(--ac-email)',   color: 'var(--ac-email-c)'   },
  website:  { bg: 'var(--ac-web)',     color: 'var(--ac-web-c)'     },
  map:      { bg: 'var(--ac-map)',     color: 'var(--ac-map-c)'     },
};

/* Type → translated title */
const TYPE_LABELS = {
  phone:    { ar: 'اتصال هاتفي',       en: 'Phone Call'       },
  whatsapp: { ar: 'محادثة واتساب',     en: 'WhatsApp Chat'    },
  email:    { ar: 'البريد الإلكتروني', en: 'Email'            },
  website:  { ar: 'الموقع الإلكتروني', en: 'Website'          },
  map:      { ar: 'موقع المكتب',       en: 'Office Location'  },
};

export default function LinkCard({ link, index, dir = 'rtl', lang = 'ar' }) {
  const Icon    = ICONS[link.icon] || Globe;
  const accent  = TYPE_VAR[link.type] || { bg: 'var(--ac-default)', color: 'var(--ac-default-c)' };
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const title   = TYPE_LABELS[link.type]?.[lang] ?? link.title;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-fade-up link-beam"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', borderRadius: 16,
        background: 'var(--neum-bg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--neum-raised)',
        textDecoration: 'none',
        animationDelay: `${0.6 + index * 0.06}s`,
        opacity: 0,
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--neum-outer)';
        e.currentTarget.style.borderColor = 'var(--border-gold)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--neum-raised)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      onMouseDown={e => {
        e.currentTarget.style.boxShadow = 'var(--neum-pressed)';
        e.currentTarget.style.transform = 'scale(0.975)';
      }}
      onMouseUp={e => {
        e.currentTarget.style.boxShadow = 'var(--neum-raised)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Icon pill — neumorphic raised */}
      <div
        style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--neum-bg)',
          boxShadow: 'var(--neum-raised)',
          color: accent.color,
          border: `1px solid ${accent.color}22`,
        }}
      >
        <Icon size={17} strokeWidth={1.8} />
      </div>

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'var(--font-ui)',
          fontSize: 14, fontWeight: 500,
          color: 'var(--text-primary)',
          direction: dir, textAlign: dir === 'rtl' ? 'right' : 'left',
        }}
      >
        {title}
      </span>

      {/* Directional chevron */}
      <Chevron
        size={13}
        strokeWidth={2}
        style={{ color: 'var(--text-dim)', flexShrink: 0 }}
      />
    </a>
  );
}
