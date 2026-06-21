'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulasi login (akan diganti dengan Firebase Auth)
    await new Promise(r => setTimeout(r, 1200));

    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      setLoading(false);
      return;
    }

    // Demo credentials
    const demoAccounts = {
      'admin@presensi.com': { pass: 'admin123', role: 'admin', name: 'Admin Sekretaris' },
      'petugas@presensi.com': { pass: 'petugas123', role: 'petugas', name: 'Petugas Scan' },
    };

    const acc = demoAccounts[email];
    if (acc && acc.pass === password) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({ email, role: acc.role, name: acc.name }));
      }
      if (acc.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/scanner');
      }
    } else {
      setError('Email atau password tidak sesuai. Gunakan akun demo di bawah.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1 className="login-title">PresensiKTM</h1>
          <p className="login-subtitle">Sistem Presensi Acara Berbasis Scan KTM</p>
        </div>

        {/* Role Selection */}
        <div className="role-tabs" style={{ marginBottom: '20px' }}>
          <button
            id="tab-admin"
            className={`role-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setEmail('admin@presensi.com'); setPassword('admin123'); }}
          >
            👑 Admin
          </button>
          <button
            id="tab-petugas"
            className={`role-tab ${role === 'petugas' ? 'active' : ''}`}
            onClick={() => { setRole('petugas'); setEmail('petugas@presensi.com'); setPassword('petugas123'); }}
          >
            📱 Petugas
          </button>
          <button
            id="tab-viewer"
            className={`role-tab ${role === 'viewer' ? 'active' : ''}`}
            onClick={() => { setRole('viewer'); setEmail(''); setPassword(''); }}
          >
            👁️ Viewer
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="email@contoh.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="scan-notification error" style={{ padding: '10px 12px' }}>
              <span className="notif-icon">⚠️</span>
              <div>
                <div className="notif-msg" style={{ color: 'var(--color-danger)' }}>{error}</div>
              </div>
            </div>
          )}

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary btn-lg login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin" style={{ display: 'inline-block', fontSize: '14px' }}>⟳</span>
                Masuk...
              </>
            ) : (
              <>🚀 Masuk ke Sistem</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          <div className="login-divider">
            <span className="login-divider-text">Akun Demo</span>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DemoAccount
              role="Admin"
              email="admin@presensi.com"
              pass="admin123"
              onUse={() => { setEmail('admin@presensi.com'); setPassword('admin123'); setRole('admin'); }}
            />
            <DemoAccount
              role="Petugas"
              email="petugas@presensi.com"
              pass="petugas123"
              onUse={() => { setEmail('petugas@presensi.com'); setPassword('petugas123'); setRole('petugas'); }}
            />
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '20px' }}>
          Sistem ini menggunakan Firebase Authentication.<br />
          Hubungi admin untuk mendapatkan akun resmi.
        </p>
      </div>
    </div>
  );
}

function DemoAccount({ role, email, pass, onUse }) {
  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>{role}</div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{email}</div>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onUse}
        style={{ fontSize: '11px', padding: '5px 10px' }}
      >
        Gunakan
      </button>
    </div>
  );
}
