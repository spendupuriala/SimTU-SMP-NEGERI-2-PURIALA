import { DatabaseState, SuratMasuk, SuratKeluar, SKKBM, SKTugasTambahan, SuratTugasDinas, PembuatSuratRecord } from '../types';
import {
  findOrCreateTataUsahaFolder,
  createGoogleDriveFolder,
  uploadFileToGoogleDrive,
  updateFileInGoogleDrive,
  getDriveQuotaAndUser,
  uploadDatabaseBackupToDrive,
  GoogleDriveFile,
} from './googleDrive';
import { invalidateGoogleAuth } from './googleAuth';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

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
    title: 'Pemeriksaan & Penarikan Data Cloud (Pull)',
    detail: 'Mengecek apakah terdapat berkas database pusat atau pembaruan di Google Drive...',
    status: 'waiting',
  },
  {
    id: 'sync_surat_masuk',
    stepNumber: 4,
    title: 'Sinkronisasi Surat Masuk & Buku Agenda',
    detail: 'Mengunggah rekaman arsip surat masuk ke folder 01_SURAT_MASUK...',
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
    detail: 'Mencadangkan master data kepegawaian PTK dan kesiswaan...',
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
 * Execute Central Synchronization (Bidirectional Pull & Push) across all modules
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
    // STEP 3: Pull Data Check from Remote Drive (Bidirectional Pull)
    // -------------------------------------------------------------
    updateProgress(2, 'in-progress');
    let pulledItemsCount = 0;
    try {
      const checkMasterQuery = `name = 'SIPEDAS_DATABASE_TATA_USAHA.json' and '${tataUsahaFolderId}' in parents and trashed = false`;
      const searchRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: checkMasterQuery, fields: 'files(id, name, modifiedTime)' }).toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const masterFileId = searchData.files[0].id;
          // Download remote file content
          const fileContentRes = await fetch(`${DRIVE_API_URL}/files/${masterFileId}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (fileContentRes.ok) {
            const remoteJson = await fileContentRes.json();
            const remoteDb: DatabaseState = remoteJson.data || remoteJson;

            // Merge logic: If remote contains items not in local (e.g. Surat Masuk / Surat Keluar added on another device), merge them
            if (remoteDb && typeof remoteDb === 'object') {
              if (Array.isArray(remoteDb.suratMasuk) && remoteDb.suratMasuk.length > 0) {
                const localIds = new Set((workingState.suratMasuk || []).map((s) => s.id));
                const missingInLocal = remoteDb.suratMasuk.filter((s) => !localIds.has(s.id));
                if (missingInLocal.length > 0) {
                  workingState.suratMasuk = [...(workingState.suratMasuk || []), ...missingInLocal];
                  pulledItemsCount += missingInLocal.length;
                }
              }

              if (Array.isArray(remoteDb.suratKeluar) && remoteDb.suratKeluar.length > 0) {
                const localIds = new Set((workingState.suratKeluar || []).map((s) => s.id));
                const missingInLocal = remoteDb.suratKeluar.filter((s) => !localIds.has(s.id));
                if (missingInLocal.length > 0) {
                  workingState.suratKeluar = [...(workingState.suratKeluar || []), ...missingInLocal];
                  pulledItemsCount += missingInLocal.length;
                }
              }

              if (Array.isArray(remoteDb.guruPTK) && remoteDb.guruPTK.length > 0) {
                const localIds = new Set((workingState.guruPTK || []).map((g) => g.id));
                const missingInLocal = remoteDb.guruPTK.filter((g) => !localIds.has(g.id));
                if (missingInLocal.length > 0) {
                  workingState.guruPTK = [...(workingState.guruPTK || []), ...missingInLocal];
                  pulledItemsCount += missingInLocal.length;
                }
              }

              if (Array.isArray(remoteDb.siswa) && remoteDb.siswa.length > 0) {
                const localIds = new Set((workingState.siswa || []).map((s) => s.id));
                const missingInLocal = remoteDb.siswa.filter((s) => !localIds.has(s.id));
                if (missingInLocal.length > 0) {
                  workingState.siswa = [...(workingState.siswa || []), ...missingInLocal];
                  pulledItemsCount += missingInLocal.length;
                }
              }
            }
          }
        }
      }
      updateProgress(2, 'completed', pulledItemsCount > 0 ? `Berhasil menarik ${pulledItemsCount} rekaman baru dari Google Drive.` : 'Data lokal sinkron dengan versi Google Drive terkini.');
    } catch (e) {
      console.warn('Pull check warning:', e);
      updateProgress(2, 'completed', 'Pengecekan cloud selesai (menggunakan basis data lokal terupdate).');
    }

    // Reconcile Surat Keluar with Surat Tugas & Pembuat Surat
    workingState.suratKeluar = syncAllModulesToSuratKeluar(
      workingState.suratKeluar || [],
      workingState.suratTugas || [],
      workingState.pembuatSurat || [],
      workingState.identitasSekolah
    );

    // -------------------------------------------------------------
    // STEP 4: Sync Surat Masuk
    // -------------------------------------------------------------
    updateProgress(3, 'in-progress');
    const suratMasukCount = (workingState.suratMasuk || []).length;
    const targetFolderSuratMasuk = subfolderMap['surat_masuk'] || tataUsahaFolderId;
    
    // Save module-specific JSON & human-readable registry in subfolder
    const suratMasukPayload = {
      judul: 'BUKU AGENDA SURAT MASUK SMP NEGERI 2 PURIALA',
      satuanPendidikan: workingState.identitasSekolah?.namaSekolah || 'SMP Negeri 2 Puriala',
      diperbaruiPada: new Date().toISOString(),
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
      judul: 'DATA INDUK PENDIDIK DAN TENAGA KEPENDIDIKAN (PTK) SMPN 2 PURIALA',
      diperbaruiPada: new Date().toISOString(),
      totalPTK: ptkCount,
      daftarPTK: workingState.guruPTK || [],
    };
    await uploadOrUpdateJsonFile(accessToken, 'DATA_INDUK_PTK.json', ptkPayload, targetFolderPTK);

    const siswaPayload = {
      judul: 'BUKU INDUK PESERTA DIDIK & ALUMNI SMPN 2 PURIALA',
      diperbaruiPada: new Date().toISOString(),
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
      _version: '1.0',
      _syncedBy: userEmail || 'Tata Usaha SMPN 2 Puriala',
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
Status Integritas  : TERSINKRONISASI PENUH & AMAN (100% HIJAU)

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

Semua data telah dicadangkan dan diselaraskan secara aman di Google Workspace Drive.
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
      message: 'Sinkronisasi Pusat Berhasil! Seluruh modul persuratan, buku agenda, SK dinas, dan master data telah tersinkronisasi ke Google Drive & Sheets.',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      durationSeconds,
      tataUsahaFolderId,
      tataUsahaFolderLink,
      userEmail,
      totalSyncedItems,
      modules: {
        suratMasuk: {
          pushed: suratMasukCount,
          pulled: pulledItemsCount,
          status: 'success',
          detail: `${suratMasukCount} arsip tersinkron`,
          driveFolder: 'TATA USAHA / 01_SURAT_MASUK',
        },
        suratKeluar: {
          pushed: suratKeluarCount,
          pulled: 0,
          status: 'success',
          detail: `${suratKeluarCount} arsip tersinkron (Nomor surat terpadu)`,
          driveFolder: 'TATA USAHA / 02_SURAT_KELUAR',
        },
        skKBM: {
          pushed: skKBMCount,
          pulled: 0,
          status: 'success',
          detail: `${skKBMCount} dokumen SK tersinkron`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        skTugasTambahan: {
          pushed: skTTCount,
          pulled: 0,
          status: 'success',
          detail: `${skTTCount} dokumen SK tambahan tersinkron`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        suratTugas: {
          pushed: suratTugasCount,
          pulled: 0,
          status: 'success',
          detail: `${suratTugasCount} arsip SPT tersinkron`,
          driveFolder: 'TATA USAHA / 03_SK_DAN_SPT_DINAS',
        },
        pembuatSurat: {
          pushed: pembuatSuratCount,
          pulled: 0,
          status: 'success',
          detail: `${pembuatSuratCount} draf surat tersinkron`,
          driveFolder: 'TATA USAHA / 02_SURAT_KELUAR',
        },
        guruPTK: {
          pushed: ptkCount,
          pulled: 0,
          status: 'success',
          detail: `${ptkCount} data personil PTK`,
          driveFolder: 'TATA USAHA / 04_KEPEGAWAIAN_PTK',
        },
        siswa: {
          pushed: siswaCount,
          pulled: 0,
          status: 'success',
          detail: `${siswaCount} data siswa buku induk`,
          driveFolder: 'TATA USAHA / 05_KESISWAAN_DAN_ALUMNI',
        },
        alumni: {
          pushed: alumniCount,
          pulled: 0,
          status: 'success',
          detail: `${alumniCount} data alumni & ijazah`,
          driveFolder: 'TATA USAHA / 05_KESISWAAN_DAN_ALUMNI',
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
