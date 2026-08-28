import { SuratMasuk, SuratKeluar, SifatSurat, KodeKlasifikasiSurat } from '../types';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

export const DEFAULT_KODE_KLASIFIKASI: KodeKlasifikasiSurat[] = [
  // --- KELOMPOK 400: PENDIDIKAN & KEBUDAYAAN (PERMENDAGRI / PERMENDIKBUD) ---
  {
    kode: '400.3.5',
    nama: 'Pendidikan Dasar dan Menengah Pertama',
    kategori: 'Pendidikan Dasar',
    keterangan: 'Kebijakan umum, program, dan administrasi pendidikan dasar & SMP',
  },
  {
    kode: '400.3.5.1',
    nama: 'Kurikulum, bahan ajar, dan proses KBM',
    kategori: 'Kurikulum & Pembelajaran',
    keterangan: 'Perangkat ajar, modul ajar/silabus, KBM, buku teks pelajaran',
  },
  {
    kode: '400.3.5.2',
    nama: 'Block Grant',
    kategori: 'Bantuan & Hibah',
    keterangan: 'Bantuan dana hibah langsung pengembangan pendidikan dasar',
  },
  {
    kode: '400.3.5.3',
    nama: 'Pelatihan, Bimtek, sosialisasi, & Penugasan Dinas',
    kategori: 'Pelatihan & Sosialisasi',
    keterangan: 'Bimbingan teknis, workshop, diseminasi, penugasan dinas PTK',
  },
  {
    kode: '400.3.5.4',
    nama: 'Lomba, penghargaan, penganugerahan kesiswaan',
    kategori: 'Prestasi & Lomba',
    keterangan: 'OSN, FLS2N, O2SN, lomba kesiswaan, piagam penghargaan',
  },
  {
    kode: '400.3.5.5',
    nama: 'Bantuan Operasional Sekolah (BOS)',
    kategori: 'Keuangan & BOS',
    keterangan: 'Dana BOS reguler/kinerja, RKAS/RAPBS, LPJ operasional',
  },
  {
    kode: '400.3.5.6',
    nama: 'Bantuan Siswa Miskin / PIP Kemendikbudristek',
    kategori: 'Kesiswaan & Beasiswa',
    keterangan: 'Program Indonesia Pintar (PIP), beasiswa miskin/afirmasi',
  },
  {
    kode: '400.3.10',
    nama: 'Pendidik dan Tenaga Kependidikan (PTK)',
    kategori: 'PTK / Kepegawaian',
    keterangan: 'Administrasi umum guru, kepala sekolah, dan tenaga kependidikan',
  },
  {
    kode: '400.3.10.1',
    nama: 'Pendataan, Pemetaan & SKMT Aktif Mengajar PTK',
    kategori: 'PTK / Dapodik',
    keterangan: 'Pemetaan formasi, surat keterangan aktif mengajar, data pokok PTK',
  },
  {
    kode: '400.3.10.2',
    nama: 'Uji Kompetensi Guru',
    kategori: 'Uji Kompetensi',
    keterangan: 'Pelaksanaan UKG, uji kelayakan, pemetaan kompetensi pengajar',
  },
  {
    kode: '400.3.10.3',
    nama: 'Sertifikasi Guru & Rekomendasi PPG Daljab',
    kategori: 'Sertifikasi & PPG',
    keterangan: 'Program PPG, pemberkasan TPG/sertifikasi, tugas belajar PTK',
  },
  {
    kode: '400.3.10.4',
    nama: 'Penilaian Prestasi Kerja, PKG, SKP & Usul KGB / Pangkat',
    kategori: 'PKG / SKP / KGB',
    keterangan: 'Penilaian Kinerja Guru (PKG), SKP BKN, usulan KGB dan pangkat',
  },
  {
    kode: '400.3.10.5',
    nama: 'Penghargaan guru dan tenaga kependidikan',
    kategori: 'Penghargaan PTK',
    keterangan: 'Guru berprestasi/dedikatif, penganugerahan tanda kehormatan',
  },
  {
    kode: '400.3.10.6',
    nama: 'Peningkatan Kesejahteraan, Rincian Gaji & Izin Cuti PTK',
    kategori: 'Kesejahteraan PTK',
    keterangan: 'Keterangan penghasilan/gaji, tunjangan khusus, surat izin cuti kerja',
  },
  {
    kode: '400.3.10.7',
    nama: 'Block Grant PTK & MGMP',
    kategori: 'Bantuan PTK',
    keterangan: 'Bantuan hibah pengembangan MGMP/KKG, beasiswa studi lanjut',
  },
  {
    kode: '400.3.11',
    nama: 'Penilaian Pendidikan',
    kategori: 'Evaluasi & Asesmen',
    keterangan: 'Kebijakan dan sistem evaluasi capaian hasil belajar',
  },
  {
    kode: '400.3.11.1',
    nama: 'Penilaian Akademik (ANBK, ASTS, ASAS, Ujian Sekolah)',
    kategori: 'Asesmen Akademik',
    keterangan: 'Asesmen Nasional (ANBK), Asesmen Sumatif/ASTS/ASAS, Ujian Sekolah',
  },
  {
    kode: '400.3.11.2',
    nama: 'Penilaian Non Akademik & Surat Kelakuan Baik Siswa',
    kategori: 'Asesmen Karakter',
    keterangan: 'Surat keterangan kelakuan baik, survei karakter, asesmen bakat',
  },
  {
    kode: '400.3.11.3',
    nama: 'Analisis dan Sistem Informasi Penilaian',
    kategori: 'Sistem Nilai & Rapor',
    keterangan: 'Pengelolaan e-Rapor, bank soal, pengolahan statistik nilai',
  },
  {
    kode: '400.3.12',
    nama: 'Data dan Statistik Pendidikan',
    kategori: 'Data & Statistik',
    keterangan: 'Pengelolaan data induk dan statistik pendidikan sekolah',
  },
  {
    kode: '400.3.12.1',
    nama: 'Data Peserta Didik, Keterangan Aktif, & Mutasi Siswa',
    kategori: 'Data Siswa & Mutasi',
    keterangan: 'Surat keterangan siswa aktif, mutasi pindah sekolah, ijazah/SKL',
  },
  {
    kode: '400.3.12.2',
    nama: 'Data Satuan Pendidikan dan Profil Sekolah',
    kategori: 'Profil Sekolah & KBM',
    keterangan: 'NPSN, profil sekolah, izin operasional, kalender pendidikan',
  },
  {
    kode: '400.3.13',
    nama: 'Sarana dan Prasarana Pendidikan',
    kategori: 'Sarana Prasarana',
    keterangan: 'Pengelolaan aset, gedung, dan fasilitas penunjang pendidikan',
  },
  {
    kode: '400.3.13.1',
    nama: 'Prasarana Pendidikan',
    kategori: 'Gedung & Lahan',
    keterangan: 'Lahan, ruang kelas, laboratorium, perpustakaan, sanitasi',
  },
  {
    kode: '400.3.13.2',
    nama: 'Sarana Pendidikan',
    kategori: 'Alat & Perlengkapan',
    keterangan: 'Meubilair, komputer CBT/TIK, alat peraga IPA, buku perpustakaan',
  },
  {
    kode: '400.3.13.3',
    nama: 'Monitoring dan Evaluasi Sarpras',
    kategori: 'Monev Sarpras',
    keterangan: 'Inspeksi berkala sarpras, audit inventaris barang sekolah',
  },

  // --- KELOMPOK POLA KEDINASAN BAKU (SURAT TUGAS, SPPD, KEPUTUSAN, KEPEGAWAIAN) ---
  {
    kode: '090',
    nama: 'Surat Perintah Tugas (SPT) / Penugasan Dinas',
    kategori: 'Surat Tugas Dinas',
    keterangan: 'Surat tugas dinas pegawai/guru mengikuti rapat, pelatihan, atau dinas luar',
  },
  {
    kode: '094',
    nama: 'Surat Perintah Perjalanan Dinas (SPPD)',
    kategori: 'Perjalanan Dinas',
    keterangan: 'Perjalanan dinas operasional sekolah dan biaya transport penugasan',
  },
  {
    kode: '005',
    nama: 'Undangan Kedinasan',
    kategori: 'Undangan Dinas',
    keterangan: 'Undangan rapat dinas, pertemuan komite sekolah, dan sosialisasi',
  },
  {
    kode: '020',
    nama: 'Pemberitahuan / Surat Edaran Sekolah',
    kategori: 'Edaran & Pemberitahuan',
    keterangan: 'Pemberitahuan hari libur, kegiatan sekolah, dan edaran umum',
  },
  {
    kode: '800',
    nama: 'Kepegawaian Umum & Ketatausahaan',
    kategori: 'Kepegawaian',
    keterangan: 'Administrasi umum ketenagakerjaan dan kepegawaian PTK',
  },
  {
    kode: '822',
    nama: 'Kenaikan Gaji Berkala (KGB) Pegawai',
    kategori: 'Kesejahteraan PTK',
    keterangan: 'Pengantar usulan dan SK kenaikan gaji berkala PTK',
  },
  {
    kode: '823',
    nama: 'Kenaikan Pangkat / Golongan PTK',
    kategori: 'Karir & Pangkat',
    keterangan: 'Pengantar usulan penetapan angka kredit & kenaikan pangkat',
  },
  {
    kode: '824',
    nama: 'Mutasi / Pindah Tugas Pegawai & PTK',
    kategori: 'Mutasi PTK',
    keterangan: 'Rekomendasi dan surat pelepasan mutasi tugas dinas pendidik',
  },
  {
    kode: '850',
    nama: 'Cuti Pegawai / Izin Tidak Masuk Kerja Dinas',
    kategori: 'Cuti & Izin PTK',
    keterangan: 'Surat izin cuti tahunan, sakit, bersalin, dan cuti alasan penting',
  },
  {
    kode: '890',
    nama: 'Pendidikan dan Pelatihan Pegawai (Diklat / PPG / Tugas Belajar)',
    kategori: 'Pengembangan Profesi',
    keterangan: 'Rekomendasi tugas belajar, izin kuliah, dan diklat struktural/fungsional',
  },
  {
    kode: '421.1',
    nama: 'Gedung dan Perlengkapan Sekolah',
    kategori: 'Sarpras Sekolah',
    keterangan: 'Administrasi inventaris gedung dan perlengkapan sarana sekolah',
  },
  {
    kode: '421.2',
    nama: 'Penerimaan Siswa Baru (PPDB) & Mutasi Siswa',
    kategori: 'Kesiswaan & Mutasi',
    keterangan: 'Administrasi PPDB, mutasi masuk dan mutasi keluar peserta didik',
  },
  {
    kode: '421.3',
    nama: 'Kesiswaan, Keterangan Aktif, & Kelakuan Baik',
    kategori: 'Kesiswaan',
    keterangan: 'Surat keterangan siswa aktif, keterangan kelakuan baik, kegiatan siswa',
  },
  {
    kode: '421.4',
    nama: 'Beasiswa & Bantuan Pendidikan Peserta Didik',
    kategori: 'Beasiswa Siswa',
    keterangan: 'Rekomendasi beasiswa prestasi, PIP, dan surat keringanan biaya',
  },
  {
    kode: '421.7',
    nama: 'Kegiatan Ekstrakurikuler, Lomba, & Kepramukaan',
    kategori: 'Ekstrakurikuler',
    keterangan: 'Surat tugas dan pengantar siswa mengikuti lomba, ekskul, pramuka',
  },
];

export interface SpreadsheetSearchResult {
  id: string;
  name: string;
  folderName?: string;
  folderId?: string;
  modifiedTime?: string;
  webViewLink?: string;
  sheetNames?: string[];
  hasSuratMasukSheet?: boolean;
}

export interface ParsedSheetSuratMasuk {
  headers: string[];
  rawRows: string[][];
  suratList: SuratMasuk[];
  unmappedColumns: string[];
}

export interface ParsedSheetSuratKeluar {
  headers: string[];
  rawRows: string[][];
  suratList: SuratKeluar[];
  unmappedColumns: string[];
}

/**
 * Searches Google Drive for folder 'Tata Usaha' and spreadsheet 'Aplikasi Tata Usaha'
 * or any spreadsheet containing a 'SURAT MASUK' sheet.
 */
export const searchTataUsahaSpreadsheets = async (
  accessToken: string
): Promise<SpreadsheetSearchResult[]> => {
  // 1. Search for spreadsheets
  const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, parents, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '30',
  });

  const response = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal mencari spreadsheet di Google Drive');
  }

  const data = await response.json();
  const files = data.files || [];

  // 2. Fetch parents name cache if needed
  const folderNamesCache: Record<string, string> = {};

  const results: SpreadsheetSearchResult[] = [];

  for (const file of files) {
    let folderName = '';
    let folderId = file.parents?.[0];

    if (folderId) {
      if (folderNamesCache[folderId]) {
        folderName = folderNamesCache[folderId];
      } else {
        try {
          const folderRes = await fetch(`${DRIVE_API_URL}/files/${folderId}?fields=name`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (folderRes.ok) {
            const folderData = await folderRes.json();
            folderName = folderData.name || '';
            folderNamesCache[folderId] = folderName;
          }
        } catch {
          // ignore
        }
      }
    }

    results.push({
      id: file.id,
      name: file.name,
      folderName,
      folderId,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
    });
  }

  // Sort prioritizing "Aplikasi Tata Usaha" and folder "Tata Usaha"
  results.sort((a, b) => {
    const aIsAplikasiTU = a.name.toLowerCase().includes('aplikasi tata usaha') || a.name.toLowerCase().includes('tata usaha');
    const bIsAplikasiTU = b.name.toLowerCase().includes('aplikasi tata usaha') || b.name.toLowerCase().includes('tata usaha');
    const aInTUFolder = (a.folderName || '').toLowerCase().includes('tata usaha');
    const bInTUFolder = (b.folderName || '').toLowerCase().includes('tata usaha');

    if ((aIsAplikasiTU || aInTUFolder) && !(bIsAplikasiTU || bInTUFolder)) return -1;
    if (!(aIsAplikasiTU || aInTUFolder) && (bIsAplikasiTU || bInTUFolder)) return 1;
    return 0;
  });

  return results;
};

/**
 * Gets sheet names inside a spreadsheet
 */
export const getSpreadsheetMetadata = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetNames: string[] }> => {
  const response = await fetch(`${SHEETS_API_URL}/${spreadsheetId}?fields=properties.title,sheets.properties.title`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil metadata spreadsheet (${response.status})`);
  }

  const data = await response.json();
  const title = data.properties?.title || 'Spreadsheet';
  const sheetNames = (data.sheets || []).map((s: any) => s.properties?.title || '');

  return { title, sheetNames };
};

/**
 * Resolves the closest matching sheet tab name (e.g., 'KOTAK MASUK', 'SURAT MASUK', 'Kotak Masuk')
 */
export const resolveSheetTabName = async (
  accessToken: string,
  spreadsheetId: string,
  preferredNames: string[] = ['KOTAK MASUK', 'SURAT MASUK', 'Kotak Masuk', 'Surat Masuk', 'Inbox', 'INBOX']
): Promise<string> => {
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    if (!meta.sheetNames || meta.sheetNames.length === 0) {
      return preferredNames[0] || 'SURAT MASUK';
    }

    // 1. Exact case-insensitive match
    for (const pref of preferredNames) {
      const found = meta.sheetNames.find((s) => s.toLowerCase().trim() === pref.toLowerCase().trim());
      if (found) return found;
    }

    // 2. Partial match
    for (const pref of preferredNames) {
      const found = meta.sheetNames.find((s) => s.toLowerCase().includes(pref.toLowerCase()) || pref.toLowerCase().includes(s.toLowerCase()));
      if (found) return found;
    }

    // 3. Keyword match: kotak, masuk, surat, inbox
    const keywordMatch = meta.sheetNames.find((s) => {
      const lower = s.toLowerCase();
      return lower.includes('kotak') || lower.includes('masuk') || lower.includes('inbox') || lower.includes('surat');
    });
    if (keywordMatch) return keywordMatch;

    // Fallback to first sheet
    return meta.sheetNames[0];
  } catch (err) {
    console.warn('resolveSheetTabName warning:', err);
    return preferredNames[0] || 'SURAT MASUK';
  }
};

/**
 * Reads values from a specific sheet, automatically resolving tab name if needed
 */
export const readSheetData = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'SURAT MASUK'
): Promise<string[][]> => {
  let targetSheetName = sheetName;
  try {
    targetSheetName = await resolveSheetTabName(accessToken, spreadsheetId, [
      sheetName,
      'KOTAK MASUK',
      'SURAT MASUK',
      'Kotak Masuk',
      'Surat Masuk',
      'Kotak_Masuk',
      'Surat_Masuk',
      'INBOX',
      'Inbox',
    ]);
  } catch (e) {
    console.warn('Auto resolve tab warning:', e);
  }

  const range = encodeURIComponent(targetSheetName);
  const response = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membaca sheet "${targetSheetName}" (${response.status})`);
  }

  const data = await response.json();
  return (data.values || []) as string[][];
};

/**
 * Parses 2D spreadsheet data into structured SuratMasuk items based on table format.
 * Strictly ignores top title banners, repeated headers, empty lines, and footer signature blocks
 * so that the count precisely matches the real letter rows in the Google Sheet.
 */
export const parseSuratMasukFromRows = (rawRows: string[][]): ParsedSheetSuratMasuk => {
  if (!rawRows || rawRows.length === 0) {
    return { headers: [], rawRows: [], suratList: [], unmappedColumns: [] };
  }

  // 1. Detect Header Row using comprehensive score matching across the first 15 rows
  const headerKeywords = [
    'no', 'agenda', 'urut', 'kode',
    'terima', 'masuk', 'tgl terima', 'tanggal terima',
    'no surat', 'nomor surat', 'no. surat', 'nomor',
    'tgl surat', 'tanggal surat', 'tgl. surat',
    'pengirim', 'asal', 'dari', 'instansi',
    'perihal', 'hal', 'isi', 'ringkas', 'tentang', 'uraian',
    'sifat', 'klasifikasi',
    'disposisi', 'diteruskan', 'tujuan',
    'instruksi', 'petunjuk', 'catatan',
    'keterangan', 'ket', 'status',
  ];

  let headerRowIndex = 0;
  let maxScore = 0;

  const maxHeaderSearch = Math.min(15, rawRows.length);
  for (let i = 0; i < maxHeaderSearch; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    let score = 0;
    row.forEach((cell) => {
      const cellText = String(cell || '').toLowerCase().trim();
      if (!cellText) return;
      if (headerKeywords.some((kw) => cellText.includes(kw))) {
        score++;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  // If no high-scoring header row was found (e.g. score < 2), fallback to row 0
  if (maxScore < 2) {
    headerRowIndex = 0;
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim());
  const potentialDataRows = rawRows.slice(headerRowIndex + 1);

  // Helper to match column headers using strict priority rules
  const findColIndex = (testFn: (headerText: string, index: number) => boolean): number => {
    return headers.findIndex((h, idx) => testFn(String(h || '').toLowerCase().trim(), idx));
  };

  // 1. Tanggal Terima / Tanggal Surat Masuk (e.g. "TANGGAL SURAT MASUK", "TGL SURAT MASUK", "TANGGAL TERIMA")
  let colTanggalTerima = findColIndex((h) =>
    h.includes('tanggal surat masuk') ||
    h.includes('tgl surat masuk') ||
    h.includes('tgl masuk') ||
    h.includes('surat masuk') ||
    h.includes('tanggal terima') ||
    h.includes('tgl terima') ||
    h.includes('diterima') ||
    h.includes('terima')
  );

  // 2. Nomor Surat (e.g. "NOMOR SURAT", "NO. SURAT", "NO SURAT")
  let colNoSurat = findColIndex((h) =>
    h.includes('nomor surat') ||
    h.includes('no surat') ||
    h.includes('no. surat') ||
    h.includes('no_surat')
  );

  // 3. Tanggal Surat (Exclude "tanggal surat masuk")
  let colTanggalSurat = findColIndex((h, idx) =>
    idx !== colTanggalTerima &&
    (h.includes('tanggal surat') || h.includes('tgl surat') || h.includes('tgl. surat') || h.includes('tgl_surat'))
  );

  // 4. Asal / Pengirim (e.g. "PENGIRIM", "ASAL SURAT", "DARI", "INSTANSI")
  let colAsalSurat = findColIndex((h) =>
    h.includes('pengirim') ||
    h.includes('asal surat') ||
    h.includes('dari') ||
    h.includes('instansi') ||
    (h.includes('asal') && !h.includes('masalah'))
  );

  // 5. Perihal / Isi Ringkas (e.g. "PERIHAL", "ISI RINGKAS", "HAL", "TENTANG")
  let colPerihal = findColIndex((h) =>
    h.includes('perihal') ||
    h.includes('isi ringkas') ||
    h.includes('hal') ||
    h.includes('tentang') ||
    h.includes('isi surat') ||
    h.includes('ringkasan') ||
    h.includes('uraian') ||
    h === 'isi'
  );

  // 6. Keterangan (e.g. "KET", "KETERANGAN")
  let colKeterangan = findColIndex((h) =>
    h === 'ket' ||
    h.includes('keterangan') ||
    h.includes('status') ||
    h.includes('link') ||
    h.includes('drive')
  );

  // 7. No Agenda / No Urut (Must not be colNoSurat)
  let colNoAgenda = findColIndex((h, idx) =>
    idx !== colNoSurat &&
    (h === 'no' || h === 'no.' || h === 'nomor' || h.includes('agenda') || h.includes('urut') || h.includes('kode'))
  );

  // 8. Sifat & Kategori & Disposisi
  let colSifat = findColIndex((h) => h.includes('sifat') || h.includes('klasifikasi'));
  let colKategori = findColIndex((h) => h.includes('kategori') || h.includes('jenis') || h.includes('bidang'));
  let colDisposisi = findColIndex((h) => h.includes('disposisi') || h.includes('diteruskan') || h.includes('tujuan'));
  let colInstruksi = findColIndex((h) => h.includes('instruksi') || h.includes('petunjuk') || h.includes('arahan'));

  // Positional standard fallback only for missing critical fields
  if (colNoAgenda === -1 && headers.length > 0) colNoAgenda = 0;
  if (colTanggalTerima === -1 && headers.length > 1) colTanggalTerima = 1;
  if (colAsalSurat === -1 && headers.length > 2) colAsalSurat = 2;
  if (colNoSurat === -1 && headers.length > 3) colNoSurat = 3;
  if (colTanggalSurat === -1 && headers.length > 4) colTanggalSurat = 4;
  if (colPerihal === -1 && headers.length > 5) colPerihal = 5;
  if (colKeterangan === -1 && headers.length > 6) colKeterangan = 6;

  const suratList: SuratMasuk[] = [];

  potentialDataRows.forEach((row, idx) => {
    // 1. Skip completely empty rows
    if (!row || row.length === 0 || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    const rowFullText = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');

    // 2. Skip secondary/repeated header rows
    if (
      (rowFullText.includes('nomor surat') || rowFullText.includes('no surat')) &&
      (rowFullText.includes('perihal') || rowFullText.includes('pengirim') || rowFullText.includes('tanggal'))
    ) {
      return;
    }

    // 3. Skip footer signature blocks and metadata annotations
    if (
      rowFullText.includes('mengetahui') ||
      rowFullText.includes('kepala sekolah') ||
      rowFullText.includes('kepala tata usaha') ||
      rowFullText.includes('nip.') ||
      rowFullText.includes('pembina tk. i') ||
      (rowFullText.startsWith('puriala,') && !rowFullText.includes('undangan')) ||
      rowFullText.includes('lembar disposisi') ||
      rowFullText.includes('pemerintah kabupaten konawe') ||
      rowFullText.includes('dinas pendidikan dan kebudayaan')
    ) {
      // Check if it's purely a footer/signature row (not a letter about Dinas Dikbud)
      const hasRealLetterContent = row.some((c) => {
        const val = String(c || '').trim();
        return (val.includes('/') && val.length > 10) || val.toLowerCase().includes('undangan') || val.toLowerCase().includes('edaran');
      });

      if (!hasRealLetterContent) {
        return;
      }
    }

    const getVal = (colIdx: number, defaultVal = ''): string => {
      if (colIdx >= 0 && colIdx < row.length && row[colIdx] !== undefined && row[colIdx] !== null) {
        return String(row[colIdx]).trim();
      }
      return defaultVal;
    };

    const rawNoAgenda = getVal(colNoAgenda);
    const rawNoSurat = getVal(colNoSurat);
    const rawTanggalTerima = getVal(colTanggalTerima);
    const rawTanggalSurat = getVal(colTanggalSurat);
    const rawAsalSurat = getVal(colAsalSurat);
    const rawPerihal = getVal(colPerihal);
    const rawSifat = getVal(colSifat, 'Biasa');
    const rawKategori = getVal(colKategori);
    const rawDisposisi = getVal(colDisposisi);
    const rawInstruksi = getVal(colInstruksi);
    const rawKeterangan = getVal(colKeterangan);

    // 4. Strict Validation: Row MUST have meaningful letter content
    // A row is valid if it has a perihal or a nomor surat or an asal pengirim or a tanggal
    const cleanPerihal = String(rawPerihal || '').trim();
    const cleanNoSurat = String(rawNoSurat || '').trim();
    const cleanAsal = String(rawAsalSurat || '').trim();

    if (!cleanPerihal && !cleanNoSurat && !cleanAsal) {
      return;
    }

    // Determine current item index
    const currentNumber = suratList.length + 1;
    const tanggalTerimaVal = formatSheetDate(rawTanggalTerima) || new Date().toISOString().split('T')[0];
    const tanggalSuratVal = formatSheetDate(rawTanggalSurat) || tanggalTerimaVal;
    const yearForAgenda = (tanggalSuratVal || tanggalTerimaVal || '2025').slice(0, 4);

    let formattedAgendaNo = rawNoAgenda;
    if (!formattedAgendaNo || /^\d+$/.test(formattedAgendaNo)) {
      const num = formattedAgendaNo ? parseInt(formattedAgendaNo, 10) : currentNumber;
      formattedAgendaNo = `${String(num).padStart(3, '0')}/SM/${yearForAgenda}`;
    }

    const formattedNoSurat = rawNoSurat || `SM-${currentNumber}`;
    const asalSuratVal = rawAsalSurat || 'Instansi Terkait';
    const perihalVal = rawPerihal || 'Surat Masuk';

    const sifatVal: SifatSurat =
      rawSifat.toLowerCase().includes('penting')
        ? 'Penting'
        : rawSifat.toLowerCase().includes('rahasia')
        ? 'Rahasia'
        : rawSifat.toLowerCase().includes('amat') || rawSifat.toLowerCase().includes('sangat')
        ? 'Sangat Segera'
        : rawSifat.toLowerCase().includes('segera')
        ? 'Segera'
        : 'Biasa';

    const diteruskanArray = rawDisposisi
      ? rawDisposisi
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const hasDisposisi = diteruskanArray.length > 0 || Boolean(rawInstruksi);

    const item: SuratMasuk = {
      id: `SM-GDRIVE-${Date.now()}-${suratList.length}`,
      noAgenda: formattedAgendaNo,
      noSurat: formattedNoSurat,
      tanggalSurat: tanggalSuratVal,
      tanggalTerima: tanggalTerimaVal,
      asalSurat: asalSuratVal,
      perihal: perihalVal,
      sifat: sifatVal,
      kategori: rawKategori || 'Umum / Dinas',
      ringkasan: perihalVal + (rawKeterangan ? ` (${rawKeterangan})` : ''),
      statusDisposisi: hasDisposisi ? 'Sudah Disposisi' : 'Belum Disposisi',
      diteruskanKepada: diteruskanArray.length > 0 ? diteruskanArray : ['Wakasek Kurikulum', 'Kepala Tata Usaha'],
      instruksiDisposisi: rawInstruksi || (hasDisposisi ? 'Tindak lanjuti dan arsipkan' : ''),
      catatanKepsek: rawInstruksi,
      tanggalDisposisi: hasDisposisi ? tanggalTerimaVal : undefined,
      statusDrive: 'Tersimpan',
      drivePath: `/Tata Usaha/Aplikasi Tata Usaha/KOTAK MASUK`,
    };

    suratList.push(item);
  });

  return {
    headers,
    rawRows,
    suratList,
    unmappedColumns: [],
  };
};

/**
 * Standardize date strings from spreadsheet (e.g. 26/08/2026, 2026-08-26, 26 Agustus 2026, or Excel serials)
 */
function formatSheetDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM/YYYY or MM/DD/YYYY or D/M/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const num1 = parseInt(slashMatch[1], 10);
    const num2 = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];

    // If num2 > 12, then num1 is Month and num2 is Day (e.g. 5/16/2025 -> 2025-05-16)
    if (num2 > 12 && num1 <= 12) {
      const month = String(num1).padStart(2, '0');
      const day = String(num2).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // If num1 > 12, then num1 is Day and num2 is Month (e.g. 26/05/2025 -> 2025-05-26)
    if (num1 > 12 && num2 <= 12) {
      const day = String(num1).padStart(2, '0');
      const month = String(num2).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Default to Day/Month/Year
    const day = String(num1).padStart(2, '0');
    const month = String(num2).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Indonesian date text: "25 Agustus 2026" or "10 Jan 2026"
  const indoMonths: Record<string, string> = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05', may: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    agu: '08', agustus: '08', ags: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10',
    nov: '11', november: '11',
    des: '12', desember: '12',
  };

  const textDateMatch = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (textDateMatch) {
    const day = textDateMatch[1].padStart(2, '0');
    const monthStr = textDateMatch[2].toLowerCase();
    const year = textDateMatch[3];
    const month = indoMonths[monthStr] || '01';
    return `${year}-${month}-${day}`;
  }

  // Excel serial number (e.g. 45528)
  if (/^\d{5}$/.test(trimmed)) {
    const serial = parseInt(trimmed, 10);
    const date = new Date((serial - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return trimmed;
}

/**
 * Writes or appends Surat Masuk data back to Google Sheets
 */
export const writeSuratMasukToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  suratList: SuratMasuk[],
  sheetName: string = 'SURAT MASUK'
): Promise<void> => {
  const headers = [
    'No.',
    'No. Agenda',
    'Tanggal Terima',
    'Nomor Surat',
    'Tanggal Surat',
    'Asal Surat / Pengirim',
    'Perihal / Isi Ringkas',
    'Sifat Surat',
    'Kategori',
    'Status Disposisi',
    'Diteruskan Kepada',
    'Instruksi / Catatan Kepsek',
    'Status Google Drive',
  ];

  const rows = suratList.map((s, index) => [
    index + 1,
    s.noAgenda,
    s.tanggalTerima,
    s.noSurat,
    s.tanggalSurat,
    s.asalSurat,
    s.perihal,
    s.sifat,
    s.kategori,
    s.statusDisposisi,
    (s.diteruskanKepada || []).join(', '),
    s.instruksiDisposisi || s.catatanKepsek || '',
    s.statusDrive || 'Tersimpan',
  ]);

  const allValues = [headers, ...rows];

  const range = `${sheetName}!A1:M${allValues.length}`;

  const response = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menyimpan data ke Google Sheets');
  }
};

/**
 * Create official Tata Usaha folder and Aplikasi Tata Usaha spreadsheet if not yet created
 */
export const createTataUsahaSpreadsheetWithSuratMasuk = async (
  accessToken: string,
  initialSuratList: SuratMasuk[] = []
): Promise<{ spreadsheetId: string; webViewLink: string }> => {
  // 1. Find or create folder 'Tata Usaha'
  const folderQuery = "name = 'Tata Usaha' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const folderRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: folderQuery, fields: 'files(id, name)' })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let folderId = '';
  if (folderRes.ok) {
    const data = await folderRes.json();
    if (data.files && data.files.length > 0) {
      folderId = data.files[0].id;
    }
  }

  if (!folderId) {
    // Create folder Tata Usaha
    const createFolderRes = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Tata Usaha',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (createFolderRes.ok) {
      const folderData = await createFolderRes.json();
      folderId = folderData.id;
    }
  }

  // 2. Create Spreadsheet 'Aplikasi Tata Usaha'
  const createSheetRes = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Aplikasi Tata Usaha',
      },
      sheets: [
        {
          properties: {
            title: 'SURAT MASUK',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'SURAT KELUAR',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'BUKU INDUK SISWA',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createSheetRes.ok) {
    const err = await createSheetRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal membuat spreadsheet Aplikasi Tata Usaha');
  }

  const sheetData = await createSheetRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Move file to folder 'Tata Usaha' if folderId exists
  if (folderId) {
    await fetch(`${DRIVE_API_URL}/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // 4. Populate with initial Surat Masuk data
  if (initialSuratList.length > 0) {
    await writeSuratMasukToSheet(accessToken, spreadsheetId, initialSuratList, 'SURAT MASUK');
  }

  return { spreadsheetId, webViewLink };
};

/**
 * Searches Google Drive for folder 'Tata Usaha' and spreadsheet 'Nomor Surat' (or 'nomor surat')
 */
export const searchNomorSuratSpreadsheets = async (
  accessToken: string
): Promise<SpreadsheetSearchResult[]> => {
  const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, parents, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '40',
  });

  const response = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal mencari spreadsheet Nomor Surat di Google Drive');
  }

  const data = await response.json();
  const files = data.files || [];

  const folderNamesCache: Record<string, string> = {};
  const results: SpreadsheetSearchResult[] = [];

  for (const file of files) {
    let folderName = '';
    let folderId = file.parents?.[0];

    if (folderId) {
      if (folderNamesCache[folderId]) {
        folderName = folderNamesCache[folderId];
      } else {
        try {
          const folderRes = await fetch(`${DRIVE_API_URL}/files/${folderId}?fields=name`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (folderRes.ok) {
            const folderData = await folderRes.json();
            folderName = folderData.name || '';
            folderNamesCache[folderId] = folderName;
          }
        } catch {
          // ignore
        }
      }
    }

    results.push({
      id: file.id,
      name: file.name,
      folderName,
      folderId,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
    });
  }

  // Sort prioritizing "Nomor Surat" / "nomor surat" in folder "Tata Usaha"
  results.sort((a, b) => {
    const aIsNomorSurat = a.name.toLowerCase().includes('nomor surat') || a.name.toLowerCase().includes('no surat');
    const bIsNomorSurat = b.name.toLowerCase().includes('nomor surat') || b.name.toLowerCase().includes('no surat');
    const aInTUFolder = (a.folderName || '').toLowerCase().includes('tata usaha');
    const bInTUFolder = (b.folderName || '').toLowerCase().includes('tata usaha');

    if (aIsNomorSurat && aInTUFolder && !(bIsNomorSurat && bInTUFolder)) return -1;
    if (!(aIsNomorSurat && aInTUFolder) && bIsNomorSurat && bInTUFolder) return 1;
    if (aIsNomorSurat && !bIsNomorSurat) return -1;
    if (!aIsNomorSurat && bIsNomorSurat) return 1;
    if (aInTUFolder && !bInTUFolder) return -1;
    if (!aInTUFolder && bInTUFolder) return 1;
    return 0;
  });

  return results;
};

/**
 * Parses raw 2D array rows from sheet '2026' into SuratKeluar array
 */
export const parseSuratKeluarFromRows = (rawRows: string[][]): ParsedSheetSuratKeluar => {
  if (!rawRows || rawRows.length === 0) {
    return { headers: [], rawRows: [], suratList: [], unmappedColumns: [] };
  }

  // Find header row (the first row containing keywords like 'nomor', 'perihal', 'tujuan', 'agenda', 'tanggal')
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const rowStr = rawRows[i].map((c) => String(c || '').toLowerCase()).join(' ');
    if (
      rowStr.includes('perihal') ||
      rowStr.includes('nomor') ||
      rowStr.includes('tujuan') ||
      rowStr.includes('kepada') ||
      rowStr.includes('agenda') ||
      rowStr.includes('klasifikasi')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = rawRows[headerRowIndex].map((h) => String(h || '').trim());
  const dataRows = rawRows.slice(headerRowIndex + 1);

  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = (h || '').toLowerCase().trim();
      return keywords.some((kw) => lower.includes(kw.toLowerCase()));
    });
  };

  let colNoAgenda = findColIndex(['no. agenda', 'nomor agenda', 'no agenda', 'agenda', 'no urut', 'urut', 'no.']);
  let colKodeKlasifikasi = findColIndex(['kode klasifikasi', 'kode', 'klasifikasi', 'kode surat']);
  let colNoSurat = findColIndex(['nomor surat', 'no surat', 'no. surat', 'no_surat', 'nomor']);
  let colTanggalSurat = findColIndex(['tgl surat', 'tanggal surat', 'tgl. surat', 'tanggal', 'tgl', 'tgl_surat']);
  let colTujuanSurat = findColIndex(['tujuan surat', 'dikirim kepada', 'kepada', 'tujuan', 'penerima', 'alamat tujuan', 'instansi']);
  let colPerihal = findColIndex(['perihal', 'isi ringkas', 'hal', 'isi surat', 'tentang', 'ringkasan', 'uraian', 'isi pokok']);
  let colSifat = findColIndex(['sifat surat', 'sifat', 'klasifikasi sifat']);
  let colLampiran = findColIndex(['lampiran', 'lamp', 'berkas']);
  let colPengonsep = findColIndex(['pengonsep', 'konseptor', 'pembuat', 'ka tu', 'konsep']);
  let colPenandatangan = findColIndex(['penandatangan', 'ttd', 'pejabat', 'kepala sekolah', 'ditandatangani']);
  let colStatus = findColIndex(['status verifikasi', 'status', 'keterangan', 'ket']);

  // Position-based fallbacks for typical Indonesian school book numbering format
  if (headers.length >= 5) {
    if (colNoSurat === -1) {
      if (headers.length > 3) colNoSurat = 3;
      else if (headers.length > 2) colNoSurat = 2;
      else if (headers.length > 1) colNoSurat = 1;
    }
    if (colTanggalSurat === -1 && headers.length > 4) colTanggalSurat = 4;
    if (colTujuanSurat === -1 && headers.length > 5) colTujuanSurat = 5;
    if (colPerihal === -1 && headers.length > 6) colPerihal = 6;
  }

  const suratList: SuratKeluar[] = [];

  dataRows.forEach((row, idx) => {
    // Skip empty rows
    const isRowEmpty = row.every((c) => !c || String(c).trim() === '');
    if (isRowEmpty) return;

    const getVal = (colIdx: number) => {
      if (colIdx >= 0 && colIdx < row.length) {
        return String(row[colIdx] || '').trim();
      }
      return '';
    };

    const rawNoSurat = getVal(colNoSurat);
    const rawPerihal = getVal(colPerihal);
    const rawTujuan = getVal(colTujuanSurat);
    const rawNoAgenda = getVal(colNoAgenda);
    const rawTglSurat = getVal(colTanggalSurat);
    const rawKode = getVal(colKodeKlasifikasi);
    const rawSifat = getVal(colSifat);
    const rawLampiran = getVal(colLampiran);
    const rawPengonsep = getVal(colPengonsep);
    const rawPenandatangan = getVal(colPenandatangan);
    const rawStatus = getVal(colStatus);

    // If the row has neither noSurat nor perihal nor tujuan, skip
    if (!rawNoSurat && !rawPerihal && !rawTujuan) return;

    // Normalize Sifat
    let sifat: SifatSurat = 'Biasa';
    const lowerSifat = rawSifat.toLowerCase();
    if (lowerSifat.includes('sangat segera') || lowerSifat.includes('amat segera')) sifat = 'Sangat Segera';
    else if (lowerSifat.includes('rahasia')) sifat = 'Rahasia';
    else if (lowerSifat.includes('segera')) sifat = 'Segera';
    else if (lowerSifat.includes('penting')) sifat = 'Penting';

    // Normalize Status Verifikasi
    let statusVerifikasi: SuratKeluar['statusVerifikasi'] = 'Sudah Dikirim';
    const lowerStatus = rawStatus.toLowerCase();
    if (lowerStatus.includes('draf') || lowerStatus.includes('draft')) statusVerifikasi = 'Draf';
    else if (lowerStatus.includes('setuju') || lowerStatus.includes('disetujui')) statusVerifikasi = 'Disetujui Kepala Sekolah';
    else if (lowerStatus.includes('arsip')) statusVerifikasi = 'Arsip';
    else if (lowerStatus.includes('kirim') || lowerStatus.includes('dikirim') || lowerStatus.includes('terkirim') || lowerStatus.includes('selesai')) statusVerifikasi = 'Sudah Dikirim';

    // Format Date ISO
    const formatDate = (dStr: string) => {
      if (!dStr) return new Date().toISOString().split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
      // parse dd/mm/yyyy or dd-mm-yyyy
      const parts = dStr.split(/[\/\-.]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      return dStr;
    };

    // Extract or infer kode klasifikasi
    let kodeKlasifikasi = rawKode || '421.3';
    if (!rawKode && rawNoSurat) {
      const matchKode = rawNoSurat.match(/^([0-9]{3}(\.[0-9]+)?)/);
      if (matchKode) {
        kodeKlasifikasi = matchKode[1];
      }
    }

    const agendaNum = rawNoAgenda || String(idx + 1).padStart(3, '0') + '/SK/2026';

    suratList.push({
      id: `SK-SHEET-${idx + 1}-${Date.now()}`,
      noAgenda: agendaNum,
      noSurat: rawNoSurat || `${kodeKlasifikasi}/${String(idx + 1).padStart(3, '0')}/SMP.02/Konawe/2026`,
      kodeKlasifikasi,
      tanggalSurat: formatDate(rawTglSurat),
      tujuanSurat: rawTujuan || 'Instansi Terkait',
      perihal: rawPerihal || 'Surat Dinas',
      sifat,
      lampiran: rawLampiran || '-',
      pengonsep: rawPengonsep || 'Tata Usaha',
      penandatangan: rawPenandatangan || 'Kepala Sekolah',
      nipPenandatangan: '-',
      isiSuratRingkas: rawPerihal,
      statusVerifikasi,
      statusDrive: 'Tersimpan',
      lampiranNama: 'Surat_Keluar_2026.pdf',
    });
  });

  return {
    headers,
    rawRows,
    suratList,
    unmappedColumns: [],
  };
};

/**
 * Writes or appends SuratKeluar rows to sheet '2026' in spreadsheet 'Nomor Surat'
 */
export const writeSuratKeluarToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  suratList: SuratKeluar[],
  sheetName: string = '2026'
): Promise<void> => {
  // Ensure the sheet exists
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    if (!meta.sheetNames.includes(sheetName)) {
      // Add sheet
      await fetch(`${SHEETS_API_URL}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
    }
  } catch (e) {
    console.warn('Could not verify/add sheet tab, proceeding with write:', e);
  }

  const standardHeaders = [
    'No.',
    'No. Agenda',
    'Kode Klasifikasi',
    'Nomor Surat',
    'Tanggal Surat',
    'Tujuan Surat / Dikirim Kepada',
    'Perihal / Isi Ringkas',
    'Sifat Surat',
    'Lampiran',
    'Pengonsep',
    'Penandatangan',
    'Status Verifikasi',
  ];

  const rows: (string | number)[][] = [standardHeaders];

  suratList.forEach((s, idx) => {
    rows.push([
      idx + 1,
      s.noAgenda || `${idx + 1}/SK/2026`,
      s.kodeKlasifikasi || '421.3',
      s.noSurat || '',
      s.tanggalSurat || '',
      s.tujuanSurat || '',
      s.perihal || '',
      s.sifat || 'Biasa',
      s.lampiran || '-',
      s.pengonsep || '',
      s.penandatangan || '',
      s.statusVerifikasi || 'Sudah Dikirim',
    ]);
  });

  // Clear first
  const range = encodeURIComponent(`${sheetName}!A1:Z500`);
  await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Write new values
  const writeRange = encodeURIComponent(`${sheetName}!A1`);
  const response = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menyimpan data ke sheet 2026');
  }
};

/**
 * Creates 'Tata Usaha' folder (if not exists) and 'Nomor Surat' spreadsheet with sheet '2026'
 */
export const createNomorSuratSpreadsheetWith2026 = async (
  accessToken: string,
  initialSuratList: SuratKeluar[] = []
): Promise<{ spreadsheetId: string; webViewLink: string }> => {
  // 1. Find or create folder 'Tata Usaha'
  const folderQuery = "name = 'Tata Usaha' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const folderRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: folderQuery, fields: 'files(id, name)' })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let folderId = '';
  if (folderRes.ok) {
    const data = await folderRes.json();
    if (data.files && data.files.length > 0) {
      folderId = data.files[0].id;
    }
  }

  if (!folderId) {
    const createFolderRes = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Tata Usaha',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (createFolderRes.ok) {
      const folderData = await createFolderRes.json();
      folderId = folderData.id;
    }
  }

  // 2. Create Spreadsheet 'Nomor Surat' with sheets '2026', '2025', and 'KODE NOMOR SURAT'
  const createSheetRes = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Nomor Surat',
      },
      sheets: [
        {
          properties: {
            title: '2026',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: '2025',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'KODE NOMOR SURAT',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createSheetRes.ok) {
    const err = await createSheetRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal membuat spreadsheet Nomor Surat');
  }

  const sheetData = await createSheetRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Move file to folder 'Tata Usaha' if folderId exists
  if (folderId) {
    await fetch(`${DRIVE_API_URL}/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // 4. Populate with initial Surat Keluar data in sheet '2026'
  if (initialSuratList.length > 0) {
    await writeSuratKeluarToSheet(accessToken, spreadsheetId, initialSuratList, '2026');
  }

  // 5. Populate initial classification codes in sheet 'KODE NOMOR SURAT'
  try {
    await writeKodeKlasifikasiToSheet(accessToken, spreadsheetId, DEFAULT_KODE_KLASIFIKASI, 'KODE NOMOR SURAT');
  } catch (e) {
    console.warn('Could not populate KODE NOMOR SURAT initial rows:', e);
  }

  return { spreadsheetId, webViewLink };
};

/**
 * Parses raw 2D array rows from sheet 'KODE NOMOR SURAT' into KodeKlasifikasiSurat array
 */
export const parseKodeKlasifikasiFromRows = (rawRows: string[][]): KodeKlasifikasiSurat[] => {
  if (!rawRows || rawRows.length === 0) {
    return DEFAULT_KODE_KLASIFIKASI;
  }

  // Find header row (the first row containing keywords like 'kode', 'klasifikasi', 'uraian', 'nama', 'perihal', 'keterangan')
  let headerRowIndex = 0;
  let hasHeader = false;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const rowStr = rawRows[i].map((c) => String(c || '').toLowerCase()).join(' ');
    if (
      rowStr.includes('kode') ||
      rowStr.includes('klasifikasi') ||
      rowStr.includes('uraian') ||
      rowStr.includes('perihal') ||
      rowStr.includes('nama') ||
      rowStr.includes('jenis')
    ) {
      headerRowIndex = i;
      hasHeader = true;
      break;
    }
  }

  const headers = hasHeader ? rawRows[headerRowIndex].map((h) => String(h || '').trim()) : [];
  const dataRows = hasHeader ? rawRows.slice(headerRowIndex + 1) : rawRows;

  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = (h || '').toLowerCase().trim();
      return keywords.some((kw) => lower.includes(kw.toLowerCase()));
    });
  };

  let colKode = hasHeader ? findColIndex(['kode klasifikasi', 'kode surat', 'kode nomor surat', 'kode', 'nomor kode']) : -1;
  let colNama = hasHeader ? findColIndex(['nama klasifikasi', 'uraian', 'perihal', 'nama', 'jenis surat', 'tentang', 'kegiatan']) : -1;
  let colKet = hasHeader ? findColIndex(['keterangan', 'deskripsi', 'contoh', 'catatan', 'ket']) : -1;

  // Fallbacks if columns are not recognized by header names
  if (colKode === -1) {
    if (headers.length > 1 && headers[0].toLowerCase().includes('no')) {
      colKode = 1;
    } else {
      colKode = 0;
    }
  }

  if (colNama === -1) {
    if (colKode === 0) colNama = 1;
    else if (colKode === 1) colNama = 2;
    else colNama = 1;
  }

  if (colKet === -1) {
    if (colNama === 1 && headers.length > 2) colKet = 2;
    else if (colNama === 2 && headers.length > 3) colKet = 3;
  }

  const list: KodeKlasifikasiSurat[] = [];
  const seenCodes = new Set<string>();

  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;
    const isRowEmpty = row.every((c) => !c || String(c).trim() === '');
    if (isRowEmpty) return;

    let kode = (row[colKode] ? String(row[colKode]) : '').trim();
    let nama = (row[colNama] ? String(row[colNama]) : '').trim();
    let keterangan = (colKet >= 0 && row[colKet] ? String(row[colKet]) : '').trim();

    // If the detected 'kode' actually looks like an index number (e.g. 1, 2, 3) and col 1 looks like a code (e.g. 421.3)
    if (/^\d{1,2}$/.test(kode) && row.length > colKode + 1 && /^[0-9]{3}/.test(String(row[colKode + 1] || '').trim())) {
      kode = String(row[colKode + 1] || '').trim();
      nama = String(row[colKode + 2] || '').trim();
      keterangan = String(row[colKode + 3] || '').trim();
    }

    // Skip if no code or if code is header-like word
    if (!kode || kode.toLowerCase() === 'kode' || kode.toLowerCase() === 'no.') return;

    // Avoid exact duplicate codes
    if (!seenCodes.has(kode.toLowerCase())) {
      seenCodes.add(kode.toLowerCase());
      list.push({
        kode,
        nama: nama || `Klasifikasi ${kode}`,
        keterangan: keterangan || undefined,
      });
    }
  });

  return list.length > 0 ? list : DEFAULT_KODE_KLASIFIKASI;
};

/**
 * Fetches Kode Klasifikasi from sheet 'KODE NOMOR SURAT' in spreadsheet 'Nomor Surat'
 */
export const fetchKodeKlasifikasiFromSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetNamePreference?: string
): Promise<KodeKlasifikasiSurat[]> => {
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    
    // Find the sheet that matches "KODE NOMOR SURAT" or "KODE SURAT" or "KLASIFIKASI"
    let targetSheet = sheetNamePreference;
    if (!targetSheet || !meta.sheetNames.includes(targetSheet)) {
      targetSheet = meta.sheetNames.find((s) => {
        const lower = s.toLowerCase().trim();
        return (
          lower === 'kode nomor surat' ||
          lower.includes('kode nomor surat') ||
          lower === 'kode surat' ||
          lower.includes('kode surat') ||
          lower.includes('klasifikasi') ||
          lower.includes('kode')
        );
      });
    }

    if (!targetSheet) {
      console.warn('Sheet KODE NOMOR SURAT not found in spreadsheet, returning default codes.');
      return DEFAULT_KODE_KLASIFIKASI;
    }

    const rawRows = await readSheetData(accessToken, spreadsheetId, targetSheet);
    if (!rawRows || rawRows.length === 0) {
      return DEFAULT_KODE_KLASIFIKASI;
    }

    const codes = parseKodeKlasifikasiFromRows(rawRows);
    return codes.length > 0 ? codes : DEFAULT_KODE_KLASIFIKASI;
  } catch (error) {
    console.error('Error fetching Kode Klasifikasi from sheet:', error);
    return DEFAULT_KODE_KLASIFIKASI;
  }
};

/**
 * Writes or initializes Kode Klasifikasi into sheet 'KODE NOMOR SURAT'
 */
export const writeKodeKlasifikasiToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  list: KodeKlasifikasiSurat[],
  sheetName: string = 'KODE NOMOR SURAT'
): Promise<void> => {
  // Ensure the sheet exists
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    if (!meta.sheetNames.includes(sheetName)) {
      await fetch(`${SHEETS_API_URL}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
    }
  } catch (e) {
    console.warn('Could not verify/add KODE NOMOR SURAT sheet tab:', e);
  }

  const headers = ['No.', 'Kode Klasifikasi', 'Uraian / Jenis Surat', 'Keterangan / Contoh'];
  const rows: (string | number)[][] = [headers];

  list.forEach((item, idx) => {
    rows.push([idx + 1, item.kode, item.nama, item.keterangan || '']);
  });

  // Clear first
  const range = encodeURIComponent(`${sheetName}!A1:Z200`);
  await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Write new values
  const writeRange = encodeURIComponent(`${sheetName}!A1`);
  const response = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menyimpan data ke sheet KODE NOMOR SURAT');
  }
};

