import { Phone, MessageCircle, Mail, Globe, MapPin, Briefcase, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

const ICONS = { Phone, MessageCircle, Mail, Globe, MapPin, Briefcase, Instagram, Twitter, Linkedin, Youtube };

export default function LinkCard({ link, index }) {
  const Icon = ICONS[link.icon] || Globe;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-95 animate-fade-up"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,175,55,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--gold)' }}>
        <Icon size={20} />
      </div>
      <span className="flex-1 text-right font-medium transition-colors duration-200"
            style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif' }}>
        {link.title}
      </span>
      <svg className="w-4 h-4 flex-shrink-0 transition-colors duration-200 rotate-180"
           style={{ color: 'var(--text-muted)' }}
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
