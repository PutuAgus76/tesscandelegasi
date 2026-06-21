import './globals.css';

export const metadata = {
  title: 'PresensiKTM — Sistem Presensi Acara Berbasis Scan KTM',
  description: 'Sistem presensi digital berbasis scan QR/Barcode KTM mahasiswa untuk acara kampus. Multi-device, real-time, terintegrasi Google Spreadsheet.',
  keywords: 'presensi, KTM, scan, QR, barcode, mahasiswa, acara kampus, Undiksha',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
