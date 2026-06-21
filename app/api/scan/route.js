/**
 * API Route: POST /api/scan
 *
 * Bertindak sebagai proxy aman antara halaman scanner (client) dan
 * Google Apps Script Web App. Secret tidak pernah terekspos ke browser.
 *
 * Body yang diterima:
 *   rawQr      - string mentah hasil scan QR/barcode
 *   nim        - NIM yang sudah diekstrak (10 digit)
 *   jenisScan  - "masuk" | "keluar"
 *   eventId    - ID event yang sedang aktif
 *   eventName  - Nama event
 *   device     - "Laptop 1" .. "Laptop 4"
 *   petugas    - Nama petugas scan
 *   metode     - "scan" | "manual"
 *   catatan    - alasan jika metode = manual (opsional)
 *
 * Response JSON:
 *   { status: "berhasil"|"duplikat"|"tidak_terdaftar"|"error", ... }
 */

import { NextResponse } from 'next/server';

// Regex untuk mengambil NIM dari URL KTM Undiksha
const NIM_REGEX = /mahasiswa\.undiksha\.ac\.id\/(\d{8,12})/;

/**
 * Ekstrak NIM dari raw QR atau raw string angka.
 * Mengembalikan string NIM atau null jika tidak valid.
 */
function extractNIM(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const urlMatch = raw.trim().match(NIM_REGEX);
  if (urlMatch) return urlMatch[1];
  // Jika langsung angka 8-12 digit
  if (/^\d{8,12}$/.test(raw.trim())) return raw.trim();
  return null;
}

export async function POST(request) {
  // ── 1. Baca body dari frontend ──────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Request body tidak valid (bukan JSON).' },
      { status: 400 }
    );
  }

  const {
    rawQr = '',
    nim: nimFromClient,
    jenisScan,
    eventId = '',
    eventName = '',
    device = '',
    petugas = '',
    metode = 'scan',
    catatan = '',
  } = body;

  // ── 2. Validasi field wajib ─────────────────────────────────────────────
  if (!jenisScan || !['masuk', 'keluar'].includes(jenisScan)) {
    return NextResponse.json(
      { status: 'error', message: 'Field jenisScan wajib diisi: "masuk" atau "keluar".' },
      { status: 400 }
    );
  }

  // ── 3. Ekstraksi & validasi NIM ─────────────────────────────────────────
  // Prioritaskan NIM dari rawQr, fallback ke nimFromClient (input manual)
  const nim = extractNIM(rawQr) || extractNIM(nimFromClient);

  if (!nim) {
    return NextResponse.json({
      status: 'format_salah',
      message: 'QR/barcode tidak sesuai format KTM Undiksha atau NIM tidak valid.',
      rawQr,
    });
  }

  // ── 4. Cek konfigurasi env ──────────────────────────────────────────────
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  const apiSecret = process.env.PRESENSI_API_SECRET;

  // Dev mode: URL belum dikonfigurasi atau masih placeholder
  const isDevMode =
    !scriptUrl ||
    scriptUrl.trim() === '' ||
    scriptUrl.includes('ISI_DENGAN') ||
    scriptUrl.includes('YOUR_') ||
    !scriptUrl.startsWith('https://');

  if (isDevMode) {
    // Simulasi lokal — data tidak dikirim ke Spreadsheet
    return simulateResponse(nim, jenisScan, metode, device, petugas);
  }

  // ── 5. Teruskan ke Google Apps Script ───────────────────────────────────
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Makassar',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const payload = {
    secret: apiSecret,
    action: 'scan',
    nim,
    rawQr,
    jenisScan,
    eventId,
    eventName,
    device,
    petugas,
    metode,
    catatan,
    timestamp,
  };

  let scriptResponse;
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Timeout 8 detik agar tidak blocking terlalu lama
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Apps Script responded with HTTP ${res.status}`);
    }

    scriptResponse = await res.json();
  } catch (err) {
    console.error('[/api/scan] Gagal menghubungi Apps Script:', err.message);
    return NextResponse.json({
      status: 'error_koneksi',
      message: 'Gagal menghubungi Google Spreadsheet. Periksa koneksi internet atau URL Apps Script.',
      detail: err.message,
    });
  }

  // ── 6. Teruskan response dari Apps Script ke frontend ───────────────────
  return NextResponse.json(scriptResponse);
}

/**
 * Simulasi response untuk mode development (GOOGLE_SCRIPT_URL belum diisi).
 * Gunakan in-memory Set sebagai anti-duplikasi sementara.
 * CATATAN: Set ini ter-reset setiap kali server di-restart.
 */
const devScanLog = new Map(); // key: `${nim}-${jenisScan}` → timestamp

// Data master peserta demo (hanya untuk dev/simulasi)
const DEV_MASTER = {
  '2415101041': { nama: 'I Putu Eka Wibawa', prodi: 'Teknik Informatika', fakultas: 'FTK' },
  '2315101022': { nama: 'Ni Luh Putu Ayu Sari', prodi: 'Sistem Informasi', fakultas: 'FTK' },
  '2215201013': { nama: 'I Gede Darmawan', prodi: 'Pendidikan IPA', fakultas: 'FMIPA' },
  '2415101055': { nama: 'Putu Bagus Mahendra', prodi: 'Teknik Informatika', fakultas: 'FTK' },
  '2315201044': { nama: 'Ni Komang Ayu Lestari', prodi: 'Sistem Informasi', fakultas: 'FTK' },
  '2115301008': { nama: 'Ni Made Dewi Anggraeni', prodi: 'Akuntansi', fakultas: 'FE' },
  '2315401031': { nama: 'I Wayan Surya Pratama', prodi: 'Manajemen', fakultas: 'FE' },
};

function simulateResponse(nim, jenisScan, metode, device, petugas) {
  const peserta = DEV_MASTER[nim];

  if (!peserta) {
    return NextResponse.json({
      status: 'tidak_terdaftar',
      nim,
      message: `NIM ${nim} tidak ditemukan di Master Peserta. Pastikan NIM sudah diinput admin.`,
      dev_mode: true,
    });
  }

  const key = `${nim}-${jenisScan}`;
  if (devScanLog.has(key)) {
    const waktuSebelumnya = devScanLog.get(key);
    return NextResponse.json({
      status: 'duplikat',
      nim,
      nama: peserta.nama,
      prodi: peserta.prodi,
      fakultas: peserta.fakultas,
      jenisScan,
      waktuSebelumnya,
      message: `Peserta sudah melakukan scan ${jenisScan} pada pukul ${waktuSebelumnya}.`,
      dev_mode: true,
    });
  }

  const now = new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  devScanLog.set(key, now);

  // Tentukan status kehadiran
  const sudahMasuk = devScanLog.has(`${nim}-masuk`);
  const sudahKeluar = devScanLog.has(`${nim}-keluar`);
  let statusKehadiran = 'Belum Lengkap';
  if (sudahMasuk && sudahKeluar) statusKehadiran = 'Hadir';
  else if (!sudahMasuk && sudahKeluar) statusKehadiran = 'Perlu Verifikasi';

  return NextResponse.json({
    status: 'berhasil',
    nim,
    nama: peserta.nama,
    prodi: peserta.prodi,
    fakultas: peserta.fakultas,
    jenisScan,
    waktuScan: now,
    statusKehadiran,
    metode,
    device,
    petugas,
    message: `Presensi ${jenisScan} berhasil dicatat pada pukul ${now}.`,
    dev_mode: true,
  });
}
