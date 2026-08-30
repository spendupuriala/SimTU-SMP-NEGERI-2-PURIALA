import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  UploadCloud,
  Cloud,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  X,
  Eye,
  ChevronUp,
  ChevronDown,
  Paperclip,
  ZoomIn,
  ZoomOut,
  Maximize2,
  File,
  FileSpreadsheet,
  FolderSearch,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GuruPTK, IdentitasSekolah } from '../types';
import {
  saveGuruPTKDataToDrive,
  loadGuruPTKDataFromDrive,
  findOrCreateGuruSubfolder,
  uploadGuruBerkasToDrive,
  deleteGoogleDriveFile,
  formatGuruFolderName,
  scanAllGuruBerkasFromDrive,
} from '../services/googleDrive';

interface GuruPTKModuleProps {
  guruList: GuruPTK[];
  onAdd: (g: GuruPTK) => void;
  onUpdate: (g: GuruPTK) => void;
  onDelete: (id: string) => void;
  onReorder?: (newList: GuruPTK[]) => void;
  identitasSekolah: IdentitasSekolah;
  googleUser?: any;
  googleToken?: string | null;
  isGoogleConnected?: boolean;
  isGoogleLoading?: boolean;
  onConnectGoogle?: () => void;
  onBatchUpdate?: (newList: GuruPTK[]) => void;
}

const KATEGORI_BERKAS_OPTIONS = [
  'SK Pangkat / Kenaikan Golongan',
  'SK CPNS / PNS / PPPK',
  'Ijazah & Transkrip Terakhir',
  'Sertifikat Pendidik (Serdik)',
  'KTP / KK / Karpeg / Kartu Taspen',
  'SK Pembagian Tugas / SK Mutasi',
  'Sertifikat Pelatihan / Diklat / Workshop',
  'Penilaian Kinerja Guru & SKP',
  'Kenaikan Gaji Berkala (KGB)',
  'Dokumen Lainnya',
];

export const GuruPTKModule: React.FC<GuruPTKModuleProps> = ({
  guruList,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  identitasSekolah,
  googleUser,
  googleToken,
  isGoogleConnected,
  isGoogleLoading,
  onConnectGoogle,
  onBatchUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [jenisFilter, setJenisFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruPTK | null>(null);
  const [selectedGuruDetail, setSelectedGuruDetail] = useState<GuruPTK | null>(null);
  const [selectedGuruBerkas, setSelectedGuruBerkas] = useState<GuruPTK | null>(null);
  const [guruToDelete, setGuruToDelete] = useState<GuruPTK | null>(null);

  // Google Drive PTK Sync States
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isPullingDrive, setIsPullingDrive] = useState(false);
  const [isScanningDriveBerkas, setIsScanningDriveBerkas] = useState(false);
  const [isPrintListModalOpen, setIsPrintListModalOpen] = useState(false);
  const [printCategoryOption, setPrintCategoryOption] = useState('Semua');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const hasAutoScannedRef = useRef(false);

  // Auto-scan Google Drive Folder TATA USAHA/04_KEPEGAWAIAN_PTK for teachers' digital files
  const handleAutoScanBerkas = async (silent = false) => {
    if (!googleToken || !isGoogleConnected) {
      if (!silent && onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsScanningDriveBerkas(true);
      if (!silent) {
        showNotification('Sedang memindai folder TATA USAHA/04_KEPEGAWAIAN_PTK di Google Drive...', 'info');
      }

      const scanResult = await scanAllGuruBerkasFromDrive(googleToken, guruList);
      if (scanResult.success && scanResult.data) {
        if (onBatchUpdate) {
          onBatchUpdate(scanResult.data);
        }
        if (!silent) {
          showNotification(
            `Pemindaian Berkas Selesai! Ditemukan ${scanResult.totalFilesFound} berkas pada ${scanResult.matchedFoldersCount} folder Guru & PTK di Drive.`,
            'success'
          );
        }
      }
    } catch (err: any) {
      console.warn('Auto scan berkas error:', err);
      if (!silent) {
        showNotification(err?.message || 'Gagal memindai berkas digital dari Google Drive.', 'error');
      }
    } finally {
      setIsScanningDriveBerkas(false);
    }
  };

  // Run auto-scan once when Google Drive is connected
  useEffect(() => {
    if (isGoogleConnected && googleToken && !hasAutoScannedRef.current) {
      hasAutoScannedRef.current = true;
      handleAutoScanBerkas(true);
    }
  }, [isGoogleConnected, googleToken]);

  // File Upload inside Berkas Modal
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFilePreview, setUploadFilePreview] = useState<string | null>(null);
  const [uploadJenisBerkas, setUploadJenisBerkas] = useState(KATEGORI_BERKAS_OPTIONS[0]);
  const [uploadCustomName, setUploadCustomName] = useState('');
  const [isUploadingBerkas, setIsUploadingBerkas] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Document Viewer Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    nama: string;
    jenisBerkas: string;
    isImage: boolean;
    mimeType?: string;
    driveWebViewLink?: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setSyncFeedback({ message, type });
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  const [formData, setFormData] = useState<Partial<GuruPTK>>({
    namaLengkap: '',
    nip: '',
    nuptk: '',
    jenisPTK: 'Guru Mapel',
    statusKepegawaian: 'PNS',
    golongan: 'Penata, III/c',
    jabatan: 'Guru Ahli Pertama',
    tmtPengangkatan: '2015-01-01',
    pendidikanTerakhir: 'S1 Pendidikan',
    jurusan: 'Pendidikan',
    statusSertifikasi: 'Sudah Sertifikasi',
    email: '',
    noHp: '',
    berkasDigital: [],
  });

  const handleOpenAdd = () => {
    setEditingGuru(null);
    setFormData({
      namaLengkap: '',
      nip: '',
      nuptk: '',
      jenisPTK: 'Guru Mapel',
      statusKepegawaian: 'PNS',
      golongan: 'Penata, III/c',
      jabatan: 'Guru Ahli Pertama',
      tmtPengangkatan: '2015-01-01',
      pendidikanTerakhir: 'S1 Pendidikan',
      jurusan: 'Pendidikan',
      statusSertifikasi: 'Sudah Sertifikasi',
      email: '',
      noHp: '',
      berkasDigital: [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: GuruPTK) => {
    setEditingGuru(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap) {
      alert('Mohon masukkan Nama Lengkap Guru/PTK!');
      return;
    }

    if (editingGuru) {
      onUpdate({ ...editingGuru, ...formData } as GuruPTK);
      showNotification(`Data ${formData.namaLengkap} berhasil diperbarui.`, 'success');
    } else {
      const newGuru: GuruPTK = {
        id: `PTK-${Date.now()}`,
        namaLengkap: formData.namaLengkap || '',
        nip: formData.nip || '-',
        nuptk: formData.nuptk || '-',
        jenisPTK: (formData.jenisPTK as any) || 'Guru Mapel',
        statusKepegawaian: (formData.statusKepegawaian as any) || 'PNS',
        golongan: formData.golongan || 'Penata, III/c',
        jabatan: formData.jabatan || 'Guru',
        tmtPengangkatan: formData.tmtPengangkatan || '2020-01-01',
        pendidikanTerakhir: formData.pendidikanTerakhir || 'S1',
        jurusan: formData.jurusan || 'Pendidikan',
        statusSertifikasi: (formData.statusSertifikasi as any) || 'Belum Sertifikasi',
        email: formData.email || '-',
        noHp: formData.noHp || '-',
        berkasDigital: formData.berkasDigital || [],
      };
      onAdd(newGuru);
      showNotification(`Guru/PTK baru "${newGuru.namaLengkap}" berhasil ditambahkan.`, 'success');
    }
    setIsAddModalOpen(false);
  };

  const handleMoveGuru = (id: string, direction: 'up' | 'down') => {
    const currentIndex = guruList.findIndex((g) => g.id === id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === guruList.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newList = [...guruList];
    const temp = newList[currentIndex];
    newList[currentIndex] = newList[targetIndex];
    newList[targetIndex] = temp;

    if (onReorder) {
      onReorder(newList);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE DRIVE SYNC: PUSH (Simpan Data ke Drive)
  // -------------------------------------------------------------
  const handleSaveToDrive = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsSyncingDrive(true);
      const res = await saveGuruPTKDataToDrive(googleToken, guruList);
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      showNotification(
        `Berhasil menyimpan ${guruList.length} data Guru & PTK ke Google Drive: Folder TATA USAHA/04_KEPEGAWAIAN_PTK (File: ${res.fileName})!`,
        'success'
      );
    } catch (error: any) {
      console.error('Error saving PTK to Drive:', error);
      showNotification(error?.message || 'Gagal menyimpan Data Guru & PTK ke Google Drive.', 'error');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE DRIVE SYNC: PULL (Tarik Data dari Drive)
  // -------------------------------------------------------------
  const handlePullFromDrive = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsPullingDrive(true);
      const res = await loadGuruPTKDataFromDrive(googleToken);
      if (res.data && res.data.length > 0) {
        if (onBatchUpdate) {
          onBatchUpdate(res.data);
        }
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);
        showNotification(
          `Berhasil menarik ${res.data.length} data Guru & PTK dari Google Drive (${res.sourceFolder} / ${res.sourceName})!`,
          'success'
        );
      } else {
        showNotification('Tidak ada data Guru & PTK yang ditemukan di file Google Drive.', 'info');
      }
    } catch (error: any) {
      console.error('Error pulling PTK from Drive:', error);
      showNotification(error?.message || 'Gagal menarik data Guru & PTK dari Google Drive.', 'error');
    } finally {
      setIsPullingDrive(false);
    }
  };

  // -------------------------------------------------------------
  // FILE UPLOAD HANDLING FOR PTK BERKAS DIGITAL
  // -------------------------------------------------------------
  const handleSelectFile = (file: File) => {
    // Validate file type: PDF or Image
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);

    if (!isPdf && !isImage) {
      alert('Format berkas tidak didukung! Mohon pilih file PDF (.pdf) atau Gambar (.jpg, .jpeg, .png, .webp).');
      return;
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar! Maksimal ukuran berkas adalah 25 MB.');
      return;
    }

    setUploadFile(file);
    setUploadCustomName(file.name);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadFilePreview(null);
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadBerkasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuruBerkas) return;
    if (!uploadFile) {
      alert('Silakan pilih file PDF atau gambar terlebih dahulu!');
      return;
    }

    const fileNameToSave = (uploadCustomName.trim() || uploadFile.name).replace(/[\\/:*?"<>|]/g, '');
    const isImage = uploadFile.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(uploadFile.name);
    const mimeType = uploadFile.type || (isImage ? 'image/jpeg' : 'application/pdf');

    setIsUploadingBerkas(true);
    setUploadProgressMsg('Menyiapkan folder penyimpanan di Google Drive...');

    try {
      let newBerkasItem: any = null;

      if (googleToken && isGoogleConnected) {
        setUploadProgressMsg(`Membuat/membuka folder individual di TATA USAHA/04_KEPEGAWAIAN_PTK...`);
        const uploaded = await uploadGuruBerkasToDrive(
          googleToken,
          selectedGuruBerkas,
          uploadFile,
          fileNameToSave,
          mimeType,
          uploadJenisBerkas
        );

        newBerkasItem = {
          id: uploaded.id,
          namaFile: uploaded.namaFile,
          jenisBerkas: uploaded.jenisBerkas,
          ukuran: uploaded.ukuran,
          tanggalUnggah: uploaded.tanggalUnggah,
          driveFileId: uploaded.driveFileId,
          driveWebViewLink: uploaded.driveWebViewLink,
          folderId: uploaded.folderId,
          folderName: uploaded.folderName,
          mimeType: uploaded.mimeType,
        };

        // Also store local dataURI for offline instant preview
        if (uploadFile.size < 5 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = () => {
            newBerkasItem.url = reader.result as string;
          };
          reader.readAsDataURL(uploadFile);
        }
      } else {
        // Fallback local storage
        setUploadProgressMsg('Menyimpan berkas secara lokal...');
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadFile);
        });

        newBerkasItem = {
          id: `berkas-${Date.now()}`,
          namaFile: fileNameToSave,
          jenisBerkas: uploadJenisBerkas,
          ukuran: `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`,
          tanggalUnggah: new Date().toISOString().split('T')[0],
          url: dataUrl,
          mimeType,
        };
      }

      // Update Guru state with new berkas
      const updatedBerkasList = [...(selectedGuruBerkas.berkasDigital || []), newBerkasItem];
      const updatedGuru: GuruPTK = {
        ...selectedGuruBerkas,
        berkasDigital: updatedBerkasList,
      };

      onUpdate(updatedGuru);
      setSelectedGuruBerkas(updatedGuru);

      // Reset form
      setUploadFile(null);
      setUploadFilePreview(null);
      setUploadCustomName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      showNotification(
        `Berkas "${fileNameToSave}" berhasil diunggah ke folder PTK: ${formatGuruFolderName(selectedGuruBerkas)}!`,
        'success'
      );
    } catch (error: any) {
      console.error('Error uploading berkas:', error);
      showNotification(error?.message || 'Gagal mengunggah berkas PTK ke Google Drive.', 'error');
    } finally {
      setIsUploadingBerkas(false);
      setUploadProgressMsg('');
    }
  };

  const handleDeleteBerkasItem = async (berkasId: string, driveFileId?: string) => {
    if (!selectedGuruBerkas) return;
    if (!confirm('Apakah Anda yakin ingin menghapus berkas digital ini?')) return;

    try {
      if (driveFileId && googleToken && isGoogleConnected) {
        try {
          await deleteGoogleDriveFile(googleToken, driveFileId);
        } catch (e) {
          console.warn('Could not delete from Drive:', e);
        }
      }

      const updatedBerkas = (selectedGuruBerkas.berkasDigital || []).filter((b) => b.id !== berkasId);
      const updatedGuru: GuruPTK = {
        ...selectedGuruBerkas,
        berkasDigital: updatedBerkas,
      };
      onUpdate(updatedGuru);
      setSelectedGuruBerkas(updatedGuru);
      showNotification('Berkas berhasil dihapus.', 'info');
    } catch (e: any) {
      showNotification('Gagal menghapus berkas.', 'error');
    }
  };

  const handlePreviewBerkas = (berkas: any) => {
    const isImage = berkas.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(berkas.namaFile);
    setPreviewDoc({
      url: berkas.url || berkas.driveWebViewLink || '',
      nama: berkas.namaFile,
      jenisBerkas: berkas.jenisBerkas,
      isImage,
      mimeType: berkas.mimeType,
      driveWebViewLink: berkas.driveWebViewLink,
    });
  };

  const exportExcel = () => {
    try {
      const dataToExport = guruList.map((g, idx) => ({
        'No': idx + 1,
        'Nama Lengkap & Gelar': g.namaLengkap,
        'NIP': g.nip || '-',
        'NUPTK': g.nuptk || '-',
        'Jenis PTK': g.jenisPTK,
        'Status Kepegawaian': g.statusKepegawaian,
        'Golongan / Ruang': g.golongan,
        'Jabatan / Tugas': g.jabatan,
        'TMT Pengangkatan': g.tmtPengangkatan || '-',
        'Pendidikan Terakhir': g.pendidikanTerakhir || '-',
        'Jurusan / Prodi': g.jurusan || '-',
        'Status Sertifikasi': g.statusSertifikasi,
        'No. HP / WhatsApp': g.noHp || '-',
        'Email': g.email || '-',
        'Jumlah Berkas Digital': (g.berkasDigital || []).length,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 32 }, // Nama
        { wch: 22 }, // NIP
        { wch: 20 }, // NUPTK
        { wch: 22 }, // Jenis PTK
        { wch: 18 }, // Status
        { wch: 18 }, // Golongan
        { wch: 25 }, // Jabatan
        { wch: 16 }, // TMT
        { wch: 18 }, // Pendidikan
        { wch: 24 }, // Jurusan
        { wch: 20 }, // Sertifikasi
        { wch: 18 }, // No HP
        { wch: 28 }, // Email
        { wch: 16 }, // Berkas
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru dan PTK');
      XLSX.writeFile(workbook, `DATA_GURU_DAN_PTK_SMPN2_PURIALA_${new Date().getFullYear()}.xlsx`);
      showNotification('Berhasil mengekspor Data Guru & PTK ke format Excel (.xlsx)!', 'success');
    } catch (e: any) {
      console.error('Error exporting Excel:', e);
      showNotification('Gagal mengekspor file Excel: ' + (e?.message || e), 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['Nama Lengkap', 'NIP', 'NUPTK', 'Jenis PTK', 'Status Kepegawaian', 'Golongan', 'Jabatan', 'Pendidikan', 'Sertifikasi', 'No HP', 'Jumlah Berkas'];
    const rows = guruList.map((g) => [
      `"${g.namaLengkap}"`,
      `"${g.nip}"`,
      `"${g.nuptk}"`,
      `"${g.jenisPTK}"`,
      `"${g.statusKepegawaian}"`,
      `"${g.golongan}"`,
      `"${g.jabatan}"`,
      `"${g.pendidikanTerakhir}"`,
      `"${g.statusSertifikasi}"`,
      `"${g.noHp}"`,
      `"${(g.berkasDigital || []).length}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_GURU_PTK_SMPN2_PURIALA_2026.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filtered = guruList.filter((g) => {
    const matchSearch =
      g.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nip.includes(searchTerm) ||
      g.nuptk.includes(searchTerm) ||
      g.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || g.statusKepegawaian === statusFilter;
    const matchJenis = jenisFilter === 'Semua' || g.jenisPTK === jenisFilter;
    return matchSearch && matchStatus && matchJenis;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {syncFeedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up border transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : syncFeedback.type === 'error'
              ? 'bg-rose-800 text-white border-rose-600'
              : 'bg-slate-800 text-white border-slate-700'
          }`}
        >
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Kepegawaian / <span className="text-slate-800 font-semibold">Data Guru & Tenaga Kependidikan</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>DATA GURU & PTK + BERKAS DIGITAL</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Ekspor Excel */}
          <button
            onClick={exportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Ekspor data Guru & PTK ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={() => {
              setPrintCategoryOption('Semua');
              setIsPrintListModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Cetak daftar resmi Guru & PTK ke PDF / Printer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>

          {/* Ekspor CSV */}
          <button
            onClick={exportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-2.5 rounded-lg border border-slate-300 shadow-xs transition flex items-center gap-1"
            title="Ekspor file format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Tambah PTK */}
          <button
            onClick={handleOpenAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data PTK</span>
          </button>
        </div>
      </div>

      {/* GOOGLE DRIVE INTEGRATION ACTION BAR */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-teal-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-xs shrink-0">
            <Cloud className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold tracking-wide uppercase text-teal-200">
                Google Drive Storage Sync
              </span>
              <span className="bg-teal-500/30 text-teal-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-teal-400/30">
                Folder: TATA USAHA/04_KEPEGAWAIAN_PTK
              </span>
              <span className="bg-white/10 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                File: "Data Guru & PTK"
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Otomatis membaca subfolder nama guru &amp; menghitung berkas digital di folder TATA USAHA/04_KEPEGAWAIAN_PTK.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isGoogleConnected ? (
            <>
              {/* Scan Berkas Drive Button */}
              <button
                type="button"
                onClick={() => handleAutoScanBerkas(false)}
                disabled={isScanningDriveBerkas || isPullingDrive || isSyncingDrive}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold py-2 px-3 rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                title="Pindai subfolder nama guru di folder 04_KEPEGAWAIAN_PTK untuk sinkronisasi jumlah berkas digital"
              >
                <RefreshCw className={`w-4 h-4 ${isScanningDriveBerkas ? 'animate-spin' : ''}`} />
                <span>{isScanningDriveBerkas ? 'Memindai Drive...' : 'Pindai Berkas Drive'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromDrive}
                disabled={isPullingDrive || isSyncingDrive || isScanningDriveBerkas}
                className="bg-teal-700/80 hover:bg-teal-600 text-white text-xs font-bold py-2 px-3 rounded-xl border border-teal-500/50 shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                title="Tarik data Guru & PTK dari file 'Data Guru & PTK' di folder 04_KEPEGAWAIAN_PTK"
              >
                <CloudDownload className={`w-4 h-4 ${isPullingDrive ? 'animate-bounce' : ''}`} />
                <span>{isPullingDrive ? 'Menarik...' : 'Tarik Data'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToDrive}
                disabled={isSyncingDrive || isPullingDrive || isScanningDriveBerkas}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                title="Simpan data Guru & PTK ke Google Drive (TATA USAHA/04_KEPEGAWAIAN_PTK/Data Guru & PTK)"
              >
                <CloudUpload className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                <span>{isSyncingDrive ? 'Menyimpan...' : 'Simpan ke Drive'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnectGoogle}
              disabled={isGoogleLoading}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Cloud className="w-4 h-4 text-teal-600" />
              <span>Hubungkan Akun Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Total Guru & Pegawai</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{guruList.length} Orang</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-teal-600">Aparatur Sipil Negara (PNS/PPPK)</p>
          <p className="text-xl font-extrabold text-teal-800 mt-1">
            {guruList.filter((g) => g.statusKepegawaian === 'PNS' || g.statusKepegawaian === 'PPPK').length} Pegawai
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600">Guru Non-ASN / Honorer</p>
          <p className="text-xl font-extrabold text-amber-800 mt-1">
            {guruList.filter((g) => g.statusKepegawaian === 'Honorer / GTT' || g.statusKepegawaian?.includes('Honorer')).length} Guru
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-600">Guru Bersertifikasi (Gr)</p>
          <p className="text-xl font-extrabold text-purple-800 mt-1">
            {guruList.filter((g) => g.statusSertifikasi === 'Sudah Sertifikasi').length} Pendidik
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama guru, NIP, NUPTK, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Semua">Semua Status Kepegawaian</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="Honorer / GTT">Honorer / GTT</option>
          </select>
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Semua">Semua Jenis PTK</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
            <option value="Guru Mapel">Guru Mapel</option>
            <option value="Guru BK">Guru BK</option>
            <option value="Tenaga Administrasi Sekolah">Tenaga Administrasi (TU)</option>
            <option value="Penjaga / Kebersihan">Penjaga / Kebersihan</option>
          </select>
        </div>
      </div>

      {/* Table of PTK */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">No</th>
                <th className="py-3 px-3.5">Nama &amp; Gelar / NIP</th>
                <th className="py-3 px-3.5">Status &amp; Golongan</th>
                <th className="py-3 px-3.5">Jenis PTK &amp; Jabatan</th>
                <th className="py-3 px-3.5">Pendidikan Terakhir</th>
                <th className="py-3 px-3.5">Sertifikasi</th>
                <th className="py-3 px-3.5 text-center">Berkas Digital</th>
                <th className="py-3 px-3.5 text-center w-28">Urutan / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-teal-50/30 transition">
                  <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.namaLengkap}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">NIP: {item.nip}</div>
                    {item.nuptk && item.nuptk !== '-' && (
                      <div className="text-[10px] text-slate-400 font-mono">NUPTK: {item.nuptk}</div>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                        item.statusKepegawaian === 'PNS'
                          ? 'bg-blue-100 text-blue-800'
                          : item.statusKepegawaian === 'PPPK'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.statusKepegawaian}
                    </span>
                    <div className="text-[11px] text-slate-700 font-semibold mt-0.5">{item.golongan}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-800">{item.jenisPTK}</div>
                    <div className="text-[10px] text-slate-500">{item.jabatan}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-medium text-slate-800">{item.pendidikanTerakhir}</div>
                    <div className="text-[10px] text-slate-400">{item.jurusan}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        item.statusSertifikasi === 'Sudah Sertifikasi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.statusSertifikasi === 'Sudah Sertifikasi' ? 'Tersertifikasi' : 'Belum'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <button
                      onClick={() => setSelectedGuruBerkas(item)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 transition shadow-2xs"
                      title="Buka & Upload Berkas Digital Guru"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-600" />
                      <span>{(item.berkasDigital || []).length} Berkas</span>
                    </button>
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleMoveGuru(item.id, 'up')}
                          disabled={idx === 0 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'}
                          className={`p-1 rounded transition ${
                            idx === 0 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-700 hover:text-teal-700 hover:bg-teal-100'
                          }`}
                          title="Pindah Ke Atas"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGuru(item.id, 'down')}
                          disabled={idx === filtered.length - 1 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'}
                          className={`p-1 rounded transition ${
                            idx === filtered.length - 1 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-700 hover:text-teal-700 hover:bg-teal-100'
                          }`}
                          title="Pindah Ke Bawah"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedGuruDetail(item)}
                        className="text-teal-600 hover:text-teal-800 p-1.5 rounded hover:bg-teal-50"
                        title="Biodata Pegawai"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-slate-600 hover:text-amber-600 p-1.5 rounded hover:bg-slate-100"
                        title="Edit Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGuruToDelete(item)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition"
                        title="Hapus Data PTK"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL: BERKAS DIGITAL GURU & PTK + UPLOAD PDF/GAMBAR KE FOLDER DRIVE */}
      {/* ============================================================= */}
      {selectedGuruBerkas && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <FolderOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <span>Berkas Digital: {selectedGuruBerkas.namaLengkap}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      NIP: {selectedGuruBerkas.nip} | {selectedGuruBerkas.jabatan}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-slate-700">
                  <Folder className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Target Folder: <strong>TATA USAHA/04_KEPEGAWAIAN_PTK/{formatGuruFolderName(selectedGuruBerkas)}</strong></span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedGuruBerkas(null);
                  setUploadFile(null);
                  setUploadFilePreview(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM UPLOAD BERKAS (PDF / GAMBAR) */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>Upload Berkas Guru (PDF / Gambar)</span>
                </h4>
                {isGoogleConnected ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Auto-Simpan ke Google Drive</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Mode Penyimpanan Lokal
                  </span>
                )}
              </div>

              <form onSubmit={handleUploadBerkasSubmit} className="space-y-3 text-xs">
                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/80'
                      : uploadFile
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-teal-400 bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleSelectFile(e.target.files[0]);
                      }
                    }}
                  />

                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {uploadFile.type === 'application/pdf' ? (
                        <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                          <FileText className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                          <FileImage className="w-6 h-6" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-xs">{uploadFile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadFile.type || 'Dokumen'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          setUploadFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="ml-auto text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50"
                        title="Ganti File"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-1.5 opacity-80" />
                      <p className="font-bold text-slate-700 text-xs">
                        Tarik &amp; Lepaskan Berkas PDF atau Gambar ke Sini
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        atau klik untuk memilih dari komputer (Mendukung .PDF, .JPG, .PNG, .WEBP)
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      Kategori / Jenis Berkas
                    </label>
                    <select
                      value={uploadJenisBerkas}
                      onChange={(e) => setUploadJenisBerkas(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {KATEGORI_BERKAS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      Nama File Tersimpan
                    </label>
                    <input
                      type="text"
                      value={uploadCustomName}
                      onChange={(e) => setUploadCustomName(e.target.value)}
                      placeholder="Contoh: SK_Pangkat_2026.pdf"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {uploadProgressMsg && (
                  <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-[11px] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>{uploadProgressMsg}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploadingBerkas}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingBerkas ? 'Mengunggah ke Folder PTK...' : 'Upload Berkas ke Folder Guru'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* DAFTAR BERKAS TERSIMPAN */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Daftar Berkas Terarsip ({(selectedGuruBerkas.berkasDigital || []).length} Dokumen)</span>
                </h4>
              </div>

              {(selectedGuruBerkas.berkasDigital || []).length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200/80">
                  <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-bold">Belum ada berkas yang diunggah untuk guru ini.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan form di atas untuk mengunggah SK, Ijazah, atau Sertifikat PTK.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(selectedGuruBerkas.berkasDigital || []).map((b, idx) => {
                    const isPdf = b.namaFile.toLowerCase().endsWith('.pdf') || b.mimeType === 'application/pdf';
                    return (
                      <div
                        key={b.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-2xs transition gap-2"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isPdf ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}
                          >
                            {isPdf ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{b.jenisBerkas}</span>
                              <span className="text-[9.5px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded">
                                {b.ukuran || 'Dokumen'}
                              </span>
                              {b.driveFileId && (
                                <span className="text-[9.5px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200/60">
                                  📁 Google Drive
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono truncate max-w-md mt-0.5">
                              {b.namaFile} • Diunggah: {b.tanggalUnggah || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => handlePreviewBerkas(b)}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>Lihat</span>
                          </button>

                          {/* Open in Drive Button */}
                          {b.driveWebViewLink && (
                            <a
                              href={b.driveWebViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                              title="Buka di Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                              <span>Drive</span>
                            </a>
                          )}

                          {/* Download Button */}
                          {(b.url || b.driveWebViewLink) && (
                            <a
                              href={b.url || b.driveWebViewLink}
                              download={b.namaFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                              title="Unduh Berkas"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBerkasItem(b.id, b.driveFileId)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedGuruBerkas(null);
                  setUploadFile(null);
                  setUploadFilePreview(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: PRATINJAU DOKUMEN / GAMBAR (DOCUMENT VIEWER) */}
      {/* ============================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center gap-2 truncate">
                {previewDoc.isImage ? (
                  <FileImage className="w-5 h-5 text-blue-400 shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="truncate">
                  <p className="font-bold text-xs truncate text-white">{previewDoc.nama}</p>
                  <p className="text-[10px] text-slate-400 truncate">{previewDoc.jenisBerkas}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewDoc.driveWebViewLink && (
                  <a
                    href={previewDoc.driveWebViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Google Drive</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950/90 overflow-auto p-4 flex items-center justify-center min-h-[400px]">
              {previewDoc.isImage ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.nama}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewDoc.url.startsWith('data:') ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.nama}
                  className="w-full h-[75vh] rounded-lg bg-white border-0"
                />
              ) : previewDoc.driveWebViewLink ? (
                <iframe
                  src={previewDoc.driveWebViewLink.replace('/view', '/preview')}
                  title={previewDoc.nama}
                  className="w-full h-[75vh] rounded-lg bg-white border-0"
                />
              ) : (
                <div className="text-center text-white p-8">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold">Dokumen PDF Terarsip di Google Drive</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Gunakan tombol di atas untuk membuka dokumen secara langsung di Google Drive.
                  </p>
                  {previewDoc.driveWebViewLink && (
                    <a
                      href={previewDoc.driveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka File Sekarang</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: INPUT / EDIT PTK */}
      {/* ============================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>{editingGuru ? 'Edit Data PTK' : 'Tambah Guru & Tenaga Kependidikan'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap &amp; Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap || ''}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  placeholder="Contoh: Sukrianto, S.Pd., M.Pd."
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIP / NIPPPK</label>
                  <input
                    type="text"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="19850101 201001 1 001"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NUPTK</label>
                  <input
                    type="text"
                    value={formData.nuptk || ''}
                    onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                    placeholder="1234567890123456"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jenis PTK</label>
                  <select
                    value={formData.jenisPTK || 'Guru Mapel'}
                    onChange={(e) => setFormData({ ...formData, jenisPTK: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Guru BK">Guru BK</option>
                    <option value="Tenaga Administrasi Sekolah">Tenaga Administrasi (TU)</option>
                    <option value="Penjaga / Kebersihan">Penjaga / Kebersihan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Kepegawaian</label>
                  <select
                    value={formData.statusKepegawaian || 'PNS'}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer / GTT">Honorer / GTT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pangkat &amp; Golongan</label>
                  <input
                    type="text"
                    value={formData.golongan || ''}
                    onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                    placeholder="Penata, III/c"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jabatan Fungsional/Struktural</label>
                  <input
                    type="text"
                    value={formData.jabatan || ''}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Guru Ahli Madya / Kepala TU"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">TMT Pengangkatan Pertama</label>
                  <input
                    type="date"
                    value={formData.tmtPengangkatan || ''}
                    onChange={(e) => setFormData({ ...formData, tmtPengangkatan: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pendidikan Terakhir</label>
                  <input
                    type="text"
                    value={formData.pendidikanTerakhir || ''}
                    onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                    placeholder="S1 / S2"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jurusan / Program Studi</label>
                  <input
                    type="text"
                    value={formData.jurusan || ''}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    placeholder="Pendidikan Matematika"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Sertifikasi</label>
                  <select
                    value={formData.statusSertifikasi || 'Sudah Sertifikasi'}
                    onChange={(e) => setFormData({ ...formData, statusSertifikasi: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="Sudah Sertifikasi">Sudah Sertifikasi</option>
                    <option value="Belum Sertifikasi">Belum Sertifikasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="0852-xxxx-xxxx"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Aktif</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="guru@smpn2puriala.sch.id"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-md"
                >
                  Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CETAK BIODATA PEGAWAI RESMI */}
      {/* ============================================================= */}
      {selectedGuruDetail && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <span className="font-extrabold text-sm uppercase text-slate-800">BIODATA PEGAWAI / PTK RESMI</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Biodata</span>
                </button>
                <button onClick={() => setSelectedGuruDetail(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-800 p-6 printable-document text-slate-900 font-sans text-xs">
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
                <p className="font-bold text-xs uppercase">PEMERINTAH KABUPATEN KONAWE - DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                <h3 className="font-extrabold text-base uppercase">{identitasSekolah.namaSekolah}</h3>
                <h4 className="font-bold text-xs uppercase underline mt-1">LEMBAR BIODATA PENDIDIK DAN TENAGA KEPENDIDIKAN</h4>
              </div>

              <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold w-44">Nama Lengkap &amp; Gelar</td>
                    <td className="border border-slate-800 p-2 font-bold text-teal-950">{selectedGuruDetail.namaLengkap}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">NIP / NIPPPK</td>
                    <td className="border border-slate-800 p-2 font-mono font-bold">{selectedGuruDetail.nip}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">NUPTK</td>
                    <td className="border border-slate-800 p-2 font-mono">{selectedGuruDetail.nuptk}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Status Kepegawaian</td>
                    <td className="border border-slate-800 p-2 font-semibold">{selectedGuruDetail.statusKepegawaian} ({selectedGuruDetail.golongan})</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Jabatan / Tugas</td>
                    <td className="border border-slate-800 p-2">{selectedGuruDetail.jabatan}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Pendidikan Terakhir</td>
                    <td className="border border-slate-800 p-2">{selectedGuruDetail.pendidikanTerakhir} - {selectedGuruDetail.jurusan}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Status Sertifikasi</td>
                    <td className="border border-slate-800 p-2 font-bold">{selectedGuruDetail.statusSertifikasi}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Kontak &amp; Email</td>
                    <td className="border border-slate-800 p-2">HP: {selectedGuruDetail.noHp} | Email: {selectedGuruDetail.email}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-4 text-xs">
                <div className="text-center w-56">
                  <p>Puriala, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-semibold">Kepala {identitasSekolah.namaSekolah},</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{identitasSekolah.namaKepalaSekolah}</p>
                  <p className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaSekolah}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: KONFIRMASI HAPUS PTK */}
      {/* ============================================================= */}
      {guruToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Hapus Data Guru / PTK?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data pendidik / tenaga kependidikan berikut dari database sekolah?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 mb-5 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {guruToDelete.namaLengkap}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                NIP. {guruToDelete.nip} | NUPTK: {guruToDelete.nuptk || '-'}
              </div>
              <div className="text-teal-800 font-medium text-[11px] pt-1 border-t border-slate-200/80">
                Jabatan: <strong>{guruToDelete.jabatan}</strong> ({guruToDelete.statusKepegawaian})
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGuruToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(guruToDelete.id);
                  setGuruToDelete(null);
                  showNotification(`Data ${guruToDelete.namaLengkap} berhasil dihapus.`, 'info');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CETAK DAFTAR GURU & PTK (PRINT PDF RESMI) */}
      {/* ============================================================= */}
      {isPrintListModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[94vh] overflow-y-auto light-scrollbar">
            {/* Header Controls (not printed) */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100 mb-4 no-print">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase text-slate-800">
                    CETAK DAFTAR GURU &amp; TENAGA KEPENDIDIKAN (PTK)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pratinjau dokumen cetak resmi &amp; ekspor PDF format Kepegawaian Sekolah
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter PTK:</span>
                  <select
                    value={printCategoryOption}
                    onChange={(e) => setPrintCategoryOption(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Semua">Semua PTK ({guruList.length} Orang)</option>
                    <option value="PNS">Hanya PNS ({guruList.filter((g) => g.statusKepegawaian === 'PNS').length})</option>
                    <option value="PPPK">Hanya PPPK ({guruList.filter((g) => g.statusKepegawaian === 'PPPK').length})</option>
                    <option value="Honorer / GTT">Non-ASN / Honorer ({guruList.filter((g) => g.statusKepegawaian?.includes('Honorer')).length})</option>
                    <option value="Guru Mapel">Guru Mata Pelajaran ({guruList.filter((g) => g.jenisPTK === 'Guru Mapel').length})</option>
                    <option value="Tenaga Administrasi Sekolah">Tenaga Administrasi ({guruList.filter((g) => g.jenisPTK === 'Tenaga Administrasi Sekolah').length})</option>
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang (PDF / Print)</span>
                </button>
                <button
                  onClick={() => setIsPrintListModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="border border-slate-800 p-6 printable-document text-slate-900 font-sans text-xs bg-white">
              {/* Kop Resmi Sekolah */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <p className="font-bold text-[11px] uppercase tracking-wider">
                  PEMERINTAH KABUPATEN KONAWE • DINAS PENDIDIKAN DAN KEBUDAYAAN
                </p>
                <h2 className="font-extrabold text-lg uppercase tracking-wide mt-0.5">
                  {identitasSekolah.namaSekolah}
                </h2>
                <p className="text-[10px] text-slate-600">
                  NPSN: {identitasSekolah.npsn} • NSS: {identitasSekolah.nss} • Akreditasi: {identitasSekolah.akreditasi}
                </p>
                <p className="text-[10px] text-slate-600">
                  Alamat: {identitasSekolah.alamatSekolah}, Kec. Puriala, Kab. Konawe, Sulawesi Tenggara
                </p>
                <div className="mt-2 pt-2 border-t border-slate-400">
                  <h3 className="font-extrabold text-sm uppercase underline">
                    DAFTAR NOMINATIF GURU DAN TENAGA KEPENDIDIKAN (PTK)
                  </h3>
                  <p className="text-[10px] font-medium text-slate-700">
                    Tahun Ajaran 2025/2026 • Kategori: {printCategoryOption}
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 uppercase">
                      <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-800 p-1.5 text-left">Nama Lengkap &amp; Gelar</th>
                      <th className="border border-slate-800 p-1.5 text-center w-24">NIP / NUPTK</th>
                      <th className="border border-slate-800 p-1.5 text-left">Jabatan / Tugas</th>
                      <th className="border border-slate-800 p-1.5 text-center w-16">Gol / Ruang</th>
                      <th className="border border-slate-800 p-1.5 text-center w-16">Status</th>
                      <th className="border border-slate-800 p-1.5 text-left">Pendidikan &amp; Jurusan</th>
                      <th className="border border-slate-800 p-1.5 text-center w-20">Sertifikasi</th>
                      <th className="border border-slate-800 p-1.5 text-center w-16">Berkas Digital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guruList
                      .filter((g) => {
                        if (printCategoryOption === 'Semua') return true;
                        if (printCategoryOption === 'PNS') return g.statusKepegawaian === 'PNS';
                        if (printCategoryOption === 'PPPK') return g.statusKepegawaian === 'PPPK';
                        if (printCategoryOption === 'Honorer / GTT') return g.statusKepegawaian?.includes('Honorer');
                        if (printCategoryOption === 'Guru Mapel') return g.jenisPTK === 'Guru Mapel';
                        if (printCategoryOption === 'Tenaga Administrasi Sekolah') return g.jenisPTK === 'Tenaga Administrasi Sekolah';
                        return true;
                      })
                      .map((guru, idx) => (
                        <tr key={guru.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border border-slate-800 p-1.5 text-center font-medium">{idx + 1}</td>
                          <td className="border border-slate-800 p-1.5 font-bold text-slate-900">{guru.namaLengkap}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-mono text-[9px]">
                            <div>NIP: {guru.nip}</div>
                            {guru.nuptk && guru.nuptk !== '-' && <div className="text-slate-500">NUPTK: {guru.nuptk}</div>}
                          </td>
                          <td className="border border-slate-800 p-1.5 font-semibold text-teal-900">{guru.jabatan}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{guru.golongan}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-semibold">{guru.statusKepegawaian}</td>
                          <td className="border border-slate-800 p-1.5">
                            {guru.pendidikanTerakhir} - {guru.jurusan}
                          </td>
                          <td className="border border-slate-800 p-1.5 text-center">
                            {guru.statusSertifikasi === 'Sudah Sertifikasi' ? 'Lulus (Serdik)' : 'Belum'}
                          </td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">
                            {(guru.berkasDigital || []).length} Berkas
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="mt-3 flex justify-between items-center text-[10px] text-slate-700 bg-slate-50 p-2 border border-slate-300">
                <div>
                  <strong>Total PTK Terdaftar: </strong>
                  {
                    guruList.filter((g) => {
                      if (printCategoryOption === 'Semua') return true;
                      if (printCategoryOption === 'PNS') return g.statusKepegawaian === 'PNS';
                      if (printCategoryOption === 'PPPK') return g.statusKepegawaian === 'PPPK';
                      if (printCategoryOption === 'Honorer / GTT') return g.statusKepegawaian?.includes('Honorer');
                      if (printCategoryOption === 'Guru Mapel') return g.jenisPTK === 'Guru Mapel';
                      if (printCategoryOption === 'Tenaga Administrasi Sekolah') return g.jenisPTK === 'Tenaga Administrasi Sekolah';
                      return true;
                    }).length
                  } Orang
                </div>
                <div className="flex gap-4">
                  <span>
                    PNS/PPPK (ASN):{' '}
                    <strong>
                      {guruList.filter((g) => g.statusKepegawaian === 'PNS' || g.statusKepegawaian === 'PPPK').length}
                    </strong>
                  </span>
                  <span>
                    Non-ASN / Honorer:{' '}
                    <strong>
                      {guruList.filter((g) => g.statusKepegawaian?.includes('Honorer')).length}
                    </strong>
                  </span>
                  <span>
                    Sertifikasi Guru:{' '}
                    <strong>
                      {guruList.filter((g) => g.statusSertifikasi === 'Sudah Sertifikasi').length}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-6 pt-6 mt-4 text-[11px]">
                <div className="text-center">
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Kepala {identitasSekolah.namaSekolah}</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{identitasSekolah.namaKepalaSekolah}</p>
                  <p className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaSekolah}</p>
                </div>
                <div className="text-center">
                  <p>Puriala, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-semibold">Pengelola Kepegawaian / Kepala TU,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{identitasSekolah.namaKepalaTU}</p>
                  <p className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaTU}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
