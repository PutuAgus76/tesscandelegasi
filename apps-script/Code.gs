/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Google Apps Script — PresensiKTM Web App                       ║
 * ║  Versi: 1.0.0                                                    ║
 * ║  Paste script ini ke: Spreadsheet → Extensions → Apps Script    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * CARA DEPLOY:
 *  1. Buka Spreadsheet → Extensions → Apps Script
 *  2. Hapus semua kode default, paste seluruh file ini
 *  3. Ganti nilai PRESENSI_SECRET di bawah dengan string acak yang SAMA
 *     dengan PRESENSI_API_SECRET di file .env.local
 *  4. Klik Deploy → New deployment
 *     - Type        : Web App
 *     - Execute as  : Me
 *     - Who can access : Anyone
 *  5. Copy URL → paste ke GOOGLE_SCRIPT_URL di .env.local
 */

// ──────────────────────────────────────────────────────────────────────────────
// KONFIGURASI — WAJIB DIUBAH
// ──────────────────────────────────────────────────────────────────────────────

/** Harus sama persis dengan PRESENSI_API_SECRET di .env.local */
const PRESENSI_SECRET = 'ISI_DENGAN_SECRET_YANG_SAMA';

/** Nama sheet (tab) di Spreadsheet — harus sama persis huruf besar/kecilnya */
const SHEET = {
  MASTER: 'Master Peserta',
  LOG:    'Log Scan',
  REKAP:  'Rekap Kehadiran',
};

// ──────────────────────────────────────────────────────────────────────────────
// ENTRY POINT — dipanggil oleh Next.js API route
// ──────────────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── Validasi secret ──────────────────────────────────────────────────────
    if (!data.secret || data.secret !== PRESENSI_SECRET) {
      return jsonResponse({ status: 'error', message: 'Unauthorized: secret tidak cocok.' }, 403);
    }

    // ── Route berdasarkan action ─────────────────────────────────────────────
    switch (data.action) {
      case 'scan':
        return handleScan(data);
      case 'getMaster':
        return handleGetMaster(data);
      default:
        return jsonResponse({ status: 'error', message: `Action tidak dikenal: ${data.action}` });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Server error: ' + err.message });
  }
}

// Izinkan GET untuk health-check (opsional)
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'PresensiKTM Apps Script aktif.' });
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION: SCAN
// ──────────────────────────────────────────────────────────────────────────────

function handleScan(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEET.MASTER);
  const logSheet    = ss.getSheetByName(SHEET.LOG);
  const rekapSheet  = ss.getSheetByName(SHEET.REKAP);

  if (!masterSheet || !logSheet || !rekapSheet) {
    return jsonResponse({
      status: 'error',
      message: 'Sheet tidak ditemukan. Pastikan nama sheet: "Master Peserta", "Log Scan", "Rekap Kehadiran".',
    });
  }

  const nim       = (data.nim || '').toString().trim();
  const jenisScan = (data.jenisScan || '').toLowerCase(); // masuk / keluar
  const timestamp = data.timestamp || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
  const eventId   = data.eventId   || '';
  const eventName = data.eventName || '';
  const device    = data.device    || '';
  const petugas   = data.petugas   || '';
  const metode    = data.metode    || 'scan';
  const catatan   = data.catatan   || '';
  const rawQr     = data.rawQr     || nim;

  if (!nim) {
    return jsonResponse({ status: 'error', message: 'NIM kosong.' });
  }

  // ── 1. Cari peserta di Master Peserta ────────────────────────────────────
  const masterData = masterSheet.getDataRange().getValues();
  // Baris 0 = header: NIM | Nama | Prodi | Fakultas | Jenis Peserta | Keterangan
  let peserta = null;
  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][0].toString().trim() === nim) {
      peserta = {
        nim:       masterData[i][0].toString().trim(),
        nama:      masterData[i][1] || '',
        prodi:     masterData[i][2] || '',
        fakultas:  masterData[i][3] || '',
        jenis:     masterData[i][4] || '',
        keterangan:masterData[i][5] || '',
      };
      break;
    }
  }

  if (!peserta) {
    // Catat ke log sebagai "Tidak Terdaftar"
    logSheet.appendRow([
      timestamp, eventId, eventName, nim, '—', jenisScan,
      device, petugas, rawQr, 'Tidak Terdaftar', catatan || 'NIM tidak ada di Master Peserta',
    ]);
    return jsonResponse({
      status: 'tidak_terdaftar',
      nim,
      message: `NIM ${nim} tidak ditemukan di sheet Master Peserta event ini.`,
    });
  }

  // ── 2. Cek duplikasi di Rekap Kehadiran ──────────────────────────────────
  const rekapData = rekapSheet.getDataRange().getValues();
  // Header: NIM | Nama | Prodi | Fakultas | Waktu Masuk | Waktu Keluar | Status Kehadiran | Catatan
  let rekapRowIndex = -1;
  let rekapRow = null;
  for (let i = 1; i < rekapData.length; i++) {
    if (rekapData[i][0].toString().trim() === nim) {
      rekapRowIndex = i + 1; // 1-indexed untuk Sheets API
      rekapRow = rekapData[i];
      break;
    }
  }

  const sudahMasuk  = rekapRow && rekapRow[4] && rekapRow[4].toString().trim() !== '';
  const sudahKeluar = rekapRow && rekapRow[5] && rekapRow[5].toString().trim() !== '';

  // Deteksi duplikasi
  if (jenisScan === 'masuk' && sudahMasuk) {
    logSheet.appendRow([
      timestamp, eventId, eventName, nim, peserta.nama, jenisScan,
      device, petugas, rawQr, 'Duplikat', 'Sudah scan masuk sebelumnya',
    ]);
    return jsonResponse({
      status: 'duplikat',
      nim, nama: peserta.nama, prodi: peserta.prodi, fakultas: peserta.fakultas,
      jenisScan,
      waktuSebelumnya: rekapRow[4].toString(),
      message: `Peserta sudah scan masuk pada pukul ${rekapRow[4].toString()}.`,
    });
  }

  if (jenisScan === 'keluar' && sudahKeluar) {
    logSheet.appendRow([
      timestamp, eventId, eventName, nim, peserta.nama, jenisScan,
      device, petugas, rawQr, 'Duplikat', 'Sudah scan keluar sebelumnya',
    ]);
    return jsonResponse({
      status: 'duplikat',
      nim, nama: peserta.nama, prodi: peserta.prodi, fakultas: peserta.fakultas,
      jenisScan,
      waktuSebelumnya: rekapRow[5].toString(),
      message: `Peserta sudah scan keluar pada pukul ${rekapRow[5].toString()}.`,
    });
  }

  // ── 3. Catat ke Log Scan ─────────────────────────────────────────────────
  const metodeLabel = metode === 'manual' ? `MANUAL (${catatan})` : 'SCAN';
  logSheet.appendRow([
    timestamp, eventId, eventName, nim, peserta.nama, jenisScan,
    device, petugas, rawQr, 'Berhasil', metodeLabel,
  ]);

  // ── 4. Update / buat baris di Rekap Kehadiran ────────────────────────────
  let waktuMasuk  = rekapRow ? rekapRow[4].toString() : '';
  let waktuKeluar = rekapRow ? rekapRow[5].toString() : '';

  if (jenisScan === 'masuk')  waktuMasuk  = timestamp;
  if (jenisScan === 'keluar') waktuKeluar = timestamp;

  // Tentukan status kehadiran
  let statusKehadiran = 'Belum Lengkap';
  if (waktuMasuk && waktuKeluar) {
    statusKehadiran = 'Hadir';
  } else if (!waktuMasuk && waktuKeluar) {
    statusKehadiran = 'Perlu Verifikasi';
  }

  const newRekapRow = [
    nim, peserta.nama, peserta.prodi, peserta.fakultas,
    waktuMasuk, waktuKeluar, statusKehadiran, catatan,
  ];

  if (rekapRowIndex > 0) {
    // Update baris yang sudah ada
    rekapSheet.getRange(rekapRowIndex, 1, 1, newRekapRow.length).setValues([newRekapRow]);
  } else {
    // Buat baris baru
    rekapSheet.appendRow(newRekapRow);
  }

  // ── 5. Return response ───────────────────────────────────────────────────
  return jsonResponse({
    status: 'berhasil',
    nim, nama: peserta.nama, prodi: peserta.prodi, fakultas: peserta.fakultas,
    jenis: peserta.jenis,
    jenisScan,
    waktuScan: timestamp,
    statusKehadiran,
    metode,
    device, petugas,
    message: `Presensi ${jenisScan} berhasil dicatat pada ${timestamp}.`,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION: GET MASTER (opsional — untuk sync data peserta ke frontend)
// ──────────────────────────────────────────────────────────────────────────────

function handleGetMaster(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEET.MASTER);
  if (!masterSheet) {
    return jsonResponse({ status: 'error', message: 'Sheet Master Peserta tidak ditemukan.' });
  }
  const rows = masterSheet.getDataRange().getValues();
  const headers = rows[0];
  const peserta = rows.slice(1).map(r => ({
    nim:      r[0].toString().trim(),
    nama:     r[1],
    prodi:    r[2],
    fakultas: r[3],
    jenis:    r[4],
    keterangan: r[5],
  })).filter(p => p.nim);

  return jsonResponse({ status: 'ok', data: peserta });
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPER
// ──────────────────────────────────────────────────────────────────────────────

function jsonResponse(obj, code) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
