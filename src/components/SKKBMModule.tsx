import React, { useState, useEffect } from 'react';
import {
  Scroll,
  Plus,
  Printer,
  FileText,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  X,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Cloud,
  Folder,
  ExternalLink,
  Download,
  Copy,
  RefreshCw,
  Search,
  Check,
  Award,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import {
  SKKBM,
  SKKBMItem,
  IdentitasSekolah,
  PTK,
  SuratKeluar,
  SuratTugasDinas,
  PembuatSuratRecord,
  SKTugasTambahan,
} from '../types';
import {
  fetchSKFolderFiles,
  uploadSKKBMDocumentToDrive,
  GoogleDriveFile,
} from '../services/googleDrive';
import {
  formatTanggalIndonesia,
  generateDefaultPerihalSK,
  generateSKKBMFullHtml,
  printHtmlDirectly,
  downloadSKKBMHtmlFile,
  SKPrintMode,
  hitungTotalSKKBM,
  LOGO_KABUPATEN_KONAWE_BASE64,
  LOGO_TUT_WURI_BASE64,
  DEFAULT_MENIMBANG_SK,
  DEFAULT_MENGINGAT_SK,
  DEFAULT_MEMPERHATIKAN_SK_LIST,
} from '../utils/skTemplates';
import { getHighestNomorUrutFromLists, getRomanMonth } from '../utils/suratTemplates';

interface SKKBMModuleProps {
  skList: SKKBM[];
  suratKeluarList?: SuratKeluar[];
  suratTugasList?: SuratTugasDinas[];
  pembuatSuratList?: PembuatSuratRecord[];
  skTugasTambahanList?: SKTugasTambahan[];
  onAdd: (sk: SKKBM) => void;
  onUpdate: (sk: SKKBM) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
  guruPTKList?: PTK[];
  googleToken?: string | null;
  googleUser?: any;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
}

export const SKKBMModule: React.FC<SKKBMModuleProps> = ({
  skList,
  suratKeluarList = [],
  suratTugasList = [],
  pembuatSuratList = [],
  skTugasTambahanList = [],
  onAdd,
  onUpdate,
  onDelete,
  identitasSekolah,
  guruPTKList = [],
  googleToken,
  googleUser: _googleUser,
  isGoogleConnected: _isGoogleConnected,
  onConnectGoogle,
}) => {
  const [selectedSKId, setSelectedSKId] = useState<string>(skList[0]?.id || '');
  const selectedSK = skList.find((s) => s.id === selectedSKId) || skList[0] || null;

  const getNextNomorUrut = (): number => {
    const highest = getHighestNomorUrutFromLists(
      skList,
      suratKeluarList,
      suratTugasList,
      pembuatSuratList,
      skTugasTambahanList
    );
    return highest > 0 ? highest + 1 : (skList.length + 1);
  };

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNewSKModalOpen, setIsNewSKModalOpen] = useState(false);
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false);
  const [isDriveTemplateModalOpen, setIsDriveTemplateModalOpen] = useState(false);
  const [isGuruModalOpen, setIsGuruModalOpen] = useState(false);
  const [guruToDelete, setGuruToDelete] = useState<SKKBMItem | null>(null);

  // Search & Filter in Table
  const [searchGuruQuery, setSearchGuruQuery] = useState('');

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Google Drive template listing from TATA USAHA/SK
  const [driveTemplates, setDriveTemplates] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDriveTemplates, setIsLoadingDriveTemplates] = useState(false);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);

  // Fetch templates from Drive folder TATA USAHA/SK
  const loadDriveTemplates = async () => {
    if (!googleToken) return;
    try {
      setIsLoadingDriveTemplates(true);
      const files = await fetchSKFolderFiles(googleToken);
      setDriveTemplates(files);
    } catch (err) {
      console.warn('Gagal memuat template dari Drive:', err);
    } finally {
      setIsLoadingDriveTemplates(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      loadDriveTemplates();
    }
  }, [googleToken]);

  // Form for New SK KBM from Template
  const [newSKForm, setNewSKForm] = useState({
    noSK: `400.3.12.2/052/SMP-02/PRL/VII/2026`,
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    tahunAjaran: '2026/2027',
    tanggalSK: '2026-07-13',
    tempatPenetapan: 'Unggulino',
    tentang: '',
    templateNama: 'Format SK KBM SMPN 2 Puriala (Folder TATA USAHA/SK)',
  });

  // Form for Edit Parameter SK KBM (Nomor SK, Semester, Tahun Pelajaran, Tanggal SK, Tempat, Perihal)
  const [editHeaderForm, setEditHeaderForm] = useState({
    noSK: '',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    tahunAjaran: '2026/2027',
    tanggalSK: '',
    tempatPenetapan: 'Unggulino',
    tentang: '',
  });

  const handleOpenNewSK = () => {
    const nextUrut = getNextNomorUrut();
    const curMonthRoman = getRomanMonth(new Date().getMonth());
    const curYear = new Date().getFullYear();
    setNewSKForm({
      ...newSKForm,
      noSK: `400.3.12.2/${String(nextUrut).padStart(3, '0')}/SMP-02/PRL/${curMonthRoman}/${curYear}`,
      semester: 'Ganjil',
      tahunAjaran: '2026/2027',
      tanggalSK: `${curYear}-07-13`,
      tempatPenetapan: 'Unggulino',
      tentang: '',
    });
    setIsNewSKModalOpen(true);
  };

  // Reactive effect to keep new SK KBM form sequence up to date
  useEffect(() => {
    const nextUrut = getNextNomorUrut();
    const curMonthRoman = getRomanMonth(new Date().getMonth());
    const curYear = new Date().getFullYear();
    setNewSKForm(prev => ({
      ...prev,
      noSK: `400.3.12.2/${String(nextUrut).padStart(3, '0')}/SMP-02/PRL/${curMonthRoman}/${curYear}`
    }));
  }, [skList, suratKeluarList, suratTugasList, pembuatSuratList, skTugasTambahanList]);

  const handleOpenEditHeader = () => {
    if (!selectedSK) return;
    setEditHeaderForm({
      noSK: selectedSK.noSK,
      semester: selectedSK.semester,
      tahunAjaran: selectedSK.tahunAjaran,
      tanggalSK: selectedSK.tanggalSK,
      tempatPenetapan: selectedSK.tempatPenetapan || 'Unggulino',
      tentang: selectedSK.tentang || generateDefaultPerihalSK(selectedSK.semester, selectedSK.tahunAjaran),
    });
    setIsEditHeaderModalOpen(true);
  };

  const handleAutoGeneratePerihal = () => {
    const autoPerihal = generateDefaultPerihalSK(editHeaderForm.semester, editHeaderForm.tahunAjaran);
    setEditHeaderForm((prev) => ({
      ...prev,
      tentang: autoPerihal,
    }));
  };

  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSK) return;

    const perihalToSave =
      editHeaderForm.tentang.trim() !== ''
        ? editHeaderForm.tentang.trim()
        : generateDefaultPerihalSK(editHeaderForm.semester, editHeaderForm.tahunAjaran);

    const updated: SKKBM = {
      ...selectedSK,
      noSK: editHeaderForm.noSK.trim(),
      semester: editHeaderForm.semester,
      tahunAjaran: editHeaderForm.tahunAjaran.trim(),
      tanggalSK: editHeaderForm.tanggalSK.trim(),
      tempatPenetapan: editHeaderForm.tempatPenetapan.trim() || 'Unggulino',
      tentang: perihalToSave,
    };

    onUpdate(updated);
    setIsEditHeaderModalOpen(false);
    showToast('Parameter SK KBM & Lampiran berhasil disesuaikan!', 'success');
  };

  // Form for Teacher in SK KBM
  const [editingGuru, setEditingGuru] = useState<SKKBMItem | null>(null);
  const [guruForm, setGuruForm] = useState<{
    namaGuru: string;
    nip: string;
    nuptk: string;
    golongan: string;
    mataPelajaran: string;
    jpViiA: number | string;
    jpViiB: number | string;
    jpViii: number | string;
    jpIx: number | string;
    tugasTambahan: string;
    jumlahJpTugasTambahan: number | string;
  }>({
    namaGuru: '',
    nip: '',
    nuptk: '',
    golongan: 'Penata, III/c',
    mataPelajaran: 'Matematika',
    jpViiA: 4,
    jpViiB: 4,
    jpViii: 4,
    jpIx: 4,
    tugasTambahan: '-',
    jumlahJpTugasTambahan: 0,
  });

  const PRESET_TUGAS_TAMBAHAN = [
    { label: '- (Tidak Ada)', role: '-', jp: 0 },
    { label: 'Kepala Sekolah (24 JP)', role: 'Kepala Sekolah', jp: 24 },
    { label: 'Wakasek Kurikulum (12 JP)', role: 'Wakasek Kurikulum', jp: 12 },
    { label: 'Wakasek Kesiswaan (12 JP)', role: 'Wakasek Kesiswaan', jp: 12 },
    { label: 'Wakasek Sarpras & Humas (12 JP)', role: 'Wakasek Sarpras & Humas', jp: 12 },
    { label: 'Kepala Perpustakaan (12 JP)', role: 'Kepala Perpustakaan', jp: 12 },
    { label: 'Kepala Lab Komputer / IPA (12 JP)', role: 'Kepala Lab Komputer / IPA', jp: 12 },
    { label: 'Wali Kelas VII.A (2 JP)', role: 'Wali Kelas VII.A', jp: 2 },
    { label: 'Wali Kelas VII.B (2 JP)', role: 'Wali Kelas VII.B', jp: 2 },
    { label: 'Wali Kelas VIII (2 JP)', role: 'Wali Kelas VIII', jp: 2 },
    { label: 'Wali Kelas IX (2 JP)', role: 'Wali Kelas IX', jp: 2 },
    { label: 'Pembina Pramuka Putra (2 JP)', role: 'Pembina Pramuka Putra', jp: 2 },
    { label: 'Pembina Pramuka Putri (2 JP)', role: 'Pembina Pramuka Putri', jp: 2 },
    { label: 'Pembina Olahraga & UKS (2 JP)', role: 'Pembina Olahraga & UKS', jp: 2 },
    { label: 'Pembina OSIS (2 JP)', role: 'Pembina OSIS', jp: 2 },
    { label: 'Wali Kelas VII.A & Pembina Olahraga (4 JP)', role: 'Wali Kelas VII.A, Pembina Olahraga', jp: 4 },
  ];

  const handleOpenAddGuru = () => {
    setEditingGuru(null);
    setGuruForm({
      namaGuru: '',
      nip: '',
      nuptk: '',
      golongan: 'Penata, III/c',
      mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
      jpViiA: 4,
      jpViiB: 4,
      jpViii: 4,
      jpIx: 4,
      tugasTambahan: '-',
      jumlahJpTugasTambahan: 0,
    });
    setIsGuruModalOpen(true);
  };

  const handleOpenEditGuru = (item: SKKBMItem) => {
    setEditingGuru(item);
    setGuruForm({
      namaGuru: item.namaGuru,
      nip: item.nip,
      nuptk: item.nuptk || '',
      golongan: item.golongan,
      mataPelajaran: item.mataPelajaran,
      jpViiA: item.jpKelas?.viiA !== undefined ? item.jpKelas.viiA : item.kelasDiampu.includes('VII.A') || item.kelasDiampu.includes('7A') ? 4 : 0,
      jpViiB: item.jpKelas?.viiB !== undefined ? item.jpKelas.viiB : item.kelasDiampu.includes('VII.B') || item.kelasDiampu.includes('7B') ? 4 : 0,
      jpViii: item.jpKelas?.viii !== undefined ? item.jpKelas.viii : item.kelasDiampu.includes('VIII') || item.kelasDiampu.includes('8A') ? 5 : 0,
      jpIx: item.jpKelas?.ix !== undefined ? item.jpKelas.ix : item.kelasDiampu.includes('IX') || item.kelasDiampu.includes('9A') ? 5 : 0,
      jumlahJpTugasTambahan: item.jumlahJpTugasTambahan !== undefined ? item.jumlahJpTugasTambahan : item.totalJp - item.jumlahJp > 0 ? item.totalJp - item.jumlahJp : 0,
      tugasTambahan: item.tugasTambahan || '-',
    });
    setIsGuruModalOpen(true);
  };

  const handleSelectPTKToForm = (ptk: PTK) => {
    const isKepsek = ptk.jabatan.toLowerCase().includes('kepala sekolah');
    setGuruForm((prev) => ({
      ...prev,
      namaGuru: `${ptk.gelarDepan ? ptk.gelarDepan + ' ' : ''}${ptk.namaLengkap}${ptk.gelarBelakang ? ', ' + ptk.gelarBelakang : ''}`,
      nip: ptk.nip,
      nuptk: ptk.nuptk || '',
      golongan: ptk.pangkatGolongan || 'Penata, III/c',
      mataPelajaran: isKepsek ? '-' : ptk.mapelUtama || prev.mataPelajaran || '',
      jpViiA: isKepsek ? 0 : 4,
      jpViiB: isKepsek ? 0 : 4,
      jpViii: isKepsek ? 0 : 4,
      jpIx: isKepsek ? 0 : 4,
      tugasTambahan: isKepsek ? 'Kepala Sekolah' : prev.tugasTambahan,
      jumlahJpTugasTambahan: isKepsek ? 24 : prev.jumlahJpTugasTambahan,
    }));
  };

  const handleSaveGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSK || !guruForm.namaGuru) return;

    const numViiA = Number(guruForm.jpViiA) || 0;
    const numViiB = Number(guruForm.jpViiB) || 0;
    const numViii = Number(guruForm.jpViii) || 0;
    const numIx = Number(guruForm.jpIx) || 0;

    const subtotalJpKbm = numViiA + numViiB + numViii + numIx;
    const numJpTugas = Number(guruForm.jumlahJpTugasTambahan) || 0;
    const totalBebanKerja = subtotalJpKbm + numJpTugas;

    const activeClasses: string[] = [];
    if (numViiA > 0) activeClasses.push('VII.A');
    if (numViiB > 0) activeClasses.push('VII.B');
    if (numViii > 0) activeClasses.push('VIII');
    if (numIx > 0) activeClasses.push('IX');

    const tugasTambahanStr = guruForm.tugasTambahan && guruForm.tugasTambahan.trim() !== '' ? guruForm.tugasTambahan.trim() : '-';

    const itemPayload: Omit<SKKBMItem, 'id'> = {
      namaGuru: guruForm.namaGuru.trim(),
      nip: guruForm.nip.trim() || '-',
      nuptk: guruForm.nuptk.trim() || '-',
      golongan: guruForm.golongan.trim() || '-',
      mataPelajaran: guruForm.mataPelajaran.trim() || '-',
      jpKelas: {
        viiA: numViiA,
        viiB: numViiB,
        viii: numViii,
        ix: numIx,
      },
      kelasDiampu: activeClasses,
      jumlahJp: subtotalJpKbm,
      jumlahJpTugasTambahan: numJpTugas,
      tugasTambahan: tugasTambahanStr,
      totalJp: totalBebanKerja,
    };

    let updatedDaftar: SKKBMItem[];
    if (editingGuru) {
      updatedDaftar = selectedSK.daftarGuru.map((g) =>
        g.id === editingGuru.id ? { ...g, ...itemPayload } : g
      );
      showToast(`Data mengajar ${guruForm.namaGuru} berhasil diperbarui! (Total: ${totalBebanKerja} JP)`, 'success');
    } else {
      const newG: SKKBMItem = {
        id: `G-${Date.now()}`,
        ...itemPayload,
      };
      updatedDaftar = [...selectedSK.daftarGuru, newG];
      showToast(`Guru ${newG.namaGuru} berhasil ditambahkan ke SK KBM! (Total: ${totalBebanKerja} JP)`, 'success');
    }

    const updatedSK: SKKBM = {
      ...selectedSK,
      daftarGuru: updatedDaftar,
    };
    onUpdate(updatedSK);
    setIsGuruModalOpen(false);
    setEditingGuru(null);
  };

  const handleDeleteGuru = (guruId: string) => {
    if (!selectedSK) return;
    const guru = selectedSK.daftarGuru.find((g) => g.id === guruId);
    const updatedSK: SKKBM = {
      ...selectedSK,
      daftarGuru: selectedSK.daftarGuru.filter((g) => g.id !== guruId),
    };
    onUpdate(updatedSK);
    showToast(`Data mengajar ${guru?.namaGuru || 'Guru'} telah dihapus.`, 'info');
  };

  const handleMoveGuru = (guruId: string, direction: 'up' | 'down') => {
    if (!selectedSK) return;
    const index = selectedSK.daftarGuru.findIndex((g) => g.id === guruId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedSK.daftarGuru.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedDaftar = [...selectedSK.daftarGuru];
    const temp = updatedDaftar[index];
    updatedDaftar[index] = updatedDaftar[targetIndex];
    updatedDaftar[targetIndex] = temp;

    const updatedSK: SKKBM = {
      ...selectedSK,
      daftarGuru: updatedDaftar,
    };
    onUpdate(updatedSK);
    showToast(`Urutan "${temp.namaGuru}" dipindahkan ke ${direction === 'up' ? 'atas' : 'bawah'}.`, 'success');
  };

  // 1-Click Auto Import all teachers from PTK database
  const handleAutoImportFromPTK = () => {
    if (!selectedSK || guruPTKList.length === 0) {
      showToast('Tidak ada data Guru di database PTK untuk diimpor.', 'info');
      return;
    }

    const existingNIPSet = new Set(selectedSK.daftarGuru.map((g) => g.nip.replace(/\s+/g, '')));

    const newGuruItems: SKKBMItem[] = guruPTKList
      .filter((ptk) => !existingNIPSet.has(ptk.nip.replace(/\s+/g, '')))
      .map((ptk, idx) => {
        const namaLengkap = `${ptk.gelarDepan ? ptk.gelarDepan + ' ' : ''}${ptk.namaLengkap}${ptk.gelarBelakang ? ', ' + ptk.gelarBelakang : ''}`;
        const isKepsek = ptk.jabatan.toLowerCase().includes('kepala sekolah');
        const defaultJpPerClass = isKepsek ? 0 : 4;
        const subtotal = isKepsek ? 0 : 16;
        const tugas = isKepsek ? 'Kepala Sekolah' : '-';
        const jpTugas = isKepsek ? 24 : 0;

        return {
          id: `G-PTK-${Date.now()}-${idx}`,
          namaGuru: namaLengkap,
          nip: ptk.nip,
          nuptk: ptk.nuptk || '-',
          golongan: ptk.pangkatGolongan || 'Penata, III/c',
          mataPelajaran: isKepsek ? '-' : ptk.mapelUtama || 'Mata Pelajaran Umum',
          jpKelas: {
            viiA: defaultJpPerClass,
            viiB: defaultJpPerClass,
            viii: defaultJpPerClass,
            ix: defaultJpPerClass,
          },
          kelasDiampu: isKepsek ? [] : ['VII.A', 'VII.B', 'VIII', 'IX'],
          jumlahJp: subtotal,
          jumlahJpTugasTambahan: jpTugas,
          tugasTambahan: tugas,
          totalJp: subtotal + jpTugas,
        };
      });

    if (newGuruItems.length === 0) {
      showToast('Semua guru dari database PTK sudah ada dalam lampiran SK KBM.', 'info');
      return;
    }

    const updatedSK: SKKBM = {
      ...selectedSK,
      daftarGuru: [...selectedSK.daftarGuru, ...newGuruItems],
    };
    onUpdate(updatedSK);
    showToast(`Berhasil mengimpor ${newGuruItems.length} guru dari database PTK!`, 'success');
  };

  // Create New SK KBM based on Template
  const handleCreateNewSK = (e: React.FormEvent) => {
    e.preventDefault();

    const perihal =
      newSKForm.tentang.trim() !== ''
        ? newSKForm.tentang.trim()
        : generateDefaultPerihalSK(newSKForm.semester, newSKForm.tahunAjaran);

    const newSK: SKKBM = {
      id: `SKKBM-${Date.now()}`,
      noSK: newSKForm.noSK.trim(),
      tahunAjaran: newSKForm.tahunAjaran.trim(),
      semester: newSKForm.semester,
      tentang: perihal,
      tanggalSK: newSKForm.tanggalSK.trim(),
      tempatPenetapan: newSKForm.tempatPenetapan.trim() || 'Unggulino',
      menimbang: DEFAULT_MENIMBANG_SK,
      mengingat: DEFAULT_MENGINGAT_SK,
      memperhatikan: DEFAULT_MEMPERHATIKAN_SK_LIST(newSKForm.tahunAjaran, newSKForm.tanggalSK),
      statusDrive: 'Tersimpan',
      templateNama: newSKForm.templateNama,
      drivePath: 'TATA USAHA/SK',
      daftarGuru: selectedSK ? [...selectedSK.daftarGuru] : [],
    };

    onAdd(newSK);
    setSelectedSKId(newSK.id);
    setIsNewSKModalOpen(false);
    showToast(`SK KBM Semester ${newSK.semester} TP ${newSK.tahunAjaran} berhasil dibuat!`, 'success');
  };

  // Print Handler via Isolated Print Frame (automatically sets landscape for Lampiran)
  const handlePrintDocument = (mode: SKPrintMode = 'all') => {
    if (!selectedSK) return;
    const htmlContent = generateSKKBMFullHtml(selectedSK, identitasSekolah, mode);
    printHtmlDirectly(htmlContent);
    showToast(
      mode === 'lampiran_only'
        ? 'Membuka dialog cetak Lampiran (Otomatis Landscape A4)...'
        : mode === 'sk_only'
        ? 'Membuka dialog cetak Surat Keputusan (Portrait A4)...'
        : 'Membuka dialog cetak Dokumen SK KBM & Lampiran (Otomatis Landscape)...',
      'info'
    );
  };

  // Download HTML / Printable PDF ready document
  const handleDownloadHtml = (mode: SKPrintMode = 'all') => {
    if (!selectedSK) return;
    downloadSKKBMHtmlFile(selectedSK, identitasSekolah, mode);
    showToast('Dokumen SK KBM resmi berhasil diunduh.', 'success');
  };

  // Export & Save Document to Google Drive (folder TATA USAHA/SK)
  const handleExportToGoogleDrive = async () => {
    if (!selectedSK) return;
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      showToast('Harap hubungkan akun Google Drive untuk menyimpan arsip SK.', 'info');
      return;
    }

    try {
      setIsExportingToDrive(true);

      const htmlContent = generateSKKBMFullHtml(selectedSK, identitasSekolah);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const cleanNo = selectedSK.noSK.replace(/[\/\\?%*:|"<>]/g, '_');
      const fileName = `[SK_KBM]_${cleanNo}_Semester_${selectedSK.semester}_${selectedSK.tahunAjaran.replace('/', '-')}.html`;

      const uploaded = await uploadSKKBMDocumentToDrive(googleToken, blob, fileName, 'text/html');

      const updatedSK: SKKBM = {
        ...selectedSK,
        statusDrive: 'Tersimpan',
        driveFileId: uploaded.id,
        driveWebViewLink: uploaded.webViewLink,
        drivePath: 'TATA USAHA/SK',
      };
      onUpdate(updatedSK);

      showToast(`Dokumen SK KBM berhasil diarsipkan ke Google Drive folder TATA USAHA/SK!`, 'success');
    } catch (err: any) {
      console.error('Error export SK KBM to Drive:', err);
      showToast(`Gagal mengekspor ke Google Drive: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsExportingToDrive(false);
    }
  };

  // Filtered teachers list for search
  const filteredGuruList = selectedSK
    ? selectedSK.daftarGuru.filter(
        (g) =>
          g.namaGuru.toLowerCase().includes(searchGuruQuery.toLowerCase()) ||
          g.nip.includes(searchGuruQuery) ||
          g.mataPelajaran.toLowerCase().includes(searchGuruQuery.toLowerCase()) ||
          g.tugasTambahan?.toLowerCase().includes(searchGuruQuery.toLowerCase())
      )
    : [];

  const totalJpMengajarViiA = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.jpKelas?.viiA) || 0), 0) : 0;
  const totalJpMengajarViiB = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.jpKelas?.viiB) || 0), 0) : 0;
  const totalJpMengajarViii = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.jpKelas?.viii) || 0), 0) : 0;
  const totalJpMengajarIx = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.jpKelas?.ix) || 0), 0) : 0;
  const totalBebanKBM = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.jumlahJp) || 0), 0) : 0;
  const totalJpTugasTambahan = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.jumlahJpTugasTambahan) || (g.totalJp - g.jumlahJp > 0 ? g.totalJp - g.jumlahJp : 0)), 0) : 0;
  const totalBebanSeluruh = selectedSK ? selectedSK.daftarGuru.reduce((acc, g) => acc + (Number(g.totalJp) || 0), 0) : 0;
  const guruDenganTugasTambahan = selectedSK
    ? selectedSK.daftarGuru.filter((g) => g.tugasTambahan && g.tugasTambahan !== '-').length
    : 0;

  const tanggalFormatSK = selectedSK ? formatTanggalIndonesia(selectedSK.tanggalSK) : '';

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold text-white animate-fade-in ${
            toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Surat Keputusan / <span className="text-slate-800 font-semibold">SK KBM & Pembagian Tugas</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-500" />
            <span>SK PEMBAGIAN TUGAS GURU & KBM</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenEditHeader}
            className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            title="Sesuaikan Nomor SK, Semester, Tahun Pelajaran, Tanggal SK, Tempat, dan Perihal"
          >
            <Edit2 className="w-4 h-4 text-amber-600" />
            <span>Sesuaikan Parameter SK</span>
          </button>

          <button
            onClick={handleOpenNewSK}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat SK Baru</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak SK & Lampiran Resmi</span>
          </button>
        </div>
      </div>

      {/* Drive Template Info & Integration Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                  Format Standar Dokumen SK: Google Drive <span className="font-mono">TATA USAHA/SK</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  Kepala Surat s.d. Memutuskan
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Struktur dokumen SK KBM mengikuti template baku arsip folder <strong>TATA USAHA/SK</strong> lengkap dari <strong>Kepala Surat (dengan logo)</strong>, konsiderans menimbang, mengingat, memperhatikan, diktum <strong>MEMUTUSKAN</strong> & <strong>MENETAPKAN</strong>, tanda tangan, hingga <strong>Lampiran I</strong>. Dalam aplikasi Anda cukup menyesuaikan <em>Nomor SK</em>, <em>Semester & Tahun Pelajaran</em>, <em>Tanggal SK</em>, <em>Tempat Penetapan</em>, dan <em>Perihal SK</em>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            {googleToken ? (
              <button
                onClick={() => {
                  loadDriveTemplates();
                  setIsDriveTemplateModalOpen(true);
                }}
                className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5 text-amber-600" />
                <span>Lihat Berkas di TATA USAHA/SK</span>
              </button>
            ) : (
              <button
                onClick={onConnectGoogle}
                className="bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Hubungkan Google Drive</span>
              </button>
            )}

            <button
              onClick={handleExportToGoogleDrive}
              disabled={isExportingToDrive}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExportingToDrive ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>{isExportingToDrive ? 'Menyimpan...' : 'Simpan ke Drive SK'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SK Selector Tabs (If multiple SK exist) */}
      {skList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 light-scrollbar">
          <span className="text-xs text-slate-500 font-bold uppercase shrink-0">Pilih Dokumen SK:</span>
          {skList.map((sk) => (
            <button
              key={sk.id}
              onClick={() => setSelectedSKId(sk.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                selectedSKId === sk.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>
                Semester {sk.semester} ({sk.tahunAjaran})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Current SK Metadata & Live Customizer Box */}
      {selectedSK && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg">
                  NOMOR SK: {selectedSK.noSK}
                </span>
                <span className="bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                  Semester {selectedSK.semester}
                </span>
                <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                  TP {selectedSK.tahunAjaran}
                </span>
                <span className="bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                  {selectedSK.tempatPenetapan || 'Puriala'}, {tanggalFormatSK}
                </span>
                {selectedSK.driveWebViewLink && (
                  <a
                    href={selectedSK.driveWebViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
                  >
                    <Cloud className="w-3 h-3" />
                    <span>Tersimpan di Drive</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                {selectedSK.tentang || generateDefaultPerihalSK(selectedSK.semester, selectedSK.tahunAjaran)}
              </h3>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                <span>
                  Tempat: <strong>{selectedSK.tempatPenetapan || 'Puriala'}</strong>
                </span>
                <span>•</span>
                <span>
                  Tanggal SK: <strong>{tanggalFormatSK}</strong>
                </span>
                <span>•</span>
                <span>
                  Penandatangan: <strong>{identitasSekolah.namaKepalaSekolah}</strong> ({identitasSekolah.pangkatKepsek || 'Kepala Sekolah'})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleOpenEditHeader}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-amber-300 shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Sesuaikan Parameter SK</span>
              </button>

              <button
                onClick={() => handleDownloadHtml('all')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 border border-slate-300 shadow-sm"
                title="Unduh Dokumen SK Berkop Resmi dalam format HTML"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh HTML</span>
              </button>

              <button
                onClick={() => handlePrintDocument('all')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Cetak Seluruh Dokumen SK KBM & Lampiran (Otomatis Landscape untuk Lampiran)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Total Pendidik (Lampiran)</div>
              <div className="text-lg font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                <span>{selectedSK.daftarGuru.length}</span>
                <span className="text-xs font-medium text-slate-500">Guru</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Total Jam KBM</div>
              <div className="text-lg font-black text-amber-900 mt-0.5 flex items-baseline gap-1">
                <span>{totalBebanKBM}</span>
                <span className="text-xs font-medium text-amber-700">JP/Minggu</span>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3">
              <div className="text-[11px] font-bold text-blue-800 uppercase">Guru Tugas Tambahan</div>
              <div className="text-lg font-black text-blue-900 mt-0.5 flex items-baseline gap-1">
                <span>{guruDenganTugasTambahan}</span>
                <span className="text-xs font-medium text-blue-700">Guru ({totalJpTugasTambahan} JP)</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Grand Total Beban Kerja</div>
              <div className="text-lg font-black text-emerald-900 mt-0.5 flex items-baseline gap-1">
                <span>{totalBebanSeluruh}</span>
                <span className="text-xs font-medium text-emerald-700">JP Ekuivalen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table of Teaching Assignments (Lampiran I) */}
      {selectedSK && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Control Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h4 className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>LAMPIRAN I: RINCIAN PEMBAGIAN TUGAS GURU ({filteredGuruList.length} Pendidik)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sesuaikan alokasi mengajar kelas VII.A, VII.B, VIII, IX, dan tugas tambahan masing-masing guru.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchGuruQuery}
                  onChange={(e) => setSearchGuruQuery(e.target.value)}
                  placeholder="Cari guru / mapel..."
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white w-40 sm:w-48"
                />
              </div>

              {guruPTKList.length > 0 && (
                <button
                  onClick={handleAutoImportFromPTK}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  title="Tarik data seluruh guru dari database PTK ke SK KBM"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tarik dari Database PTK</span>
                </button>
              )}

              <button
                onClick={handleOpenAddGuru}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Guru & Mapel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[11px]">
                <tr>
                  <th rowSpan={2} className="py-2.5 px-2 w-10 text-center border border-slate-300">NO</th>
                  <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 min-w-[200px]">NAMA GURU</th>
                  <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 w-36 text-center">NUPTK</th>
                  <th rowSpan={2} className="py-2.5 px-2 border border-slate-300 w-16 text-center">GOL</th>
                  <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 min-w-[150px]">MENGAJAR MATA PELAJARAN</th>
                  <th colSpan={4} className="py-2 px-2 border border-slate-300 text-center bg-amber-50/70 text-amber-900">KELAS DAN ALOKASI WAKTU</th>
                  <th rowSpan={2} className="py-2.5 px-2 border border-slate-300 w-24 text-center">JUMLAH TUGAS TAMBAHAN</th>
                  <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 min-w-[160px]">TUGAS TAMBAHAN</th>
                  <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 w-28 text-center bg-blue-50/70 text-blue-900">JUMLAH BEBAN KERJA</th>
                  <th rowSpan={2} className="py-2.5 px-2 border border-slate-300 text-center no-print w-28">URUTAN / AKSI</th>
                </tr>
                <tr className="bg-slate-100/90 text-slate-700">
                  <th className="py-1.5 px-2 text-center border border-slate-300 w-12 bg-amber-50/40">VII.A</th>
                  <th className="py-1.5 px-2 text-center border border-slate-300 w-12 bg-amber-50/40">VII.B</th>
                  <th className="py-1.5 px-2 text-center border border-slate-300 w-12 bg-amber-50/40">VIII</th>
                  <th className="py-1.5 px-2 text-center border border-slate-300 w-12 bg-amber-50/40">IX</th>
                </tr>
                <tr className="bg-slate-200/80 text-slate-500 font-semibold text-[10px] italic text-center">
                  <th className="py-1 border border-slate-300">1</th>
                  <th className="py-1 border border-slate-300">2</th>
                  <th className="py-1 border border-slate-300">3</th>
                  <th className="py-1 border border-slate-300">4</th>
                  <th className="py-1 border border-slate-300">5</th>
                  <th className="py-1 border border-slate-300">6</th>
                  <th className="py-1 border border-slate-300">7</th>
                  <th className="py-1 border border-slate-300">8</th>
                  <th className="py-1 border border-slate-300">9</th>
                  <th className="py-1 border border-slate-300">10</th>
                  <th className="py-1 border border-slate-300">11</th>
                  <th className="py-1 border border-slate-300">12</th>
                  <th className="py-1 border border-slate-300 no-print">-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuruList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">
                      {searchGuruQuery
                        ? `Tidak ada data guru yang cocok dengan pencarian "${searchGuruQuery}".`
                        : 'Belum ada guru dalam lampiran SK KBM. Silakan klik "Tambah Guru & Mapel" atau "Tarik dari Database PTK".'}
                    </td>
                  </tr>
                ) : (
                  filteredGuruList.map((guru, idx) => (
                    <tr key={guru.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-2.5 px-2 text-center font-bold text-slate-500 border border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        <div className="font-bold text-slate-900">{guru.namaGuru}</div>
                        <div className="text-[10px] font-mono text-slate-500">NIP. {guru.nip}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600 border border-slate-200">
                        {guru.nuptk || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center border border-slate-200">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {guru.golongan}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 border border-slate-200">
                        {guru.mataPelajaran}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 border border-slate-200">
                        {guru.jpKelas?.viiA !== undefined && guru.jpKelas.viiA > 0 ? guru.jpKelas.viiA : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 border border-slate-200">
                        {guru.jpKelas?.viiB !== undefined && guru.jpKelas.viiB > 0 ? guru.jpKelas.viiB : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 border border-slate-200">
                        {guru.jpKelas?.viii !== undefined && guru.jpKelas.viii > 0 ? guru.jpKelas.viii : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 border border-slate-200">
                        {guru.jpKelas?.ix !== undefined && guru.jpKelas.ix > 0 ? guru.jpKelas.ix : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-blue-700 border border-slate-200">
                        {guru.jumlahJpTugasTambahan !== undefined && guru.jumlahJpTugasTambahan > 0
                          ? guru.jumlahJpTugasTambahan
                          : guru.totalJp - guru.jumlahJp > 0
                          ? guru.totalJp - guru.jumlahJp
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 border border-slate-200">
                        {guru.tugasTambahan && guru.tugasTambahan !== '-' ? (
                          <span className="text-slate-800 font-medium">{guru.tugasTambahan}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center border border-slate-200 bg-blue-50/40">
                        <span className="font-extrabold text-blue-900 text-sm">{guru.totalJp}</span>
                        <span className="text-[10px] text-blue-600 font-semibold ml-0.5">JP</span>
                      </td>
                      <td className="py-2.5 px-2 text-center border border-slate-200 no-print">
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleMoveGuru(guru.id, 'up')}
                              disabled={idx === 0 || !!searchGuruQuery}
                              className={`p-1 rounded transition ${
                                idx === 0 || !!searchGuruQuery
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-700 hover:text-amber-700 hover:bg-amber-100'
                              }`}
                              title={searchGuruQuery ? 'Hapus pencarian untuk mengubah urutan' : 'Pindah Ke Atas (Naikkan Urutan)'}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveGuru(guru.id, 'down')}
                              disabled={idx === filteredGuruList.length - 1 || !!searchGuruQuery}
                              className={`p-1 rounded transition ${
                                idx === filteredGuruList.length - 1 || !!searchGuruQuery
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-700 hover:text-amber-700 hover:bg-amber-100'
                              }`}
                              title={searchGuruQuery ? 'Hapus pencarian untuk mengubah urutan' : 'Pindah Ke Bawah (Turunkan Urutan)'}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleOpenEditGuru(guru)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Alokasi Jam Mengajar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setGuruToDelete(guru)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus dari Lampiran SK"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-center uppercase tracking-wider text-xs">
                    JUMLAH TOTAL BEBAN MENGAJAR & TUGAS TAMBAHAN
                  </td>
                  <td className="py-3 px-2 text-center font-black">{totalJpMengajarViiA}</td>
                  <td className="py-3 px-2 text-center font-black">{totalJpMengajarViiB}</td>
                  <td className="py-3 px-2 text-center font-black">{totalJpMengajarViii}</td>
                  <td className="py-3 px-2 text-center font-black">{totalJpMengajarIx}</td>
                  <td className="py-3 px-2 text-center font-black text-blue-800">{totalJpTugasTambahan}</td>
                  <td className="py-3 px-3 text-center text-slate-500 font-normal italic">-</td>
                  <td className="py-3 px-3 text-center bg-blue-100 font-black text-blue-950 text-sm">
                    {totalBebanSeluruh} JP
                  </td>
                  <td className="py-3 px-2 text-center no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Sesuaikan Parameter SK (Nomor, Semester, Tapel, Tanggal, Tempat, Perihal) */}
      {/* ========================================================================= */}
      {isEditHeaderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 uppercase">
                  <Edit2 className="w-4 h-4 text-amber-600" />
                  <span>Sesuaikan Parameter SK KBM</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menyesuaikan nomor SK, semester, tahun pelajaran, tanggal, tempat, dan perihal surat keputusan.
                </p>
              </div>
              <button
                onClick={() => setIsEditHeaderModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeader} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nomor Surat Keputusan (Nomor SK)</label>
                <input
                  type="text"
                  required
                  value={editHeaderForm.noSK}
                  onChange={(e) => setEditHeaderForm({ ...editHeaderForm, noSK: e.target.value })}
                  placeholder="Contoh: 800/112/SMP.02/SK/2026"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Semester</label>
                  <select
                    value={editHeaderForm.semester}
                    onChange={(e) =>
                      setEditHeaderForm({ ...editHeaderForm, semester: e.target.value as 'Ganjil' | 'Genap' })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={editHeaderForm.tahunAjaran}
                    onChange={(e) => setEditHeaderForm({ ...editHeaderForm, tahunAjaran: e.target.value })}
                    placeholder="2025/2026"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal SK</label>
                  <input
                    type="date"
                    required
                    value={editHeaderForm.tanggalSK}
                    onChange={(e) => setEditHeaderForm({ ...editHeaderForm, tanggalSK: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempat Penetapan</label>
                  <input
                    type="text"
                    required
                    value={editHeaderForm.tempatPenetapan}
                    onChange={(e) => setEditHeaderForm({ ...editHeaderForm, tempatPenetapan: e.target.value })}
                    placeholder="Puriala"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">Perihal / Tentang SK</label>
                  <button
                    type="button"
                    onClick={handleAutoGeneratePerihal}
                    className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 underline"
                    title="Buat teks perihal otomatis dari Semester & Tahun Pelajaran"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Auto-Generate Perihal</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={editHeaderForm.tentang}
                  onChange={(e) => setEditHeaderForm({ ...editHeaderForm, tentang: e.target.value })}
                  placeholder="PEMBAGIAN TUGAS GURU DALAM PROSES BELAJAR MENGAJAR..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium uppercase text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditHeaderModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Buat SK KBM Baru dari Template */}
      {/* ========================================================================= */}
      {isNewSKModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 uppercase">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Buat SK KBM Baru dari Template Drive</span>
              </h3>
              <button onClick={() => setIsNewSKModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-900 leading-relaxed">
                Struktur dokumen surat keputusan akan otomatis menggunakan format baku folder{' '}
                <strong>TATA USAHA/SK</strong> lengkap dari kepala surat berlogo sampai memutuskan.
              </p>
            </div>

            <form onSubmit={handleCreateNewSK} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nomor Surat Keputusan Baru</label>
                <input
                  type="text"
                  required
                  value={newSKForm.noSK}
                  onChange={(e) => setNewSKForm({ ...newSKForm, noSK: e.target.value })}
                  placeholder="800/113/SMP.02/SK/2026"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Semester</label>
                  <select
                    value={newSKForm.semester}
                    onChange={(e) =>
                      setNewSKForm({ ...newSKForm, semester: e.target.value as 'Ganjil' | 'Genap' })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={newSKForm.tahunAjaran}
                    onChange={(e) => setNewSKForm({ ...newSKForm, tahunAjaran: e.target.value })}
                    placeholder="2025/2026"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Penetapan SK</label>
                  <input
                    type="date"
                    required
                    value={newSKForm.tanggalSK}
                    onChange={(e) => setNewSKForm({ ...newSKForm, tanggalSK: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempat Penetapan</label>
                  <input
                    type="text"
                    required
                    value={newSKForm.tempatPenetapan}
                    onChange={(e) => setNewSKForm({ ...newSKForm, tempatPenetapan: e.target.value })}
                    placeholder="Puriala"
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Perihal SK (Opsional / Otomatis)</label>
                <textarea
                  rows={2}
                  value={newSKForm.tentang}
                  onChange={(e) => setNewSKForm({ ...newSKForm, tentang: e.target.value })}
                  placeholder={`Kosongkan untuk otomatis: ${generateDefaultPerihalSK(newSKForm.semester, newSKForm.tahunAjaran)}`}
                  className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSKModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Dokumen SK KBM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Input / Edit Guru KBM */}
      {/* ========================================================================= */}
      {isGuruModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>{editingGuru ? 'Edit Pembagian Mengajar Guru' : 'Tambah Guru ke SK KBM'}</span>
              </h3>
              <button onClick={() => setIsGuruModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pick from PTK Database */}
            {!editingGuru && guruPTKList.length > 0 && (
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="block text-slate-600 font-bold text-[11px] uppercase mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Pilih Cepat dari Database PTK</span>
                </label>
                <select
                  onChange={(e) => {
                    const ptk = guruPTKList.find((p) => p.id === e.target.value);
                    if (ptk) handleSelectPTKToForm(ptk);
                  }}
                  defaultValue=""
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="" disabled>
                    -- Pilih Nama Guru Terdaftar --
                  </option>
                  {guruPTKList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaLengkap} - {p.mapelUtama || p.jabatan}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSaveGuru} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={guruForm.namaGuru}
                  onChange={(e) => setGuruForm({ ...guruForm, namaGuru: e.target.value })}
                  placeholder="Contoh: Hasnawati, S.Pd., M.Si."
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIP / NIPPPK</label>
                  <input
                    type="text"
                    value={guruForm.nip}
                    onChange={(e) => setGuruForm({ ...guruForm, nip: e.target.value })}
                    placeholder="19750512..."
                    className="w-full border border-slate-300 rounded-xl p-2 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NUPTK</label>
                  <input
                    type="text"
                    value={guruForm.nuptk}
                    onChange={(e) => setGuruForm({ ...guruForm, nuptk: e.target.value })}
                    placeholder="345678..."
                    className="w-full border border-slate-300 rounded-xl p-2 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pangkat & Golongan</label>
                  <input
                    type="text"
                    value={guruForm.golongan}
                    onChange={(e) => setGuruForm({ ...guruForm, golongan: e.target.value })}
                    placeholder="Pembina, IV/a"
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mata Pelajaran yang Diampu</label>
                <input
                  type="text"
                  required
                  value={guruForm.mataPelajaran}
                  onChange={(e) => setGuruForm({ ...guruForm, mataPelajaran: e.target.value })}
                  placeholder="Contoh: Ilmu Pengetahuan Alam (IPA) atau - (Khusus Kepsek)"
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-amber-950"
                />
              </div>

              {/* Alokasi Jam Mengajar per Rombel Kelas */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3">
                <label className="block text-amber-950 font-bold text-xs mb-1.5 flex items-center justify-between">
                  <span>Alokasi Jam Mengajar per Kelas (JP / Minggu)</span>
                  <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    Subtotal: {(Number(guruForm.jpViiA) || 0) + (Number(guruForm.jpViiB) || 0) + (Number(guruForm.jpViii) || 0) + (Number(guruForm.jpIx) || 0)} JP
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div>
                    <span className="block text-center text-[11px] font-bold text-slate-700 mb-1">VII.A</span>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={guruForm.jpViiA}
                      onChange={(e) => setGuruForm({ ...guruForm, jpViiA: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-center font-bold text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-center text-[11px] font-bold text-slate-700 mb-1">VII.B</span>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={guruForm.jpViiB}
                      onChange={(e) => setGuruForm({ ...guruForm, jpViiB: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-center font-bold text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-center text-[11px] font-bold text-slate-700 mb-1">VIII</span>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={guruForm.jpViii}
                      onChange={(e) => setGuruForm({ ...guruForm, jpViii: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-center font-bold text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <span className="block text-center text-[11px] font-bold text-slate-700 mb-1">IX</span>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={guruForm.jpIx}
                      onChange={(e) => setGuruForm({ ...guruForm, jpIx: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-center font-bold text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tugas Tambahan & JP Tugas Tambahan */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="block text-slate-800 font-bold text-xs">
                  Tugas Tambahan & Ekuivalensi JP
                </label>

                {/* Preset Role Picker */}
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">
                    Pilihan Cepat Tugas Tambahan:
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedPreset = PRESET_TUGAS_TAMBAHAN.find((p) => p.role === e.target.value);
                      if (selectedPreset) {
                        setGuruForm({
                          ...guruForm,
                          tugasTambahan: selectedPreset.role,
                          jumlahJpTugasTambahan: selectedPreset.jp,
                        });
                      }
                    }}
                    value={PRESET_TUGAS_TAMBAHAN.some((p) => p.role === guruForm.tugasTambahan) ? guruForm.tugasTambahan : ''}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                  >
                    <option value="" disabled>
                      -- Pilih Preset Tugas Tambahan --
                    </option>
                    {PRESET_TUGAS_TAMBAHAN.map((p, i) => (
                      <option key={i} value={p.role}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">Nama Tugas Tambahan (Kustom)</label>
                    <input
                      type="text"
                      value={guruForm.tugasTambahan}
                      onChange={(e) => setGuruForm({ ...guruForm, tugasTambahan: e.target.value })}
                      placeholder="Contoh: Wakasek Kurikulum / Wali Kelas VII.A"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">JP Tugas</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={guruForm.jumlahJpTugasTambahan}
                      onChange={(e) => setGuruForm({ ...guruForm, jumlahJpTugasTambahan: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs font-bold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Total Beban Kerja Live Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-950 text-xs">Total Beban Kerja Terhitung Otomatis</div>
                  <div className="text-[10px] text-blue-700">
                    Beban Mengajar ({(Number(guruForm.jpViiA) || 0) + (Number(guruForm.jpViiB) || 0) + (Number(guruForm.jpViii) || 0) + (Number(guruForm.jpIx) || 0)} JP) + Tugas Tambahan ({Number(guruForm.jumlahJpTugasTambahan) || 0} JP)
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-900">
                    {(Number(guruForm.jpViiA) || 0) + (Number(guruForm.jpViiB) || 0) + (Number(guruForm.jpViii) || 0) + (Number(guruForm.jpIx) || 0) + (Number(guruForm.jumlahJpTugasTambahan) || 0)}
                  </span>
                  <span className="text-xs font-bold text-blue-800 ml-1">JP/Mgg</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGuruModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md"
                >
                  Simpan Pembagian KBM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Lihat Berkas Template di Google Drive TATA USAHA/SK */}
      {/* ========================================================================= */}
      {isDriveTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-amber-600" />
                <span>Berkas Template di Google Drive (Folder TATA USAHA/SK)</span>
              </h3>
              <button onClick={() => setIsDriveTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>Daftar berkas SK & Template di folder TATA USAHA/SK:</span>
                <button
                  onClick={loadDriveTemplates}
                  className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDriveTemplates ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>

              {isLoadingDriveTemplates ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                  <p className="text-xs">Memeriksa folder TATA USAHA/SK di Google Drive...</p>
                </div>
              ) : driveTemplates.length === 0 ? (
                <div className="py-6 text-center text-slate-500 bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300">
                  <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-xs">Folder TATA USAHA/SK siap digunakan.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format resmi telah disinkronkan langsung dalam aplikasi. Klik tombol "Simpan ke Drive SK" untuk mengarsipkan dokumen surat keputusan.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
                  {driveTemplates.map((file) => (
                    <div key={file.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                          >
                            <span>Buka di Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsDriveTemplateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Cetak Dokumen Resmi SK & Lampiran Pembagian Tugas */}
      {/* ========================================================================= */}
      {isPrintModalOpen && selectedSK && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[95vh] overflow-y-auto light-scrollbar flex flex-col">
            {/* Header Modal & Print Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 mb-4 no-print shrink-0">
              <div>
                <div className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>Pratinjau & Cetak Dokumen Resmi SK KBM SMP Negeri 2 Puriala</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Format Naskah Dinas: Halaman 1 (SK) Portrait &amp; Halaman 2 (Lampiran) Otomatis Landscape A4
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleDownloadHtml('all')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition shadow-xs"
                  title="Unduh File HTML Resmi (Bisa langsung dibuka di Chrome / Word / Docs)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh HTML</span>
                </button>

                <button
                  onClick={handleExportToGoogleDrive}
                  disabled={isExportingToDrive}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  title="Arsipkan ke Google Drive Folder TATA USAHA/SK"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isExportingToDrive ? 'Menyimpan...' : 'Simpan ke Drive'}</span>
                </button>

                <button
                  onClick={() => handlePrintDocument('sk_only')}
                  className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  title="Cetak Surat Keputusan saja (Format Portrait A4)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cetak SK (Portrait)</span>
                </button>

                <button
                  onClick={() => handlePrintDocument('lampiran_only')}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  title="Cetak Tabel Beban Kerja Guru saja (Format Landscape A4)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cetak Lampiran (Landscape)</span>
                </button>

                <button
                  onClick={() => handlePrintDocument('all')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  title="Cetak Seluruh Dokumen SK KBM & Lampiran (Otomatis Landscape untuk Lampiran)"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cetak / Simpan PDF (Lengkap)</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition ml-1"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Sheet) */}
            <div className="border border-slate-300 p-6 sm:p-9 printable-document text-slate-900 bg-white font-serif leading-relaxed text-xs shadow-xs rounded-xl">
              {/* ========================================================= */}
              {/* HALAMAN 1: KEPALA SURAT BERLOGO RESMI SAMPAI MEMUTUSKAN (PORTRAIT) */}
              {/* ========================================================= */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-1.5 mb-3 text-[11px] font-sans font-bold text-slate-600 flex items-center justify-between no-print">
                <span>📄 HALAMAN 1: SURAT KEPUTUSAN (FORMAT PORTRAIT / TEGAK)</span>
                <button
                  onClick={() => handlePrintDocument('sk_only')}
                  className="text-slate-700 hover:text-slate-900 underline text-[10px]"
                >
                  Cetak Halaman Ini Saja
                </button>
              </div>

              {/* Kop Surat Resmi dengan Logo Konawe (Kiri) dan Tut Wuri Handayani (Kanan) */}
              <div className="flex items-center justify-between gap-4 border-b-2 border-t-0 border-l-0 border-r-0 border-slate-900 pb-2 mb-4 font-serif relative">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  <img src={LOGO_KABUPATEN_KONAWE_BASE64} alt="Logo Konawe" className="w-16 h-16 object-contain" />
                </div>
                <div className="text-center flex-1">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 m-0 leading-tight">
                    PEMERINTAH KABUPATEN KONAWE
                  </h4>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 m-0 mt-0.5 leading-tight">
                    DINAS PENDIDIKAN DAN KEBUDAYAAN
                  </h3>
                  <h2 className="font-black text-base uppercase mt-0.5 tracking-wide text-slate-900 m-0 leading-tight">
                    {identitasSekolah.namaSekolah}
                  </h2>
                  <p className="text-[11px] font-bold text-slate-800 m-0 mt-0.5">
                    Terakreditasi B ( Baik)
                  </p>
                  <p className="text-[10px] text-slate-800 m-0">
                    Alamat : Jl. Poros Lambuya – Motaha Km.23 Kec. Puriala
                  </p>
                  <p className="text-[10px] text-slate-800 m-0">
                    Email : {identitasSekolah.email || 'smpnpuriala523@gmail.com'}
                  </p>
                </div>
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  <img src={LOGO_TUT_WURI_BASE64} alt="Logo Kemendikbud" className="w-16 h-16 object-contain" />
                </div>
              </div>

              {/* Judul Surat Keputusan */}
              <div className="text-center mb-4 font-serif">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 m-0">
                  SURAT KEPUTUSAN
                </h3>
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 m-0 mt-0.5">
                  KEPALA {identitasSekolah.namaSekolah}
                </h3>
                <p className="font-bold text-xs mt-0.5 text-slate-900">
                  NOMOR : {selectedSK.noSK}
                </p>
                <p className="font-bold text-xs uppercase mt-2 text-slate-900 tracking-widest">T E N T A N G</p>
                <p className="font-bold text-xs max-w-xl mx-auto uppercase mt-0.5 text-slate-900 leading-snug">
                  {selectedSK.tentang || generateDefaultPerihalSK(selectedSK.semester, selectedSK.tahunAjaran)}
                </p>
              </div>

              <div className="text-center font-bold text-xs uppercase mb-3 font-serif tracking-wider">
                KEPALA &nbsp;SMP &nbsp;NEGERI &nbsp;2 PURIALA
              </div>

              {/* Konsiderans (Menimbang, Mengingat, Memperhatikan) */}
              <table className="w-full border-collapse mb-3 text-[11px] font-serif">
                <tbody>
                  <tr>
                    <td className="w-24 font-bold align-top py-0.5">Menimbang</td>
                    <td className="w-4 font-bold align-top text-center py-0.5">:</td>
                    <td className="align-top py-0.5">
                      <ol className="list-[lower-alpha] pl-5 space-y-1 text-justify">
                        {(selectedSK.menimbang && selectedSK.menimbang.length > 0 ? selectedSK.menimbang : DEFAULT_MENIMBANG_SK).map(
                          (item, idx) => (
                            <li key={idx}>{item}</li>
                          )
                        )}
                      </ol>
                    </td>
                  </tr>
                  <tr>
                    <td className="w-24 font-bold align-top py-1">Mengingat</td>
                    <td className="w-4 font-bold align-top text-center py-1">:</td>
                    <td className="align-top py-1">
                      <ol className="list-decimal pl-5 space-y-1 text-justify">
                        {(selectedSK.mengingat && selectedSK.mengingat.length > 0 ? selectedSK.mengingat : DEFAULT_MENGINGAT_SK).map(
                          (item, idx) => (
                            <li key={idx}>{item}</li>
                          )
                        )}
                      </ol>
                    </td>
                  </tr>
                  <tr>
                    <td className="w-24 font-bold align-top py-1">Memperhatikan</td>
                    <td className="w-4 font-bold align-top text-center py-1">:</td>
                    <td className="align-top py-1">
                      <ol className="list-decimal pl-5 space-y-1 text-justify">
                        {(selectedSK.memperhatikan && selectedSK.memperhatikan.length > 0
                          ? selectedSK.memperhatikan
                          : DEFAULT_MEMPERHATIKAN_SK_LIST(selectedSK.tahunAjaran, selectedSK.tanggalSK)
                        ).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Diktum MEMUTUSKAN & MENETAPKAN */}
              <div className="my-3 text-[11px] font-serif">
                <div className="font-bold text-center uppercase tracking-widest my-1.5 text-slate-900">
                  MEMUTUSKAN
                </div>
                <div className="font-bold mb-1.5">Menetapkan</div>

                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-20 font-bold align-top py-0.5">Pertama</td>
                      <td className="w-4 font-bold align-top text-center py-0.5">:</td>
                      <td className="align-top py-0.5 text-justify">
                        Beban kerja guru/pembagian tugas guru dalam proses pembelajaran semester{' '}
                        {selectedSK.semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'} T.P {selectedSK.tahunAjaran}. sebagaimana tersebut namanya dalam lampiran surat keputusan ini.
                      </td>
                    </tr>
                    <tr>
                      <td className="w-20 font-bold align-top py-0.5">Kedua</td>
                      <td className="w-4 font-bold align-top text-center py-0.5">:</td>
                      <td className="align-top py-0.5 text-justify">
                        Semua guru berkewajiban memenuhi dokumen pendukung yang berupa perencanaan, pelaksanaan pembelajaran, penilaian, dan pembimbingan yang menjadi tanggung jawabnya serta melaporkannya kepada kepala sekolah secara tertulis;
                      </td>
                    </tr>
                    <tr>
                      <td className="w-20 font-bold align-top py-0.5">Ketiga</td>
                      <td className="w-4 font-bold align-top text-center py-0.5">:</td>
                      <td className="align-top py-0.5 text-justify">
                        Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan pada anggaran yang sesuai;
                      </td>
                    </tr>
                    <tr>
                      <td className="w-20 font-bold align-top py-0.5">Keempat</td>
                      <td className="w-4 font-bold align-top text-center py-0.5">:</td>
                      <td className="align-top py-0.5 text-justify">
                        Keputusan ini mulai berlaku sejak tanggal ditetapkan dengan ketentuan apabila ternyata terdapat kekeliruan dalam keputusan ini akan ditinjau kembali dan diperbaiki sebagaimana mestinya.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan Kepsek Halaman 1 */}
              <div className="flex justify-end pt-4 mb-4 font-serif">
                <div className="text-left w-64 text-[11px]">
                  <div>Ditetapkan di : {selectedSK.tempatPenetapan || 'Unggulino'}</div>
                  <div>Pada Tanggal : {tanggalFormatSK}</div>
                  <div className="font-bold mt-1">Kepala Sekolah,</div>
                  <div className="h-14"></div>
                  <div className="font-bold underline">{identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si'}</div>
                  <div className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012'}</div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* HALAMAN 2: LEMBAR LAMPIRAN I (PEMBAGIAN TUGAS KBM - LANDSCAPE) */}
              {/* ========================================================= */}
              <div className="border-t-4 border-dashed border-slate-300 pt-6 mt-8 font-serif">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-[11px] font-sans font-bold text-amber-900 flex flex-wrap items-center justify-between gap-2 no-print">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>📑 HALAMAN 2: LAMPIRAN I PEMBAGIAN TUGAS GURU (OTOMATIS LANDSCAPE A4)</span>
                  </div>
                  <button
                    onClick={() => handlePrintDocument('lampiran_only')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Cetak Khusus Lampiran Ini (Landscape)</span>
                  </button>
                </div>
                <table className="w-full border-collapse text-[11px] mb-3 leading-snug">
                  <tbody>
                    <tr>
                      <td className="w-20 font-bold align-top">Lampiran</td>
                      <td className="w-3 font-bold align-top">:</td>
                      <td className="align-top">SK Kepala {identitasSekolah.namaSekolah}</td>
                    </tr>
                    <tr>
                      <td className="w-20 font-bold align-top">Nomor</td>
                      <td className="w-3 font-bold align-top">:</td>
                      <td className="align-top font-mono">{selectedSK.noSK}</td>
                    </tr>
                    <tr>
                      <td className="w-20 font-bold align-top">Tanggal</td>
                      <td className="w-3 font-bold align-top">:</td>
                      <td className="align-top">{tanggalFormatSK}</td>
                    </tr>
                    <tr>
                      <td className="w-20 font-bold align-top">Tentang</td>
                      <td className="w-3 font-bold align-top">:</td>
                      <td className="align-top font-bold uppercase">
                        {selectedSK.tentang || generateDefaultPerihalSK(selectedSK.semester, selectedSK.tahunAjaran)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full border-collapse border border-slate-900 text-[10px]">
                  <thead className="bg-white font-bold text-center">
                    <tr>
                      <th rowSpan={2} className="border border-slate-900 p-1 w-6">NO</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 text-left min-w-[140px]">NAMA GURU</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 w-24">NUPTK</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 w-10">GOL</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 text-left min-w-[110px]">MENGAJAR MATA PELAJARAN</th>
                      <th colSpan={4} className="border border-slate-900 p-1">KELAS DAN ALOKASI WAKTU</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 w-14">JUMLAH TUGAS TAMBAHAN</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 min-w-[110px]">TUGAS TAMBAHAN</th>
                      <th rowSpan={2} className="border border-slate-900 p-1 w-14">JUMLAH BEBAN KERJA</th>
                    </tr>
                    <tr>
                      <th className="border border-slate-900 p-1 w-8">VII.A</th>
                      <th className="border border-slate-900 p-1 w-8">VII.B</th>
                      <th className="border border-slate-900 p-1 w-8">VIII</th>
                      <th className="border border-slate-900 p-1 w-8">IX</th>
                    </tr>
                    <tr className="bg-white text-slate-800 text-[9px] font-normal italic">
                      <th className="border border-slate-900 py-0.5">1</th>
                      <th className="border border-slate-900 py-0.5">2</th>
                      <th className="border border-slate-900 py-0.5">4</th>
                      <th className="border border-slate-900 py-0.5">5</th>
                      <th className="border border-slate-900 py-0.5">6</th>
                      <th className="border border-slate-900 py-0.5">7</th>
                      <th className="border border-slate-900 py-0.5">8</th>
                      <th className="border border-slate-900 py-0.5">9</th>
                      <th className="border border-slate-900 py-0.5">-</th>
                      <th className="border border-slate-900 py-0.5">13</th>
                      <th className="border border-slate-900 py-0.5">14</th>
                      <th className="border border-slate-900 py-0.5">15</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSK.daftarGuru.map((g, idx) => (
                      <tr key={g.id}>
                        <td className="border border-slate-900 p-1 text-center font-semibold">{idx + 1}.</td>
                        <td className="border border-slate-900 p-1">
                          <div className="font-bold">{g.namaGuru}</div>
                          {g.nip && <div className="text-[8px] text-slate-600">NIP. {g.nip}</div>}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-mono text-[9px]">
                          {g.nuptk || '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center">{g.golongan || '-'}</td>
                        <td className="border border-slate-900 p-1 font-semibold">{g.mataPelajaran || '-'}</td>
                        <td className="border border-slate-900 p-1 text-center font-semibold">
                          {g.jpKelas?.viiA !== undefined && g.jpKelas.viiA > 0 ? g.jpKelas.viiA : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-semibold">
                          {g.jpKelas?.viiB !== undefined && g.jpKelas.viiB > 0 ? g.jpKelas.viiB : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-semibold">
                          {g.jpKelas?.viii !== undefined && g.jpKelas.viii > 0 ? g.jpKelas.viii : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-semibold">
                          {g.jpKelas?.ix !== undefined && g.jpKelas.ix > 0 ? g.jpKelas.ix : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-semibold">
                          {g.jumlahJpTugasTambahan !== undefined && g.jumlahJpTugasTambahan > 0
                            ? g.jumlahJpTugasTambahan
                            : g.totalJp - g.jumlahJp > 0
                            ? g.totalJp - g.jumlahJp
                            : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-[9.5px]">
                          {g.tugasTambahan && g.tugasTambahan !== '-' ? g.tugasTambahan : '-'}
                        </td>
                        <td className="border border-slate-900 p-1 text-center font-bold text-[10.5px]">{g.totalJp}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={5} className="border border-slate-900 p-1.5 text-center uppercase">
                        JUMLAH TOTAL
                      </td>
                      <td className="border border-slate-900 p-1.5 text-center">{totalJpMengajarViiA}</td>
                      <td className="border border-slate-900 p-1.5 text-center">{totalJpMengajarViiB}</td>
                      <td className="border border-slate-900 p-1.5 text-center">{totalJpMengajarViii}</td>
                      <td className="border border-slate-900 p-1.5 text-center">{totalJpMengajarIx}</td>
                      <td className="border border-slate-900 p-1.5 text-center">{totalJpTugasTambahan}</td>
                      <td className="border border-slate-900 p-1.5 text-center">-</td>
                      <td className="border border-slate-900 p-1.5 text-center font-bold text-[11px]">{totalBebanSeluruh}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Tanda Tangan Lampiran I */}
                <div className="flex justify-end pt-5 font-serif">
                  <div className="text-left w-64 text-[11px]">
                    <div className="font-bold">Kepala Sekolah,</div>
                    <div className="h-14"></div>
                    <div className="font-bold underline">{identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si'}</div>
                    <div className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Konfirmasi Hapus Guru dari Lampiran SK KBM */}
      {/* ========================================================================= */}
      {guruToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Hapus Guru dari SK KBM?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data beban mengajar untuk guru berikut dari Lampiran SK KBM?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 mb-5 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {guruToDelete.namaGuru}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                NIP. {guruToDelete.nip}
              </div>
              <div className="text-amber-800 font-medium text-[11px] pt-1 border-t border-slate-200/80">
                Mapel: <strong>{guruToDelete.mataPelajaran}</strong> ({guruToDelete.jumlahJp} JP)
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
                  handleDeleteGuru(guruToDelete.id);
                  setGuruToDelete(null);
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
    </div>
  );
};
