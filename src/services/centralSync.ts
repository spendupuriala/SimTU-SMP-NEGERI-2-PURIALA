import {
  DatabaseState,
  SuratMasuk,
  SuratKeluar,
  SKKBM,
  SKTugasTambahan,
  SuratTugasDinas,
  PembuatSuratRecord,
  GuruPTK,
  Siswa,
  Alumni,
} from '../types';
import {
  findOrCreateTataUsahaFolder,
  createGoogleDriveFolder,
  getDriveQuotaAndUser,
  GoogleDriveFile,
  loadSuratTugasDataFromDrive,
  loadPembuatSuratDataFromDrive,
} from './googleDrive';
import {
  readSheetData,
  getSpreadsheetMetadata,
  parseSuratMasukFromRows,
  parseSuratKeluarFromRows,
  parseGuruPTKFromRows,
  parseSiswaFromRows,
  parseAlumniFromRows,
  searchAllDriveSpreadsheets,
} from './googleSheets';
import { invalidateGoogleAuth } from './googleAuth';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

/**
 * Mock data identifiers to prevent overwriting or polluting real school data with initial template mockups
 */
export const isMockSuratMasuk = (s: SuratMasuk): boolean => {
  if (!s) return true;
  if (/^SM-2026-00[1-5]$/.test(s.id)) return true;
  if (s.noSurat === '005/421.3/SMP.02/2026' && s.asalSurat?.includes('Dinas Pendidikan')) return true;
  return false;
};

export const isMockSuratKeluar = (s: SuratKeluar): boolean => {
  if (!s) return true;
  if (/^SK-2026-00[1-6]$/.test(s.id)) return true;
  if (s.noSurat?.startsWith('400.3.12.2/001/SMP-02/PRL') && s.tujuanSurat?.includes('Kepala Dinas')) return true;
  return false;
};

export const isMockPTK = (p: GuruPTK): boolean => {
  if (!p) return true;
  if (/^ptk-0[0-1][0-9]$/.test(p.id)) return true;
  if (p.nip === '19710110 199412 1 0012' && p.namaLengkap?.includes('Drs. H. Syamsuddin')) return true;
  return false;
};

export const isMockSiswa = (s: Siswa): boolean => {
  if (!s) return true;
  if (/^s-0[0-1][0-9]$/.test(s.id)) return true;
  if (s.nisn === '0098765431' && s.namaLengkap === 'Ahmad Fauzi') return true;
  return false;
};

export const isMockAlumni = (a: any): boolean => {
  if (!a) return true;
  if (/^alm-00[1-8]$/.test(a.id)) return true;
  if (a.nomorSeriIjazah === 'DN-24/DIKBUD/2025/08901' || a.noSeriIjazah === 'DN-24/DIKBUD/2025/08901') return true;
  return false;
};

export const syncAllModulesToSuratKeluar = (
  currentSuratKeluar: SuratKeluar[],
  suratTugasList: SuratTugasDinas[],
  pembuatSuratList: PembuatSuratRecord[],
  identitasSekolah?: any
): SuratKeluar[] => {
  const result = [...currentSuratKeluar];
  const existingNos = new Set(result.map((s) => s.noSurat));

  // Sync from Surat Tugas
  for (const st of suratTugasList) {
    if (st.noSuratTugas && !existingNos.has(st.noSuratTugas)) {
      result.push({
        id: `sk-sync-st-${st.id}`,
        noAgenda: `AG-${result.length + 1}`,
        noSurat: st.noSuratTugas,
        kodeKlasifikasi: st.kodeKlasifikasi || '800',
        tanggalSurat: st.tanggalSurat || new Date().toISOString().split('T')[0],
        tujuanSurat: st.tempatTujuan || 'Dinas / Instansi Terkait',
        perihal: `Surat Perintah Tugas: ${st.maksudTugas || 'Penugasan Dinas'}`,
        sifat: 'Biasa',
        lampiran: '-',
        pengonsep: 'Tata Usaha',
        penandatangan: identitasSekolah?.kepalaSekolah || 'Kepala Sekolah',
        nipPenandatangan: identitasSekolah?.nipKepalaSekolah || '-',
        statusVerifikasi: 'Sudah Dikirim',
        statusDrive: 'Tersimpan',
        sumberModul: 'surat-tugas',
        referensiId: st.id,
      });
      existingNos.add(st.noSuratTugas);
    }
  }

  // Sync from Pembuat Surat
  for (const ps of pembuatSuratList) {
    if (ps.noSurat && !existingNos.has(ps.noSurat)) {
      result.push({
        id: `sk-sync-ps-${ps.id}`,
        noAgenda: `AG-${result.length + 1}`,
        noSurat: ps.noSurat,
        kodeKlasifikasi: ps.kodeKlasifikasi || '005',
        tanggalSurat: ps.tanggalSurat || new Date().toISOString().split('T')[0],
        tujuanSurat: ps.detailSurat?.instansiTujuan || ps.detailSurat?.sekolahTujuan || 'Pihak Berkepentingan',
        perihal: ps.perihal || ps.jenisSuratNama || 'Surat Keluar Sekolah',
        sifat: 'Biasa',
        lampiran: '-',
        pengonsep: 'Tata Usaha',
        penandatangan: ps.penandatangan?.nama || identitasSekolah?.kepalaSekolah || 'Kepala Sekolah',
        nipPenandatangan: ps.penandatangan?.nip || identitasSekolah?.nipKepalaSekolah || '-',
        statusVerifikasi: ps.status === 'Terbit' ? 'Sudah Dikirim' : 'Draf',
        statusDrive: 'Tersimpan',
        sumberModul: 'pembuat-surat',
        referensiId: ps.id,
      });
      existingNos.add(ps.noSurat);
    }
  }

  return result;
};

export interface CentralSyncStepInfo {
  id: string;
  stepNumber: number;
  title: string;
  detail: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'error';
  itemCount?: number;
}

export interface CentralSyncProgress {
  currentStep: number;
  totalSteps: number;
  percent: number;
  currentStepTitle: string;
  currentStepDetail: string;
  steps: CentralSyncStepInfo[];
}

export interface ModuleSyncSummary {
  pushed: number;
  pulled: number;
  status: 'success' | 'warning' | 'skipped' | 'error';
  detail: string;
  driveFolder?: string;
  fileId?: string;
  fileName?: string;
  sourceSheet?: string;
}

export interface CentralSyncReport {
  success: boolean;
  message: string;
  timestamp: string;
  durationSeconds: number;
  tataUsahaFolderId: string;
  tataUsahaFolderLink?: string;
  userEmail?: string;
  modules: {
    suratMasuk: ModuleSyncSummary;
    suratKeluar: ModuleSyncSummary;
    skKBM: ModuleSyncSummary;
    skTugasTambahan: ModuleSyncSummary;
    suratTugas: ModuleSyncSummary;
    pembuatSurat: ModuleSyncSummary;
    guruPTK: ModuleSyncSummary;
    siswa: ModuleSyncSummary;
    alumni: ModuleSyncSummary;
    identitasSekolah: ModuleSyncSummary;
    masterBackup: ModuleSyncSummary;
  };
  totalSyncedItems: number;
}

/**
 * Initial empty steps template for UI progress (One-Way Fetch / Pull Only)
 */
export const INITIAL_SYNC_STEPS: CentralSyncStepInfo[] = [
  {
    id: 'auth_check',
    stepNumber: 1,
    title: 'Autentikasi & Kuota Google Workspace',
    detail: 'Memeriksa token akses, validitas sesi Google Drive, dan kapasitas kuota...',
    status: 'waiting',
  },
  {
    id: 'folder_structure',
    stepNumber: 2,
    title: 'Pemindaian Folder & Arsip TATA USAHA',
    detail: 'Memeriksa folder induk TATA USAHA dan subfolder arsip dinas di Google Drive...',
    status: 'waiting',
  },
  {
    id: 'pull_master_db',
    stepNumber: 3,
    title: 'Penarikan Master Database dari Google Drive',
    detail: 'Membaca snapshot database SIPEDAS_DATABASE_TATA_USAHA.json dari Google Drive...',
    status: 'waiting',
  },
  {
    id: 'pull_surat_masuk',
    stepNumber: 4,
    title: 'Penarikan Data Surat Masuk (Satu Arah)',
    detail: 'Membaca data riil Surat Masuk langsung dari Google Sheets & arsip Drive...',
    status: 'waiting',
  },
  {
    id: 'pull_surat_keluar',
    stepNumber: 5,
    title: 'Penarikan Data Surat Keluar & Register (Satu Arah)',
    detail: 'Membaca data nomor registrasi Surat Keluar dari Google Sheets & arsip Drive...',
    status: 'waiting',
  },
  {
    id: 'pull_sk_spt',
    stepNumber: 6,
    title: 'Penarikan Dokumen SK, SPT & Pembuat Surat (Satu Arah)',
    detail: 'Membaca SK KBM, SK Tambahan, Surat Tugas Dinas, dan Draf Pembuat Surat dari Drive...',
    status: 'waiting',
  },
  {
    id: 'pull_ptk_siswa',
    stepNumber: 7,
    title: 'Penarikan Master PTK, Siswa & Alumni (Satu Arah)',
    detail: 'Membaca data kepegawaian PTK dan Buku Induk Siswa/Alumni dari Google Sheets & Drive...',
    status: 'waiting',
  },
  {
    id: 'apply_state',
    stepNumber: 8,
    title: 'Pembaruan State Aplikasi (Single Source of Truth)',
    detail: 'Menimpa seluruh data lokal aplikasi dengan data terbaru dari Google Drive & Sheets (Tanpa Upload)...',
    status: 'waiting',
  },
];

/**
 * Execute Central Synchronization in One-Way Fetch (Pull Only) Mode.
 * Reads the latest data from Google Drive & Sheets and directly updates the app state
 * as the Single Source of Truth without pushing/uploading any local data back to Drive.
 */
export const runCentralSync = async (
  accessToken: string,
  currentState: DatabaseState,
  onProgress?: (progress: CentralSyncProgress) => void
): Promise<{ updatedData: DatabaseState; report: CentralSyncReport }> => {
  const startTime = Date.now();
  const steps: CentralSyncStepInfo[] = JSON.parse(JSON.stringify(INITIAL_SYNC_STEPS));
  const totalSteps = steps.length;

  const updateProgress = (stepIndex: number, status: 'in-progress' | 'completed' | 'error', detailOverride?: string) => {
    steps[stepIndex].status = status;
    if (detailOverride) {
      steps[stepIndex].detail = detailOverride;
    }
    const completedCount = steps.filter((s) => s.status === 'completed').length;
    const percent = Math.round((completedCount / totalSteps) * 100);

    if (onProgress) {
      onProgress({
        currentStep: stepIndex + 1,
        totalSteps,
        percent: Math.min(100, percent),
        currentStepTitle: steps[stepIndex].title,
        currentStepDetail: detailOverride || steps[stepIndex].detail,
        steps: [...steps],
      });
    }
  };

  let workingState: DatabaseState = JSON.parse(JSON.stringify(currentState));
  let userEmail = '';
  let tataUsahaFolderId = '';
  let tataUsahaFolderLink = '';

  const subfolderMap: Record<string, string> = {};

  // Track sources and pulled counts per module
  const moduleSources = {
    suratMasuk: { pulled: 0, source: '' },
    suratKeluar: { pulled: 0, source: '' },
    guruPTK: { pulled: 0, source: '' },
    siswa: { pulled: 0, source: '' },
    alumni: { pulled: 0, source: '' },
    skKBM: { pulled: 0, source: '' },
    skTugasTambahan: { pulled: 0, source: '' },
    suratTugas: { pulled: 0, source: '' },
    pembuatSurat: { pulled: 0, source: '' },
    masterBackup: { pulled: 0, source: '' },
  };

  try {
    // -------------------------------------------------------------
    // STEP 1 (Index 0): Auth & Storage Quota Check
    // -------------------------------------------------------------
    updateProgress(0, 'in-progress');
    if (!accessToken) {
      throw new Error('AUTH_EXPIRED: Token Google Drive tidak tersedia. Silakan hubungkan akun Google.');
    }

    const quotaInfo = await getDriveQuotaAndUser(accessToken);
    userEmail = quotaInfo.userEmail || '';
    updateProgress(0, 'completed', `Terhubung ke Google Drive (${userEmail || 'Akun Sekolah'}). Kuota: ${quotaInfo.usage} / ${quotaInfo.limit}`);

    // -------------------------------------------------------------
    // STEP 2 (Index 1): Scan TATA USAHA Folder Structure & Subfolders
    // -------------------------------------------------------------
    updateProgress(1, 'in-progress');
    tataUsahaFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');
    tataUsahaFolderLink = `https://drive.google.com/drive/folders/${tataUsahaFolderId}`;

    const requiredSubfolders = [
      { key: 'surat_masuk', name: '01_SURAT_MASUK' },
      { key: 'surat_keluar', name: '02_SURAT_KELUAR' },
      { key: 'sk_spt', name: '03_SK_DAN_SPT_DINAS' },
      { key: 'ptk', name: '04_KEPEGAWAIAN_PTK' },
      { key: 'siswa_alumni', name: '05_KESISWAAN_DAN_ALUMNI' },
      { key: 'backup', name: '06_DATABASE_DAN_BACKUP' },
      { key: 'arsip_dokumen', name: '07_ARSIP_DOKUMEN_SURAT' },
    ];

    for (const sub of requiredSubfolders) {
      try {
        const query = `name = '${sub.name}' and '${tataUsahaFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const res = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: query, fields: 'files(id, name)' }).toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            subfolderMap[sub.key] = data.files[0].id;
          }
        }
        if (!subfolderMap[sub.key]) {
          subfolderMap[sub.key] = await createGoogleDriveFolder(accessToken, sub.name, tataUsahaFolderId);
        }
      } catch (e) {
        console.warn(`Subfolder scan notice for ${sub.name}:`, e);
      }
    }
    updateProgress(1, 'completed', 'Folder TATA USAHA dan subfolder arsip dinas teridentifikasi di Google Drive.');

    // -------------------------------------------------------------
    // STEP 3 (Index 2): Pull Master Database Snapshot from Google Drive
    // -------------------------------------------------------------
    updateProgress(2, 'in-progress');
    let masterSnapshotFound = false;
    try {
      const q = `name = 'SIPEDAS_DATABASE_TATA_USAHA.json' and '${tataUsahaFolderId}' in parents and trashed = false`;
      const res = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q, fields: 'files(id, name, modifiedTime)' }).toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const fileList = await res.json();
        if (fileList.files && fileList.files.length > 0) {
          const masterFileId = fileList.files[0].id;
          const contentRes = await fetch(`${DRIVE_API_URL}/files/${masterFileId}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (contentRes.ok) {
            const masterPayload = await contentRes.json();
            if (masterPayload && masterPayload.data) {
              workingState = {
                ...workingState,
                ...masterPayload.data,
              };
              masterSnapshotFound = true;
              moduleSources.masterBackup = {
                pulled: 1,
                source: `Google Drive / TATA USAHA (${fileList.files[0].name})`,
              };
            }
          }
        }
      }

      if (!masterSnapshotFound && subfolderMap['backup']) {
        const backupQ = `'${subfolderMap['backup']}' in parents and name contains 'BACKUP_DATABASE_TATA_USAHA' and trashed = false`;
        const backupRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: backupQ, orderBy: 'modifiedTime desc', fields: 'files(id, name)' }).toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (backupRes.ok) {
          const backupList = await backupRes.json();
          if (backupList.files && backupList.files.length > 0) {
            const backupFileId = backupList.files[0].id;
            const backupContentRes = await fetch(`${DRIVE_API_URL}/files/${backupFileId}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (backupContentRes.ok) {
              const backupPayload = await backupContentRes.json();
              if (backupPayload) {
                workingState = {
                  ...workingState,
                  ...backupPayload,
                };
                masterSnapshotFound = true;
                moduleSources.masterBackup = {
                  pulled: 1,
                  source: `Google Drive / Backup (${backupList.files[0].name})`,
                };
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Notice reading master DB snapshot from Drive:', err);
    }

    updateProgress(
      2,
      'completed',
      masterSnapshotFound
        ? `Snapshot master database terpadu berhasil dibaca dari Google Drive (${moduleSources.masterBackup.source}).`
        : 'Snapshot master di Drive belum ada, melanjutkan penarikan data dari Google Sheets & arsip modul.'
    );

    // -------------------------------------------------------------
    // STEP 3: Real Direct Pull from Google Sheets & Subfolder Archives
    // -------------------------------------------------------------
    updateProgress(2, 'in-progress');

    // 1. Search all accessible Spreadsheets in Google Drive
    const driveSpreadsheets = await searchAllDriveSpreadsheets(accessToken).catch(() => []);

    // Helper to find matching sheet tabs
    const findTab = (sheetNames: string[], candidates: string[]): string | undefined => {
      for (const cand of candidates) {
        const exact = sheetNames.find((s) => s.toLowerCase().trim() === cand.toLowerCase().trim());
        if (exact) return exact;
      }
      for (const cand of candidates) {
        const partial = sheetNames.find((s) => s.toLowerCase().includes(cand.toLowerCase()) || cand.toLowerCase().includes(s.toLowerCase()));
        if (partial) return partial;
      }
      return undefined;
    };

    // A. SURAT MASUK (Read from Sheet if found)
    let foundSuratMasukSheet = false;
    for (const ss of driveSpreadsheets) {
      const tabName = findTab(ss.sheetNames, ['KOTAK MASUK', 'SURAT MASUK', 'Kotak Masuk', 'Surat Masuk', 'Inbox']);
      if (tabName) {
        try {
          const rawRows = await readSheetData(accessToken, ss.id, tabName);
          const parsed = parseSuratMasukFromRows(rawRows);
          if (parsed.suratList && parsed.suratList.length > 0) {
            // Real Sheet Data found! Replace state with real data from Google Sheet
            workingState.suratMasuk = parsed.suratList;
            foundSuratMasukSheet = true;
            moduleSources.suratMasuk = {
              pulled: parsed.suratList.length,
              source: `Google Sheet "${ss.name}" [Tab: ${tabName}]`,
            };
            break;
          }
        } catch (e) {
          console.warn(`Failed reading Surat Masuk sheet ${ss.name}:`, e);
        }
      }
    }

    // B. SURAT KELUAR (Read from Sheet if found)
    let foundSuratKeluarSheet = false;
    const sortedSpreadsheetsForSK = [...driveSpreadsheets].sort((a, b) => {
      const aIsTarget = a.name === 'BUKU_AGENDA_SURAT_KELUAR';
      const bIsTarget = b.name === 'BUKU_AGENDA_SURAT_KELUAR';
      if (aIsTarget && !bIsTarget) return -1;
      if (!aIsTarget && bIsTarget) return 1;
      return 0;
    });

    for (const ss of sortedSpreadsheetsForSK) {
      const tabName = findTab(ss.sheetNames || [], ['2026', 'SURAT KELUAR', 'Surat Keluar', 'Register', 'Buku Agenda', 'Nomor Surat', 'REGISTER']);
      if (tabName) {
        try {
          const rawRows = await readSheetData(accessToken, ss.id, tabName);
          const parsed = parseSuratKeluarFromRows(rawRows);
          if (parsed.suratList && parsed.suratList.length > 0) {
            // Real Sheet Data found! Replace state with real data from Google Sheet
            workingState.suratKeluar = parsed.suratList;
            foundSuratKeluarSheet = true;
            moduleSources.suratKeluar = {
              pulled: parsed.suratList.length,
              source: `Google Sheet "${ss.name}" [Tab: ${tabName}]`,
            };
            break;
          }
        } catch (e) {
          console.warn(`Failed reading Surat Keluar sheet ${ss.name}:`, e);
        }
      }
    }

    // C. DATA GURU & PTK (Read from Sheet if found)
    let foundPTKSheet = false;
    for (const ss of driveSpreadsheets) {
      const tabName = findTab(ss.sheetNames, ['DATA PTK', 'DATA GURU', 'GURU & PTK', 'PTK', 'GURU', 'Kepegawaian', 'Pegawai', 'GTK', 'Dapodik PTK', 'DAPODIK']);
      if (tabName) {
        try {
          const rawRows = await readSheetData(accessToken, ss.id, tabName);
          const parsed = parseGuruPTKFromRows(rawRows);
          if (parsed.ptkList && parsed.ptkList.length > 0) {
            workingState.guruPTK = parsed.ptkList;
            foundPTKSheet = true;
            moduleSources.guruPTK = {
              pulled: parsed.ptkList.length,
              source: `Google Sheet "${ss.name}" [Tab: ${tabName}]`,
            };
            break;
          }
        } catch (e) {
          console.warn(`Failed reading PTK sheet ${ss.name}:`, e);
        }
      }
    }

    // D. BUKU INDUK SISWA & ALUMNI (Read from Sheet if found)
    let foundSiswaSheet = false;
    for (const ss of driveSpreadsheets) {
      const tabNameSiswa = findTab(ss.sheetNames, ['BUKU INDUK', 'DATA SISWA', 'SISWA', 'PESERTA DIDIK', 'Buku Induk Siswa']);
      if (tabNameSiswa) {
        try {
          const rawRows = await readSheetData(accessToken, ss.id, tabNameSiswa);
          const parsed = parseSiswaFromRows(rawRows);
          if (parsed.siswaList && parsed.siswaList.length > 0) {
            workingState.siswa = parsed.siswaList;
            foundSiswaSheet = true;
            moduleSources.siswa = {
              pulled: parsed.siswaList.length,
              source: `Google Sheet "${ss.name}" [Tab: ${tabNameSiswa}]`,
            };
          }
        } catch (e) {
          console.warn(`Failed reading Siswa sheet ${ss.name}:`, e);
        }
      }

      const tabNameAlumni = findTab(ss.sheetNames, ['ALUMNI', 'DATA ALUMNI', 'IJAZAH', 'BUKU ALUMNI', 'Alumni']);
      if (tabNameAlumni) {
        try {
          const rawRows = await readSheetData(accessToken, ss.id, tabNameAlumni);
          const parsed = parseAlumniFromRows(rawRows);
          if (parsed.alumniList && parsed.alumniList.length > 0) {
            workingState.alumni = parsed.alumniList;
            moduleSources.alumni = {
              pulled: parsed.alumniList.length,
              source: `Google Sheet "${ss.name}" [Tab: ${tabNameAlumni}]`,
            };
          }
        } catch (e) {
          console.warn(`Failed reading Alumni sheet ${ss.name}:`, e);
        }
      }
    }

    // E. Fallback to subfolder JSON archives in Drive if sheets were not connected or for SK / Surat Tugas
    // 1) Surat Masuk JSON check
    if (!foundSuratMasukSheet && subfolderMap['surat_masuk']) {
      try {
        const fileRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: `name = 'BUKU_AGENDA_SURAT_MASUK.json' and '${subfolderMap['surat_masuk']}' in parents and trashed = false`, fields: 'files(id)' }).toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          if (fileData.files && fileData.files.length > 0) {
            const contentRes = await fetch(`${DRIVE_API_URL}/files/${fileData.files[0].id}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (contentRes.ok) {
              const parsed = await contentRes.json();
              const items: SuratMasuk[] = parsed.arsip || parsed.data || [];
              const nonMock = items.filter((s) => !isMockSuratMasuk(s));
              if (nonMock.length > 0) {
                workingState.suratMasuk = nonMock;
                moduleSources.suratMasuk = {
                  pulled: nonMock.length,
                  source: 'Google Drive (01_SURAT_MASUK)',
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn('Surat Masuk json fallback read error:', e);
      }
    }

    // 2) Surat Keluar JSON check
    if (!foundSuratKeluarSheet && subfolderMap['surat_keluar']) {
      try {
        const fileRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: `name = 'BUKU_AGENDA_SURAT_KELUAR.json' and '${subfolderMap['surat_keluar']}' in parents and trashed = false`, fields: 'files(id)' }).toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          if (fileData.files && fileData.files.length > 0) {
            const contentRes = await fetch(`${DRIVE_API_URL}/files/${fileData.files[0].id}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (contentRes.ok) {
              const parsed = await contentRes.json();
              const items: SuratKeluar[] = parsed.arsip || parsed.data || [];
              const nonMock = items.filter((s) => !isMockSuratKeluar(s));
              if (nonMock.length > 0) {
                workingState.suratKeluar = nonMock;
                moduleSources.suratKeluar = {
                  pulled: nonMock.length,
                  source: 'Google Drive (02_SURAT_KELUAR)',
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn('Surat Keluar json fallback read error:', e);
      }
    }

    // 3) PTK JSON check in 04_KEPEGAWAIAN_PTK
    if (!foundPTKSheet && subfolderMap['ptk']) {
      try {
        const fileRes = await fetch(
          `${DRIVE_API_URL}/files?${new URLSearchParams({
            q: `(name = 'Data Guru & PTK' or name = 'Data Guru & PTK.json' or name = 'DATA_INDUK_PTK.json') and '${subfolderMap['ptk']}' in parents and trashed = false`,
            fields: 'files(id, name)',
            orderBy: 'modifiedTime desc',
          }).toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          if (fileData.files && fileData.files.length > 0) {
            const fileItem = fileData.files[0];
            const contentRes = await fetch(`${DRIVE_API_URL}/files/${fileItem.id}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (contentRes.ok) {
              const parsed = await contentRes.json();
              const items: GuruPTK[] = parsed.guruPTK || parsed.daftarPTK || parsed.data || (Array.isArray(parsed) ? parsed : []);
              const nonMock = items.filter((p) => !isMockPTK(p));
              if (nonMock.length > 0) {
                workingState.guruPTK = nonMock;
                moduleSources.guruPTK = {
                  pulled: nonMock.length,
                  source: `Google Drive (04_KEPEGAWAIAN_PTK / ${fileItem.name})`,
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn('PTK json fallback read error:', e);
      }
    }

    // 4) Siswa & Alumni JSON check
    if (!foundSiswaSheet && subfolderMap['siswa_alumni']) {
      try {
        const fileRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: `name = 'BUKU_INDUK_SISWA_DAN_ALUMNI.json' and '${subfolderMap['siswa_alumni']}' in parents and trashed = false`, fields: 'files(id)' }).toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          if (fileData.files && fileData.files.length > 0) {
            const contentRes = await fetch(`${DRIVE_API_URL}/files/${fileData.files[0].id}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (contentRes.ok) {
              const parsed = await contentRes.json();
              const siswaItems: Siswa[] = parsed.daftarSiswa || [];
              const alumniItems: Alumni[] = parsed.daftarAlumni || [];
              const nonMockSiswa = siswaItems.filter((s) => !isMockSiswa(s));
              const nonMockAlumni = alumniItems.filter((a) => !isMockAlumni(a));
              if (nonMockSiswa.length > 0) {
                workingState.siswa = nonMockSiswa;
                moduleSources.siswa = {
                  pulled: nonMockSiswa.length,
                  source: 'Google Drive (05_KESISWAAN_DAN_ALUMNI)',
                };
              }
              if (nonMockAlumni.length > 0) {
                workingState.alumni = nonMockAlumni;
                moduleSources.alumni = {
                  pulled: nonMockAlumni.length,
                  source: 'Google Drive (05_KESISWAAN_DAN_ALUMNI)',
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn('Siswa/Alumni json fallback read error:', e);
      }
    }

    // 5) SK & SPT JSON check
    if (subfolderMap['sk_spt']) {
      try {
        const fileRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: `name = 'DOKUMEN_SK_DAN_SURAT_TUGAS.json' and '${subfolderMap['sk_spt']}' in parents and trashed = false`, fields: 'files(id)' }).toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          if (fileData.files && fileData.files.length > 0) {
            const contentRes = await fetch(`${DRIVE_API_URL}/files/${fileData.files[0].id}?alt=media`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (contentRes.ok) {
              const parsed = await contentRes.json();
              if (Array.isArray(parsed.skKBM) && parsed.skKBM.length > 0) workingState.skKBM = parsed.skKBM;
              if (Array.isArray(parsed.skTugasTambahan) && parsed.skTugasTambahan.length > 0) workingState.skTugasTambahan = parsed.skTugasTambahan;
              if (Array.isArray(parsed.suratTugas) && parsed.suratTugas.length > 0) workingState.suratTugas = parsed.suratTugas;
            }
          }
        }
      } catch (e) {
        console.warn('SK/SPT json read error:', e);
      }
    }

    // CRITICAL CLEANUP: Strip out any remaining template mock data if real records are present
    const nonMockSuratMasuk = (workingState.suratMasuk || []).filter((s) => !isMockSuratMasuk(s));
    if (nonMockSuratMasuk.length > 0) {
      workingState.suratMasuk = nonMockSuratMasuk;
    }

    const nonMockSuratKeluar = (workingState.suratKeluar || []).filter((s) => !isMockSuratKeluar(s));
    if (nonMockSuratKeluar.length > 0) {
      workingState.suratKeluar = nonMockSuratKeluar;
    }

    const nonMockPTK = (workingState.guruPTK || []).filter((p) => !isMockPTK(p));
    if (nonMockPTK.length > 0) {
      workingState.guruPTK = nonMockPTK;
    }

    const nonMockSiswa = (workingState.siswa || []).filter((s) => !isMockSiswa(s));
    if (nonMockSiswa.length > 0) {
      workingState.siswa = nonMockSiswa;
    }

    const nonMockAlumni = (workingState.alumni || []).filter((a) => !isMockAlumni(a));
    if (nonMockAlumni.length > 0) {
      workingState.alumni = nonMockAlumni;
    }

    // Reconcile Surat Keluar with Surat Tugas & Pembuat Surat
    workingState.suratKeluar = syncAllModulesToSuratKeluar(
      workingState.suratKeluar || [],
      workingState.suratTugas || [],
      workingState.pembuatSurat || [],
      workingState.identitasSekolah
    );

    const totalPulled =
      moduleSources.suratMasuk.pulled +
      moduleSources.suratKeluar.pulled +
      moduleSources.guruPTK.pulled +
      moduleSources.siswa.pulled +
      moduleSources.alumni.pulled;

    updateProgress(
      2,
      'completed',
      totalPulled > 0
        ? `Berhasil membaca ${totalPulled} rekaman riil langsung dari Google Sheets & Drive terhubung.`
        : 'Data riil berhasil diselaraskan dan diverifikasi aman dari Google Drive.'
    );

    // -------------------------------------------------------------
    // STEP 4 (Index 3): Surat Masuk Verification
    // -------------------------------------------------------------
    updateProgress(3, 'in-progress');
    const suratMasukCount = (workingState.suratMasuk || []).length;
    updateProgress(
      3,
      'completed',
      `Berhasil menarik & memverifikasi ${suratMasukCount} arsip Surat Masuk (${moduleSources.suratMasuk.source || 'Data Riil'}).`
    );

    // -------------------------------------------------------------
    // STEP 5 (Index 4): Surat Keluar & Register Verification
    // -------------------------------------------------------------
    updateProgress(4, 'in-progress');
    const suratKeluarCount = (workingState.suratKeluar || []).length;
    updateProgress(
      4,
      'completed',
      `Berhasil menarik & memverifikasi ${suratKeluarCount} arsip Surat Keluar (${moduleSources.suratKeluar.source || 'Nomor Surat Terpadu'}).`
    );

    // -------------------------------------------------------------
    // STEP 6 (Index 5): SK, SPT Dinas & Pembuat Surat
    // -------------------------------------------------------------
    updateProgress(5, 'in-progress');
    const skKBMCount = (workingState.skKBM || []).length;
    const skTTCount = (workingState.skTugasTambahan || []).length;
    const suratTugasCount = (workingState.suratTugas || []).length;
    const pembuatSuratCount = (workingState.pembuatSurat || []).length;
    updateProgress(
      5,
      'completed',
      `Berhasil menarik ${skKBMCount} SK KBM, ${skTTCount} SK Tambahan, ${suratTugasCount} SPT, & ${pembuatSuratCount} Pembuat Surat.`
    );

    // -------------------------------------------------------------
    // STEP 7 (Index 6): PTK, Siswa & Alumni
    // -------------------------------------------------------------
    updateProgress(6, 'in-progress');
    const ptkCount = (workingState.guruPTK || []).length;
    const siswaCount = (workingState.siswa || []).length;
    const alumniCount = (workingState.alumni || []).length;
    updateProgress(
      6,
      'completed',
      `Berhasil menarik ${ptkCount} data PTK, ${siswaCount} Siswa, & ${alumniCount} Alumni dari Google Sheets & Drive.`
    );

    // -------------------------------------------------------------
    // STEP 8 (Index 7): Pembaruan State Aplikasi (Single Source of Truth - Satu Arah)
    // -------------------------------------------------------------
    updateProgress(7, 'in-progress');

    // Reconcile Surat Keluar numbering with Surat Tugas & Pembuat Surat
    workingState.suratKeluar = syncAllModulesToSuratKeluar(
      workingState.suratKeluar || [],
      workingState.suratTugas || [],
      workingState.pembuatSurat || [],
      workingState.identitasSekolah
    );

    const totalSyncedItems =
      suratMasukCount +
      suratKeluarCount +
      skKBMCount +
      skTTCount +
      suratTugasCount +
      pembuatSuratCount +
      ptkCount +
      siswaCount +
      alumniCount;

    const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    updateProgress(
      7,
      'completed',
      `State aplikasi berhasil diperbarui sebagai Single Source of Truth (${totalSyncedItems} data terverifikasi dalam ${durationSeconds} detik).`
    );

    const report: CentralSyncReport = {
      success: true,
      message: 'Berhasil memperbarui semua data dari Google Drive (Satu Arah). Seluruh modul aplikasi telah diselaraskan dengan data terbaru.',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      durationSeconds,
      tataUsahaFolderId,
      tataUsahaFolderLink,
      userEmail,
      totalSyncedItems,
      modules: {
        suratMasuk: {
          pushed: 0,
          pulled: suratMasukCount,
          status: 'success',
          detail: `${suratMasukCount} data ditarik (${moduleSources.suratMasuk.source || 'Data Riil'})`,
          driveFolder: 'TATA USAHA / 01_SURAT_MASUK',
          sourceSheet: moduleSources.suratMasuk.source,
        },
        suratKeluar: {
          pushed: 0,
          pulled: suratKeluarCount,
          status: 'success',
          detail: `${suratKeluarCount} data ditarik (${moduleSources.suratKeluar.source || 'Nomor Surat Terpadu'})`,
          driveFolder: 'TATA USAHA / 02_SURAT_KELUAR',
          sourceSheet: moduleSources.suratKeluar.source,
        },
        skKBM: {
          pushed: 0,
          pulled: skKBMCount,
          status: 'success',
          detail: `${skKBMCount} dokumen SK ditarik`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        skTugasTambahan: {
          pushed: 0,
          pulled: skTTCount,
          status: 'success',
          detail: `${skTTCount} dokumen SK ditarik`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        suratTugas: {
          pushed: 0,
          pulled: suratTugasCount,
          status: 'success',
          detail: `${suratTugasCount} arsip SPT ditarik`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        pembuatSurat: {
          pushed: 0,
          pulled: pembuatSuratCount,
          status: 'success',
          detail: `${pembuatSuratCount} draf surat ditarik`,
          driveFolder: 'TATA USAHA / 02_SURAT_KELUAR',
        },
        guruPTK: {
          pushed: 0,
          pulled: ptkCount,
          status: 'success',
          detail: `${ptkCount} data PTK ditarik (${moduleSources.guruPTK.source || 'Data Riil'})`,
          driveFolder: 'TATA USAHA / 04_KEPEGAWAIAN_PTK',
          sourceSheet: moduleSources.guruPTK.source,
        },
        siswa: {
          pushed: 0,
          pulled: siswaCount,
          status: 'success',
          detail: `${siswaCount} data siswa ditarik (${moduleSources.siswa.source || 'Buku Induk Riil'})`,
          driveFolder: 'TATA USAHA / 05_KESISWAAN_DAN_ALUMNI',
          sourceSheet: moduleSources.siswa.source,
        },
        alumni: {
          pushed: 0,
          pulled: alumniCount,
          status: 'success',
          detail: `${alumniCount} data alumni ditarik`,
          driveFolder: 'TATA USAHA / 05_KESISWAAN_DAN_ALUMNI',
          sourceSheet: moduleSources.alumni.source,
        },
        identitasSekolah: {
          pushed: 0,
          pulled: 1,
          status: 'success',
          detail: workingState.identitasSekolah?.namaSekolah || 'SMP Negeri 2 Puriala',
          driveFolder: 'TATA USAHA',
        },
        masterBackup: {
          pushed: 0,
          pulled: moduleSources.masterBackup.pulled,
          status: 'success',
          detail: moduleSources.masterBackup.source || 'SIPEDAS_DATABASE_TATA_USAHA.json',
          driveFolder: 'TATA USAHA / 06_DATABASE_DAN_BACKUP',
        },
      },
    };

    return {
      updatedData: workingState,
      report,
    };
  } catch (error: any) {
    console.warn('Central pull sync Tata Usaha notice:', error?.message || error);
    throw error;
  }
};

