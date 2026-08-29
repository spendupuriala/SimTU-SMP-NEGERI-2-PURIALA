import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SuratMasukModule } from './components/SuratMasukModule';
import { SuratKeluarModule } from './components/SuratKeluarModule';
import { BukuAgendaModule } from './components/BukuAgendaModule';
import { SKKBMModule } from './components/SKKBMModule';
import { SKTugasTambahanModule } from './components/SKTugasTambahanModule';
import { SuratTugasDinasModule } from './components/SuratTugasDinasModule';
import { PembuatSuratModule } from './components/PembuatSuratModule';
import { BukuIndukModule } from './components/BukuIndukModule';
import { PPDBRaporModule } from './components/PPDBRaporModule';
import { AlumniIjazahModule } from './components/AlumniIjazahModule';
import { GuruPTKModule } from './components/GuruPTKModule';
import { DriveExplorerModule } from './components/DriveExplorerModule';
import { PengaturanModule } from './components/PengaturanModule';

import {
  ActiveTab,
  DatabaseState,
  SuratMasuk,
  SuratKeluar,
  SKKBM,
  SKTugasTambahan,
  SuratTugasDinas,
  PembuatSuratRecord,
  Siswa,
  AlumniIjazah,
  GuruPTK,
  DriveFolder,
  DriveFile,
  IdentitasSekolah,
  KodeKlasifikasiSurat,
} from './types';
import { getStoredData, saveStoredData, resetToInitialData } from './utils/storage';
import { DEFAULT_KODE_KLASIFIKASI, fetchKodeKlasifikasiFromSheet } from './services/googleSheets';
import {
  upsertSuratTugasInSuratKeluar,
  upsertPembuatSuratInSuratKeluar,
  removeModuleFromSuratKeluar,
  syncAllModulesToSuratKeluar,
} from './utils/syncPersuratan';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setAccessToken,
  invalidateGoogleAuth,
} from './services/googleAuth';
import {
  getDriveQuotaAndUser,
  uploadDatabaseBackupToDrive,
  syncLiveDatabaseToTataUsahaFolder,
  GoogleDriveQuota,
} from './services/googleDrive';

export default function App() {
  const [data, setData] = useState<DatabaseState>(getStoredData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Kode Klasifikasi Master List (Synchronized across Surat Keluar, Surat Tugas, Pembuat Surat)
  const [kodeKlasifikasiList, setKodeKlasifikasiList] = useState<KodeKlasifikasiSurat[]>(DEFAULT_KODE_KLASIFIKASI);

  // Google Auth & Drive State
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [driveQuota, setDriveQuota] = useState<GoogleDriveQuota | null>(null);

  // Auto-sync status to Google Drive Folder "TATA USAHA"
  const [autoSyncStatus, setAutoSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const isFirstSyncRef = React.useRef(true);

  // Show Toast helper
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info', duration: number = 3500) => {
    setSyncToast({ message, type });
    setTimeout(() => {
      setSyncToast(null);
    }, duration);
  };

  // Synchronize state changes to localStorage
  const updateData = (newData: DatabaseState) => {
    setData(newData);
    saveStoredData(newData);
  };

  // Refresh Google Drive Quota info
  const refreshQuota = useCallback(async (token: string) => {
    if (!token) return;
    try {
      const quota = await getDriveQuotaAndUser(token);
      setDriveQuota(quota);
    } catch (err: any) {
      if (err?.message?.includes('AUTH_EXPIRED') || err?.message?.includes('invalid authentication credentials')) {
        invalidateGoogleAuth();
        setGoogleToken(null);
        setGoogleUser(null);
        setDriveQuota(null);
        setAutoSyncStatus('idle');
      } else {
        console.warn('Could not fetch Google Drive quota:', err);
      }
    }
  }, []);

  // Initialize Firebase Auth listener (Auto-connects to Drive on mount if session exists)
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setAccessToken(token);
        refreshQuota(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setAccessToken(null);
        setDriveQuota(null);
        setAutoSyncStatus('idle');
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [refreshQuota]);

  // REAL-TIME AUTO-SYNC: Sync every state update directly to Google Drive Folder "TATA USAHA"
  useEffect(() => {
    if (!googleToken) {
      setAutoSyncStatus('idle');
      return;
    }

    // Initial sync when token becomes available
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      syncLiveDatabaseToTataUsahaFolder(googleToken, data)
        .then(() => {
          setAutoSyncStatus('synced');
          setLastSyncedTime(new Date().toLocaleTimeString('id-ID'));
        })
        .catch((e: any) => {
          if (e?.message?.includes('AUTH_EXPIRED') || e?.message?.includes('invalid authentication credentials')) {
            invalidateGoogleAuth();
            setGoogleToken(null);
            setGoogleUser(null);
            setAutoSyncStatus('idle');
          } else {
            console.warn('Initial Tata Usaha drive sync:', e);
          }
        });
      return;
    }

    // Debounced sync for continuous modifications (e.g. Surat Masuk & Surat Keluar edits)
    setAutoSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        await syncLiveDatabaseToTataUsahaFolder(googleToken, data);
        setAutoSyncStatus('synced');
        setLastSyncedTime(new Date().toLocaleTimeString('id-ID'));
      } catch (err: any) {
        if (err?.message?.includes('AUTH_EXPIRED') || err?.message?.includes('invalid authentication credentials')) {
          invalidateGoogleAuth();
          setGoogleToken(null);
          setGoogleUser(null);
          setAutoSyncStatus('idle');
        } else {
          console.error('Auto sync to Google Drive folder TATA USAHA failed:', err);
          setAutoSyncStatus('error');
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data, googleToken]);

  // Initial Sync: Pastikan Surat Tugas dan Pembuat Surat tersinkronisasi ke Buku Agenda Surat Keluar saat aplikasi dimuat
  useEffect(() => {
    if ((data.suratTugas && data.suratTugas.length > 0) || (data.pembuatSurat && data.pembuatSurat.length > 0)) {
      const syncedSuratKeluar = syncAllModulesToSuratKeluar(
        data.suratKeluar || [],
        data.suratTugas || [],
        data.pembuatSurat || [],
        data.identitasSekolah
      );

      // Cek apakah ada perubahan jumlah / isi entri
      if (syncedSuratKeluar.length !== (data.suratKeluar || []).length) {
        const updated = {
          ...data,
          suratKeluar: syncedSuratKeluar,
        };
        setData(updated);
        saveStoredData(updated);
      }
    }
  }, []);

  // Connect Google Drive
  const handleConnectGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        await refreshQuota(res.accessToken);
        // Immediately sync to TATA USAHA folder
        await syncLiveDatabaseToTataUsahaFolder(res.accessToken, data);
        setAutoSyncStatus('synced');
        setLastSyncedTime(new Date().toLocaleTimeString('id-ID'));
        showToast(
          `Google Drive Terhubung! Data disinkronkan ke Folder "TATA USAHA" (Akun: ${res.user.email || 'Sekolah'})`,
          'success'
        );
      }
    } catch (error: any) {
      const errorCode = error?.code || '';
      const errorMsg = error?.message || '';
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorMsg.includes('popup-closed-by-user') ||
        errorMsg.includes('cancelled-popup-request')
      ) {
        // User voluntarily closed popup, ignore
        return;
      }
      console.error('Login error:', error);
      showToast(`Gagal menghubungkan Google Drive: ${error?.message || 'Login gagal'}`, 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Disconnect Google Drive
  const handleDisconnectGoogle = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setDriveQuota(null);
      setAutoSyncStatus('idle');
      showToast('Koneksi Google Drive telah diputuskan.', 'info');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // Cloud Synchronization: Backs up to Google Drive if connected
  const handleSync = async () => {
    setIsSyncing(true);
    showToast('Sedang memperbarui data ke Folder "TATA USAHA" di Google Drive...', 'info', 2000);

    try {
      if (googleToken) {
        await syncLiveDatabaseToTataUsahaFolder(googleToken, data);
        const backupResult = await uploadDatabaseBackupToDrive(googleToken, data);
        await refreshQuota(googleToken);
        setAutoSyncStatus('synced');
        setLastSyncedTime(new Date().toLocaleTimeString('id-ID'));
        showToast(
          `Sinkronisasi Berhasil! Database terupdate di Folder "TATA USAHA" & Cadangan: ${backupResult.name}`,
          'success',
          4000
        );
      } else {
        // Local state sync simulation when not logged in
        setTimeout(() => {
          showToast(
            'Sinkronisasi Lokal Selesai. Hubungkan Google Drive untuk pencadangan cloud otomatis ke Folder TATA USAHA.',
            'info',
            3500
          );
        }, 1000);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      showToast(`Gagal sinkronisasi ke Google Drive: ${err?.message}`, 'error', 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Surat Masuk CRUD
  const handleAddSuratMasuk = (surat: SuratMasuk) => {
    const updated = {
      ...data,
      suratMasuk: [...data.suratMasuk, surat],
    };
    updateData(updated);
  };

  const handleBatchSuratMasuk = (newList: SuratMasuk[], mode: 'replace' | 'merge') => {
    let updatedList: SuratMasuk[];
    if (mode === 'replace') {
      updatedList = newList;
    } else {
      // Merge by noSurat
      const existingNoSuratSet = new Set(data.suratMasuk.map((s) => s.noSurat.toLowerCase().trim()));
      const filteredNew = newList.filter((s) => !existingNoSuratSet.has(s.noSurat.toLowerCase().trim()));
      updatedList = [...data.suratMasuk, ...filteredNew];
    }
    const updated = {
      ...data,
      suratMasuk: updatedList,
    };
    updateData(updated);
  };

  const handleUpdateSuratMasuk = (surat: SuratMasuk) => {
    const updated = {
      ...data,
      suratMasuk: data.suratMasuk.map((s) => (s.id === surat.id ? surat : s)),
    };
    updateData(updated);
  };

  const handleDeleteSuratMasuk = (id: string) => {
    const updated = {
      ...data,
      suratMasuk: data.suratMasuk.filter((s) => s.id !== id),
    };
    updateData(updated);
  };

  // Surat Keluar CRUD
  const handleAddSuratKeluar = (surat: SuratKeluar) => {
    const updated = {
      ...data,
      suratKeluar: [...data.suratKeluar, surat],
    };
    updateData(updated);
  };

  const handleBatchSuratKeluar = (newList: SuratKeluar[], mode: 'replace' | 'merge') => {
    let updatedList: SuratKeluar[];
    if (mode === 'replace') {
      updatedList = newList;
    } else {
      // Merge by noSurat
      const existingNoSuratSet = new Set(data.suratKeluar.map((s) => s.noSurat.toLowerCase().trim()));
      const filteredNew = newList.filter((s) => !existingNoSuratSet.has(s.noSurat.toLowerCase().trim()));
      updatedList = [...data.suratKeluar, ...filteredNew];
    }
    const updated = {
      ...data,
      suratKeluar: updatedList,
    };
    updateData(updated);
  };

  const handleUpdateSuratKeluar = (surat: SuratKeluar) => {
    const updated = {
      ...data,
      suratKeluar: data.suratKeluar.map((s) => (s.id === surat.id ? surat : s)),
    };
    updateData(updated);
  };

  const handleDeleteSuratKeluar = (id: string) => {
    const updated = {
      ...data,
      suratKeluar: data.suratKeluar.filter((s) => s.id !== id),
    };
    updateData(updated);
  };

  // SK KBM CRUD
  const handleAddSKKBM = (sk: SKKBM) => {
    const updated = {
      ...data,
      skKBM: [sk, ...data.skKBM],
    };
    updateData(updated);
  };

  const handleUpdateSKKBM = (sk: SKKBM) => {
    const updated = {
      ...data,
      skKBM: data.skKBM.map((item) => (item.id === sk.id ? sk : item)),
    };
    updateData(updated);
  };

  const handleDeleteSKKBM = (id: string) => {
    const updated = {
      ...data,
      skKBM: data.skKBM.filter((item) => item.id !== id),
    };
    updateData(updated);
  };

  // SK Tugas Tambahan CRUD
  const handleAddSKTT = (sk: SKTugasTambahan) => {
    const updated = {
      ...data,
      skTugasTambahan: [sk, ...data.skTugasTambahan],
    };
    updateData(updated);
  };

  const handleUpdateSKTT = (sk: SKTugasTambahan) => {
    const updated = {
      ...data,
      skTugasTambahan: data.skTugasTambahan.map((item) => (item.id === sk.id ? sk : item)),
    };
    updateData(updated);
  };

  const handleDeleteSKTT = (id: string) => {
    const updated = {
      ...data,
      skTugasTambahan: data.skTugasTambahan.filter((item) => item.id !== id),
    };
    updateData(updated);
  };

  const handleReorderSKTT = (newList: SKTugasTambahan[]) => {
    const updated = {
      ...data,
      skTugasTambahan: newList,
    };
    updateData(updated);
  };

  // Surat Tugas Dinas CRUD (Synchronized with Surat Keluar agenda)
  const handleAddSuratTugas = (item: SuratTugasDinas) => {
    const updatedSuratKeluar = upsertSuratTugasInSuratKeluar(data.suratKeluar, item, data.identitasSekolah);
    const updated = {
      ...data,
      suratTugas: [item, ...data.suratTugas],
      suratKeluar: updatedSuratKeluar,
    };
    updateData(updated);
    showToast(`Surat Tugas "${item.noSuratTugas}" tersinkronisasi ke Buku Agenda Surat Keluar`, 'success');
  };

  const handleUpdateSuratTugas = (item: SuratTugasDinas) => {
    const updatedSuratKeluar = upsertSuratTugasInSuratKeluar(data.suratKeluar, item, data.identitasSekolah);
    const updated = {
      ...data,
      suratTugas: data.suratTugas.map((t) => (t.id === item.id ? item : t)),
      suratKeluar: updatedSuratKeluar,
    };
    updateData(updated);
    showToast(`Surat Tugas "${item.noSuratTugas}" berhasil diperbarui dan disinkronkan`, 'info');
  };

  const handleDeleteSuratTugas = (id: string) => {
    const updatedSuratKeluar = removeModuleFromSuratKeluar(data.suratKeluar, id);
    const updated = {
      ...data,
      suratTugas: data.suratTugas.filter((t) => t.id !== id),
      suratKeluar: updatedSuratKeluar,
    };
    updateData(updated);
    showToast('Surat Tugas berhasil dihapus dari arsip dan agenda keluar', 'info');
  };

  // Pembuat Surat CRUD (Synchronized with Surat Keluar agenda)
  const handleAddPembuatSurat = (surat: PembuatSuratRecord) => {
    const updatedSuratKeluar = upsertPembuatSuratInSuratKeluar(data.suratKeluar, surat, data.identitasSekolah);
    const updated = {
      ...data,
      pembuatSurat: [surat, ...(data.pembuatSurat || [])],
      suratKeluar: updatedSuratKeluar,
    };
    updateData(updated);
    showToast(`Dokumen "${surat.noSurat}" tersinkronisasi ke Buku Agenda Surat Keluar`, 'success');
  };

  const handleUpdatePembuatSurat = (surat: PembuatSuratRecord) => {
    const updatedSuratKeluar = upsertPembuatSuratInSuratKeluar(data.suratKeluar, surat, data.identitasSekolah);
    const updated = {
      ...data,
      pembuatSurat: (data.pembuatSurat || []).map((s) => (s.id === surat.id ? surat : s)),
      suratKeluar: updatedSuratKeluar,
    };
    updateData(updated);
    showToast(`Dokumen "${surat.noSurat}" berhasil diperbarui dan disinkronkan`, 'info');
  };

  const handleDeletePembuatSurat = (id: string) => {
    const updatedSuratKeluar = removeModuleFromSuratKeluar(data.suratKeluar, id);
    const updated = {
      ...data,
      pembuatSurat: (data.pembuatSurat || []).filter((s) => s.id !== id),
      suratKeluar: updatedSuratKeluar,
    };
    updateData(updated);
    showToast('Dokumen berhasil dihapus dari pembuat surat dan agenda keluar', 'info');
  };

  // Siswa CRUD
  const handleAddSiswa = (siswa: Siswa) => {
    const updated = {
      ...data,
      siswa: [siswa, ...data.siswa],
    };
    updateData(updated);
  };

  const handleUpdateSiswa = (siswa: Siswa) => {
    const updated = {
      ...data,
      siswa: data.siswa.map((s) => (s.id === siswa.id ? siswa : s)),
    };
    updateData(updated);
  };

  const handleDeleteSiswa = (id: string) => {
    const updated = {
      ...data,
      siswa: data.siswa.filter((s) => s.id !== id),
    };
    updateData(updated);
  };

  // Alumni CRUD
  const handleAddAlumni = (alumni: AlumniIjazah) => {
    const updated = {
      ...data,
      alumni: [alumni, ...data.alumni],
    };
    updateData(updated);
  };

  const handleUpdateAlumni = (alumni: AlumniIjazah) => {
    const updated = {
      ...data,
      alumni: data.alumni.map((a) => (a.id === alumni.id ? alumni : a)),
    };
    updateData(updated);
  };

  const handleDeleteAlumni = (id: string) => {
    const updated = {
      ...data,
      alumni: data.alumni.filter((a) => a.id !== id),
    };
    updateData(updated);
  };

  // PTK CRUD
  const handleAddGuru = (guru: GuruPTK) => {
    const updated = {
      ...data,
      guruPTK: [guru, ...data.guruPTK],
    };
    updateData(updated);
  };

  const handleUpdateGuru = (guru: GuruPTK) => {
    const updated = {
      ...data,
      guruPTK: data.guruPTK.map((g) => (g.id === guru.id ? guru : g)),
    };
    updateData(updated);
  };

  const handleDeleteGuru = (id: string) => {
    const updated = {
      ...data,
      guruPTK: data.guruPTK.filter((g) => g.id !== id),
    };
    updateData(updated);
  };

  const handleReorderGuru = (newList: GuruPTK[]) => {
    const updated = {
      ...data,
      guruPTK: newList,
    };
    updateData(updated);
  };

  // Drive CRUD (Local)
  const handleAddFolder = (folder: DriveFolder) => {
    const updated = {
      ...data,
      driveFolders: [...data.driveFolders, folder],
    };
    updateData(updated);
  };

  const handleAddFileToFolder = (folderId: string, file: DriveFile) => {
    const updated = {
      ...data,
      driveFolders: data.driveFolders.map((f) => {
        if (f.id === folderId) {
          return {
            ...f,
            jumlahFile: f.jumlahFile + 1,
            files: [...f.files, file],
          };
        }
        return f;
      }),
    };
    updateData(updated);
  };

  // Identitas Sekolah Update
  const handleUpdateIdentitas = (identitas: IdentitasSekolah) => {
    const updated = {
      ...data,
      identitasSekolah: identitas,
    };
    updateData(updated);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang basis data ke data standar SMP Negeri 2 Puriala?')) {
      const initial = resetToInitialData();
      setData(initial);
      showToast('Basis data berhasil dikembalikan ke standar awal!', 'info');
    }
  };

  // Global search trigger
  const handleSearchSubmit = (term: string) => {
    setSearchQuery(term);
    const low = term.toLowerCase();
    if (low.includes('masuk') || low.includes('dinas')) {
      setActiveTab('surat-masuk');
    } else if (low.includes('keluar') || low.includes('undangan')) {
      setActiveTab('surat-keluar');
    } else if (low.includes('siswa') || low.includes('nisn')) {
      setActiveTab('buku-induk');
    } else if (low.includes('guru') || low.includes('ptk')) {
      setActiveTab('guru-ptk');
    } else if (low.includes('sk') || low.includes('kbm')) {
      setActiveTab('sk-kbm');
    } else if (low.includes('buat') || low.includes('pembuat') || low.includes('keterangan') || low.includes('rekomendasi')) {
      setActiveTab('pembuat-surat');
    } else if (low.includes('drive') || low.includes('file') || low.includes('arsip')) {
      setActiveTab('drive-explorer');
    }
  };

  const isGoogleConnected = Boolean(googleUser && googleToken);

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden text-slate-800">
      {/* Toast Notification */}
      {syncToast && (
        <div
          className={`fixed top-4 right-4 z-50 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 border transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
            syncToast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50'
              : syncToast.type === 'error'
              ? 'bg-rose-950 border-rose-500/50'
              : 'bg-slate-900 border-blue-500/50'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              syncToast.type === 'success'
                ? 'bg-emerald-400 animate-ping'
                : syncToast.type === 'error'
                ? 'bg-rose-400 animate-pulse'
                : 'bg-blue-400 animate-ping'
            }`}
          ></div>
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        counts={{
          suratMasuk: data.suratMasuk.length,
          suratKeluar: data.suratKeluar.length,
          siswa: data.siswa.length,
          guru: data.guruPTK.length,
          pembuatSurat: (data.pembuatSurat || []).length,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          identitasSekolah={data.identitasSekolah}
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSync={handleSync}
          isSyncing={isSyncing}
          onSearch={handleSearchSubmit}
          googleUser={googleUser}
          isGoogleConnected={isGoogleConnected}
          isGoogleLoading={isGoogleLoading}
          driveQuota={driveQuota}
          onConnectGoogle={handleConnectGoogle}
          onDisconnectGoogle={handleDisconnectGoogle}
          autoSyncStatus={autoSyncStatus}
          lastSyncedTime={lastSyncedTime}
        />

        {/* Dynamic Module Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 light-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                data={data}
                onNavigate={(tab) => setActiveTab(tab)}
                isGoogleConnected={isGoogleConnected}
                googleUser={googleUser}
                driveQuota={driveQuota}
                onConnectGoogle={handleConnectGoogle}
              />
            )}

            {activeTab === 'surat-masuk' && (
              <SuratMasukModule
                suratList={data.suratMasuk}
                onAdd={handleAddSuratMasuk}
                onUpdate={handleUpdateSuratMasuk}
                onDelete={handleDeleteSuratMasuk}
                identitasSekolah={data.identitasSekolah}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleConnected={isGoogleConnected}
                isGoogleLoading={isGoogleLoading}
                onConnectGoogle={handleConnectGoogle}
                onBatchUpdate={handleBatchSuratMasuk}
              />
            )}

            {activeTab === 'surat-keluar' && (
              <SuratKeluarModule
                suratList={data.suratKeluar}
                onAdd={handleAddSuratKeluar}
                onUpdate={handleUpdateSuratKeluar}
                onDelete={handleDeleteSuratKeluar}
                identitasSekolah={data.identitasSekolah}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleConnected={isGoogleConnected}
                isGoogleLoading={isGoogleLoading}
                onConnectGoogle={handleConnectGoogle}
                onBatchUpdate={handleBatchSuratKeluar}
                kodeKlasifikasiList={kodeKlasifikasiList}
              />
            )}

            {activeTab === 'buku-agenda' && (
              <BukuAgendaModule
                suratMasuk={data.suratMasuk}
                suratKeluar={data.suratKeluar}
                identitasSekolah={data.identitasSekolah}
              />
            )}

            {activeTab === 'sk-kbm' && (
              <SKKBMModule
                skList={data.skKBM}
                onAdd={handleAddSKKBM}
                onUpdate={handleUpdateSKKBM}
                onDelete={handleDeleteSKKBM}
                identitasSekolah={data.identitasSekolah}
                guruPTKList={data.guruPTK}
                googleToken={googleToken}
                googleUser={googleUser}
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
              />
            )}

            {activeTab === 'sk-tugas-tambahan' && (
              <SKTugasTambahanModule
                skList={data.skTugasTambahan}
                onAdd={handleAddSKTT}
                onUpdate={handleUpdateSKTT}
                onDelete={handleDeleteSKTT}
                onReorder={handleReorderSKTT}
                identitasSekolah={data.identitasSekolah}
                guruPTKList={data.guruPTK}
                googleToken={googleToken}
                googleUser={googleUser}
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
              />
            )}

            {activeTab === 'surat-tugas' && (
              <SuratTugasDinasModule
                tugasList={data.suratTugas}
                onAdd={handleAddSuratTugas}
                onUpdate={handleUpdateSuratTugas}
                onDelete={handleDeleteSuratTugas}
                identitasSekolah={data.identitasSekolah}
                guruPTKList={data.guruPTK}
                googleToken={googleToken}
                googleUser={googleUser}
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
                kodeKlasifikasiList={kodeKlasifikasiList}
              />
            )}

            {activeTab === 'pembuat-surat' && (
              <PembuatSuratModule
                suratList={data.pembuatSurat || []}
                suratKeluarList={data.suratKeluar || []}
                suratTugasList={data.suratTugas || []}
                onAdd={handleAddPembuatSurat}
                onUpdate={handleUpdatePembuatSurat}
                onDelete={handleDeletePembuatSurat}
                identitasSekolah={data.identitasSekolah}
                siswaList={data.siswa}
                guruPTKList={data.guruPTK}
                googleToken={googleToken}
                googleUser={googleUser}
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
                kodeKlasifikasiList={kodeKlasifikasiList}
              />
            )}

            {activeTab === 'buku-induk' && (
              <BukuIndukModule
                siswaList={data.siswa}
                onAdd={handleAddSiswa}
                onUpdate={handleUpdateSiswa}
                onDelete={handleDeleteSiswa}
                identitasSekolah={data.identitasSekolah}
              />
            )}

            {activeTab === 'ppdb-rapor' && (
              <PPDBRaporModule identitasSekolah={data.identitasSekolah} />
            )}

            {activeTab === 'alumni-ijazah' && (
              <AlumniIjazahModule
                alumniList={data.alumni}
                onAdd={handleAddAlumni}
                onUpdate={handleUpdateAlumni}
                onDelete={handleDeleteAlumni}
                identitasSekolah={data.identitasSekolah}
              />
            )}

            {activeTab === 'guru-ptk' && (
              <GuruPTKModule
                guruList={data.guruPTK}
                onAdd={handleAddGuru}
                onUpdate={handleUpdateGuru}
                onDelete={handleDeleteGuru}
                onReorder={handleReorderGuru}
                identitasSekolah={data.identitasSekolah}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleConnected={isGoogleConnected}
                isGoogleLoading={isGoogleLoading}
                onConnectGoogle={handleConnectGoogle}
                onBatchUpdate={(newList) => {
                  updateData({ ...data, guruPTK: newList });
                  showToast(`Berhasil memperbarui ${newList.length} data Guru & PTK dari Google Drive!`, 'success');
                }}
              />
            )}

            {activeTab === 'drive-explorer' && (
              <DriveExplorerModule
                folders={data.driveFolders}
                onAddFolder={handleAddFolder}
                onAddFile={handleAddFileToFolder}
                identitasSekolah={data.identitasSekolah}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleConnected={isGoogleConnected}
                isGoogleLoading={isGoogleLoading}
                driveQuota={driveQuota}
                onConnectGoogle={handleConnectGoogle}
                onDisconnectGoogle={handleDisconnectGoogle}
                databaseState={data}
                onUpdateDatabase={(updated) => {
                  updateData(updated);
                  showToast('Sinkronisasi Pusat berhasil memperbarui basis data lokal!', 'success');
                }}
              />
            )}

            {activeTab === 'pengaturan' && (
              <PengaturanModule
                identitasSekolah={data.identitasSekolah}
                onUpdateIdentitas={handleUpdateIdentitas}
                onResetData={handleResetData}
                googleUser={googleUser}
                googleToken={googleToken}
                isGoogleConnected={isGoogleConnected}
                isGoogleLoading={isGoogleLoading}
                driveQuota={driveQuota}
                onConnectGoogle={handleConnectGoogle}
                onDisconnectGoogle={handleDisconnectGoogle}
                databaseState={data}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
