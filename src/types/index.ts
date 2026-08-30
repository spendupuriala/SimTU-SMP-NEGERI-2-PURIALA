export type SifatSurat = 'Biasa' | 'Penting' | 'Rahasia' | 'Segera' | 'Sangat Segera';

export interface SuratMasuk {
  id: string;
  noAgenda: string;
  noSurat: string;
  tanggalSurat: string;
  tanggalTerima: string;
  asalSurat: string;
  perihal: string;
  sifat: SifatSurat;
  kategori: string;
  ringkasan: string;
  lampiranNama?: string;
  lampiranUkuran?: string;
  statusDisposisi: 'Belum Disposisi' | 'Sudah Disposisi' | 'Selesai / Tindak Lanjut';
  diteruskanKepada?: string[];
  instruksiDisposisi?: string;
  catatanKepsek?: string;
  tanggalDisposisi?: string;
  statusDrive: 'Tersimpan' | 'Menunggu Sync' | 'Lokal Saja';
  drivePath?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  fileUrl?: string;
  fileMimeType?: string;
}

export interface SuratKeluar {
  id: string;
  noAgenda: string;
  noSurat: string;
  kodeKlasifikasi: string; // misal: 400.3.5.1, 400.3.10.1, 090, 800, etc.
  tanggalSurat: string;
  tujuanSurat: string;
  perihal: string;
  sifat: SifatSurat;
  lampiran: string;
  pengonsep: string;
  penandatangan: string;
  nipPenandatangan: string;
  isiSuratRingkas?: string;
  statusVerifikasi: 'Draf' | 'Disetujui Kepala Sekolah' | 'Sudah Dikirim' | 'Arsip';
  statusDrive: 'Tersimpan' | 'Menunggu Sync' | 'Lokal Saja';
  lampiranNama?: string;
  sumberModul?: 'surat-keluar' | 'surat-tugas' | 'pembuat-surat';
  referensiId?: string;
}

export interface KodeKlasifikasiSurat {
  kode: string;
  nama: string;
  kategori?: string;
  keterangan?: string;
}

export interface JpKelasAllocation {
  viiA?: number;
  viiB?: number;
  viii?: number;
  ix?: number;
  [key: string]: number | undefined;
}

export interface SKKBMItem {
  id: string;
  namaGuru: string;
  nip: string;
  nuptk?: string;
  golongan: string;
  mataPelajaran: string;
  jpKelas?: JpKelasAllocation;
  kelasDiampu: string[]; // ['VII.A', 'VII.B', 'VIII', 'IX']
  jumlahJp: number; // Subtotal JP Mengajar (VII.A + VII.B + VIII + IX)
  jumlahJpTugasTambahan?: number; // JP Tugas Tambahan (e.g. 24, 12, 4, 2)
  tugasTambahan?: string; // Deskripsi tugas tambahan (e.g. Kepala Sekolah, Wakasek Kurikulum)
  totalJp: number; // JUMLAH BEBAN KERJA = jumlahJp + (jumlahJpTugasTambahan || 0)
}

export interface SKKBM {
  id: string;
  noSK: string;
  tahunAjaran: string; // misal: 2025/2026
  semester: 'Ganjil' | 'Genap';
  tentang: string;
  tanggalSK: string;
  tempatPenetapan?: string;
  menimbang: string[];
  mengingat: string[];
  memperhatikan?: string[];
  daftarGuru: SKKBMItem[];
  statusDrive: 'Tersimpan' | 'Menunggu Sync' | 'Lokal Saja';
  driveFileId?: string;
  driveWebViewLink?: string;
  templateNama?: string;
  templateDriveId?: string;
  drivePath?: string;
}

export interface SKTugasTambahan {
  id: string;
  noSK: string;
  tahunAjaran: string;
  semester?: 'Ganjil' | 'Genap';
  jenisTugas:
    | 'Wakil Kepala Sekolah'
    | 'Wali Kelas'
    | 'Pembina OSIS'
    | 'Kepala Perpustakaan'
    | 'Kepala Laboratorium IPA/Komputer'
    | 'Kepala Laboratorium Keagamaan'
    | 'Tim Pengembang Kurikulum'
    | 'Bendahara BOS'
    | 'Koordinator Adiwiyata'
    | 'Koordinator BK'
    | 'Guru Piket'
    | 'Pembina Pramuka'
    | 'Pembina PMR / UKS'
    | 'Pembina Seni'
    | 'Operator Dapodik / IT'
    | 'Lainnya'
    | string;
  namaPetugas: string;
  nip: string;
  nuptk?: string;
  pangkatGol?: string;
  jabatanDefinitif: string;
  jabatanPokok?: string;
  ekuivalensiJp?: number;
  sasaranTugas?: string;
  keterangan: string;
  tanggalSK: string;
  tempatPenetapan?: string;
  status: 'Aktif' | 'Selesai';
  // Dokumen Master SK & Integrasi Google Drive
  tentang?: string;
  menimbang?: string[];
  mengingat?: string[];
  memperhatikan?: string[];
  templateNama?: string; // 'SK Tugas Tertentu T.P 2026-2027'
  drivePath?: string; // 'TATA USAHA/SK'
  statusDrive?: 'Tersimpan' | 'Menunggu Sync' | 'Lokal Saja';
  driveFileId?: string;
  driveWebViewLink?: string;
}

export interface PersonilTugas {
  nama: string;
  nip: string;
  pangkatGol: string;
  jabatan: string;
}

export interface SuratTugasDinas {
  id: string;
  noSuratTugas: string;
  noSPPD?: string;
  kodeKlasifikasi?: string;
  dasarPenugasan: string;
  personil: PersonilTugas[];
  maksudTugas: string;
  tempatTujuan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  alatAngkut: 'Kendaraan Umum' | 'Kendaraan Dinas' | 'Sepeda Motor' | 'Pesawat Udara' | string;
  bebanAnggaran: 'Dana BOS SMPN 2 Puriala' | 'APBD Kab. Konawe' | 'Instansi Pengundang' | 'Swadaya Pribadi' | string;
  status: 'Direncanakan' | 'Terbit' | 'Selesai Dilaksanakan';
  laporanKegiatan?: string;
  tanggalSurat?: string;
  tempatPenetapan?: string;
  tembusan?: string[];
  statusDrive?: 'Tersimpan' | 'Menunggu Sync' | 'Lokal Saja';
  driveFileId?: string;
  driveWebViewLink?: string;
  drivePath?: string;
  templateNama?: string;
  suratKeluarId?: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nisn: string;
  namaLengkap: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  kelas: 'VII.A' | 'VII.B' | 'VIII' | 'IX' | string;
  agama: 'Islam' | 'Kristen Protestan' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
  namaAyah: string;
  pekerjaanAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  alamat: string;
  noTelpOrtu: string;
  statusSiswa: 'Aktif' | 'Mutasi Keluar' | 'Lulus' | 'Non-Aktif';
  tahunMasuk: string;
  fotoUrl?: string;
}

export interface PPDBPendaftar {
  id: string;
  noPendaftaran: string;
  nisn: string;
  namaCalon: string;
  asalSekolahSD: string;
  jalur: 'Zonasi' | 'Afirmasi' | 'Prestasi Akademik / Non-Akademik' | 'Perpindahan Tugas Orang Tua';
  nilaiRataRataSD: number;
  statusVerifikasi: 'Berkas Lengkap' | 'Menunggu Verifikasi' | 'Diterima' | 'Cadangan' | 'Ditolak';
  tanggalDaftar: string;
  noHp: string;
}

export interface Alumni {
  id: string;
  nisn: string;
  nis: string;
  namaLengkap: string;
  tahunLulus: string; // misal: 2024/2025
  noSeriIjazah?: string;
  nomorSeriIjazah?: string;
  noSKL?: string;
  nomorSKL?: string;
  statusIjazah: 'Sudah Diambil' | 'Masih di TU' | 'Legalisir' | string;
  tanggalPengambilan?: string;
  namaPenerima?: string;
  melanjutkanKe?: string;
  keterangan?: string;
}

export interface BerkasPTK {
  id: string;
  namaBerkas: string;
  kategori: string;
  tanggalUpload: string;
  ukuranFile: string;
  tipeFile: string;
  url?: string;
}

export interface PTK {
  id: string;
  nip: string;
  nuptk: string;
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  jenisKelamin?: 'Laki-laki' | 'Perempuan' | string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jabatan: string;
  jenisPTK?: string;
  statusKepegawaian: string;
  pangkatGolongan?: string;
  golongan?: string;
  mapelUtama?: string;
  tmtPengangkatan?: string;
  statusSertifikasi?: string;
  pendidikanTerakhir?: string;
  jurusan?: string;
  noHp?: string;
  email?: string;
  tmtKerja?: string;
  berkas?: BerkasPTK[];
  berkasDigital?: {
    id: string;
    namaFile: string;
    jenisBerkas: string;
    ukuran: string;
    tanggalUnggah?: string;
    url?: string;
    driveFileId?: string;
    driveWebViewLink?: string;
    folderId?: string;
    folderName?: string;
    mimeType?: string;
  }[];
}

export interface DriveFileItem {
  id: string;
  nama: string;
  folderId?: string;
  tipe: string;
  ukuran: string;
  tanggalModifikasi?: string;
  tanggalUnggah?: string;
  diuploadOleh?: string;
  pengunggah?: string;
  kategori: string;
  statusSync?: string;
  isStarred?: boolean;
}

export interface DriveFolderItem {
  id: string;
  nama: string;
  parentId?: string | null;
  deskripsi?: string;
  iconColor?: string;
  jumlahFile?: number;
  terakhirDiubah?: string;
  files?: DriveFileItem[];
}

export type DriveFolder = DriveFolderItem;
export type DriveFile = DriveFileItem;
export type AlumniIjazah = Alumni;
export type GuruPTK = PTK;

export type TargetSubjekSurat = 'siswa' | 'guru';

export type PenandatanganTipe =
  | 'kepala_sekolah'
  | 'an_kepala_sekolah_tu'
  | 'plt_kepala_sekolah'
  | 'an_wakasek';

export interface PembuatSuratSubjekData {
  idRef?: string;
  nama: string;
  nisn?: string;
  nis?: string;
  nip?: string;
  nuptk?: string;
  pangkatGol?: string;
  jabatan?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  kelas?: string;
  namaOrtu?: string;
  pekerjaanOrtu?: string;
  alamat?: string;
  unitKerja?: string;
}

export interface PembuatSuratDetail {
  keperluan?: string;
  sekolahTujuan?: string;
  alasanPindah?: string;
  nomorDokumenAsli?: string;
  namaDokumenHilang?: string;
  tglMulaiCuti?: string;
  tglSelesaiCuti?: string;
  alasanCuti?: string;
  instansiTujuan?: string;
  programStudiKegiatan?: string;
  gajiPokok?: string;
  penghasilanTotal?: string;
  catatanKhusus?: string;
  isiSuratTambahan?: string;
}

export interface PembuatSuratPenandatangan {
  tipe: PenandatanganTipe;
  labelJabatan: string;
  nama: string;
  nip: string;
  pangkatGol?: string;
}

export interface PembuatSuratRecord {
  id: string;
  noSurat: string;
  kodeKlasifikasi: string;
  targetSubjek: TargetSubjekSurat;
  jenisSuratId: string;
  jenisSuratNama: string;
  tanggalSurat: string;
  tempatTerbit: string;
  perihal: string;
  subjekData: PembuatSuratSubjekData;
  detailSurat: PembuatSuratDetail;
  penandatangan: PembuatSuratPenandatangan;
  status: 'Draft' | 'Terbit';
  statusDrive?: 'Tersimpan' | 'Menunggu Sync' | 'Lokal Saja';
  driveFileId?: string;
  driveWebViewLink?: string;
  suratKeluarId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseState {
  identitasSekolah: IdentitasSekolah;
  suratMasuk: SuratMasuk[];
  suratKeluar: SuratKeluar[];
  skKBM: SKKBM[];
  skTugasTambahan: SKTugasTambahan[];
  suratTugas: SuratTugasDinas[];
  pembuatSurat?: PembuatSuratRecord[];
  siswa: Siswa[];
  ppdb: PPDBPendaftar[];
  alumni: AlumniIjazah[];
  guruPTK: GuruPTK[];
  driveFolders: DriveFolder[];
}

export interface IdentitasSekolah {
  namaSekolah: string;
  npsn: string;
  nss: string;
  akreditasi: string;
  alamat: string;
  kelurahanDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  email: string;
  telepon: string;
  website: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  pangkatKepsek: string;
  namaKepalaTU: string;
  nipKepalaTU: string;
  formatNomorSuratKeluar: string;
  tahunPelajaranAktif: string;
  semesterAktif: 'Ganjil' | 'Genap';
  googleDriveFolderUrl: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'surat-masuk'
  | 'surat-keluar'
  | 'buku-agenda'
  | 'sk-kbm'
  | 'sk-tugas-tambahan'
  | 'surat-tugas'
  | 'surat-tugas-dinas'
  | 'pembuat-surat'
  | 'buku-induk'
  | 'ppdb-rapor'
  | 'alumni-ijazah'
  | 'guru-ptk'
  | 'data-guru'
  | 'folder-berkas-ptk'
  | 'drive-explorer'
  | 'tree-manager'
  | 'upload-massal'
  | 'pengaturan';
