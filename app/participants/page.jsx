'use client';
import { useState } from 'react';

const DEMO_PARTICIPANTS = [
  { nim: '2415101041', name: 'I Putu Eka Wibawa', prodi: 'Teknik Informatika', faculty: 'FTK', type: 'Peserta Umum', notes: '' },
  { nim: '2315101022', name: 'Ni Luh Putu Ayu Sari', prodi: 'Sistem Informasi', faculty: 'FTK', type: 'Delegasi', notes: 'Delegasi dari HMJ SI' },
  { nim: '2215201013', name: 'I Gede Darmawan', prodi: 'Pendidikan IPA', faculty: 'FMIPA', type: 'Panitia', notes: 'Sie Acara' },
  { nim: '2115301008', name: 'Ni Made Dewi Anggraeni', prodi: 'Akuntansi', faculty: 'FE', type: 'Peserta Umum', notes: '' },
  { nim: '2315401031', name: 'I Wayan Surya Pratama', prodi: 'Manajemen', faculty: 'FE', type: 'Delegasi', notes: 'Delegasi BEM FE' },
  { nim: '2415101055', name: 'Putu Bagus Mahendra', prodi: 'Teknik Informatika', faculty: 'FTK', type: 'Panitia', notes: 'Sie IT' },
  { nim: '2315201044', name: 'Ni Komang Ayu Lestari', prodi: 'Sistem Informasi', faculty: 'FTK', type: 'Peserta Umum', notes: '' },
];

const TYPE_BADGE = {
  'Peserta Umum': 'badge-primary',
  'Delegasi': 'badge-info',
  'Panitia': 'badge-warning',
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState(DEMO_PARTICIPANTS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editP, setEditP] = useState(null);
  const [form, setForm] = useState({ nim: '', name: '', prodi: '', faculty: '', type: 'Peserta Umum', notes: '' });
  const [sheetUrl, setSheetUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const openCreate = () => {
    setEditP(null);
    setForm({ nim: '', name: '', prodi: '', faculty: '', type: 'Peserta Umum', notes: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditP(p);
    setForm({ ...p });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editP) {
      setParticipants(prev => prev.map(p => p.nim === editP.nim ? { ...form } : p));
    } else {
      setParticipants(prev => [...prev, { ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (nim) => {
    if (confirm(`Hapus peserta NIM ${nim}?`)) {
      setParticipants(prev => prev.filter(p => p.nim !== nim));
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    // Simulasi import (akan dihubungkan ke Google Apps Script)
    await new Promise(r => setTimeout(r, 2000));
    setImporting(false);
    setShowImportModal(false);
    alert('Simulasi import berhasil! Hubungkan dengan Google Apps Script untuk import nyata.');
  };

  const filtered = participants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nim.includes(search) ||
      p.prodi.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'Semua' || p.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <>
      <header className="top-header">
        <div>
          <div className="header-title">Master Peserta</div>
          <div className="header-breadcrumb">Data peserta yang terdaftar untuk event</div>
        </div>
        <div className="header-actions">
          <button id="btn-import-peserta" className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            📥 Import dari Spreadsheet
          </button>
          <button id="btn-add-peserta" className="btn btn-primary" onClick={openCreate}>
            ＋ Tambah Peserta
          </button>
        </div>
      </header>

      <main className="page-container">
        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['Semua', 'Peserta Umum', 'Delegasi', 'Panitia'].map(t => {
            const count = t === 'Semua' ? participants.length : participants.filter(p => p.type === t).length;
            return (
              <button
                key={t}
                id={`filter-type-${t.replace(/ /g, '-').toLowerCase()}`}
                className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTypeFilter(t)}
              >
                {t} <span className="badge badge-secondary" style={{ marginLeft: '4px', fontSize: '11px' }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="card">
          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                id="search-peserta-input"
                type="search"
                className="search-input"
                placeholder="Cari nama, NIM, atau prodi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="chip">Total: {filtered.length} peserta</div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIM</th>
                  <th>Nama Lengkap</th>
                  <th>Prodi / Fakultas</th>
                  <th>Jenis Peserta</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.nim}>
                    <td style={{ color: 'var(--color-text-muted)', width: '40px' }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
                      {p.nim}
                    </td>
                    <td className="td-bold">{p.name}</td>
                    <td>
                      {p.prodi}<br />
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.faculty}</span>
                    </td>
                    <td>
                      <span className={`badge ${TYPE_BADGE[p.type]}`}>{p.type}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {p.notes || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          id={`btn-edit-p-${p.nim}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(p)}
                        >✏️</button>
                        <button
                          id={`btn-del-p-${p.nim}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(p.nim)}
                          style={{ color: 'var(--color-danger)' }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">Belum ada peserta</div>
                <div className="empty-desc">Tambahkan peserta secara manual atau import dari Google Spreadsheet.</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editP ? '✏️ Edit Peserta' : '＋ Tambah Peserta'}</div>
              <button id="close-p-modal" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="p-nim">NIM *</label>
                    <input id="p-nim" type="text" className="form-input" placeholder="10 digit NIM" value={form.nim} onChange={e => setForm({...form, nim: e.target.value})} required disabled={!!editP} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="p-name">Nama Lengkap *</label>
                    <input id="p-name" type="text" className="form-input" placeholder="Nama lengkap peserta" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-prodi">Program Studi</label>
                    <input id="p-prodi" type="text" className="form-input" placeholder="Teknik Informatika" value={form.prodi} onChange={e => setForm({...form, prodi: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-faculty">Fakultas</label>
                    <select id="p-faculty" className="form-select" value={form.faculty} onChange={e => setForm({...form, faculty: e.target.value})}>
                      <option value="">Pilih Fakultas</option>
                      <option value="FTK">FTK</option>
                      <option value="FMIPA">FMIPA</option>
                      <option value="FE">FE</option>
                      <option value="FIP">FIP</option>
                      <option value="FBS">FBS</option>
                      <option value="FISH">FISH</option>
                      <option value="FOK">FOK</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-type">Jenis Peserta</label>
                    <select id="p-type" className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="Peserta Umum">Peserta Umum</option>
                      <option value="Delegasi">Delegasi</option>
                      <option value="Panitia">Panitia</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-notes">Keterangan</label>
                    <input id="p-notes" type="text" className="form-input" placeholder="Catatan tambahan" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button id="cancel-p-btn" type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button id="save-p-btn" type="submit" className="btn btn-primary">{editP ? 'Simpan' : 'Tambah Peserta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📥 Import dari Google Spreadsheet</div>
              <button id="close-import-modal" onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleImport}>
              <div className="modal-body">
                <div className="step-guide">
                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <div className="step-title">Buka Google Spreadsheet peserta</div>
                      <div className="step-desc">Pastikan sheet pertama bernama <strong>Master Peserta</strong> dengan header: NIM, Nama, Prodi, Fakultas, Jenis Peserta, Keterangan</div>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <div className="step-title">Salin link Spreadsheet</div>
                      <div className="step-desc">Klik Share → Copy link spreadsheet Anda</div>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <div className="step-title">Paste link di bawah dan import</div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sheet-url">URL Google Spreadsheet</label>
                  <input
                    id="sheet-url"
                    type="url"
                    className="form-input"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="info-box warning-box" style={{ fontSize: '12px' }}>
                  <span>⚠️</span>
                  <span>Import nyata memerlukan konfigurasi Google Apps Script Web App. Saat ini dalam mode simulasi.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button id="cancel-import-btn" type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Batal</button>
                <button id="submit-import-btn" type="submit" className="btn btn-primary" disabled={importing}>
                  {importing ? '⟳ Mengimport...' : '📥 Import Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
