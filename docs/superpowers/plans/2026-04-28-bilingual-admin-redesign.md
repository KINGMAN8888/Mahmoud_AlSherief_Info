# Bilingual + Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete AR/EN bilingual support to both pages, and redesign the Admin panel for mobile-first use with bottom-tab navigation and improved link management.

**Architecture:** PublicCard already has a T-object translation system — extend it. Admin gets a full redesign: bottom tab bar (Profile / Images / Links / Settings), floating save button, up/down link reordering, and its own T object for bilingual UI. No new dependencies needed.

**Tech Stack:** React 18, Lucide React icons, CSS variables (existing design tokens), vanilla HTML5

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/src/pages/PublicCard.jsx` | Modify | Improve T translations quality |
| `frontend/src/pages/Admin.jsx` | Rewrite | Mobile-first redesign + bilingual |

---

### Task 1: Improve PublicCard Translations

**Files:**
- Modify: `frontend/src/pages/PublicCard.jsx` (T object, lines 45–64)

- [ ] **Step 1: Update the T object in PublicCard.jsx**

Replace the existing `T` constant (lines 45–64) with the improved version:

```js
const T = {
  ar: {
    save:          'حفظ جهة الاتصال',
    share:         'مشاركة',
    contact:       'معلومات التواصل',
    connect:       'قنوات التواصل',
    locations:     'الفروع والمواقع',
    phone_label:   'الهاتف',
    email_label:   'البريد الإلكتروني',
    web_label:     'الموقع الإلكتروني',
    ceo_tag:       'رئيس تنفيذي',
    verified_tag:  'موثّق',
    error:         'تعذّر تحميل البيانات',
    retry:         'إعادة المحاولة',
    digital:       'البطاقة الرقمية',
    address_label: 'العنوان',
    section_01:    'معلومات التواصل',
    section_02:    'قنوات التواصل',
    section_03:    'الفروع والمواقع',
  },
  en: {
    save:          'Save Contact',
    share:         'Share',
    contact:       'Contact Info',
    connect:       'Connect',
    locations:     'Offices & Branches',
    phone_label:   'Phone',
    email_label:   'Email',
    web_label:     'Website',
    ceo_tag:       'CEO',
    verified_tag:  'Verified',
    error:         'Failed to load profile',
    retry:         'Retry',
    digital:       'Digital Business Card',
    address_label: 'Address',
    section_01:    'Contact Info',
    section_02:    'Connect',
    section_03:    'Offices & Branches',
  },
};
```

- [ ] **Step 2: Use section keys in SectionHead calls**

In PublicCard.jsx find the three `<SectionHead>` usages and ensure they use `t.section_01`, `t.section_02`, `t.section_03` (they already use `t.contact`, `t.connect`, `t.locations` which now have the same values — no change needed if keys match).

- [ ] **Step 3: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/src/pages/PublicCard.jsx
git commit -m "i18n: improve PublicCard translation quality AR/EN"
```

---

### Task 2: Redesign Admin — Structure & Bilingual Foundation

**Files:**
- Rewrite: `frontend/src/pages/Admin.jsx`

- [ ] **Step 1: Replace Admin.jsx with the full redesign**

Full replacement content for `frontend/src/pages/Admin.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Save, LogOut, Plus, Trash2, LogIn, Eye, EyeOff, Upload,
  User, Image, Link2, Settings, ChevronUp, ChevronDown, Check,
  Sun, Moon,
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen.jsx';

/* ── Translations ───────────────────────────────────────────── */
const T = {
  ar: {
    dashboard:      'لوحة التحكم',
    login_title:    'تسجيل الدخول',
    login_sub:      'أدخل بياناتك للمتابعة',
    username:       'اسم المستخدم',
    password:       'كلمة المرور',
    show_pass:      'إظهار كلمة المرور',
    hide_pass:      'إخفاء كلمة المرور',
    signing_in:     'جاري الدخول...',
    sign_in:        'دخول',
    logout:         'خروج',
    tab_profile:    'الملف',
    tab_images:     'الصور',
    tab_links:      'الروابط',
    tab_settings:   'الإعدادات',
    section_basic:  'المعلومات الأساسية',
    full_name:      'الاسم الكامل',
    job_title:      'المسمى الوظيفي',
    company:        'الشركة',
    phone_link:     'رقم الهاتف (للاتصال)',
    phone_display:  'رقم العرض',
    email:          'البريد الإلكتروني',
    website:        'الموقع الإلكتروني',
    address:        'العنوان',
    branches:       'مواقع الفروع',
    branches_hint:  'افصل بين المواقع بشرطة  -  مثال: MECCA - MEDINA',
    profile_img:    'صورة الملف الشخصي',
    cover_img:      'صورة الغلاف',
    preview:        'معاينة',
    links_title:    'إدارة الروابط',
    add_link:       'إضافة رابط',
    link_title:     'عنوان الرابط',
    link_url:       'الرابط',
    link_icon:      'الأيقونة',
    move_up:        'تحريك لأعلى',
    move_down:      'تحريك لأسفل',
    delete:         'حذف',
    new_link:       'رابط جديد',
    settings_title: 'الإعدادات',
    language:       'اللغة',
    theme:          'المظهر',
    dark_mode:      'الوضع الداكن',
    light_mode:     'الوضع الفاتح',
    saving:         'جاري الحفظ...',
    saved:          'تم الحفظ ✓',
    save_changes:   'حفظ التعديلات',
    unsaved:        'توجد تعديلات غير محفوظة',
    session_expired:'انتهت الجلسة — سجّل الدخول مجدداً',
    img_url_hint:   'https://...',
  },
  en: {
    dashboard:      'Dashboard',
    login_title:    'Sign In',
    login_sub:      'Enter your credentials to continue',
    username:       'Username',
    password:       'Password',
    show_pass:      'Show password',
    hide_pass:      'Hide password',
    signing_in:     'Signing in...',
    sign_in:        'Sign In',
    logout:         'Logout',
    tab_profile:    'Profile',
    tab_images:     'Images',
    tab_links:      'Links',
    tab_settings:   'Settings',
    section_basic:  'Basic Information',
    full_name:      'Full Name',
    job_title:      'Job Title',
    company:        'Company',
    phone_link:     'Phone (for dialing)',
    phone_display:  'Display Number',
    email:          'Email',
    website:        'Website',
    address:        'Address',
    branches:       'Branch Locations',
    branches_hint:  'Separate with dash  -  e.g. MECCA - MEDINA',
    profile_img:    'Profile Photo',
    cover_img:      'Cover Image',
    preview:        'Preview',
    links_title:    'Manage Links',
    add_link:       'Add Link',
    link_title:     'Link Title',
    link_url:       'URL',
    link_icon:      'Icon',
    move_up:        'Move Up',
    move_down:      'Move Down',
    delete:         'Delete',
    new_link:       'New Link',
    settings_title: 'Settings',
    language:       'Language',
    theme:          'Theme',
    dark_mode:      'Dark Mode',
    light_mode:     'Light Mode',
    saving:         'Saving...',
    saved:          'Saved ✓',
    save_changes:   'Save Changes',
    unsaved:        'Unsaved changes',
    session_expired:'Session expired — please sign in again',
    img_url_hint:   'https://...',
  },
};

const ICON_OPTIONS = ['Phone','MessageCircle','Mail','Globe','MapPin','Briefcase','Instagram','Twitter','Linkedin','Youtube'];

/* ── Auth helpers ───────────────────────────────────────────── */
function getToken()    { return localStorage.getItem('vcard_token'); }
function setToken(t)   { localStorage.setItem('vcard_token', t); }
function clearToken()  { localStorage.removeItem('vcard_token'); }

class AuthError extends Error {
  constructor(msg) { super(msg); this.isAuthError = true; }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) throw new AuthError('session');
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

/* ── Shared input style ─────────────────────────────────────── */
const inp = {
  background: 'var(--neum-bg)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 12,
  padding: '11px 14px',
  width: '100%',
  outline: 'none',
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-arabic)',
  transition: 'border-color 0.2s',
};

function focusGold(e)  { e.target.style.borderColor = 'var(--gold)'; }
function blurBorder(e) { e.target.style.borderColor = 'var(--border)'; }

/* ── Field wrapper ──────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-arabic)' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'var(--font-arabic)' }}>{hint}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════════════════════════ */
function LoginForm({ onSuccess, lang, setLang }) {
  const t = T[lang];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', background: 'var(--bg-base)' }}>

      {/* Lang toggle top-right */}
      <div style={{ position: 'fixed', top: 14, right: 14 }}>
        <button
          onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
          style={{ ...inp, width: 'auto', padding: '6px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', border: '1px solid var(--border-gold)', cursor: 'pointer' }}
        >
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 360, background: 'var(--neum-bg)', border: '1px solid var(--border-gold)', borderRadius: 24, padding: '36px 28px', boxShadow: 'var(--neum-raised)' }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(201,162,39,0.18), rgba(201,162,39,0.06))', border: '1px solid var(--border-gold)' }}>
            <LogIn size={26} style={{ color: 'var(--gold)' }} />
          </div>
        </div>

        <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', fontFamily: 'var(--font-arabic)' }}>{t.login_title}</h1>
        <p  style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '0 0 28px', fontFamily: 'var(--font-arabic)' }}>{t.login_sub}</p>

        <form onSubmit={handleSubmit}>
          <Field label={t.username}>
            <input value={username} onChange={e => setUsername(e.target.value)}
                   style={{ ...inp, direction: 'ltr', textAlign: 'left' }}
                   onFocus={focusGold} onBlur={blurBorder}
                   autoComplete="username" required />
          </Field>
          <Field label={t.password}>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'}
                     value={password} onChange={e => setPassword(e.target.value)}
                     style={{ ...inp, direction: 'ltr', textAlign: 'left', paddingRight: 44 }}
                     onFocus={focusGold} onBlur={blurBorder}
                     autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPass(v => !v)}
                      aria-label={showPass ? t.hide_pass : t.show_pass}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12, textAlign: 'center', fontFamily: 'var(--font-arabic)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, var(--gold-pale), var(--gold) 60%, #7a5800)', color: '#000', fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-arabic)', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            {loading ? t.signing_in : t.sign_in}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: PROFILE
══════════════════════════════════════════════════════════════ */
function TabProfile({ data, set, t, lang }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 18, fontFamily: 'var(--font-arabic)', textTransform: 'uppercase' }}>{t.section_basic}</h2>

      <Field label={t.full_name}>
        <input value={data.name} onChange={e => set('name', e.target.value)} style={inp} onFocus={focusGold} onBlur={blurBorder} />
      </Field>
      <Field label={t.job_title}>
        <input value={data.title} onChange={e => set('title', e.target.value)} style={inp} onFocus={focusGold} onBlur={blurBorder} />
      </Field>
      <Field label={t.company}>
        <input value={data.company} onChange={e => set('company', e.target.value)} style={inp} onFocus={focusGold} onBlur={blurBorder} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label={t.phone_link}>
          <input value={data.phone} onChange={e => set('phone', e.target.value)} style={{ ...inp, direction: 'ltr', textAlign: 'left' }} onFocus={focusGold} onBlur={blurBorder} />
        </Field>
        <Field label={t.phone_display}>
          <input value={data.display_phone} onChange={e => set('display_phone', e.target.value)} style={{ ...inp, direction: 'ltr', textAlign: 'left' }} onFocus={focusGold} onBlur={blurBorder} />
        </Field>
      </div>

      <Field label={t.email}>
        <input value={data.email} onChange={e => set('email', e.target.value)} style={{ ...inp, direction: 'ltr', textAlign: 'left' }} onFocus={focusGold} onBlur={blurBorder} />
      </Field>
      <Field label={t.website}>
        <input value={data.website} onChange={e => set('website', e.target.value)} style={{ ...inp, direction: 'ltr', textAlign: 'left' }} onFocus={focusGold} onBlur={blurBorder} />
      </Field>
      <Field label={t.address}>
        <textarea value={data.address} onChange={e => set('address', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} onFocus={focusGold} onBlur={blurBorder} />
      </Field>
      <Field label={t.branches} hint={t.branches_hint}>
        <input value={data.locations} onChange={e => set('locations', e.target.value)} style={inp} onFocus={focusGold} onBlur={blurBorder} />
      </Field>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: IMAGES
══════════════════════════════════════════════════════════════ */
function TabImages({ data, set, t, uploadingField, onUpload, lang }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const images = [
    { label: t.profile_img, field: 'profile_image' },
    { label: t.cover_img,   field: 'cover_image'   },
  ];

  return (
    <div dir={dir}>
      {images.map(({ label, field }) => (
        <div key={field} style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-arabic)' }}>
            {label}
          </label>

          {/* Preview */}
          {data[field] && (
            <div style={{ marginBottom: 10, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-gold)', position: 'relative', height: field === 'cover_image' ? 120 : 100 }}>
              <img src={data[field]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 6, left: lang === 'ar' ? 6 : 'auto', right: lang === 'en' ? 6 : 'auto', background: 'rgba(0,0,0,0.55)', color: 'var(--gold)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 6 }}>
                {t.preview}
              </div>
            </div>
          )}

          {/* URL input + upload */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={data[field]} onChange={e => set(field, e.target.value)} placeholder={t.img_url_hint}
                   style={{ ...inp, flex: 1, direction: 'ltr', textAlign: 'left' }} onFocus={focusGold} onBlur={blurBorder} />
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border-gold)', color: uploadingField === field ? 'var(--gold)' : 'var(--text-muted)', background: 'var(--neum-bg)', flexShrink: 0, transition: 'color 0.2s' }}>
              {uploadingField === field ? '···' : <Upload size={17} />}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && onUpload(field, e.target.files[0])} />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: LINKS
══════════════════════════════════════════════════════════════ */
function TabLinks({ data, setData, t, lang }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const setLink = (id, key, val) =>
    setData(prev => ({ ...prev, links: prev.links.map(l => l.id === id ? { ...l, [key]: val } : l) }));

  const addLink = () =>
    setData(prev => ({ ...prev, links: [...prev.links, { id: Date.now(), sort: prev.links.length + 1, title: t.new_link, type: 'link', url: 'https://', icon: 'Globe' }] }));

  const removeLink = id =>
    setData(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));

  const moveLink = (id, dir) => {
    setData(prev => {
      const links = [...prev.links];
      const idx = links.findIndex(l => l.id === id);
      if (dir === 'up'   && idx === 0)               return prev;
      if (dir === 'down' && idx === links.length - 1) return prev;
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [links[idx], links[swap]] = [links[swap], links[idx]];
      return { ...prev, links };
    });
  };

  return (
    <div dir={dir}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', fontFamily: 'var(--font-arabic)', textTransform: 'uppercase', margin: 0 }}>{t.links_title}</h2>
        <button onClick={addLink}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--gold)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-arabic)' }}>
          <Plus size={14} /> {t.add_link}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.links.map((link, idx) => (
          <div key={link.id} style={{ background: 'var(--neum-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', boxShadow: 'var(--neum-inset)' }}>

            {/* Title row with move/delete */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <input value={link.title} onChange={e => setLink(link.id, 'title', e.target.value)}
                     placeholder={t.link_title}
                     style={{ ...inp, flex: 1, fontSize: 13, padding: '8px 12px' }}
                     onFocus={focusGold} onBlur={blurBorder} />

              {/* Up / Down / Delete */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button onClick={() => moveLink(link.id, 'up')}  disabled={idx === 0}
                        aria-label={t.move_up}
                        style={{ width: 28, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--neum-bg)', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronUp size={13} />
                </button>
                <button onClick={() => moveLink(link.id, 'down')} disabled={idx === data.links.length - 1}
                        aria-label={t.move_down}
                        style={{ width: 28, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--neum-bg)', color: idx === data.links.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: idx === data.links.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronDown size={13} />
                </button>
              </div>

              <button onClick={() => removeLink(link.id)} aria-label={t.delete}
                      style={{ width: 28, height: 54, borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>

            {/* URL */}
            <input value={link.url} onChange={e => setLink(link.id, 'url', e.target.value)}
                   placeholder="https://..."
                   style={{ ...inp, direction: 'ltr', textAlign: 'left', fontSize: 12, padding: '8px 12px', marginBottom: 8 }}
                   onFocus={focusGold} onBlur={blurBorder} />

            {/* Icon select */}
            <select value={link.icon} onChange={e => setLink(link.id, 'icon', e.target.value)}
                    style={{ ...inp, fontSize: 12, padding: '8px 12px', cursor: 'pointer' }}>
              {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </div>
        ))}
      </div>

      {data.links.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 13, fontFamily: 'var(--font-arabic)' }}>
          {t.add_link}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: SETTINGS
══════════════════════════════════════════════════════════════ */
function TabSettings({ t, lang, setLang, theme, setTheme, onLogout }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isDark = theme === 'dark';

  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-arabic)' }}>{label}</span>
      {children}
    </div>
  );

  const Toggle = ({ active, onToggle, labelOn, labelOff }) => (
    <button onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-gold)', background: active ? 'rgba(201,162,39,0.15)' : 'var(--neum-bg)', color: 'var(--gold)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-arabic)', transition: 'background 0.2s' }}>
      {active ? labelOn : labelOff}
    </button>
  );

  return (
    <div dir={dir}>
      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 18, fontFamily: 'var(--font-arabic)', textTransform: 'uppercase' }}>{t.settings_title}</h2>

      <div style={{ background: 'var(--neum-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '0 16px', marginBottom: 20 }}>
        <Row label={t.language}>
          <Toggle active={lang === 'ar'} onToggle={() => setLang(l => l === 'ar' ? 'en' : 'ar')} labelOn="العربية" labelOff="English" />
        </Row>
        <Row label={t.theme}>
          <Toggle
            active={isDark}
            onToggle={() => {
              const next = isDark ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', next);
              localStorage.setItem('vcard-theme', next);
              setTheme(next);
            }}
            labelOn={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Moon size={13} /> {t.dark_mode}</span>}
            labelOff={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sun size={13} /> {t.light_mode}</span>}
          />
        </Row>
      </div>

      <button onClick={onLogout}
              style={{ width: '100%', padding: '13px', borderRadius: 14, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-arabic)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <LogOut size={16} /> {t.logout}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
function Dashboard({ onLogout, lang, setLang }) {
  const [data,           setData]           = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [saveState,      setSaveState]      = useState('idle'); // idle | saving | saved
  const [uploadingField, setUploadingField] = useState(null);
  const [activeTab,      setActiveTab]      = useState('profile');
  const [dirty,          setDirty]          = useState(false);
  const [theme,          setTheme]          = useState(() => localStorage.getItem('vcard-theme') || 'dark');

  const t   = T[lang];

  /* Intercept setData to mark dirty */
  const updateData = useCallback(updater => {
    setData(updater);
    setDirty(true);
  }, []);

  const set = useCallback((key, val) => updateData(prev => ({ ...prev, [key]: val })), [updateData]);

  useEffect(() => {
    apiFetch('/api/vcard').then(d => { setData(d); setDirty(false); }).catch(err => {
      if (err.isAuthError) { clearToken(); onLogout(); }
    });
  }, [onLogout]);

  if (!data) return <LoadingScreen />;

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await apiFetch('/api/vcard', { method: 'PUT', body: JSON.stringify(data) });
      setSaveState('saved');
      setDirty(false);
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      if (err.isAuthError) { clearToken(); onLogout(); }
      else alert(err.message);
      setSaveState('idle');
    }
  };

  const handleUpload = async (field, file) => {
    setUploadingField(field);
    try {
      const form = new FormData();
      form.append('file', file);
      const { url } = await apiFetch('/api/vcard/upload', { method: 'POST', body: form });
      set(field, url);
    } catch (err) {
      if (err.isAuthError) { clearToken(); onLogout(); }
      else alert(err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const TABS = [
    { id: 'profile',  icon: User,     label: t.tab_profile  },
    { id: 'images',   icon: Image,    label: t.tab_images   },
    { id: 'links',    icon: Link2,    label: t.tab_links    },
    { id: 'settings', icon: Settings, label: t.tab_settings },
  ];

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 120 }}>

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, background: 'var(--neum-bg-alpha)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-gold)' }}>
        <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-arabic)', margin: 0 }}>{t.dashboard}</h1>
        {dirty && (
          <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-arabic)', opacity: 0.8, letterSpacing: '0.04em' }}>● {t.unsaved}</span>
        )}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        {activeTab === 'profile'  && <TabProfile data={data} set={set} t={t} lang={lang} />}
        {activeTab === 'images'   && <TabImages  data={data} set={set} t={t} uploadingField={uploadingField} onUpload={handleUpload} lang={lang} />}
        {activeTab === 'links'    && <TabLinks   data={data} setData={updateData} t={t} lang={lang} />}
        {activeTab === 'settings' && <TabSettings t={t} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} onLogout={() => { clearToken(); onLogout(); }} />}
      </div>

      {/* ── Floating Save Button (FAB) ── */}
      {activeTab !== 'settings' && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 60, width: 'calc(100% - 32px)', maxWidth: 448 }}>
          <button
            onClick={handleSave}
            disabled={saveState === 'saving' || !dirty}
            style={{
              width: '100%', padding: '15px', borderRadius: 16, border: 'none', cursor: dirty ? 'pointer' : 'default',
              background: saveState === 'saved'
                ? 'rgba(34,197,94,0.15)'
                : dirty
                  ? 'linear-gradient(135deg, var(--gold-pale), var(--gold) 60%, #7a5800)'
                  : 'var(--neum-bg)',
              color: saveState === 'saved' ? '#22c55e' : dirty ? '#000' : 'var(--text-dim)',
              border: saveState === 'saved' ? '1px solid rgba(34,197,94,0.35)' : dirty ? 'none' : '1px solid var(--border)',
              fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-arabic)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: dirty && saveState !== 'saved' ? '0 6px 24px rgba(201,162,39,0.35)' : 'none',
              transition: 'all 0.25s',
              opacity: saveState === 'saving' ? 0.75 : 1,
            }}
          >
            {saveState === 'saved'  ? <><Check size={18} /> {t.saved}</> :
             saveState === 'saving' ? t.saving :
             <><Save size={17} /> {t.save_changes}</>}
          </button>
        </div>
      )}

      {/* ── Bottom Tab Bar ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 55, background: 'var(--neum-bg-alpha)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-gold)', display: 'flex', height: 64 }}>
        {TABS.map(tab => {
          const Icon    = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'var(--gold)' : 'var(--text-dim)', transition: 'color 0.2s' }}
            >
              <Icon size={isActive ? 21 : 19} strokeWidth={isActive ? 2.2 : 1.6} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 600, letterSpacing: '0.06em', fontFamily: 'var(--font-arabic)' }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{ position: 'absolute', bottom: 0, width: 32, height: 2, background: 'var(--gold)', borderRadius: 1 }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN ROOT
══════════════════════════════════════════════════════════════ */
export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const [lang,   setLang]   = useState(() => localStorage.getItem('vcard-lang') || 'ar');

  useEffect(() => { localStorage.setItem('vcard-lang', lang); }, [lang]);

  return authed
    ? <Dashboard onLogout={() => setAuthed(false)} lang={lang} setLang={setLang} />
    : <LoginForm  onSuccess={() => setAuthed(true)}  lang={lang} setLang={setLang} />;
}
```

- [ ] **Step 2: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/src/pages/Admin.jsx
git commit -m "feat: redesign Admin panel — mobile-first tabs, bilingual AR/EN, FAB save, link reorder"
```

---

### Task 3: Verify in Browser

- [ ] **Step 1: Start dev server**

```bash
cd "f:/Dashboard my father/frontend"
npm run dev
```

- [ ] **Step 2: Check public card at http://localhost:5173**
  - Toggle AR ↔ EN — all labels must switch
  - Verify direction (RTL for AR, LTR for EN)
  - No untranslated hardcoded strings visible

- [ ] **Step 3: Check admin panel at http://localhost:5173/admin**
  - Login screen shows in Arabic by default, EN toggle works
  - 4 bottom tabs navigate correctly
  - Profile tab: all fields editable, dirty indicator appears on change
  - Images tab: preview shows, upload button works
  - Links tab: add link, move up/down, delete all work
  - Settings tab: language toggle, theme toggle, logout button
  - FAB save button: grey when clean, gold when dirty, green on success
  - Fully functional on mobile viewport (375px width)

- [ ] **Step 4: Final commit**

```bash
cd "f:/Dashboard my father"
git add -A
git commit -m "chore: verify bilingual admin redesign complete"
```
