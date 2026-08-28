import React, { useState, useEffect } from 'react';
import {
  Send,
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
  Sparkles,
  Building2,
  Download,
  Share2,
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
  BookOpen,
  Tag,
  Info,
} from 'lucide-react';
import { SuratKeluar, SifatSurat, IdentitasSekolah, KodeKlasifikasiSurat } from '../types';
import {
  searchNomorSuratSpreadsheets,
  getSpreadsheetMetadata,
  readSheetData,
  parseSuratKeluarFromRows,
  writeSuratKeluarToSheet,
  createNomorSuratSpreadsheetWith2026,
  fetchKodeKlasifikasiFromSheet,
  writeKodeKlasifikasiToSheet,
  DEFAULT_KODE_KLASIFIKASI,
  SpreadsheetSearchResult,
  ParsedSheetSuratKeluar,
} from '../services/googleSheets';

interface SuratKeluarModuleProps {
  suratList: SuratKeluar[];
  onAdd: (surat: SuratKeluar) => void;
  onUpdate: (surat: SuratKeluar) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
  googleUser?: any;
  googleToken?: string | null;
  isGoogleConnected?: boolean;
  isGoogleLoading?: boolean;
  onConnectGoogle?: () => void;
  onBatchUpdate?: (newList: SuratKeluar[], mode: 'replace' | 'merge') => void;
  onKodeKlasifikasiChange?: (codes: KodeKlasifikasiSurat[]) => void;
  initialKodeKlasifikasiList?: KodeKlasifikasiSurat[];
}

export const SuratKeluarModule: React.FC<SuratKeluarModuleProps> = ({
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
  onKodeKlasifikasiChange,
  initialKodeKlasifikasiList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [klasifikasiFilter, setKlasifikasiFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [sumberFilter, setSumberFilter] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'sheet-table' | 'cards'>('sheet-table');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSuratForPrint, setSelectedSuratForPrint] = useState<SuratKeluar | null>(null);
  const [selectedSuratForDetail, setSelectedSuratForDetail] = useState<SuratKeluar | null>(null);
  const [editingSurat, setEditingSurat] = useState<SuratKeluar | null>(null);
  const [isKodeDictionaryModalOpen, setIsKodeDictionaryModalOpen] = useState(false);
  const [searchKodeTerm, setSearchKodeTerm] = useState('');
  const [isCustomKodeInput, setIsCustomKodeInput] = useState(false);

  // Kode Klasifikasi Data from sheet "KODE NOMOR SURAT"
  const [kodeKlasifikasiList, setKodeKlasifikasiList] = useState<KodeKlasifikasiSurat[]>(
    initialKodeKlasifikasiList && initialKodeKlasifikasiList.length > 0
      ? initialKodeKlasifikasiList
      : DEFAULT_KODE_KLASIFIKASI
  );
  const [isLoadingKode, setIsLoadingKode] = useState(false);

  // Notify parent if kode list changes
  const updateKodeKlasifikasiList = (codes: KodeKlasifikasiSurat[]) => {
    setKodeKlasifikasiList(codes);
    if (onKodeKlasifikasiChange) {
      onKodeKlasifikasiChange(codes);
    }
  };

  // Google Sheets Integration State for "Tata Usaha / Nomor Surat (2026)"
  const [connectedSpreadsheet, setConnectedSpreadsheet] = useState<{
    id: string;
    name: string;
    folderName: string;
    sheetName: string;
    kodeSheetName?: string;
    webViewLink?: string;
  } | null>(null);

  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);
  const [availableSpreadsheets, setAvailableSpreadsheets] = useState<SpreadsheetSearchResult[]>([]);
  const [isSpreadsheetPickerOpen, setIsSpreadsheetPickerOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [parsedPreviewData, setParsedPreviewData] = useState<ParsedSheetSuratKeluar | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Auto numbering helper: computes the next number based on the highest existing number
  const getNextNumberStr = (): string => {
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
    const nextNum = maxNumber > 0 ? maxNumber + 1 : suratList.length + 1;
    return String(nextNum).padStart(3, '0');
  };

  const nextNumber = getNextNumberStr();

  const [formData, setFormData] = useState<Partial<SuratKeluar>>({
    noAgenda: `${nextNumber}/SK/2026`,
    kodeKlasifikasi: '400.3.5.1',
    noSurat: `400.3.5.1/${nextNumber}/SMP.02/Konawe/2026`,
    tanggalSurat: new Date().toISOString().split('T')[0],
    tujuanSurat: '',
    perihal: '',
    sifat: 'Biasa',
    lampiran: '1 Berkas',
    pengonsep: `${identitasSekolah.namaKepalaTU} (Ka TU)`,
    penandatangan: identitasSekolah.namaKepalaSekolah,
    nipPenandatangan: identitasSekolah.nipKepalaSekolah,
    isiSuratRingkas: '',
    statusVerifikasi: 'Sudah Dikirim',
    statusDrive: 'Tersimpan',
    lampiranNama: 'Surat_Keluar_2026.pdf',
  });

  // Load classification codes from Google Drive sheet "KODE NOMOR SURAT"
  const loadKodeKlasifikasi = async (token: string, spreadsheetId: string) => {
    try {
      setIsLoadingKode(true);
      const codes = await fetchKodeKlasifikasiFromSheet(token, spreadsheetId, 'KODE NOMOR SURAT');
      if (codes && codes.length > 0) {
        updateKodeKlasifikasiList(codes);
      }
    } catch (e) {
      console.warn('Error loading kode klasifikasi from sheet:', e);
    } finally {
      setIsLoadingKode(false);
    }
  };

  // Auto-discover "Tata Usaha / Nomor Surat (sheet 2026)" spreadsheet when token changes
  useEffect(() => {
    if (googleToken && isGoogleConnected) {
      autoDetectSpreadsheet(googleToken);
    }
  }, [googleToken, isGoogleConnected]);

  const autoDetectSpreadsheet = async (token: string) => {
    try {
      setIsLoadingSheets(true);
      const results = await searchNomorSuratSpreadsheets(token);
      setAvailableSpreadsheets(results);

      if (results.length > 0) {
        // Pick the most relevant one (prioritizing "Nomor Surat" in "Tata Usaha")
        const target = results[0];
        setConnectedSpreadsheet({
          id: target.id,
          name: target.name,
          folderName: target.folderName || 'Tata Usaha',
          sheetName: '2026',
          kodeSheetName: 'KODE NOMOR SURAT',
          webViewLink: target.webViewLink || `https://docs.google.com/spreadsheets/d/${target.id}/edit`,
        });

        // Also load classification codes from sheet "KODE NOMOR SURAT"
        loadKodeKlasifikasi(token, target.id);
      }
    } catch (err: any) {
      console.warn('Auto detect spreadsheet error:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Explicit sync of classification codes from sheet "KODE NOMOR SURAT"
  const handleSyncKodeKlasifikasiFromSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    if (!connectedSpreadsheet?.id) {
      setIsSpreadsheetPickerOpen(true);
      return;
    }

    try {
      setIsLoadingKode(true);
      const codes = await fetchKodeKlasifikasiFromSheet(googleToken, connectedSpreadsheet.id, 'KODE NOMOR SURAT');
      if (codes && codes.length > 0) {
        updateKodeKlasifikasiList(codes);
        showNotification(
          `Berhasil menyinkronkan ${codes.length} kode klasifikasi dari Google Drive sheet "KODE NOMOR SURAT"!`,
          'success'
        );
      } else {
        showNotification('Sheet "KODE NOMOR SURAT" tidak ditemukan atau kosong. Menggunakan data default.', 'info');
      }
    } catch (err: any) {
      console.error('Error syncing kode klasifikasi:', err);
      showNotification(`Gagal memuat Kode Klasifikasi: ${err.message}`, 'error');
    } finally {
      setIsLoadingKode(false);
    }
  };

  // Write default classification codes to Google Drive sheet "KODE NOMOR SURAT"
  const handleInitializeKodeSheet = async () => {
    if (!googleToken || !connectedSpreadsheet?.id) return;
    try {
      setIsLoadingKode(true);
      await writeKodeKlasifikasiToSheet(googleToken, connectedSpreadsheet.id, DEFAULT_KODE_KLASIFIKASI, 'KODE NOMOR SURAT');
      updateKodeKlasifikasiList(DEFAULT_KODE_KLASIFIKASI);
      showNotification('Berhasil memperbarui / membuat tabel KODE NOMOR SURAT di spreadsheet Google Drive!', 'success');
    } catch (err: any) {
      showNotification(`Gagal menulis kode ke sheet: ${err.message}`, 'error');
    } finally {
      setIsLoadingKode(false);
    }
  };

  // Direct Replace All Data from Google Sheet "2026"
  const handleDirectReplaceFromSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    if (!connectedSpreadsheet?.id) {
      setIsSpreadsheetPickerOpen(true);
      return;
    }

    try {
      setIsLoadingSheets(true);
      const rawRows = await readSheetData(googleToken, connectedSpreadsheet.id, connectedSpreadsheet.sheetName);
      if (!rawRows || rawRows.length <= 1) {
        showNotification(`Sheet "${connectedSpreadsheet.sheetName}" kosong atau hanya memiliki baris judul.`, 'info');
        return;
      }

      const parsed = parseSuratKeluarFromRows(rawRows);
      if (!parsed.suratList || parsed.suratList.length === 0) {
        showNotification(`Tidak ada data surat keluar yang ditemukan pada sheet "${connectedSpreadsheet.sheetName}".`, 'error');
        return;
      }

      if (onBatchUpdate) {
        onBatchUpdate(parsed.suratList, 'replace');
      }

      showNotification(
        `Sukses! Seluruh data diganti dengan ${parsed.suratList.length} data dari Folder Tata Usaha / ${connectedSpreadsheet.name} (Sheet "${connectedSpreadsheet.sheetName}").`,
        'success'
      );
    } catch (err: any) {
      console.error('Direct replace error:', err);
      showNotification(`Gagal mengganti data: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Fetch / Import data with Preview from Google Sheets "2026"
  const handleFetchFromGoogleSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    if (!connectedSpreadsheet?.id) {
      setIsSpreadsheetPickerOpen(true);
      return;
    }

    try {
      setIsLoadingSheets(true);
      const rawRows = await readSheetData(googleToken, connectedSpreadsheet.id, connectedSpreadsheet.sheetName);
      
      if (!rawRows || rawRows.length <= 1) {
        showNotification(`Sheet "${connectedSpreadsheet.sheetName}" kosong atau hanya memiliki judul kolom.`, 'info');
        return;
      }

      const parsed = parseSuratKeluarFromRows(rawRows);
      setParsedPreviewData(parsed);
      setIsImportPreviewOpen(true);
    } catch (err: any) {
      console.error('Fetch sheet error:', err);
      showNotification(`Gagal membaca sheet ${connectedSpreadsheet.sheetName}: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Confirm import from preview modal
  const handleApplyImport = (mode: 'replace' | 'merge') => {
    if (!parsedPreviewData || parsedPreviewData.suratList.length === 0) {
      showNotification('Tidak ada data surat yang valid untuk diimpor.', 'error');
      return;
    }

    if (onBatchUpdate) {
      onBatchUpdate(parsedPreviewData.suratList, mode);
    }

    setIsImportPreviewOpen(false);
    showNotification(
      mode === 'replace'
        ? `Berhasil mengganti semua data dengan ${parsedPreviewData.suratList.length} surat dari Sheet "${connectedSpreadsheet?.sheetName}".`
        : `Berhasil menggabungkan ${parsedPreviewData.suratList.length} surat baru dari Sheet "${connectedSpreadsheet?.sheetName}".`,
      'success'
    );
  };

  // Sync / Write current local state to Google Sheets "2026"
  const handleSyncToGoogleSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    if (!connectedSpreadsheet?.id) {
      setIsSpreadsheetPickerOpen(true);
      return;
    }

    try {
      setIsSyncingToSheet(true);
      await writeSuratKeluarToSheet(
        googleToken,
        connectedSpreadsheet.id,
        suratList,
        connectedSpreadsheet.sheetName || '2026'
      );
      showNotification(
        `Berhasil menyinkronkan ${suratList.length} surat keluar ke sheet "${connectedSpreadsheet.sheetName}" di Google Drive!`,
        'success'
      );
    } catch (err: any) {
      console.error('Sync to sheet error:', err);
      showNotification(`Gagal menyinkronkan data: ${err.message}`, 'error');
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  // Create new Spreadsheet template in folder 'Tata Usaha'
  const handleCreateNewNomorSuratSheet = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsLoadingSheets(true);
      const res = await createNomorSuratSpreadsheetWith2026(googleToken, suratList);
      setConnectedSpreadsheet({
        id: res.spreadsheetId,
        name: 'Nomor Surat',
        folderName: 'Tata Usaha',
        sheetName: '2026',
        webViewLink: res.webViewLink,
      });
      showNotification(
        `File spreadsheet "Nomor Surat" dengan sheet "2026" berhasil dibuat di folder Tata Usaha Google Drive!`,
        'success'
      );
      setIsSpreadsheetPickerOpen(false);
    } catch (err: any) {
      console.error('Create sheet error:', err);
      showNotification(`Gagal membuat spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Select spreadsheet from picker list
  const handleSelectSpreadsheet = async (file: SpreadsheetSearchResult) => {
    if (!googleToken) return;
    try {
      setIsLoadingSheets(true);
      const meta = await getSpreadsheetMetadata(googleToken, file.id);
      
      // Determine best sheet name: '2026', or 'SURAT KELUAR', or first sheet
      let chosenSheet = meta.sheetNames.find((s) => s.trim() === '2026');
      if (!chosenSheet) {
        chosenSheet = meta.sheetNames.find((s) => s.toLowerCase().includes('2026')) || meta.sheetNames[0] || '2026';
      }

      setConnectedSpreadsheet({
        id: file.id,
        name: file.name,
        folderName: file.folderName || 'Tata Usaha',
        sheetName: chosenSheet,
        kodeSheetName: 'KODE NOMOR SURAT',
        webViewLink: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      });

      // Load classification codes from sheet "KODE NOMOR SURAT"
      loadKodeKlasifikasi(googleToken, file.id);

      setIsSpreadsheetPickerOpen(false);
      showNotification(`Terhubung ke file "${file.name}" (Sheet: ${chosenSheet} & KODE NOMOR SURAT)`, 'success');
    } catch (err: any) {
      showNotification(`Gagal membaca struktur file: ${err.message}`, 'error');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleKodeChange = (kode: string) => {
    // If editing existing surat, preserve its index number or calculate appropriately
    const currentNum = formData.noAgenda ? formData.noAgenda.split('/')[0] : nextNumber;
    const generatedNo = `${kode}/${currentNum}/SMP.02/Konawe/2026`;
    setFormData((prev) => ({
      ...prev,
      kodeKlasifikasi: kode,
      noSurat: generatedNo,
    }));
  };

  const resetForm = () => {
    const nextNum = getNextNumberStr();
    setFormData({
      noAgenda: `${nextNum}/SK/2026`,
      kodeKlasifikasi: '400.3.5.1',
      noSurat: `400.3.5.1/${nextNum}/SMP.02/Konawe/2026`,
      tanggalSurat: new Date().toISOString().split('T')[0],
      tujuanSurat: '',
      perihal: '',
      sifat: 'Biasa',
      lampiran: '1 Berkas',
      pengonsep: `${identitasSekolah.namaKepalaTU} (Ka TU)`,
      penandatangan: identitasSekolah.namaKepalaSekolah,
      nipPenandatangan: identitasSekolah.nipKepalaSekolah,
      isiSuratRingkas: '',
      statusVerifikasi: 'Sudah Dikirim',
      statusDrive: 'Tersimpan',
      lampiranNama: 'Surat_Keluar_2026.pdf',
    });
    setEditingSurat(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (surat: SuratKeluar) => {
    setEditingSurat(surat);
    setFormData({ ...surat });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noSurat || !formData.perihal || !formData.tujuanSurat) {
      alert('Mohon lengkapi Nomor Surat, Tujuan Surat, dan Perihal!');
      return;
    }

    if (editingSurat) {
      onUpdate({
        ...(editingSurat as SuratKeluar),
        ...formData,
      } as SuratKeluar);
      showNotification('Data surat keluar berhasil diperbarui', 'success');
    } else {
      const newSurat: SuratKeluar = {
        id: `SK-${Date.now()}`,
        noAgenda: formData.noAgenda || `${nextNumber}/SK/2026`,
        noSurat: formData.noSurat || '',
        kodeKlasifikasi: formData.kodeKlasifikasi || '421.3',
        tanggalSurat: formData.tanggalSurat || new Date().toISOString().split('T')[0],
        tujuanSurat: formData.tujuanSurat || '',
        perihal: formData.perihal || '',
        sifat: (formData.sifat as SifatSurat) || 'Biasa',
        lampiran: formData.lampiran || '-',
        pengonsep: formData.pengonsep || identitasSekolah.namaKepalaTU,
        penandatangan: formData.penandatangan || identitasSekolah.namaKepalaSekolah,
        nipPenandatangan: formData.nipPenandatangan || identitasSekolah.nipKepalaSekolah,
        isiSuratRingkas: formData.isiSuratRingkas || '',
        statusVerifikasi: formData.statusVerifikasi || 'Sudah Dikirim',
        statusDrive: 'Tersimpan',
        lampiranNama: formData.lampiranNama || 'Surat_Keluar_2026.pdf',
      };
      onAdd(newSurat);
      showNotification('Surat keluar baru berhasil ditambahkan', 'success');
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  // Filtered List
  const filtered = suratList.filter((s) => {
    const matchSearch =
      s.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tujuanSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.noAgenda.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKlasifikasi = klasifikasiFilter === 'Semua' || s.kodeKlasifikasi === klasifikasiFilter;
    const matchStatus = statusFilter === 'Semua' || s.statusVerifikasi === statusFilter;
    const matchSumber =
      sumberFilter === 'Semua' ||
      (sumberFilter === 'surat-tugas' && (s.sumberModul === 'surat-tugas' || s.id.startsWith('SK-ST-'))) ||
      (sumberFilter === 'pembuat-surat' && (s.sumberModul === 'pembuat-surat' || s.id.startsWith('SK-PS-'))) ||
      (sumberFilter === 'manual' &&
        s.sumberModul !== 'surat-tugas' &&
        s.sumberModul !== 'pembuat-surat' &&
        !s.id.startsWith('SK-ST-') &&
        !s.id.startsWith('SK-PS-'));
    return matchSearch && matchKlasifikasi && matchStatus && matchSumber;
  });

  // Filtered Classification Codes for Dictionary Modal
  const filteredKodeList = kodeKlasifikasiList.filter((k) => {
    const q = searchKodeTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      k.kode.toLowerCase().includes(q) ||
      k.nama.toLowerCase().includes(q) ||
      (k.kategori && k.kategori.toLowerCase().includes(q)) ||
      (k.keterangan && k.keterangan.toLowerCase().includes(q))
    );
  });

  const printSurat = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-800 text-emerald-50 border border-emerald-600'
              : feedbackToast.type === 'error'
              ? 'bg-rose-800 text-rose-50 border border-rose-600'
              : 'bg-slate-800 text-slate-50 border border-slate-700'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : feedbackToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-sky-300 shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Google Drive / Sheet Connection Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <Cloud className="w-3 h-3" />
                <span>Google Drive & Sheets Integration</span>
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                <Folder className="w-3 h-3 text-amber-400" />
                <span>Tata Usaha / Nomor Surat</span>
              </span>
              <span className="bg-emerald-900/60 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                Sheet: <strong>2026</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Sinkronisasi Data Surat Keluar & Kode Klasifikasi (Google Drive)</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Terkoneksi langsung ke spreadsheet <strong>Nomor Surat</strong> di folder <strong>Tata Usaha</strong>. Data agenda surat diambil dari sheet <strong>2026</strong> dan referensi kode klasifikasi surat diambil dari sheet <strong>KODE NOMOR SURAT</strong>.
            </p>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isGoogleConnected ? (
              <>
                {/* Direct Replace button */}
                <button
                  onClick={() => {
                    handleDirectReplaceFromSheet();
                  }}
                  disabled={isLoadingSheets}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow transition flex items-center gap-1.5 border border-emerald-400/30"
                  title="Ganti seluruh data lokal surat keluar dengan data pada sheet 2026"
                >
                  {isLoadingSheets ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Ganti Semua Data (Sheet 2026)</span>
                </button>

                {/* Sync Kode Klasifikasi button */}
                <button
                  onClick={handleSyncKodeKlasifikasiFromSheet}
                  disabled={isLoadingKode || isLoadingSheets}
                  className="bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-emerald-300 text-xs font-semibold py-2 px-3 rounded-xl border border-emerald-500/30 transition flex items-center gap-1.5"
                  title="Ambil dan sinkronkan daftar kode klasifikasi dari sheet KODE NOMOR SURAT"
                >
                  {isLoadingKode ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Kode Klasifikasi ({kodeKlasifikasiList.length})</span>
                </button>

                {/* Fetch & Preview button */}
                <button
                  onClick={handleFetchFromGoogleSheet}
                  disabled={isLoadingSheets}
                  className="bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  title="Pratinjau data dari Google Sheets sebelum diimpor"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Tarik Data</span>
                </button>

                {/* Send / Write to Sheet */}
                <button
                  onClick={handleSyncToGoogleSheet}
                  disabled={isSyncingToSheet || isLoadingSheets}
                  className="bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-teal-300 text-xs font-semibold py-2 px-3 rounded-xl border border-teal-500/30 transition flex items-center gap-1.5"
                  title="Kirim dan simpan seluruh data surat keluar ke Google Sheet"
                >
                  {isSyncingToSheet ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Kirim ke Sheet</span>
                </button>

                {/* Open file link in Google Drive */}
                {connectedSpreadsheet?.webViewLink && (
                  <a
                    href={connectedSpreadsheet.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center justify-center"
                    title="Buka Spreadsheet di Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Picker / Switch file */}
                <button
                  onClick={() => {
                    if (googleToken) autoDetectSpreadsheet(googleToken);
                    setIsSpreadsheetPickerOpen(true);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline px-1 py-1"
                >
                  Pilih File
                </button>
              </>
            ) : (
              <button
                onClick={onConnectGoogle}
                disabled={isGoogleLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                {isGoogleLoading ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Hubungkan Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Current status bar */}
        {connectedSpreadsheet && isGoogleConnected && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Folder: <strong>{connectedSpreadsheet.folderName}</strong> / File:{' '}
                  <strong>{connectedSpreadsheet.name}</strong>
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="bg-slate-800/90 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono text-[10px]">
                Sheet Agenda: <strong>{connectedSpreadsheet.sheetName}</strong>
              </span>
              <button
                onClick={() => setIsKodeDictionaryModalOpen(true)}
                className="bg-slate-800/90 hover:bg-slate-700 text-teal-300 hover:text-teal-200 px-2 py-0.5 rounded border border-teal-500/20 font-mono text-[10px] flex items-center gap-1 transition cursor-pointer"
                title="Buka kamus kode klasifikasi dari sheet KODE NOMOR SURAT"
              >
                <BookOpen className="w-3 h-3 text-teal-400" />
                <span>Sheet Kode: <strong>KODE NOMOR SURAT</strong> ({kodeKlasifikasiList.length} Kode)</span>
              </button>
            </div>
            <span>SIPEDAS Cloud Sync Aktif</span>
          </div>
        )}
      </div>

      {/* Main Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Persuratan / <span className="text-slate-800 font-semibold">Surat Keluar</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <span>AGENDA & ARSIP SURAT KELUAR (TAHUN 2026)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Kamus Kode Klasifikasi Button */}
          <button
            onClick={() => setIsKodeDictionaryModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 transition flex items-center gap-1.5"
            title="Lihat daftar lengkap Kode Klasifikasi dari Google Sheet KODE NOMOR SURAT"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kamus Kode ({kodeKlasifikasiList.length})</span>
          </button>

          {/* Quick Direct Replace Button */}
          <button
            onClick={() => {
              if (
                confirm(
                  'Apakah Anda yakin ingin MENGGANTI SEMUA data surat keluar lokal saat ini dengan data dari sheet "2026" di Google Drive?'
                )
              ) {
                handleDirectReplaceFromSheet();
              }
            }}
            disabled={isLoadingSheets}
            className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 border border-emerald-600"
            title="Ganti seluruh data surat keluar saat ini dengan data terbaru pada sheet 2026"
          >
            {isLoadingSheets ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Ganti Semua Data (Sheet 2026)</span>
          </button>

          {/* View mode toggle */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setViewMode('sheet-table')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md font-bold transition ${
                viewMode === 'sheet-table'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Google Sheet Resmi"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Format Sheet</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md font-bold transition ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Ringkas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Keluar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor surat, tujuan penerima, nomor agenda, atau perihal..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={klasifikasiFilter}
            onChange={(e) => setKlasifikasiFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 max-w-[240px]"
          >
            <option value="Semua">Semua Kode ({kodeKlasifikasiList.length} Klasifikasi)</option>
            {kodeKlasifikasiList.map((k) => (
              <option key={k.kode} value={k.kode}>
                {k.kode} - {k.nama}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
          >
            <option value="Semua">Semua Status Verifikasi</option>
            <option value="Draf">Draf</option>
            <option value="Disetujui Kepala Sekolah">Disetujui Kepala Sekolah</option>
            <option value="Sudah Dikirim">Sudah Dikirim</option>
            <option value="Arsip">Arsip</option>
          </select>

          <select
            value={sumberFilter}
            onChange={(e) => setSumberFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
          >
            <option value="Semua">Semua Asal Modul</option>
            <option value="manual">Buku Agenda Manual</option>
            <option value="surat-tugas">Surat Tugas Dinas (SPT)</option>
            <option value="pembuat-surat">Pembuat Surat (Keterangan/Mutasi/dst)</option>
          </select>
        </div>
      </div>

      {/* Main View Mode: Sheet Table or Cards */}
      {viewMode === 'sheet-table' ? (
        /* FORMAT TABEL GOOGLE SHEET RESMI */
        <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden">
          {/* Sheet Header Badge */}
          <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
              <span className="font-bold text-slate-800">
                Lembar Kerja: <code>Nomor Surat / 2026</code>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 text-[11px]">Format Buku Agenda Surat Keluar Kedinasan</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Menampilkan {filtered.length} dari {suratList.length} data
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px] tracking-wider sticky top-0">
                <tr className="divide-x divide-slate-200">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3 w-28">No. Agenda</th>
                  <th className="py-2.5 px-3 w-24">Kode</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Nomor & Tanggal Surat</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Tujuan Surat / Kepada</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Perihal / Isi Pokok</th>
                  <th className="py-2.5 px-3 w-24 text-center">Sifat</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Pengonsep / TTD</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center w-28 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Send className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">Tidak ada data surat keluar yang ditemukan.</p>
                        <p className="text-xs text-slate-400">
                          Gunakan tombol "Tarik Data dari Sheet" untuk memuat data dari spreadsheet Google Drive.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="divide-x divide-slate-100 hover:bg-emerald-50/40 transition group"
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 font-medium">
                        {idx + 1}
                      </td>

                      {/* No Agenda */}
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-[11px]">
                        {item.noAgenda}
                      </td>

                      {/* Kode Klasifikasi */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                          {item.kodeKlasifikasi || '-'}
                        </span>
                      </td>

                      {/* Nomor & Tanggal Surat */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 font-mono text-[11px]">{item.noSurat}</span>
                          {(item.sumberModul === 'surat-tugas' || item.id.startsWith('SK-ST-')) && (
                            <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-bold">
                              SPT Dinas
                            </span>
                          )}
                          {(item.sumberModul === 'pembuat-surat' || item.id.startsWith('SK-PS-')) && (
                            <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded font-bold">
                              Pembuat Surat
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Tgl: {item.tanggalSurat}</span>
                        </div>
                      </td>

                      {/* Tujuan Surat */}
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        <div className="font-semibold text-slate-900">{item.tujuanSurat}</div>
                      </td>

                      {/* Perihal */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 leading-snug">{item.perihal}</div>
                        {item.isiSuratRingkas && item.isiSuratRingkas !== item.perihal && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5">
                            "{item.isiSuratRingkas}"
                          </div>
                        )}
                      </td>

                      {/* Sifat */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            item.sifat === 'Sangat Segera' || item.sifat === 'Rahasia'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.sifat === 'Segera' || item.sifat === 'Penting'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.sifat}
                        </span>
                      </td>

                      {/* Pengonsep / TTD */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 text-[11px]">{item.penandatangan}</div>
                        <div className="text-[10px] text-slate-400">Konsep: {item.pengonsep}</div>
                      </td>

                      {/* Status Verifikasi */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                            item.statusVerifikasi === 'Sudah Dikirim' || item.statusVerifikasi === 'Arsip'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.statusVerifikasi === 'Disetujui Kepala Sekolah'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.statusVerifikasi === 'Sudah Dikirim' && <CheckCircle2 className="w-3 h-3" />}
                          {item.statusVerifikasi === 'Disetujui Kepala Sekolah' && <CheckCircle2 className="w-3 h-3" />}
                          {item.statusVerifikasi === 'Draf' && <Clock className="w-3 h-3" />}
                          <span>{item.statusVerifikasi}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1">
                          {/* Cetak Berkop */}
                          <button
                            onClick={() => setSelectedSuratForPrint(item)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-md font-semibold text-[11px] flex items-center gap-1 transition"
                            title="Pratinjau & Cetak Surat Berkop Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Cetak</span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-slate-600 hover:text-amber-600 p-1.5 rounded hover:bg-slate-100 transition"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data surat keluar ${item.noSurat}?`)) {
                                onDelete(item.id);
                                showNotification('Data surat keluar berhasil dihapus', 'info');
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition"
                            title="Hapus"
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

          <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>
              Total tercatat: <strong>{suratList.length} surat keluar</strong> pada agenda tahun 2026
            </span>
            <span className="font-semibold text-slate-700">SMP Negeri 2 Puriala</span>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Tidak ada data surat keluar yang sesuai kriteria pencarian.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 hover:border-emerald-500 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.noAgenda}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.statusVerifikasi === 'Sudah Dikirim'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.statusVerifikasi === 'Disetujui Kepala Sekolah'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.statusVerifikasi}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-mono font-bold text-xs text-slate-900">{item.noSurat}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tanggal: {item.tanggalSurat} | Klasifikasi: {item.kodeKlasifikasi}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="text-slate-500 text-[10px] font-semibold">Tujuan Surat:</div>
                    <div className="font-bold text-slate-800">{item.tujuanSurat}</div>
                    <div className="text-slate-500 text-[10px] font-semibold pt-1">Perihal:</div>
                    <div className="text-slate-700 leading-snug">{item.perihal}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    TTD: <strong>{item.penandatangan}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedSuratForPrint(item)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                      title="Cetak Surat Berkop"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data ${item.noSurat}?`)) onDelete(item.id);
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: Form Buat / Edit Surat Keluar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>{editingSurat ? 'Edit Surat Keluar' : 'Buat Surat Keluar Berkop Resmi'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-bold">Kode Klasifikasi</label>
                    <button
                      type="button"
                      onClick={() => setIsKodeDictionaryModalOpen(true)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 underline"
                    >
                      <BookOpen className="w-2.5 h-2.5" />
                      <span>Kamus ({kodeKlasifikasiList.length})</span>
                    </button>
                  </div>
                  <select
                    value={formData.kodeKlasifikasi || ''}
                    onChange={(e) => handleKodeChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-xs"
                  >
                    {kodeKlasifikasiList.map((k) => (
                      <option key={k.kode} value={k.kode}>
                        {k.kode} - {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Nomor Surat Resmi (Auto-Generated)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noSurat || ''}
                    onChange={(e) => setFormData({ ...formData, noSurat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sifat & Lampiran</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.sifat || 'Biasa'}
                      onChange={(e) => setFormData({ ...formData, sifat: e.target.value as SifatSurat })}
                      className="border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Biasa">Biasa</option>
                      <option value="Penting">Penting</option>
                      <option value="Segera">Segera</option>
                      <option value="Sangat Segera">Sangat Segera</option>
                      <option value="Rahasia">Rahasia</option>
                    </select>
                    <input
                      type="text"
                      value={formData.lampiran || ''}
                      onChange={(e) => setFormData({ ...formData, lampiran: e.target.value })}
                      placeholder="1 Lembar"
                      className="border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                    </input>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tujuan Surat / Kepada Yth.</label>
                <input
                  type="text"
                  required
                  value={formData.tujuanSurat || ''}
                  onChange={(e) => setFormData({ ...formData,  tujuanSurat: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  placeholder="Kepala Dinas Pendidikan dan Kebudayaan Kab. Konawe / Orang Tua Siswa"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Perihal Surat</label>
                <input
                  type="text"
                  required
                  value={formData.perihal || ''}
                  onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  placeholder="Undangan Rapat Pleno Komite Sekolah..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Isi Pokok / Narasi Surat</label>
                <textarea
                  rows={4}
                  value={formData.isiSuratRingkas || ''}
                  onChange={(e) => setFormData({ ...formData, isiSuratRingkas: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Tuliskan isi surat resmi secara lengkap di sini..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Penandatangan Surat</label>
                  <input
                    type="text"
                    value={formData.penandatangan || ''}
                    onChange={(e) => setFormData({ ...formData, penandatangan: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Verifikasi</label>
                  <select
                    value={formData.statusVerifikasi || 'Draf'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statusVerifikasi: e.target.value as 'Draf' | 'Disetujui Kepala Sekolah' | 'Sudah Dikirim' | 'Arsip',
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="Draf">Draf (Konsep TU)</option>
                    <option value="Disetujui Kepala Sekolah">Disetujui Kepala Sekolah (Siap Cetak & TTD)</option>
                    <option value="Sudah Dikirim">Sudah Dikirim / Terdistribusi</option>
                    <option value="Arsip">Arsip Selesai</option>
                  </select>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md"
                >
                  {editingSurat ? 'Simpan Perubahan' : 'Terbitkan Surat Keluar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pratinjau & Impor Data dari Google Sheet */}
      {isImportPreviewOpen && parsedPreviewData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Pratinjau Data Google Sheet: {connectedSpreadsheet?.sheetName || '2026'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ditemukan <strong>{parsedPreviewData.suratList.length}</strong> baris data surat keluar yang siap diimpor ke SIPEDAS.
                </p>
              </div>
              <button
                onClick={() => setIsImportPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Preview */}
            <div className="flex-1 overflow-y-auto my-4 border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">No. Agenda</th>
                    <th className="py-2.5 px-3">Nomor Surat</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Tujuan Surat</th>
                    <th className="py-2.5 px-3">Perihal</th>
                    <th className="py-2.5 px-3">Sifat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedPreviewData.suratList.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">{item.noAgenda}</td>
                      <td className="py-2 px-3 font-mono text-slate-900">{item.noSurat}</td>
                      <td className="py-2 px-3">{item.tanggalSurat}</td>
                      <td className="py-2 px-3 font-medium">{item.tujuanSurat}</td>
                      <td className="py-2 px-3 text-slate-700">{item.perihal}</td>
                      <td className="py-2 px-3">{item.sifat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Pilih metode sinkronisasi data yang diinginkan:
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportPreviewOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleApplyImport('merge')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                  title="Tambahkan data baru yang belum ada di aplikasi"
                >
                  Gabungkan Data (Merge)
                </button>
                <button
                  onClick={() => handleApplyImport('replace')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  title="Gantikan seluruh data surat keluar saat ini dengan isi Google Sheet"
                >
                  Ganti Semua Data (Replace)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Spreadsheet Picker / Creator */}
      {isSpreadsheetPickerOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-amber-500" />
                  <span>Pilih Spreadsheet di Google Drive</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Folder: <strong>Tata Usaha</strong> / Berkas: <strong>Nomor Surat</strong>
                </p>
              </div>
              <button
                onClick={() => setIsSpreadsheetPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 flex-1 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Direktori Resmi Tata Usaha:</span> Sistem otomatis mencari berkas <strong>"Nomor Surat"</strong> di dalam folder <strong>"Tata Usaha"</strong> dengan tab lembar kerja <strong>"2026"</strong>.
                </div>
              </div>

              {availableSpreadsheets.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-600 font-semibold">
                    Belum ditemukan spreadsheet "Nomor Surat" di Google Drive Anda.
                  </div>
                  <button
                    onClick={handleCreateNewNomorSuratSheet}
                    disabled={isLoadingSheets}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition inline-flex items-center gap-2"
                  >
                    {isLoadingSheets ? <RotateCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Buat Folder & Spreadsheet Nomor Surat (2026) Otomatis</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Pilih Berkas yang Tersedia:</div>
                  {availableSpreadsheets.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleSelectSpreadsheet(file)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        connectedSpreadsheet?.id === file.id
                          ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                            <span>{file.name}</span>
                            {connectedSpreadsheet?.id === file.id && (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                                Terpilih
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Folder: <strong>{file.folderName || 'Drive Saya'}</strong>
                          </div>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-emerald-700 hover:underline">
                        Gunakan File Ini
                      </button>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <button
                      onClick={handleCreateNewNomorSuratSheet}
                      disabled={isLoadingSheets}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat File Nomor Surat Baru di Folder Tata Usaha</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSpreadsheetPickerOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pratinjau & Cetak Surat Berkop Resmi */}
      {selectedSuratForPrint && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm uppercase">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>PRATINJAU DOKUMEN SURAT DINAS RESMI</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printSurat}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen (Kop Resmi)</span>
                </button>
                <button
                  onClick={() => setSelectedSuratForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet */}
            <div className="border border-slate-300 p-8 printable-document bg-white text-slate-900 font-serif leading-relaxed">
              {/* Kop Surat Resmi Kemdikbud / Pemda */}
              <div className="text-center border-b-4 border-double border-slate-900 pb-3 mb-6 font-sans">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-800">PEMERINTAH KABUPATEN KONAWE</p>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-800">DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                <h3 className="font-extrabold text-lg tracking-wide uppercase mt-0.5 text-slate-900">{identitasSekolah.namaSekolah}</h3>
                <p className="text-[11px] text-slate-700 mt-0.5">{identitasSekolah.alamat}, Kec. {identitasSekolah.kecamatan}, Kab. {identitasSekolah.kabupaten} {identitasSekolah.kodePos}</p>
                <p className="text-[10px] text-slate-600">Website: {identitasSekolah.website} | Email: {identitasSekolah.email} | NPSN: {identitasSekolah.npsn}</p>
              </div>

              {/* Tanggal & Nomor */}
              <div className="flex justify-between items-start text-xs font-sans mb-6">
                <div className="space-y-1">
                  <div className="grid grid-cols-[80px_10px_1fr]">
                    <span>Nomor</span>
                    <span>:</span>
                    <span className="font-bold font-mono">{selectedSuratForPrint.noSurat}</span>
                  </div>
                  <div className="grid grid-cols-[80px_10px_1fr]">
                    <span>Sifat</span>
                    <span>:</span>
                    <span>{selectedSuratForPrint.sifat}</span>
                  </div>
                  <div className="grid grid-cols-[80px_10px_1fr]">
                    <span>Lampiran</span>
                    <span>:</span>
                    <span>{selectedSuratForPrint.lampiran || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[80px_10px_1fr]">
                    <span>Perihal</span>
                    <span>:</span>
                    <span className="font-bold underline">{selectedSuratForPrint.perihal}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p>Puriala, {selectedSuratForPrint.tanggalSurat}</p>
                  <p className="mt-4 text-left font-semibold">Kepada Yth,</p>
                  <p className="text-left font-bold">{selectedSuratForPrint.tujuanSurat}</p>
                  <p className="text-left">di Tempat</p>
                </div>
              </div>

              {/* Isi Surat */}
              <div className="text-xs space-y-3 mb-8 text-justify font-sans leading-relaxed">
                <p>Dengan hormat,</p>
                <p>
                  {selectedSuratForPrint.isiSuratRingkas ||
                    `Sehubungan dengan pelaksanaan program kerja dan kalender akademik SMP Negeri 2 Puriala Tahun Pelajaran ${identitasSekolah.tahunPelajaranAktif}, melalui surat ini kami sampaikan hal-hal sebagaimana tercantum pada perihal di atas.`}
                </p>
                <p>
                  Demikian surat ini kami sampaikan. Atas perhatian, kerja sama, dan koordinasi yang baik kami ucapkan terima kasih.
                </p>
              </div>

              {/* Tanda Tangan Resmi */}
              <div className="flex justify-end font-sans text-xs pt-4">
                <div className="text-center w-64">
                  <p className="font-semibold">Kepala SMP Negeri 2 Puriala,</p>
                  <div className="h-20 flex items-center justify-center text-slate-300 italic text-[10px]">
                    [Tanda Tangan & Cap Stempel Basah]
                  </div>
                  <p className="font-bold underline uppercase">{selectedSuratForPrint.penandatangan}</p>
                  <p className="text-[11px]">{identitasSekolah.pangkatKepsek}</p>
                  <p className="text-[11px] font-mono">NIP. {selectedSuratForPrint.nipPenandatangan}</p>
                </div>
              </div>

              {/* Tembusan */}
              <div className="text-[10px] font-sans text-slate-600 border-t border-slate-200 pt-3 mt-6">
                <p className="font-bold">Tembusan Yth:</p>
                <ol className="list-decimal list-inside">
                  <li>Kepala Dinas Pendidikan dan Kebudayaan Kab. Konawe (sebagai laporan)</li>
                  <li>Pengawas Pembina SMP Wilayah Puriala</li>
                  <li>Arsip Tata Usaha</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Kamus & Daftar Kode Klasifikasi Surat (Dari Sheet KODE NOMOR SURAT) */}
      {isKodeDictionaryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar flex flex-col justify-between">
            <div>
              {/* Header Modal */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>Kamus Kode Klasifikasi Surat Dinas</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Sumber data: Google Drive / Folder <strong>Tata Usaha</strong> / File <strong>Nomor Surat</strong> / Sheet <strong>KODE NOMOR SURAT</strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsKodeDictionaryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchKodeTerm}
                    onChange={(e) => setSearchKodeTerm(e.target.value)}
                    placeholder="Cari kode (contoh: 421.3, 005, 800) atau nama urusan..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncKodeKlasifikasiFromSheet}
                    disabled={isLoadingKode || !googleToken}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-300 transition flex items-center gap-1.5"
                    title="Tarik pembaruan dari Sheet KODE NOMOR SURAT"
                  >
                    {isLoadingKode ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Sinkronkan dari Sheet</span>
                  </button>
                </div>
              </div>

              {/* Table of Classification Codes */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-[50vh] overflow-y-auto light-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 shadow-xs z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 w-28">Kode</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Uraian / Nama Klasifikasi</th>
                        <th className="py-2.5 px-3 w-36">Kategori</th>
                        <th className="py-2.5 px-3 w-28 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredKodeList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ada kode klasifikasi yang cocok dengan kata kunci "{searchKodeTerm}".
                          </td>
                        </tr>
                      ) : (
                        filteredKodeList.map((item, idx) => (
                          <tr
                            key={item.kode + idx}
                            className="hover:bg-emerald-50/50 transition divide-x divide-slate-50 group"
                          >
                            <td className="py-2 px-3 text-center text-[11px] text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-extrabold text-emerald-800 text-xs">
                              <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {item.kode}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              <div className="font-semibold text-slate-900">{item.nama}</div>
                              {item.keterangan && (
                                <div className="text-[10px] text-slate-400 mt-0.5">{item.keterangan}</div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[11px] text-slate-600">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200">
                                {item.kategori || 'Umum'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => {
                                  handleKodeChange(item.kode);
                                  setIsKodeDictionaryModalOpen(false);
                                  showNotification(`Kode "${item.kode}" (${item.nama}) terpilih!`, 'info');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs transition"
                              >
                                Pilih Kode
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Total <strong>{kodeKlasifikasiList.length} Kode Klasifikasi</strong> dimuat dari Google Drive
              </div>
              <button
                onClick={() => setIsKodeDictionaryModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
