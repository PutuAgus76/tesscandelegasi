'use client';

export default function SettingsPage() {
  return (
    <>
      <header className="top-header">
        <div>
          <div className="header-title">Pengaturan Sistem</div>
          <div className="header-breadcrumb">Konfigurasi Google Spreadsheet dan persiapan sistem</div>
        </div>
      </header>

      <main className="page-container">
        {/* Spreadsheet Setup Guide */}
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Panduan Persiapan Google Spreadsheet</h1>
            <p className="page-subtitle">Ikuti langkah-langkah berikut agar sistem bisa menyimpan data presensi secara otomatis</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Step 1 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📝 Langkah 1 — Buat Google Spreadsheet</div>
            </div>
            <div className="step-guide">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <div className="step-title">Buka Google Sheets</div>
                  <div className="step-desc">Pergi ke <a href="https://sheets.google.com" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>sheets.google.com</a> dan login dengan akun Google.</div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <div className="step-title">Buat Spreadsheet Baru</div>
                  <div className="step-desc">Klik <strong>"Spreadsheet kosong"</strong> dan beri nama misalnya: <code style={{ background: 'rgba(79,142,247,0.1)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}>Presensi - Seminar Nasional TI 2026</code></div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <div className="step-title">Buat 3 Tab Sheet</div>
                  <div className="step-desc">Di bagian bawah, klik "+" untuk menambah sheet. Buat 3 sheet dengan nama persis:
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <code style={{ background: 'rgba(79,142,247,0.1)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace', display: 'block' }}>Master Peserta</code>
                      <code style={{ background: 'rgba(79,142,247,0.1)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace', display: 'block' }}>Log Scan</code>
                      <code style={{ background: 'rgba(79,142,247,0.1)', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace', display: 'block' }}>Rekap Kehadiran</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 - Headers */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🗂️ Langkah 2 — Isi Header Kolom</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SheetHeader
                name="Master Peserta (Baris 1)"
                columns={['NIM', 'Nama', 'Prodi', 'Fakultas', 'Jenis Peserta', 'Keterangan']}
              />
              <SheetHeader
                name="Log Scan (Baris 1)"
                columns={['Timestamp', 'Event ID', 'Nama Event', 'NIM', 'Nama', 'Jenis Scan', 'Device', 'Petugas', 'Raw QR', 'Status', 'Catatan']}
              />
              <SheetHeader
                name="Rekap Kehadiran (Baris 1)"
                columns={['NIM', 'Nama', 'Prodi', 'Fakultas', 'Waktu Masuk', 'Waktu Keluar', 'Status Kehadiran', 'Catatan']}
              />
            </div>
          </div>
        </div>

        {/* Step 3 - Apps Script */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">⚙️ Langkah 3 — Pasang Google Apps Script Web App</div>
            <span className="badge badge-warning">Penting</span>
          </div>
          <div className="info-box warning-box" style={{ marginBottom: '16px' }}>
            <span>⚠️</span>
            <span>Apps Script diperlukan agar sistem dapat menulis data ke Spreadsheet tanpa perlu service account. Ini cara termudah untuk MVP.</span>
          </div>
          <div className="step-guide">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <div className="step-title">Buka Apps Script dari Spreadsheet</div>
                <div className="step-desc">Di Spreadsheet Anda, klik menu <strong>Extensions → Apps Script</strong></div>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-title">Paste Script Berikut</div>
                <div className="step-desc">Hapus semua isi default, lalu paste kode di bawah ini:</div>
                <div style={{ marginTop: '10px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '14px', fontSize: '11px', fontFamily: 'monospace', color: '#7dd3fc', lineHeight: '1.6', border: '1px solid var(--color-border)' }}>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: '6px' }}>// Google Apps Script — PresensiKTM</div>
                  <div><span style={{ color: '#f472b6' }}>function</span> <span style={{ color: '#fb923c' }}>doPost</span>(e) {'{'}</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#a3e635' }}>const</span> data = JSON.<span style={{ color: '#fb923c' }}>parse</span>(e.postData.contents);</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#a3e635' }}>const</span> ss = SpreadsheetApp.<span style={{ color: '#fb923c' }}>getActiveSpreadsheet</span>();</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#a3e635' }}>const</span> sheet = ss.<span style={{ color: '#fb923c' }}>getSheetByName</span>(data.sheet);</div>
                  <div style={{ paddingLeft: '16px' }}>sheet.<span style={{ color: '#fb923c' }}>appendRow</span>(data.row);</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#f472b6' }}>return</span> ContentService.<span style={{ color: '#fb923c' }}>createTextOutput</span>(<span style={{ color: '#86efac' }}>'OK'</span>);</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">Deploy sebagai Web App</div>
                <div className="step-desc">
                  Klik <strong>Deploy → New deployment</strong><br />
                  • Type: <strong>Web App</strong><br />
                  • Execute as: <strong>Me</strong><br />
                  • Who has access: <strong>Anyone</strong><br />
                  Klik <strong>Deploy</strong> dan izinkan akses.
                </div>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <div className="step-title">Salin Web App URL</div>
                <div className="step-desc">Copy URL yang muncul (format: <code style={{ fontFamily: 'monospace', fontSize: '11px', background: 'rgba(79,142,247,0.1)', padding: '1px 5px', borderRadius: '3px' }}>https://script.google.com/macros/s/XXX/exec</code>) dan paste ke pengaturan sistem.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 - Connect */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">🔗 Langkah 4 — Hubungkan ke Sistem</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="apps-script-url">Google Apps Script Web App URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="apps-script-url"
                  type="url"
                  className="form-input"
                  placeholder="https://script.google.com/macros/s/xxxx/exec"
                />
                <button id="save-apps-script-url" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Simpan
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="spreadsheet-id">Google Spreadsheet ID</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="spreadsheet-id"
                  type="text"
                  className="form-input"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                />
                <button id="save-spreadsheet-id" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Simpan
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                ID ada pada URL Spreadsheet: docs.google.com/spreadsheets/d/<strong>[ID INI]</strong>/edit
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">✅ Checklist Persiapan</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { done: true, text: 'Google Spreadsheet dibuat dengan nama yang sesuai' },
              { done: true, text: 'Sheet "Master Peserta" dibuat dengan header kolom' },
              { done: true, text: 'Sheet "Log Scan" dibuat dengan header kolom' },
              { done: true, text: 'Sheet "Rekap Kehadiran" dibuat dengan header kolom' },
              { done: false, text: 'Google Apps Script dipasang dan di-deploy sebagai Web App' },
              { done: false, text: 'URL Apps Script disalin dan disimpan di pengaturan sistem' },
              { done: false, text: 'Spreadsheet ID disimpan di pengaturan sistem' },
              { done: false, text: 'Test scan manual berhasil tercatat di Spreadsheet' },
              { done: false, text: 'Master peserta diisi (manual atau import)' },
              { done: false, text: 'Event dibuat dan status diubah ke "Aktif"' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: item.done ? 'rgba(6, 214, 160, 0.05)' : 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${item.done ? 'rgba(6, 214, 160, 0.2)' : 'var(--color-border)'}`,
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.done ? '✅' : '⬜'}</span>
                <span style={{ fontSize: '13px', color: item.done ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function SheetHeader({ name, columns }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{name}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {columns.map((col, i) => (
          <div key={col} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 7px',
              fontSize: '11px',
              color: 'var(--color-text)',
              fontFamily: 'monospace',
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{col}</span>
            {i < columns.length - 1 && <span style={{ color: 'var(--color-border)', marginLeft: '2px' }}>·</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
