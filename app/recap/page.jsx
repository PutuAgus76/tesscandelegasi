'use client';
import { useState } from 'react';

const DEMO_RECAP = [
  { nim: '2415101041', name: 'I Putu Eka Wibawa', prodi: 'Teknik Informatika', faculty: 'FTK', checkIn: '08:02', checkOut: '16:45', status: 'Hadir' },
  { nim: '2315101022', name: 'Ni Luh Putu Ayu Sari', prodi: 'Sistem Informasi', faculty: 'FTK', checkIn: '08:15', checkOut: '', status: 'Belum Lengkap' },
  { nim: '2215201013', name: 'I Gede Darmawan', prodi: 'Pendidikan IPA', faculty: 'FMIPA', checkIn: '07:55', checkOut: '17:00', status: 'Hadir' },
  { nim: '2115301008', name: 'Ni Made Dewi Anggraeni', prodi: 'Akuntansi', faculty: 'FE', checkIn: '', checkOut: '', status: 'Tidak Hadir' },
  { nim: '2315401031', name: 'I Wayan Surya Pratama', prodi: 'Manajemen', faculty: 'FE', checkIn: '', checkOut: '14:30', status: 'Perlu Verifikasi' },
  { nim: '2415101055', name: 'Putu Bagus Mahendra', prodi: 'Teknik Informatika', faculty: 'FTK', checkIn: '08:10', checkOut: '16:50', status: 'Hadir' },
  { nim: '2315201044', name: 'Ni Komang Ayu Lestari', prodi: 'Sistem Informasi', faculty: 'FTK', checkIn: '08:30', checkOut: '16:30', status: 'Hadir' },
];

const STATUS_BADGE = {
  'Hadir': 'badge-success',
  'Belum Lengkap': 'badge-warning',
  'Tidak Hadir': 'badge-secondary',
  'Perlu Verifikasi': 'badge-danger',
};

export default function RecapPage() {
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');

  const filtered = DEMO_RECAP.filter(r => {
    const matchFilter = filter === 'Semua' || r.status === filter;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.nim.includes(search);
    return matchFilter && matchSearch;
  });

  const stats = {
    total: DEMO_RECAP.length,
    hadir: DEMO_RECAP.filter(r => r.status === 'Hadir').length,
    belumLengkap: DEMO_RECAP.filter(r => r.status === 'Belum Lengkap').length,
    tidakHadir: DEMO_RECAP.filter(r => r.status === 'Tidak Hadir').length,
    verifikasi: DEMO_RECAP.filter(r => r.status === 'Perlu Verifikasi').length,
  };

  return (
    <>
      <header className="top-header">
        <div>
          <div className="header-title">Rekap Kehadiran</div>
          <div className="header-breadcrumb">Status kehadiran final peserta berdasarkan scan masuk & keluar</div>
        </div>
        <div className="header-actions">
          <button id="btn-sync-sheet" className="btn btn-secondary btn-sm" onClick={() => alert('Sinkronisasi ke Spreadsheet akan aktif setelah Google Apps Script dikonfigurasi.')}>
            🔄 Sinkron ke Spreadsheet
          </button>
        </div>
      </header>

      <main className="page-container">
        {/* Summary cards */}
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {[
            { label: 'Total Peserta', value: stats.total, icon: '👥', type: 'primary' },
            { label: 'Hadir Lengkap', value: stats.hadir, icon: '✅', type: 'success' },
            { label: 'Belum Lengkap', value: stats.belumLengkap, icon: '⏳', type: 'warning' },
            { label: 'Tidak Hadir', value: stats.tidakHadir, icon: '❌', type: 'danger' },
            { label: 'Perlu Verifikasi', value: stats.verifikasi, icon: '🔍', type: 'warning' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.type}`}>
              <div className={`stat-icon ${s.type}`}><span style={{ fontSize: '18px' }}>{s.icon}</span></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="toolbar">
            <div className="search-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                id="recap-search"
                type="search"
                className="search-input"
                placeholder="Cari nama atau NIM..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Semua', 'Hadir', 'Belum Lengkap', 'Tidak Hadir', 'Perlu Verifikasi'].map(f => (
                <button
                  key={f}
                  id={`recap-filter-${f.replace(/ /g, '-').toLowerCase()}`}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIM</th>
                  <th>Nama</th>
                  <th>Prodi / Fakultas</th>
                  <th>Waktu Masuk</th>
                  <th>Waktu Keluar</th>
                  <th>Status Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.nim}>
                    <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>{r.nim}</td>
                    <td className="td-bold">{r.name}</td>
                    <td>{r.prodi}<br /><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.faculty}</span></td>
                    <td>
                      {r.checkIn ? <span style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '12px' }}>✓ {r.checkIn}</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {r.checkOut ? <span style={{ color: 'var(--color-info)', fontWeight: '600', fontSize: '12px' }}>✓ {r.checkOut}</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
