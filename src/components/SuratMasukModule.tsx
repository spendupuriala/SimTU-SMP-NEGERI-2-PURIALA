import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  X,
  FileCheck,
  Download,
  Building2,
  Calendar,
  Layers,
  Cloud,
  Folder,
  FileSpreadsheet,
  RotateCw,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  AlertCircle,
  Table,
  LayoutGrid,
  Check,
  RefreshCw,
  Sparkles,
  Paperclip,
  Upload,
  Image as ImageIcon,
  File,
  CheckCheck,
  Loader2,
  HardDrive,
  ZoomIn,
} from 'lucide-react';
import { SuratMasuk, SifatSurat, IdentitasSekolah } from '../types';
import {
  getSpreadsheetMetadata,
  readSheetData,
  resolveSheetTabName,
  parseSuratMasukFromRows,
  writeSuratMasukToSheet,
  findOrCreateSuratMasukSpreadsheet,
  SpreadsheetSearchResult,
  ParsedSheetSuratMasuk,
} from '../services/googleSheets';
import {
  uploadSuratMasukFileToDrive,
  findOrCreateSuratMasukUploadFolder,
} from '../services/googleDrive';

interface SuratMasukModuleProps {
  suratList: SuratMasuk[];
  onAdd: (surat: SuratMasuk) => void;
  onUpdate: (surat: SuratMasuk) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
  googleUser?: any;
  googleToken?: string | null;
  isGoogleConnected?: boolean;
  isGoogleLoading?: boolean;
  onConnectGoogle?: () => void;
  onBatchUpdate?: (newList: SuratMasuk[], mode: 'replace' | 'merge') => void;
}

export const SuratMasukModule: React.FC<SuratMasukModuleProps> = ({
  suratList,
  onAdd,
  onUpdate,
  onDelete,
  identitasSekolah,
  googleUser,
  googleToken,
  isGoogleConnected,
  isGoogleLoading,
  onConnectGoogle,
  onBatchUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sifatFilter, setSifatFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'sheet-table' | 'cards'>('sheet-table');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSuratForDisposisi, setSelectedSuratForDisposisi] = useState<SuratMasuk | null>(null);
  const [selectedSuratForDetail, setSelectedSuratForDetail] = useState<SuratMasuk | null>(null);
  const [editingSurat, setEditingSurat] = useState<SuratMasuk | null>(null);
  const [suratToDelete, setSuratToDelete] = useState<SuratMasuk | null>(null);

  // Google Sheets Integration State
  const [connectedSpreadsheet, setConnectedSpreadsheet] = useState<{
    id: string;
    name: string;
    folderName: string;
    sheetName: string;
    webViewLink?: string;
  } | null>(null);

  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);
  const [availableSpreadsheets, setAvailableSpreadsheets] = useState<SpreadsheetSearchResult[]>([]);
  const [isSpreadsheetPickerOpen, setIsSpreadsheetPickerOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [parsedPreviewData, setParsedPreviewData] = useState<ParsedSheetSuratMasuk | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // File Upload and Auto-Sync to Google Drive: TATA USAHA/SURAT/SURAT MASUK
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadAttachmentStatus, setUploadAttachmentStatus] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Document Viewer Preview Modal
  const [previewDocument, setPreviewDocument] = useState<{
    url: string;
    name: string;
    isImage: boolean;
    mimeType?: string;
    driveWebViewLink?: string;
  } | null>(null);

  // Helper to compute next agenda number based on the highest existing agenda number in suratList
  const getNextAgendaNumber = (): string => {
    let maxNumber = 0;
    suratList.forEach((s) => {
      const match = (s.noAgenda || '').match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    // If no numbers found from regex, fallback to suratList.length
    const nextNum = maxNumber > 0 ? maxNumber + 1 : suratList.length + 1;
    const year = new Date().getFullYear();
    return `${String(nextNum).padStart(3, '0')}/SM/${year}`;
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<SuratMasuk>>({
    noAgenda: getNextAgendaNumber(),
    noSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tanggalTerima: new Date().toISOString().split('T')[0],
    asalSurat: '',
    perihal: '',
    sifat: 'Biasa',
    kategori: 'Umum / Dinas',
    ringkasan: '',
    lampiranNama: '',
    lampiranUkuran: '',
    fileUrl: '',
    fileMimeType: '',
    driveFileId: '',
    driveWebViewLink: '',
    statusDisposisi: 'Belum Disposisi',
    diteruskanKepada: [],
    instruksiDisposisi: '',
    catatanKepsek: '',
    statusDrive: 'Tersimpan',
    drivePath: 'TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT',
  });

  // Auto-discover "Tata Usaha / Aplikasi Tata Usaha" spreadsheet when token changes
  useEffect(() => {
    if (googleToken && isGoogleConnected) {
      autoDetectSpreadsheet(googleToken);
    }
  }, [googleToken, isGoogleConnected]);

  const autoDetectSpreadsheet = async (token: string) => {
    try {
      setIsLoadingSheets(true);
      const res = await findOrCreateSuratMasukSpreadsheet(token, suratList);
      setConnectedSpreadsheet({
        id: res.spreadsheetId,
        name: 'BUKU_AGENDA_SURAT_MASUK',
        folderName: '01_SURAT_MASUK',
        sheetName: 'SURAT MASUK',
        webViewLink: res.webViewLink,
      });
    } catch (err: any) {
      console.warn('Auto detect spreadsheet error:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Fetch / Import data directly from Google Sheets (SURAT MASUK)
  const handleFetchFromGoogleSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    let targetSpreadsheet = connectedSpreadsheet;

    if (!targetSpreadsheet?.id) {
      try {
        setIsLoadingSheets(true);
        const res = await findOrCreateSuratMasukSpreadsheet(googleToken, suratList);
        targetSpreadsheet = {
          id: res.spreadsheetId,
          name: 'BUKU_AGENDA_SURAT_MASUK',
          folderName: '01_SURAT_MASUK',
          sheetName: 'SURAT MASUK',
          webViewLink: res.webViewLink,
        };
        setConnectedSpreadsheet(targetSpreadsheet);
      } catch (err: any) {
        showNotification(`Gagal menyambungkan spreadsheet: ${err.message}`, 'error');
        return;
      } finally {
        setIsLoadingSheets(false);
      }
    }

    try {
      setIsLoadingSheets(true);
      const tabName = await resolveSheetTabName(googleToken, targetSpreadsheet.id, [
        targetSpreadsheet.sheetName,
        'SURAT MASUK',
      ]);

      if (tabName !== targetSpreadsheet.sheetName) {
        setConnectedSpreadsheet((prev) => (prev ? { ...prev, sheetName: tabName } : null));
      }

      const rawRows = await readSheetData(googleToken, targetSpreadsheet.id, tabName);
      
      if (!rawRows || rawRows.length <= 1) {
        showNotification(`Sheet "${tabName}" kosong atau hanya memiliki judul kolom.`, 'info');
        return;
      }

      const parsed = parseSuratMasukFromRows(rawRows);
      setParsedPreviewData(parsed);
      setIsImportPreviewOpen(true);
    } catch (err: any) {
      console.error('Fetch sheet error:', err);
      showNotification(`Gagal membaca sheet ${targetSpreadsheet?.sheetName || 'Google Sheets'}: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Direct Replace All Data from Google Sheet (SURAT MASUK)
  const handleDirectReplaceFromSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    let targetSpreadsheet = connectedSpreadsheet;

    if (!targetSpreadsheet?.id) {
      try {
        setIsLoadingSheets(true);
        const res = await findOrCreateSuratMasukSpreadsheet(googleToken, suratList);
        targetSpreadsheet = {
          id: res.spreadsheetId,
          name: 'BUKU_AGENDA_SURAT_MASUK',
          folderName: '01_SURAT_MASUK',
          sheetName: 'SURAT MASUK',
          webViewLink: res.webViewLink,
        };
        setConnectedSpreadsheet(targetSpreadsheet);
      } catch (err: any) {
        showNotification(`Gagal menyambungkan spreadsheet: ${err.message}`, 'error');
        return;
      } finally {
        setIsLoadingSheets(false);
      }
    }

    try {
      setIsLoadingSheets(true);
      const tabName = await resolveSheetTabName(googleToken, targetSpreadsheet.id, [
        targetSpreadsheet.sheetName,
        'SURAT MASUK',
      ]);

      if (tabName !== targetSpreadsheet.sheetName) {
        setConnectedSpreadsheet((prev) => (prev ? { ...prev, sheetName: tabName } : null));
      }

      const rawRows = await readSheetData(googleToken, targetSpreadsheet.id, tabName);
      if (!rawRows || rawRows.length <= 1) {
        showNotification(`Sheet "${tabName}" kosong atau hanya memiliki judul kolom.`, 'info');
        return;
      }

      const parsed = parseSuratMasukFromRows(rawRows);
      if (!parsed.suratList || parsed.suratList.length === 0) {
        showNotification('Tidak ada data surat yang valid ditemukan pada sheet tersebut.', 'error');
        return;
      }

      if (onBatchUpdate) {
        onBatchUpdate(parsed.suratList, 'replace');
      }

      showNotification(
        `Sukses! Seluruh data lokal (${suratList.length} surat) diganti dengan ${parsed.suratList.length} data dari Google Sheet (Tab: "${tabName}").`,
        'success'
      );
    } catch (err: any) {
      console.error('Direct replace error:', err);
      showNotification(`Gagal mengganti data: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  useEffect(() => {
    const handlePullEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.moduleName === 'Surat Masuk') {
        handleDirectReplaceFromSheet();
      }
    };
    window.addEventListener('simtu-pull-data', handlePullEvent);
    return () => window.removeEventListener('simtu-pull-data', handlePullEvent);
  }, [googleToken, connectedSpreadsheet, suratList]);

  // Confirm import from preview modal
  const handleApplyImport = (mode: 'replace' | 'merge') => {
    if (!parsedPreviewData || parsedPreviewData.suratList.length === 0) {
      showNotification('Tidak ada data surat yang ditemukan pada sheet ini.', 'error');
      return;
    }

    if (onBatchUpdate) {
      onBatchUpdate(parsedPreviewData.suratList, mode);
    } else {
      parsedPreviewData.suratList.forEach((s) => onAdd(s));
    }

    setIsImportPreviewOpen(false);
    const activeTab = connectedSpreadsheet?.sheetName || 'Google Sheets';
    showNotification(
      mode === 'replace'
        ? `Sukses! Seluruh data lokal diganti dengan ${parsedPreviewData.suratList.length} data dari Sheet "${activeTab}".`
        : `Berhasil menggabungkan ${parsedPreviewData.suratList.length} data Surat Masuk dari Sheet "${activeTab}"!`,
      'success'
    );
  };

  // Push / Export local Surat Masuk data back to Google Sheets
  const handleSyncToGoogleSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    if (!connectedSpreadsheet?.id) {
      try {
        setIsSyncingToSheet(true);
        const res = await findOrCreateSuratMasukSpreadsheet(googleToken, suratList);
        setConnectedSpreadsheet({
          id: res.spreadsheetId,
          name: 'BUKU_AGENDA_SURAT_MASUK',
          folderName: '01_SURAT_MASUK',
          sheetName: 'SURAT MASUK',
          webViewLink: res.webViewLink,
        });
        showNotification('Berhasil menyinkronkan data Surat Masuk ke Google Sheets!', 'success');
      } catch (err: any) {
        showNotification(`Gagal menyambungkan spreadsheet: ${err.message}`, 'error');
      } finally {
        setIsSyncingToSheet(false);
      }
      return;
    }

    try {
      setIsSyncingToSheet(true);
      await writeSuratMasukToSheet(
        googleToken,
        connectedSpreadsheet.id,
        suratList,
        connectedSpreadsheet.sheetName
      );
      showNotification(
        `Berhasil menyinkronkan ${suratList.length} data Surat Masuk ke Google Sheet "${connectedSpreadsheet.sheetName}"!`,
        'success'
      );
    } catch (err: any) {
      console.error('Sync to sheet error:', err);
      showNotification(`Gagal menyinkronkan ke Google Sheet: ${err.message}`, 'error');
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  // Create official Tata Usaha spreadsheet if user doesn't have one
  const handleCreateOfficialSpreadsheet = async () => {
    if (!googleToken) return;
    try {
      setIsLoadingSheets(true);
      const res = await findOrCreateSuratMasukSpreadsheet(googleToken, suratList);
      setConnectedSpreadsheet({
        id: res.spreadsheetId,
        name: 'BUKU_AGENDA_SURAT_MASUK',
        folderName: '01_SURAT_MASUK',
        sheetName: 'SURAT MASUK',
        webViewLink: res.webViewLink,
      });
      setIsSpreadsheetPickerOpen(false);
      showNotification('Spreadsheet "BUKU_AGENDA_SURAT_MASUK" berhasil dibuat/ditemukan di folder "01_SURAT_MASUK"!', 'success');
    } catch (err: any) {
      showNotification(`Gagal menyambungkan spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Handle File Upload and Direct Auto-Upload to Google Drive Folder: TATA USAHA/SURAT/SURAT MASUK
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const sizeStr = formatFileSize(file.size);
    const isImage = file.type.startsWith('image/');
    const localBlobUrl = URL.createObjectURL(file);

    // If Google Drive is not connected yet, trigger connect
    if (!googleToken) {
      setUploadAttachmentStatus('Google Drive belum terhubung. Menghubungkan Google Drive...');
      if (onConnectGoogle) {
        onConnectGoogle();
      }
      showNotification('Harap hubungkan Google Drive agar berkas langsung tersimpan ke folder TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT.', 'info');
      return;
    }

    try {
      setIsUploadingAttachment(true);
      setUploadAttachmentStatus('Mengunggah langsung ke Google Drive: TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT...');

      // Update basic metadata and temporary blob for live modal preview
      setFormData((prev) => ({
        ...prev,
        lampiranNama: file.name,
        lampiranUkuran: sizeStr,
        fileMimeType: file.type || (isImage ? 'image/jpeg' : 'application/pdf'),
        fileUrl: localBlobUrl, // temporary blob url for immediate modal preview
        drivePath: 'TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT',
        statusDrive: 'Mengunggah ke Drive...',
      }));

      const cleanAgenda = (formData.noAgenda || 'SM').replace(/[\/\\?%*:|"<>]/g, '_');
      const destinationFileName = `[SM_${cleanAgenda}]_${file.name}`;

      const uploaded = await uploadSuratMasukFileToDrive(
        googleToken,
        file,
        destinationFileName,
        file.type || 'application/octet-stream'
      );

      const driveLink = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;

      // Set direct Google Drive links (no local base64 stored)
      setFormData((prev) => ({
        ...prev,
        driveFileId: uploaded.id,
        driveWebViewLink: driveLink,
        fileUrl: driveLink,
        statusDrive: 'Tersimpan',
        drivePath: 'TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT',
      }));

      setUploadAttachmentStatus('✓ Berkas otomatis tersimpan di Google Drive: TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT');
      showNotification(
        `Dokumen "${file.name}" berhasil diunggah langsung ke Google Drive di Folder "TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT"`,
        'success'
      );
    } catch (err: any) {
      console.error('Upload document to Surat Masuk drive failed:', err);
      setUploadAttachmentStatus('Gagal upload ke Google Drive. Silakan coba lagi.');
      showNotification(`Gagal upload ke Google Drive: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      lampiranNama: '',
      lampiranUkuran: '',
      fileUrl: '',
      fileMimeType: '',
      driveFileId: '',
      driveWebViewLink: '',
    }));
    setUploadAttachmentStatus(null);
    setIsUploadingAttachment(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      noAgenda: getNextAgendaNumber(),
      noSurat: '',
      tanggalSurat: new Date().toISOString().split('T')[0],
      tanggalTerima: new Date().toISOString().split('T')[0],
      asalSurat: '',
      perihal: '',
      sifat: 'Biasa',
      kategori: 'Umum / Dinas',
      ringkasan: '',
      lampiranNama: '',
      lampiranUkuran: '',
      fileUrl: '',
      fileMimeType: '',
      driveFileId: '',
      driveWebViewLink: '',
      statusDisposisi: 'Belum Disposisi',
      diteruskanKepada: [],
      instruksiDisposisi: '',
      catatanKepsek: '',
      statusDrive: googleToken ? 'Tersimpan' : 'Lokal Saja',
      drivePath: 'TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT',
    });
    setEditingSurat(null);
    setUploadAttachmentStatus(null);
    setIsUploadingAttachment(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (surat: SuratMasuk) => {
    setEditingSurat(surat);
    setFormData({ ...surat });
    setUploadAttachmentStatus(
      surat.driveFileId || surat.driveWebViewLink
        ? '✓ Berkas tersimpan di Google Drive: TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT'
        : surat.lampiranNama
        ? 'Berkas terlampir di data'
        : null
    );
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noSurat || !formData.perihal || !formData.asalSurat) {
      alert('Mohon lengkapi Nomor Surat, Asal Surat, dan Perihal!');
      return;
    }

    const resolvedFileUrl = formData.driveWebViewLink || (formData.driveFileId ? `https://drive.google.com/file/d/${formData.driveFileId}/view` : formData.fileUrl);

    if (editingSurat) {
      onUpdate({
        ...(editingSurat as SuratMasuk),
        ...formData,
        fileUrl: resolvedFileUrl,
        drivePath: 'TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT',
        statusDrive: 'Tersimpan',
      } as SuratMasuk);
      showNotification(`Data surat masuk ${formData.noSurat} berhasil diperbarui!`, 'success');
    } else {
      const nextAgenda = formData.noAgenda || getNextAgendaNumber();
      const newSurat: SuratMasuk = {
        id: `SM-${Date.now()}`,
        noAgenda: nextAgenda,
        noSurat: formData.noSurat || '',
        tanggalSurat: formData.tanggalSurat || new Date().toISOString().split('T')[0],
        tanggalTerima: formData.tanggalTerima || new Date().toISOString().split('T')[0],
        asalSurat: formData.asalSurat || '',
        perihal: formData.perihal || '',
        sifat: (formData.sifat as SifatSurat) || 'Biasa',
        kategori: formData.kategori || 'Umum / Dinas',
        ringkasan: formData.ringkasan || '',
        lampiranNama: formData.lampiranNama || undefined,
        lampiranUkuran: formData.lampiranUkuran || undefined,
        fileUrl: resolvedFileUrl || undefined,
        fileMimeType: formData.fileMimeType || undefined,
        driveFileId: formData.driveFileId || undefined,
        driveWebViewLink: formData.driveWebViewLink || undefined,
        statusDisposisi: formData.statusDisposisi || 'Belum Disposisi',
        diteruskanKepada: formData.diteruskanKepada || [],
        instruksiDisposisi: formData.instruksiDisposisi || '',
        catatanKepsek: formData.catatanKepsek || '',
        tanggalDisposisi: formData.statusDisposisi === 'Sudah Disposisi' ? new Date().toISOString().split('T')[0] : undefined,
        statusDrive: 'Tersimpan',
        drivePath: 'TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT',
      };
      onAdd(newSurat);
      showNotification(`Surat masuk baru ${newSurat.noSurat} berhasil disimpan!`, 'success');
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSaveDisposisi = (surat: SuratMasuk, instruksi: string, catatan: string, diteruskan: string[]) => {
    const updated: SuratMasuk = {
      ...surat,
      statusDisposisi: 'Sudah Disposisi',
      instruksiDisposisi: instruksi,
      catatanKepsek: catatan,
      diteruskanKepada: diteruskan,
      tanggalDisposisi: new Date().toISOString().split('T')[0],
    };
    onUpdate(updated);
    setSelectedSuratForDisposisi(updated);
  };

  // Filtered List
  const filtered = suratList.filter((s) => {
    const matchSearch =
      s.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.asalSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.noAgenda.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSifat = sifatFilter === 'Semua' || s.sifat === sifatFilter;
    const matchStatus = statusFilter === 'Semua' || s.statusDisposisi === statusFilter;
    return matchSearch && matchSifat && matchStatus;
  });

  const printDisposisi = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`fixed top-4 right-4 z-50 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
            feedbackToast.type === 'success'
              ? 'bg-slate-900 border-emerald-500'
              : feedbackToast.type === 'error'
              ? 'bg-rose-950 border-rose-500'
              : 'bg-slate-900 border-blue-500'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide flex items-center gap-1.5">
            <span>Persuratan</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Surat Masuk</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ml-1">
              <FileSpreadsheet className="w-3 h-3" />
              <span>Google Sheets Connected</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            <span>AGENDA & ARSIP SURAT MASUK (GOOGLE DRIVE INTEGRATED)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setViewMode('sheet-table')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'sheet-table'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Format Tabel Google Sheet"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Format Sheet</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Ringkas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>

          <button
            onClick={() => {
              handleDirectReplaceFromSheet();
            }}
            disabled={isLoadingSheets}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 border border-emerald-500"
            title="Ganti seluruh data surat masuk saat ini dengan data terbaru pada Google Sheet (KOTAK MASUK / SURAT MASUK)"
          >
            {isLoadingSheets ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Ganti Semua Data (Replace dari Sheet)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Surat Masuk</span>
          </button>
        </div>
      </div>

      {/* GOOGLE DRIVE & SHEETS INTEGRATION BAR: "Tata Usaha / Aplikasi Tata Usaha / SURAT MASUK" */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white p-4 sm:p-5 shadow-md border border-blue-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Target Location Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-blue-200">
                    SUMBER GOOGLE DRIVE & GOOGLE SHEETS
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isGoogleConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isGoogleConnected ? '● Online Drive' : '○ Belum Login'}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-extrabold flex items-center gap-1.5 mt-0.5 text-white">
                  <Folder className="w-4 h-4 text-amber-400 inline" />
                  <span>{connectedSpreadsheet?.folderName || 'Tata Usaha'}</span>
                  <span className="text-blue-300 font-mono">/</span>
                  <span className="text-emerald-300 underline underline-offset-2">
                    {connectedSpreadsheet?.name || 'Aplikasi Tata Usaha'}
                  </span>
                  <span className="text-blue-300 font-mono">/</span>
                  <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/40 font-mono text-xs">
                    Sheet: "{connectedSpreadsheet?.sheetName || 'SURAT MASUK'}"
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-blue-200/90 pl-11">
              Data surat masuk tersinkronisasi langsung dengan format tabel pada sheet <strong>"SURAT MASUK"</strong> di Google Drive sekolah.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap pl-11 lg:pl-0">
            {isGoogleConnected ? (
              <>
                {/* Button: Tarik Data dari Google Sheet */}
                <button
                  type="button"
                  onClick={handleFetchFromGoogleSheet}
                  disabled={isLoadingSheets}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold py-2 px-3.5 rounded-xl shadow-lg transition flex items-center gap-1.5 border border-emerald-400/30"
                  title="Ambil dan selaraskan data dari sheet SURAT MASUK di Google Drive"
                >
                  {isLoadingSheets ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <DownloadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Tarik Data dari Sheet</span>
                </button>

                {/* Button: Sinkronkan ke Google Sheet */}
                <button
                  type="button"
                  onClick={handleSyncToGoogleSheet}
                  disabled={isSyncingToSheet}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-lg transition flex items-center gap-1.5 border border-blue-400/30"
                  title="Kirim dan simpan data lokal ke sheet SURAT MASUK"
                >
                  {isSyncingToSheet ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Kirim ke Sheet</span>
                </button>

                {/* Button: Buka di Google Sheets */}
                {connectedSpreadsheet?.webViewLink && (
                  <a
                    href={connectedSpreadsheet.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 px-3 rounded-xl transition flex items-center gap-1 border border-white/10"
                    title="Buka spreadsheet di tab Google Sheets baru"
                  >
                    <span>Buka File Sheet</span>
                    <ExternalLink className="w-3 h-3 text-blue-300" />
                  </a>
                )}

                {/* Button: Ganti / Pilih Spreadsheet */}
                <button
                  type="button"
                  onClick={() => setIsSpreadsheetPickerOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 px-3 rounded-xl transition flex items-center gap-1 border border-white/10"
                  title="Pilih berkas spreadsheet lain dari Google Drive"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Pilih File</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onConnectGoogle}
                disabled={isGoogleLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-2 px-4 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                <span>{isGoogleLoading ? 'Menghubungkan...' : 'Hubungkan Google Drive untuk Ambil Data'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor surat, asal pengirim, agenda, atau perihal surat masuk..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Sifat:</span>
          </div>
          <select
            value={sifatFilter}
            onChange={(e) => setSifatFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Sifat</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Segera">Segera</option>
            <option value="Sangat Segera">Sangat Segera</option>
            <option value="Rahasia">Rahasia</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua Status Disposisi</option>
            <option value="Belum Disposisi">Belum Disposisi</option>
            <option value="Sudah Disposisi">Sudah Disposisi</option>
            <option value="Selesai / Tindak Lanjut">Selesai</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: FORMAT TABEL GOOGLE SHEET (OFFICIAL AGENDA SHEET FORMAT) */}
      {viewMode === 'sheet-table' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Sheet Header Banner */}
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Format Tabel Sheet "SURAT MASUK" (Tata Usaha / Aplikasi Tata Usaha)</span>
            </div>
            <span className="text-[11px] bg-emerald-200/80 text-emerald-900 font-mono px-2 py-0.5 rounded">
              Total {filtered.length} Baris Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-100/90 text-slate-800 font-extrabold border-b-2 border-slate-300 text-[11px] uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12 bg-slate-200/70">No.</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[110px]">No. Agenda</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[100px]">Tgl Terima</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">Nomor Surat</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[100px]">Tgl Surat</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[180px]">Asal Pengirim</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[220px]">Perihal / Isi Ringkas</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[90px]">Sifat</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[160px]">Disposisi Kepsek</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[160px]">Instruksi / Catatan</th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p>Tidak ada data surat masuk yang sesuai filter.</p>
                      {isGoogleConnected && (
                        <button
                          onClick={handleFetchFromGoogleSheet}
                          className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                        >
                          Klik di sini untuk Tarik Data dari Google Sheet
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition">
                      {/* 1. No */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 font-bold bg-slate-50/50">
                        {index + 1}
                      </td>

                      {/* 2. No Agenda */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-blue-800 whitespace-nowrap">
                        {item.noAgenda}
                      </td>

                      {/* 3. Tanggal Terima */}
                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap font-mono text-slate-600">
                        {item.tanggalTerima}
                      </td>

                      {/* 4. Nomor Surat */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900">
                        {item.noSurat}
                      </td>

                      {/* 5. Tanggal Surat */}
                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap font-mono text-slate-600">
                        {item.tanggalSurat}
                      </td>

                      {/* 6. Asal Pengirim */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-800">
                        {item.asalSurat}
                      </td>

                      {/* 7. Perihal */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-900 line-clamp-2">{item.perihal}</div>
                        
                        {/* Attachments & Google Drive Links */}
                        {(item.driveWebViewLink || item.fileUrl || item.lampiranNama) && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {item.driveWebViewLink ? (
                              <a
                                href={item.driveWebViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-bold shadow-xs transition"
                                title="Buka berkas di Google Drive: TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT"
                              >
                                <Cloud className="w-3 h-3 text-emerald-600" />
                                <span className="truncate max-w-[130px]">{item.lampiranNama || 'Dokumen Drive'}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                              </a>
                            ) : item.fileUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocument({
                                    url: item.fileUrl!,
                                    name: item.lampiranNama || 'Dokumen Surat Masuk',
                                    isImage: item.fileMimeType?.startsWith('image/') || false,
                                    mimeType: item.fileMimeType,
                                    driveWebViewLink: item.driveWebViewLink,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[10px] text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded font-semibold transition"
                              >
                                <Paperclip className="w-3 h-3 text-blue-600" />
                                <span className="truncate max-w-[130px]">{item.lampiranNama || 'Lihat Berkas'}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span className="truncate max-w-[130px]">{item.lampiranNama}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 8. Sifat */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            item.sifat === 'Penting'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : item.sifat === 'Segera' || item.sifat === 'Amat Segera'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : item.sifat === 'Rahasia'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.sifat}
                        </span>
                      </td>

                      {/* 9. Disposisi Kepsek */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        {item.statusDisposisi === 'Sudah Disposisi' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terdisposisi
                            </span>
                            {item.diteruskanKepada && item.diteruskanKepada.length > 0 && (
                              <div className="text-[10px] text-slate-600 font-medium line-clamp-1">
                                Kepada: {item.diteruskanKepada.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-medium">
                            <Clock className="w-3 h-3 text-amber-500" /> Belum
                          </span>
                        )}
                      </td>

                      {/* 10. Instruksi / Catatan */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                        <div className="line-clamp-2 italic text-[11px]">
                          {item.catatanKepsek || item.instruksiDisposisi || '-'}
                        </div>
                      </td>

                      {/* 11. Aksi */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Disposisi */}
                          <button
                            onClick={() => setSelectedSuratForDisposisi(item)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1.5 rounded font-semibold text-[10px] flex items-center gap-1 transition"
                            title="Lembar Disposisi"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Disposisi</span>
                          </button>
                          {/* Detail */}
                          <button
                            onClick={() => setSelectedSuratForDetail(item)}
                            className="text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100 transition"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-slate-600 hover:text-amber-600 p-1.5 rounded hover:bg-slate-100 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            id={`btn-delete-surat-masuk-${item.id}`}
                            onClick={() => setSuratToDelete(item)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition"
                            title="Hapus Data Surat Masuk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Menampilkan {filtered.length} dari total {suratList.length} baris surat masuk</span>
            <span className="font-semibold text-slate-700">SIPEDAS Tata Usaha SMPN 2 Puriala</span>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS GRID */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-xs text-blue-700">{item.noAgenda}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      item.sifat === 'Penting'
                        ? 'bg-amber-100 text-amber-800'
                        : item.sifat === 'Segera' || item.sifat === 'Amat Segera'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.sifat}
                  </span>
                </div>

                <div className="mt-2.5">
                  <p className="font-mono font-bold text-slate-900 text-xs">{item.noSurat}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Dari: {item.asalSurat}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2">{item.perihal}</p>

                  {/* Card Attachment Indicator */}
                  {(item.driveWebViewLink || item.fileUrl || item.lampiranNama) && (
                    <div className="mt-2">
                      {item.driveWebViewLink ? (
                        <a
                          href={item.driveWebViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-bold transition"
                        >
                          <Cloud className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[150px]">{item.lampiranNama || 'Dokumen Drive'}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                        </a>
                      ) : item.fileUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDocument({
                              url: item.fileUrl!,
                              name: item.lampiranNama || 'Dokumen Surat Masuk',
                              isImage: item.fileMimeType?.startsWith('image/') || false,
                              mimeType: item.fileMimeType,
                              driveWebViewLink: item.driveWebViewLink,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[10px] text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded font-medium transition"
                        >
                          <Paperclip className="w-3 h-3 text-blue-600" />
                          <span className="truncate max-w-[150px]">{item.lampiranNama || 'Lihat Berkas'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{item.lampiranNama}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  Tgl Terima: <span className="text-slate-600 font-mono">{item.tanggalTerima}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedSuratForDisposisi(item)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded"
                  >
                    Disposisi
                  </button>
                  <button
                    onClick={() => setSelectedSuratForDetail(item)}
                    className="text-slate-500 hover:text-blue-600 p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="text-slate-500 hover:text-amber-600 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-delete-card-surat-masuk-${item.id}`}
                    onClick={() => setSuratToDelete(item)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Hapus Data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: SPREADSHEET PICKER & CONNECTION DIALOG */}
      {isSpreadsheetPickerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                  Pilih Spreadsheet Google Drive
                </h3>
              </div>
              <button
                onClick={() => setIsSpreadsheetPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Pilih file Google Spreadsheet di Google Drive sekolah yang memuat sheet <strong>"SURAT MASUK"</strong> untuk disinkronkan.
            </p>

            {/* List of found spreadsheets */}
            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
              {availableSpreadsheets.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  {isLoadingSheets ? (
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Sedang mencari file di Google Drive...</span>
                    </div>
                  ) : (
                    'Tidak ditemukan file spreadsheet. Anda dapat membuat file baru di bawah.'
                  )}
                </div>
              ) : (
                availableSpreadsheets.map((item) => (
                  <div
                    key={item.id}
                    onClick={async () => {
                      let tabName = 'KOTAK MASUK';
                      if (googleToken) {
                        try {
                          tabName = await resolveSheetTabName(googleToken, item.id, [
                            'KOTAK MASUK',
                            'SURAT MASUK',
                            'Kotak Masuk',
                            'Surat Masuk',
                            'Inbox',
                          ]);
                        } catch {
                          tabName = 'KOTAK MASUK';
                        }
                      }
                      setConnectedSpreadsheet({
                        id: item.id,
                        name: item.name,
                        folderName: item.folderName || 'Tata Usaha',
                        sheetName: tabName,
                        webViewLink: item.webViewLink || `https://docs.google.com/spreadsheets/d/${item.id}/edit`,
                      });
                      setIsSpreadsheetPickerOpen(false);
                      showNotification(`Spreadsheet "${item.name}" (Tab: ${tabName}) berhasil dihubungkan!`, 'success');
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      connectedSpreadsheet?.id === item.id
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500">
                          Folder: <strong>{item.folderName || 'Root'}</strong>
                        </p>
                      </div>
                    </div>
                    {connectedSpreadsheet?.id === item.id ? (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Terpilih
                      </span>
                    ) : (
                      <span className="text-[11px] text-blue-600 font-semibold hover:underline">
                        Pilih &rarr;
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Create Default Template Option */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-950 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Belum punya format file resmi?</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Sistem dapat membuat folder <strong>Tata Usaha</strong> dan spreadsheet <strong>Aplikasi Tata Usaha</strong> otomatis dengan sheet <strong>SURAT MASUK</strong> yang sudah siap pakai.
              </p>
              <button
                type="button"
                onClick={handleCreateOfficialSpreadsheet}
                disabled={isLoadingSheets}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2 shadow-sm text-xs"
              >
                {isLoadingSheets ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Buat Template "Aplikasi Tata Usaha" di Folder Tata Usaha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT PREVIEW FROM GOOGLE SHEET "SURAT MASUK" */}
      {isImportPreviewOpen && parsedPreviewData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                    Hasil Pembacaan Data Sheet "{connectedSpreadsheet?.sheetName || 'SURAT MASUK'}"
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    File: <strong>{connectedSpreadsheet?.name}</strong> | Terdeteksi <strong>{parsedPreviewData.suratList.length}</strong> baris data surat.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportPreviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Columns Detected */}
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Kolom Tabel Google Sheet yang Terdeteksi:</span>
              <div className="flex flex-wrap gap-1.5">
                {parsedPreviewData.headers.map((h, i) => (
                  <span key={i} className="bg-white border border-slate-300 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {h || `Kolom ${i + 1}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Table Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b text-[11px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">No. Agenda</th>
                      <th className="py-2 px-3">Nomor Surat</th>
                      <th className="py-2 px-3">Tgl Terima</th>
                      <th className="py-2 px-3">Pengirim</th>
                      <th className="py-2 px-3">Perihal</th>
                      <th className="py-2 px-3">Sifat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreviewData.suratList.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{item.noAgenda}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{item.noSurat}</td>
                        <td className="py-2 px-3">{item.tanggalTerima}</td>
                        <td className="py-2 px-3">{item.asalSurat}</td>
                        <td className="py-2 px-3 max-w-xs truncate">{item.perihal}</td>
                        <td className="py-2 px-3 font-bold">{item.sifat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreviewData.suratList.length > 10 && (
                <div className="p-2 bg-slate-50 text-center text-[11px] text-slate-500 border-t">
                  + {parsedPreviewData.suratList.length - 10} baris data lainnya
                </div>
              )}
            </div>

            {/* Import Decision Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                Pilih metode sinkronisasi data ke aplikasi:
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyImport('merge')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gabungkan Data Baru (Merge)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyImport('replace');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Ganti semua data lokal dengan data tabel ini"
                >
                  <Check className="w-4 h-4" />
                  <span>Ganti Semua Data (Replace)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Surat Masuk */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2">
                <Inbox className="w-5 h-5 text-blue-600" />
                <span>{editingSurat ? 'Edit Data Surat Masuk' : 'Input Surat Masuk Baru'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Agenda</label>
                  <input
                    type="text"
                    required
                    value={formData.noAgenda || ''}
                    onChange={(e) => setFormData({ ...formData, noAgenda: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="005/SM/2026"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sifat Surat</label>
                  <select
                    value={formData.sifat || 'Biasa'}
                    onChange={(e) => setFormData({ ...formData, sifat: e.target.value as SifatSurat })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Segera">Segera</option>
                    <option value="Amat Segera">Amat Segera</option>
                    <option value="Rahasia">Rahasia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Surat (Dari Pengirim)</label>
                  <input
                    type="text"
                    required
                    value={formData.noSurat || ''}
                    onChange={(e) => setFormData({ ...formData, noSurat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="005/421.3/SMP.02/2026"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Asal Instansi / Pengirim</label>
                  <input
                    type="text"
                    required
                    value={formData.asalSurat || ''}
                    onChange={(e) => setFormData({ ...formData, asalSurat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Dinas Pendidikan Kab. Konawe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSurat || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Diterima TU</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalTerima || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalTerima: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Perihal Surat</label>
                <input
                  type="text"
                  required
                  value={formData.perihal || ''}
                  onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  placeholder="Undangan Sosialisasi Kurikulum Merdeka..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ringkasan / Isi Pokok Surat</label>
                <textarea
                  rows={3}
                  value={formData.ringkasan || ''}
                  onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ringkasan singkat isi surat..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Kategori / Klasifikasi</label>
                <input
                  type="text"
                  value={formData.kategori || ''}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Undangan / Edaran / Keputusan / Pemberitahuan"
                />
              </div>

              {/* UPLOAD BERKAS & DOKUMEN / FOTO SCAN KE GOOGLE DRIVE */}
              <div className="bg-slate-50 border-2 border-dashed border-blue-200 rounded-xl p-4 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        Upload File / Gambar Dokumen Surat Masuk
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Otomatis tersimpan ke Google Drive: <span className="font-semibold text-blue-700">TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT</span>
                      </p>
                    </div>
                  </div>
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full self-start sm:self-auto">
                      <Cloud className="w-3 h-3 text-emerald-600" /> Google Drive Aktif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onConnectGoogle}
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 px-2 py-0.5 rounded-full transition"
                    >
                      <Cloud className="w-3 h-3 text-amber-600" /> Hubungkan Drive
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  className="hidden"
                />

                {/* If File is attached */}
                {formData.lampiranNama || formData.fileUrl || formData.driveWebViewLink ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {formData.fileUrl && formData.fileMimeType?.startsWith('image/') ? (
                          <img
                            src={formData.fileUrl}
                            alt="Thumbnail"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-xs break-all">
                            {formData.lampiranNama || 'Dokumen Surat Masuk'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Ukuran: <span className="font-medium text-slate-700">{formData.lampiranUkuran || 'File Terlampir'}</span>
                            {formData.drivePath && (
                              <span> • Lokasi: <span className="text-blue-600 font-mono font-medium">{formData.drivePath}</span></span>
                            )}
                          </p>

                          {/* Drive upload progress or status */}
                          {isUploadingAttachment ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-bold animate-pulse pt-0.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              <span>Mengunggah ke Google Drive: TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT...</span>
                            </div>
                          ) : formData.driveWebViewLink ? (
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCheck className="w-3 h-3 text-emerald-600" /> Tersimpan di Google Drive
                              </span>
                              <a
                                href={formData.driveWebViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                <span>Buka di Drive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 italic">
                              {uploadAttachmentStatus || 'Berkas siap disimpan.'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {formData.fileUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDocument({
                                url: formData.fileUrl!,
                                name: formData.lampiranNama || 'Preview Dokumen',
                                isImage: formData.fileMimeType?.startsWith('image/') || false,
                                mimeType: formData.fileMimeType,
                                driveWebViewLink: formData.driveWebViewLink,
                              });
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Preview Dokumen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Ganti Berkas"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Berkas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drop area */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 shadow-xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-800 text-xs">
                        Tarik & Lepas Dokumen / Foto Scan di Sini, atau <span className="text-blue-600 underline">Pilih File</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Format didukung: <strong>PDF, Gambar (JPG, PNG, WEBP), Word (.docx, .doc)</strong> (Maks. 25MB)
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>Tersimpan Otomatis ke: <strong>TATA USAHA &gt; SURAT &gt; SURAT MASUK</strong></span>
                      </div>
                    </div>
                  </div>
                )}
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md"
                >
                  {editingSurat ? 'Simpan Perubahan' : 'Simpan Surat Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Lembar Disposisi Kepala Sekolah */}
      {selectedSuratForDisposisi && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm uppercase">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <span>LEMBAR DISPOSISI KEPALA SEKOLAH</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printDisposisi}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Disposisi</span>
                </button>
                <button
                  onClick={() => setSelectedSuratForDisposisi(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="border border-slate-900 p-6 printable-document text-slate-900">
              {/* Kop Surat Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <p className="font-bold text-xs uppercase tracking-wider">PEMERINTAH KABUPATEN KONAWE</p>
                <p className="font-bold text-xs uppercase tracking-wider">DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                <h3 className="font-extrabold text-base tracking-wide uppercase mt-0.5">{identitasSekolah.namaSekolah}</h3>
                <p className="text-[11px] text-slate-700 mt-0.5">{identitasSekolah.alamat}, Kec. {identitasSekolah.kecamatan}, Kab. {identitasSekolah.kabupaten} {identitasSekolah.kodePos}</p>
                <p className="text-[10px] text-slate-600">Email: {identitasSekolah.email} | NPSN: {identitasSekolah.npsn}</p>
              </div>

              <div className="text-center mb-4">
                <h4 className="font-extrabold text-sm uppercase tracking-widest underline">LEMBAR DISPOSISI</h4>
                <p className="text-[11px] font-mono mt-0.5">No. Agenda: <strong>{selectedSuratForDisposisi.noAgenda}</strong></p>
              </div>

              {/* Table Metadata */}
              <div className="border border-slate-800 text-xs mb-4">
                <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800">
                  <div className="p-2">
                    <span className="font-bold block text-[10px] text-slate-600">SURAT DARI:</span>
                    <span className="font-semibold">{selectedSuratForDisposisi.asalSurat}</span>
                  </div>
                  <div className="p-2">
                    <span className="font-bold block text-[10px] text-slate-600">DITERIMA TANGGAL:</span>
                    <span className="font-semibold">{selectedSuratForDisposisi.tanggalTerima}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800">
                  <div className="p-2">
                    <span className="font-bold block text-[10px] text-slate-600">NO. SURAT:</span>
                    <span className="font-mono font-semibold">{selectedSuratForDisposisi.noSurat}</span>
                  </div>
                  <div className="p-2">
                    <span className="font-bold block text-[10px] text-slate-600">TANGGAL SURAT:</span>
                    <span>{selectedSuratForDisposisi.tanggalSurat}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800">
                  <div className="p-2">
                    <span className="font-bold block text-[10px] text-slate-600">SIFAT:</span>
                    <span className="font-bold uppercase">{selectedSuratForDisposisi.sifat}</span>
                  </div>
                  <div className="p-2">
                    <span className="font-bold block text-[10px] text-slate-600">KLASIFIKASI:</span>
                    <span>{selectedSuratForDisposisi.kategori}</span>
                  </div>
                </div>
                <div className="p-2">
                  <span className="font-bold block text-[10px] text-slate-600">PERIHAL:</span>
                  <span className="font-semibold text-slate-900">{selectedSuratForDisposisi.perihal}</span>
                </div>
              </div>

              {/* Editable / Viewable Disposisi Input Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800 p-3 mb-4 text-xs">
                <div>
                  <span className="font-bold block text-xs uppercase mb-2 border-b border-slate-300 pb-1">
                    DITERUSKAN KEPADA SDR:
                  </span>
                  <div className="space-y-1.5">
                    {['Wakil Kepala Sekolah', 'Kepala Tata Usaha', 'Bendahara BOS', 'Pembina OSIS / UKS', 'Wali Kelas / Guru Terkait', 'Operator Dapodik / ANBK'].map((role) => {
                      const isChecked = selectedSuratForDisposisi.diteruskanKepada?.includes(role);
                      return (
                        <label key={role} className="flex items-center gap-2 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={(e) => {
                              const current = selectedSuratForDisposisi.diteruskanKepada || [];
                              const next = e.target.checked
                                ? [...current, role]
                                : current.filter((r) => r !== role);
                              handleSaveDisposisi(
                                selectedSuratForDisposisi,
                                selectedSuratForDisposisi.instruksiDisposisi || '',
                                selectedSuratForDisposisi.catatanKepsek || '',
                                next
                              );
                            }}
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          <span>{role}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="font-bold block text-xs uppercase mb-2 border-b border-slate-300 pb-1">
                    PETUNJUK / INSTRUKSI KEPALA SEKOLAH:
                  </span>
                  <textarea
                    rows={4}
                    value={selectedSuratForDisposisi.catatanKepsek || ''}
                    placeholder="Tuliskan petunjuk atau instruksi tindak lanjut di sini..."
                    onChange={(e) => {
                      handleSaveDisposisi(
                        selectedSuratForDisposisi,
                        selectedSuratForDisposisi.instruksiDisposisi || '',
                        e.target.value,
                        selectedSuratForDisposisi.diteruskanKepada || []
                      );
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-800"
                  />
                  <div className="mt-2 text-[10px] text-slate-500 italic">
                    * Catatan ini otomatis tersimpan ke arsip digital.
                  </div>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="flex justify-between items-end pt-4 text-xs">
                <div className="text-center">
                  <p className="text-[11px]">Diterima oleh TU,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">{identitasSekolah.namaKepalaTU}</p>
                  <p className="text-[10px] font-mono">NIP. {identitasSekolah.nipKepalaTU}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px]">Puriala, {selectedSuratForDisposisi.tanggalDisposisi || selectedSuratForDisposisi.tanggalTerima}</p>
                  <p className="text-[11px] font-semibold">Kepala SMPN 2 Puriala,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline">{identitasSekolah.namaKepalaSekolah}</p>
                  <p className="text-[10px] font-mono">NIP. {identitasSekolah.nipKepalaSekolah}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail Viewer */}
      {selectedSuratForDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Detail Berkas Surat Masuk</span>
              </h3>
              <button
                onClick={() => setSelectedSuratForDetail(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <p className="text-slate-500 font-medium">Nomor Surat:</p>
                <p className="font-mono font-bold text-slate-900 text-sm">{selectedSuratForDetail.noSurat}</p>
                <p className="text-slate-500 font-medium mt-2">Perihal:</p>
                <p className="font-semibold text-slate-800">{selectedSuratForDetail.perihal}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">PENGIRIM:</span>
                  <span className="font-medium">{selectedSuratForDetail.asalSurat}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TANGGAL TERIMA:</span>
                  <span className="font-medium">{selectedSuratForDetail.tanggalTerima}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SIFAT:</span>
                  <span className="font-bold">{selectedSuratForDetail.sifat}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STATUS DRIVE:</span>
                  <span className="text-emerald-700 font-semibold">{selectedSuratForDetail.statusDrive}</span>
                </div>
              </div>
              {selectedSuratForDetail.ringkasan && (
                <div>
                  <span className="text-slate-400 block text-[10px]">RINGKASAN:</span>
                  <p className="p-2 bg-slate-50 rounded text-slate-700 mt-1">{selectedSuratForDetail.ringkasan}</p>
                </div>
              )}
              {selectedSuratForDetail.lampiranNama && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{selectedSuratForDetail.lampiranNama}</p>
                      <p className="text-[10px] text-slate-500">
                        {selectedSuratForDetail.lampiranUkuran || 'File Terlampir'} • Google Drive: TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedSuratForDetail.fileUrl && (
                      <button
                        onClick={() => {
                          setPreviewDocument({
                            url: selectedSuratForDetail.fileUrl!,
                            name: selectedSuratForDetail.lampiranNama || 'Dokumen Surat Masuk',
                            isImage: selectedSuratForDetail.fileMimeType?.startsWith('image/') || false,
                            mimeType: selectedSuratForDetail.fileMimeType,
                            driveWebViewLink: selectedSuratForDetail.driveWebViewLink,
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                    )}
                    {selectedSuratForDetail.driveWebViewLink && (
                      <a
                        href={selectedSuratForDetail.driveWebViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Cloud className="w-3.5 h-3.5" /> Buka di Drive
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Document / Image Viewer Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Paperclip className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-bold text-xs truncate">{previewDocument.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {previewDocument.driveWebViewLink && (
                  <a
                    href={previewDocument.driveWebViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Buka di Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[350px]">
              {previewDocument.isImage && !previewDocument.url.includes('drive.google.com') ? (
                <div className="max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.name}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md border border-slate-200"
                  />
                </div>
              ) : previewDocument.driveWebViewLink ? (
                <iframe
                  src={previewDocument.driveWebViewLink.replace(/\/view(\?.*)?$/, '/preview')}
                  title={previewDocument.name}
                  className="w-full h-[75vh] rounded-lg border border-slate-200 bg-white"
                  allow="autoplay"
                />
              ) : previewDocument.url.startsWith('data:application/pdf') || previewDocument.url.endsWith('.pdf') ? (
                <iframe
                  src={previewDocument.url}
                  title={previewDocument.name}
                  className="w-full h-[75vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{previewDocument.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Berkas ini tersimpan langsung di Google Drive folder <strong>TATA USAHA/01_SURAT_MASUK/FILE_LAMPIRAN_SURAT</strong>.
                  </p>
                  {previewDocument.driveWebViewLink && (
                    <a
                      href={previewDocument.driveWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-sm transition"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Buka File di Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-[11px]">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Drive: <strong>TATA USAHA &gt; SURAT &gt; SURAT MASUK</strong></span>
              </span>
              <button
                onClick={() => setPreviewDocument(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Surat Masuk */}
      {suratToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Hapus Data Surat Masuk?</h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus arsip surat masuk dari Buku Agenda dan otomatis memperbarui sinkronisasi cloud.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">No. Agenda:</span>
                <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                  {suratToDelete.noAgenda}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">No. Surat:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] truncate max-w-[200px]">
                  {suratToDelete.noSurat}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Asal Surat:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {suratToDelete.asalSurat}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Perihal:</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {suratToDelete.perihal}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-batal-hapus-surat-masuk"
                onClick={() => setSuratToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-konfirmasi-hapus-surat-masuk"
                onClick={() => {
                  onDelete(suratToDelete.id);
                  if (selectedSuratForDetail?.id === suratToDelete.id) {
                    setSelectedSuratForDetail(null);
                  }
                  if (selectedSuratForDisposisi?.id === suratToDelete.id) {
                    setSelectedSuratForDisposisi(null);
                  }
                  const deletedNo = suratToDelete.noSurat;
                  setSuratToDelete(null);
                  showNotification(`Data surat masuk "${deletedNo}" berhasil dihapus`, 'info');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
