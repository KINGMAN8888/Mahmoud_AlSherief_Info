import { useState, useEffect } from 'react';
import { Save, LogOut, Plus, Trash2, LogIn, Eye, EyeOff, Upload } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen.jsx';

const ICON_OPTIONS = ['Phone', 'MessageCircle', 'Mail', 'Globe', 'MapPin', 'Briefcase', 'Instagram', 'Twitter', 'Linkedin', 'Youtube'];

function getToken() { return localStorage.getItem('vcard_token'); }
function setToken(t) { localStorage.setItem('vcard_token', t); }
function clearToken() { localStorage.removeItem('vcard_token'); }

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
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

// ─── Login screen ─────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm animate-fade-up"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <LogIn size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>تسجيل الدخول للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>اسم المستخدم</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl outline-none text-right transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Inter' }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 pr-11 rounded-xl outline-none text-right transition-colors"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Inter' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-lg"
               style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 mt-2"
            style={{
              background: 'linear-gradient(135deg, var(--gold), #b38f21)',
              color: '#000',
              fontFamily: 'Tajawal',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Field component ─────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 10,
  padding: '10px 12px',
  width: '100%',
  outline: 'none',
  fontFamily: 'Tajawal, Inter, sans-serif',
  fontSize: 14,
};

// ─── Dashboard ─────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  useEffect(() => {
    apiFetch('/api/vcard').then(setData).catch(console.error);
  }, []);

  if (!data) return <LoadingScreen />;

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const setLink = (id, key, val) =>
    setData(prev => ({ ...prev, links: prev.links.map(l => l.id === id ? { ...l, [key]: val } : l) }));

  const addLink = () =>
    setData(prev => ({
      ...prev,
      links: [...prev.links, { id: Date.now(), sort: prev.links.length + 1, title: 'رابط جديد', type: 'link', url: 'https://', icon: 'Globe' }]
    }));

  const removeLink = id =>
    setData(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await apiFetch('/api/vcard', { method: 'PUT', body: JSON.stringify(data) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
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
      alert(err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const sectionStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 80px' }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
           style={{ background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-base font-bold" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>لوحة التحكم</h1>
        <button onClick={() => { clearToken(); onLogout(); }}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          <LogOut size={14} />
          خروج
        </button>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto">
        {/* Basic Info */}
        <div style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>المعلومات الأساسية</h2>
          <div className="space-y-3">
            <Field label="الاسم الكامل">
              <input value={data.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="المسمى الوظيفي">
              <input value={data.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="الشركة">
              <input value={data.company} onChange={e => set('company', e.target.value)} style={inputStyle} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="رقم الهاتف (للروابط)">
                <input value={data.phone} onChange={e => set('phone', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
              </Field>
              <Field label="رقم العرض">
                <input value={data.display_phone} onChange={e => set('display_phone', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
              </Field>
            </div>
            <Field label="البريد الإلكتروني">
              <input value={data.email} onChange={e => set('email', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
            </Field>
            <Field label="الموقع الإلكتروني">
              <input value={data.website} onChange={e => set('website', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
            </Field>
            <Field label="العنوان">
              <textarea value={data.address} onChange={e => set('address', e.target.value)}
                        rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="مواقع الفروع">
              <input value={data.locations} onChange={e => set('locations', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>الصور</h2>
          <div className="space-y-4">
            {[
              { label: 'صورة الملف الشخصي', field: 'profile_image' },
              { label: 'صورة الغلاف', field: 'cover_image' },
            ].map(({ label, field }) => (
              <Field key={field} label={label}>
                <div className="flex gap-2">
                  <input
                    value={data[field]}
                    onChange={e => set(field, e.target.value)}
                    placeholder="https://..."
                    style={{ ...inputStyle, direction: 'ltr', flex: 1 }}
                  />
                  <label className="flex items-center justify-center px-3 rounded-xl cursor-pointer transition-colors"
                         style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: uploadingField === field ? 'var(--gold)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {uploadingField === field ? '...' : <Upload size={16} />}
                    <input type="file" accept="image/*" className="hidden"
                           onChange={e => e.target.files[0] && handleUpload(field, e.target.files[0])} />
                  </label>
                </div>
                {data[field] && (
                  <img src={data[field]} alt={label} className="mt-2 rounded-xl object-cover"
                       style={{ height: 80, width: '100%', border: '1px solid var(--border)' }} />
                )}
              </Field>
            ))}
          </div>
        </div>

        {/* Links */}
        <div style={sectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>الروابط</h2>
            <button onClick={addLink}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Plus size={13} /> إضافة
            </button>
          </div>
          <div className="space-y-3">
            {data.links.map(link => (
              <div key={link.id} className="relative p-3 rounded-xl space-y-2"
                   style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <button onClick={() => removeLink(link.id)}
                        className="absolute top-3 left-3 transition-colors"
                        style={{ color: '#555' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                  <Trash2 size={14} />
                </button>
                <input value={link.title} onChange={e => setLink(link.id, 'title', e.target.value)}
                       placeholder="عنوان الرابط" style={{ ...inputStyle, width: 'calc(100% - 28px)' }} />
                <input value={link.url} onChange={e => setLink(link.id, 'url', e.target.value)}
                       placeholder="https://..." style={{ ...inputStyle, direction: 'ltr' }} />
                <select value={link.icon} onChange={e => setLink(link.id, 'icon', e.target.value)}
                        style={inputStyle}>
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all duration-200 active:scale-95"
          style={{
            background: success ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, var(--gold), #b38f21)',
            color: success ? '#22c55e' : '#000',
            border: success ? '1px solid rgba(34,197,94,0.3)' : 'none',
            fontFamily: 'Tajawal',
            opacity: saving ? 0.7 : 1,
          }}>
          <Save size={18} />
          {saving ? 'جاري الحفظ...' : success ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin page ────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());

  return authed
    ? <Dashboard onLogout={() => setAuthed(false)} />
    : <LoginForm onSuccess={() => setAuthed(true)} />;
}
