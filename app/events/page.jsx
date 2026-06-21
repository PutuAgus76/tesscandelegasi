'use client';
import { useState } from 'react';

const DEMO_EVENTS = [
  {
    id: 'evt-001',
    name: 'Seminar Nasional Teknologi Informasi 2026',
    date: '2026-06-21',
    location: 'Aula Undiksha, Singaraja',
    organizer: 'Himpunan Mahasiswa TI',
    description: 'Seminar nasional tahunan bidang teknologi informasi.',
    status: 'Aktif',
    peserta: 120,
    sheet: 'https://docs.google.com/spreadsheets/d/xxx',
  },
  {
    id: 'evt-002',
    name: 'Wisuda Undiksha Periode II 2025/2026',
    date: '2026-07-15',
    location: 'Gedung Serba Guna Undiksha',
    organizer: 'Biro Akademik Undiksha',
    description: 'Upacara wisuda periode kedua tahun akademik 2025/2026.',
    status: 'Draft',
    peserta: 450,
    sheet: '',
  },
  {
    id: 'evt-003',
    name: 'Pelatihan Kepemimpinan BEM 2025',
    date: '2025-12-10',
    location: 'Ruang Rapat Gedung B',
    organizer: 'BEM Undiksha',
    description: 'Pelatihan kepemimpinan tahunan untuk pengurus BEM.',
    status: 'Selesai',
    peserta: 85,
    sheet: 'https://docs.google.com/spreadsheets/d/yyy',
  },
];

const STATUS_BADGE = {
  Aktif: 'badge-success',
  Draft: 'badge-warning',
  Selesai: 'badge-secondary',
};

export default function EventsPage() {
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({
    name: '', date: '', location: '', organizer: '', description: '', status: 'Draft', sheet: ''
  });

  const openCreate = () => {
    setEditEvent(null);
    setForm({ name: '', date: '', location: '', organizer: '', description: '', status: 'Draft', sheet: '' });
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditEvent(ev);
    setForm({ ...ev });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editEvent) {
      setEvents(prev => prev.map(ev => ev.id === editEvent.id ? { ...ev, ...form } : ev));
    } else {
      setEvents(prev => [...prev, { ...form, id: `evt-${Date.now()}`, peserta: 0 }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Hapus event ini?')) {
      setEvents(prev => prev.filter(ev => ev.id !== id));
    }
  };

  return (
    <>
      <header className="top-header">
        <div>
          <div className="header-title">Manajemen Event</div>
          <div className="header-breadcrumb">Kelola acara dan hubungkan dengan Google Spreadsheet</div>
        </div>
        <div className="header-actions">
          <button id="btn-create-event" className="btn btn-primary" onClick={openCreate}>
            ＋ Buat Event Baru
          </button>
        </div>
      </header>

      <main className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {events.map(ev => (
            <div key={ev.id} className="event-card">
              <div className="event-card-header">
                <div className="event-card-title">{ev.name}</div>
                <span className={`badge ${STATUS_BADGE[ev.status]}`}>{ev.status}</span>
              </div>

              <div className="event-card-meta">
                <div className="event-meta-row">📅 {new Date(ev.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div className="event-meta-row">📍 {ev.location}</div>
                <div className="event-meta-row">🏛️ {ev.organizer}</div>
                {ev.description && (
                  <div className="event-meta-row" style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '11px' }}>
                    {ev.description}
                  </div>
                )}
              </div>

              {/* Spreadsheet link */}
              {ev.sheet ? (
                <div className="info-box success-box" style={{ fontSize: '11px', padding: '8px 10px', marginBottom: '12px' }}>
                  <span>📊</span>
                  <div>
                    <strong>Spreadsheet terhubung</strong><br />
                    <a href={ev.sheet} target="_blank" rel="noopener" style={{ color: 'var(--color-accent)', fontSize: '11px' }}>Buka Google Spreadsheet ↗</a>
                  </div>
                </div>
              ) : (
                <div className="info-box warning-box" style={{ fontSize: '11px', padding: '8px 10px', marginBottom: '12px' }}>
                  <span>⚠️</span>
                  <span>Belum ada Google Spreadsheet yang dihubungkan.</span>
                </div>
              )}

              <div className="event-card-footer">
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="event-stat">
                    <div className="event-stat-value">{ev.peserta}</div>
                    <div className="event-stat-label">Peserta</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    id={`btn-edit-${ev.id}`}
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEdit(ev)}
                  >
                    ✏️ Edit
                  </button>
                  {ev.status !== 'Aktif' && (
                    <button
                      id={`btn-delete-${ev.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(ev.id)}
                      style={{ color: 'var(--color-danger)' }}
                    >
                      🗑️
                    </button>
                  )}
                  {ev.status === 'Aktif' && (
                    <a href="/scanner" className="btn btn-primary btn-sm">
                      📷 Scan
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            id="btn-add-event-card"
            className="event-card"
            onClick={openCreate}
            style={{
              border: '2px dashed var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              minHeight: '200px',
              background: 'transparent',
            }}
          >
            <span style={{ fontSize: '36px', opacity: 0.3 }}>＋</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>Buat Event Baru</span>
          </button>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editEvent ? '✏️ Edit Event' : '＋ Buat Event Baru'}</div>
              <button
                id="close-event-modal"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px' }}
              >✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-name">Nama Acara *</label>
                  <input id="ev-name" type="text" className="form-input" placeholder="Nama lengkap acara" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ev-date">Tanggal *</label>
                    <input id="ev-date" type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ev-status">Status</label>
                    <select id="ev-status" className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="Draft">Draft</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-location">Lokasi</label>
                  <input id="ev-location" type="text" className="form-input" placeholder="Lokasi acara" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-organizer">Penyelenggara</label>
                  <input id="ev-organizer" type="text" className="form-input" placeholder="Himpunan/BEM/Biro..." value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-desc">Deskripsi</label>
                  <textarea id="ev-desc" className="form-textarea" placeholder="Deskripsi singkat acara..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ev-sheet">Link Google Spreadsheet</label>
                  <input id="ev-sheet" type="url" className="form-input" placeholder="https://docs.google.com/spreadsheets/d/..." value={form.sheet} onChange={e => setForm({...form, sheet: e.target.value})} />
                </div>
                <div className="info-box" style={{ fontSize: '11px' }}>
                  <span>ℹ️</span>
                  <span>Pastikan Spreadsheet sudah disiapkan dengan 3 sheet: <strong>Master Peserta</strong>, <strong>Log Scan</strong>, dan <strong>Rekap Kehadiran</strong>.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button id="cancel-event-btn" type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button id="save-event-btn" type="submit" className="btn btn-primary">{editEvent ? 'Simpan Perubahan' : 'Buat Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
