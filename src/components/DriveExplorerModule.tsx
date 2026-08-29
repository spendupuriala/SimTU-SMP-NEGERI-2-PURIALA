import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Folder,
  FolderPlus,
  FileText,
  File,
  Search,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  Home,
  Cloud,
  CheckCircle2,
  Clock,
  Sparkles,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  MoreVertical,
  X,
  LogIn,
  LogOut,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Database,
  Layers,
  ArrowDownUp,
  RefreshCw,
  Check,
  Loader2,
  FileCheck2,
  Workflow,
  Cpu,
} from 'lucide-react';
import { DriveFolder, DriveFile, IdentitasSekolah, DatabaseState } from '../types';
import {
  GoogleDriveFile,
  GoogleDriveQuota,
  listGoogleDriveFiles,
  createGoogleDriveFolder,
  uploadFileToGoogleDrive,
  uploadDatabaseBackupToDrive,
  deleteGoogleDriveFile,
  findOrCreateAppRootFolder,
  findOrCreateTataUsahaFolder,
} from '../services/googleDrive';
import {
  runCentralSync,
  CentralSyncProgress,
  CentralSyncReport,
  INITIAL_SYNC_STEPS,
} from '../services/centralSync';

interface DriveExplorerModuleProps {
  folders: DriveFolder[];
  onAddFolder: (folder: DriveFolder) => void;
  onAddFile: (folderId: string, file: DriveFile) => void;
  identitasSekolah: IdentitasSekolah;
  // Google Drive integration props
  googleUser: any | null;
  googleToken: string | null;
  isGoogleConnected: boolean;
  isGoogleLoading: boolean;
  driveQuota: GoogleDriveQuota | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  databaseState: DatabaseState;
  onUpdateDatabase?: (updatedState: DatabaseState) => void;
}

export const DriveExplorerModule: React.FC<DriveExplorerModuleProps> = ({
  folders,
  onAddFolder,
  onAddFile,
  identitasSekolah,
  googleUser,
  googleToken,
  isGoogleConnected,
  isGoogleLoading,
  driveQuota,
  onConnectGoogle,
  onDisconnectGoogle,
  databaseState,
  onUpdateDatabase,
}) => {
  // Mode: 'google-drive' vs 'local-drive'
  const [driveMode, setDriveMode] = useState<'google-drive' | 'local-drive'>('google-drive');

  // Google Drive states
  const [gDriveFiles, setGDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [gDriveLoading, setGDriveLoading] = useState(false);
  const [gDriveError, setGDriveError] = useState<string | null>(null);
  const [currentGDriveFolderId, setCurrentGDriveFolderId] = useState<string | null>(null);
  const [gDriveFolderPath, setGDriveFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Google Drive Utama' },
  ]);
  const [gDriveSearch, setGDriveSearch] = useState('');
  const [isBackupSuccess, setIsBackupSuccess] = useState(false);
  const [backupFileName, setBackupFileName] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Central Sync States (Pusat Sinkronisasi SimTU)
  const [isCentralSyncModalOpen, setIsCentralSyncModalOpen] = useState(false);
  const [isCentralSyncRunning, setIsCentralSyncRunning] = useState(false);
  const [centralSyncProgress, setCentralSyncProgress] = useState<CentralSyncProgress>({
    currentStep: 1,
    totalSteps: INITIAL_SYNC_STEPS.length,
    percent: 0,
    currentStepTitle: INITIAL_SYNC_STEPS[0].title,
    currentStepDetail: INITIAL_SYNC_STEPS[0].detail,
    steps: INITIAL_SYNC_STEPS,
  });
  const [centralSyncReport, setCentralSyncReport] = useState<CentralSyncReport | null>(null);
  const [centralSyncError, setCentralSyncError] = useState<string | null>(null);

  // Modals for Google Drive
  const [isNewGDriveFolderOpen, setIsNewGDriveFolderOpen] = useState(false);
  const [newGDriveFolderName, setNewGDriveFolderName] = useState('');
  const [isUploadGDriveOpen, setIsUploadGDriveOpen] = useState(false);
  const [uploadGDriveFile, setUploadGDriveFile] = useState<File | null>(null);
  const [isUploadingGDrive, setIsUploadingGDrive] = useState(false);

  // Delete Confirmation Modal
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local Drive states
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileForm, setNewFileForm] = useState({
    nama: '',
    tipe: 'pdf',
    ukuran: '1.4 MB',
    kategori: 'Surat',
  });

  // Fetch Google Drive files whenever token or current folder changes
  const fetchGDriveFiles = async (folderId?: string | null, search?: string) => {
    if (!googleToken) return;
    setGDriveLoading(true);
    setGDriveError(null);
    try {
      const files = await listGoogleDriveFiles(googleToken, folderId, search);
      setGDriveFiles(files);
    } catch (err: any) {
      console.error('Error fetching Google Drive files:', err);
      setGDriveError(err?.message || 'Gagal mengambil berkas dari Google Drive');
    } finally {
      setGDriveLoading(false);
    }
  };

  useEffect(() => {
    if (googleToken && isGoogleConnected) {
      fetchGDriveFiles(currentGDriveFolderId, gDriveSearch);
    }
  }, [googleToken, isGoogleConnected, currentGDriveFolderId]);

  // Navigate to Google Drive Folder
  const handleOpenGDriveFolder = (folder: GoogleDriveFile) => {
    setCurrentGDriveFolderId(folder.id);
    setGDriveFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateGDriveBreadcrumb = (index: number) => {
    const target = gDriveFolderPath[index];
    setCurrentGDriveFolderId(target.id);
    setGDriveFolderPath((prev) => prev.slice(0, index + 1));
  };

  // Create folder in Google Drive
  const handleCreateGDriveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGDriveFolderName.trim() || !googleToken) return;
    try {
      setGDriveLoading(true);
      await createGoogleDriveFolder(googleToken, newGDriveFolderName.trim(), currentGDriveFolderId);
      setNewGDriveFolderName('');
      setIsNewGDriveFolderOpen(false);
      await fetchGDriveFiles(currentGDriveFolderId, gDriveSearch);
    } catch (err: any) {
      alert(`Gagal membuat folder di Google Drive: ${err?.message}`);
    } finally {
      setGDriveLoading(false);
    }
  };

  // Upload file directly to Google Drive
  const handleUploadToGDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadGDriveFile || !googleToken) {
      alert('Pilih berkas dari komputer terlebih dahulu!');
      return;
    }
    try {
      setIsUploadingGDrive(true);
      await uploadFileToGoogleDrive(
        googleToken,
        uploadGDriveFile,
        uploadGDriveFile.name,
        uploadGDriveFile.type || 'application/octet-stream',
        currentGDriveFolderId
      );
      setUploadGDriveFile(null);
      setIsUploadGDriveOpen(false);
      await fetchGDriveFiles(currentGDriveFolderId, gDriveSearch);
    } catch (err: any) {
      alert(`Gagal mengunggah ke Google Drive: ${err?.message}`);
    } finally {
      setIsUploadingGDrive(false);
    }
  };

  // Central Synchronization Engine (Pusat Sinkronisasi SimTU)
  const handleRunCentralSync = async () => {
    if (!googleToken) {
      onConnectGoogle();
      return;
    }

    setIsCentralSyncModalOpen(true);
    setIsCentralSyncRunning(true);
    setCentralSyncError(null);
    setCentralSyncReport(null);
    setCentralSyncProgress({
      currentStep: 1,
      totalSteps: INITIAL_SYNC_STEPS.length,
      percent: 5,
      currentStepTitle: INITIAL_SYNC_STEPS[0].title,
      currentStepDetail: INITIAL_SYNC_STEPS[0].detail,
      steps: JSON.parse(JSON.stringify(INITIAL_SYNC_STEPS)),
    });

    try {
      const result = await runCentralSync(googleToken, databaseState, (progress) => {
        setCentralSyncProgress(progress);
      });

      setCentralSyncReport(result.report);
      if (onUpdateDatabase) {
        onUpdateDatabase(result.updatedData);
      }
      // Refresh current Google Drive directory listing
      await fetchGDriveFiles(currentGDriveFolderId, gDriveSearch);
    } catch (err: any) {
      console.error('Central Sync failed:', err);
      setCentralSyncError(err?.message || 'Gagal melaksanakan sinkronisasi pusat ke Google Drive');
    } finally {
      setIsCentralSyncRunning(false);
    }
  };

  // Instant Database Backup to Google Drive
  const handleBackupDatabaseToGDrive = async () => {
    if (!googleToken) {
      alert('Silakan hubungkan akun Google Drive terlebih dahulu!');
      return;
    }
    try {
      setIsBackingUp(true);
      const res = await uploadDatabaseBackupToDrive(googleToken, databaseState, currentGDriveFolderId);
      setBackupFileName(res.name);
      setIsBackupSuccess(true);
      setTimeout(() => setIsBackupSuccess(false), 5000);
      await fetchGDriveFiles(currentGDriveFolderId, gDriveSearch);
    } catch (err: any) {
      alert(`Gagal mencadangkan database ke Google Drive: ${err?.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Quick jump directly to Folder TATA USAHA
  const handleJumpToTataUsahaFolder = async () => {
    if (!googleToken) return;
    try {
      setGDriveLoading(true);
      const folderId = await findOrCreateTataUsahaFolder(googleToken, 'TATA USAHA');
      setCurrentGDriveFolderId(folderId);
      setGDriveFolderPath([
        { id: null, name: 'Google Drive Utama' },
        { id: folderId, name: 'TATA USAHA (Sinkronisasi Otomatis)' },
      ]);
      await fetchGDriveFiles(folderId);
    } catch (err: any) {
      alert(`Gagal membuka folder TATA USAHA: ${err?.message}`);
    } finally {
      setGDriveLoading(false);
    }
  };

  // Delete file from Google Drive (with explicit confirmation)
  const confirmDeleteGDriveFile = async () => {
    if (!fileToDelete || !googleToken) return;
    try {
      setIsDeleting(true);
      await deleteGoogleDriveFile(googleToken, fileToDelete.id);
      setFileToDelete(null);
      await fetchGDriveFiles(currentGDriveFolderId, gDriveSearch);
    } catch (err: any) {
      alert(`Gagal menghapus berkas: ${err?.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Local Drive Handlers
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newF: DriveFolder = {
      id: `DIR-${Date.now()}`,
      nama: newFolderName.trim(),
      parentId: currentFolderId || undefined,
      jumlahFile: 0,
      terakhirDiubah: new Date().toISOString().split('T')[0],
      files: [],
    };
    onAddFolder(newF);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileForm.nama || !currentFolderId) {
      alert('Mohon pilih folder tujuan dan masukkan nama file!');
      return;
    }

    const newDoc: DriveFile = {
      id: `FILE-${Date.now()}`,
      nama: `${newFileForm.nama}.${newFileForm.tipe}`,
      tipe: newFileForm.tipe,
      ukuran: newFileForm.ukuran || '1.2 MB',
      kategori: newFileForm.kategori,
      tanggalUnggah: new Date().toISOString().split('T')[0],
      pengunggah: identitasSekolah.namaKepalaTU,
      statusSync: 'Tersinkron',
    };

    onAddFile(currentFolderId, newDoc);
    setIsUploadModalOpen(false);
    setNewFileForm({
      nama: '',
      tipe: 'pdf',
      ukuran: '1.4 MB',
      kategori: 'Surat',
    });
  };

  // Helper to render icon based on extension or MIME type
  const renderFileIcon = (mimeTypeOrType: string) => {
    const t = (mimeTypeOrType || '').toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (t.includes('sheet') || t.includes('xls') || t.includes('csv'))
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    if (t.includes('zip') || t.includes('rar') || t.includes('compressed'))
      return <FileArchive className="w-6 h-6 text-amber-500" />;
    if (t.includes('image') || t.includes('jpg') || t.includes('png') || t.includes('jpeg'))
      return <ImageIcon className="w-6 h-6 text-sky-500" />;
    if (t.includes('json'))
      return <Database className="w-6 h-6 text-purple-600" />;
    return <File className="w-6 h-6 text-blue-500" />;
  };

  // Subfolders in local folder
  const displayedFolders = folders.filter((f) => {
    if (!currentFolderId) return !f.parentId;
    return f.parentId === currentFolderId;
  });

  const displayedFiles = currentFolder ? currentFolder.files : [];

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Penyimpanan / <span className="text-slate-800 font-semibold">Google Drive & Cloud Arsip TU</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            <span>SimTU CLOUD ARSIP & GOOGLE DRIVE</span>
          </h2>
        </div>

        {/* Tab Selection: Live Google Drive vs Local Storage */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-inner text-xs font-bold">
          <button
            onClick={() => setDriveMode('google-drive')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
              driveMode === 'google-drive'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>Google Drive Saya</span>
            {isGoogleConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setDriveMode('local-drive')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
              driveMode === 'local-drive'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>SimTU Local Drive</span>
          </button>
        </div>
      </div>

      {/* Backup Notification Toast */}
      {isBackupSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl shadow-md flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Basis Data Berhasil Dicadangkan ke Google Drive!</p>
              <p className="text-emerald-700 text-[11px]">
                Berkas tersimpan sebagai: <span className="font-mono font-bold">{backupFileName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: LIVE GOOGLE DRIVE */}
      {/* ========================================================================= */}
      {driveMode === 'google-drive' && (
        <div className="space-y-4">
          {/* If NOT CONNECTED to Google Drive: Show Beautiful GSI Sign In Banner */}
          {!isGoogleConnected ? (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-blue-700/40 relative overflow-hidden">
              <div className="max-w-2xl space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-400/30">
                  <Cloud className="w-3.5 h-3.5 text-blue-300" />
                  <span>Google Workspace & Drive Integration</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white leading-tight">
                  Hubungkan Google Drive ke SIPEDAS SMPN 2 Puriala
                </h3>
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  Sambungkan akun Google sekolah (misal: <strong>smpnpuriala523@gmail.com</strong>) untuk mengaktifkan penyimpanan arsip online, pencadangan otomatis dokumen persuratan, SK KBM, data siswa, dan berkas digital ke Google Drive resmi.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {/* Official Google Sign In Button Styling */}
                  <button
                    onClick={onConnectGoogle}
                    disabled={isGoogleLoading}
                    className="bg-white hover:bg-slate-100 text-slate-800 font-semibold px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-3 text-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>
                      {isGoogleLoading ? 'Menghubungkan Akun...' : 'Sign in with Google (Google Drive)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* When CONNECTED: Show Google Drive Control Bar & Browser */
            <div className="space-y-4">
              {/* Account & Drive Quota Bar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {googleUser?.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Google User"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      GD
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {googleUser?.displayName || 'Google Drive Terhubung'}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Online
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{googleUser?.email}</p>
                  </div>
                </div>

                {/* Quota display */}
                {driveQuota && (
                  <div className="flex items-center gap-4 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Kapasitas Google Drive
                      </div>
                      <div className="font-extrabold text-slate-800 font-mono">
                        {driveQuota.usage} <span className="text-slate-400 font-normal">/ {driveQuota.limit}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleBackupDatabaseToGDrive}
                      disabled={isBackingUp}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                      title="Cadangkan seluruh database sekolah ke Google Drive"
                    >
                      {isBackingUp ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                      <span>Cadangkan Data ke G-Drive</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PUSAT SINKRONISASI SimTU HERO CARD */}
              <div className="bg-gradient-to-r from-[#0f2444] via-[#1a3660] to-[#1e4078] rounded-2xl p-5 md:p-6 text-white shadow-xl border border-blue-700/50 relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-400/30">
                      <ArrowDownUp className="w-3.5 h-3.5 text-blue-300" />
                      <span>Pusat Sinkronisasi Terpadu (Tarik & Kirim Data)</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 flex-wrap">
                      <span>Pusat Sinkronisasi SimTU Cloud</span>
                      <span className="bg-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 1-Klik Otomatis
                      </span>
                    </h3>
                    <p className="text-xs md:text-sm text-blue-100/80 leading-relaxed">
                      Sinkronkan (tarik dan kirim) semua modul yang terhubung ke Google Drive & Sheets secara serentak: Surat Masuk, Surat Keluar & Nomor Agenda, SK KBM, SK Tugas Tambahan, SPT Dinas, Pembuat Surat, Data PTK & Siswa, serta Cadangan Master Database.
                    </p>

                    {/* Integrated Module Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-semibold text-blue-200">
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-sky-300" /> Surat Masuk ({databaseState.suratMasuk?.length || 0})
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-300" /> Surat Keluar ({databaseState.suratKeluar?.length || 0})
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-300" /> SK KBM ({databaseState.skKBM?.length || 0})
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3 text-indigo-300" /> SK Tambahan ({databaseState.skTugasTambahan?.length || 0})
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <Workflow className="w-3 h-3 text-teal-300" /> SPT & Pembuat Surat ({((databaseState.suratTugas?.length || 0) + (databaseState.pembuatSurat?.length || 0))})
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <Database className="w-3 h-3 text-purple-300" /> PTK & Siswa ({((databaseState.guruPTK?.length || 0) + (databaseState.siswa?.length || 0))})
                      </span>
                    </div>
                  </div>

                  {/* Main Trigger Button */}
                  <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 w-full lg:w-auto">
                    <button
                      onClick={handleRunCentralSync}
                      disabled={isCentralSyncRunning || isGoogleLoading}
                      className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 active:scale-95 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-xl hover:shadow-emerald-500/25 text-sm flex items-center justify-center gap-2.5 transition border border-emerald-400/50 cursor-pointer"
                      title="Sinkronkan seluruh modul persuratan dan administrasi ke Google Drive & Sheets sekaligus"
                    >
                      {isCentralSyncRunning ? (
                        <>
                          <RotateCw className="w-5 h-5 animate-spin text-white" />
                          <span>Sedang Menyinkronkan Semua...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5 text-white animate-pulse" />
                          <span>SINKRONKAN SEMUA DATA SEKARANG</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-blue-200/90 px-1">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-amber-300 fill-amber-400/30" />
                        <span>Folder: TATA USAHA</span>
                      </span>
                      <button
                        onClick={handleJumpToTataUsahaFolder}
                        className="text-emerald-300 hover:text-emerald-200 font-bold underline"
                      >
                        Buka Folder
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar for Google Drive */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gDriveSearch}
                    onChange={(e) => {
                      setGDriveSearch(e.target.value);
                      fetchGDriveFiles(currentGDriveFolderId, e.target.value);
                    }}
                    placeholder="Cari berkas di Google Drive..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {gDriveSearch && (
                    <button
                      onClick={() => {
                        setGDriveSearch('');
                        fetchGDriveFiles(currentGDriveFolderId, '');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleJumpToTataUsahaFolder}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 border border-emerald-500"
                    title="Buka langsung Folder TATA USAHA di Google Drive"
                  >
                    <Folder className="w-4 h-4 text-emerald-200 fill-emerald-300/30" />
                    <span>Folder TATA USAHA (Auto-Sync)</span>
                  </button>

                  <button
                    onClick={() => fetchGDriveFiles(currentGDriveFolderId, gDriveSearch)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition flex items-center gap-1"
                    title="Segarkan Google Drive"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${gDriveLoading ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>

                  <button
                    onClick={() => setIsNewGDriveFolderOpen(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-500" />
                    <span>Folder G-Drive Baru</span>
                  </button>

                  <button
                    onClick={() => setIsUploadGDriveOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah ke Google Drive</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumb Path Navigation */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 overflow-x-auto">
                <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {gDriveFolderPath.map((step, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                    <button
                      onClick={() => handleNavigateGDriveBreadcrumb(idx)}
                      className={`hover:underline shrink-0 ${
                        idx === gDriveFolderPath.length - 1
                          ? 'font-bold text-indigo-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {step.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Google Drive Files & Folders Grid */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 min-h-[360px]">
                {gDriveLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-xs font-semibold">Mengambil data dari Google Drive...</p>
                  </div>
                ) : gDriveError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-rose-600 space-y-2">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-xs font-semibold">{gDriveError}</p>
                    <button
                      onClick={() => fetchGDriveFiles(currentGDriveFolderId, gDriveSearch)}
                      className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg font-bold"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : gDriveFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <Cloud className="w-12 h-12 text-slate-300" />
                    <p className="text-xs font-semibold">Folder ini kosong di Google Drive</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsUploadGDriveOpen(true)}
                        className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Unggah Berkas
                      </button>
                      <button
                        onClick={handleBackupDatabaseToGDrive}
                        className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Cadangkan Database
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Folders Section */}
                    {gDriveFiles.filter((f) => f.isFolder).length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Folder Google Drive ({gDriveFiles.filter((f) => f.isFolder).length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {gDriveFiles
                            .filter((f) => f.isFolder)
                            .map((folder) => (
                              <div
                                key={folder.id}
                                onClick={() => handleOpenGDriveFolder(folder)}
                                className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition cursor-pointer flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                                  <span className="font-bold text-xs text-slate-800 truncate">
                                    {folder.name}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFileToDelete(folder);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                                  title="Hapus folder di Google Drive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Files Section */}
                    {gDriveFiles.filter((f) => !f.isFolder).length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Berkas Dokumen ({gDriveFiles.filter((f) => !f.isFolder).length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                              <tr>
                                <th className="py-2.5 px-3">Nama Berkas di Google Drive</th>
                                <th className="py-2.5 px-3">Ukuran</th>
                                <th className="py-2.5 px-3">Terakhir Diubah</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {gDriveFiles
                                .filter((f) => !f.isFolder)
                                .map((file) => (
                                  <tr key={file.id} className="hover:bg-slate-50 transition">
                                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                                      {renderFileIcon(file.name)}
                                      <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                      {file.size}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                      {file.modifiedTime
                                        ? new Date(file.modifiedTime).toLocaleDateString('id-ID')
                                        : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-right space-x-1.5">
                                      {file.webViewLink && (
                                        <a
                                          href={file.webViewLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded text-[10px] font-bold"
                                          title="Buka langsung di Google Drive"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          <span>Buka</span>
                                        </a>
                                      )}
                                      <button
                                        onClick={() => setFileToDelete(file)}
                                        className="inline-flex items-center gap-1 text-rose-600 hover:bg-rose-50 px-2 py-1 rounded text-[10px] font-bold"
                                        title="Hapus dari Google Drive"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Hapus</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SIPEDAS LOCAL DRIVE */}
      {/* ========================================================================= */}
      {driveMode === 'local-drive' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berkas di SIPEDAS Local Drive..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>Folder Lokal Baru</span>
              </button>
              <button
                onClick={() => {
                  if (!currentFolderId) {
                    alert('Silakan buka salah satu folder tujuan terlebih dahulu!');
                    return;
                  }
                  setIsUploadModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Dokumen</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Path Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 overflow-x-auto">
            <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`hover:underline shrink-0 ${
                !currentFolderId ? 'font-bold text-indigo-700' : 'text-slate-600'
              }`}
            >
              SIPEDAS Local Storage
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="font-bold text-indigo-700 shrink-0">{currentFolder.nama}</span>
              </>
            )}
          </div>

          {/* Local Folder Grid & Files */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 min-h-[300px]">
            {/* Subfolders */}
            {displayedFolders.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Direktori Folder ({displayedFolders.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-800 block truncate">
                            {folder.nama}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {folder.files?.length || 0} berkas
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {currentFolder && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Berkas dalam Folder "{currentFolder.nama}" ({displayedFiles.length})
                </h4>
                {displayedFiles.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Folder ini belum memiliki dokumen tersimpan.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Nama Berkas</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3">Ukuran</th>
                          <th className="py-2.5 px-3">Tanggal Unggah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                              {renderFileIcon(file.tipe)}
                              <span>{file.nama}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{file.kategori}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {file.ukuran}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {file.tanggalUnggah || file.tanggalModifikasi || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Modal: Buat Folder Google Drive Baru */}
      {isNewGDriveFolderOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>Buat Folder Baru di Google Drive</span>
              </h3>
              <button onClick={() => setIsNewGDriveFolderOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGDriveFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Folder</label>
                <input
                  type="text"
                  required
                  value={newGDriveFolderName}
                  onChange={(e) => setNewGDriveFolderName(e.target.value)}
                  placeholder="Contoh: 01_Surat_Masuk_2026"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGDriveFolderOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={gDriveLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {gDriveLoading ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Unggah File ke Google Drive */}
      {isUploadGDriveOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Unggah Berkas ke Google Drive</span>
              </h3>
              <button onClick={() => setIsUploadGDriveOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadToGDrive} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Dokumen dari Komputer
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadGDriveFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadGDriveOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingGDrive}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {isUploadingGDrive ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <span>Mulai Unggah</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Konfirmasi Hapus File Google Drive (Mandatory Destructive Confirmation) */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border-l-4 border-rose-600">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Konfirmasi Penghapusan Berkas Google Drive</span>
              </h3>
              <button onClick={() => setFileToDelete(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus{' '}
                <strong>{fileToDelete.isFolder ? 'folder' : 'berkas'}</strong> berikut dari Google Drive Anda?
              </p>
              <div className="p-3 bg-rose-50 text-rose-950 font-bold rounded-lg border border-rose-200">
                {fileToDelete.name}
              </div>
              <p className="text-[11px] text-slate-400">
                Tindakan ini akan memindahkan item ke tong sampah Google Drive Anda.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteGDriveFile}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Buat Folder Local */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>Buat Folder Lokal Baru</span>
              </h3>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Folder</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Berkas_Akreditasi_2026"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Upload File Local */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Tambah Catatan Dokumen Lokal</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadFile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Dokumen</label>
                <input
                  type="text"
                  required
                  value={newFileForm.nama}
                  onChange={(e) => setNewFileForm({ ...newFileForm, nama: e.target.value })}
                  placeholder="Contoh: Notulen_Rapat_Komite"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format Tipe</label>
                  <select
                    value={newFileForm.tipe}
                    onChange={(e) => setNewFileForm({ ...newFileForm, tipe: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="xlsx">Excel Sheet (.xlsx)</option>
                    <option value="jpg">Gambar JPG (.jpg)</option>
                    <option value="zip">Arsip ZIP (.zip)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Dokumen</label>
                  <select
                    value={newFileForm.kategori}
                    onChange={(e) => setNewFileForm({ ...newFileForm, kategori: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Surat">Surat Menyurat</option>
                    <option value="SK">Surat Keputusan</option>
                    <option value="Kurikulum">Kurikulum / Modul</option>
                    <option value="Kesiswaan">Kesiswaan & Ijazah</option>
                    <option value="Kepegawaian">Kepegawaian PTK</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Simpan Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL UTAMA: PUSAT SINKRONISASI SimTU (PROGRESS & REPORT) */}
      {isCentralSyncModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0f2444] via-[#1a3660] to-[#1e4078] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <ArrowDownUp className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Pusat Sinkronisasi SimTU Cloud</span>
                    {isCentralSyncRunning && (
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <RotateCw className="w-3 h-3 animate-spin" /> Proses
                      </span>
                    )}
                    {centralSyncReport && (
                      <span className="bg-emerald-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Berhasil
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-blue-100/80">
                    Sinkronisasi Tarik & Kirim Seluruh Modul Administrasi Tata Usaha ke Google Drive
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isCentralSyncRunning && setIsCentralSyncModalOpen(false)}
                disabled={isCentralSyncRunning}
                className="text-blue-200 hover:text-white disabled:opacity-30 p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
              {/* Progress Bar & Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    {isCentralSyncRunning ? (
                      <span className="text-blue-600 font-extrabold flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sedang Menjalankan Sinkronisasi:
                      </span>
                    ) : centralSyncReport ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sinkronisasi Lengkap Selesai
                      </span>
                    ) : (
                      <span>Status Sinkronisasi</span>
                    )}
                    <span className="text-slate-900">{centralSyncProgress.currentStepTitle}</span>
                  </span>
                  <span className="font-mono text-sm font-extrabold text-indigo-700">
                    {centralSyncProgress.percent}%
                  </span>
                </div>

                {/* The visual progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      centralSyncReport
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : centralSyncError
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500'
                    }`}
                    style={{ width: `${Math.max(5, centralSyncProgress.percent)}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="font-mono">{centralSyncProgress.currentStepDetail}</span>
                  <span className="font-semibold">
                    Langkah {centralSyncProgress.currentStep} dari {centralSyncProgress.totalSteps}
                  </span>
                </div>
              </div>

              {/* Error Alert if occurred */}
              {centralSyncError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Terjadi Kendala Sinkronisasi</h4>
                      <p className="text-rose-700 text-[11px] mt-0.5">{centralSyncError}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRunCentralSync}
                    className="mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Coba Ulangi Sinkronisasi
                  </button>
                </div>
              )}

              {/* SUCCESS REPORT CARD */}
              {centralSyncReport && (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-300/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-950">
                          Sinkronisasi Pusat Selesai & Terpadu!
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Waktu: {centralSyncReport.timestamp} (Durasi: {centralSyncReport.durationSeconds} detik)
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-200 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                      {centralSyncReport.totalSyncedItems} Arsip/Data
                    </span>
                  </div>

                  {/* Module Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {centralSyncReport.modules.map((m, idx) => (
                      <div key={idx} className="bg-white/80 border border-emerald-200/60 rounded-xl p-2.5">
                        <div className="text-[10px] text-slate-500 font-medium truncate">{m.module}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-extrabold text-slate-800 text-sm">{m.count} item</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            OK
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">
                          📁 {m.subfolder}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Action in report */}
                  {centralSyncReport.folderId && (
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-emerald-900 text-[11px] font-semibold">
                        Semua file tersimpan rapi di subfolder Google Drive.
                      </span>
                      <a
                        href={`https://drive.google.com/drive/folders/${centralSyncReport.folderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition"
                      >
                        <span>Buka Folder TATA USAHA di Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Step By Step Checklist Breakdown */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tahapan Eksekusi Sinkronisasi (9 Modul)</span>
                </h4>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 overflow-hidden">
                  {centralSyncProgress.steps.map((step) => {
                    const isRunning = step.status === 'running';
                    const isCompleted = step.status === 'completed';
                    const isError = step.status === 'error';
                    const isWaiting = step.status === 'waiting';

                    return (
                      <div
                        key={step.step}
                        className={`p-2.5 px-3.5 flex items-center justify-between text-xs transition-colors ${
                          isRunning ? 'bg-blue-50/80 text-blue-900 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isCompleted && (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                          {isRunning && (
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 animate-spin">
                              <RotateCw className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {isError && (
                            <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {isWaiting && (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Clock className="w-3 h-3" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-800">{step.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{step.detail}</div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isCompleted && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              Selesai
                            </span>
                          )}
                          {isRunning && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                              Memproses...
                            </span>
                          )}
                          {isError && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                              Gagal
                            </span>
                          )}
                          {isWaiting && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                              Menunggu
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-mono">
                {isCentralSyncRunning ? 'Harap jangan menutup jendela ini...' : 'Siap digunakan kembali'}
              </div>
              <div className="flex items-center gap-2">
                {!isCentralSyncRunning && !centralSyncReport && (
                  <button
                    onClick={handleRunCentralSync}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Mulai Sinkronisasi</span>
                  </button>
                )}
                <button
                  onClick={() => setIsCentralSyncModalOpen(false)}
                  disabled={isCentralSyncRunning}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition disabled:opacity-40"
                >
                  {centralSyncReport ? 'Tutup & Selesai' : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
