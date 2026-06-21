'use client';
import { useState, useEffect } from 'react';

// Demo data
const DEMO_RECAP = [
  { nim: '2415101041', name: 'I Putu Eka Wibawa', prodi: 'Teknik Informatika', faculty: 'FTK', checkIn: '08:02', checkOut: '16:45', status: 'Hadir' },
  { nim: '2315101022', name: 'Ni Luh Putu Ayu Sari', prodi: 'Sistem Informasi', faculty: 'FTK', checkIn: '08:15', checkOut: '', status: 'Belum Lengkap' },
  { nim: '2215201013', name: 'I Gede Darmawan', prodi: 'Pendidikan IPA', faculty: 'FMIPA', checkIn: '07:55', checkOut: '17:00', status: 'Hadir' },
  { nim: '2115301008', name: 'Ni Made Dewi Anggraeni', prodi: 'Akuntansi', faculty: 'FE', checkIn: '', checkOut: '', status: 'Tidak Hadir' },
  { nim: '2315401031', name: 'I Wayan Surya Pratama', prodi: 'Manajemen', faculty: 'FE', checkIn: '', checkOut: '14:30', status: 'Perlu Verifikasi' },
  { nim: '2415101055', name: 'Putu Bagus Mahendra', prodi: 'Teknik Informatika', faculty: 'FTK', checkIn: '08:10', checkOut: '16:50', status: 'Hadir' },
  { nim: '2315201044', name: 'Ni Komang Ayu Lestari', prodi: 'Sistem Informasi', faculty: 'FTK', checkIn: '08:30', checkOut: '16:30', status: 'Hadir' },
];

const statusBadge = (status) => {
  const map = {
    'Hadir': 'badge-success',
    'Belum Lengkap': 'badge-warning',
    'Tidak Hadir': 'badge-secondary',
    'Perlu Verifikasi': 'badge-danger',
  };
  return map[status] || 'badge-secondary';
};

export default function DashboardPage() {
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: DEMO_RECAP.length,
    checkIn: DEMO_RECAP.filter(r => r.checkIn).length,
    checkOut: DEMO_RECAP.filter(r => r.checkOut).length,
    hadir: DEMO_RECAP.filter(r => r.status === 'Hadir').length,
    belumLengkap: DEMO_RECAP.filter(r => r.status === 'Belum Lengkap').length,
    tidakHadir: DEMO_RECAP.filter(r => r.status === 'Tidak Hadir').length,
    verifikasi: DEMO_RECAP.filter(r => r.status === 'Perlu Verifikasi').length,
  };

  const filtered = DEMO_RECAP.filter(r => {
    const matchFilter = filter === 'Semua' || r.status === filter;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.nim.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <header className="top-header">
        <div>
          <div className="header-title">Dashboard Presensi</div>
          <div className="header-breadcrumb">Pantau rekap kehadiran secara real-time</div>
        </div>
        <div className="header-actions">
          <div className="chip">🕐 {currentTime}</div>
          <a
            id="btn-open-sheet"
            href="https://sheets.google.com"
            target="_blank"
            rel="noopener"
            className="btn btn-secondary btn-sm"
          >
            📊 Buka Spreadsheet
          </a>
        </div>
      </header>

      <main className="page-container">
        {/* Event Banner */}
        <div className="event-banner">
          <div className="event-banner-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="event-name">Seminar Nasional Teknologi Informasi 2026</div>
              <span className="badge badge-success"><span className="badge-dot" />Aktif</span>
            </div>
            <div className="event-meta">
              <div className="event-meta-item">📅 Sabtu, 21 Juni 2026</div>
              <div className="event-meta-item">📍 Aula Undiksha, Singaraja</div>
              <div className="event-meta-item">🏛️ Himpunan Mahasiswa TI</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <a href="/scanner" className="btn btn-primary">
              📷 Buka Scanner
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stat-grid">
          <StatCard
            type="primary"
            icon="👥"
            value={stats.total}
            label="Total Peserta"
            sub={`Event aktif`}
          />
          <StatCard
            type="success"
            icon="✅"
            value={stats.checkIn}
            label="Sudah Scan Masuk"
            sub={`${Math.round((stats.checkIn/stats.total)*100)}% dari total`}
          />
          <StatCard
            type="success"
            icon="🚪"
            value={stats.checkOut}
            label="Sudah Scan Keluar"
            sub={`${Math.round((stats.checkOut/stats.total)*100)}% dari total`}
          />
          <StatCard
            type="primary"
            icon="🎯"
            value={stats.hadir}
            label="Hadir Lengkap"
            sub={`Masuk + Keluar valid`}
          />
          <StatCard
            type="warning"
            icon="⏳"
            value={stats.belumLengkap}
            label="Belum Scan Keluar"
            sub={`Masuk tapi belum keluar`}
          />
          <StatCard
            type="danger"
            icon="❌"
            value={stats.tidakHadir}
            label="Tidak Hadir"
            sub={`Belum ada scan`}
          />
        </div>

        {/* Progress Overview */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Progress Kehadiran</div>
              <div className="card-subtitle">{stats.hadir} dari {stats.total} peserta hadir lengkap</div>
            </div>
            <span className="badge badge-primary">{Math.round((stats.hadir/stats.total)*100)}% Hadir</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ProgressRow label="Hadir Lengkap" value={stats.hadir} total={stats.total} type="success" />
            <ProgressRow label="Belum Scan Keluar" value={stats.belumLengkap} total={stats.total} type="warning" />
            <ProgressRow label="Tidak Hadir" value={stats.tidakHadir} total={stats.total} type="" />
            <ProgressRow label="Perlu Verifikasi" value={stats.verifikasi} total={stats.total} type="warning" />
          </div>
        </div>

        {/* Rekap Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Rekap Kehadiran Peserta</div>
              <div className="card-subtitle">Data terupdate otomatis dari scan</div>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="toolbar" style={{ marginBottom: '16px' }}>
            <div className="search-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                id="search-peserta"
                type="search"
                className="search-input"
                placeholder="Cari nama atau NIM..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Semua', 'Hadir', 'Belum Lengkap', 'Tidak Hadir', 'Perlu Verifikasi'].map(f => (
                <button
                  key={f}
                  id={`filter-${f.replace(/ /g, '-').toLowerCase()}`}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIM</th>
                  <th>Nama Peserta</th>
                  <th>Prodi</th>
                  <th>Scan Masuk</th>
                  <th>Scan Keluar</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.nim}>
                    <td style={{ color: 'var(--color-text-muted)', width: '40px' }}>{i + 1}</td>
                    <td className="td-bold" style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-primary)' }}>
                      {row.nim}
                    </td>
                    <td className="td-bold">{row.name}</td>
                    <td>{row.prodi}<br /><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.faculty}</span></td>
                    <td>
                      {row.checkIn ? (
                        <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '12px' }}>✓ {row.checkIn}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {row.checkOut ? (
                        <span style={{ color: 'var(--color-info)', fontWeight: '600', fontSize: '12px' }}>✓ {row.checkOut}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">Tidak ada data</div>
                <div className="empty-desc">Tidak ada peserta yang cocok dengan filter atau pencarian.</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ type, icon, value, label, sub }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className={`stat-icon ${type}`}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-change">{sub}</div>
    </div>
  );
}

function ProgressRow({ label, value, total, type }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '160px', flexShrink: 0 }}>{label}</span>
      <div className="progress-bar" style={{ flex: 1 }}>
        <div className={`progress-fill ${type}`} style={{ width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', width: '60px', textAlign: 'right', flexShrink: 0 }}>
        {value} ({pct}%)
      </span>
    </div>
  );
}
