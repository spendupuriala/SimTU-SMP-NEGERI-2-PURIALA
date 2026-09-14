/**
 * Utility dan Generator Dokumen Resmi SK Panitia Asesmen Tengah Semester (ASTS / UTS)
 * SMP Negeri 2 Puriala - Kabupaten Konawe
 * 
 * Format terstandarisasi 100% sesuai berkas Google Drive Master:
 * "SK Panitia Asesmen Tengah Semester 2026-2027"
 * 
 * Kop Surat: PEMERINTAH KABUPATEN KONAWE, DINAS PENDIDIKAN DAN KEBUDAYAAN, SMP NEGERI 2 PURIALA
 * Format Nomor: 400.3.12.2/[Nomor]/SMP-02/PRL/[Bulan]/[Tahun]
 */

import {
  IdentitasSekolah,
  SKPanitiaASTS,
  SKPanitiaASTSMember,
  JabatanPanitiaASTS,
  PTK,
} from '../types';
import { LOGO_KABUPATEN_KONAWE_BASE64, LOGO_TUT_WURI_BASE64 } from './skLogos';
import { formatTanggalIndonesia } from './skTemplates';
import { getRomanMonth } from './suratTemplates';

export const TEMPLATE_DRIVE_TITLE_SK_PANITIA_ASTS = 'SK Panitia Asesmen Tengah Semester 2026-2027';

/**
 * Daftar Jabatan Baku dalam Kepanitiaan ASTS / UTS
 */
export const DAFTAR_JABATAN_PANITIA_ASTS: {
  jabatan: JabatanPanitiaASTS;
  defaultUraian: string;
}[] = [
  {
    jabatan: 'Penanggung Jawab',
    defaultUraian:
      'Bertanggung jawab penuh atas keseluruhan perencanaan, pelaksanaan, dan evaluasi Asesmen Tengah Semester di SMP Negeri 2 Puriala.',
  },
  {
    jabatan: 'Ketua',
    defaultUraian:
      'Mengkoordinasikan seluruh seksi kerja panitia, memimpin rapat persiapan, menyusun jadwal pelaksanaan, serta memastikan asesmen berjalan tertib dan lancar.',
  },
  {
    jabatan: 'Sekretaris',
    defaultUraian:
      'Menyusun program kerja, daftar peserta, daftar hadir, kartu peserta, berita acara pelaksanaan, administrasi rekapitulasi nilai, dan laporan pertanggungjawaban.',
  },
  {
    jabatan: 'Bendahara',
    defaultUraian:
      'Mengelola dan membukukan anggaran pembiayaan operasional kepanitiaan ASTS sesuai dengan ketentuan RKAS/BOS.',
  },
  {
    jabatan: 'Perlengkapan',
    defaultUraian:
      'Menyiapkan dan menata ruang asesmen, nomor meja peserta, denah tempat duduk, kebersihan ruang, serta fasilitas penunjang asesmen.',
  },
  {
    jabatan: 'Penggandaan',
    defaultUraian:
      'Menghimpun master naskah soal dari guru mata pelajaran, melakukan penggandaan naskah soal dan lembar jawaban, serta menjaga kerahasiaan dokumen asesmen.',
  },
  {
    jabatan: 'Pengepakan',
    defaultUraian:
      'Memeriksa kelengkapan, mengepak naskah soal ke dalam amplop per ruang per sesi, mendistribusikan kepada pengawas ruang, dan menerima kembali lembar jawaban.',
  },
  {
    jabatan: 'Konsumsi',
    defaultUraian:
      'Mengatur dan menyediakan konsumsi bagi panitia pelaksana dan pengawas ruang selama kegiatan asesmen berlangsung.',
  },
  {
    jabatan: 'Anggota',
    defaultUraian:
      'Membantu kelancaran operasional harian kepanitiaan dan bertugas sebagai pengawas ruang asesmen sesuai tata tertib yang berlaku.',
  },
];

/**
 * Konsiderans Menimbang Baku untuk SK Panitia ASTS / UTS
 */
export const DEFAULT_MENIMBANG_SK_PANITIA_ASTS = (
  tahunAjaran: string = '2026/2027',
  semester: string = 'Ganjil'
): string[] => [
  `Bahwa dalam rangka mengukur ketercapaian kompetensi peserta didik setelah mengikuti proses pembelajaran setengah semester pada SMP Negeri 2 Puriala Semester ${semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'} Tahun Pelajaran ${tahunAjaran}, dipandang perlu menyelenggarakan Asesmen Tengah Semester (ASTS) / Ujian Tengah Semester (UTS);`,
  'Bahwa agar pelaksanaan Asesmen Tengah Semester (ASTS) di SMP Negeri 2 Puriala dapat berjalan secara tertib, lancar, objektif, dan terorganisir dengan baik, maka dipandang perlu membentuk Panitia Pelaksana Asesmen Tengah Semester;',
  'Bahwa guru dan tenaga kependidikan yang namanya tercantum dalam lampiran keputusan ini dipandang cakap, berdedikasi, dan memenuhi syarat untuk diserahi tugas sebagai Panitia Pelaksana Asesmen Tengah Semester (ASTS);',
  'Bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a, b, dan c di atas, perlu ditetapkan Keputusan Kepala SMP Negeri 2 Puriala tentang Pembentukan Panitia Pelaksana Asesmen Tengah Semester (ASTS) Tahun Pelajaran ' + tahunAjaran + '.',
];

/**
 * Konsiderans Mengingat Baku untuk SK Panitia ASTS / UTS
 */
export const DEFAULT_MENGINGAT_SK_PANITIA_ASTS: string[] = [
  'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;',
  'Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen;',
  'Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan atas Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan;',
  'Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 10 Tahun 2025 Tentang Standar Kompetensi Lulusan Pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, Dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 12 Tahun 2025 tentang Standar Isi pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah.',
];

/**
 * Konsiderans Memperhatikan Baku untuk SK Panitia ASTS / UTS
 */
export const DEFAULT_MEMPERHATIKAN_SK_PANITIA_ASTS = (
  tahunAjaran: string = '2026/2027',
  tanggalRapat?: string
): string[] => [
  `Kalender Pendidikan SMP Negeri 2 Puriala Tahun Pelajaran ${tahunAjaran};`,
  `Hasil keputusan rapat dewan guru dan tenaga kependidikan SMP Negeri 2 Puriala tentang Persiapan Pelaksanaan Asesmen Tengah Semester (ASTS) Tahun Pelajaran ${tahunAjaran} tanggal ${tanggalRapat ? formatTanggalIndonesia(tanggalRapat) : '10 September 2026'}.`,
];

/**
 * Format Nomor Surat Baku: [Kode Klasifikasi]/[Nomor]/SMP-02/PRL/[Bulan]/[Tahun]
 */
export function generateNomorSuratPanitiaASTS(
  nomorUrut: number | string,
  tanggalSK: string,
  kodeKlasifikasi: string = '400.3.12.2'
): string {
  const d = new Date(tanggalSK || new Date().toISOString().slice(0, 10));
  const monthRoman = getRomanMonth(d.getMonth() + 1);
  const year = d.getFullYear() || 2026;
  const safeNo = String(nomorUrut).padStart(3, '0');
  const safeKode = kodeKlasifikasi?.trim() || '400.3.12.2';

  return `${safeKode}/${safeNo}/SMP-02/PRL/${monthRoman}/${year}`;
}

/**
 * Generate Susunan Panitia Awal berdasarkan data Guru & Tenaga Kependidikan (PTK)
 */
export function buildDefaultSusunanPanitiaASTS(
  identitas: IdentitasSekolah,
  ptkList: PTK[] = []
): SKPanitiaASTSMember[] {
  const result: SKPanitiaASTSMember[] = [];

  // 1. Penanggung Jawab: Kepala Sekolah
  result.push({
    id: 'panitia-pj',
    nama: identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
    nip: identitas.nipKepalaSekolah || '19710110 199412 1 0012',
    pangkatGol: identitas.pangkatKepsek || 'Pembina Tk. I, IV/b',
    jabatanDinas: 'Kepala Sekolah',
    jabatanPanitia: 'Penanggung Jawab',
    uraianTugas:
      'Bertanggung jawab penuh atas keseluruhan perencanaan, pelaksanaan, dan pelaporan Asesmen Tengah Semester.',
  });

  // Role assignments lookup from available PTK or realistic defaults
  const findPTK = (query: string) =>
    ptkList.find(
      (p) =>
        p.namaLengkap.toLowerCase().includes(query.toLowerCase()) ||
        (p.jabatan && p.jabatan.toLowerCase().includes(query.toLowerCase()))
    );

  const getPangkat = (p: PTK | null, fallback: string) =>
    p ? p.pangkatGolongan || p.golongan || fallback : fallback;

  // 2. Ketua Panitia
  const ketuaPTK = findPTK('wakil') || findPTK('kurikulum') || (ptkList[0] || null);
  result.push({
    id: 'panitia-ketua',
    nama: ketuaPTK ? ketuaPTK.namaLengkap : 'Sudirman, S.Pd.',
    nip: ketuaPTK ? ketuaPTK.nip : '19750512 200212 1 004',
    pangkatGol: getPangkat(ketuaPTK, 'Penata Tk. I, III/d'),
    jabatanDinas: ketuaPTK ? ketuaPTK.jabatan || 'Guru Ahli Muda / Wakasek' : 'Guru / Wakasek Kurikulum',
    jabatanPanitia: 'Ketua',
    uraianTugas:
      'Mengkoordinasikan seluruh seksi kepanitiaan, menyusun jadwal ASTS, memimpin rapat teknis, dan mengawasi jalannya asesmen.',
  });

  // 3. Sekretaris
  const sekrPTK = findPTK('hasnawati') || findPTK('tu') || (ptkList[1] || null);
  result.push({
    id: 'panitia-sekretaris',
    nama: sekrPTK ? sekrPTK.namaLengkap : 'Hasnawati, S.Pd.',
    nip: sekrPTK ? sekrPTK.nip : '19820814 200801 2 018',
    pangkatGol: getPangkat(sekrPTK, 'Penata, III/c'),
    jabatanDinas: sekrPTK ? sekrPTK.jabatan || 'Guru Ahli Pertama' : 'Guru Mata Pelajaran',
    jabatanPanitia: 'Sekretaris',
    uraianTugas:
      'Menyusun administrasi ASTS, daftar hadir, berita acara, instrumen penilaian, rekap nilai, dan laporan pertanggungjawaban.',
  });

  // 4. Bendahara
  const bendPTK = findPTK('bendahara') || findPTK('kadek') || (ptkList[2] || null);
  result.push({
    id: 'panitia-bendahara',
    nama: bendPTK ? bendPTK.namaLengkap : 'Kadek Dewi Astuti, S.Pd.',
    nip: bendPTK ? bendPTK.nip : '19850320 200902 2 006',
    pangkatGol: getPangkat(bendPTK, 'Penata Muda Tk. I, III/b'),
    jabatanDinas: bendPTK ? bendPTK.jabatan || 'Guru Ahli Muda' : 'Bendahara Sekolah / Guru',
    jabatanPanitia: 'Bendahara',
    uraianTugas:
      'Mengelola pembiayaan operasional kepanitiaan ASTS sesuai alokasi RKAS dan menyusun laporan keuangan kegiatan.',
  });

  // 5. Perlengkapan
  const perlPTK = findPTK('rustam') || (ptkList[3] || null);
  result.push({
    id: 'panitia-perlengkapan',
    nama: perlPTK ? perlPTK.namaLengkap : 'Rustam, S.Pd.',
    nip: perlPTK ? perlPTK.nip : '19790415 200501 1 009',
    pangkatGol: getPangkat(perlPTK, 'Penata Tk. I, III/d'),
    jabatanDinas: perlPTK ? perlPTK.jabatan || 'Guru Ahli Muda' : 'Guru / Urusan Sarpras',
    jabatanPanitia: 'Perlengkapan',
    uraianTugas:
      'Menyiapkan ruangan ujian, nomor peserta/meja, denah tempat duduk, kelengkapan sarana dan fasilitas pelaksanaan ujian.',
  });

  // 6. Penggandaan
  const penggPTK = findPTK('wahyu') || findPTK('operator') || (ptkList[4] || null);
  result.push({
    id: 'panitia-penggandaan',
    nama: penggPTK ? penggPTK.namaLengkap : 'Wahyu Saputra, S.Kom.',
    nip: penggPTK ? penggPTK.nip : '19920108 202012 1 007',
    pangkatGol: getPangkat(penggPTK, 'Penata Muda, III/a'),
    jabatanDinas: penggPTK ? penggPTK.jabatan || 'Staf Tata Usaha / Operator' : 'Staf Administrasi / IT',
    jabatanPanitia: 'Penggandaan',
    uraianTugas:
      'Menerima naskah master soal dari guru, menggandakan/memfotokopi naskah soal sesuai jumlah siswa, dan menjaga kerahasiaan.',
  });

  // 7. Pengepakan
  const pengepPTK = findPTK('citra') || (ptkList[5] || null);
  result.push({
    id: 'panitia-pengepakan',
    nama: pengepPTK ? pengepPTK.namaLengkap : 'Citra Kirana Lestari, S.Pd.',
    nip: pengepPTK ? pengepPTK.nip : '19890611 201403 2 005',
    pangkatGol: getPangkat(pengepPTK, 'Penata Muda Tk. I, III/b'),
    jabatanDinas: pengepPTK ? pengepPTK.jabatan || 'Guru' : 'Guru Mata Pelajaran',
    jabatanPanitia: 'Pengepakan',
    uraianTugas:
      'Mengepak naskah soal dan LJK per ruangan per mata pelajaran dalam amplop tersegel dan mendistribusikan ke pengawas ruang.',
  });

  // 8. Konsumsi
  const konsPTK = findPTK('anisa') || findPTK('eka') || (ptkList[6] || null);
  result.push({
    id: 'panitia-konsumsi',
    nama: konsPTK ? konsPTK.namaLengkap : 'Anisa Nur Aini, S.Pd.',
    nip: konsPTK ? konsPTK.nip : '19910403 201705 2 008',
    pangkatGol: getPangkat(konsPTK, 'Penata Muda, III/a'),
    jabatanDinas: konsPTK ? konsPTK.jabatan || 'Guru' : 'Guru Mata Pelajaran',
    jabatanPanitia: 'Konsumsi',
    uraianTugas:
      'Menyediakan dan mengatur konsumsi harian bagi panitia pelaksana dan pengawas ruang selama berlangsungnya asesmen.',
  });

  // 9. Anggota / Pengawas
  const anggPTK = findPTK('bayu') || findPTK('deni') || (ptkList[7] || null);
  result.push({
    id: 'panitia-anggota-1',
    nama: anggPTK ? anggPTK.namaLengkap : 'Bayu Saputra, S.Pd.',
    nip: anggPTK ? anggPTK.nip : '19931122 201903 1 006',
    pangkatGol: getPangkat(anggPTK, 'Penata Muda, III/a'),
    jabatanDinas: anggPTK ? anggPTK.jabatan || 'Guru' : 'Guru Mata Pelajaran',
    jabatanPanitia: 'Anggota',
    uraianTugas:
      'Membantu teknis pelaksanaan asesmen dan bertugas mengawasi ketertiban ruang ujian sesuai tata tertib.',
  });

  return result;
}

/**
 * Generator Dokumen HTML Resmi SK Panitia Asesmen Tengah Semester (ASTS / UTS)
 * Sesuai format dokumen master Google Drive "SK Panitia Asesmen Tengah Semester 2026-2027"
 */
export function generateSKPanitiaASTSFullHtml(
  sk: SKPanitiaASTS,
  identitas: IdentitasSekolah
): string {
  const tanggalFormatted = formatTanggalIndonesia(sk.tanggalSK) || '14 September 2026';
  const tempatFormatted = sk.tempatPenetapan || 'Unggulino';
  const kepsekNama = identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si';
  const kepsekNip = identitas.nipKepalaSekolah || '19710110 199412 1 0012';
  const kepsekPangkat = identitas.pangkatKepsek || 'Pembina Tk. I, IV/b';

  const menimbang = sk.menimbang && sk.menimbang.length > 0
    ? sk.menimbang
    : DEFAULT_MENIMBANG_SK_PANITIA_ASTS(sk.tahunAjaran, sk.semester);

  const mengingat = sk.mengingat && sk.mengingat.length > 0
    ? sk.mengingat
    : DEFAULT_MENGINGAT_SK_PANITIA_ASTS;

  const memperhatikan = sk.memperhatikan && sk.memperhatikan.length > 0
    ? sk.memperhatikan
    : DEFAULT_MEMPERHATIKAN_SK_PANITIA_ASTS(sk.tahunAjaran, sk.tanggalSK);

  const abjadList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>SK PANITIA ASTS - ${sk.noSK} - SMPN 2 PURIALA</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 20mm 20mm 25mm; /* Atas: 20mm, Kanan: 20mm, Bawah: 20mm, Kiri: 25mm */
    }
    @page lampiran-page {
      size: A4 portrait;
      margin: 15mm 20mm 20mm 25mm;
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
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 2.2cm 2cm 2cm 2.5cm;
      background: #fff;
    }
    .lampiran-container {
      page: lampiran-page;
      page-break-before: always;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 2cm 2cm 2cm 2.5cm;
      background: #fff;
    }
    @media print {
      body {
        background: #fff;
      }
      .page-container, .lampiran-container {
        width: 100%;
        max-width: none;
        padding: 0;
        margin: 0;
        box-shadow: none;
      }
    }
    @media screen {
      body {
        background: #f1f5f9;
        padding: 24px;
      }
      .page-container, .lampiran-container {
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        margin-bottom: 25px;
      }
    }
    /* KOP SURAT */
    .kop-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .kop-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .kop-text {
      text-align: center;
      flex-grow: 1;
      padding: 0 10px;
    }
    .kop-text h4 {
      margin: 0;
      font-size: 12pt;
      font-weight: normal;
      letter-spacing: 0.5px;
    }
    .kop-text h3 {
      margin: 2px 0 0 0;
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .kop-text h2 {
      margin: 2px 0;
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .kop-text p {
      margin: 2px 0 0 0;
      font-size: 9pt;
      font-style: italic;
      line-height: 1.25;
    }
    /* JUDUL SURAT */
    .judul-surat {
      text-align: center;
      margin-bottom: 16px;
    }
    .judul-surat h3 {
      margin: 0;
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 0.5px;
    }
    .judul-surat p.nomor {
      margin: 3px 0 0 0;
      font-size: 11pt;
      font-weight: normal;
    }
    .tentang-box {
      text-align: center;
      margin: 10px auto;
      max-width: 90%;
    }
    .tentang-box .tentang-label {
      font-size: 11pt;
      font-weight: bold;
      margin: 4px 0;
    }
    .tentang-box .tentang-isi {
      font-size: 11pt;
      font-weight: bold;
      line-height: 1.35;
      text-transform: uppercase;
    }
    .jabatan-penandatangan {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    /* KONSIDERANS TABLE */
    table.konsiderans {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11pt;
    }
    table.konsiderans td {
      vertical-align: top;
      padding: 2px 0;
    }
    table.konsiderans td.kolom-label {
      width: 130px;
      font-weight: bold;
    }
    table.konsiderans td.kolom-titik {
      width: 15px;
      text-align: center;
    }
    table.konsiderans td.kolom-isi {
      text-align: justify;
    }
    .list-item-konsideran {
      display: flex;
      margin-bottom: 3px;
    }
    .list-item-konsideran .abjad {
      width: 22px;
      flex-shrink: 0;
    }
    .list-item-konsideran .teks {
      flex-grow: 1;
      text-align: justify;
    }
    .memutuskan-box {
      text-align: center;
      font-weight: bold;
      margin: 12px 0 10px 0;
      letter-spacing: 1px;
    }
    /* DIKTUM */
    table.diktum {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11pt;
    }
    table.diktum td {
      vertical-align: top;
      padding: 3px 0;
    }
    table.diktum td.diktum-label {
      width: 130px;
      font-weight: bold;
    }
    table.diktum td.diktum-titik {
      width: 15px;
      text-align: center;
    }
    table.diktum td.diktum-isi {
      text-align: justify;
    }
    /* TANDA TANGAN */
    .ttd-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 25px;
    }
    .ttd-box {
      width: 260px;
      text-align: left;
      font-size: 11pt;
    }
    .ttd-space {
      height: 70px;
    }
    .ttd-nama {
      font-weight: bold;
      text-decoration: underline;
    }
    .tembusan-box {
      margin-top: 20px;
      font-size: 10pt;
    }
    .tembusan-box ol {
      margin: 3px 0;
      padding-left: 18px;
    }
    /* LAMPIRAN */
    .lampiran-header {
      font-size: 10pt;
      margin-bottom: 16px;
      line-height: 1.35;
    }
    .lampiran-header table {
      border-collapse: collapse;
    }
    .lampiran-header td {
      padding: 1px 0;
      vertical-align: top;
    }
    .lampiran-judul {
      text-align: center;
      margin-bottom: 18px;
    }
    .lampiran-judul h3 {
      margin: 0;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }
    /* TABEL SUSUNAN PANITIA */
    table.tabel-panitia {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    table.tabel-panitia th, table.tabel-panitia td {
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: middle;
    }
    table.tabel-panitia th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-size: 9.5pt;
    }
    table.tabel-panitia td.center {
      text-align: center;
    }
    table.tabel-panitia td.bold {
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- HALAMAN 1: SURAT KEPUTUSAN (A4 PORTRAIT) -->
  <div class="page-container">
    <!-- KOP SURAT RESMI -->
    <div class="kop-wrapper">
      <img class="kop-logo" src="${LOGO_KABUPATEN_KONAWE_BASE64}" alt="Logo Konawe" />
      <div class="kop-text">
        <h4>PEMERINTAH KABUPATEN KONAWE</h4>
        <h3>DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
        <h2>SMP NEGERI 2 PURIALA</h2>
        <p>Alamat: Jalan Poros Puriala - Motaha, Desa Unggulino, Kec. Puriala, Kab. Konawe, Kode Pos 93466<br />Email: ${identitas.email || 'smpn2puriala@gmail.com'}</p>
      </div>
      <img class="kop-logo" src="${LOGO_TUT_WURI_BASE64}" alt="Logo Tut Wuri" />
    </div>

    <!-- JUDUL & NOMOR SK -->
    <div class="judul-surat">
      <h3>KEPUTUSAN KEPALA SMP NEGERI 2 PURIALA</h3>
      <p class="nomor">Nomor : ${sk.noSK}</p>
    </div>

    <!-- TENTANG -->
    <div class="tentang-box">
      <div class="tentang-label">TENTANG</div>
      <div class="tentang-isi">${sk.tentang}</div>
    </div>

    <div class="jabatan-penandatangan">
      KEPALA SMP NEGERI 2 PURIALA,
    </div>

    <!-- KONSIDERANS -->
    <table class="konsiderans">
      <tr>
        <td class="kolom-label">Menimbang</td>
        <td class="kolom-titik">:</td>
        <td class="kolom-isi">
          ${menimbang
            .map(
              (item, idx) => `
            <div class="list-item-konsideran">
              <span class="abjad">${abjadList[idx] || `${idx + 1}`}.</span>
              <span class="teks">${item}</span>
            </div>`
            )
            .join('')}
        </td>
      </tr>
      <tr>
        <td class="kolom-label">Mengingat</td>
        <td class="kolom-titik">:</td>
        <td class="kolom-isi">
          ${mengingat
            .map(
              (item, idx) => `
            <div class="list-item-konsideran">
              <span class="abjad">${idx + 1}.</span>
              <span class="teks">${item}</span>
            </div>`
            )
            .join('')}
        </td>
      </tr>
      <tr>
        <td class="kolom-label">Memperhatikan</td>
        <td class="kolom-titik">:</td>
        <td class="kolom-isi">
          ${memperhatikan
            .map(
              (item, idx) => `
            <div class="list-item-konsideran">
              <span class="abjad">${idx + 1}.</span>
              <span class="teks">${item}</span>
            </div>`
            )
            .join('')}
        </td>
      </tr>
    </table>

    <!-- MEMUTUSKAN -->
    <div class="memutuskan-box">
      MEMUTUSKAN :
    </div>

    <!-- DIKTUM -->
    <table class="diktum">
      <tr>
        <td class="diktum-label">Menetapkan</td>
        <td class="diktum-titik">:</td>
        <td class="diktum-isi"></td>
      </tr>
      <tr>
        <td class="diktum-label">KESATU</td>
        <td class="diktum-titik">:</td>
        <td class="diktum-isi">
          Membentuk Susunan Panitia Pelaksana Asesmen Tengah Semester (ASTS) / Ujian Tengah Semester (UTS) SMP Negeri 2 Puriala Semester ${sk.semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'} Tahun Pelajaran ${sk.tahunAjaran}, sebagaimana tercantum dalam Lampiran I Keputusan ini.
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KEDUA</td>
        <td class="diktum-titik">:</td>
        <td class="diktum-isi">
          Panitia Pelaksana sebagaimana dimaksud dalam Diktum KESATU bertugas merencanakan, mengorganisasikan, menyusun jadwal dan naskah, mengatur pengawasan, melaksanakan, serta menyusun laporan pertanggungjawaban kegiatan Asesmen Tengah Semester kepada Kepala Sekolah.
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KETIGA</td>
        <td class="diktum-titik">:</td>
        <td class="diktum-isi">
          Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan pada Anggaran Pendapatan dan Belanja Sekolah (APBS) / Bantuan Operasional Satuan Pendidikan (BOSP) SMP Negeri 2 Puriala yang relevan.
        </td>
      </tr>
      <tr>
        <td class="diktum-label">KEEMPAT</td>
        <td class="diktum-titik">:</td>
        <td class="diktum-isi">
          Keputusan ini mulai berlaku sejak tanggal ditetapkan, dan apabila di kemudian hari ternyata terdapat kekeliruan dalam penetapan ini, akan diadakan perbaikan sebagaimana mestinya.
        </td>
      </tr>
    </table>

    <!-- TANDA TANGAN KEPSEK -->
    <div class="ttd-wrapper">
      <div class="ttd-box">
        <div>Ditetapkan di : ${tempatFormatted}</div>
        <div>Pada tanggal : ${tanggalFormatted}</div>
        <div style="margin-top: 6px;">Kepala Sekolah,</div>
        <div class="ttd-space"></div>
        <div class="ttd-nama">${kepsekNama}</div>
        <div>NIP. ${kepsekNip}</div>
        <div>Pangkat/Gol: ${kepsekPangkat}</div>
      </div>
    </div>

    <!-- TEMBUSAN -->
    <div class="tembusan-box">
      <strong>Tembusan disampaikan kepada Yth:</strong>
      <ol>
        <li>Kepala Dinas Pendidikan dan Kebudayaan Kabupaten Konawe di Unaaha;</li>
        <li>Pengawas Pembina SMP Kabupaten Konawe;</li>
        <li>Masing-masing yang bersangkutan untuk diketahui dan dilaksanakan;</li>
        <li>Arsip.</li>
      </ol>
    </div>
  </div>

  <!-- HALAMAN 2: LAMPIRAN I (SUSUNAN KEPANITIAAN) -->
  <div class="lampiran-container">
    <div class="lampiran-header">
      <table>
        <tr>
          <td style="width: 90px;">LAMPIRAN I</td>
          <td style="width: 15px;">:</td>
          <td style="font-weight: bold;">KEPUTUSAN KEPALA SMP NEGERI 2 PURIALA</td>
        </tr>
        <tr>
          <td>NOMOR</td>
          <td>:</td>
          <td>${sk.noSK}</td>
        </tr>
        <tr>
          <td>TANGGAL</td>
          <td>:</td>
          <td>${tanggalFormatted}</td>
        </tr>
        <tr>
          <td>TENTANG</td>
          <td>:</td>
          <td style="font-weight: bold; text-transform: uppercase;">${sk.tentang}</td>
        </tr>
      </table>
    </div>

    <div class="lampiran-judul">
      <h3>SUSUNAN PANITIA PELAKSANA ASESMEN TENGAH SEMESTER (ASTS) / UTS<br>SMP NEGERI 2 PURIALA TAHUN PELAJARAN ${sk.tahunAjaran}</h3>
      ${sk.tanggalPelaksanaan ? `<div style="font-size: 10pt; margin-top: 4px; font-style: italic;">Waktu Pelaksanaan: ${sk.tanggalPelaksanaan}</div>` : ''}
    </div>

    <!-- TABEL SUSUNAN KEPANITIAAN SESUAI DOKUMEN MASTER GOOGLE DRIVE -->
    <table class="tabel-panitia">
      <thead>
        <tr>
          <th style="width: 5%;">NO.</th>
          <th style="width: 25%;">NAMA / NIP</th>
          <th style="width: 20%;">JABATAN DINAS</th>
          <th style="width: 18%;">JABATAN DALAM PANITIA</th>
          <th style="width: 32%;">URAIAN TUGAS</th>
        </tr>
      </thead>
      <tbody>
        ${sk.susunanPanitia.map((anggota, index) => `
          <tr>
            <td class="center">${index + 1}</td>
            <td>
              <div class="bold">${anggota.nama}</div>
              <div style="font-size: 8.5pt; color: #333;">NIP. ${anggota.nip || '-'}</div>
            </td>
            <td>${anggota.jabatanDinas || '-'}</td>
            <td class="bold center">${anggota.jabatanPanitia}</td>
            <td style="font-size: 9pt; text-align: justify;">${anggota.uraianTugas || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- TANDA TANGAN KEPALA SEKOLAH LAMPIRAN I -->
    <div class="ttd-wrapper">
      <div class="ttd-box">
        <div>Ditetapkan di : ${tempatFormatted}</div>
        <div>Pada tanggal : ${tanggalFormatted}</div>
        <div style="margin-top: 6px;">Kepala SMP Negeri 2 Puriala,</div>
        <div class="ttd-space"></div>
        <div class="ttd-nama">${kepsekNama}</div>
        <div>NIP. ${kepsekNip}</div>
        <div>Pangkat/Gol: ${kepsekPangkat}</div>
      </div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Download generated HTML document
 */
export function downloadSKPanitiaASTSHtmlFile(
  sk: SKPanitiaASTS,
  identitas: IdentitasSekolah
): void {
  const html = generateSKPanitiaASTSFullHtml(sk, identitas);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeNo = (sk.noSK || 'SK_Panitia_ASTS').replace(/[/\\?%*:|"<>]/g, '_');
  a.href = url;
  a.download = `SK_Panitia_ASTS_${safeNo}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print directly using hidden iframe
 */
export function printSKPanitiaASTSDirectly(
  sk: SKPanitiaASTS,
  identitas: IdentitasSekolah
): void {
  const html = generateSKPanitiaASTSFullHtml(sk, identitas);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe error:', err);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    }, 500);
  }
}
