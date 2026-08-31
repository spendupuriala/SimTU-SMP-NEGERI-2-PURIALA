/**
 * Template dan Generator Dokumen Resmi Pembuat Surat Otomatis
 * SMP Negeri 2 Puriala - Kabupaten Konawe
 * 
 * Terhubung dengan template master Google Drive (Folder TATA USAHA/SURAT)
 */

import { IdentitasSekolah, PembuatSuratRecord, TargetSubjekSurat } from '../types';
import { LOGO_KABUPATEN_KONAWE_BASE64, LOGO_TUT_WURI_BASE64 } from './skLogos';
import { formatTanggalIndonesia, INDONESIAN_MONTHS } from './skTemplates';

export interface JenisSuratTemplateOption {
  id: string;
  nama: string;
  kodeKlasifikasi: string;
  target: TargetSubjekSurat;
  kategori: string;
  deskripsi: string;
  defaultPerihal: string;
  defaultKeperluan: string;
  driveTemplateName: string;
}

export const DAFTAR_TEMPLATE_SURAT: JenisSuratTemplateOption[] = [
  // --- KATEGORI SISWA ---
  {
    id: 'keterangan_aktif_siswa',
    nama: 'Surat Keterangan Siswa Aktif Sekolah',
    kodeKlasifikasi: '400.3.12.1',
    target: 'siswa',
    kategori: 'Surat Keterangan Kesiswaan',
    deskripsi: 'Menerangkan bahwa peserta didik aktif terdaftar pada tahun pelajaran berjalan.',
    defaultPerihal: 'Surat Keterangan Aktif Sekolah',
    defaultKeperluan: 'Kelengkapan administrasi pengurusan Beasiswa Program Indonesia Pintar (PIP) / Tunjangan Pendidikan / BPJS',
    driveTemplateName: 'Template Surat Keterangan Aktif Siswa',
  },
  {
    id: 'izin_kegiatan_siswa',
    nama: 'Surat Izin Kegiatan Siswa / Dispensasi',
    kodeKlasifikasi: '400.3.5.4',
    target: 'siswa',
    kategori: 'Surat Izin & Dispensasi Siswa',
    deskripsi: 'Surat izin dan dispensasi belajar resmi sekolah bagi peserta didik untuk mengikuti kegiatan, lomba, atau pelatihan di luar sekolah.',
    defaultPerihal: 'Surat Izin / Dispensasi Mengikuti Kegiatan Siswa',
    defaultKeperluan: 'Mengikuti Kegiatan Perkemahan / Lomba Tingkat Kabupaten/Provinsi',
    driveTemplateName: 'Template Surat Izin Kegiatan Siswa',
  },
  {
    id: 'siap_menerima_siswa_pindahan',
    nama: 'Surat Keterangan Siap Menerima Siswa Pindahan',
    kodeKlasifikasi: '400.3.12.1',
    target: 'siswa',
    kategori: 'Surat Mutasi Kesiswaan',
    deskripsi: 'Surat keterangan kesediaan / kesiapan SMP Negeri 2 Puriala menerima kepindahan peserta didik mutasi masuk dari sekolah asal.',
    defaultPerihal: 'Surat Keterangan Siap Menerima Siswa Pindahan',
    defaultKeperluan: 'Kelengkapan administrasi penerbitan Surat Mutasi Keluar dan validasi Dapodik dari sekolah asal',
    driveTemplateName: 'Template Surat Keterangan Siap Menerima Siswa Pindahan',
  },
  {
    id: 'pemberitahuan_pelanggaran_siswa',
    nama: 'Surat Pemberitahuan Orang Tua Siswa terkait Pelanggaran Siswa',
    kodeKlasifikasi: '400.3.11.2',
    target: 'siswa',
    kategori: 'Surat Pembinaan & Tata Tertib Siswa',
    deskripsi: 'Surat resmi pemberitahuan dan pemanggilan orang tua/wali siswa terkait pelanggaran tata tertib sekolah serta pembinaan BK.',
    defaultPerihal: 'Pemberitahuan Pelanggaran Tata Tertib & Panggilan Orang Tua Siswa',
    defaultKeperluan: 'Koordinasi dan pembinaan bersama Wali Kelas, Guru BK, dan Orang Tua terkait kedisiplinan siswa',
    driveTemplateName: 'Surat Pemberitahuan Orang Tua Siswa terkait Pelanggaran Siswa.docx',
  },
  {
    id: 'pemberitahuan_skorsing_siswa',
    nama: 'Surat Pemberitahuan Skorsing Siswa',
    kodeKlasifikasi: '400.3.11.2',
    target: 'siswa',
    kategori: 'Surat Sanksi & Pembinaan Kesiswaan',
    deskripsi: 'Surat keputusan sanksi skorsing / belajar mandiri di rumah bagi peserta didik atas pelanggaran tata tertib kategori berat.',
    defaultPerihal: 'Surat Pemberitahuan Sanksi Skorsing / Belajar Mandiri di Rumah',
    defaultKeperluan: 'Pelaksanaan sanksi pembinaan dan pembelajaran mandiri di bawah pengawasan langsung orang tua/wali',
    driveTemplateName: 'Template Surat Pemberitahuan Skorsing',
  },
  {
    id: 'mutasi_keluar_siswa',
    nama: 'Surat Keterangan Pindah / Mutasi Keluar Siswa',
    kodeKlasifikasi: '400.3.12.1',
    target: 'siswa',
    kategori: 'Surat Mutasi Kesiswaan',
    deskripsi: 'Surat keterangan mutasi peserta didik keluar ke sekolah tujuan atas permohonan orang tua.',
    defaultPerihal: 'Surat Keterangan Pindah Sekolah',
    defaultKeperluan: 'Persyaratan pindah sekolah mengikuti tempat tinggal / domisili orang tua',
    driveTemplateName: 'Template Surat Pindah Sekolah Siswa',
  },
  {
    id: 'kelakuan_baik_siswa',
    nama: 'Surat Keterangan Berkelakuan Baik Siswa',
    kodeKlasifikasi: '400.3.11.2',
    target: 'siswa',
    kategori: 'Surat Rekomendasi & Karakter',
    deskripsi: 'Menerangkan perilaku, kepatuhan tata tertib, dan akhlak baik peserta didik di sekolah.',
    defaultPerihal: 'Surat Keterangan Berkelakuan Baik',
    defaultKeperluan: 'Persyaratan seleksi penerimaan peserta didik baru (PPDB) jenjang SMA/SMK / Beasiswa Prestasi',
    driveTemplateName: 'Template Surat Kelakuan Baik',
  },
  {
    id: 'kehilangan_dokumen_siswa',
    nama: 'Surat Keterangan Kehilangan Ijazah / SKL / NISN',
    kodeKlasifikasi: '400.3.12.1',
    target: 'siswa',
    kategori: 'Surat Keterangan Dokumen',
    deskripsi: 'Keterangan resmi sekolah pengganti ijazah/SKL/NISN yang rusak atau hilang berdasarkan bukti kepolisian.',
    defaultPerihal: 'Surat Keterangan Kehilangan Dokumen',
    defaultKeperluan: 'Pengganti sementara dokumen raport / ijazah yang hilang untuk pendaftaran studi lanjut',
    driveTemplateName: 'Template Surat Keterangan Kehilangan',
  },
  {
    id: 'rekomendasi_beasiswa_siswa',
    nama: 'Surat Rekomendasi Beasiswa / PIP / Prestasi Siswa',
    kodeKlasifikasi: '400.3.5.6',
    target: 'siswa',
    kategori: 'Surat Rekomendasi & Bantuan',
    deskripsi: 'Rekomendasi kepala sekolah untuk pengajuan beasiswa prestasi atau bantuan pendidikan.',
    defaultPerihal: 'Surat Rekomendasi Bantuan Pendidikan / PIP',
    defaultKeperluan: 'Pengajuan dan aktivasi rekening SimPel Program Indonesia Pintar (PIP) Kemendikbudristek',
    driveTemplateName: 'Template Rekomendasi Beasiswa Siswa',
  },
  {
    id: 'pengantar_lomba_siswa',
    nama: 'Surat Pengantar Utusan Lomba / Olimpiade Siswa',
    kodeKlasifikasi: '400.3.5.4',
    target: 'siswa',
    kategori: 'Surat Pengantar & Tugas Siswa',
    deskripsi: 'Surat pengantar partisipasi siswa dalam ajang kompetisi, OSN, O2SN, FLS2N, atau kepramukaan.',
    defaultPerihal: 'Surat Pengantar Utusan Lomba / Prestasi Siswa',
    defaultKeperluan: 'Mengikuti seleksi Olimpiade Sains Nasional (OSN) / Kejuaraan Tingkat Kabupaten Konawe',
    driveTemplateName: 'Template Surat Pengantar Lomba',
  },

  // --- KATEGORI GURU / PTK ---
  {
    id: 'keterangan_aktif_guru',
    nama: 'Surat Keterangan Aktif Mengajar / Melaksanakan Tugas',
    kodeKlasifikasi: '400.3.10.1',
    target: 'guru',
    kategori: 'Surat Kepegawaian PTK',
    deskripsi: 'Menerangkan bahwa pendidik/tenaga kependidikan aktif melaksanakan tugas dengan beban kerja resmi.',
    defaultPerihal: 'Surat Keterangan Melaksanakan Tugas (SKMT)',
    defaultKeperluan: 'Persyaratan pencairan Tunjangan Profesi Guru (TPG) / Sertifikasi / Pemberkasan Dapodik',
    driveTemplateName: 'Template Surat Keterangan Aktif Mengajar PTK',
  },
  {
    id: 'rekomendasi_ppg_guru',
    nama: 'Surat Rekomendasi Tugas Belajar / Izin PPG Daljab',
    kodeKlasifikasi: '400.3.10.3',
    target: 'guru',
    kategori: 'Pengembangan Profesi PTK',
    deskripsi: 'Rekomendasi dan izin pimpinan untuk mengikuti Pendidikan Profesi Guru (PPG) atau studi lanjut.',
    defaultPerihal: 'Surat Rekomendasi & Izin Mengikuti PPG Dalam Jabatan',
    defaultKeperluan: 'Kelengkapan administrasi lapor diri mahasiswa PPG Dalam Jabatan di LPTK / Universitas Penyelenggara',
    driveTemplateName: 'Template Rekomendasi Tugas Belajar PPG',
  },
  {
    id: 'izin_cuti_ptk',
    nama: 'Surat Keterangan Izin / Cuti Dinas Pegawai',
    kodeKlasifikasi: '400.3.10.6',
    target: 'guru',
    kategori: 'Surat Izin & Cuti',
    deskripsi: 'Pemberian izin cuti kerja dinas (tahunan, sakit, bersalin, alasan penting) bagi PTK.',
    defaultPerihal: 'Surat Izin / Cuti Kerja Pegawai',
    defaultKeperluan: 'Izin istirahat dan pemulihan kesehatan / cuti tahunan dengan tetap melimpahkan beban ajar',
    driveTemplateName: 'Template Surat Izin Cuti PTK',
  },
  {
    id: 'pengantar_kgb_ptk',
    nama: 'Surat Pengantar Kenaikan Gaji Berkala (KGB)',
    kodeKlasifikasi: '400.3.10.4',
    target: 'guru',
    kategori: 'Kesejahteraan & Kenaikan Hak',
    deskripsi: 'Surat pengantar berkas usulan kenaikan gaji berkala ke Dinas Pendidikan Kabupaten Konawe.',
    defaultPerihal: 'Pengantar Usulan Kenaikan Gaji Berkala (KGB)',
    defaultKeperluan: 'Proses penerbitan Surat Keputusan Kenaikan Gaji Berkala (KGB) periode berjalan',
    driveTemplateName: 'Template Pengantar KGB PTK',
  },
  {
    id: 'pengantar_pangkat_ptk',
    nama: 'Surat Pengantar Usul Kenaikan Pangkat / Golongan',
    kodeKlasifikasi: '400.3.10.4',
    target: 'guru',
    kategori: 'Karir & Kepangkatan',
    deskripsi: 'Pengantar berkas penetapan angka kredit dan kenaikan pangkat fungsional guru/PTK.',
    defaultPerihal: 'Pengantar Usul Kenaikan Pangkat Pendidik & Tenaga Kependidikan',
    defaultKeperluan: 'Pemberkasan berkas kenaikan pangkat periode Oktober/April ke BKPSDM Kab. Konawe',
    driveTemplateName: 'Template Pengantar Kenaikan Pangkat',
  },
  {
    id: 'keterangan_penghasilan_ptk',
    nama: 'Surat Keterangan Rincian Penghasilan / Gaji Guru',
    kodeKlasifikasi: '400.3.10.6',
    target: 'guru',
    kategori: 'Keterangan Keuangan',
    deskripsi: 'Menerangkan besaran penghasilan bulanan resmi guru/PTK untuk keperluan perbankan/kredit/beasiswa anak.',
    defaultPerihal: 'Surat Keterangan Rincian Penghasilan',
    defaultKeperluan: 'Persyaratan pengajuan kredit perbankan / beasiswa pendidikan putra-putri',
    driveTemplateName: 'Template Keterangan Penghasilan PTK',
  },
  {
    id: 'rekomendasi_mutasi_ptk',
    nama: 'Surat Rekomendasi Permohonan Pindah Tugas (Mutasi)',
    kodeKlasifikasi: '400.3.10.1',
    target: 'guru',
    kategori: 'Mutasi Kepegawaian',
    deskripsi: 'Surat rekomendasi persetujuan melepas / mutasi tugas dinas pendidik ke sekolah atau daerah lain.',
    defaultPerihal: 'Surat Rekomendasi Mutasi / Pindah Tugas Pegawai',
    defaultKeperluan: 'Kelengkapan usulan pindah tugas dinas ke satuan pendidikan tujuan',
    driveTemplateName: 'Template Rekomendasi Mutasi PTK',
  },
];

/**
 * Konversi angka bulan ke angka romawi
 */
export function getRomanMonth(monthIndex: number): string {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[monthIndex] || 'I';
}

/**
 * Ekstrak nomor urut angka dari sebuah string nomor surat / agenda
 * Contoh:
 * - "400.3.5.3/062/SMPN-02/PRL/2026" -> 62
 * - "421.3/062/SMP-02/PRL/VIII/2026" -> 62
 * - "090/062/SMP.02/ST/VII/2026" -> 62
 * - "062/SK/2026" -> 62
 * - "062" -> 62
 */
export function extractNomorUrutFromNoSurat(noSurat: string | undefined | null): number | null {
  if (!noSurat || typeof noSurat !== 'string') return null;
  const trimmed = noSurat.trim();
  if (!trimmed) return null;

  // 1. Bagi berdasarkan garis miring '/'
  const parts = trimmed.split('/');

  if (parts.length >= 2) {
    // Format [Kode]/[NomorUrut]/[Sekolah]... (contoh: 400.3.5.3/062/SMPN-02/PRL/2026 atau 090/062/SMP.02/ST/VII/2026)
    const secondPart = parts[1].trim();
    if (/^\d{1,4}$/.test(secondPart)) {
      const num = parseInt(secondPart, 10);
      if (!isNaN(num) && num > 0 && num < 1900) {
        return num;
      }
    }

    // Format [NomorUrut]/[Jenis]/[Tahun] (contoh: 062/SK/2026 atau 062/SM/2026)
    const firstPart = parts[0].trim();
    if (/^\d{1,4}$/.test(firstPart)) {
      const num = parseInt(firstPart, 10);
      if (!isNaN(num) && num > 0 && num < 1900) {
        return num;
      }
    }
  }

  // 2. Cari seluruh angka berurutan yang bukan tahun (1900..2099)
  const tokens = trimmed.match(/\b\d{1,4}\b/g);
  if (tokens && tokens.length > 0) {
    for (const token of tokens) {
      const num = parseInt(token, 10);
      if (!isNaN(num) && num > 0 && num < 1900) {
        // Lewati prefix kode klasifikasi jika ada segmen nomor setelahnya
        if (parts.length > 1 && parts[0].trim() === token && /^\d{1,4}$/.test(parts[1]?.trim() || '')) {
          continue;
        }
        return num;
      }
    }
  }

  return null;
}

/**
 * Mencari nomor urut terbesar dari kumpulan daftar surat (surat pembuat, surat keluar, surat tugas, agenda)
 */
export function getHighestNomorUrutFromLists(
  ...sources: Array<Array<string | { noSurat?: string; noAgenda?: string; noSuratTugas?: string; [key: string]: any }> | undefined>
): number {
  let highest = 0;

  for (const list of sources) {
    if (!list || !Array.isArray(list)) continue;
    for (const item of list) {
      let candidateNumber: string | undefined;
      if (typeof item === 'string') {
        candidateNumber = item;
      } else if (item && typeof item === 'object') {
        candidateNumber = item.noSurat || item.noSuratTugas || item.noAgenda;
      }

      if (candidateNumber) {
        const extracted = extractNomorUrutFromNoSurat(candidateNumber);
        if (extracted !== null && extracted > highest) {
          highest = extracted;
        }
      }
    }
  }

  return highest;
}

/**
 * Generator nomor surat dinas otomatis yang rapi, standar, dan selalu menyesuaikan nomor terakhir
 * Contoh output: 400.3.5.3/063/SMPN-02/PRL/2026
 */
export function generateAutoNomorSurat(
  kodeKlasifikasi: string,
  indexUrut: number,
  tanggal: string = new Date().toISOString().split('T')[0]
): string {
  const dateObj = new Date(tanggal || Date.now());
  const year = dateObj.getFullYear();
  const padIndex = String(indexUrut).padStart(3, '0');

  return `${kodeKlasifikasi}/${padIndex}/SMPN-02/PRL/${year}`;
}

/**
 * Render Header Kop Surat Kedinasan SMPN 2 Puriala
 * Format 100% Simetris & Baku sesuai Naskah Dinas Resmi Master Drive
 */
export function renderHeaderKopHTML(sekolah: IdentitasSekolah): string {
  const namaSekolah = sekolah?.namaSekolah || 'SMP NEGERI 2 PURIALA';
  const akreditasi = sekolah?.akreditasi || 'B (Baik)';
  const alamat = sekolah?.alamat || 'Jl. Poros Lambuya – Motaha Km.23 Kec. Puriala';
  const kodePos = sekolah?.kodePos || '93462';
  const npsn = sekolah?.npsn || '40402805';
  const email = sekolah?.email || 'smpnpuriala523@gmail.com';

  return `
    <div style="width: 100%; margin-bottom: 16px; font-family: 'Times New Roman', Times, serif; color: #000000;">
      <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
        <tr>
          <!-- LOGO KIRI: Lambang Daerah Pemkab Konawe -->
          <td style="width: 90px; min-width: 90px; max-width: 90px; vertical-align: middle; text-align: center; padding: 0;">
            <img 
              src="${LOGO_KABUPATEN_KONAWE_BASE64}" 
              alt="Logo Pemkab Konawe" 
              style="width: 76px; max-width: 80px; height: auto; display: block; margin: 0 auto; object-fit: contain;" 
            />
          </td>

          <!-- TEKS KOP TENGAH: Presisi & Terpusat Simetris -->
          <td style="vertical-align: middle; text-align: center; padding: 0 10px;">
            <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.2;">
              PEMERINTAH KABUPATEN KONAWE
            </div>
            <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0; line-height: 1.2;">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </div>
            <div style="font-size: 16pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0 3px 0; line-height: 1.2;">
              ${namaSekolah}
            </div>
            <div style="font-size: 9.5pt; font-weight: bold; margin: 1px 0; line-height: 1.2;">
              Terakreditasi "${akreditasi}"
            </div>
            <div style="font-size: 9pt; font-style: normal; margin: 1px 0; line-height: 1.25;">
              Alamat: ${alamat}, Kode Pos: ${kodePos}
            </div>
            <div style="font-size: 8.5pt; font-style: normal; margin: 0; line-height: 1.25;">
              NPSN: ${npsn} | Email: ${email}
            </div>
          </td>

          <!-- LOGO KANAN: Lambang Tut Wuri Handayani / Kemendikbud -->
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
  `;
}

/**
 * Render Blok Tanda Tangan Resmi
 */
export function renderTandaTanganHTML(surat: PembuatSuratRecord, sekolah: IdentitasSekolah): string {
  const tglIndo = formatTanggalIndonesia(surat.tanggalSurat || new Date().toISOString().split('T')[0]);
  const tempat = surat.tempatTerbit || 'Unggulino';
  const p = surat.penandatangan;

  let jabatanText = 'Kepala Sekolah,';
  if (p.tipe === 'an_kepala_sekolah_tu') {
    jabatanText = 'a.n. Kepala Sekolah<br>Kepala Sub Bagian Tata Usaha,';
  } else if (p.tipe === 'plt_kepala_sekolah') {
    jabatanText = 'Plt. Kepala Sekolah,';
  } else if (p.tipe === 'an_wakasek') {
    jabatanText = 'a.n. Kepala Sekolah<br>Wakil Kepala Sekolah,';
  }

  const namaPejabat = p.nama || sekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si';
  const nipPejabat = p.nip || sekolah.nipKepalaSekolah || '19710110 199412 1 0012';
  const pangkatPejabat = p.pangkatGol || sekolah.pangkatKepsek || 'Pembina Tk. I, IV/b';

  return `
    <div style="margin-top: 35px; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000000;">
      <table style="width: 100%; border-collapse: collapse; border: none;">
        <tr>
          <td style="width: 50%; vertical-align: top; text-align: left; padding: 0;">
            <!-- Kolom Kiri Kosong atau Catatan/Tembusan jika ada -->
            <div style="font-size: 10pt; font-style: italic; color: #333333; margin-top: 80px;">
              ${surat.status === 'Draft' ? '<span style="border: 1px dashed #ef4444; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-style: normal; font-weight: bold;">[ DRAFT DOKUMEN BELUM DITERBITKAN ]</span>' : ''}
            </div>
          </td>
          <td style="width: 50%; vertical-align: top; text-align: left; padding-left: 20px;">
            <div>${tempat}, ${tglIndo}</div>
            <div style="margin-top: 4px; line-height: 1.2;">${jabatanText}</div>
            
            <div style="height: 75px; position: relative;">
              <!-- Ruang Tanda Tangan & Stempel Basah -->
            </div>
            
            <div style="font-weight: bold; text-decoration: underline; font-size: 12pt; text-transform: uppercase;">
              ${namaPejabat}
            </div>
            <div style="font-size: 11pt; margin-top: 2px;">
              ${pangkatPejabat ? pangkatPejabat : ''}
            </div>
            <div style="font-size: 11pt; margin-top: 1px;">
              NIP. ${nipPejabat}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Render Spesifik Isi Dokumen berdasarkan Kategori & Jenis Surat
 */
export function renderIsiSuratHTML(surat: PembuatSuratRecord, sekolah: IdentitasSekolah): string {
  const sub = surat.subjekData;
  const det = surat.detailSurat;
  const tglLahirIndo = sub.tanggalLahir ? formatTanggalIndonesia(sub.tanggalLahir) : '';
  const ttl = (sub.tempatLahir && tglLahirIndo) ? `${sub.tempatLahir}, ${tglLahirIndo}` : (sub.tempatLahir || tglLahirIndo || '-');

  // 1. SURAT UNTUK SISWA
  if (surat.targetSubjek === 'siswa') {
    let specificContent = '';

    if (surat.jenisSuratId === 'izin_kegiatan_siswa') {
      const tglMulaiKeg = det.tglMulaiKegiatan ? formatTanggalIndonesia(det.tglMulaiKegiatan) : 'Sesuai Jadwal';
      const tglSelesaiKeg = det.tglSelesaiKegiatan ? formatTanggalIndonesia(det.tglSelesaiKegiatan) : 'Selesai';
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Dengan ini Kepala ${sekolah.namaSekolah} memberikan <strong>IZIN DAN DISPENSASI BELAJAR</strong> kepada peserta didik tersebut di atas untuk mengikuti kegiatan:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
          <tr>
            <td style="width: 28%; padding: 3px 0; vertical-align: top;">Nama Kegiatan</td>
            <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
            <td style="width: 69%; padding: 3px 0; font-weight: bold;">${det.namaKegiatan || det.keperluan || 'Kegiatan Kesiswaan / Perlombaan / Latihan'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Penyelenggara</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.penyelenggaraKegiatan || 'Kwartir Cabang Gerakan Pramuka / Dinas Dikbud / Panitia Pelaksana'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Waktu Pelaksanaan</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0; font-weight: 500;">${tglMulaiKeg === tglSelesaiKeg ? tglMulaiKeg : `${tglMulaiKeg} s.d. ${tglSelesaiKeg}`}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Tempat / Lokasi</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.tempatKegiatan || 'Lokasi Kegiatan Terkait'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Dispensasi PBM</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0; font-style: italic;">${det.dispensasiBelajar || 'Diberikan dispensasi tidak mengikuti Proses Belajar Mengajar (PBM) di kelas selama kegiatan berlangsung'}</td>
          </tr>
        </table>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Peserta didik yang bersangkutan berkewajiban menjaga nama baik sekolah selama kegiatan serta berkoordinasi dengan guru mata pelajaran untuk menyelesaikan tugas-tugas pelajaran yang tertinggal setelah kegiatan selesai.
        </p>
      `;
    } else if (surat.jenisSuratId === 'siap_menerima_siswa_pindahan') {
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Berdasarkan Surat Permohonan Mutasi Masuk dari Orang Tua / Wali Siswa dan hasil verifikasi ketersediaan daya tampung rombongan belajar, dengan ini Kepala ${sekolah.namaSekolah} menerangkan bahwa satuan pendidikan kami <strong>MENYATAKAN SIAP DAN BERSEDIA MENERIMA</strong> kepindahan peserta didik tersebut di atas sebagai siswa pindahan pada:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
          <tr>
            <td style="width: 28%; padding: 3px 0; vertical-align: top;">Sekolah Asal</td>
            <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
            <td style="width: 69%; padding: 3px 0; font-weight: bold;">${det.sekolahAsal || 'Sekolah Asal Siswa'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Diterima di Kelas</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0; font-weight: bold;">${det.kelasDiterima || (sub.kelas ? `Kelas ${sub.kelas}` : 'Kelas VIII (Delapan)')}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Tahun Pelajaran / Semester</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.tahunPelajaranDiterima || sekolah.tahunPelajaranAktif || '2026/2027'} (Semester ${sekolah.semesterAktif || 'Ganjil'})</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Alasan Penerimaan</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.alasanDiterima || det.keperluan || 'Daya tampung rombongan belajar masih tersedia dan telah memenuhi syarat administrasi mutasi'}</td>
          </tr>
        </table>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Surat keterangan kesiapan ini berlaku sebagai dasar penerbitan Surat Keterangan Pindah Sekolah (Mutasi Keluar) dan proses mutasi data pada Aplikasi Dapodik dari sekolah asal.
        </p>
      `;
    } else if (surat.jenisSuratId === 'pemberitahuan_pelanggaran_siswa') {
      specificContent = `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 10px 14px; margin: 10px 0; border-radius: 4px;">
          <div style="font-weight: bold; color: #991b1b; font-size: 11pt; margin-bottom: 4px;">PEMBERITAHUAN PELANGGARAN TATA TERTIB SEKOLAH:</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11pt; color: #1e293b;">
            <tr>
              <td style="width: 25%; padding: 2px 0; vertical-align: top;">Bentuk Pelanggaran</td>
              <td style="width: 3%; padding: 2px 0; vertical-align: top;">:</td>
              <td style="width: 72%; padding: 2px 0; font-weight: bold; color: #b91c1c;">${det.bentukPelanggaran || det.keperluan || 'Pelanggaran tata tertib dan disiplin sekolah'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; vertical-align: top;">Akumulasi Poin Sanksi</td>
              <td style="padding: 2px 0; vertical-align: top;">:</td>
              <td style="padding: 2px 0; font-weight: bold;">${det.poinPelanggaran || 'Tercatat dalam Buku Pembinaan BK'}</td>
            </tr>
          </table>
        </div>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Sehubungan dengan pelanggaran tersebut dan dalam rangka penegakan kedisiplinan serta pembinaan terpadu demi masa depan pendidikan ananda, kami <strong>MENGHARAP KEHADIRAN</strong> Bapak/Ibu Orang Tua / Wali Peserta Didik pada:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
          <tr>
            <td style="width: 28%; padding: 3px 0; vertical-align: top;">Hari / Tanggal</td>
            <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
            <td style="width: 69%; padding: 3px 0; font-weight: bold;">${det.hariTanggalMenghadap || 'Menyesuaikan Jadwal Kerja'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Waktu / Jam</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.waktuMenghadap || '08.30 WITA s.d. Selesai'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Tempat</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.tempatMenghadap || `Ruang Bimbingan Konseling (BK) / Ruang Kepala Sekolah ${sekolah.namaSekolah}`}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Menghadap Kepada</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0; font-weight: bold;">${det.menghadapKepada || 'Guru BK, Wali Kelas, dan Kepala Sekolah'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Keperluan</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.keperluan || 'Koordinasi pembinaan kedisiplinan dan penandatanganan surat pernyataan pembinaan'}</td>
          </tr>
        </table>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Mengingat pentingnya koordinasi ini, kami sangat mengharapkan kehadiran Bapak/Ibu tepat waktu tanpa diwakilkan.
        </p>
      `;
    } else if (surat.jenisSuratId === 'pemberitahuan_skorsing_siswa') {
      const tglMulaiSkors = det.tglMulaiSkorsing ? formatTanggalIndonesia(det.tglMulaiSkorsing) : 'Tanggal Terbit Surat';
      const tglSelesaiSkors = det.tglSelesaiSkorsing ? formatTanggalIndonesia(det.tglSelesaiSkorsing) : 'Selesai Masa Sanksi';
      const tglKembali = det.tglKembaliSekolah ? formatTanggalIndonesia(det.tglKembaliSekolah) : 'Hari Kerja Berikutnya';
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Menindaklanjuti hasil rapat dewan guru, catatan pelanggaran tata tertib, serta rekomendasi Tim Ketertiban dan Guru Bimbingan Konseling (BK) ${sekolah.namaSekolah}, dengan ini Kepala Sekolah menyampaikan <strong>KEPUTUSAN SANKSI SKORSING (PEMBELAJARAN MANDIRI DI RUMAH)</strong> kepada peserta didik tersebut di atas dengan ketentuan sebagai berikut:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
          <tr>
            <td style="width: 28%; padding: 3px 0; vertical-align: top;">Alasan Sanksi</td>
            <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
            <td style="width: 69%; padding: 3px 0; font-weight: bold; color: #b91c1c;">${det.alasanSkorsing || det.bentukPelanggaran || det.keperluan || 'Melakukan pelanggaran tata tertib kategori berat setelah tahapan teguran'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Lama Masa Skorsing</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0; font-weight: bold;">${det.lamaSkorsing || '3 (Tiga) Hari Efektif Belajar'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Terhitung Mulai</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${tglMulaiSkors} s.d. ${tglSelesaiSkors}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Kembali Masuk Sekolah</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0; font-weight: bold; color: #0369a1;">${tglKembali} (Wajib Didampingi Orang Tua / Wali)</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border-left: 4px solid #e11d48; padding: 10px 12px; margin: 10px 0;">
          <div style="font-weight: bold; margin-bottom: 4px; font-size: 11pt;">Kewajiban Peserta Didik Selama Masa Skorsing:</div>
          <ol style="margin: 0; padding-left: 20px; font-size: 11pt; line-height: 1.4;">
            <li>Tidak diperkenankan berada di lingkungan sekolah selama jam pembelajaran tanpa izin tertulis dari Pimpinan Sekolah.</li>
            <li>Wajib belajar mandiri di rumah di bawah bimbingan dan pengawasan penuh Orang Tua / Wali.</li>
            <li>Wajib menyelesaikan tugas akademik: <strong>${det.tugasSelamaSkorsing || 'Menyelesaikan seluruh tugas mandiri mata pelajaran dan membuat surat pernyataan pembinaan bermaterai'}</strong>.</li>
            <li>Saat kembali masuk sekolah pada tanggal yang telah ditentukan, peserta didik <strong>WAJIB</strong> hadir bersama Orang Tua/Wali menghadap Guru BK dan Kepala Sekolah.</li>
          </ol>
        </div>
      `;
    } else if (surat.jenisSuratId === 'mutasi_keluar_siswa') {
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Berdasarkan Surat Permohonan Pindah Sekolah dari Orang Tua / Wali Peserta Didik bersangkutan, dengan ini Kepala ${sekolah.namaSekolah} menerangkan bahwa peserta didik tersebut di atas telah <strong>DISETUJUI PINDAH / MUTASI</strong> ke:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
          <tr>
            <td style="width: 25%; padding: 3px 0; vertical-align: top;">Sekolah Tujuan</td>
            <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
            <td style="width: 72%; padding: 3px 0; font-weight: bold;">${det.sekolahTujuan || 'Sekolah yang Dituju'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Alasan Pindah</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.alasanPindah || det.keperluan || 'Mengikuti Domisili Tempat Tinggal Orang Tua'}</td>
          </tr>
        </table>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Bersama surat ini dilampirkan Buku Laporan Pendidikan (Rapor) Asli dan berkas kelengkapan administrasi siswa. Sejak surat ini diterbitkan, yang bersangkutan tidak lagi tercatat sebagai siswa ${sekolah.namaSekolah}.
        </p>
      `;
    } else if (surat.jenisSuratId === 'kelakuan_baik_siswa') {
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Menerangkan bahwa peserta didik tersebut di atas selama mengikuti proses pembelajaran di ${sekolah.namaSekolah} menunjukkan <strong>BERKELAKUAN BAIK</strong>, taat terhadap tata tertib sekolah, rajin beribadah, serta tidak pernah terlibat tindakan kriminalitas, narkoba, perkelahian, maupun pelanggaran hukum lainnya.
        </p>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Surat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: <strong>${det.keperluan || surat.perihal || 'Persyaratan Masuk Jenjang Pendidikan Lanjutan'}</strong>.
        </p>
      `;
    } else if (surat.jenisSuratId === 'kehilangan_dokumen_siswa') {
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Menerangkan bahwa berdasarkan data arsip buku induk dan laporan kehilangan, yang bersangkutan benar telah dinyatakan lulus / pernah terdaftar pada ${sekolah.namaSekolah} dengan rincian dokumen yang hilang/rusak:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
          <tr>
            <td style="width: 25%; padding: 3px 0; vertical-align: top;">Nama Dokumen</td>
            <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
            <td style="width: 72%; padding: 3px 0; font-weight: bold;">${det.namaDokumenHilang || 'Ijazah / Surat Keterangan Lulus (SKL)'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Nomor Seri/Register</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.nomorDokumenAsli || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; vertical-align: top;">Keterangan</td>
            <td style="padding: 3px 0; vertical-align: top;">:</td>
            <td style="padding: 3px 0;">${det.keperluan || 'Surat ini sebagai dokumen keterangan pengganti yang sah sesuai ketentuan yang berlaku'}</td>
          </tr>
        </table>
      `;
    } else if (surat.jenisSuratId === 'rekomendasi_beasiswa_siswa') {
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Menerangkan bahwa peserta didik tersebut di atas adalah benar-benar siswa aktif ${sekolah.namaSekolah} Tahun Pelajaran ${sekolah.tahunPelajaranAktif || '2026/2027'} dan dengan ini Kepala Sekolah memberikan <strong>REKOMENDASI</strong> untuk diusulkan sebagai penerima:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; margin: 10px 0; font-weight: bold; text-align: center; font-size: 12pt;">
          ${det.programStudiKegiatan || det.keperluan || 'BANTUAN BEASISWA PROGRAM INDONESIA PINTAR (PIP) / PRESTASI BELAJAR'}
        </div>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Rekomendasi ini diberikan dengan pertimbangan prestasi belajar, keaktifan di sekolah, serta kondisi sosial ekonomi keluarga bersangkutan.
        </p>
      `;
    } else {
      // Default: Surat Keterangan Siswa Aktif
      specificContent = `
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Adalah benar-benar peserta didik yang saat ini <strong>AKTIF</strong> terdaftar dan mengikuti kegiatan proses belajar mengajar pada ${sekolah.namaSekolah} pada Semester ${sekolah.semesterAktif || 'Ganjil'} Tahun Pelajaran ${sekolah.tahunPelajaranAktif || '2026/2027'}.
        </p>
        <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
          Surat keterangan ini dibuat dan diberikan kepada yang bersangkutan untuk dipergunakan sebagai: <strong>${det.keperluan || 'Kelengkapan Berkas Administrasi'}</strong>.
        </p>
      `;
    }

    return `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.5px;">
          ${surat.jenisSuratNama || 'SURAT KETERANGAN'}
        </div>
        <div style="font-size: 11pt; margin-top: 4px;">
          Nomor: ${surat.noSurat}
        </div>
      </div>

      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Yang bertanda tangan di bawah ini Kepala ${sekolah.namaSekolah}, Kecamatan Puriala, Kabupaten Konawe, menerangkan dengan sesungguhnya bahwa:
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 10px 0 14px 15px; font-size: 12pt;">
        <tr>
          <td style="width: 28%; padding: 3px 0; vertical-align: top;">Nama Peserta Didik</td>
          <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
          <td style="width: 69%; padding: 3px 0; font-weight: bold; text-transform: uppercase;">${sub.nama || '-'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">NISN / NIS</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${sub.nisn ? `${sub.nisn} / ${sub.nis || '-'}` : (sub.nis || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Tempat, Tanggal Lahir</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${ttl}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Jenis Kelamin</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${sub.jenisKelamin === 'L' ? 'Laki-laki' : (sub.jenisKelamin === 'P' ? 'Perempuan' : (sub.jenisKelamin || '-'))}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Tingkat / Kelas</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0; font-weight: bold;">${sub.kelas ? `Kelas ${sub.kelas}` : '-'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Nama Orang Tua / Wali</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${sub.namaOrtu || '-'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Pekerjaan Orang Tua</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${sub.pekerjaanOrtu || 'Petani / Wiraswasta'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Alamat Tempat Tinggal</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${sub.alamat || 'Kecamatan Puriala, Kab. Konawe'}</td>
        </tr>
      </table>

      ${specificContent}

      ${det.catatanKhusus ? `<p style="margin: 10px 0; font-style: italic; background-color: #f1f5f9; padding: 6px 10px; border-left: 3px solid #0284c7;">Catatan: ${det.catatanKhusus}</p>` : ''}

      <p style="text-align: justify; line-height: 1.5; margin: 14px 0 0 0;">
        Demikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
      </p>
    `;
  }

  // 2. SURAT UNTUK GURU / PTK
  let specificPTKContent = '';

  if (surat.jenisSuratId === 'rekomendasi_ppg_guru') {
    specificPTKContent = `
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Dengan ini Kepala ${sekolah.namaSekolah} memberikan <strong>REKOMENDASI DAN IZIN RESMI</strong> kepada Pendidik bersangkutan untuk mengikuti Program:
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; margin: 10px 0; font-weight: bold; text-align: center; font-size: 12pt;">
        ${det.programStudiKegiatan || 'PENDIDIKAN PROFESI GURU (PPG) DALAM JABATAN'}
      </div>
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Instansi / LPTK Penyelenggara: <strong>${det.instansiTujuan || 'Lembaga Pendidikan Tenaga Kependidikan (LPTK) Mitra'}</strong>.
      </p>
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Pihak sekolah sepenuhnya mendukung keikutsertaan yang bersangkutan demi peningkatan kompetensi profesional pendidik dan mutu pendidikan di satuan pendidikan.
      </p>
    `;
  } else if (surat.jenisSuratId === 'izin_cuti_ptk') {
    const tglMulai = det.tglMulaiCuti ? formatTanggalIndonesia(det.tglMulaiCuti) : 'Sesuai Jadwal';
    const tglSelesai = det.tglSelesaiCuti ? formatTanggalIndonesia(det.tglSelesaiCuti) : 'Selesai';
    specificPTKContent = `
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Berdasarkan permohonan yang diajukan, dengan ini Kepala Sekolah memberikan <strong>IZIN CUTI / TIDAK MASUK DINAS</strong> terhitung mulai tanggal <strong>${tglMulai}</strong> sampai dengan <strong>${tglSelesai}</strong> dengan alasan: <em>${det.alasanCuti || det.keperluan || 'Keperluan Keluarga / Pemulihan Kesehatan'}</em>.
      </p>
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Selama masa cuti tersebut, tugas mengajar dan pelayanan administrasi telah dikoordinasikan dan dilimpahkan kepada guru piket / rekan sejawat di ${sekolah.namaSekolah}.
      </p>
    `;
  } else if (surat.jenisSuratId === 'keterangan_penghasilan_ptk') {
    specificPTKContent = `
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Menerangkan bahwa nama tersebut di atas benar menerima rincian penghasilan dinas per bulan dengan estimasi total:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 12pt;">
        <tr>
          <td style="width: 30%; padding: 3px 0; vertical-align: top;">Gaji Pokok</td>
          <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
          <td style="width: 67%; padding: 3px 0; font-weight: bold;">Rp ${det.gajiPokok || '3.500.000,-'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Total Penghasilan Bersih</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0; font-weight: bold; color: #0f766e;">Rp ${det.penghasilanTotal || '4.850.000,-'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; vertical-align: top;">Keperluan Surat</td>
          <td style="padding: 3px 0; vertical-align: top;">:</td>
          <td style="padding: 3px 0;">${det.keperluan || 'Persyaratan Administrasi Perbankan / Beasiswa'}</td>
        </tr>
      </table>
    `;
  } else if (surat.jenisSuratId === 'rekomendasi_mutasi_ptk') {
    specificPTKContent = `
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Berdasarkan permohonan mutasi pegawai, Kepala Sekolah pada prinsipnya <strong>MENYETUJUI / MEREKOMENDASIKAN</strong> permohonan pindah tugas pendidik bersangkutan ke: <strong>${det.instansiTujuan || det.sekolahTujuan || 'Instansi / Satuan Pendidikan Tujuan'}</strong> atas pertimbangan <em>${det.alasanPindah || det.keperluan || 'Pemerataan Tenaga Pendidik / Pendekatan Domisili Keluarga'}</em>.
      </p>
    `;
  } else {
    // Default: Surat Keterangan Melaksanakan Tugas (SKMT) / Aktif Mengajar
    specificPTKContent = `
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Adalah benar Tenaga Pendidik / Tenaga Kependidikan yang <strong>AKTIF MELAKSANAKAN TUGAS</strong> pada ${sekolah.namaSekolah} pada Semester ${sekolah.semesterAktif || 'Ganjil'} Tahun Pelajaran ${sekolah.tahunPelajaranAktif || '2026/2027'} dengan beban kerja dan dedikasi sesuai ketentuan peraturan perundang-undangan yang berlaku.
      </p>
      <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
        Surat keterangan ini diterbitkan kepada yang bersangkutan untuk dipergunakan sebagai: <strong>${det.keperluan || 'Kelengkapan Berkas Administrasi Kepegawaian / Tunjangan Profesi'}</strong>.
      </p>
    `;
  }

  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.5px;">
        ${surat.jenisSuratNama || 'SURAT KETERANGAN DINAS'}
      </div>
      <div style="font-size: 11pt; margin-top: 4px;">
        Nomor: ${surat.noSurat}
      </div>
    </div>

    <p style="text-align: justify; line-height: 1.5; margin: 12px 0;">
      Yang bertanda tangan di bawah ini Kepala ${sekolah.namaSekolah}, Kecamatan Puriala, Kabupaten Konawe, menerangkan dengan sebenarnya bahwa:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 10px 0 14px 15px; font-size: 12pt;">
      <tr>
        <td style="width: 28%; padding: 3px 0; vertical-align: top;">Nama Lengkap & Gelar</td>
        <td style="width: 3%; padding: 3px 0; vertical-align: top;">:</td>
        <td style="width: 69%; padding: 3px 0; font-weight: bold;">${sub.nama || '-'}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; vertical-align: top;">NIP / NUPTK</td>
        <td style="padding: 3px 0; vertical-align: top;">:</td>
        <td style="padding: 3px 0;">${sub.nip ? `${sub.nip}` : (sub.nuptk || '-')}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; vertical-align: top;">Pangkat / Golongan Ruang</td>
        <td style="padding: 3px 0; vertical-align: top;">:</td>
        <td style="padding: 3px 0;">${sub.pangkatGol || 'Penata Muda, III/a'}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; vertical-align: top;">Jabatan / Tugas Mengajar</td>
        <td style="padding: 3px 0; vertical-align: top;">:</td>
        <td style="padding: 3px 0; font-weight: bold;">${sub.jabatan || 'Guru Mata Pelajaran'}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; vertical-align: top;">Unit Kerja</td>
        <td style="padding: 3px 0; vertical-align: top;">:</td>
        <td style="padding: 3px 0;">${sub.unitKerja || sekolah.namaSekolah || 'SMP Negeri 2 Puriala'}</td>
      </tr>
    </table>

    ${specificPTKContent}

    ${det.catatanKhusus ? `<p style="margin: 10px 0; font-style: italic; background-color: #f1f5f9; padding: 6px 10px; border-left: 3px solid #0284c7;">Catatan: ${det.catatanKhusus}</p>` : ''}

    <p style="text-align: justify; line-height: 1.5; margin: 14px 0 0 0;">
      Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
    </p>
  `;
}

/**
 * Render Complete Standalone HTML Document for Print / Export
 */
export function renderSuratDocumentHTML(surat: PembuatSuratRecord, sekolah: IdentitasSekolah): string {
  const kop = renderHeaderKopHTML(sekolah);
  const isi = renderIsiSuratHTML(surat, sekolah);
  const ttd = renderTandaTanganHTML(surat, sekolah);

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${surat.jenisSuratNama} - ${surat.subjekData.nama}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm 15mm 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      box-sizing: border-box;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .page-container {
        width: 100%;
        max-width: none;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${kop}
    ${isi}
    ${ttd}
  </div>
</body>
</html>
  `;
}

/**
 * Download as MS Word .doc compatible file
 */
export function downloadSuratAsWordDoc(surat: PembuatSuratRecord, sekolah: IdentitasSekolah): void {
  const fullHtml = renderSuratDocumentHTML(surat, sekolah);
  const wordHeader = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${surat.jenisSuratNama}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4 */
          margin: 42.5pt 56.7pt 42.5pt 56.7pt;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
  `;
  const wordFooter = `
      </div>
    </body>
    </html>
  `;

  const completeWordContent = wordHeader + renderHeaderKopHTML(sekolah) + renderIsiSuratHTML(surat, sekolah) + renderTandaTanganHTML(surat, sekolah) + wordFooter;
  const blob = new Blob(['\ufeff', completeWordContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const cleanName = (surat.subjekData.nama || 'Subjek').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanJenis = (surat.jenisSuratNama || 'Surat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanJenis}_${cleanName}_SMPN2_PURIALA.doc`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download as Standalone HTML file
 */
export function downloadSuratAsHTML(surat: PembuatSuratRecord, sekolah: IdentitasSekolah): void {
  const fullHtml = renderSuratDocumentHTML(surat, sekolah);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const cleanName = (surat.subjekData.nama || 'Subjek').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanJenis = (surat.jenisSuratNama || 'Surat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanJenis}_${cleanName}_SMPN2_PURIALA.html`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print Surat Document using browser print dialog
 */
export function printSuratDocument(surat: PembuatSuratRecord, sekolah: IdentitasSekolah): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Jendela popup diblokir oleh peramban. Izinkan popup untuk mencetak dokumen.');
    return;
  }

  const html = renderSuratDocumentHTML(surat, sekolah);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}
