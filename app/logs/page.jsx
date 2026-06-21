'use client';
import { useState } from 'react';

const DEMO_LOGS = [
  { id: 1, timestamp: '2026-06-21 08:02:14', event: 'Seminar Nasional TI 2026', nim: '2415101041', name: 'I Putu Eka Wibawa', type: 'masuk', device: 'Laptop 1', officer: 'Putu Arya', raw: 'https://mahasiswa.undiksha.ac.id/2415101041', status: 'Berhasil', notes: '', manual: false },
  { id: 2, timestamp: '2026-06-21 08:15:33', event: 'Seminar Nasional TI 2026', nim: '2315101022', name: 'Ni Luh Putu Ayu Sari', type: 'masuk', device: 'Laptop 2', officer: 'Made Sari', raw: 'https://mahasiswa.undiksha.ac.id/2315101022', status: 'Berhasil', notes: '', manual: false },
  { id: 3, timestamp: '2026-06-21 08:17:05', event: 'Seminar Nasional TI 2026', nim: '2415101041', name: 'I Putu Eka Wibawa', type: 'masuk', device: 'Laptop 1', officer: 'Putu Arya', raw: 'https://mahasiswa.undiksha.ac.id/2415101041', status: 'Duplikat', notes: 'Sudah scan masuk sebelumnya', manual: false },
  { id: 4, timestamp: '2026-06-21 08:30:22', event: 'Seminar Nasional TI 2026', nim: '9999999999', name: '—', type: 'masuk', device: 'Laptop 3', officer: 'Kadek Ari', raw: 'https://mahasiswa.undiksha.ac.id/9999999999', status: 'Tidak Terdaftar', notes: '', manual: false },
  { id: 5, timestamp: '2026-06-21 08:45:11', event: 'Seminar Nasional TI 2026', nim: '2215201013', name: 'I Gede Darmawan', type: 'masuk', device: 'Laptop 2', officer: 'Made Sari', raw: '2215201013', status: 'Berhasil', notes: 'QR rusak, input manual', manual: true },
  { id: 6, timestamp: '2026-06-21 16:45:58', event: 'Seminar Nasional TI 2026', nim: '2415101041', name: 'I Putu Eka Wibawa', type: 'keluar', device: 'Laptop 1', officer: 'Putu Arya', raw: 'https://mahasiswa.undiksha.ac.id/2415101041', status: 'Berhasil', notes: '', manual: false },
];

const STATUS_BADGE = {
  'Berhasil': 'badge-success',
  'Duplikat': 'badge-warning',
  'Tidak Terdaftar': 'badge-danger',
  'Error': 'badge-danger',
};

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');

  const filtered = DEMO_LOGS.filter(log => {
    const matchSearch = log.nim.includes(search) ||
      log.name.toLowerCase().includes(search.toLowerCase()) ||
      log.officer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || log.status === statusFilter;
    const matchType = typeFilter === 'Semua' || log.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <>
      <header className="top-header">
        <div>
          <div className="header-title">Log Scan</div>
          <div className="header-breadcrumb">Audit trail semua aktivitas scan presensi</div>
        </div>
        <div className="header-actions">
          <a id="btn-export-log" href="#" className="btn btn-secondary btn-sm" onClick={e => { e.preventDefault(); alert('Export ke Spreadsheet akan aktif setelah koneksi Google Sheets dikonfigurasi.'); }}>
            📤 Export ke Spreadsheet
          </a>
        </div>
      </header>

      <main className="page-container">
        {/* Filter bar */}
        <div className="toolbar">
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              id="search-log"
              type="search"
              className="search-input"
              placeholder="Cari NIM, nama, atau petugas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Semua', 'Berhasil', 'Duplikat', 'Tidak Terdaftar'].map(s => (
              <button
                key={s}
                id={`log-filter-status-${s.replace(/ /g, '-').toLowerCase()}`}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(s)}
              >{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Semua', 'masuk', 'keluar'].map(t => (
              <button
                key={t}
                id={`log-filter-type-${t}`}
                className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTypeFilter(t)}
              >{t === 'Semua' ? 'Semua Mode' : t === 'masuk' ? '↓ Masuk' : '↑ Keluar'}</button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Riwayat Scan</div>
            <span className="badge badge-secondary">{filtered.length} entri</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>NIM</th>
                  <th>Nama</th>
                  <th>Mode</th>
                  <th>Device</th>
                  <th>Petugas</th>
                  <th>Status</th>
                  <th>Input</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
                      {log.nim}
                    </td>
                    <td className="td-bold">{log.name !== '—' ? log.name : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${log.type === 'masuk' ? 'badge-success' : 'badge-danger'}`}>
                        {log.type === 'masuk' ? '↓ Masuk' : '↑ Keluar'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{log.device}</td>
                    <td style={{ fontSize: '12px' }}>{log.officer}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[log.status] || 'badge-secondary'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>
                      {log.manual ? (
                        <span className="badge badge-warning" style={{ fontSize: '10px' }}>MANUAL</span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '10px' }}>SCAN</span>
                      )}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)', maxWidth: '150px' }}>
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📜</div>
                <div className="empty-title">Tidak ada log</div>
                <div className="empty-desc">Tidak ada data log yang cocok dengan filter.</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
