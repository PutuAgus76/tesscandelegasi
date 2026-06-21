'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { group: 'Utama', items: [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/scanner', icon: '📷', label: 'Scanner Presensi' },
  ]},
  { group: 'Manajemen', items: [
    { href: '/events', icon: '🗓️', label: 'Manajemen Event' },
    { href: '/participants', icon: '👥', label: 'Master Peserta' },
    { href: '/recap', icon: '📋', label: 'Rekap Kehadiran' },
  ]},
  { group: 'Sistem', items: [
    { href: '/logs', icon: '📜', label: 'Log Scan' },
    { href: '/settings', icon: '⚙️', label: 'Pengaturan' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('user');
    router.push('/');
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/dashboard" className="sidebar-logo-mark">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <span className="logo-title">PresensiKTM</span>
            <span className="logo-subtitle">Sistem Presensi Acara</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            <div className="nav-section-label">{group.group}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.href.replace('/', '')}`}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Guest'}</div>
            <div className="user-role">{user?.role === 'admin' ? '👑 Admin' : '📱 Petugas'}</div>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            title="Keluar"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '16px',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.15s',
            }}
            onMouseOver={e => e.target.style.color = 'var(--color-danger)'}
            onMouseOut={e => e.target.style.color = 'var(--color-text-muted)'}
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  );
}
