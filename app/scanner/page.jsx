'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const NIM_URL_REGEX = /mahasiswa\.undiksha\.ac\.id\/(\d{8,12})/;
const NIM_BARE_REGEX = /^\d{8,12}$/;
const SCAN_COOLDOWN_MS = 2500; // delay antar scan agar tidak double-fire

const EVENTS = [
  { id: 'evt-001', name: 'Seminar Nasional TI 2026' },
  { id: 'evt-002', name: 'Wisuda Undiksha Periode II' },
  { id: 'evt-003', name: 'Pelatihan Kepemimpinan BEM' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function extractNIM(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const urlMatch = raw.trim().match(NIM_URL_REGEX);
  if (urlMatch) return urlMatch[1];
  if (NIM_BARE_REGEX.test(raw.trim())) return raw.trim();
  return null;
}

function nowTimeStr() {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function ScannerPage() {
  // Config state
  const [mode, setMode] = useState('masuk');
  const [device, setDevice] = useState('Laptop 1');
  const [officer, setOfficer] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(EVENTS[0]);

  // Camera state
  const [cameraStatus, setCameraStatus] = useState('idle'); // idle | starting | active | error
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // Scan state
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const cooldownRef = useRef(false);

  // Manual input state
  const [manualMode, setManualMode] = useState(false);
  const [manualNIM, setManualNIM] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Refs
  const html5QrRef = useRef(null);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try {
          if (html5QrRef.current.isScanning) {
            html5QrRef.current.stop().catch(() => {});
          }
        } catch { /* ignore */ }
      }
    };
  }, []);

  // ── Core scan handler — called by both QR reader callback and manual submit ─
  const handleScanResult = useCallback(async (rawQr, nimOverride, isManual, manualCatatan = '') => {
    // Cooldown guard — prevents rapid re-fires from QR reader
    if (cooldownRef.current || isProcessing) return;
    cooldownRef.current = true;
    setIsProcessing(true);

    const nim = nimOverride || extractNIM(rawQr);

    // Immediate UI: format salah
    if (!nim) {
      setScanResult({
        type: 'error',
        icon: '❌',
        status: 'Format Tidak Valid',
        message: 'QR/barcode tidak sesuai format KTM Undiksha. Coba input manual.',
        raw: rawQr,
        time: nowTimeStr(),
      });
      setIsProcessing(false);
      setTimeout(() => { cooldownRef.current = false; }, SCAN_COOLDOWN_MS);
      return;
    }

    // Show "loading" state while API responds
    setScanResult({
      type: 'loading',
      icon: '⏳',
      status: 'Memproses...',
      message: `Mengirim data ke Spreadsheet...`,
      nim,
      time: nowTimeStr(),
    });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawQr: rawQr || '',
          nim,
          jenisScan: mode,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          device,
          petugas: officer || 'Petugas',
          metode: isManual ? 'manual' : 'scan',
          catatan: manualCatatan,
        }),
      });

      const data = await res.json();
      applyAPIResponse(data, nim, isManual);
    } catch (err) {
      setScanResult({
        type: 'error',
        icon: '🌐',
        status: 'Error Koneksi',
        message: 'Gagal menghubungi server. Periksa koneksi internet.',
        nim,
        time: nowTimeStr(),
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => { cooldownRef.current = false; }, SCAN_COOLDOWN_MS);
    }
  }, [mode, device, officer, selectedEvent, isProcessing]);

  // ── Terjemahkan response API menjadi UI state ──────────────────────────────
  function applyAPIResponse(data, nim, isManual) {
    const time = nowTimeStr();

    if (data.status === 'berhasil') {
      const result = {
        type: 'success',
        icon: mode === 'masuk' ? '✅' : '🚪',
        status: mode === 'masuk' ? 'Presensi Masuk Berhasil!' : 'Presensi Keluar Berhasil!',
        message: data.message || `Data tersimpan pukul ${time}`,
        nim: data.nim || nim,
        name: data.nama || '—',
        prodi: data.prodi,
        faculty: data.fakultas,
        statusKehadiran: data.statusKehadiran,
        time,
        isManual,
        devMode: !!data.dev_mode,
      };
      setScanResult(result);
      addToHistory({ ...result, type: mode, status: 'success' });
    } else if (data.status === 'duplikat') {
      const result = {
        type: 'warning',
        icon: '⚠️',
        status: mode === 'masuk' ? 'Sudah Scan Masuk' : 'Sudah Scan Keluar',
        message: data.message || `Peserta sudah scan ${mode} sebelumnya.`,
        nim: data.nim || nim,
        name: data.nama || '—',
        prodi: data.prodi,
        faculty: data.fakultas,
        waktuSebelumnya: data.waktuSebelumnya,
        time,
        isManual,
        devMode: !!data.dev_mode,
      };
      setScanResult(result);
      addToHistory({ ...result, type: mode, status: 'warning' });
    } else if (data.status === 'tidak_terdaftar') {
      setScanResult({
        type: 'error',
        icon: '🚫',
        status: 'NIM Tidak Terdaftar',
        message: data.message || `NIM ${nim} tidak ada di Master Peserta event ini.`,
        nim,
        time,
        isManual,
        devMode: !!data.dev_mode,
      });
    } else if (data.status === 'format_salah') {
      setScanResult({
        type: 'error',
        icon: '❌',
        status: 'Format QR Salah',
        message: data.message || 'QR tidak sesuai format KTM Undiksha.',
        time,
        isManual,
      });
    } else if (data.status === 'error_koneksi') {
      setScanResult({
        type: 'error',
        icon: '🌐',
        status: 'Error Koneksi Spreadsheet',
        message: data.message || 'Gagal menghubungi Google Spreadsheet.',
        time,
        isManual,
      });
    } else {
      setScanResult({
        type: 'error',
        icon: '⚠️',
        status: 'Error',
        message: data.message || 'Terjadi kesalahan tidak diketahui.',
        time,
        isManual,
      });
    }
  }

  function addToHistory(item) {
    setHistory(prev => [item, ...prev].slice(0, 10));
  }

  // ── Camera controls ────────────────────────────────────────────────────────
  const startScanner = async (deviceIdToStart = null) => {
    setCameraStatus('starting');
    setCameraError('');
    setScanResult(null);

    // Insecure context check
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCameraError('Kamera hanya bisa digunakan di localhost atau HTTPS.');
      setCameraStatus('error');
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error(), { name: 'NotSupportedError' });
      }

      const { Html5Qrcode } = await import('html5-qrcode');

      // Get list of available cameras
      let devices = [];
      try {
        devices = await Html5Qrcode.getCameras();
        setCameras(devices);
      } catch (camErr) {
        console.warn('Gagal mendapatkan list kamera:', camErr);
      }

      // Determine which device to use
      let deviceId = deviceIdToStart || selectedCameraId;
      if (devices.length > 0) {
        const exists = devices.some(d => d.id === deviceId);
        if (!deviceId || !exists) {
          deviceId = devices[0].id;
          setSelectedCameraId(devices[0].id);
        }
      }

      const qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = qr;

      const cameraConfig = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'environment' };

      await qr.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR berhasil terbaca — panggil handler
          handleScanResult(decodedText, null, false);
        },
        () => {} // suppress frame-level errors
      );

      setCameraStatus('active');
    } catch (err) {
      console.error('Error starting camera:', err);
      let msg = 'Gagal mengaktifkan kamera.';
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        msg = 'Kamera hanya bisa digunakan di localhost atau HTTPS.';
      } else {
        const name = err.name || '';
        const message = err.message || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || message.includes('denied') || message.includes('dismissed')) {
          msg = 'Izin kamera ditolak. Aktifkan izin kamera di browser.';
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || message.includes('found')) {
          msg = 'Kamera tidak ditemukan.';
        } else if (name === 'NotReadableError' || name === 'TrackStartError' || message.includes('readable') || message.includes('use')) {
          msg = 'Kamera sedang digunakan aplikasi lain.';
        } else if (name === 'NotSupportedError') {
          msg = 'Browser tidak mendukung akses kamera. Gunakan Chrome, Firefox, atau Edge versi terbaru via HTTPS.';
        }
      }
      setCameraError(msg);
      setCameraStatus('error');
      if (html5QrRef.current) {
        try {
          if (html5QrRef.current.isScanning) {
            await html5QrRef.current.stop();
          }
        } catch { /* ignore */ }
        html5QrRef.current = null;
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
      } catch { /* ignore */ }
      html5QrRef.current = null;
    }
    setCameraStatus('idle');
  };

  const handleCameraChange = async (deviceId) => {
    setSelectedCameraId(deviceId);
    if (cameraStatus === 'active') {
      await stopScanner();
      await startScanner(deviceId);
    }
  };

  // ── Manual input submit ────────────────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualNIM.trim() || !manualReason) return;
    setManualLoading(true);
    const input = manualNIM.trim();
    await handleScanResult(input, extractNIM(input), true, manualReason);
    setManualLoading(false);
    setManualNIM('');
    setManualReason('');
    setManualMode(false);
  };

  // ── Derived UI ─────────────────────────────────────────────────────────────
  const isActive = cameraStatus === 'active';
  const isStarting = cameraStatus === 'starting';

  const resultBorderClass =
    scanResult?.type === 'success' ? 'result-success' :
    scanResult?.type === 'warning' ? 'result-warning' :
    scanResult?.type === 'error'   ? 'result-error'   : '';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ── */}
      <header className="top-header">
        <div>
          <div className="header-title">Scanner Presensi</div>
          <div className="header-breadcrumb">Scan KTM mahasiswa untuk mencatat kehadiran</div>
        </div>
        <div className="header-actions">
          <div className={`mode-badge ${mode}`}>
            {mode === 'masuk' ? '↓ Scan Masuk' : '↑ Scan Keluar'}
          </div>
          {isActive && (
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 7, height: 7, background: 'currentColor', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s ease infinite' }} />
              Kamera Aktif
            </span>
          )}
        </div>
      </header>

      <main className="page-container" style={{ paddingBottom: '24px' }}>

        {/* ── Config bar ── */}
        <div className="scanner-config-bar" style={{ marginBottom: '14px' }}>
          <div className="config-item">
            <span className="config-label">Event:</span>
            <select
              id="select-event"
              className="form-select"
              value={selectedEvent.id}
              onChange={e => setSelectedEvent(EVENTS.find(ev => ev.id === e.target.value))}
              disabled={isActive}
              style={{ fontSize: '12px', padding: '5px 8px' }}
            >
              {EVENTS.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
          <div className="config-item">
            <span className="config-label">Device:</span>
            <select
              id="select-device"
              className="form-select"
              value={device}
              onChange={e => setDevice(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px' }}
            >
              {['Laptop 1', 'Laptop 2', 'Laptop 3', 'Laptop 4'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="config-item" style={{ flex: 2 }}>
            <span className="config-label">Petugas:</span>
            <input
              id="input-officer"
              type="text"
              className="form-input"
              placeholder="Nama petugas scan..."
              value={officer}
              onChange={e => setOfficer(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px' }}
            />
          </div>
        </div>

        {/* ── Mode toggle ── */}
        <div className="mode-toggle" style={{ marginBottom: '14px' }}>
          <button
            id="btn-mode-masuk"
            className={`mode-btn ${mode === 'masuk' ? 'masuk-active' : 'inactive'}`}
            onClick={() => { setMode('masuk'); setScanResult(null); }}
            disabled={isActive}
          >
            ↓ SCAN MASUK
          </button>
          <button
            id="btn-mode-keluar"
            className={`mode-btn ${mode === 'keluar' ? 'keluar-active' : 'inactive'}`}
            onClick={() => { setMode('keluar'); setScanResult(null); }}
            disabled={isActive}
          >
            ↑ SCAN KELUAR
          </button>
        </div>

        {/* ── Main layout: camera + side panel ── */}
        <div className="scanner-layout" style={{ height: 'auto' }}>

          {/* Left: camera viewport */}
          <div className="scanner-main">

            {/* Camera select (hanya tampil jika ada >1 kamera) */}
            {cameras.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="config-label">Kamera:</span>
                <select
                  id="select-camera"
                  className="form-select"
                  value={selectedCameraId}
                  onChange={e => handleCameraChange(e.target.value)}
                  disabled={isStarting}
                  style={{ fontSize: '12px', padding: '5px 8px', flex: 1 }}
                >
                  {cameras.map((cam, i) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Kamera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Viewport */}
            <div
              className="scanner-viewport"
              style={{
                minHeight: 360,
                flex: 1,
                borderColor: isActive
                  ? (mode === 'masuk' ? 'rgba(6,214,160,0.5)' : 'rgba(239,68,68,0.5)')
                  : undefined,
                position: 'relative',
              }}
            >
              {/* Glow ring when active */}
              {isActive && (
                <div className="glow-ring" style={{
                  borderColor: mode === 'masuk' ? 'var(--color-accent)' : 'var(--color-danger)',
                }} />
              )}

              {/* QR reader mount point — ALWAYS rendered and visible in layout, never display:none during init */}
              <div
                id="qr-reader"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '360px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              />

              {/* Overlay for Idle, Starting, and Error states */}
              {cameraStatus !== 'active' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  zIndex: 5,
                  borderRadius: 'var(--radius-lg)',
                }}>
                  {/* Idle state */}
                  {cameraStatus === 'idle' && (
                    <div className="scanner-idle">
                      <div className="scanner-idle-icon">📷</div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        Preview kamera akan muncul di sini.
                      </p>
                      <p style={{ maxWidth: 240, fontSize: '12px' }}>
                        Tekan tombol di bawah untuk mengaktifkan webcam dan mulai scan KTM.
                      </p>
                      <button
                        id="btn-start-scan"
                        className={`btn btn-lg ${mode === 'masuk' ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => startScanner()}
                        style={{ marginTop: 14 }}
                      >
                        📷 Mulai Kamera
                      </button>
                    </div>
                  )}

                  {/* Starting spinner */}
                  {isStarting && (
                    <div className="scanner-idle">
                      <span style={{ fontSize: 36, animation: 'spin 1s linear infinite', display: 'inline-block', color: 'var(--color-primary)' }}>⟳</span>
                      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Mengaktifkan kamera...</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Mencoba mengakses webcam Anda</p>
                    </div>
                  )}

                  {/* Error state */}
                  {cameraStatus === 'error' && (
                    <div className="scanner-idle">
                      <div className="scanner-idle-icon" style={{ opacity: 1, fontSize: 42 }}>🚫</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger)', maxWidth: 300, textAlign: 'center' }}>
                        {cameraError}
                      </p>
                      <button
                        id="btn-retry-camera"
                        className="btn btn-secondary"
                        onClick={() => startScanner()}
                        style={{ marginTop: 14 }}
                      >
                        🔄 Coba Lagi
                      </button>
                      <button
                        id="btn-manual-from-error"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setManualMode(true)}
                        style={{ marginTop: 6 }}
                      >
                        ✏️ Scan Manual (Input)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Processing overlay */}
              {isProcessing && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 10,
                  zIndex: 10,
                }}>
                  <span style={{ fontSize: 32, animation: 'spin 0.8s linear infinite', display: 'inline-block', color: 'var(--color-primary)' }}>⟳</span>
                  <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>Menyimpan ke Spreadsheet...</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10 }}>
              {isActive ? (
                <button
                  id="btn-stop-scan"
                  className="btn btn-danger"
                  onClick={stopScanner}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  ⏹ Hentikan Kamera
                </button>
              ) : (
                cameraStatus !== 'starting' && (
                  <button
                    id="btn-start-scan-bottom"
                    className={`btn ${mode === 'masuk' ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => startScanner()}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    📷 Mulai Kamera
                  </button>
                )
              )}
              <button
                id="btn-manual-input"
                className="btn btn-secondary"
                onClick={() => setManualMode(true)}
              >
                ✏️ Scan Manual
              </button>
            </div>

            {/* Info box dev mode */}
            {!isActive && cameraStatus !== 'error' && (
              <div className="info-box" style={{ fontSize: 12 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <strong>Test tanpa kamera:</strong> Gunakan <strong>Input Manual</strong> dan ketik URL
                  {' '}<code style={{ background: 'rgba(79,142,247,0.12)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>
                    https://mahasiswa.undiksha.ac.id/2415101041
                  </code>{' '}
                  atau langsung NIM 10 digit.
                </div>
              </div>
            )}
          </div>

          {/* Right: result + history */}
          <div className="scanner-side">

            {/* Scan result card */}
            <div className={`scan-result-card ${resultBorderClass}`}>
              <div className="result-header">
                <div className={`result-icon ${scanResult?.type === 'loading' ? 'idle' : (scanResult?.type || 'idle')}`}>
                  <span style={{
                    fontSize: 22,
                    display: 'inline-block',
                    animation: scanResult?.type === 'loading' ? 'spin 1s linear infinite' : undefined,
                  }}>
                    {scanResult?.icon || '📋'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className={`result-status ${scanResult?.type === 'loading' ? '' : (scanResult?.type || '')}`}>
                    {scanResult?.status || 'Menunggu Scan...'}
                  </div>
                  <div className="result-time">
                    {scanResult?.time ? `Pukul ${scanResult.time}` : 'Arahkan KTM ke kamera atau input manual'}
                  </div>
                  {scanResult?.devMode && (
                    <span className="badge badge-info" style={{ fontSize: 9, marginTop: 4 }}>DEV MODE — belum ke Spreadsheet</span>
                  )}
                </div>
              </div>

              {scanResult?.nim && (
                <div className="result-student">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="result-nim">NIM: {scanResult.nim}</div>
                      <div className="result-name">{scanResult.name || '—'}</div>
                      {scanResult.prodi && (
                        <div className="result-prodi">{scanResult.prodi} — {scanResult.faculty}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {scanResult.isManual && (
                        <span className="badge badge-warning" style={{ fontSize: 10 }}>MANUAL</span>
                      )}
                      {scanResult.statusKehadiran && (
                        <span className={`badge ${
                          scanResult.statusKehadiran === 'Hadir' ? 'badge-success' :
                          scanResult.statusKehadiran === 'Perlu Verifikasi' ? 'badge-danger' : 'badge-warning'
                        }`} style={{ fontSize: 10 }}>
                          {scanResult.statusKehadiran}
                        </span>
                      )}
                    </div>
                  </div>
                  {scanResult.waktuSebelumnya && (
                    <div style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 6 }}>
                      ⚠️ Sebelumnya scan pukul {scanResult.waktuSebelumnya}
                    </div>
                  )}
                </div>
              )}

              {scanResult?.message && scanResult?.type !== 'loading' && (
                <div className="result-message">{scanResult.message}</div>
              )}
            </div>

            {/* History card */}
            <div className="history-card">
              <div className="card-header" style={{ marginBottom: 10 }}>
                <div className="card-title" style={{ fontSize: 13 }}>🕐 Riwayat Scan</div>
                <span className="badge badge-secondary">{history.length}</span>
              </div>

              {history.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>
                  <div className="empty-icon" style={{ fontSize: 28 }}>📭</div>
                  <div className="empty-desc">Belum ada scan pada sesi ini</div>
                </div>
              ) : (
                <ul className="history-list">
                  {history.map((item, i) => (
                    <li key={i} className="history-item">
                      <div className={`history-dot ${item.status}`} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="history-nim">{item.nim}</div>
                        <div className="history-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                          {item.isManual && <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--color-warning)' }}>MANUAL</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="history-time">{item.time}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: item.type === 'masuk' ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                          {item.type === 'masuk' ? '↓ MASUK' : '↑ KELUAR'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal Input Manual ── */}
      {manualMode && (
        <div className="modal-overlay" onClick={() => { if (!manualLoading) setManualMode(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">✏️ Input Manual NIM</div>
              <button
                id="close-manual-modal"
                onClick={() => { if (!manualLoading) setManualMode(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 18 }}
                disabled={manualLoading}
              >✕</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                <div className="info-box warning-box">
                  <span>⚠️</span>
                  <span>
                    Input manual digunakan jika QR tidak terbaca.
                    Setiap input manual akan diberi label <strong>MANUAL</strong> pada log untuk keperluan audit.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-nim-input">NIM atau URL KTM</label>
                  <input
                    id="manual-nim-input"
                    type="text"
                    className="form-input"
                    placeholder="2415101041  atau  https://mahasiswa.undiksha.ac.id/2415101041"
                    value={manualNIM}
                    onChange={e => setManualNIM(e.target.value)}
                    autoFocus
                    disabled={manualLoading}
                  />
                  {manualNIM && !extractNIM(manualNIM) && (
                    <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4 }}>
                      ⚠️ Format NIM/URL tidak dikenali
                    </div>
                  )}
                  {manualNIM && extractNIM(manualNIM) && (
                    <div style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 4 }}>
                      ✓ NIM terdeteksi: <strong>{extractNIM(manualNIM)}</strong>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-reason">Alasan Input Manual *</label>
                  <select
                    id="manual-reason"
                    className="form-select"
                    value={manualReason}
                    onChange={e => setManualReason(e.target.value)}
                    required
                    disabled={manualLoading}
                  >
                    <option value="">Pilih alasan...</option>
                    <option value="QR rusak">QR/Barcode rusak atau tidak terbaca</option>
                    <option value="KTM basah">KTM basah/lecet</option>
                    <option value="Tidak bawa KTM">Peserta tidak membawa KTM</option>
                    <option value="Kamera bermasalah">Kamera bermasalah</option>
                    <option value="QR tidak terbaca kamera">QR tidak terbaca kamera (perlu jarak/cahaya)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Mode info */}
                <div className={`info-box ${mode === 'masuk' ? 'success-box' : ''}`} style={{ background: mode === 'masuk' ? undefined : 'rgba(239,68,68,0.07)', borderColor: mode === 'keluar' ? 'rgba(239,68,68,0.25)' : undefined }}>
                  <span>{mode === 'masuk' ? '↓' : '↑'}</span>
                  <span>
                    Akan dicatat sebagai <strong>Scan {mode === 'masuk' ? 'Masuk' : 'Keluar'}</strong>{' '}
                    pada event <strong>{selectedEvent.name}</strong> — {device}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  id="cancel-manual-btn"
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setManualMode(false)}
                  disabled={manualLoading}
                >
                  Batal
                </button>
                <button
                  id="submit-manual-btn"
                  type="submit"
                  className={`btn ${mode === 'masuk' ? 'btn-success' : 'btn-danger'}`}
                  disabled={!manualNIM.trim() || !manualReason || !extractNIM(manualNIM) || manualLoading}
                >
                  {manualLoading ? (
                    <><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Menyimpan...</>
                  ) : (
                    mode === 'masuk' ? '↓ Catat Masuk' : '↑ Catat Keluar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
