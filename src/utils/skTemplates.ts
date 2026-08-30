/**
 * Utility dan Template Dokumen Resmi SK KBM SMP Negeri 2 Puriala
 * Format terstandarisasi 100% sesuai berkas Google Doc Master SK KBM
 * (Folder TATA USAHA/SK): https://docs.google.com/document/d/1YXQBSJ_l3vDoOLGYWzw-K27y314TceFFgy92YsVSOSo/edit?usp=sharing
 */

import { IdentitasSekolah, SKKBM, SKKBMItem, SKTugasTambahan, SuratTugasDinas } from '../types';
import { LOGO_KABUPATEN_KONAWE_BASE64, LOGO_TUT_WURI_BASE64 } from './skLogos';

export { LOGO_KABUPATEN_KONAWE_BASE64, LOGO_TUT_WURI_BASE64 };

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format tanggal YYYY-MM-DD menjadi format teks Indonesia baku (contoh: 13 Juli 2026)
 */
export function formatTanggalIndonesia(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes(' ') && !dateStr.includes('-')) return dateStr;

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${day} ${INDONESIAN_MONTHS[monthIdx]} ${year}`;
    }
  }
  return dateStr;
}

/**
 * Auto-generate judul/perihal SK berdasarkan Semester dan Tahun Pelajaran
 * sesuai naskah dinas resmi SMP Negeri 2 Puriala
 */
export function generateDefaultPerihalSK(semester: 'Ganjil' | 'Genap', tahunAjaran: string): string {
  const semNum = semester === 'Ganjil' ? '1 (GANJIL)' : '2 (GENAP)';
  return `BEBAN KERJA GURU DALAM KEGIATAN PROSES BELAJAR MENGAJAR ATAU BIMBINGAN SEMESTER ${semNum} T.P ${tahunAjaran}`;
}

/**
 * Auto-generate judul/perihal SK Tugas Tertentu / Tugas Tambahan
 * Berdasarkan Master Template Google Drive "SK Tugas Tertentu T.P 2026-2027"
 */
export function generateDefaultPerihalSKTugasTertentu(semester: 'Ganjil' | 'Genap', tahunAjaran: string): string {
  const semNum = semester === 'Ganjil' ? '1 (GANJIL)' : '2 (GENAP)';
  return `PEMBAGIAN TUGAS TERTENTU / TUGAS TAMBAHAN BAGI GURU DAN TENAGA KEPENDIDIKAN DALAM PROSES BELAJAR MENGAJAR DAN OPERASIONAL SEKOLAH SEMESTER ${semNum} T.P ${tahunAjaran}`;
}

/**
 * Butir Konsiderans Menimbang Baku sesuai Dokumen SK Master
 */
export const DEFAULT_MENIMBANG_SK = [
  'Bahwa proses belajar mengajar merupakan inti proses penyelenggaraan pendidikan pada suatu pendidikan.',
  'Bahwa untuk kelancaran dan ketertiban pelaksanaan proses pembelajaran atau bimbingan pada SMP Negeri 2 Puriala Semester 2 (Genap) tahun pelajaran 2025/2026.',
  'Bahwa untuk maksud poin a dan b tersebut di atas, perlu ditetapkan dalam suatu surat keputusan kepala SMP Negeri 2 Puriala.',
];

/**
 * Butir Konsiderans Menimbang Baku untuk SK Tugas Tertentu T.P 2026-2027
 */
export const DEFAULT_MENIMBANG_SK_TUGAS_TERTENTU = (tahunAjaran: string = '2026/2027', semester: string = 'Ganjil') => [
  `Bahwa dalam rangka memperlancar pelaksanaan proses belajar mengajar, bimbingan, dan tata kelola administrasi persekolahan di SMP Negeri 2 Puriala Semester ${semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'} Tahun Pelajaran ${tahunAjaran}, dipandang perlu menetapkan pembagian tugas tertentu / tugas tambahan bagi guru dan tenaga kependidikan.`,
  'Bahwa guru dan tenaga kependidikan yang namanya tercantum dalam lampiran keputusan ini dipandang cakap, berdedikasi, dan memenuhi syarat untuk diserahi tugas tertentu / tugas tambahan tersebut.',
  'Bahwa untuk maksud poin a dan b tersebut di atas, perlu ditetapkan dalam suatu Surat Keputusan Kepala SMP Negeri 2 Puriala.',
];

/**
 * Butir Konsiderans Mengingat Lengkap (10 Butir Peraturan Perundang-Undangan)
 */
export const DEFAULT_MENGINGAT_SK = [
  'Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;',
  'Undang-undang Nomor 14 Tahun 2005 tentang Guru dan Dosen;',
  'Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan atas Peraturan Pemerintah Nomor 74 Tahun 2008 tentang Guru;',
  'Peraturan Pemerintah Nomor 4 tahun 2022 tentang Perubahan atas Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan;',
  'Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 16 Tahun 2022 tentang Standar Proses pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 32 Tahun 2022 tentang Standar Teknis Pelayanan Minimal Pendidikan;',
  'Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 21 Tahun 2024 tentang Jabatan Fungsional Guru;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 10 Tahun 2025 Tentang Standar Kompetensi Lulusan Pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, Dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 11 Tahun 2025 tentang Pemenuhan Beban kerja Guru;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 12 Tahun 2025 tentang Standar Isi pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah.',
];

/**
 * Butir Konsiderans Memperhatikan sesuai Dokumen SK Master
 */
export const DEFAULT_MEMPERHATIKAN_SK_LIST = (tahunAjaran: string, tanggalSK: string) => [
  `Dokumen KOSP SMP Negeri 2 Puriala T.P ${tahunAjaran}.`,
  `Keputusan rapat dewan guru dan staf tata usaha, Tanggal ${formatTanggalIndonesia(tanggalSK) || '13 Juli 2026'}.`,
];

/**
 * Helper untuk menghitung total statistik beban kerja guru
 */
export function hitungTotalSKKBM(daftarGuru: SKKBMItem[]) {
  let totalVIIA = 0;
  let totalVIIB = 0;
  let totalVIII = 0;
  let totalIX = 0;
  let totalTugasTambahan = 0;
  let totalBebanSeluruh = 0;

  daftarGuru.forEach((g) => {
    totalVIIA += g.jpKelas?.viiA || 0;
    totalVIIB += g.jpKelas?.viiB || 0;
    totalVIII += g.jpKelas?.viii || 0;
    totalIX += g.jpKelas?.ix || 0;
    totalTugasTambahan += g.jumlahJpTugasTambahan || 0;
    totalBebanSeluruh += g.totalJp || 0;
  });

  return {
    totalVIIA,
    totalVIIB,
    totalVIII,
    totalIX,
    totalTugasTambahan,
    totalBebanSeluruh,
  };
}

export type SKPrintMode = 'all' | 'sk_only' | 'lampiran_only';

/**
 * Menghasilkan Dokumen HTML Lengkap SK KBM
 * Format Halaman 1 (SK): A4 Portrait
 * Format Halaman 2 (Lampiran): A4 Landscape Otomatis
 */
export function generateSKKBMFullHtml(
  sk: SKKBM,
  identitas: IdentitasSekolah,
  mode: SKPrintMode = 'all'
): string {
  const tanggalFormat = formatTanggalIndonesia(sk.tanggalSK) || '13 Juli 2026';
  const tempatFormat = sk.tempatPenetapan || 'Unggulino';
  const perihalSK = sk.tentang || generateDefaultPerihalSK(sk.semester, sk.tahunAjaran);
  const kepsekNama = identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si';
  const kepsekNip = identitas.nipKepalaSekolah || '19710110 199412 1 0012';

  const menimbangList =
    sk.menimbang && sk.menimbang.length > 0
      ? sk.menimbang
      : [
          'Bahwa proses belajar mengajar merupakan inti proses penyelenggaraan pendidikan pada suatu pendidikan.',
          `Bahwa untuk kelancaran dan ketertiban pelaksanaan proses pembelajaran atau bimbingan pada SMP Negeri 2 Puriala Semester ${
            sk.semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'
          } tahun pelajaran ${sk.tahunAjaran}.`,
          'Bahwa untuk maksud poin a dan b tersebut di atas, perlu ditetapkan dalam suatu surat keputusan kepala SMP Negeri 2 Puriala.',
        ];

  const mengingatList = sk.mengingat && sk.mengingat.length > 0 ? sk.mengingat : DEFAULT_MENGINGAT_SK;
  const memperhatikanList =
    sk.memperhatikan && sk.memperhatikan.length > 0
      ? sk.memperhatikan
      : DEFAULT_MEMPERHATIKAN_SK_LIST(sk.tahunAjaran, sk.tanggalSK);

  const totals = hitungTotalSKKBM(sk.daftarGuru);

  const isLampiranOnly = mode === 'lampiran_only';
  const isSKOnly = mode === 'sk_only';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SK KBM - ${sk.noSK} - SMP NEGERI 2 PURIALA</title>
  <style>
    @page {
      size: ${isLampiranOnly ? 'A4 landscape' : 'A4 portrait'};
      margin: ${isLampiranOnly ? '1cm 1.2cm 1cm 1.2cm' : '1.5cm 1.5cm 1.5cm 1.5cm'};
    }
    @page skPortrait {
      size: A4 portrait;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    }
    @page skLandscape {
      size: A4 landscape;
      margin: 1cm 1.2cm 1cm 1.2cm;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-portrait {
        page: skPortrait;
        page-break-after: always;
        break-after: page;
      }
      .page-landscape {
        page: skLandscape;
        page-break-before: always;
        break-before: page;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
      .no-print {
        display: none !important;
      }
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      line-height: 1.3;
      font-size: 10pt;
      margin: 0;
      padding: ${isLampiranOnly ? '15px 25px' : '20px 25px'};
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-justify { text-align: justify; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .underline { text-decoration: underline; }
    
    /* Kop Surat Kedinasan dengan Dua Logo Berdampingan */
    .kop-container {
      display: table;
      width: 100%;
      margin-bottom: 4px;
    }
    .kop-row {
      display: table-row;
    }
    .kop-logo-left {
      display: table-cell;
      width: 85px;
      vertical-align: middle;
      text-align: left;
    }
    .kop-logo-right {
      display: table-cell;
      width: 80px;
      vertical-align: middle;
      text-align: right;
    }
    .kop-logo-img {
      max-width: 80px;
      max-height: 80px;
      height: auto;
      object-fit: contain;
    }
    .kop-content {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      padding: 0 10px;
    }
    .kop-content .p-pemkab {
      font-size: 12pt;
      font-weight: bold;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .kop-content .p-dinas {
      font-size: 13pt;
      font-weight: bold;
      margin: 1px 0;
      letter-spacing: 0.5px;
    }
    .kop-content .p-sekolah {
      font-size: 15pt;
      font-weight: 900;
      margin: 2px 0;
      letter-spacing: 1px;
    }
    .kop-content .p-akreditasi {
      font-size: 10pt;
      font-weight: bold;
      margin: 1px 0;
    }
    .kop-content .p-alamat {
      font-size: 9.5pt;
      margin: 1px 0;
    }
    .kop-content .p-email {
      font-size: 9.5pt;
      margin: 1px 0;
    }
    
    /* Garis Pemisah Kop Surat (Double Line: Tebal & Tipis) */
    .kop-divider {
      border-top: 2px solid #000;
      border-bottom: 1px solid #000;
      height: 2px;
      margin-top: 4px;
      margin-bottom: 16px;
    }

    /* Judul Surat Keputusan */
    .sk-title-box {
      text-align: center;
      margin-bottom: 14px;
    }
    .sk-title-box h3 {
      margin: 0 0 2px 0;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .sk-title-box .nomor {
      margin: 2px 0;
      font-size: 10pt;
      font-weight: bold;
    }
    .sk-title-box .tentang-label {
      margin: 8px 0 3px 0;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 3px;
    }
    .sk-title-box .tentang-text {
      margin: 2px auto;
      max-width: 620px;
      font-size: 10pt;
      font-weight: bold;
      line-height: 1.25;
    }
    .kepala-sekolah-title {
      text-align: center;
      margin: 10px 0 12px 0;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 1.5px;
    }

    /* Konsiderans */
    .konsiderans-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9.5pt;
    }
    .konsiderans-table td {
      vertical-align: top;
      padding: 2px 0;
    }
    .konsiderans-label {
      width: 120px;
      font-weight: bold;
    }
    .konsiderans-colon {
      width: 15px;
      text-align: center;
      font-weight: bold;
    }
    .konsiderans-content ol {
      margin: 0;
      padding-left: 18px;
    }
    .konsiderans-content ol li {
      margin-bottom: 3px;
      text-align: justify;
      line-height: 1.3;
    }

    /* Diktum Memutuskan */
    .diktum-title {
      text-align: center;
      font-weight: bold;
      margin: 12px 0 4px 0;
      font-size: 10pt;
      letter-spacing: 1px;
    }
    .menetapkan-label {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 9.5pt;
    }
    .diktum-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .diktum-table td {
      vertical-align: top;
      padding: 2px 0;
    }
    .diktum-num {
      width: 80px;
      font-weight: bold;
    }
    .diktum-colon {
      width: 15px;
      text-align: center;
      font-weight: bold;
    }
    .diktum-text {
      text-align: justify;
      line-height: 1.3;
    }

    /* Kolofon & Tanda Tangan */
    .signature-wrapper {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
      font-size: 9.5pt;
    }
    .signature-box {
      width: 250px;
      text-align: left;
    }
    .signature-space {
      height: 55px;
    }

    /* Header Lampiran */
    .lampiran-header-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 10px;
    }
    .lampiran-header-table td {
      vertical-align: top;
      padding: 1px 0;
    }
    .lampiran-label {
      width: 90px;
      font-weight: bold;
    }
    .lampiran-colon {
      width: 15px;
      font-weight: bold;
    }

    /* Tabel Lampiran I - 12 Kolom Baku (Dioptimalkan untuk Landscape) */
    .lampiran-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 6px;
    }
    .lampiran-table th, .lampiran-table td {
      border: 1px solid #000;
      padding: 4px 5px;
    }
    .lampiran-table thead th {
      background-color: #f8fafc;
      text-align: center;
      font-weight: bold;
      vertical-align: middle;
    }
    .lampiran-table .col-num th {
      background-color: #fff;
      font-size: 7.5pt;
      font-style: italic;
      font-weight: normal;
      padding: 1.5px;
    }
    .lampiran-table tfoot td {
      font-weight: bold;
      background-color: #f8fafc;
    }
  </style>
</head>
<body>

  ${
    !isLampiranOnly
      ? `
  <!-- ========================================================================= -->
  <!-- HALAMAN 1: KEPALA SURAT BERLOGO RESMI SAMPAI MEMUTUSKAN (PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="page-portrait">
    <!-- KOP SURAT RESMI KEDINASAN SIMETRIS PERSIS MASTER -->
    <div style="width: 100%; margin-bottom: 14px; font-family: 'Times New Roman', Times, serif; color: #000000;">
      <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
        <tr>
          <!-- LOGO KIRI: Pemkab Konawe -->
          <td style="width: 90px; min-width: 90px; max-width: 90px; vertical-align: middle; text-align: center; padding: 0;">
            <img 
              src="${LOGO_KABUPATEN_KONAWE_BASE64}" 
              alt="Logo Pemkab Konawe" 
              style="width: 76px; max-width: 80px; height: auto; display: block; margin: 0 auto; object-fit: contain;" 
            />
          </td>

          <!-- TEKS KOP TENGAH: Presisi Simetris -->
          <td style="vertical-align: middle; text-align: center; padding: 0 10px;">
            <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.2;">
              PEMERINTAH KABUPATEN KONAWE
            </div>
            <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0; line-height: 1.2;">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </div>
            <div style="font-size: 16pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0 3px 0; line-height: 1.2;">
              ${identitas.namaSekolah || 'SMP NEGERI 2 PURIALA'}
            </div>
            <div style="font-size: 9.5pt; font-weight: bold; margin: 1px 0; line-height: 1.2;">
              Terakreditasi "${identitas.akreditasi || 'B (Baik)'}"
            </div>
            <div style="font-size: 9pt; font-style: normal; margin: 1px 0; line-height: 1.25;">
              Alamat: ${identitas.alamat || 'Jl. Poros Lambuya – Motaha Km.23 Kec. Puriala'}, Kode Pos: ${identitas.kodePos || '93462'}
            </div>
            <div style="font-size: 8.5pt; font-style: normal; margin: 0; line-height: 1.25;">
              NPSN: ${identitas.npsn || '40402805'} | Email: ${identitas.email || 'smpnpuriala523@gmail.com'}
            </div>
          </td>

          <!-- LOGO KANAN: Tut Wuri Handayani -->
          <td style="width: 90px; min-width: 90px; max-width: 90px; vertical-align: middle; text-align: center; padding: 0;">
            <img 
              src="${LOGO_TUT_WURI_BASE64}" 
              alt="Logo Tut Wuri Handayani" 
              style="width: 76px; max-width: 80px; height: auto; display: block; margin: 0 auto; object-fit: contain;" 
            />
          </td>
        </tr>
      </table>

      <!-- GARIS GANDA KOP SURAT (Tebal & Tipis Klasik Kedinasan) -->
      <div style="border-top: 2.5px solid #000000; border-bottom: 1px solid #000000; height: 2px; margin-top: 6px; margin-bottom: 4px;"></div>
    </div>

    <!-- JUDUL SURAT KEPUTUSAN -->
    <div class="sk-title-box">
      <h3>SURAT KEPUTUSAN</h3>
      <h3>KEPALA ${identitas.namaSekolah}</h3>
      <p class="nomor">NOMOR : ${sk.noSK}</p>
      <p class="tentang-label">T E N T A N G</p>
      <p class="tentang-text uppercase">${perihalSK}</p>
    </div>

    <div class="kepala-sekolah-title">
      KEPALA &nbsp;SMP &nbsp;NEGERI &nbsp;2 PURIALA
    </div>

    <!-- KONSIDERANS: MENIMBANG, MENGINGAT, MEMPERHATIKAN -->
    <table class="konsiderans-table">
      <tr>
        <td class="konsiderans-label">Menimbang</td>
        <td class="konsiderans-colon">:</td>
        <td class="konsiderans-content">
          <ol>
            ${menimbangList.map((item) => `<li>${item}</li>`).join('')}
          </ol>
        </td>
      </tr>
      <tr>
        <td class="konsiderans-label">Mengingat</td>
        <td class="konsiderans-colon">:</td>
        <td class="konsiderans-content">
          <ol>
            ${mengingatList.map((item) => `<li>${item}</li>`).join('')}
          </ol>
        </td>
      </tr>
      <tr>
        <td class="konsiderans-label">Memperhatikan</td>
        <td class="konsiderans-colon">:</td>
        <td class="konsiderans-content">
          <ol>
            ${memperhatikanList.map((item) => `<li>${item}</li>`).join('')}
          </ol>
        </td>
      </tr>
    </table>

    <!-- DIKTUM MEMUTUSKAN -->
    <div class="diktum-title">MEMUTUSKAN</div>
    <div class="menetapkan-label">Menetapkan</div>

    <table class="diktum-table">
      <tr>
        <td class="diktum-num">Pertama</td>
        <td class="diktum-colon">:</td>
        <td class="diktum-text">
          Beban kerja guru/pembagian tugas guru dalam proses pembelajaran semester ${
            sk.semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'
          } T.P ${sk.tahunAjaran}. sebagaimana tersebut namanya dalam lampiran surat keputusan ini.
        </td>
      </tr>
      <tr>
        <td class="diktum-num">Kedua</td>
        <td class="diktum-colon">:</td>
        <td class="diktum-text">
          Semua guru berkewajiban memenuhi dokumen pendukung yang berupa perencanaan, pelaksanaan pembelajaran, penilaian, dan pembimbingan yang menjadi tanggung jawabnya serta melaporkannya kepada kepala sekolah secara tertulis;
        </td>
      </tr>
      <tr>
        <td class="diktum-num">Ketiga</td>
        <td class="diktum-colon">:</td>
        <td class="diktum-text">
          Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan pada anggaran yang sesuai;
        </td>
      </tr>
      <tr>
        <td class="diktum-num">Keempat</td>
        <td class="diktum-colon">:</td>
        <td class="diktum-text">
          Keputusan ini mulai berlaku sejak tanggal ditetapkan dengan ketentuan apabila ternyata terdapat kekeliruan dalam keputusan ini akan ditinjau kembali dan diperbaiki sebagaimana mestinya.
        </td>
      </tr>
    </table>

    <!-- PENGESAHAN KEPUTUSAN -->
    <div class="signature-wrapper">
      <div class="signature-box">
        <div>Ditetapkan di &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${tempatFormat}</div>
        <div>Pada Tanggal &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${tanggalFormat}</div>
        <div style="margin-top: 6px; font-weight: bold;">Kepala Sekolah,</div>
        <div class="signature-space"></div>
        <div class="font-bold underline">${kepsekNama}</div>
        <div>NIP. ${kepsekNip}</div>
      </div>
    </div>
  </div>
  `
      : ''
  }

  ${
    !isSKOnly
      ? `
  <!-- ========================================================================= -->
  <!-- HALAMAN 2: LAMPIRAN I (PEMBAGIAN BEBAN KERJA GURU 12 KOLOM - LANDSCAPE) -->
  <!-- ========================================================================= -->
  <div class="page-landscape">

    <!-- HEADER LAMPIRAN -->
    <table class="lampiran-header-table">
      <tr>
        <td class="lampiran-label">Lampiran</td>
        <td class="lampiran-colon">:</td>
        <td>SK Kepala ${identitas.namaSekolah}</td>
      </tr>
      <tr>
        <td class="lampiran-label">Nomor</td>
        <td class="lampiran-colon">:</td>
        <td style="font-family: monospace;">${sk.noSK}</td>
      </tr>
      <tr>
        <td class="lampiran-label">Tanggal</td>
        <td class="lampiran-colon">:</td>
        <td>${tanggalFormat}</td>
      </tr>
      <tr>
        <td class="lampiran-label">Tentang</td>
        <td class="lampiran-colon">:</td>
        <td class="font-bold uppercase">${perihalSK}</td>
      </tr>
    </table>

    <!-- TABEL LAMPIRAN I PEMBAGIAN TUGAS GURU -->
    <table class="lampiran-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 25px;">NO</th>
          <th rowspan="2" style="width: 170px;">NAMA GURU</th>
          <th rowspan="2" style="width: 110px;">NUPTK</th>
          <th rowspan="2" style="width: 45px;">GOL</th>
          <th rowspan="2" style="width: 120px;">MENGAJAR MATA PELAJARAN</th>
          <th colspan="4">KELAS DAN ALOKASI WAKTU</th>
          <th rowspan="2" style="width: 60px;">JUMLAH TUGAS TAMBAHAN</th>
          <th rowspan="2" style="width: 140px;">TUGAS TAMBAHAN</th>
          <th rowspan="2" style="width: 60px;">JUMLAH BEBAN KERJA</th>
        </tr>
        <tr>
          <th style="width: 38px;">VII.A</th>
          <th style="width: 38px;">VII.B</th>
          <th style="width: 38px;">VIII</th>
          <th style="width: 38px;">IX</th>
        </tr>
        <tr class="col-num">
          <th>1</th>
          <th>2</th>
          <th>4</th>
          <th>5</th>
          <th>6</th>
          <th>7</th>
          <th>8</th>
          <th>9</th>
          <th>-</th>
          <th>13</th>
          <th>14</th>
          <th>15</th>
        </tr>
      </thead>
      <tbody>
        ${sk.daftarGuru
          .map((guru, index) => {
            const viiA = guru.jpKelas?.viiA ? guru.jpKelas.viiA : '-';
            const viiB = guru.jpKelas?.viiB ? guru.jpKelas.viiB : '-';
            const viii = guru.jpKelas?.viii ? guru.jpKelas.viii : '-';
            const ix = guru.jpKelas?.ix ? guru.jpKelas.ix : '-';
            const jpTugas = guru.jumlahJpTugasTambahan ? guru.jumlahJpTugasTambahan : '-';
            const tugasDesc = guru.tugasTambahan || '-';
            const totalBeban = guru.totalJp || '-';

            return `<tr>
              <td class="text-center">${index + 1}.</td>
              <td>
                <div class="font-bold">${guru.namaGuru}</div>
                ${guru.nip ? `<div style="font-size: 7.5pt; color: #333;">NIP. ${guru.nip}</div>` : ''}
              </td>
              <td class="text-center" style="font-family: monospace; font-size: 8pt;">${guru.nuptk || '-'}</td>
              <td class="text-center">${guru.golongan || '-'}</td>
              <td>${guru.mataPelajaran || '-'}</td>
              <td class="text-center font-bold">${viiA}</td>
              <td class="text-center font-bold">${viiB}</td>
              <td class="text-center font-bold">${viii}</td>
              <td class="text-center font-bold">${ix}</td>
              <td class="text-center">${jpTugas}</td>
              <td>${tugasDesc}</td>
              <td class="text-center font-bold">${totalBeban}</td>
            </tr>`;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" class="text-center uppercase font-bold">JUMLAH TOTAL</td>
          <td class="text-center font-bold">${totals.totalVIIA}</td>
          <td class="text-center font-bold">${totals.totalVIIB}</td>
          <td class="text-center font-bold">${totals.totalVIII}</td>
          <td class="text-center font-bold">${totals.totalIX}</td>
          <td class="text-center font-bold">${totals.totalTugasTambahan}</td>
          <td class="text-center">-</td>
          <td class="text-center font-bold" style="font-size: 9.5pt;">${totals.totalBebanSeluruh}</td>
        </tr>
      </tfoot>
    </table>

    <!-- PENGESAHAN LAMPIRAN -->
    <div class="signature-wrapper" style="margin-top: 18px;">
      <div class="signature-box">
        <div style="font-weight: bold;">Kepala Sekolah,</div>
        <div class="signature-space"></div>
        <div class="font-bold underline">${kepsekNama}</div>
        <div>NIP. ${kepsekNip}</div>
      </div>
    </div>
  </div>
  `
      : ''
  }

</body>
</html>`;
}

/**
 * Eksekusi pencetakan dokumen langsung via Iframe terisolasi
 * Menjamin cetak bersih tanpa elemen antarmuka dashboard dan otomatis landscape untuk lampiran
 */
export function printHtmlDirectly(htmlContent: string) {
  const existingIframe = document.getElementById('skkbm-print-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'skkbm-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: window.open
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.open', e);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlContent);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      }
    }
  }, 400);
}

/**
 * Unduh Dokumen HTML Resmi SK KBM yang siap dicetak ke PDF atau dibuka di Word/Docs
 */
export function downloadSKKBMHtmlFile(sk: SKKBM, identitas: IdentitasSekolah, mode: SKPrintMode = 'all') {
  const html = generateSKKBMFullHtml(sk, identitas, mode);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeNoSK = (sk.noSK || 'SK_KBM').replace(/[/\\?%*:|"<>]/g, '_');
  const modeSuffix = mode === 'lampiran_only' ? '_Lampiran_Landscape' : mode === 'sk_only' ? '_SK_Portrait' : '_Lengkap';
  a.download = `SK_KBM_${safeNoSK}${modeSuffix}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface SKTugasTertentuHeader {
  noSK: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  tentang?: string;
  tanggalSK: string;
  tempatPenetapan?: string;
  menimbang?: string[];
  mengingat?: string[];
  memperhatikan?: string[];
  templateNama?: string;
}

/**
 * Menghitung bobot/tingkat jenjang jabatan untuk pengurutan hierarki SK Tugas Tertentu
 * Dimulai dari Kepala Sekolah sebagai pimpinan tertinggi, disusul Wakasek, Kepala TU, Kepala Lab/Perpus, Bendahara, Operator, Wali Kelas, Pembina, dst.
 */
export function getJenjangJabatanRank(item: Partial<SKTugasTambahan> | { jenisTugas?: string; jabatanPokok?: string; jabatanDefinitif?: string; jabatan?: string }): number {
  const tugas = (item.jenisTugas || '').toLowerCase();
  const jabatanPokok = ((item as any).jabatanPokok || (item as any).jabatan || '').toLowerCase();
  const jabatanDef = (item.jabatanDefinitif || '').toLowerCase();
  const sasaran = ((item as any).sasaranTugas || '').toLowerCase();
  const combined = `${tugas} ${jabatanPokok} ${jabatanDef} ${sasaran}`;

  // 1. Kepala Sekolah (Pimpinan Utama Satuan Pendidikan / Penanggung Jawab)
  if (
    (tugas.includes('kepala sekolah') || jabatanPokok.includes('kepala sekolah') || jabatanDef.includes('kepala sekolah') || tugas.includes('penanggung jawab')) &&
    !tugas.includes('wakil') &&
    !tugas.includes('wakasek')
  ) {
    return 1;
  }

  // 2. Wakil Kepala Sekolah - Kurikulum / Akademik
  if (tugas.includes('wakil') || tugas.includes('wakasek')) {
    if (combined.includes('kurikulum') || combined.includes('akademik') || combined.includes('kosp')) {
      return 2;
    }
    // 3. Wakil Kepala Sekolah - Kesiswaan
    if (combined.includes('kesiswaan') || combined.includes('karakter') || combined.includes('kedisiplinan')) {
      return 3;
    }
    // 4. Wakil Kepala Sekolah - Hubungan Masyarakat (Humas) & Sarpras
    if (combined.includes('humas') || combined.includes('sarpras') || combined.includes('sarana') || combined.includes('masyarakat')) {
      return 4;
    }
    return 5;
  }

  // 6. Kepala Urusan Tata Usaha / Koordinator TU
  if (
    tugas.includes('kepala tata usaha') ||
    tugas.includes('koordinator tata usaha') ||
    tugas.includes('kepala urusan tata usaha') ||
    tugas.includes('koordinator urusan tata usaha') ||
    jabatanPokok.includes('kepala tata usaha') ||
    jabatanDef.includes('kepala tata usaha') ||
    (tugas.includes('tata usaha') && tugas.includes('koordinator'))
  ) {
    return 6;
  }

  // 7. Kepala Perpustakaan Sekolah
  if (tugas.includes('perpustakaan') || jabatanPokok.includes('perpustakaan')) {
    return 7;
  }

  // 8. Kepala Laboratorium IPA & Komputer
  if (tugas.includes('laboratorium') || tugas.includes('lab ')) {
    if (combined.includes('ipa') || combined.includes('komputer') || combined.includes('cbt') || combined.includes('multimedia')) return 8;
    if (combined.includes('keagamaan') || combined.includes('musholla') || combined.includes('mushola')) return 9;
    return 10;
  }

  // 11. Bendahara BOS / Pengelola Keuangan Sekolah
  if (tugas.includes('bendahara') || combined.includes('bendahara bos') || combined.includes('keuangan')) {
    return 11;
  }

  // 12. Operator Dapodik / IT & Proktor ANBK
  if (tugas.includes('operator') || combined.includes('dapodik') || combined.includes('proktor') || combined.includes('teknisi it')) {
    return 12;
  }

  // 13. Koordinator / Guru Bimbingan Konseling (BK)
  if (tugas.includes('bimbingan konseling') || tugas.includes('bk') || combined.includes('konseling') || combined.includes('konselor')) {
    return 13;
  }

  // 14. Tim Pengembang Kurikulum / TPMPS / Penjamin Mutu
  if (tugas.includes('pengembang kurikulum') || combined.includes('tpmps') || combined.includes('penjamin mutu')) {
    return 14;
  }

  // 15-21. Wali Kelas (Diurutkan berdasarkan jenjang kelas)
  if (tugas.includes('wali kelas')) {
    if (combined.includes('vii.a') || combined.includes('vii a') || combined.includes('7.a') || combined.includes('7a') || combined.includes('7-a')) return 15;
    if (combined.includes('vii.b') || combined.includes('vii b') || combined.includes('7.b') || combined.includes('7b') || combined.includes('7-b')) return 16;
    if (combined.includes('vii.c') || combined.includes('vii c') || combined.includes('7.c') || combined.includes('7c') || combined.includes('7-c')) return 17;
    if (combined.includes('vii') || combined.includes('7')) return 18;
    if (combined.includes('viii') || combined.includes('8')) return 19;
    if (combined.includes('ix') || combined.includes('9')) return 20;
    return 21;
  }

  // 22. Pembina OSIS & Kesiswaan
  if (tugas.includes('pembina osis') || (tugas.includes('osis') && tugas.includes('pembina'))) {
    return 22;
  }

  // 23. Pembina Pramuka (Gudep Putra / Putri)
  if (tugas.includes('pramuka') || combined.includes('gudep')) {
    return 23;
  }

  // 24. Pembina PMR / UKS
  if (tugas.includes('pmr') || tugas.includes('uks') || combined.includes('palang merah')) {
    return 24;
  }

  // 25. Pembina Seni & Budaya / FLS2N
  if (tugas.includes('seni') || combined.includes('tari') || combined.includes('fls2n') || combined.includes('budaya')) {
    return 25;
  }

  // 26. Pembina Olahraga / O2SN / Prestasi
  if (tugas.includes('olahraga') || combined.includes('o2sn') || combined.includes('atletik')) {
    return 26;
  }

  // 27. Pembina Keagamaan / Kerohanian / Rohis
  if (tugas.includes('keagamaan') || combined.includes('rohis') || combined.includes('pesantren') || combined.includes('sholat')) {
    return 27;
  }

  // 28. Koordinator Adiwiyata & Lingkungan Hidup
  if (tugas.includes('adiwiyata') || combined.includes('lingkungan')) {
    return 28;
  }

  // 29. Guru Piket & Tim Kedisiplinan
  if (tugas.includes('piket') || combined.includes('kedisiplinan') || combined.includes('ketertiban')) {
    return 29;
  }

  // 30. Staf Tata Usaha / Tenaga Administrasi Sekolah Lainnya
  if (combined.includes('tata usaha') || combined.includes('administrasi') || combined.includes('arsip') || combined.includes('kepegawaian')) {
    return 30;
  }

  return 50;
}

/**
 * Peringkat pangkat & golongan PNS / ASN
 */
export function getPangkatGolonganRank(pangkatGol?: string): number {
  if (!pangkatGol) return 99;
  const p = pangkatGol.toUpperCase();
  if (p.includes('IV/E')) return 1;
  if (p.includes('IV/D')) return 2;
  if (p.includes('IV/C')) return 3;
  if (p.includes('IV/B')) return 4;
  if (p.includes('IV/A')) return 5;
  if (p.includes('III/D')) return 6;
  if (p.includes('III/C')) return 7;
  if (p.includes('III/B')) return 8;
  if (p.includes('III/A')) return 9;
  if (p.includes('IX') || p.includes('PPPK')) return 10;
  if (p.includes('VII') || p.includes('PPPK')) return 11;
  if (p.includes('NON-ASN') || p.includes('HONORER') || p.includes('GTT') || p.includes('PTT')) return 20;
  return 30;
}

/**
 * Mengurutkan Daftar SK Tugas Tambahan berdasarkan Hierarki Jenjang Jabatan
 * Mulai dari Kepala Sekolah -> Wakasek -> Ka. TU -> Ka. Perpus/Lab -> Bendahara -> Operator -> Wali Kelas -> Pembina Ekskul -> Lainnya.
 */
export function sortSKTugasTambahanByHierarchy(list: SKTugasTambahan[]): SKTugasTambahan[] {
  return [...list].sort((a, b) => {
    const rankA = getJenjangJabatanRank(a);
    const rankB = getJenjangJabatanRank(b);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const golA = getPangkatGolonganRank(a.pangkatGol || a.jabatanDefinitif);
    const golB = getPangkatGolonganRank(b.pangkatGol || b.jabatanDefinitif);
    if (golA !== golB) {
      return golA - golB;
    }
    return (a.namaPetugas || '').localeCompare(b.namaPetugas || '');
  });
}

/**
 * Otomatis menambahkan & menyinkronkan data SK Tugas Tambahan dari Data Guru & PTK
 * Memprioritaskan personil yang memiliki jabatan Fungsional dan Struktural,
 * dan langsung mengurutkan mulai dari Kepala Sekolah.
 */
export function autoGenerateSKTugasTambahanFromPTK(
  guruPTKList: any[],
  identitasSekolah: IdentitasSekolah,
  existingSKList: SKTugasTambahan[],
  tahunAjaran = '2026/2027',
  semester: 'Ganjil' | 'Genap' = 'Ganjil'
): SKTugasTambahan[] {
  const result: SKTugasTambahan[] = [...existingSKList];
  const currentYear = tahunAjaran.split('/')[0] || '2026';
  const defaultNoSK = `400.3.12.2/054/SMP-02/PRL/VII/${currentYear}`;

  // Helper untuk mencari apakah sudah ada personil dengan tugas tertentu
  const hasTask = (petugasName: string, taskKeyword: string) => {
    return result.some(
      (item) =>
        item.namaPetugas.toLowerCase().includes(petugasName.toLowerCase()) &&
        item.jenisTugas.toLowerCase().includes(taskKeyword.toLowerCase())
    );
  };

  const formatFullName = (p: any) => {
    if (p.namaLengkap && (p.gelarDepan || p.gelarBelakang)) {
      const depan = p.gelarDepan ? `${p.gelarDepan} ` : '';
      const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : '';
      return `${depan}${p.namaLengkap}${belakang}`;
    }
    return p.namaLengkap || p.nama || '';
  };

  // 1. KEPALA SEKOLAH (Pimpinan & Penanggung Jawab Tertinggi)
  const kepsekPTK = guruPTKList.find((g) => (g.jabatan || '').toLowerCase().includes('kepala sekolah'));
  const kepsekNama = kepsekPTK ? formatFullName(kepsekPTK) : identitasSekolah.namaKepalaSekolah || 'Drs. H. Sudirman, M.Pd.';
  const kepsekNip = kepsekPTK?.nip || identitasSekolah.nipKepalaSekolah || '19681231 199512 1 002';
  const kepsekGol = kepsekPTK?.pangkatGolongan || kepsekPTK?.golongan || 'Pembina Tk. I, IV/b';

  const existingKepsekIdx = result.findIndex((item) =>
    item.jenisTugas.toLowerCase().includes('kepala sekolah') ||
    item.namaPetugas.toLowerCase().includes(kepsekNama.toLowerCase()) ||
    (kepsekNip && kepsekNip !== '-' && item.nip === kepsekNip)
  );

  if (existingKepsekIdx >= 0) {
    result[existingKepsekIdx] = {
      ...result[existingKepsekIdx],
      jenisTugas: 'Kepala Sekolah / Penanggung Jawab Satuan Pendidikan',
      namaPetugas: kepsekNama,
      nip: kepsekNip,
      pangkatGol: kepsekGol,
      jabatanDefinitif: `Kepala Sekolah / ${kepsekGol}`,
      jabatanPokok: 'Kepala Sekolah',
      ekuivalensiJp: result[existingKepsekIdx].ekuivalensiJp || 24,
      sasaranTugas: 'Manajerial, Supervisi Akademik & PTK, Pengembangan Kewirausahaan Sekolah',
      keterangan: 'Penanggung Jawab Utama Pelaksanaan KBM, Mutu Pendidikan, Administrasi Satuan Pendidikan & Pertanggungjawaban BOSP',
      templateNama: 'SK Tugas Tertentu T.P 2026-2027',
      drivePath: 'TATA USAHA/SK',
      statusDrive: 'Tersimpan',
    };
  } else {
    result.unshift({
      id: `SKTT-${currentYear}-KEPSEK`,
      noSK: defaultNoSK,
      tahunAjaran,
      semester,
      jenisTugas: 'Kepala Sekolah / Penanggung Jawab Satuan Pendidikan',
      namaPetugas: kepsekNama,
      nip: kepsekNip,
      nuptk: kepsekPTK?.nuptk || '7442 7466 4820 0002',
      pangkatGol: kepsekGol,
      jabatanDefinitif: `Kepala Sekolah / ${kepsekGol}`,
      jabatanPokok: 'Kepala Sekolah',
      ekuivalensiJp: 24,
      sasaranTugas: 'Manajerial, Supervisi Akademik & PTK, Pengembangan Kewirausahaan Sekolah',
      keterangan: 'Penanggung Jawab Utama Pelaksanaan KBM, Mutu Pendidikan, Administrasi Satuan Pendidikan & Pertanggungjawaban BOSP',
      tanggalSK: `${currentYear}-07-13`,
      tempatPenetapan: 'Unggulino',
      status: 'Aktif',
      templateNama: 'SK Tugas Tertentu T.P 2026-2027',
      drivePath: 'TATA USAHA/SK',
      statusDrive: 'Tersimpan',
    });
  }

  // 2. KEPALA TATA USAHA (Struktural Tenaga Administrasi Sekolah)
  const kaTuPTK = guruPTKList.find(
    (g) =>
      (g.jabatan || '').toLowerCase().includes('kepala tata usaha') ||
      (g.jabatan || '').toLowerCase().includes('kepala urusan tata usaha') ||
      (g.namaLengkap || '').toLowerCase().includes('rustam')
  );
  if (kaTuPTK) {
    const kaTuNama = formatFullName(kaTuPTK);
    const kaTuNip = kaTuPTK.nip || '19790415 200801 1 014';
    const kaTuGol = kaTuPTK.pangkatGolongan || kaTuPTK.golongan || 'Penata Tk. I, III/d';

    const idx = result.findIndex(
      (i) => i.namaPetugas.toLowerCase().includes(kaTuPTK.namaLengkap.toLowerCase()) || i.nip === kaTuNip
    );
    if (idx >= 0) {
      result[idx] = {
        ...result[idx],
        jenisTugas: 'Koordinator Urusan Tata Usaha',
        namaPetugas: kaTuNama,
        nip: kaTuNip,
        pangkatGol: kaTuGol,
        jabatanDefinitif: 'Kepala Urusan Tata Usaha',
        jabatanPokok: 'Kepala Tata Usaha',
        ekuivalensiJp: 12,
        sasaranTugas: 'Kantor Tata Usaha & Kearsipan Kedinasan',
        keterangan: 'Koordinator Tata Persuratan, Arsip Digital SIPEDAS, Administrasi Kepegawaian & Kenaikan Pangkat',
      };
    } else {
      result.push({
        id: `SKTT-${currentYear}-KATU`,
        noSK: defaultNoSK,
        tahunAjaran,
        semester,
        jenisTugas: 'Koordinator Urusan Tata Usaha',
        namaPetugas: kaTuNama,
        nip: kaTuNip,
        nuptk: kaTuPTK.nuptk || '5147 7576 5920 0003',
        pangkatGol: kaTuGol,
        jabatanDefinitif: 'Kepala Urusan Tata Usaha',
        jabatanPokok: 'Kepala Tata Usaha',
        ekuivalensiJp: 12,
        sasaranTugas: 'Kantor Tata Usaha & Kearsipan Kedinasan',
        keterangan: 'Koordinator Tata Persuratan, Arsip Digital SIPEDAS, Administrasi Kepegawaian & Kenaikan Pangkat',
        tanggalSK: `${currentYear}-07-13`,
        tempatPenetapan: 'Unggulino',
        status: 'Aktif',
        templateNama: 'SK Tugas Tertentu T.P 2026-2027',
        drivePath: 'TATA USAHA/SK',
        statusDrive: 'Tersimpan',
      });
    }
  }

  // 3. BENDAHARA BOS (Keuangan BOSP)
  const bendaharaPTK = guruPTKList.find(
    (g) =>
      (g.jabatan || '').toLowerCase().includes('bendahara') ||
      (g.mapelUtama || '').toLowerCase().includes('bendahara') ||
      (g.namaLengkap || '').toLowerCase().includes('fitriani')
  );
  if (bendaharaPTK && !hasTask(bendaharaPTK.namaLengkap, 'bendahara')) {
    result.push({
      id: `SKTT-${currentYear}-BENDAHARA`,
      noSK: defaultNoSK,
      tahunAjaran,
      semester,
      jenisTugas: 'Bendahara BOS',
      namaPetugas: formatFullName(bendaharaPTK),
      nip: bendaharaPTK.nip || '19850622 201001 2 021',
      nuptk: bendaharaPTK.nuptk || '7890 7636 6420 0012',
      pangkatGol: bendaharaPTK.pangkatGolongan || bendaharaPTK.golongan || 'Penata Muda, III/a',
      jabatanDefinitif: 'Pengadministrasi Keuangan',
      jabatanPokok: 'Staf Tata Usaha Keuangan',
      ekuivalensiJp: 12,
      sasaranTugas: 'Pengelolaan Dana Bantuan Operasional Satuan Pendidikan (BOSP)',
      keterangan: 'Pengelolaan RKAS / ARKAS, Pembukuan Buku Kas Umum (BKU), SPJ & Pelaporan Realisasi Dana BOS',
      tanggalSK: `${currentYear}-07-13`,
      tempatPenetapan: 'Unggulino',
      status: 'Aktif',
      templateNama: 'SK Tugas Tertentu T.P 2026-2027',
      drivePath: 'TATA USAHA/SK',
      statusDrive: 'Tersimpan',
    });
  }

  // 4. OPERATOR DAPODIK & IT / PROKTOR ANBK
  const operatorPTK = guruPTKList.find(
    (g) =>
      (g.jabatan || '').toLowerCase().includes('operator') ||
      (g.mapelUtama || '').toLowerCase().includes('operator') ||
      (g.namaLengkap || '').toLowerCase().includes('wahyu saputra')
  );
  if (operatorPTK && !hasTask(operatorPTK.namaLengkap, 'operator')) {
    result.push({
      id: `SKTT-${currentYear}-OPERATOR`,
      noSK: defaultNoSK,
      tahunAjaran,
      semester,
      jenisTugas: 'Operator Dapodik / IT',
      namaPetugas: formatFullName(operatorPTK),
      nip: operatorPTK.nip || '19950812 202321 1 012',
      nuptk: operatorPTK.nuptk || '9358 7736 7413 0073',
      pangkatGol: operatorPTK.pangkatGolongan || operatorPTK.golongan || 'Ahli Pertama, IX (PPPK)',
      jabatanDefinitif: 'Tenaga Kependidikan Ahli Pertama IX',
      jabatanPokok: 'Staf Tata Usaha / IT',
      ekuivalensiJp: 12,
      sasaranTugas: 'Sistem Dapodik, Proktor ANBK & Layanan IT',
      keterangan: 'Sinkronisasi Dapodikdasmen, Proktor Utama ANBK / TKA, Manajemen Akun Belajar.id & Web Sekolah',
      tanggalSK: `${currentYear}-07-13`,
      tempatPenetapan: 'Unggulino',
      status: 'Aktif',
      templateNama: 'SK Tugas Tertentu T.P 2026-2027',
      drivePath: 'TATA USAHA/SK',
      statusDrive: 'Tersimpan',
    });
  }

  // 5. WAKIL KEPALA SEKOLAH BIDANG KURIKULUM (Suherman, S.Pd.Gr / Guru Terpilih)
  const suhermanPTK = guruPTKList.find((g) => (g.namaLengkap || '').toLowerCase().includes('suherman'));
  if (suhermanPTK && !hasTask(suhermanPTK.namaLengkap, 'wakil kepala sekolah')) {
    result.push({
      id: `SKTT-${currentYear}-WAKASEK-KURIKULUM`,
      noSK: defaultNoSK,
      tahunAjaran,
      semester,
      jenisTugas: 'Wakil Kepala Sekolah',
      namaPetugas: formatFullName(suhermanPTK),
      nip: suhermanPTK.nip || '19881231 201903 1 013',
      nuptk: suhermanPTK.nuptk || '1563 7666 6712 0003',
      pangkatGol: suhermanPTK.pangkatGolongan || suhermanPTK.golongan || 'Penata, III/c',
      jabatanDefinitif: 'Guru Muda / Penata III/c',
      jabatanPokok: 'Guru Mata Pelajaran IPA',
      ekuivalensiJp: 12,
      sasaranTugas: 'Bidang Kurikulum & Akademik',
      keterangan: 'Penyusunan KOSP, Supervisi Akademik, Pengelolaan Jadwal KBM & Asesmen',
      tanggalSK: `${currentYear}-07-13`,
      tempatPenetapan: 'Unggulino',
      status: 'Aktif',
      templateNama: 'SK Tugas Tertentu T.P 2026-2027',
      drivePath: 'TATA USAHA/SK',
      statusDrive: 'Tersimpan',
    });
  }

  // Sinkronkan data NIP, NUPTK, Pangkat/Gol dari PTK ke record SK yang sudah ada
  guruPTKList.forEach((ptk) => {
    const ptkNama = (ptk.namaLengkap || '').toLowerCase();
    result.forEach((skItem) => {
      if (skItem.namaPetugas.toLowerCase().includes(ptkNama) && ptkNama.length > 3) {
        if (ptk.nip && ptk.nip !== '-' && (!skItem.nip || skItem.nip === '-')) {
          skItem.nip = ptk.nip;
        }
        if (ptk.nuptk && ptk.nuptk !== '-' && (!skItem.nuptk || skItem.nuptk === '-')) {
          skItem.nuptk = ptk.nuptk;
        }
        if (ptk.pangkatGolongan || ptk.golongan) {
          skItem.pangkatGol = ptk.pangkatGolongan || ptk.golongan;
        }
      }
    });
  });

  // Urutkan seluruh hasil secara ketat berdasarkan hierarki jenjang jabatan
  return sortSKTugasTambahanByHierarchy(result);
}

/**
 * Menghasilkan Dokumen HTML Lengkap SK Tugas Tertentu / Tugas Tambahan
 * Berdasarkan Master Berkas Google Drive "SK Tugas Tertentu T.P 2026-2027" (Folder TATA USAHA/SK)
 * Halaman 1 (SK): A4 Portrait
 * Halaman 2 (Lampiran I Tabel Pembagian Tugas): A4 Landscape Otomatis
 */
export function generateSKTugasTertentuFullHtml(
  skList: SKTugasTambahan[],
  skHeader: SKTugasTertentuHeader,
  identitas: IdentitasSekolah,
  mode: SKPrintMode = 'all'
): string {
  // Selalu urutkan daftar tugas berdasarkan jenjang jabatan pimpinan (Kepala Sekolah -> Wakasek -> Ka TU, dst.)
  const sortedSKList = sortSKTugasTambahanByHierarchy(skList);

  const tanggalFormat = formatTanggalIndonesia(skHeader.tanggalSK) || '13 Juli 2026';
  const tempatFormat = skHeader.tempatPenetapan || 'Unggulino';
  const perihalSK =
    skHeader.tentang || generateDefaultPerihalSKTugasTertentu(skHeader.semester, skHeader.tahunAjaran);
  const kepsekNama = identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si';
  const kepsekNip = identitas.nipKepalaSekolah || '19710110 199412 1 0012';

  const menimbangList =
    skHeader.menimbang && skHeader.menimbang.length > 0
      ? skHeader.menimbang
      : DEFAULT_MENIMBANG_SK_TUGAS_TERTENTU(skHeader.tahunAjaran, skHeader.semester);

  const mengingatList =
    skHeader.mengingat && skHeader.mengingat.length > 0
      ? skHeader.mengingat
      : DEFAULT_MENGINGAT_SK;

  const memperhatikanList =
    skHeader.memperhatikan && skHeader.memperhatikan.length > 0
      ? skHeader.memperhatikan
      : DEFAULT_MEMPERHATIKAN_SK_LIST(skHeader.tahunAjaran, skHeader.tanggalSK);

  let totalEkuivalensi = 0;
  sortedSKList.forEach((item) => {
    totalEkuivalensi += item.ekuivalensiJp || 0;
  });

  const abjadList = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>SK TUGAS TERTENTU - ${skHeader.noSK || 'SMPN 2 PURIALA'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }
    @page lampiran-page {
      size: A4 landscape;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page-container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 16mm 18mm;
      box-sizing: border-box;
      background: #fff;
    }
    .lampiran-container {
      page: lampiran-page;
      page-break-before: always;
      width: 100%;
      max-width: 297mm;
      margin: 0 auto;
      padding: 12mm 15mm;
      box-sizing: border-box;
      background: #fff;
    }
    @media screen {
      body {
        background: #f1f5f9;
        padding: 20px;
      }
      .page-container {
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin-bottom: 25px;
      }
      .lampiran-container {
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }
    .kop-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #000;
      padding-bottom: 5px;
      margin-bottom: 12px;
      position: relative;
    }
    .kop-logo-kiri {
      width: 72px;
      height: auto;
      object-fit: contain;
    }
    .kop-logo-kanan {
      width: 74px;
      height: auto;
      object-fit: contain;
    }
    .kop-text-center {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }
    .kop-h1 {
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 0;
      line-height: 1.2;
    }
    .kop-h2 {
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 1px 0;
      line-height: 1.2;
    }
    .kop-h3 {
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 2px 0;
      line-height: 1.2;
    }
    .kop-alamat {
      font-size: 8.5pt;
      font-style: italic;
      margin: 2px 0 0 0;
      line-height: 1.2;
    }
    .judul-sk-wrap {
      text-align: center;
      margin-bottom: 14px;
    }
    .judul-sk-title {
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 0;
      line-height: 1.25;
    }
    .judul-sk-no {
      font-size: 10.5pt;
      font-weight: bold;
      margin-top: 1px;
      margin-bottom: 6px;
    }
    .judul-sk-tentang {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      max-width: 92%;
      margin: 0 auto;
      line-height: 1.25;
    }
    .judul-sk-pejabat {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 8px;
      margin-bottom: 8px;
      text-transform: uppercase;
      text-align: center;
    }
    .section-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 10pt;
      line-height: 1.3;
    }
    .section-table td {
      vertical-align: top;
      padding: 1.5px 0;
    }
    .col-label {
      width: 115px;
      font-weight: bold;
    }
    .col-colon {
      width: 15px;
      text-align: center;
      font-weight: bold;
    }
    .col-num {
      width: 20px;
      text-align: left;
    }
    .col-content {
      text-align: justify;
    }
    .memutuskan-title {
      text-align: center;
      font-weight: bold;
      font-size: 11pt;
      letter-spacing: 2px;
      margin: 10px 0 6px 0;
    }
    .diktum-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10pt;
      line-height: 1.3;
    }
    .diktum-table td {
      vertical-align: top;
      padding: 2px 0;
    }
    .diktum-label {
      width: 115px;
      font-weight: bold;
    }
    .signature-wrapper {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }
    .signature-box {
      width: 250px;
      text-align: left;
      font-size: 10pt;
      line-height: 1.25;
    }
    .signature-space {
      height: 55px;
    }
    .tembusan-block {
      margin-top: 8px;
      font-size: 8.5pt;
      line-height: 1.25;
      page-break-inside: avoid;
    }
    .tembusan-title {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 2px;
    }
    .tembusan-ol {
      margin: 0;
      padding-left: 16px;
    }
    /* LAMPIRAN STYLES */
    .lampiran-head-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 10px;
      line-height: 1.25;
    }
    .lampiran-head-table td {
      vertical-align: top;
      padding: 1px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      line-height: 1.2;
      margin-top: 6px;
    }
    .data-table th, .data-table td {
      border: 1px solid #000;
      padding: 4.5px 5px;
      vertical-align: middle;
    }
    .data-table th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
      font-size: 9pt;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-mono { font-family: monospace, Courier, monospace; }
  </style>
</head>
<body>

  ${
    mode === 'all' || mode === 'sk_only'
      ? `
  <!-- HALAMAN 1: SURAT KEPUTUSAN RESMI (PORTRAIT) -->
  <div class="page-container">
    <!-- KOP SURAT RESMI KEDINASAN SIMETRIS PERSIS MASTER -->
    <div style="width: 100%; margin-bottom: 14px; font-family: 'Times New Roman', Times, serif; color: #000000;">
      <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
        <tr>
          <!-- LOGO KIRI: Pemkab Konawe -->
          <td style="width: 90px; min-width: 90px; max-width: 90px; vertical-align: middle; text-align: center; padding: 0;">
            <img 
              src="${LOGO_KABUPATEN_KONAWE_BASE64}" 
              alt="Logo Pemkab Konawe" 
              style="width: 76px; max-width: 80px; height: auto; display: block; margin: 0 auto; object-fit: contain;" 
            />
          </td>

          <!-- TEKS KOP TENGAH: Presisi Simetris -->
          <td style="vertical-align: middle; text-align: center; padding: 0 10px;">
            <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.2;">
              PEMERINTAH KABUPATEN KONAWE
            </div>
            <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0; line-height: 1.2;">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </div>
            <div style="font-size: 16pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0 3px 0; line-height: 1.2;">
              ${identitas.namaSekolah || 'SMP NEGERI 2 PURIALA'}
            </div>
            <div style="font-size: 9.5pt; font-weight: bold; margin: 1px 0; line-height: 1.2;">
              Terakreditasi "${identitas.akreditasi || 'B (Baik)'}"
            </div>
            <div style="font-size: 9pt; font-style: normal; margin: 1px 0; line-height: 1.25;">
              Alamat: ${identitas.alamat || 'Jl. Poros Lambuya – Motaha Km.23 Kec. Puriala'}, Kode Pos: ${identitas.kodePos || '93462'}
            </div>
            <div style="font-size: 8.5pt; font-style: normal; margin: 0; line-height: 1.25;">
              NPSN: ${identitas.npsn || '40402805'} | Email: ${identitas.email || 'smpnpuriala523@gmail.com'}
            </div>
          </td>

          <!-- LOGO KANAN: Tut Wuri Handayani -->
          <td style="width: 90px; min-width: 90px; max-width: 90px; vertical-align: middle; text-align: center; padding: 0;">
            <img 
              src="${LOGO_TUT_WURI_BASE64}" 
              alt="Logo Tut Wuri Handayani" 
              style="width: 76px; max-width: 80px; height: auto; display: block; margin: 0 auto; object-fit: contain;" 
            />
          </td>
        </tr>
      </table>

      <!-- GARIS GANDA KOP SURAT (Tebal & Tipis Klasik Kedinasan) -->
      <div style="border-top: 2.5px solid #000000; border-bottom: 1px solid #000000; height: 2px; margin-top: 6px; margin-bottom: 4px;"></div>
    </div>

    <!-- JUDUL SURAT KEPUTUSAN -->
    <div class="judul-sk-wrap">
      <div class="judul-sk-title">KEPUTUSAN KEPALA SMP NEGERI 2 PURIALA</div>
      <div class="judul-sk-no">NOMOR : ${skHeader.noSK || '400.3.12.2/054/SMP-02/PRL/VII/2026'}</div>
      <div style="font-weight: bold; margin-bottom: 2px;">TENTANG</div>
      <div class="judul-sk-tentang">${perihalSK}</div>
    </div>

    <div class="judul-sk-pejabat">KEPALA SMP NEGERI 2 PURIALA,</div>

    <!-- KONSIDERANS MENIMBANG -->
    <table class="section-table">
      ${menimbangList
        .map(
          (m, idx) => `
        <tr>
          ${idx === 0 ? `<td class="col-label" rowspan="${menimbangList.length}">Menimbang</td><td class="col-colon" rowspan="${menimbangList.length}">:</td>` : ''}
          <td class="col-num">${abjadList[idx] || idx + 1}.</td>
          <td class="col-content">${m}</td>
        </tr>
      `
        )
        .join('')}
    </table>

    <!-- KONSIDERANS MENGINGAT -->
    <table class="section-table">
      ${mengingatList
        .map(
          (m, idx) => `
        <tr>
          ${idx === 0 ? `<td class="col-label" rowspan="${mengingatList.length}">Mengingat</td><td class="col-colon" rowspan="${mengingatList.length}">:</td>` : ''}
          <td class="col-num">${idx + 1}.</td>
          <td class="col-content">${m}</td>
        </tr>
      `
        )
        .join('')}
    </table>

    <!-- KONSIDERANS MEMPERHATIKAN -->
    <table class="section-table">
      ${memperhatikanList
        .map(
          (m, idx) => `
        <tr>
          ${idx === 0 ? `<td class="col-label" rowspan="${memperhatikanList.length}">Memperhatikan</td><td class="col-colon" rowspan="${memperhatikanList.length}">:</td>` : ''}
          <td class="col-num">${idx + 1}.</td>
          <td class="col-content">${m}</td>
        </tr>
      `
        )
        .join('')}
    </table>

    <div class="memutuskan-title">MEMUTUSKAN :</div>

    <!-- DIKTUM KEPUTUSAN -->
    <table class="diktum-table">
      <tr>
        <td class="diktum-label">Menetapkan</td>
        <td class="col-colon">:</td>
        <td class="col-content font-bold uppercase">
          KEPUTUSAN KEPALA SMP NEGERI 2 PURIALA TENTANG PEMBAGIAN TUGAS TERTENTU / TUGAS TAMBAHAN BAGI GURU DAN TENAGA KEPENDIDIKAN TAHUN PELAJARAN ${skHeader.tahunAjaran}.
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KESATU</td>
        <td class="col-colon">:</td>
        <td class="col-content">
          Menugaskan guru dan tenaga kependidikan yang namanya tercantum dalam Lampiran Keputusan ini untuk melaksanakan tugas tertentu / tugas tambahan sebagaimana tercantum pada lajur penugasan.
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KEDUA</td>
        <td class="col-colon">:</td>
        <td class="col-content">
          Masing-masing guru dan tenaga kependidikan melaporkan pelaksanaan tugasnya secara tertulis dan berkala kepada Kepala Sekolah.
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KETIGA</td>
        <td class="col-colon">:</td>
        <td class="col-content">
          Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan pada anggaran yang sesuai (Bantuan Operasional Satuan Pendidikan / BOSP).
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KEEMPAT</td>
        <td class="col-colon">:</td>
        <td class="col-content">
          Keputusan ini mulai berlaku sejak tanggal ditetapkan, dengan ketentuan apabila terdapat kekeliruan dalam keputusan ini akan diadakan perbaikan sebagaimana mestinya.
        </td>
      </tr>
    </table>

    <!-- TANDA TANGAN KEPALA SEKOLAH -->
    <div class="signature-wrapper">
      <div class="signature-box">
        <div>Ditetapkan di : ${tempatFormat}</div>
        <div>Pada tanggal : ${tanggalFormat}</div>
        <div style="margin-top: 4px; font-weight: bold;">Kepala Sekolah,</div>
        <div class="signature-space"></div>
        <div class="font-bold underline">${kepsekNama}</div>
        <div>NIP. ${kepsekNip}</div>
      </div>
    </div>

    <!-- TEMBUSAN -->
    <div class="tembusan-block">
      <div class="tembusan-title">Tembusan disampaikan Kepada Yth:</div>
      <ol class="tembusan-ol">
        <li>Kepala Dinas Pendidikan dan Kebudayaan Kabupaten Konawe di Unaaha;</li>
        <li>Pengawas Pembina SMP Dinas Dikbud Kabupaten Konawe;</li>
        <li>Yang bersangkutan untuk diketahui dan dilaksanakan;</li>
        <li>Arsip.</li>
      </ol>
    </div>
  </div>
  `
      : ''
  }

  ${
    mode === 'all' || mode === 'lampiran_only'
      ? `
  <!-- HALAMAN 2: LAMPIRAN I (TABEL PEMBAGIAN TUGAS TERTENTU / TUGAS TAMBAHAN - LANDSCAPE) -->
  <div class="lampiran-container">
    <table class="lampiran-head-table">
      <tr>
        <td style="width: 68%;"></td>
        <td style="width: 32%;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="width: 80px;">LAMPIRAN I</td><td>: KEPUTUSAN KEPALA SMP NEGERI 2 PURIALA</td></tr>
            <tr><td>NOMOR</td><td>: ${skHeader.noSK || '400.3.12.2/054/SMP-02/PRL/VII/2026'}</td></tr>
            <tr><td>TANGGAL</td><td>: ${tanggalFormat}</td></tr>
            <tr><td>TENTANG</td><td>: PEMBAGIAN TUGAS TERTENTU / TUGAS TAMBAHAN T.P ${skHeader.tahunAjaran}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">
        DAFTAR PEMBAGIAN TUGAS TERTENTU / TUGAS TAMBAHAN GURU DAN TENAGA KEPENDIDIKAN
      </div>
      <div style="font-weight: bold; font-size: 10.5pt;">
        SEMESTER ${skHeader.semester === 'Ganjil' ? '1 (GANJIL)' : '2 (GENAP)'} TAHUN PELAJARAN ${skHeader.tahunAjaran}
      </div>
      <div style="font-size: 9pt; font-style: italic; color: #475569;">
        Format Master Berkas Google Drive Folder TATA USAHA/SK: "SK Tugas Tertentu T.P 2026-2027"
      </div>
    </div>

    <!-- TABEL UTAMA PENUGASAN TUGAS TERTENTU -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px;">NO</th>
          <th style="width: 220px;">NAMA LENGKAP &amp; GELAR<br><span style="font-size: 8pt; font-weight: normal;">NIP / PANGKAT GOLONGAN</span></th>
          <th style="width: 140px;">JABATAN POKOK</th>
          <th style="width: 190px;">TUGAS TERTENTU / TUGAS TAMBAHAN</th>
          <th style="width: 70px;">EKUIVALENSI BEBAN KERJA</th>
          <th>SASARAN TUGAS, URAIAN &amp; KETERANGAN</th>
        </tr>
      </thead>
      <tbody>
        ${sortedSKList
          .map(
            (item, idx) => `
          <tr>
            <td class="text-center font-bold">${idx + 1}</td>
            <td>
              <div class="font-bold">${item.namaPetugas}</div>
              <div style="font-size: 8pt; color: #333;">NIP. ${item.nip || '-'}</div>
              <div style="font-size: 8pt; color: #555;">${item.pangkatGol || item.jabatanDefinitif || '-'}</div>
            </td>
            <td>${item.jabatanPokok || item.jabatanDefinitif || 'Guru Mata Pelajaran'}</td>
            <td>
              <strong style="color: #1e3a8a;">${item.jenisTugas}</strong>
            </td>
            <td class="text-center font-bold" style="background-color: #f8fafc;">
              ${item.ekuivalensiJp ? `${item.ekuivalensiJp} JP` : '-'}
            </td>
            <td>
              ${item.sasaranTugas ? `<div><strong>Sasaran:</strong> ${item.sasaranTugas}</div>` : ''}
              <div>${item.keterangan || '-'}</div>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="4" class="text-right" style="padding-right: 10px;">TOTAL EKUIVALENSI BEBAN KERJA TUGAS TERTENTU:</td>
          <td class="text-center" style="color: #047857;">${totalEkuivalensi} JP</td>
          <td>${sortedSKList.length} Personil Guru &amp; Tenaga Kependidikan Ditugaskan</td>
        </tr>
      </tfoot>
    </table>

    <!-- PENGESAHAN LAMPIRAN -->
    <div class="signature-wrapper" style="margin-top: 18px;">
      <div class="signature-box">
        <div>Ditetapkan di : ${tempatFormat}</div>
        <div>Pada tanggal : ${tanggalFormat}</div>
        <div style="margin-top: 4px; font-weight: bold;">Kepala Sekolah,</div>
        <div class="signature-space"></div>
        <div class="font-bold underline">${kepsekNama}</div>
        <div>NIP. ${kepsekNip}</div>
      </div>
    </div>
  </div>
  `
      : ''
  }

</body>
</html>`;
}

/**
 * Unduh Dokumen HTML Resmi SK Tugas Tertentu yang siap dicetak ke PDF atau dibuka di Word/Docs
 */
export function downloadSKTugasTertentuHtmlFile(
  skList: SKTugasTambahan[],
  skHeader: SKTugasTertentuHeader,
  identitas: IdentitasSekolah,
  mode: SKPrintMode = 'all'
) {
  const html = generateSKTugasTertentuFullHtml(skList, skHeader, identitas, mode);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeNoSK = (skHeader.noSK || 'SK_Tugas_Tertentu').replace(/[/\\?%*:|"<>]/g, '_');
  const modeSuffix =
    mode === 'lampiran_only'
      ? '_Lampiran_Landscape'
      : mode === 'sk_only'
      ? '_SK_Portrait'
      : '_Lengkap';
  a.download = `SK_Tugas_Tertentu_${safeNoSK}_TP_${skHeader.tahunAjaran.replace('/', '-')}${modeSuffix}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format terbilang angka hari (contoh: 1 -> Satu, 2 -> Dua, 3 -> Tiga)
 */
export function terbilangHari(n: number): string {
  const words = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (n >= 0 && n <= 11) return words[n];
  if (n < 20) return words[n - 10] + ' Belas';
  if (n < 100) return words[Math.floor(n / 10)] + ' Puluh' + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
  return `${n}`;
}

export type SPTPrintMode = 'spt_only' | 'sppd_only' | 'sppd_hal1' | 'sppd_hal2' | 'all';

/**
 * Menghasilkan Dokumen HTML Resmi Surat Perintah Tugas (SPT) & SPPD
 * 100% Standar Sesuai Format Google Drive Master Folder TATA USAHA/SURAT/SURAT KELUAR (File "SPPD" Sheet "SPPD HAL-1" & Sheet "SPPD HAL-2")
 * Menggabungkan Sheet SPPD HAL-1 (Lembar Muka) dan Sheet SPPD HAL-2 (Lembar Visum / Konfirmasi Keberangkatan & Kedatangan)
 */
export function generateSuratTugasFullHtml(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah,
  mode: SPTPrintMode = 'sppd_only'
): string {
  const tanggalFormat = formatTanggalIndonesia(tugas.tanggalSurat || tugas.tanggalBerangkat) || '13 Juli 2026';
  const tempatPenetapan = tugas.tempatPenetapan || 'Unggulino';
  const kepsekNama = identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si';
  const kepsekNip = identitas.nipKepalaSekolah || '19710110 199412 1 0012';
  const kepsekPangkat = identitas.pangkatKepsek || 'Pembina, IV/a';

  const personilList = tugas.personil && tugas.personil.length > 0 ? tugas.personil : [
    {
      nama: kepsekNama,
      nip: kepsekNip,
      pangkatGol: kepsekPangkat,
      jabatan: 'Kepala Sekolah',
    }
  ];

  const lamaHariAngka = tugas.lamaHari || 1;
  const lamaHariTeks = terbilangHari(lamaHariAngka);
  const isMultiPersonil = personilList.length > 1;

  const showSPT = mode === 'spt_only' || mode === 'all';
  const showSPPDHal1 = mode === 'sppd_only' || mode === 'sppd_hal1' || mode === 'all';
  const showSPPDHal2 = mode === 'sppd_only' || mode === 'sppd_hal2' || mode === 'all';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SPPD & SPT - ${tugas.noSuratTugas} - ${identitas.namaSekolah || 'SMP NEGERI 2 PURIALA'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 1.2cm 1.5cm 1.2cm 1.5cm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: #000;
        font-family: 'Times New Roman', Times, serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
        clear: both;
      }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      line-height: 1.3;
      color: #000000;
      background-color: #f1f5f9;
      padding: 0;
      margin: 0;
    }
    .document-page {
      background: #fff;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto 20px auto;
      padding: 1.4cm 1.6cm 1.4cm 1.6cm;
      box-sizing: border-box;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      position: relative;
    }
    @media print {
      .document-page {
        box-shadow: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
        min-height: auto;
      }
    }

    /* KOP SURAT RESMI GANDA */
    .kop-header {
      width: 100%;
      margin-bottom: 10px;
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
    }
    .kop-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 0;
      padding: 0;
    }
    .kop-logo-td {
      width: 80px;
      min-width: 80px;
      max-width: 80px;
      vertical-align: middle;
      text-align: center;
      padding: 0;
    }
    .kop-logo {
      width: 72px;
      max-width: 75px;
      height: auto;
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }
    .kop-text-td {
      vertical-align: middle;
      text-align: center;
      padding: 0 8px;
    }
    .kop-instansi {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      line-height: 1.2;
    }
    .kop-dinas {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 2px 0;
      line-height: 1.2;
    }
    .kop-sekolah {
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 2px 0 3px 0;
      line-height: 1.2;
    }
    .kop-akreditasi {
      font-size: 9pt;
      font-weight: bold;
      margin: 1px 0;
      line-height: 1.2;
    }
    .kop-alamat {
      font-size: 8.5pt;
      margin: 1px 0;
      line-height: 1.25;
    }
    .kop-kontak {
      font-size: 8pt;
      margin: 0;
      line-height: 1.25;
    }
    .kop-line-double {
      border-top: 2.5px solid #000000;
      border-bottom: 1px solid #000000;
      height: 2px;
      margin-top: 5px;
      margin-bottom: 8px;
    }

    /* JUDUL SURAT */
    .judul-surat-box {
      text-align: center;
      margin: 8px 0 12px 0;
    }
    .judul-surat-title {
      font-size: 12.5pt;
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .judul-surat-nomor {
      font-size: 10.5pt;
      font-weight: bold;
    }

    /* TABEL SPPD HALAMAN 1 */
    .sppd-meta-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 4px;
      font-size: 9.5pt;
    }
    .sppd-meta-table {
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .sppd-meta-table td {
      padding: 1px 3px;
    }
    .table-sppd-main {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-top: 4px;
      margin-bottom: 10px;
    }
    .table-sppd-main th, .table-sppd-main td {
      border: 1px solid #000;
      padding: 3.5px 6px;
      vertical-align: top;
    }

    /* TABEL SPPD HALAMAN 2 (VISUM & PENGESAHAN) */
    .sppd-hal2-header-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 6px;
    }
    .sppd-hal2-header-table td {
      padding: 1px 4px;
      vertical-align: top;
    }
    .table-visum {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    .table-visum th, .table-visum td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
    }
    .visum-sub-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }
    .visum-sub-table td {
      border: none;
      padding: 1px 2px;
      vertical-align: top;
    }

    /* TANDA TANGAN */
    .ttd-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .ttd-box {
      width: 250px;
      text-align: center;
      font-size: 10pt;
    }
    .ttd-space {
      height: 55px;
    }

    /* SHEET BADGE / WATERMARK BANNER FOR SCREEN ONLY */
    .sheet-indicator {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      font-size: 8pt;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-family: sans-serif;
    }
  </style>
</head>
<body>

  ${showSPT ? `
  <!-- ========================================== -->
  <!-- HALAMAN: SURAT PERINTAH TUGAS (SPT) DINAS -->
  <!-- ========================================== -->
  <div class="document-page">
    <div class="no-print" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span class="sheet-indicator">Berkas Master Drive: Surat Perintah Tugas (SPT)</span>
      <span style="font-size: 8.5pt; color: #64748b; font-family: sans-serif;">Halaman Surat Tugas</span>
    </div>

    <!-- KOP SURAT RESMI GANDA -->
    <div class="kop-header">
      <table class="kop-table">
        <tr>
          <td class="kop-logo-td">
            <img src="${LOGO_KABUPATEN_KONAWE_BASE64}" alt="Logo Pemkab Konawe" class="kop-logo" />
          </td>
          <td class="kop-text-td">
            <div class="kop-instansi">PEMERINTAH KABUPATEN KONAWE</div>
            <div class="kop-dinas">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
            <div class="kop-sekolah">${identitas.namaSekolah || 'SMP NEGERI 2 PURIALA'}</div>
            <div class="kop-akreditasi">Terakreditasi "${identitas.akreditasi || 'B (Baik)'}"</div>
            <div class="kop-alamat">Alamat: ${identitas.alamat || 'Jl. Poros Lambuya – Motaha Km.23 Kec. Puriala'}, Kode Pos: ${identitas.kodePos || '93462'}</div>
            <div class="kop-kontak">NPSN: ${identitas.npsn || '40402805'} | Email: ${identitas.email || 'smpnpuriala523@gmail.com'}</div>
          </td>
          <td class="kop-logo-td">
            <img src="${LOGO_TUT_WURI_BASE64}" alt="Logo Tut Wuri Handayani" class="kop-logo" />
          </td>
        </tr>
      </table>
      <div class="kop-line-double"></div>
    </div>

    <!-- Judul & Nomor Surat -->
    <div class="judul-surat-box">
      <div class="judul-surat-title">SURAT PERINTAH TUGAS</div>
      <div class="judul-surat-nomor">Nomor : ${tugas.noSuratTugas}</div>
    </div>

    <!-- Dasar Surat -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt;">
      <tr>
        <td style="width: 80px; font-weight: bold; vertical-align: top;">Dasar</td>
        <td style="width: 10px; text-align: center; vertical-align: top;">:</td>
        <td style="text-align: justify;">${tugas.dasarPenugasan || 'Kepentingan Dinas Operasional Sekolah dan Pembinaan Tugas Tenaga Kependidikan'}</td>
      </tr>
    </table>

    <!-- Memerintahkan -->
    <div style="text-align: center; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 8px 0; font-size: 10.5pt;">
      MEMERINTAHKAN :
    </div>

    <!-- Kepada -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt;">
      <tr>
        <td style="width: 80px; font-weight: bold; vertical-align: top;">Kepada</td>
        <td style="width: 10px; text-align: center; vertical-align: top;">:</td>
        <td>
          ${isMultiPersonil ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 2px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1px solid #000; padding: 4px; width: 25px; text-align: center;">No</th>
                <th style="border: 1px solid #000; padding: 4px;">Nama Lengkap &amp; NIP</th>
                <th style="border: 1px solid #000; padding: 4px;">Pangkat / Gol. Ruang</th>
                <th style="border: 1px solid #000; padding: 4px;">Jabatan / Unit Kerja</th>
              </tr>
            </thead>
            <tbody>
              ${personilList.map((p, idx) => `
              <tr>
                <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${idx + 1}.</td>
                <td style="border: 1px solid #000; padding: 4px;">
                  <div style="font-weight: bold;">${p.nama}</div>
                  <div style="font-size: 8.5pt;">NIP. ${p.nip || '-'}</div>
                </td>
                <td style="border: 1px solid #000; padding: 4px;">${p.pangkatGol || '-'}</td>
                <td style="border: 1px solid #000; padding: 4px;">${p.jabatan || 'Guru'} / SMPN 2 Puriala</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          ` : `
          <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
            <tr>
              <td style="width: 120px; padding: 1px 0;">1. Nama Lengkap</td>
              <td style="width: 10px;">:</td>
              <td style="font-weight: bold;">${personilList[0]?.nama || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">2. NIP</td>
              <td>:</td>
              <td>${personilList[0]?.nip || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">3. Pangkat / Gol.</td>
              <td>:</td>
              <td>${personilList[0]?.pangkatGol || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">4. Jabatan</td>
              <td>:</td>
              <td>${personilList[0]?.jabatan || 'Kepala Sekolah'}</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">5. Unit Kerja</td>
              <td>:</td>
              <td>SMP Negeri 2 Puriala</td>
            </tr>
          </table>
          `}
        </td>
      </tr>
    </table>

    <!-- Untuk -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10pt;">
      <tr>
        <td style="width: 80px; font-weight: bold; vertical-align: top;">Untuk</td>
        <td style="width: 10px; text-align: center; vertical-align: top;">:</td>
        <td>
          <ol style="margin: 0; padding-left: 18px; text-align: justify; line-height: 1.35;">
            <li style="margin-bottom: 4px;">${tugas.maksudTugas}</li>
            <li style="margin-bottom: 4px;">Tempat Pelaksanaan Tugas : <strong>${tugas.tempatTujuan}</strong></li>
            <li style="margin-bottom: 4px;">Lamanya Penugasan : <strong>${lamaHariAngka} (${lamaHariTeks}) hari</strong>, terhitung mulai tanggal <strong>${formatTanggalIndonesia(tugas.tanggalBerangkat)}</strong> sampai dengan <strong>${formatTanggalIndonesia(tugas.tanggalKembali)}</strong>.</li>
            <li style="margin-bottom: 4px;">Alat angkutan yang digunakan : <strong>${tugas.alatAngkut || 'Kendaraan Dinas'}</strong>.</li>
            <li style="margin-bottom: 4px;">Pembebanan Anggaran : Biaya penugasan dibebankan pada <strong>${tugas.bebanAnggaran || 'Dana BOS SMPN 2 Puriala'}</strong>.</li>
            <li style="margin-bottom: 4px;">Setelah selesai melaksanakan tugas, agar segera membuat dan melaporkan hasil pelaksanaan tugas secara tertulis kepada Kepala Sekolah.</li>
            <li style="margin-bottom: 4px;">Surat Perintah Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan dengan penuh rasa tanggung jawab dan dedikasi tinggi.</li>
          </ol>
        </td>
      </tr>
    </table>

    <!-- Tanda Tangan Kepala Sekolah -->
    <div class="ttd-wrapper">
      <div class="ttd-box">
        <div>Dikeluarkan di : ${tempatPenetapan}</div>
        <div>Pada tanggal : ${tanggalFormat}</div>
        <div style="margin-top: 3px; font-weight: bold;">Kepala Sekolah,</div>
        <div class="ttd-space"></div>
        <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${kepsekNama}</div>
        <div>${kepsekPangkat}</div>
        <div>NIP. ${kepsekNip}</div>
      </div>
    </div>

    <!-- Tembusan -->
    <div style="margin-top: 10px; font-size: 9pt;">
      <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Tembusan disampaikan kepada Yth:</div>
      <ol style="margin: 0; padding-left: 18px; line-height: 1.25;">
        <li>Kepala Dinas Pendidikan dan Kebudayaan Kabupaten Konawe di Unaaha;</li>
        <li>Pengawas Pembina SMP Dinas Dikbud Kabupaten Konawe;</li>
        <li>Yang bersangkutan untuk dilaksanakan;</li>
        <li>Arsip Sekolah.</li>
      </ol>
    </div>
  </div>
  ` : ''}

  ${showSPPDHal1 ? `
  <!-- ========================================================================= -->
  <!-- GOOGLE DRIVE: Folder TATA USAHA/SURAT/SURAT KELUAR - File "SPPD"          -->
  <!-- SHEET 1: "SPPD HAL-1" (Format Lembar Depan / Format Utama SPPD)           -->
  <!-- ========================================================================= -->
  <div class="document-page ${showSPT ? 'page-break' : ''}">
    <div class="no-print" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span class="sheet-indicator" style="background-color: #ecfdf5; color: #065f46; border-color: #a7f3d0;">
        Google Drive SPPD • Sheet "SPPD HAL-1" (Halaman 1)
      </span>
      <span style="font-size: 8.5pt; color: #64748b; font-family: sans-serif;">Lembar Muka SPPD</span>
    </div>

    <!-- KOP SURAT RESMI GANDA -->
    <div class="kop-header">
      <table class="kop-table">
        <tr>
          <td class="kop-logo-td">
            <img src="${LOGO_KABUPATEN_KONAWE_BASE64}" alt="Logo Pemkab Konawe" class="kop-logo" />
          </td>
          <td class="kop-text-td">
            <div class="kop-instansi">PEMERINTAH KABUPATEN KONAWE</div>
            <div class="kop-dinas">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
            <div class="kop-sekolah">${identitas.namaSekolah || 'SMP NEGERI 2 PURIALA'}</div>
            <div class="kop-akreditasi">Terakreditasi "${identitas.akreditasi || 'B (Baik)'}"</div>
            <div class="kop-alamat">Alamat: ${identitas.alamat || 'Jl. Poros Lambuya – Motaha Km.23 Kec. Puriala'}, Kode Pos: ${identitas.kodePos || '93462'}</div>
            <div class="kop-kontak">NPSN: ${identitas.npsn || '40402805'} | Email: ${identitas.email || 'smpnpuriala523@gmail.com'}</div>
          </td>
          <td class="kop-logo-td">
            <img src="${LOGO_TUT_WURI_BASE64}" alt="Logo Tut Wuri Handayani" class="kop-logo" />
          </td>
        </tr>
      </table>
      <div class="kop-line-double"></div>
    </div>

    <!-- SPPD Metadata Pojok Kanan Atas (Sheet SPPD HAL-1) -->
    <div class="sppd-meta-box">
      <table class="sppd-meta-table">
        <tr><td>Lembar Ke</td><td>:</td><td>I / II</td></tr>
        <tr><td>Kode No.</td><td>:</td><td>094</td></tr>
        <tr><td>Nomor SPPD</td><td>:</td><td style="font-weight: bold;">${tugas.noSPPD || '094/024/SPPD/SMP.02/VII/2026'}</td></tr>
      </table>
    </div>

    <!-- Judul SPPD -->
    <div class="judul-surat-box" style="margin-top: 2px; margin-bottom: 6px;">
      <div class="judul-surat-title">SURAT PERINTAH PERJALANAN DINAS</div>
      <div style="font-weight: bold; font-size: 11pt; letter-spacing: 2px;">( S P P D )</div>
    </div>

    <!-- Tabel 10 Butir SPPD Lengkap (Sheet SPPD HAL-1) -->
    <table class="table-sppd-main">
      <tbody>
        <tr>
          <td style="width: 25px; text-align: center; font-weight: bold;">1.</td>
          <td style="width: 230px;">Pejabat Berwenang yang memberi perintah</td>
          <td style="font-weight: bold;">Kepala ${identitas.namaSekolah || 'SMP Negeri 2 Puriala'}</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">2.</td>
          <td>Nama Pegawai yang diperintahkan</td>
          <td style="font-weight: bold;">${personilList[0]?.nama || '-'}</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">3.</td>
          <td>
            a. Pangkat dan Golongan Ruang<br>
            b. Jabatan / Instansi<br>
            c. Tingkat Biaya Perjalanan Dinas
          </td>
          <td>
            a. ${personilList[0]?.pangkatGol || '-'}<br>
            b. ${personilList[0]?.jabatan || 'Guru'} / ${identitas.namaSekolah || 'SMP Negeri 2 Puriala'}<br>
            c. Tingkat C (Standar Daerah)
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">4.</td>
          <td>Maksud Perjalanan Dinas</td>
          <td style="text-align: justify;">${tugas.maksudTugas}</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">5.</td>
          <td>Alat Angkutan yang dipergunakan</td>
          <td>${tugas.alatAngkut || 'Kendaraan Dinas'}</td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">6.</td>
          <td>
            a. Tempat Berangkat<br>
            b. Tempat Tujuan
          </td>
          <td>
            a. ${identitas.namaSekolah || 'SMP Negeri 2 Puriala'} (Kec. Puriala)<br>
            b. <strong>${tugas.tempatTujuan}</strong>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">7.</td>
          <td>
            a. Lamanya Perjalanan Dinas<br>
            b. Tanggal Berangkat<br>
            c. Tanggal Harus Kembali
          </td>
          <td>
            a. ${lamaHariAngka} (${lamaHariTeks}) Hari<br>
            b. ${formatTanggalIndonesia(tugas.tanggalBerangkat)}<br>
            c. ${formatTanggalIndonesia(tugas.tanggalKembali)}
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">8.</td>
          <td>Pengikut : Nama / Tanggal Lahir / Keterangan</td>
          <td>
            ${isMultiPersonil ? `
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 1px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="border: 1px solid #999; padding: 2px; width: 20px; text-align: center;">No</th>
                  <th style="border: 1px solid #999; padding: 2px;">Nama Lengkap</th>
                  <th style="border: 1px solid #999; padding: 2px;">NIP / Gol.</th>
                  <th style="border: 1px solid #999; padding: 2px;">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                ${personilList.slice(1).map((p, idx) => `
                <tr>
                  <td style="border: 1px solid #999; padding: 2px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #999; padding: 2px; font-weight: bold;">${p.nama}</td>
                  <td style="border: 1px solid #999; padding: 2px;">${p.nip || '-'} / ${p.pangkatGol || '-'}</td>
                  <td style="border: 1px solid #999; padding: 2px;">${p.jabatan || 'Guru'}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            ` : 'Tidak Ada (-)'}
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">9.</td>
          <td>
            Pembebanan Anggaran :<br>
            a. Instansi<br>
            b. Akun / Mata Anggaran
          </td>
          <td>
            a. ${identitas.namaSekolah || 'SMP Negeri 2 Puriala'}<br>
            b. <strong>${tugas.bebanAnggaran || 'Dana BOS SMPN 2 Puriala'}</strong>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; font-weight: bold;">10.</td>
          <td>Keterangan Lain-lain</td>
          <td>Surat Perintah Tugas (SPT) Nomor: <strong>${tugas.noSuratTugas}</strong></td>
        </tr>
      </tbody>
    </table>

    <!-- Tanda Tangan Pejabat Pembuat Komitmen / Kepala Sekolah (Sheet SPPD HAL-1) -->
    <div class="ttd-wrapper" style="margin-top: 8px;">
      <div class="ttd-box">
        <div>Dikeluarkan di : ${tempatPenetapan}</div>
        <div>Pada tanggal : ${tanggalFormat}</div>
        <div style="margin-top: 3px; font-weight: bold;">Kepala Sekolah / Pejabat Berwenang,</div>
        <div class="ttd-space"></div>
        <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${kepsekNama}</div>
        <div>${kepsekPangkat}</div>
        <div>NIP. ${kepsekNip}</div>
      </div>
    </div>
  </div>
  ` : ''}

  ${showSPPDHal2 ? `
  <!-- ========================================================================= -->
  <!-- GOOGLE DRIVE: Folder TATA USAHA/SURAT/SURAT KELUAR - File "SPPD"          -->
  <!-- SHEET 2: "SPPD HAL-2" (Format Lembar Belakang / Visum & Pengesahan)       -->
  <!-- ========================================================================= -->
  <div class="document-page ${(showSPT || showSPPDHal1) ? 'page-break' : ''}">
    <div class="no-print" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span class="sheet-indicator" style="background-color: #fef3c7; color: #92400e; border-color: #fde68a;">
        Google Drive SPPD • Sheet "SPPD HAL-2" (Halaman 2 - Lembar Belakang / Visum)
      </span>
      <span style="font-size: 8.5pt; color: #64748b; font-family: sans-serif;">Lembar Visum &amp; Catatan Kedatangan</span>
    </div>

    <!-- Header Sheet SPPD HAL-2 -->
    <table class="sppd-hal2-header-table">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <tr><td style="width: 120px;">SPPD No.</td><td style="width: 10px;">:</td><td style="font-weight: bold;">${tugas.noSPPD || '094/024/SPPD/SMP.02/VII/2026'}</td></tr>
            <tr><td>Berangkat dari</td><td>:</td><td>${identitas.namaSekolah || 'SMP Negeri 2 Puriala'}</td></tr>
            <tr><td>(Tempat Kedudukan)</td><td></td><td></td></tr>
            <tr><td>Ke</td><td>:</td><td><strong>${tugas.tempatTujuan}</strong></td></tr>
            <tr><td>Pada tanggal</td><td>:</td><td>${formatTanggalIndonesia(tugas.tanggalBerangkat)}</td></tr>
            <tr><td colspan="3" style="text-align: center; padding-top: 4px; font-weight: bold;">Kepala Sekolah / Pejabat Pembuat Komitmen</td></tr>
            <tr><td colspan="3" style="height: 40px;"></td></tr>
            <tr><td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline; text-transform: uppercase;">${kepsekNama}</td></tr>
            <tr><td colspan="3" style="text-align: center;">NIP. ${kepsekNip}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Tabel Visum / Catatan Perjalanan (Sheet SPPD HAL-2 Kolom I s/d VI) -->
    <table class="table-visum">
      <tbody>
        <!-- KOLOM I & II -->
        <tr>
          <!-- Kolom I: Tiba di Tempat Tujuan -->
          <td style="width: 50%;">
            <table class="visum-sub-table">
              <tr>
                <td style="width: 20px; font-weight: bold;">I.</td>
                <td style="width: 85px;">Tiba di</td>
                <td style="width: 8px;">:</td>
                <td><strong>${tugas.tempatTujuan}</strong></td>
              </tr>
              <tr>
                <td></td>
                <td>Pada tanggal</td>
                <td>:</td>
                <td>${formatTanggalIndonesia(tugas.tanggalBerangkat)}</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center; padding-top: 4px; font-weight: bold;">
                  Kepala / Pejabat Instansi yang dituju :
                </td>
              </tr>
              <tr>
                <td colspan="4" style="height: 48px; text-align: center; vertical-align: bottom; font-size: 8pt; color: #475569;">
                  ( Tanda Tangan &amp; Cap Stempel Resmi )
                </td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center; padding-top: 2px;">
                  ( ..................................................................... )<br>
                  NIP. ................................................................
                </td>
              </tr>
            </table>
          </td>

          <!-- Kolom I Kanan: Berangkat dari Tempat Tujuan -->
          <td style="width: 50%;">
            <table class="visum-sub-table">
              <tr>
                <td style="width: 85px;">Berangkat dari</td>
                <td style="width: 8px;">:</td>
                <td><strong>${tugas.tempatTujuan}</strong></td>
              </tr>
              <tr>
                <td>Ke</td>
                <td>:</td>
                <td>${identitas.namaSekolah || 'SMP Negeri 2 Puriala'}</td>
              </tr>
              <tr>
                <td>Pada tanggal</td>
                <td>:</td>
                <td>${formatTanggalIndonesia(tugas.tanggalKembali)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: center; padding-top: 4px; font-weight: bold;">
                  Kepala / Pejabat Instansi yang dituju :
                </td>
              </tr>
              <tr>
                <td colspan="3" style="height: 48px; text-align: center; vertical-align: bottom; font-size: 8pt; color: #475569;">
                  ( Tanda Tangan &amp; Cap Stempel Resmi )
                </td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: center; padding-top: 2px;">
                  ( ..................................................................... )<br>
                  NIP. ................................................................
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- KOLOM II: Tempat Singgah / Lanjutan Lain (Bila Ada) -->
        <tr>
          <td>
            <table class="visum-sub-table">
              <tr>
                <td style="width: 20px; font-weight: bold;">II.</td>
                <td style="width: 85px;">Tiba di</td>
                <td style="width: 8px;">:</td>
                <td>.................................................................</td>
              </tr>
              <tr>
                <td></td>
                <td>Pada tanggal</td>
                <td>:</td>
                <td>.................................................................</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center; padding-top: 2px;">Kepala / Pejabat :</td>
              </tr>
              <tr>
                <td colspan="4" style="height: 38px;"></td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center;">
                  ( ..................................................................... )<br>
                  NIP. ................................................................
                </td>
              </tr>
            </table>
          </td>
          <td>
            <table class="visum-sub-table">
              <tr>
                <td style="width: 85px;">Berangkat dari</td>
                <td style="width: 8px;">:</td>
                <td>.................................................................</td>
              </tr>
              <tr>
                <td>Ke</td>
                <td>:</td>
                <td>.................................................................</td>
              </tr>
              <tr>
                <td>Pada tanggal</td>
                <td>:</td>
                <td>.................................................................</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: center; padding-top: 2px;">Kepala / Pejabat :</td>
              </tr>
              <tr>
                <td colspan="3" style="height: 38px;"></td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: center;">
                  ( ..................................................................... )<br>
                  NIP. ................................................................
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- KOLOM III: Tiba Kembali di Tempat Kedudukan & Klausul Pemeriksaan Dinas -->
        <tr>
          <td>
            <table class="visum-sub-table">
              <tr>
                <td style="width: 20px; font-weight: bold;">III.</td>
                <td style="width: 85px;">Tiba di</td>
                <td style="width: 8px;">:</td>
                <td>${identitas.namaSekolah || 'SMP Negeri 2 Puriala'}</td>
              </tr>
              <tr>
                <td></td>
                <td colspan="3">(Tempat Kedudukan)</td>
              </tr>
              <tr>
                <td></td>
                <td>Pada tanggal</td>
                <td>:</td>
                <td>${formatTanggalIndonesia(tugas.tanggalKembali)}</td>
              </tr>
              <tr>
                <td colspan="4" style="padding-top: 4px; text-align: justify; font-size: 8pt; line-height: 1.25;">
                  Telah diperiksa, dengan keterangan bahwa perjalanan tersebut di atas benar-benar dilakukan atas perintahnya dan semata-mata untuk kepentingan dinas dalam waktu yang sesingkat-singkatnya.
                </td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center; padding-top: 4px; font-weight: bold;">
                  Kepala Sekolah / Pejabat Pembuat Komitmen
                </td>
              </tr>
              <tr>
                <td colspan="4" style="height: 45px;"></td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center; font-weight: bold; text-decoration: underline; text-transform: uppercase;">
                  ${kepsekNama}
                </td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: center; font-size: 8.5pt;">
                  NIP. ${kepsekNip}
                </td>
              </tr>
            </table>
          </td>
          <td style="vertical-align: top;">
            <table class="visum-sub-table">
              <tr>
                <td style="width: 25px; font-weight: bold;">IV.</td>
                <td style="font-weight: bold; text-transform: uppercase;">CATATAN LAIN-LAIN</td>
              </tr>
              <tr>
                <td></td>
                <td style="font-size: 8.5pt; color: #334155; padding-top: 4px; line-height: 1.3;">
                  Perjalanan dinas ini dilaksanakan sesuai dengan Surat Perintah Tugas (SPT) Nomor: <strong>${tugas.noSuratTugas}</strong> dan ketentuan peraturan perundang-undangan yang berlaku.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- KOLOM V: PERHATIAN & KETENTUAN HUKUM -->
        <tr>
          <td colspan="2" style="font-size: 8pt; line-height: 1.3; background-color: #fafafa;">
            <div style="font-weight: bold; margin-bottom: 2px;">V. PERHATIAN :</div>
            <div style="text-align: justify; font-style: italic;">
              Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara mendapat rugi akibat kesalahan, kealpaan dan kelalaiannya.
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

</body>
</html>`;
}

/**
 * Unduh Dokumen HTML Resmi Surat Tugas yang siap dicetak ke PDF atau dibuka di Word/Docs
 */
export function downloadSuratTugasHtmlFile(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah,
  mode: SPTPrintMode = 'spt_only'
) {
  const html = generateSuratTugasFullHtml(tugas, identitas, mode);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeNoSurat = (tugas.noSuratTugas || 'Surat_Tugas').replace(/[/\\?%*:|"<>]/g, '_');
  const modeSuffix = mode === 'spt_only' ? '_SPT' : mode === 'sppd_only' ? '_SPPD' : '_Lengkap';
  a.download = `Surat_Tugas_${safeNoSurat}${modeSuffix}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Unduh Dokumen Resmi Surat Tugas dalam format Microsoft Word (.doc)
 */
export function downloadSuratTugasDocFile(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah,
  mode: SPTPrintMode = 'spt_only'
) {
  const html = generateSuratTugasFullHtml(tugas, identitas, mode);
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeNoSurat = (tugas.noSuratTugas || 'Surat_Tugas').replace(/[/\\?%*:|"<>]/g, '_');
  a.download = `Surat_Tugas_${safeNoSurat}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


