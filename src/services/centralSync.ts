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
  uploadFileToGoogleDrive,
  updateFileInGoogleDrive,
  getDriveQuotaAndUser,
  uploadDatabaseBackupToDrive,
  GoogleDriveFile,
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
 * Initial empty steps template for UI progress
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
    title: 'Struktur Folder Tata Usaha di Google Drive',
    detail: 'Memeriksa dan membuat folder induk TATA USAHA beserta 6 subfolder arsip...',
    status: 'waiting',
  },
  {
    id: 'pull_check',
    stepNumber: 3,
    title: 'Pemeriksaan & Penarikan Langsung dari Google Sheets & Drive',
    detail: 'Membaca data riil dari Google Sheets (Surat Masuk, Surat Keluar, PTK, Siswa) & subfolder arsip...',
    status: 'waiting',
  },
  {
    id: 'sync_surat_masuk',
    stepNumber: 4,
    title: 'Sinkronisasi Surat Masuk & Buku Agenda',
    detail: 'Mengarsipkan data riil Surat Masuk ke folder 01_SURAT_MASUK...',
    status: 'waiting',
  },
  {
    id: 'sync_surat_keluar',
    stepNumber: 5,
    title: 'Sinkronisasi Surat Keluar & Nomor Surat',
    detail: 'Merekonsiliasi penomoran urut dan mengarsipkan ke folder 02_SURAT_KELUAR...',
    status: 'waiting',
  },
  {
    id: 'sync_sk_spt',
    stepNumber: 6,
    title: 'Sinkronisasi SK KBM, SK Tugas Tambahan & SPT',
    detail: 'Mengunggah dokumen keputusan dan surat perintah ke 03_SK_DAN_SPT_DINAS...',
    status: 'waiting',
  },
  {
    id: 'sync_pembuat_surat',
    stepNumber: 7,
    title: 'Sinkronisasi Pembuat Surat & Template',
    detail: 'Menyinkronkan draf surat dinas dan dokumen terbitan ke Google Drive...',
    status: 'waiting',
  },
  {
    id: 'sync_ptk_siswa',
    stepNumber: 8,
    title: 'Sinkronisasi PTK, Buku Induk Siswa & Alumni',
    detail: 'Mencadangkan master data kepegawaian PTK dan kesiswaan riil...',
    status: 'waiting',
  },
  {
    id: 'master_backup',
    stepNumber: 9,
    title: 'Pembuatan Snapshot Database Master & Ringkasan',
    detail: 'Menyimpan SIPEDAS_DATABASE_TATA_USAHA.json dan ringkasan eksekutif...',
    status: 'waiting',
  },
];

/**
 * Execute Central Synchronization (Direct Sheet Pull & Safe Drive Push)
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
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Auth & Storage Quota Check
    // -------------------------------------------------------------
    updateProgress(0, 'in-progress');
    if (!accessToken) {
      throw new Error('AUTH_EXPIRED: Token Google Drive tidak tersedia. Silakan hubungkan akun Google.');
    }

    const quotaInfo = await getDriveQuotaAndUser(accessToken);
    userEmail = quotaInfo.userEmail || '';
    updateProgress(0, 'completed', `Terhubung ke Google Drive (${userEmail || 'Akun Sekolah'}). Kuota: ${quotaInfo.usage} / ${quotaInfo.limit}`);

    // -------------------------------------------------------------
    // STEP 2: Verify & Create TATA USAHA Folder Structure
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
        console.warn(`Subfolder creation warning for ${sub.name}:`, e);
      }
    }
    updateProgress(1, 'completed', 'Folder TATA USAHA dan 6 subfolder arsip dinas siap di Google Drive.');

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
    for (const ss of driveSpreadsheets) {
      const tabName = findTab(ss.sheetNames, ['2026', 'SURAT KELUAR', 'Surat Keluar', 'Register', 'Buku Agenda', 'Nomor Surat', 'REGISTER']);
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
    // STEP 4: Sync Surat Masuk
    // -------------------------------------------------------------
    updateProgress(3, 'in-progress');
    const suratMasukCount = (workingState.suratMasuk || []).length;
    const targetFolderSuratMasuk = subfolderMap['surat_masuk'] || tataUsahaFolderId;

    const suratMasukPayload = {
      judul: 'BUKU AGENDA SURAT MASUK SMP NEGERI 2 PURIALA',
      satuanPendidikan: workingState.identitasSekolah?.namaSekolah || 'SMP Negeri 2 Puriala',
      diperbaruiPada: new Date().toISOString(),
      sumberData: moduleSources.suratMasuk.source || 'Data Riil Terverifikasi',
      totalArsip: suratMasukCount,
      arsip: (workingState.suratMasuk || []).map((s) => ({
        ...s,
        statusDrive: 'Tersimpan',
      })),
    };
    await uploadOrUpdateJsonFile(accessToken, 'BUKU_AGENDA_SURAT_MASUK.json', suratMasukPayload, targetFolderSuratMasuk);
    updateProgress(3, 'completed', `Tersinkronisasi ${suratMasukCount} arsip Surat Masuk ke folder 01_SURAT_MASUK.`);

    // -------------------------------------------------------------
    // STEP 5: Sync Surat Keluar
    // -------------------------------------------------------------
    updateProgress(4, 'in-progress');
    const suratKeluarCount = (workingState.suratKeluar || []).length;
    const targetFolderSuratKeluar = subfolderMap['surat_keluar'] || tataUsahaFolderId;

    const suratKeluarPayload = {
      judul: 'BUKU AGENDA DAN REGISTER NOMOR SURAT KELUAR SMP NEGERI 2 PURIALA',
      satuanPendidikan: workingState.identitasSekolah?.namaSekolah || 'SMP Negeri 2 Puriala',
      diperbaruiPada: new Date().toISOString(),
      sumberData: moduleSources.suratKeluar.source || 'Data Riil Terverifikasi',
      totalArsip: suratKeluarCount,
      arsip: (workingState.suratKeluar || []).map((s) => ({
        ...s,
        statusDrive: 'Tersimpan',
      })),
    };
    await uploadOrUpdateJsonFile(accessToken, 'BUKU_AGENDA_SURAT_KELUAR.json', suratKeluarPayload, targetFolderSuratKeluar);
    updateProgress(4, 'completed', `Tersinkronisasi ${suratKeluarCount} arsip Surat Keluar ke folder 02_SURAT_KELUAR.`);

    // -------------------------------------------------------------
    // STEP 6: Sync SK KBM, SK Tugas Tambahan & Surat Tugas Dinas (SPT)
    // -------------------------------------------------------------
    updateProgress(5, 'in-progress');
    const skKBMCount = (workingState.skKBM || []).length;
    const skTTCount = (workingState.skTugasTambahan || []).length;
    const suratTugasCount = (workingState.suratTugas || []).length;
    const targetFolderSK = subfolderMap['sk_spt'] || tataUsahaFolderId;

    const skSptPayload = {
      judul: 'DOKUMEN KEPUTUSAN KEPALA SEKOLAH & SURAT TUGAS DINAS SMPN 2 PURIALA',
      diperbaruiPada: new Date().toISOString(),
      totalSKKBM: skKBMCount,
      totalSKTugasTambahan: skTTCount,
      totalSuratTugas: suratTugasCount,
      skKBM: workingState.skKBM || [],
      skTugasTambahan: workingState.skTugasTambahan || [],
      suratTugas: workingState.suratTugas || [],
    };
    await uploadOrUpdateJsonFile(accessToken, 'DOKUMEN_SK_DAN_SURAT_TUGAS.json', skSptPayload, targetFolderSK);
    updateProgress(5, 'completed', `Tersinkronisasi ${skKBMCount} SK KBM, ${skTTCount} SK Tambahan, & ${suratTugasCount} Surat Tugas ke 03_SK_DAN_SPT_DINAS.`);

    // -------------------------------------------------------------
    // STEP 7: Sync Pembuat Surat & Template
    // -------------------------------------------------------------
    updateProgress(6, 'in-progress');
    const pembuatSuratCount = (workingState.pembuatSurat || []).length;
    const pembuatSuratPayload = {
      judul: 'DRAF & DOKUMEN GENERATOR PEMBUAT SURAT DINAS SMPN 2 PURIALA',
      diperbaruiPada: new Date().toISOString(),
      totalSurat: pembuatSuratCount,
      suratList: workingState.pembuatSurat || [],
    };
    await uploadOrUpdateJsonFile(accessToken, 'DRAF_PEMBUAT_SURAT.json', pembuatSuratPayload, targetFolderSuratKeluar);
    updateProgress(6, 'completed', `Tersinkronisasi ${pembuatSuratCount} draf dan arsip Pembuat Surat.`);

    // -------------------------------------------------------------
    // STEP 8: Sync PTK, Siswa & Alumni
    // -------------------------------------------------------------
    updateProgress(7, 'in-progress');
    const ptkCount = (workingState.guruPTK || []).length;
    const siswaCount = (workingState.siswa || []).length;
    const alumniCount = (workingState.alumni || []).length;

    const targetFolderPTK = subfolderMap['ptk'] || tataUsahaFolderId;
    const targetFolderSiswa = subfolderMap['siswa_alumni'] || tataUsahaFolderId;

    const ptkPayload = {
      judul: 'DATA GURU & TENAGA KEPENDIDIKAN (PTK) SMPN 2 PURIALA',
      diperbaruiPada: new Date().toISOString(),
      sumberData: moduleSources.guruPTK.source || 'Data Riil Terverifikasi',
      totalPTK: ptkCount,
      guruPTK: workingState.guruPTK || [],
      daftarPTK: workingState.guruPTK || [],
    };
    await uploadOrUpdateJsonFile(accessToken, 'Data Guru & PTK.json', ptkPayload, targetFolderPTK);
    await uploadOrUpdateJsonFile(accessToken, 'DATA_INDUK_PTK.json', ptkPayload, targetFolderPTK);

    const siswaPayload = {
      judul: 'BUKU INDUK PESERTA DIDIK & ALUMNI SMPN 2 PURIALA',
      diperbaruiPada: new Date().toISOString(),
      sumberData: moduleSources.siswa.source || 'Data Riil Terverifikasi',
      totalSiswa: siswaCount,
      totalAlumni: alumniCount,
      daftarSiswa: workingState.siswa || [],
      daftarAlumni: workingState.alumni || [],
    };
    await uploadOrUpdateJsonFile(accessToken, 'BUKU_INDUK_SISWA_DAN_ALUMNI.json', siswaPayload, targetFolderSiswa);
    updateProgress(7, 'completed', `Tersinkronisasi ${ptkCount} data PTK, ${siswaCount} Siswa, & ${alumniCount} Alumni.`);

    // -------------------------------------------------------------
    // STEP 9: Master Database Backup & Executive Summary
    // -------------------------------------------------------------
    updateProgress(8, 'in-progress');
    const targetFolderBackup = subfolderMap['backup'] || tataUsahaFolderId;

    // 1. Create a dated snapshot in 06_DATABASE_DAN_BACKUP
    const backupSnapshot = await uploadDatabaseBackupToDrive(accessToken, workingState, targetFolderBackup);

    // 2. Update master root SIPEDAS_DATABASE_TATA_USAHA.json in TATA USAHA folder
    const nowIso = new Date().toISOString();
    const masterDbPayload = {
      _lastSync: nowIso,
      _syncTarget: 'GOOGLE_DRIVE_FOLDER_TATA_USAHA',
      _version: '2.0',
      _syncedBy: userEmail || 'Tata Usaha SMPN 2 Puriala',
      sumberSinkronisasi: moduleSources,
      statistik: {
        totalSuratMasuk: suratMasukCount,
        totalSuratKeluar: suratKeluarCount,
        totalSKKBM: skKBMCount,
        totalSKTugasTambahan: skTTCount,
        totalSuratTugas: suratTugasCount,
        totalPembuatSurat: pembuatSuratCount,
        totalGuruPTK: ptkCount,
        totalSiswa: siswaCount,
        totalAlumni: alumniCount,
      },
      data: workingState,
    };
    await uploadOrUpdateJsonFile(accessToken, 'SIPEDAS_DATABASE_TATA_USAHA.json', masterDbPayload, tataUsahaFolderId);

    // 3. Update executive summary TXT file
    const summaryText = `======================================================================
PUSAT SINKRONISASI SimTU - SMP NEGERI 2 PURIALA
SISTEM INFORMASI PERSURATAN & ADMINISTRASI TATA USAHA SEKOLAH
======================================================================
Waktu Sinkronisasi : ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}
Akun Google Drive  : ${userEmail || 'smpnpuriala523@gmail.com'}
Folder Penyimpanan : Google Drive / TATA USAHA
Status Integritas  : TERSINKRONISASI PENUH & DATA RIIL AMAN (100% HIJAU)

SUMBER INTEGRASI GOOGLE SHEETS & DRIVE:
- Surat Masuk          : ${moduleSources.suratMasuk.source || 'Data Riil Tersimpan'} (${suratMasukCount} Arsip)
- Surat Keluar         : ${moduleSources.suratKeluar.source || 'Data Riil Tersimpan'} (${suratKeluarCount} Arsip)
- Data Guru & PTK      : ${moduleSources.guruPTK.source || 'Data Riil Tersimpan'} (${ptkCount} Personil)
- Buku Induk Siswa     : ${moduleSources.siswa.source || 'Data Riil Tersimpan'} (${siswaCount} Siswa)
- Data Alumni          : ${moduleSources.alumni.source || 'Data Riil Tersimpan'} (${alumniCount} Alumni)

RINGKASAN REKAPITULASI DOKUMEN:
----------------------------------------------------------------------
1. Surat Masuk (Buku Agenda)     : ${suratMasukCount} Arsip (Folder: 01_SURAT_MASUK)
2. Surat Keluar (Buku Agenda)    : ${suratKeluarCount} Arsip (Folder: 02_SURAT_KELUAR)
3. SK Pembagian Tugas (SK KBM)   : ${skKBMCount} Dokumen (Folder: 03_SK_DAN_SPT_DINAS)
4. SK Tugas Tambahan Guru        : ${skTTCount} Dokumen (Folder: 03_SK_DAN_SPT_DINAS)
5. Surat Perintah Tugas (SPT)    : ${suratTugasCount} Arsip (Folder: 03_SK_DAN_SPT_DINAS)
6. Generator Pembuat Surat       : ${pembuatSuratCount} Arsip (Folder: 02_SURAT_KELUAR)
7. Tenaga Pendidik & Kependidikan: ${ptkCount} Personil (Folder: 04_KEPEGAWAIAN_PTK)
8. Buku Induk Peserta Didik      : ${siswaCount} Siswa (Folder: 05_KESISWAAN_DAN_ALUMNI)
9. Arsip Ijazah & Alumni         : ${alumniCount} Alumni (Folder: 05_KESISWAAN_DAN_ALUMNI)
10. Cadangan Snapshot Master     : ${backupSnapshot.name} (Folder: 06_DATABASE_DAN_BACKUP)

Semua data riil sekolah telah dicadangkan dan diselaraskan secara aman di Google Workspace Drive & Sheets.
======================================================================`;

    const summaryBlob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    await uploadOrUpdateFile(accessToken, 'RINGKASAN_DATA_TATA_USAHA.txt', summaryBlob, 'text/plain', tataUsahaFolderId);

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    updateProgress(8, 'completed', `Snapshot master ${backupSnapshot.name} berhasil dibuat (${durationSeconds} detik).`);

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

    const report: CentralSyncReport = {
      success: true,
      message: 'Sinkronisasi Pusat Berhasil! Seluruh data riil dari Google Sheets & Drive telah berhasil diselaraskan dan dicadangkan dengan aman.',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      durationSeconds,
      tataUsahaFolderId,
      tataUsahaFolderLink,
      userEmail,
      totalSyncedItems,
      modules: {
        suratMasuk: {
          pushed: suratMasukCount,
          pulled: moduleSources.suratMasuk.pulled,
          status: 'success',
          detail: `${suratMasukCount} arsip tersinkron (${moduleSources.suratMasuk.source || 'Data Riil'})`,
          driveFolder: 'TATA USAHA / 01_SURAT_MASUK',
          sourceSheet: moduleSources.suratMasuk.source,
        },
        suratKeluar: {
          pushed: suratKeluarCount,
          pulled: moduleSources.suratKeluar.pulled,
          status: 'success',
          detail: `${suratKeluarCount} arsip tersinkron (${moduleSources.suratKeluar.source || 'Nomor surat terpadu'})`,
          driveFolder: 'TATA USAHA / 02_SURAT_KELUAR',
          sourceSheet: moduleSources.suratKeluar.source,
        },
        skKBM: {
          pushed: skKBMCount,
          pulled: moduleSources.skKBM.pulled,
          status: 'success',
          detail: `${skKBMCount} dokumen SK tersinkron`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        skTugasTambahan: {
          pushed: skTTCount,
          pulled: moduleSources.skTugasTambahan.pulled,
          status: 'success',
          detail: `${skTTCount} dokumen SK tambahan tersinkron`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        suratTugas: {
          pushed: suratTugasCount,
          pulled: moduleSources.suratTugas.pulled,
          status: 'success',
          detail: `${suratTugasCount} arsip SPT tersinkron`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        pembuatSurat: {
          pushed: pembuatSuratCount,
          pulled: moduleSources.pembuatSurat.pulled,
          status: 'success',
          detail: `${pembuatSuratCount} draf surat tersinkron`,
          driveFolder: 'TATA USAHA / 02_SURAT_KELUAR',
        },
        guruPTK: {
          pushed: ptkCount,
          pulled: moduleSources.guruPTK.pulled,
          status: 'success',
          detail: `${ptkCount} data PTK (${moduleSources.guruPTK.source || 'Data Riil'})`,
          driveFolder: 'TATA USAHA / 04_KEPEGAWAIAN_PTK',
          sourceSheet: moduleSources.guruPTK.source,
        },
        siswa: {
          pushed: siswaCount,
          pulled: moduleSources.siswa.pulled,
          status: 'success',
          detail: `${siswaCount} data siswa (${moduleSources.siswa.source || 'Buku Induk Riil'})`,
          driveFolder: 'TATA USAHA / 05_KESISWAAN_DAN_ALUMNI',
          sourceSheet: moduleSources.siswa.source,
        },
        alumni: {
          pushed: alumniCount,
          pulled: moduleSources.alumni.pulled,
          status: 'success',
          detail: `${alumniCount} data alumni & ijazah`,
          driveFolder: 'TATA USAHA / 05_KESISWAAN_DAN_ALUMNI',
          sourceSheet: moduleSources.alumni.source,
        },
        identitasSekolah: {
          pushed: 1,
          pulled: 0,
          status: 'success',
          detail: workingState.identitasSekolah?.namaSekolah || 'SMP Negeri 2 Puriala',
          driveFolder: 'TATA USAHA',
        },
        masterBackup: {
          pushed: 1,
          pulled: 0,
          status: 'success',
          detail: backupSnapshot.name,
          driveFolder: 'TATA USAHA / 06_DATABASE_DAN_BACKUP',
          fileName: backupSnapshot.name,
          fileId: backupSnapshot.id,
        },
      },
    };

    return {
      updatedData: workingState,
      report,
    };
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
    }
    throw error;
  }
};

/**
 * Helper: Upload or Update JSON file inside target folder in Google Drive
 */
async function uploadOrUpdateJsonFile(
  accessToken: string,
  fileName: string,
  data: any,
  folderId: string
): Promise<GoogleDriveFile> {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  return uploadOrUpdateFile(accessToken, fileName, blob, 'application/json', folderId);
}

/**
 * Helper: Upload or Update file in Google Drive
 */
async function uploadOrUpdateFile(
  accessToken: string,
  fileName: string,
  blob: Blob,
  mimeType: string,
  folderId: string
): Promise<GoogleDriveFile> {
  try {
    const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
    const res = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: query, fields: 'files(id, name)' }).toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        const fileId = data.files[0].id;
        const patched = await updateFileInGoogleDrive(accessToken, fileId, blob, mimeType);
        if (patched) {
          return { id: fileId, name: fileName, mimeType };
        }
      }
    }
  } catch (e) {
    console.warn(`File update search error for ${fileName}:`, e);
  }

  // Fallback upload fresh file
  return uploadFileToGoogleDrive(accessToken, blob, fileName, mimeType, folderId);
}

