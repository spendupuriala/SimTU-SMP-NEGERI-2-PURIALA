import {
  SuratMasuk,
  SuratKeluar,
  SifatSurat,
  KodeKlasifikasiSurat,
  GuruPTK,
  PTK,
  Siswa,
  Alumni,
} from '../types';

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
 * Helper to write data rows to a Google Spreadsheet while 100% preserving existing templates,
 * header styling, title banners, merged cells, custom column ordering, and formatting.
 */
export const writeTemplatePreservingDataToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  dataList: any[],
  defaultHeaders: string[],
  mapRecordToHeaders: (record: any, idx: number, headers: string[]) => (string | number)[]
): Promise<void> => {
  // 1. Ensure sheet exists
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
    console.warn(`Could not verify/add sheet tab "${sheetName}":`, e);
  }

  // 2. Read existing sheet content to detect template structure
  let existingRows: string[][] = [];
  try {
    existingRows = await readSheetData(accessToken, spreadsheetId, sheetName);
  } catch {
    existingRows = [];
  }

  // 3. Case A: Brand new or completely empty sheet -> write default headers and data
  if (!existingRows || existingRows.length === 0) {
    const rows = [defaultHeaders, ...dataList.map((item, idx) => mapRecordToHeaders(item, idx, defaultHeaders))];
    const writeRange = encodeURIComponent(`${sheetName}!A1`);
    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`, {
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
    });
    return;
  }

  // 4. Case B: Template already exists -> find header row without wiping title banners/styles
  let headerRowIndex = 0;
  let maxScore = 0;
  const searchLimit = Math.min(existingRows.length, 12);

  for (let i = 0; i < searchLimit; i++) {
    const row = existingRows[i];
    if (!row || row.length === 0) continue;
    let score = 0;
    row.forEach((c) => {
      const cl = String(c || '').toLowerCase().trim();
      if (!cl) return;
      if (
        cl.includes('no') ||
        cl.includes('nama') ||
        cl.includes('nip') ||
        cl.includes('nuptk') ||
        cl.includes('nis') ||
        cl.includes('nisn') ||
        cl.includes('jabatan') ||
        cl.includes('perihal') ||
        cl.includes('agenda') ||
        cl.includes('kode') ||
        cl.includes('tanggal') ||
        cl.includes('alamat') ||
        cl.includes('tujuan') ||
        cl.includes('status')
      ) {
        score++;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  const existingHeaders = (existingRows[headerRowIndex] || []).map((h) => String(h || '').trim());
  const effectiveHeaders = existingHeaders.length > 0 && existingHeaders.some((h) => h.length > 0)
    ? existingHeaders
    : defaultHeaders;

  // Map incoming data according to the exact header layout found in the template
  const dataRows = dataList.map((item, idx) => mapRecordToHeaders(item, idx, effectiveHeaders));

  // The first data row sits immediately after the header row (1-based sheet row number: headerRowIndex + 2)
  const startRowNumber = headerRowIndex + 2;
  const maxExistingRowNumber = Math.max(existingRows.length, startRowNumber + dataRows.length);

  // Clear only data rows (leaving title and headers untouched)
  if (maxExistingRowNumber >= startRowNumber) {
    const clearRange = encodeURIComponent(`${sheetName}!A${startRowNumber}:Z${maxExistingRowNumber + 50}`);
    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${clearRange}:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).catch((err) => console.warn('Non-blocking error clearing data rows:', err));
  }

  // Write new data starting at data row position
  if (dataRows.length > 0) {
    const writeRange = encodeURIComponent(`${sheetName}!A${startRowNumber}`);
    const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetName}!A${startRowNumber}`,
        majorDimension: 'ROWS',
        values: dataRows,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menulis data ke spreadsheet "${sheetName}"`);
    }
  }
};

/**
 * Writes or appends Surat Masuk data back to Google Sheets with template preservation
 */
export const writeSuratMasukToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  suratList: SuratMasuk[],
  sheetName: string = 'SURAT MASUK'
): Promise<void> => {
  const defaultHeaders = [
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

  await writeTemplatePreservingDataToSheet(
    accessToken,
    spreadsheetId,
    sheetName,
    suratList,
    defaultHeaders,
    (s: SuratMasuk, index: number, headers: string[]) => {
      const findIndex = (kws: string[]) =>
        headers.findIndex((h) => kws.some((kw) => h.toLowerCase().includes(kw)));

      const cNo = findIndex(['no.', 'nomor urut', 'no']);
      const cAgenda = findIndex(['no. agenda', 'no agenda', 'agenda', 'kode']);
      const cTglTerima = findIndex(['tanggal terima', 'tgl terima', 'diterima']);
      const cNoSurat = findIndex(['nomor surat', 'no surat', 'no. surat']);
      const cTglSurat = findIndex(['tanggal surat', 'tgl surat', 'tgl. surat']);
      const cAsal = findIndex(['asal surat', 'pengirim', 'dari', 'instansi']);
      const cPerihal = findIndex(['perihal', 'isi ringkas', 'tentang', 'hal', 'uraian']);
      const cSifat = findIndex(['sifat', 'klasifikasi']);
      const cKategori = findIndex(['kategori', 'jenis']);
      const cStatusDisp = findIndex(['status disposisi', 'disposisi']);
      const cDiteruskan = findIndex(['diteruskan', 'tujuan disposisi']);
      const cInstruksi = findIndex(['instruksi', 'catatan kepsek', 'catatan']);
      const cDrive = findIndex(['status drive', 'drive', 'berkas']);

      const rowValues = new Array(headers.length).fill('');
      
      const setVal = (idx: number, fallbackIdx: number, val: any) => {
        const target = idx >= 0 ? idx : (fallbackIdx < headers.length ? fallbackIdx : -1);
        if (target >= 0 && target < headers.length) {
          rowValues[target] = val !== undefined && val !== null ? val : '';
        }
      };

      setVal(cNo, 0, index + 1);
      setVal(cAgenda, 1, s.noAgenda || `${index + 1}/SM/2026`);
      setVal(cTglTerima, 2, s.tanggalTerima || '');
      setVal(cNoSurat, 3, s.noSurat || '');
      setVal(cTglSurat, 4, s.tanggalSurat || '');
      setVal(cAsal, 5, s.asalSurat || '');
      setVal(cPerihal, 6, s.perihal || '');
      setVal(cSifat, 7, s.sifat || 'Biasa');
      setVal(cKategori, 8, s.kategori || '-');
      setVal(cStatusDisp, 9, s.statusDisposisi || 'Belum Disposisi');
      setVal(cDiteruskan, 10, (s.diteruskanKepada || []).join(', '));
      setVal(cInstruksi, 11, s.instruksiDisposisi || s.catatanKepsek || '');
      setVal(cDrive, 12, s.statusDrive || 'Tersimpan');

      return rowValues;
    }
  );
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
 * Writes or appends SuratKeluar rows to sheet '2026' in spreadsheet 'Nomor Surat' with template preservation
 */
export const writeSuratKeluarToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  suratList: SuratKeluar[],
  sheetName: string = '2026'
): Promise<void> => {
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

  await writeTemplatePreservingDataToSheet(
    accessToken,
    spreadsheetId,
    sheetName,
    suratList,
    standardHeaders,
    (s: SuratKeluar, idx: number, headers: string[]) => {
      const findIndex = (kws: string[]) =>
        headers.findIndex((h) => kws.some((kw) => h.toLowerCase().includes(kw)));

      const cNo = findIndex(['no.', 'nomor urut', 'no']);
      const cAgenda = findIndex(['no. agenda', 'no agenda', 'agenda']);
      const cKode = findIndex(['kode klasifikasi', 'kode surat', 'kode']);
      const cNoSurat = findIndex(['nomor surat', 'no surat', 'no. surat']);
      const cTglSurat = findIndex(['tanggal surat', 'tgl surat', 'tgl. surat']);
      const cTujuan = findIndex(['tujuan surat', 'dikirim kepada', 'tujuan', 'kepada']);
      const cPerihal = findIndex(['perihal', 'isi ringkas', 'tentang', 'hal', 'uraian']);
      const cSifat = findIndex(['sifat']);
      const cLampiran = findIndex(['lampiran']);
      const cPengonsep = findIndex(['pengonsep', 'konseptor']);
      const cPenandatangan = findIndex(['penandatangan', 'kepala sekolah', 'ttd']);
      const cStatus = findIndex(['status verifikasi', 'status']);

      const rowValues = new Array(headers.length).fill('');
      const setVal = (idx: number, fallbackIdx: number, val: any) => {
        const target = idx >= 0 ? idx : (fallbackIdx < headers.length ? fallbackIdx : -1);
        if (target >= 0 && target < headers.length) {
          rowValues[target] = val !== undefined && val !== null ? val : '';
        }
      };

      setVal(cNo, 0, idx + 1);
      setVal(cAgenda, 1, s.noAgenda || `${idx + 1}/SK/2026`);
      setVal(cKode, 2, s.kodeKlasifikasi || '421.3');
      setVal(cNoSurat, 3, s.noSurat || '');
      setVal(cTglSurat, 4, s.tanggalSurat || '');
      setVal(cTujuan, 5, s.tujuanSurat || '');
      setVal(cPerihal, 6, s.perihal || '');
      setVal(cSifat, 7, s.sifat || 'Biasa');
      setVal(cLampiran, 8, s.lampiran || '-');
      setVal(cPengonsep, 9, s.pengonsep || '');
      setVal(cPenandatangan, 10, s.penandatangan || '');
      setVal(cStatus, 11, s.statusVerifikasi || 'Sudah Dikirim');

      return rowValues;
    }
  );
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
 * Writes or initializes Kode Klasifikasi into sheet 'KODE NOMOR SURAT' with template preservation
 */
export const writeKodeKlasifikasiToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  list: KodeKlasifikasiSurat[],
  sheetName: string = 'KODE NOMOR SURAT'
): Promise<void> => {
  const defaultHeaders = ['No.', 'Kode Klasifikasi', 'Uraian / Jenis Surat', 'Keterangan / Contoh'];

  await writeTemplatePreservingDataToSheet(
    accessToken,
    spreadsheetId,
    sheetName,
    list,
    defaultHeaders,
    (item: KodeKlasifikasiSurat, idx: number, headers: string[]) => {
      const findIndex = (kws: string[]) =>
        headers.findIndex((h) => kws.some((kw) => h.toLowerCase().includes(kw)));

      const cNo = findIndex(['no.', 'nomor urut', 'no']);
      const cKode = findIndex(['kode klasifikasi', 'kode surat', 'kode']);
      const cNama = findIndex(['uraian', 'nama', 'jenis surat', 'perihal', 'tentang']);
      const cKet = findIndex(['keterangan', 'contoh', 'catatan', 'ket']);

      const rowValues = new Array(headers.length).fill('');
      const setVal = (index: number, fallbackIdx: number, val: any) => {
        const target = index >= 0 ? index : (fallbackIdx < headers.length ? fallbackIdx : -1);
        if (target >= 0 && target < headers.length) {
          rowValues[target] = val !== undefined && val !== null ? val : '';
        }
      };

      setVal(cNo, 0, idx + 1);
      setVal(cKode, 1, item.kode);
      setVal(cNama, 2, item.nama);
      setVal(cKet, 3, item.keterangan || '');

      return rowValues;
    }
  );
};

/**
 * Search all accessible Google Spreadsheets in user's Drive with detailed sheet tabs
 */
export const searchAllDriveSpreadsheets = async (
  accessToken: string
): Promise<{ id: string; name: string; folderName?: string; webViewLink?: string; sheetNames: string[] }[]> => {
  const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, parents, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '50',
  });

  const response = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const files = data.files || [];

  const results: { id: string; name: string; folderName?: string; webViewLink?: string; sheetNames: string[] }[] = [];

  for (const file of files) {
    try {
      const meta = await getSpreadsheetMetadata(accessToken, file.id);
      results.push({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        sheetNames: meta.sheetNames || [],
      });
    } catch {
      results.push({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        sheetNames: [],
      });
    }
  }

  return results;
};

/**
 * Parses raw spreadsheet rows into structured GuruPTK array
 * Compatible with Dapodik, BKN, and internal school staffing registers
 */
export const parseGuruPTKFromRows = (rawRows: string[][]): { headers: string[]; ptkList: GuruPTK[] } => {
  if (!rawRows || rawRows.length === 0) {
    return { headers: [], ptkList: [] };
  }

  // 1. Find header row
  const headerKeywords = [
    'nama', 'nip', 'nuptk', 'jabatan', 'golongan', 'pangkat',
    'status', 'tmt', 'mapel', 'pendidikan', 'jurusan', 'jk', 'lahir'
  ];

  let headerRowIndex = 0;
  let maxScore = 0;

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (!row) continue;
    let score = 0;
    row.forEach((cell) => {
      const cellLower = String(cell || '').toLowerCase().trim();
      if (headerKeywords.some((kw) => cellLower.includes(kw))) {
        score++;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim());
  const dataRows = rawRows.slice(headerRowIndex + 1);

  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = (h || '').toLowerCase().trim();
      return keywords.some((kw) => lower.includes(kw));
    });
  };

  const colNama = findColIndex(['nama lengkap', 'nama guru', 'nama ptk', 'nama pegawai', 'nama']);
  const colNip = findColIndex(['nip', 'n.i.p', 'nip/karpeg', 'nomor induk pegawai']);
  const colNuptk = findColIndex(['nuptk', 'n.u.p.t.k']);
  const colJk = findColIndex(['jenis kelamin', 'jk', 'l/p', 'gender', 'kelamin']);
  const colTempatLahir = findColIndex(['tempat lahir', 'tmp lahir', 'tempat']);
  const colTanggalLahir = findColIndex(['tanggal lahir', 'tgl lahir', 'tgl. lahir']);
  const colJabatan = findColIndex(['jabatan', 'tugas pokok', 'tugas', 'jabatan fungsional']);
  const colJenisPTK = findColIndex(['jenis ptk', 'jenis pegawai', 'kategori ptk', 'jenis tenaga']);
  const colStatusKepegawaian = findColIndex(['status kepegawaian', 'status pegawai', 'status ptk', 'status']);
  const colGolongan = findColIndex(['pangkat / golongan', 'pangkat/golongan', 'pangkat/gol', 'golongan', 'gol', 'pangkat', 'ruang']);
  const colMapel = findColIndex(['mata pelajaran', 'mapel utama', 'mapel', 'bidang studi', 'guru kelas']);
  const colTmtPengangkatan = findColIndex(['tmt pengangkatan', 'tmt cpns', 'tmt pns', 'tmt kerja', 'tmt']);
  const colStatusSertifikasi = findColIndex(['status sertifikasi', 'sertifikasi', 'sertifikat pendidik', 'tpg']);
  const colPendidikan = findColIndex(['pendidikan terakhir', 'pendidikan', 'jenjang', 'ijazah', 'pend. terakhir']);
  const colJurusan = findColIndex(['jurusan', 'program studi', 'prodi']);
  const colNoHp = findColIndex(['no hp', 'no telp', 'no. hp', 'nomor hp', 'telepon', 'hp', 'whatsapp', 'wa']);
  const colEmail = findColIndex(['email', 'e-mail', 'surat elektronik']);

  const ptkList: GuruPTK[] = [];

  dataRows.forEach((row, idx) => {
    if (!row || row.length === 0 || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    const rowStr = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');
    // Skip subheaders or signatures
    if (
      rowStr.includes('mengetahui') ||
      rowStr.includes('kepala sekolah') ||
      rowStr.includes('kepala tata usaha') ||
      rowStr.includes('pembina tk. i') ||
      rowStr.includes('jumlah')
    ) {
      const hasRealPerson = row.some((c) => {
        const val = String(c || '').trim();
        return /\d{18}/.test(val) || (val.length > 5 && (val.includes('S.Pd') || val.includes('M.Pd') || val.includes('Drs')));
      });
      if (!hasRealPerson) return;
    }

    const getVal = (colIdx: number, defaultVal = ''): string => {
      if (colIdx >= 0 && colIdx < row.length && row[colIdx] !== undefined && row[colIdx] !== null) {
        return String(row[colIdx]).trim();
      }
      return defaultVal;
    };

    const rawNama = getVal(colNama);
    const rawNip = getVal(colNip);
    const rawNuptk = getVal(colNuptk);

    if (!rawNama && !rawNip && !rawNuptk) {
      return;
    }

    const rawJk = getVal(colJk);
    const rawTempatLahir = getVal(colTempatLahir);
    const rawTanggalLahir = getVal(colTanggalLahir);
    const rawJabatan = getVal(colJabatan);
    const rawJenisPTK = getVal(colJenisPTK);
    const rawStatus = getVal(colStatusKepegawaian);
    const rawGolongan = getVal(colGolongan);
    const rawMapel = getVal(colMapel);
    const rawTmt = getVal(colTmtPengangkatan);
    const rawSertifikasi = getVal(colStatusSertifikasi);
    const rawPendidikan = getVal(colPendidikan);
    const rawJurusan = getVal(colJurusan);
    const rawNoHp = getVal(colNoHp);
    const rawEmail = getVal(colEmail);

    let jkNormalized: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
    const lowerJk = rawJk.toLowerCase();
    if (lowerJk === 'p' || lowerJk.includes('perempuan') || lowerJk.includes('wanita')) {
      jkNormalized = 'Perempuan';
    }

    let statusKepNormalized = rawStatus || 'PNS';
    const lowerStatus = statusKepNormalized.toLowerCase();
    if (lowerStatus.includes('pppk')) statusKepNormalized = 'PPPK';
    else if (lowerStatus.includes('pns')) statusKepNormalized = 'PNS';
    else if (lowerStatus.includes('gtt') || lowerStatus.includes('honorer')) statusKepNormalized = 'Guru Honorer / GTT';
    else if (lowerStatus.includes('ptt')) statusKepNormalized = 'PTT / Tenaga Honorer';

    const item: GuruPTK = {
      id: `ptk-gdrive-${Date.now()}-${ptkList.length + 1}`,
      namaLengkap: rawNama || 'Pendidik / Tenaga Kependidikan',
      nip: rawNip || '-',
      nuptk: rawNuptk || '-',
      jenisKelamin: jkNormalized,
      tempatLahir: rawTempatLahir || 'Puriala',
      tanggalLahir: formatSheetDate(rawTanggalLahir) || '1985-01-01',
      jabatan: rawJabatan || (rawNama.toLowerCase().includes('kepala sekolah') ? 'Kepala Sekolah' : 'Guru Mata Pelajaran'),
      jenisPTK: rawJenisPTK || (rawJabatan.toLowerCase().includes('tata usaha') || rawJabatan.toLowerCase().includes('administrasi') ? 'Tenaga Administrasi Sekolah' : 'Guru Mapel'),
      statusKepegawaian: statusKepNormalized,
      golongan: rawGolongan || '-',
      pangkatGolongan: rawGolongan || '-',
      mapelUtama: rawMapel || '-',
      tmtPengangkatan: formatSheetDate(rawTmt) || '2015-01-01',
      tmtKerja: formatSheetDate(rawTmt) || '2015-01-01',
      statusSertifikasi: rawSertifikasi.toLowerCase().includes('sudah') || rawSertifikasi.toLowerCase().includes('ya') || rawSertifikasi.toLowerCase().includes('lulus') ? 'Sudah Sertifikasi' : 'Belum Sertifikasi',
      pendidikanTerakhir: rawPendidikan || 'S1 Pendidikan',
      jurusan: rawJurusan || 'Pendidikan',
      noHp: rawNoHp || '-',
      email: rawEmail || '',
      berkasDigital: [
        { id: `b1-${idx}`, namaFile: 'SK_Pangkat_Berkala.pdf', jenisBerkas: 'SK Kepegawaian', ukuran: '1.2 MB', tanggalUnggah: '2026-01-15' },
      ],
    };

    ptkList.push(item);
  });

  return { headers, ptkList };
};

/**
 * Parses raw spreadsheet rows into structured Siswa array
 * Compatible with Buku Induk Siswa & Dapodik Kesiswaan
 */
export const parseSiswaFromRows = (rawRows: string[][]): { headers: string[]; siswaList: Siswa[] } => {
  if (!rawRows || rawRows.length === 0) {
    return { headers: [], siswaList: [] };
  }

  // 1. Find header row
  const headerKeywords = [
    'nis', 'nisn', 'nama', 'kelas', 'jk', 'tempat',
    'lahir', 'agama', 'ayah', 'ibu', 'alamat', 'status'
  ];

  let headerRowIndex = 0;
  let maxScore = 0;

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (!row) continue;
    let score = 0;
    row.forEach((cell) => {
      const cellLower = String(cell || '').toLowerCase().trim();
      if (headerKeywords.some((kw) => cellLower.includes(kw))) {
        score++;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim());
  const dataRows = rawRows.slice(headerRowIndex + 1);

  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = (h || '').toLowerCase().trim();
      return keywords.some((kw) => lower.includes(kw));
    });
  };

  const colNis = findColIndex(['nis', 'n.i.s', 'no induk', 'nomor induk']);
  const colNisn = findColIndex(['nisn', 'n.i.s.n', 'nomor induk siswa nasional']);
  const colNama = findColIndex(['nama lengkap', 'nama siswa', 'nama peserta didik', 'nama murid', 'nama']);
  const colJk = findColIndex(['jenis kelamin', 'jk', 'l/p', 'gender']);
  const colTempatLahir = findColIndex(['tempat lahir', 'tmp lahir', 'tempat']);
  const colTanggalLahir = findColIndex(['tanggal lahir', 'tgl lahir', 'tgl. lahir']);
  const colKelas = findColIndex(['kelas', 'rombel', 'tingkat']);
  const colAgama = findColIndex(['agama']);
  const colNamaAyah = findColIndex(['nama ayah', 'ayah', 'nama bapak', 'bapak']);
  const colPekerjaanAyah = findColIndex(['pekerjaan ayah', 'pekerjaan bapak']);
  const colNamaIbu = findColIndex(['nama ibu', 'ibu']);
  const colPekerjaanIbu = findColIndex(['pekerjaan ibu']);
  const colAlamat = findColIndex(['alamat', 'desa', 'alamat tempat tinggal', 'domisili']);
  const colNoTelp = findColIndex(['no telp', 'no hp', 'telepon ortu', 'kontak ortu', 'no wa', 'hp']);
  const colStatusSiswa = findColIndex(['status siswa', 'status', 'keterangan']);
  const colTahunMasuk = findColIndex(['tahun masuk', 'thn masuk', 'angkatan']);

  const siswaList: Siswa[] = [];

  dataRows.forEach((row, idx) => {
    if (!row || row.length === 0 || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    const getVal = (colIdx: number, defaultVal = ''): string => {
      if (colIdx >= 0 && colIdx < row.length && row[colIdx] !== undefined && row[colIdx] !== null) {
        return String(row[colIdx]).trim();
      }
      return defaultVal;
    };

    const rawNama = getVal(colNama);
    const rawNis = getVal(colNis);
    const rawNisn = getVal(colNisn);

    if (!rawNama && !rawNis && !rawNisn) {
      return;
    }

    const rawJk = getVal(colJk);
    const rawTempatLahir = getVal(colTempatLahir);
    const rawTanggalLahir = getVal(colTanggalLahir);
    const rawKelas = getVal(colKelas);
    const rawAgama = getVal(colAgama);
    const rawAyah = getVal(colNamaAyah);
    const rawPekAyah = getVal(colPekerjaanAyah);
    const rawIbu = getVal(colNamaIbu);
    const rawPekIbu = getVal(colPekerjaanIbu);
    const rawAlamat = getVal(colAlamat);
    const rawTelp = getVal(colNoTelp);
    const rawStatus = getVal(colStatusSiswa);
    const rawTahun = getVal(colTahunMasuk);

    let jkNormalized: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
    const lowerJk = rawJk.toLowerCase();
    if (lowerJk === 'p' || lowerJk.includes('perempuan') || lowerJk.includes('wanita')) {
      jkNormalized = 'Perempuan';
    }

    let statusNormalized: 'Aktif' | 'Mutasi Keluar' | 'Lulus' | 'Non-Aktif' = 'Aktif';
    const lowerStatus = rawStatus.toLowerCase();
    if (lowerStatus.includes('mutasi') || lowerStatus.includes('pindah')) statusNormalized = 'Mutasi Keluar';
    else if (lowerStatus.includes('lulus')) statusNormalized = 'Lulus';
    else if (lowerStatus.includes('non') || lowerStatus.includes('keluar') || lowerStatus.includes('do')) statusNormalized = 'Non-Aktif';

    let kelasNormalized = 'VII.A';
    const cleanK = (rawKelas || '').toUpperCase().replace(/\s+/g, '');
    if (cleanK.includes('VII.B') || cleanK === '7B' || cleanK === 'VIIB' || cleanK === '7.B') {
      kelasNormalized = 'VII.B';
    } else if (cleanK.includes('VII.A') || cleanK === '7A' || cleanK === 'VIIA' || cleanK === '7.A') {
      kelasNormalized = 'VII.A';
    } else if (cleanK.includes('VIII') || cleanK.startsWith('8')) {
      kelasNormalized = 'VIII';
    } else if (cleanK.includes('IX') || cleanK.startsWith('9')) {
      kelasNormalized = 'IX';
    } else if (cleanK.includes('7') || cleanK.includes('VII')) {
      kelasNormalized = 'VII.A';
    } else if (rawKelas && rawKelas.trim() !== '') {
      kelasNormalized = rawKelas.trim();
    }

    let agamaNormalized: Siswa['agama'] = 'Islam';
    const lowerAgama = rawAgama.toLowerCase();
    if (lowerAgama.includes('kristen') || lowerAgama.includes('protestan')) agamaNormalized = 'Kristen Protestan';
    else if (lowerAgama.includes('katolik')) agamaNormalized = 'Katolik';
    else if (lowerAgama.includes('hindu')) agamaNormalized = 'Hindu';
    else if (lowerAgama.includes('buddha')) agamaNormalized = 'Buddha';
    else if (lowerAgama.includes('konghucu')) agamaNormalized = 'Konghucu';

    const item: Siswa = {
      id: `siswa-gdrive-${Date.now()}-${siswaList.length + 1}`,
      nis: rawNis || `252607${String(siswaList.length + 1).padStart(3, '0')}`,
      nisn: rawNisn || `01${String(Date.now()).slice(-8)}`,
      namaLengkap: rawNama || 'Siswa SMPN 2 Puriala',
      jenisKelamin: jkNormalized,
      tempatLahir: rawTempatLahir || 'Puriala',
      tanggalLahir: formatSheetDate(rawTanggalLahir) || '2012-05-15',
      kelas: kelasNormalized as any,
      agama: agamaNormalized,
      namaAyah: rawAyah || 'Orang Tua Siswa',
      pekerjaanAyah: rawPekAyah || 'Petani / Wiraswasta',
      namaIbu: rawIbu || 'Ibu Rumah Tangga',
      pekerjaanIbu: rawPekIbu || 'Ibu Rumah Tangga',
      alamat: rawAlamat || 'Kec. Puriala, Kab. Konawe',
      noTelpOrtu: rawTelp || '-',
      statusSiswa: statusNormalized,
      tahunMasuk: rawTahun || '2025',
    };

    siswaList.push(item);
  });

  return { headers, siswaList };
};

/**
 * Parses raw spreadsheet rows into structured Alumni array
 */
export const parseAlumniFromRows = (rawRows: string[][]): { headers: string[]; alumniList: Alumni[] } => {
  if (!rawRows || rawRows.length === 0) {
    return { headers: [], alumniList: [] };
  }

  const headerKeywords = ['nisn', 'nis', 'nama', 'lulus', 'ijazah', 'skl', 'status', 'penerima'];

  let headerRowIndex = 0;
  let maxScore = 0;

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (!row) continue;
    let score = 0;
    row.forEach((cell) => {
      const cellLower = String(cell || '').toLowerCase().trim();
      if (headerKeywords.some((kw) => cellLower.includes(kw))) {
        score++;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim());
  const dataRows = rawRows.slice(headerRowIndex + 1);

  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = (h || '').toLowerCase().trim();
      return keywords.some((kw) => lower.includes(kw));
    });
  };

  const colNisn = findColIndex(['nisn', 'n.i.s.n']);
  const colNis = findColIndex(['nis', 'n.i.s', 'no induk']);
  const colNama = findColIndex(['nama lengkap', 'nama alumni', 'nama siswa', 'nama']);
  const colTahunLulus = findColIndex(['tahun lulus', 'thn lulus', 'tahun kelulusan', 'angkatan']);
  const colNoIjazah = findColIndex(['no ijazah', 'nomor seri ijazah', 'no. ijazah', 'no seri ijazah', 'ijazah']);
  const colNoSkl = findColIndex(['no skl', 'nomor skl', 'surat keterangan lulus']);
  const colStatus = findColIndex(['status ijazah', 'status', 'keterangan ijazah']);
  const colTglAmbil = findColIndex(['tgl ambil', 'tanggal pengambilan', 'tgl pengambilan']);
  const colPenerima = findColIndex(['nama penerima', 'penerima', 'diambil oleh']);
  const colLanjut = findColIndex(['melanjutkan ke', 'sekolah lanjutan', 'sma/smk']);
  const colKet = findColIndex(['keterangan', 'ket']);

  const alumniList: Alumni[] = [];

  dataRows.forEach((row, idx) => {
    if (!row || row.length === 0 || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    const getVal = (colIdx: number, defaultVal = ''): string => {
      if (colIdx >= 0 && colIdx < row.length && row[colIdx] !== undefined && row[colIdx] !== null) {
        return String(row[colIdx]).trim();
      }
      return defaultVal;
    };

    const rawNama = getVal(colNama);
    const rawNisn = getVal(colNisn);
    const rawNis = getVal(colNis);

    if (!rawNama && !rawNisn && !rawNis) {
      return;
    }

    const item: Alumni = {
      id: `alumni-gdrive-${Date.now()}-${alumniList.length + 1}`,
      nisn: rawNisn || `00${String(Date.now()).slice(-8)}`,
      nis: rawNis || `242507${String(alumniList.length + 1).padStart(3, '0')}`,
      namaLengkap: rawNama || 'Alumni SMPN 2 Puriala',
      tahunLulus: getVal(colTahunLulus, '2024/2025'),
      nomorSeriIjazah: getVal(colNoIjazah, '-'),
      noSeriIjazah: getVal(colNoIjazah, '-'),
      nomorSKL: getVal(colNoSkl, '-'),
      noSKL: getVal(colNoSkl, '-'),
      statusIjazah: getVal(colStatus, 'Sudah Diambil'),
      tanggalPengambilan: formatSheetDate(getVal(colTglAmbil)),
      namaPenerima: getVal(colPenerima, rawNama),
      melanjutkanKe: getVal(colLanjut, 'SMAN 1 Puriala'),
      keterangan: getVal(colKet, 'Lulus Lengkap'),
    };

    alumniList.push(item);
  });

  return { headers, alumniList };
};

/**
 * Writes Guru & PTK data to Google Sheet with template preservation
 */
export const writeGuruPTKToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  list: GuruPTK[],
  sheetName: string = 'DATA PTK'
): Promise<void> => {
  const defaultHeaders = [
    'No',
    'Nama Lengkap',
    'NIP',
    'NUPTK',
    'JK',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Jabatan',
    'Jenis PTK',
    'Status Kepegawaian',
    'Golongan / Pangkat',
    'Mapel Utama',
    'TMT Pengangkatan',
    'Sertifikasi',
    'Pendidikan Terakhir',
    'Jurusan',
    'No HP',
    'Email',
  ];

  await writeTemplatePreservingDataToSheet(
    accessToken,
    spreadsheetId,
    sheetName,
    list,
    defaultHeaders,
    (item: GuruPTK, idx: number, headers: string[]) => {
      const findIndex = (kws: string[]) =>
        headers.findIndex((h) => kws.some((kw) => h.toLowerCase().includes(kw)));

      const cNo = findIndex(['no', 'no.', 'nomor urut']);
      const cNama = findIndex(['nama lengkap', 'nama guru', 'nama ptk', 'nama pegawai', 'nama']);
      const cNip = findIndex(['nip', 'n.i.p', 'nip/karpeg']);
      const cNuptk = findIndex(['nuptk', 'n.u.p.t.k']);
      const cJk = findIndex(['jenis kelamin', 'jk', 'l/p', 'gender', 'kelamin']);
      const cTempat = findIndex(['tempat lahir', 'tmp lahir', 'tempat']);
      const cTanggal = findIndex(['tanggal lahir', 'tgl lahir', 'tgl. lahir']);
      const cJabatan = findIndex(['jabatan', 'tugas pokok', 'tugas', 'jabatan fungsional']);
      const cJenisPTK = findIndex(['jenis ptk', 'jenis pegawai', 'kategori ptk', 'jenis tenaga']);
      const cStatus = findIndex(['status kepegawaian', 'status pegawai', 'status ptk', 'status']);
      const cGolongan = findIndex(['pangkat / golongan', 'pangkat/golongan', 'pangkat/gol', 'golongan', 'gol', 'pangkat', 'ruang']);
      const cMapel = findIndex(['mata pelajaran', 'mapel utama', 'mapel', 'bidang studi', 'guru kelas']);
      const cTmt = findIndex(['tmt pengangkatan', 'tmt cpns', 'tmt pns', 'tmt kerja', 'tmt']);
      const cSertifikasi = findIndex(['status sertifikasi', 'sertifikasi', 'sertifikat pendidik', 'tpg']);
      const cPendidikan = findIndex(['pendidikan terakhir', 'pendidikan', 'jenjang', 'ijazah', 'pend. terakhir']);
      const cJurusan = findIndex(['jurusan', 'program studi', 'prodi']);
      const cNoHp = findIndex(['no hp', 'no telp', 'no. hp', 'nomor hp', 'telepon', 'hp', 'whatsapp', 'wa']);
      const cEmail = findIndex(['email', 'e-mail', 'surat elektronik']);

      const rowValues = new Array(headers.length).fill('');
      const setVal = (index: number, fallbackIdx: number, val: any) => {
        const target = index >= 0 ? index : (fallbackIdx < headers.length ? fallbackIdx : -1);
        if (target >= 0 && target < headers.length) {
          rowValues[target] = val !== undefined && val !== null ? val : '';
        }
      };

      setVal(cNo, 0, idx + 1);
      setVal(cNama, 1, item.namaLengkap);
      setVal(cNip, 2, item.nip || '-');
      setVal(cNuptk, 3, item.nuptk || '-');
      setVal(cJk, 4, item.jenisKelamin || 'Laki-laki');
      setVal(cTempat, 5, item.tempatLahir || '-');
      setVal(cTanggal, 6, item.tanggalLahir || '-');
      setVal(cJabatan, 7, item.jabatan || '-');
      setVal(cJenisPTK, 8, item.jenisPTK || '-');
      setVal(cStatus, 9, item.statusKepegawaian || 'PNS');
      setVal(cGolongan, 10, item.golongan || item.pangkatGolongan || '-');
      setVal(cMapel, 11, item.mapelUtama || '-');
      setVal(cTmt, 12, item.tmtPengangkatan || '-');
      setVal(cSertifikasi, 13, item.statusSertifikasi || 'Belum Sertifikasi');
      setVal(cPendidikan, 14, item.pendidikanTerakhir || 'S1');
      setVal(cJurusan, 15, item.jurusan || '-');
      setVal(cNoHp, 16, item.noHp || '-');
      setVal(cEmail, 17, item.email || '');

      return rowValues;
    }
  );
};

/**
 * Writes Siswa Buku Induk data to Google Sheet with template preservation
 */
export const writeSiswaToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  list: Siswa[],
  sheetName: string = 'BUKU INDUK SISWA'
): Promise<void> => {
  const defaultHeaders = [
    'No',
    'NIS',
    'NISN',
    'Nama Lengkap',
    'JK',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Kelas',
    'Agama',
    'Nama Ayah',
    'Pekerjaan Ayah',
    'Nama Ibu',
    'Alamat',
    'No Telp',
  ];

  await writeTemplatePreservingDataToSheet(
    accessToken,
    spreadsheetId,
    sheetName,
    list,
    defaultHeaders,
    (item: Siswa, idx: number, headers: string[]) => {
      const findIndex = (kws: string[]) =>
        headers.findIndex((h) => kws.some((kw) => h.toLowerCase().includes(kw)));

      const cNo = findIndex(['no', 'no.', 'nomor urut']);
      const cNis = findIndex(['nis', 'no induk', 'n.i.s']);
      const cNisn = findIndex(['nisn', 'n.i.s.n']);
      const cNama = findIndex(['nama lengkap', 'nama siswa', 'nama']);
      const cJk = findIndex(['jk', 'jenis kelamin', 'l/p', 'gender', 'kelamin']);
      const cTempat = findIndex(['tempat lahir', 'tmp lahir', 'tempat']);
      const cTanggal = findIndex(['tanggal lahir', 'tgl lahir', 'tgl. lahir']);
      const cKelas = findIndex(['kelas', 'rombel', 'tingkat']);
      const cAgama = findIndex(['agama']);
      const cAyah = findIndex(['nama ayah', 'ayah']);
      const cPekAyah = findIndex(['pekerjaan ayah', 'pek ayah']);
      const cIbu = findIndex(['nama ibu', 'ibu']);
      const cAlamat = findIndex(['alamat', 'tempat tinggal', 'domisili']);
      const cTelp = findIndex(['no telp ortu', 'no hp', 'no telp', 'telepon', 'hp']);

      const rowValues = new Array(headers.length).fill('');
      const setVal = (index: number, fallbackIdx: number, val: any) => {
        const target = index >= 0 ? index : (fallbackIdx < headers.length ? fallbackIdx : -1);
        if (target >= 0 && target < headers.length) {
          rowValues[target] = val !== undefined && val !== null ? val : '';
        }
      };

      setVal(cNo, 0, idx + 1);
      setVal(cNis, 1, item.nis);
      setVal(cNisn, 2, item.nisn);
      setVal(cNama, 3, item.namaLengkap);
      setVal(cJk, 4, item.jenisKelamin);
      setVal(cTempat, 5, item.tempatLahir);
      setVal(cTanggal, 6, item.tanggalLahir);
      setVal(cKelas, 7, item.kelas);
      setVal(cAgama, 8, item.agama);
      setVal(cAyah, 9, item.namaAyah);
      setVal(cPekAyah, 10, item.pekerjaanAyah);
      setVal(cIbu, 11, item.namaIbu);
      setVal(cAlamat, 12, item.alamat);
      setVal(cTelp, 13, item.noTelpOrtu || '-');

      return rowValues;
    }
  );
};

/**
 * Writes Alumni & Ijazah data to Google Sheet with template preservation
 */
export const writeAlumniToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  list: Alumni[],
  sheetName: string = 'DATA ALUMNI'
): Promise<void> => {
  const defaultHeaders = [
    'No',
    'NISN',
    'NIS',
    'Nama Lengkap Alumni',
    'Tahun Lulus',
    'Nomor Seri Ijazah',
    'Nomor SKL',
    'Status Ijazah',
    'Tanggal Pengambilan',
    'Nama Penerima',
    'Melanjutkan Ke',
    'Keterangan',
  ];

  await writeTemplatePreservingDataToSheet(
    accessToken,
    spreadsheetId,
    sheetName,
    list,
    defaultHeaders,
    (item: Alumni, idx: number, headers: string[]) => {
      const findIndex = (kws: string[]) =>
        headers.findIndex((h) => kws.some((kw) => h.toLowerCase().includes(kw)));

      const cNo = findIndex(['no', 'no.', 'nomor urut']);
      const cNisn = findIndex(['nisn', 'n.i.s.n']);
      const cNis = findIndex(['nis', 'n.i.s', 'no induk']);
      const cNama = findIndex(['nama lengkap', 'nama alumni', 'nama siswa', 'nama']);
      const cTahun = findIndex(['tahun lulus', 'thn lulus', 'tahun kelulusan', 'angkatan']);
      const cIjazah = findIndex(['no ijazah', 'nomor seri ijazah', 'no. ijazah', 'no seri ijazah', 'ijazah']);
      const cSkl = findIndex(['no skl', 'nomor skl', 'surat keterangan lulus']);
      const cStatus = findIndex(['status ijazah', 'status', 'keterangan ijazah']);
      const cTglAmbil = findIndex(['tgl ambil', 'tanggal pengambilan', 'tgl pengambilan']);
      const cPenerima = findIndex(['nama penerima', 'penerima', 'diambil oleh']);
      const cLanjut = findIndex(['melanjutkan ke', 'sekolah lanjutan', 'sma/smk']);
      const cKet = findIndex(['keterangan', 'ket']);

      const rowValues = new Array(headers.length).fill('');
      const setVal = (index: number, fallbackIdx: number, val: any) => {
        const target = index >= 0 ? index : (fallbackIdx < headers.length ? fallbackIdx : -1);
        if (target >= 0 && target < headers.length) {
          rowValues[target] = val !== undefined && val !== null ? val : '';
        }
      };

      setVal(cNo, 0, idx + 1);
      setVal(cNisn, 1, item.nisn);
      setVal(cNis, 2, item.nis);
      setVal(cNama, 3, item.namaLengkap);
      setVal(cTahun, 4, item.tahunLulus);
      setVal(cIjazah, 5, item.nomorSeriIjazah || item.noSeriIjazah || '-');
      setVal(cSkl, 6, item.nomorSKL || item.noSKL || '-');
      setVal(cStatus, 7, item.statusIjazah || 'Sudah Diambil');
      setVal(cTglAmbil, 8, item.tanggalPengambilan || '');
      setVal(cPenerima, 9, item.namaPenerima || item.namaLengkap);
      setVal(cLanjut, 10, item.melanjutkanKe || '-');
      setVal(cKet, 11, item.keterangan || '');

      return rowValues;
    }
  );
};

/**
 * Finds or Creates the Google Drive folder "02_SURAT_KELUAR" inside "TATA USAHA"
 * and finds or creates the spreadsheet "BUKU_AGENDA_SURAT_KELUAR" with sheets "2026" & "KODE NOMOR SURAT".
 */
export const findOrCreateSuratKeluarAgendaSheet = async (
  accessToken: string,
  initialSuratList: SuratKeluar[] = []
): Promise<{ spreadsheetId: string; webViewLink: string; folderId: string }> => {
  // 1. Find or create folder 'TATA USAHA'
  const tataUsahaQuery = "(name = 'TATA USAHA' or name = 'Tata Usaha') and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  let tataUsahaId = '';
  
  const tuRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: tataUsahaQuery, fields: 'files(id)' }).toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (tuRes.ok) {
    const tuData = await tuRes.json();
    if (tuData.files && tuData.files.length > 0) {
      tataUsahaId = tuData.files[0].id;
    }
  }
  
  if (!tataUsahaId) {
    const createTU = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'TATA USAHA',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (createTU.ok) {
      const tuData = await createTU.json();
      tataUsahaId = tuData.id;
    }
  }
  
  if (!tataUsahaId) {
    throw new Error('Gagal menemukan atau membuat folder TATA USAHA di Google Drive.');
  }

  // 2. Find or create subfolder '02_SURAT_KELUAR' inside TATA USAHA
  const skFolderQuery = `name = '02_SURAT_KELUAR' and '${tataUsahaId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  let skFolderId = '';
  
  const skFolderRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: skFolderQuery, fields: 'files(id)' }).toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (skFolderRes.ok) {
    const skFolderData = await skFolderRes.json();
    if (skFolderData.files && skFolderData.files.length > 0) {
      skFolderId = skFolderData.files[0].id;
    }
  }
  
  if (!skFolderId) {
    const createSKFolder = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '02_SURAT_KELUAR',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [tataUsahaId],
      }),
    });
    if (createSKFolder.ok) {
      const skFolderData = await createSKFolder.json();
      skFolderId = skFolderData.id;
    }
  }
  
  if (!skFolderId) {
    throw new Error('Gagal menemukan atau membuat subfolder TATA USAHA/02_SURAT_KELUAR di Google Drive.');
  }

  // 3. Find if spreadsheet "BUKU_AGENDA_SURAT_KELUAR" exists in '02_SURAT_KELUAR'
  const sheetQuery = `mimeType = 'application/vnd.google-apps.spreadsheet' and name = 'BUKU_AGENDA_SURAT_KELUAR' and '${skFolderId}' in parents and trashed = false`;
  let spreadsheetId = '';
  let webViewLink = '';

  const sheetRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: sheetQuery, fields: 'files(id, webViewLink)' }).toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (sheetRes.ok) {
    const sheetData = await sheetRes.json();
    if (sheetData.files && sheetData.files.length > 0) {
      spreadsheetId = sheetData.files[0].id;
      webViewLink = sheetData.files[0].webViewLink;
    }
  }

  // 4. If not exists, create new Spreadsheet with name "BUKU_AGENDA_SURAT_KELUAR"
  if (!spreadsheetId) {
    const createSheet = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'BUKU_AGENDA_SURAT_KELUAR',
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
              title: 'KODE NOMOR SURAT',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (createSheet.ok) {
      const createdData = await createSheet.json();
      spreadsheetId = createdData.spreadsheetId;
      webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // Move spreadsheet to folder '02_SURAT_KELUAR'
      await fetch(`${DRIVE_API_URL}/files/${spreadsheetId}?addParents=${skFolderId}&fields=id,parents`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Write initial/default classification codes to sheet 'KODE NOMOR SURAT'
      try {
        await writeKodeKlasifikasiToSheet(accessToken, spreadsheetId, DEFAULT_KODE_KLASIFIKASI, 'KODE NOMOR SURAT');
      } catch (codesErr) {
        console.warn('Non-fatal: could not write initial classification codes:', codesErr);
      }

      // Write initial SuratKeluar list if provided
      if (initialSuratList && initialSuratList.length > 0) {
        try {
          await writeSuratKeluarToSheet(accessToken, spreadsheetId, initialSuratList, '2026');
        } catch (writeErr) {
          console.warn('Non-fatal: could not populate initial surat list:', writeErr);
        }
      }
    } else {
      const errDetail = await createSheet.json().catch(() => ({}));
      throw new Error(errDetail?.error?.message || 'Gagal membuat file spreadsheet BUKU_AGENDA_SURAT_KELUAR');
    }
  }

  return { spreadsheetId, webViewLink, folderId: skFolderId };
};

/**
 * Finds or Creates the Google Drive folder "04_KEPEGAWAIAN_PTK" inside "TATA USAHA"
 * and finds or creates the spreadsheet "DATA_GURU_PTK".
 */
export const findOrCreateGuruPTKAgendaSheet = async (
  accessToken: string,
  initialGuruList: GuruPTK[] = []
): Promise<{ spreadsheetId: string; webViewLink: string; folderId: string }> => {
  // 1. Find or create folder 'TATA USAHA'
  const tataUsahaQuery = "(name = 'TATA USAHA' or name = 'Tata Usaha') and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  let tataUsahaId = '';
  
  const tuRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: tataUsahaQuery, fields: 'files(id)' }).toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (tuRes.ok) {
    const tuData = await tuRes.json();
    if (tuData.files && tuData.files.length > 0) {
      tataUsahaId = tuData.files[0].id;
    }
  }
  
  if (!tataUsahaId) {
    const createTU = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'TATA USAHA',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (createTU.ok) {
      const tuData = await createTU.json();
      tataUsahaId = tuData.id;
    }
  }
  
  if (!tataUsahaId) {
    throw new Error('Gagal menemukan atau membuat folder TATA USAHA di Google Drive.');
  }

  // 2. Find or create subfolder '04_KEPEGAWAIAN_PTK' inside TATA USAHA
  const ptkFolderQuery = `name = '04_KEPEGAWAIAN_PTK' and '${tataUsahaId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  let ptkFolderId = '';
  
  const ptkFolderRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: ptkFolderQuery, fields: 'files(id)' }).toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (ptkFolderRes.ok) {
    const ptkFolderData = await ptkFolderRes.json();
    if (ptkFolderData.files && ptkFolderData.files.length > 0) {
      ptkFolderId = ptkFolderData.files[0].id;
    }
  }
  
  if (!ptkFolderId) {
    const createPTKFolder = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '04_KEPEGAWAIAN_PTK',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [tataUsahaId],
      }),
    });
    if (createPTKFolder.ok) {
      const ptkFolderData = await createPTKFolder.json();
      ptkFolderId = ptkFolderData.id;
    }
  }
  
  if (!ptkFolderId) {
    throw new Error('Gagal menemukan atau membuat subfolder TATA USAHA/04_KEPEGAWAIAN_PTK di Google Drive.');
  }

  // 3. Find if spreadsheet "DATA_GURU_PTK" exists in '04_KEPEGAWAIAN_PTK'
  const sheetQuery = `mimeType = 'application/vnd.google-apps.spreadsheet' and name = 'DATA_GURU_PTK' and '${ptkFolderId}' in parents and trashed = false`;
  let spreadsheetId = '';
  let webViewLink = '';

  const sheetRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: sheetQuery, fields: 'files(id, webViewLink)' }).toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (sheetRes.ok) {
    const sheetData = await sheetRes.json();
    if (sheetData.files && sheetData.files.length > 0) {
      spreadsheetId = sheetData.files[0].id;
      webViewLink = sheetData.files[0].webViewLink;
    }
  }

  // 4. If not exists, create new Spreadsheet
  if (!spreadsheetId) {
    const createSheet = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'DATA_GURU_PTK',
        },
        sheets: [
          {
            properties: {
              title: 'DATA PTK',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (createSheet.ok) {
      const createdData = await createSheet.json();
      spreadsheetId = createdData.spreadsheetId;
      webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // Move spreadsheet to folder '04_KEPEGAWAIAN_PTK'
      await fetch(`${DRIVE_API_URL}/files/${spreadsheetId}?addParents=${ptkFolderId}&fields=id,parents`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Write initial list if provided
      if (initialGuruList && initialGuruList.length > 0) {
        try {
          await writeGuruPTKToSheet(accessToken, spreadsheetId, initialGuruList, 'DATA PTK');
        } catch (writeErr) {
          console.warn('Non-fatal: could not populate initial Guru PTK list:', writeErr);
        }
      }
    } else {
      const errDetail = await createSheet.json().catch(() => ({}));
      throw new Error(errDetail?.error?.message || 'Gagal membuat file spreadsheet DATA_GURU_PTK');
    }
  }

  return { spreadsheetId, webViewLink, folderId: ptkFolderId };
};




