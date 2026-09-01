import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Printer,
  ShieldCheck,
  UserCheck,
  Folder,
  Cloud,
  Download,
  ExternalLink,
  RefreshCw,
  FileText,
  Sliders,
  Users,
  Check,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  SKTugasTambahan,
  IdentitasSekolah,
  PTK,
  SuratKeluar,
  SuratTugasDinas,
  PembuatSuratRecord,
  SKKBM,
} from '../types';
import {
  fetchSKFolderFiles,
  uploadSKTugasTertentuToDrive,
  GoogleDriveFile,
} from '../services/googleDrive';
import {
  formatTanggalIndonesia,
  generateDefaultPerihalSKTugasTertentu,
  generateSKTugasTertentuFullHtml,
  downloadSKTugasTertentuHtmlFile,
  printHtmlDirectly,
  SKPrintMode,
  SKTugasTertentuHeader,
  DEFAULT_MENIMBANG_SK_TUGAS_TERTENTU,
  DEFAULT_MENGINGAT_SK,
  DEFAULT_MEMPERHATIKAN_SK_LIST,
  LOGO_KABUPATEN_KONAWE_BASE64,
  LOGO_TUT_WURI_BASE64,
  sortSKTugasTambahanByHierarchy,
  autoGenerateSKTugasTambahanFromPTK,
  getJenjangJabatanRank,
} from '../utils/skTemplates';
import { getHighestNomorUrutFromLists, getRomanMonth } from '../utils/suratTemplates';

interface SKTugasTambahanModuleProps {
  skList: SKTugasTambahan[];
  suratKeluarList?: SuratKeluar[];
  suratTugasList?: SuratTugasDinas[];
  pembuatSuratList?: PembuatSuratRecord[];
  skKBMList?: SKKBM[];
  onAdd: (sk: SKTugasTambahan) => void;
  onUpdate: (sk: SKTugasTambahan) => void;
  onDelete: (id: string) => void;
  onReorder?: (newList: SKTugasTambahan[]) => void;
  identitasSekolah: IdentitasSekolah;
  guruPTKList?: PTK[];
  googleToken?: string | null;
  googleUser?: any;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
}

export const SKTugasTambahanModule: React.FC<SKTugasTambahanModuleProps> = ({
  skList,
  suratKeluarList = [],
  suratTugasList = [],
  pembuatSuratList = [],
  skKBMList = [],
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  identitasSekolah,
  guruPTKList = [],
  googleToken,
  googleUser: _googleUser,
  isGoogleConnected = false,
  onConnectGoogle,
}) => {
  // Active document context
  const [selectedTahun, setSelectedTahun] = useState<string>('2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  const getNextNomorUrut = (): number => {
    const highest = getHighestNomorUrutFromLists(
      skList,
      suratKeluarList,
      suratTugasList,
      pembuatSuratList,
      skKBMList
    );
    return highest > 0 ? highest + 1 : (skList.length + 1);
  };

  // Document metadata header
  const [skHeader, setSkHeader] = useState<SKTugasTertentuHeader>({
    noSK: '400.3.12.2/054/SMP-02/PRL/VII/2026',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    tentang: 'PEMBAGIAN TUGAS TERTENTU / TUGAS TAMBAHAN BAGI GURU DAN TENAGA KEPENDIDIKAN DALAM PROSES BELAJAR MENGAJAR DAN OPERASIONAL SEKOLAH SEMESTER 1 (GANJIL) T.P 2026/2027',
    tanggalSK: '2026-07-13',
    tempatPenetapan: 'Unggulino',
    menimbang: DEFAULT_MENIMBANG_SK_TUGAS_TERTENTU('2026/2027', 'Ganjil'),
    mengingat: DEFAULT_MENGINGAT_SK,
    memperhatikan: DEFAULT_MEMPERHATIKAN_SK_LIST('2026/2027', '2026-07-13'),
    templateNama: 'SK Tugas Tertentu T.P 2026-2027',
  });

  // Reactive effect to keep default letter number sequence up to date
  useEffect(() => {
    const nextUrut = getNextNomorUrut();
    const curMonthRoman = getRomanMonth(new Date().getMonth());
    const curYear = new Date().getFullYear();
    const dynamicNoSK = `400.3.12.2/${String(nextUrut).padStart(3, '0')}/SMP-02/PRL/${curMonthRoman}/${curYear}`;
    
    setSkHeader(prev => ({
      ...prev,
      noSK: dynamicNoSK
    }));
  }, [skList, suratKeluarList, suratTugasList, pembuatSuratList, skKBMList]);

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false);
  const [isDriveTemplateModalOpen, setIsDriveTemplateModalOpen] = useState(false);
  const [editingSK, setEditingSK] = useState<SKTugasTambahan | null>(null);
  const [skToDelete, setSkToDelete] = useState<SKTugasTambahan | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('Semua');

  // Print Mode State inside Print Modal
  const [printTab, setPrintTab] = useState<SKPrintMode>('all');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Google Drive template listing from TATA USAHA/SK
  const [driveTemplates, setDriveTemplates] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDriveTemplates, setIsLoadingDriveTemplates] = useState(false);

  useEffect(() => {
    if (googleToken) {
      loadDriveTemplates();
    }
  }, [googleToken]);

  const loadDriveTemplates = async () => {
    if (!googleToken) return;
    setIsLoadingDriveTemplates(true);
    try {
      const files = await fetchSKFolderFiles(googleToken);
      setDriveTemplates(files);
    } catch (e) {
      console.warn('Could not fetch drive templates for SK Tugas:', e);
    } finally {
      setIsLoadingDriveTemplates(false);
    }
  };

  // Filter items matching selected academic year
  const activeYearItems = skList.filter((item) => item.tahunAjaran === selectedTahun);
  const displayItems = activeYearItems.length > 0 ? activeYearItems : skList;

  // Move item up / down to allow custom order
  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = displayItems.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === displayItems.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newDisplay = [...displayItems];
    const temp = newDisplay[currentIndex];
    newDisplay[currentIndex] = newDisplay[targetIndex];
    newDisplay[targetIndex] = temp;

    // Preserving any items from other school years in skList
    const otherYearItems = skList.filter((item) => item.tahunAjaran !== selectedTahun);
    const newFullList = activeYearItems.length > 0 ? [...newDisplay, ...otherYearItems] : newDisplay;

    if (onReorder) {
      onReorder(newFullList);
    } else {
      newDisplay.forEach((item) => onUpdate(item));
    }
    showToast(`Urutan tugas "${temp.namaPetugas}" berhasil dipindahkan ke ${direction === 'up' ? 'atas' : 'bawah'}.`, 'success');
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<SKTugasTambahan>>({
    noSK: skHeader.noSK,
    tahunAjaran: selectedTahun,
    semester: selectedSemester,
    jenisTugas: 'Wakil Kepala Sekolah',
    namaPetugas: '',
    nip: '',
    nuptk: '',
    pangkatGol: '',
    jabatanDefinitif: 'Guru Madya / Pembina IV/a',
    jabatanPokok: 'Guru Mata Pelajaran',
    ekuivalensiJp: 12,
    sasaranTugas: '',
    keterangan: '',
    tanggalSK: skHeader.tanggalSK,
    tempatPenetapan: 'Unggulino',
    status: 'Aktif',
    templateNama: 'SK Tugas Tertentu T.P 2026-2027',
    drivePath: 'TATA USAHA/SK',
  });

  const handleOpenAdd = () => {
    setEditingSK(null);
    setFormData({
      noSK: skHeader.noSK,
      tahunAjaran: selectedTahun,
      semester: selectedSemester,
      jenisTugas: 'Wakil Kepala Sekolah',
      namaPetugas: '',
      nip: '',
      nuptk: '',
      pangkatGol: '',
      jabatanDefinitif: 'Guru Madya / Pembina IV/a',
      jabatanPokok: 'Guru Mata Pelajaran',
      ekuivalensiJp: 12,
      sasaranTugas: '',
      keterangan: '',
      tanggalSK: skHeader.tanggalSK,
      tempatPenetapan: 'Unggulino',
      status: 'Aktif',
      templateNama: 'SK Tugas Tertentu T.P 2026-2027',
      drivePath: 'TATA USAHA/SK',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: SKTugasTambahan) => {
    setEditingSK(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  // Quick select PTK
  const handleSelectPTK = (ptkId: string) => {
    const selected = guruPTKList.find((g) => g.id === ptkId);
    if (selected) {
      const nama = selected.namaLengkap
        ? `${selected.gelarDepan ? selected.gelarDepan + ' ' : ''}${selected.namaLengkap}${
            selected.gelarBelakang ? ', ' + selected.gelarBelakang : ''
          }`
        : (selected as any).nama || '';
      const gol = selected.pangkatGolongan || (selected as any).golongan || '';
      const jab = selected.jabatan || 'Guru Mata Pelajaran';

      let defaultTugas = 'Wakil Kepala Sekolah';
      let defaultEkuivalensi = 12;
      let defaultSasaran = '';
      let defaultKeterangan = '';

      const jabLower = jab.toLowerCase();
      if (jabLower.includes('kepala sekolah')) {
        defaultTugas = 'Kepala Sekolah / Penanggung Jawab Satuan Pendidikan';
        defaultEkuivalensi = 24;
        defaultSasaran = 'Manajerial, Supervisi Akademik & PTK, Kewirausahaan Sekolah';
        defaultKeterangan =
          'Penanggung Jawab Utama Pelaksanaan KBM, Mutu Pendidikan, Administrasi Satuan Pendidikan & Pertanggungjawaban BOSP';
      } else if (jabLower.includes('kepala tata usaha') || jabLower.includes('tata usaha')) {
        defaultTugas = 'Koordinator Urusan Tata Usaha';
        defaultEkuivalensi = 12;
        defaultSasaran = 'Kantor Tata Usaha & Kearsipan Kedinasan';
        defaultKeterangan =
          'Koordinator Tata Persuratan, Arsip Digital SIPEDAS, Administrasi Kepegawaian & Kenaikan Pangkat';
      } else if (jabLower.includes('perpustakaan')) {
        defaultTugas = 'Kepala Perpustakaan';
        defaultEkuivalensi = 12;
        defaultSasaran = 'Unit Perpustakaan Sekolah';
        defaultKeterangan = 'Pengembangan Koleksi Buku Pelajaran & Gerakan Literasi Sekolah';
      } else if (jabLower.includes('laboratorium') || jabLower.includes('komputer')) {
        defaultTugas = 'Kepala Laboratorium IPA/Komputer';
        defaultEkuivalensi = 12;
        defaultSasaran = 'Laboratorium Komputer CBT & Laboratorium IPA';
        defaultKeterangan = 'Pemeliharaan Server, Komputer CBT & Alat Praktikum IPA';
      } else if (jabLower.includes('wali')) {
        defaultTugas = 'Wali Kelas';
        defaultEkuivalensi = 2;
      }

      setFormData((prev) => ({
        ...prev,
        namaPetugas: nama,
        nip: selected.nip || '-',
        nuptk: selected.nuptk || '',
        pangkatGol: gol,
        jabatanDefinitif: `${jab} / ${gol}`.trim(),
        jabatanPokok: jab,
        jenisTugas: defaultTugas,
        ekuivalensiJp: defaultEkuivalensi,
        sasaranTugas: defaultSasaran || prev.sasaranTugas,
        keterangan: defaultKeterangan || prev.keterangan,
      }));
    }
  };

  // Otomatis sinkronisasi & tambahkan data dari Guru & PTK yang memiliki tugas Fungsional/Struktural
  const handleAutoSyncFromPTK = () => {
    const syncedList = autoGenerateSKTugasTambahanFromPTK(
      guruPTKList,
      identitasSekolah,
      skList,
      selectedTahun,
      selectedSemester
    );

    syncedList.forEach((item) => {
      const existing = skList.find((s) => s.id === item.id);
      if (existing) {
        onUpdate(item);
      } else {
        onAdd(item);
      }
    });

    showToast(
      `Berhasil menambahkan & menyinkronkan ${syncedList.length} tugas fungsional & struktural dari Data Guru dan PTK! Diurutkan mulai dari Kepala Sekolah.`,
      'success'
    );
  };

  // Re-sort hierarchy manual trigger
  const handleSortHierarchy = () => {
    const sorted = sortSKTugasTambahanByHierarchy(skList);
    if (onReorder) {
      onReorder(sorted);
    } else {
      sorted.forEach((item) => {
        onUpdate(item);
      });
    }
    showToast(
      'Daftar tugas tertentu berhasil diurutkan berdasarkan jenjang jabatan (Kepala Sekolah -> Wakasek -> Ka. TU -> Ka. Perpus/Lab -> Bendahara -> Operator -> Wali Kelas -> Pembina).',
      'info'
    );
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPetugas || !formData.jenisTugas) {
      alert('Mohon isi nama personil dan jenis tugas!');
      return;
    }

    if (editingSK) {
      onUpdate({ ...editingSK, ...formData } as SKTugasTambahan);
      showToast(`Penetapan tugas "${formData.namaPetugas}" berhasil diperbarui.`);
    } else {
      const newSK: SKTugasTambahan = {
        id: `SKTT-${Date.now()}`,
        noSK: formData.noSK || skHeader.noSK,
        tahunAjaran: formData.tahunAjaran || selectedTahun,
        semester: formData.semester || selectedSemester,
        jenisTugas: formData.jenisTugas as any,
        namaPetugas: formData.namaPetugas || '',
        nip: formData.nip || '-',
        nuptk: formData.nuptk || '',
        pangkatGol: formData.pangkatGol || '',
        jabatanDefinitif: formData.jabatanDefinitif || 'Guru',
        jabatanPokok: formData.jabatanPokok || 'Guru Mata Pelajaran',
        ekuivalensiJp: Number(formData.ekuivalensiJp) || 0,
        sasaranTugas: formData.sasaranTugas || '',
        keterangan: formData.keterangan || '-',
        tanggalSK: formData.tanggalSK || skHeader.tanggalSK,
        tempatPenetapan: formData.tempatPenetapan || 'Unggulino',
        status: formData.status || 'Aktif',
        templateNama: 'SK Tugas Tertentu T.P 2026-2027',
        drivePath: 'TATA USAHA/SK',
        statusDrive: 'Tersimpan',
      };
      onAdd(newSK);
      showToast(`Penetapan tugas "${newSK.namaPetugas}" berhasil ditambahkan.`);
    }
    setIsAddModalOpen(false);
  };

  // Print Handler
  const handlePrint = (mode: SKPrintMode = 'all') => {
    setIsPrinting(true);
    try {
      const html = generateSKTugasTertentuFullHtml(displayItems, skHeader, identitasSekolah, mode);
      printHtmlDirectly(html);
      showToast('Jendela dialog cetak PDF telah dibuka.', 'success');
    } catch (e: any) {
      showToast(`Gagal mencetak: ${e?.message || 'Terjadi kesalahan'}`, 'error');
    } finally {
      setTimeout(() => setIsPrinting(false), 600);
    }
  };

  // Download HTML file
  const handleDownloadHtml = (mode: SKPrintMode = 'all') => {
    try {
      downloadSKTugasTertentuHtmlFile(displayItems, skHeader, identitasSekolah, mode);
      showToast('Berkas HTML Dokumen Resmi berhasil diunduh.', 'success');
    } catch (e: any) {
      showToast(`Gagal mengunduh: ${e?.message || 'Terjadi kesalahan'}`, 'error');
    }
  };

  // Upload Document to Google Drive (TATA USAHA/SK)
  const handleSaveToDrive = async () => {
    if (!googleToken) {
      if (onConnectGoogle) {
        onConnectGoogle();
      } else {
        showToast('Silakan hubungkan akun Google Drive terlebih dahulu.', 'error');
      }
      return;
    }

    setIsSavingToDrive(true);
    try {
      const htmlContent = generateSKTugasTertentuFullHtml(displayItems, skHeader, identitasSekolah, 'all');
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const fileName = `SK Tugas Tertentu T.P ${skHeader.tahunAjaran.replace('/', '-')}.html`;

      const result = await uploadSKTugasTertentuToDrive(googleToken, blob, fileName, 'text/html');
      showToast(`Berhasil tersimpan ke Google Drive folder TATA USAHA/SK (${result.name})`, 'success');
      loadDriveTemplates();
    } catch (e: any) {
      showToast(`Gagal menyimpan ke Google Drive: ${e?.message || 'Periksa koneksi Anda'}`, 'error');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Filtered list
  const filtered = displayItems.filter((s) => {
    const matchSearch =
      s.namaPetugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.jenisTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.sasaranTugas && s.sasaranTugas.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.nip.includes(searchTerm);
    const matchKategori = kategoriFilter === 'Semua' || s.jenisTugas.includes(kategoriFilter);
    return matchSearch && matchKategori;
  });

  // Helper badge jenjang jabatan
  const getHierarchyBadge = (item: SKTugasTambahan) => {
    const rank = getJenjangJabatanRank(item);
    if (rank === 1) {
      return (
        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
          <Award className="w-3 h-3 text-amber-600" /> 1. Kepala Sekolah
        </span>
      );
    }
    if (rank >= 2 && rank <= 5) {
      return (
        <span className="bg-blue-100 text-blue-900 border border-blue-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-blue-600" /> Wakasek
        </span>
      );
    }
    if (rank === 6) {
      return (
        <span className="bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <Folder className="w-3 h-3 text-purple-600" /> Ka. TU
        </span>
      );
    }
    if (rank >= 7 && rank <= 10) {
      return (
        <span className="bg-teal-100 text-teal-900 border border-teal-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-teal-600" /> Unit / Lab
        </span>
      );
    }
    if (rank >= 11 && rank <= 12) {
      return (
        <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> BOSP / IT
        </span>
      );
    }
    if (rank >= 15 && rank <= 21) {
      return (
        <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <Users className="w-3 h-3 text-indigo-600" /> Wali Kelas
        </span>
      );
    }
    if (rank >= 22 && rank <= 27) {
      return (
        <span className="bg-rose-100 text-rose-900 border border-rose-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-600" /> Pembina Ekskul
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px] px-2 py-0.5 rounded-full">
        Tugas Tertentu
      </span>
    );
  };

  // Calculate statistics
  const totalPersonil = displayItems.length;
  const totalJP = displayItems.reduce((acc, item) => acc + (item.ekuivalensiJp || 0), 0);
  const totalWakasek = displayItems.filter(
    (i) => i.jenisTugas.toLowerCase().includes('wakil kepala sekolah') || i.jenisTugas.toLowerCase().includes('wakasek')
  ).length;
  const totalWaliKelas = displayItems.filter((i) => i.jenisTugas.toLowerCase().includes('wali kelas')).length;
  const totalKepalaLabPerpus = displayItems.filter(
    (i) =>
      i.jenisTugas.toLowerCase().includes('kepala') ||
      i.jenisTugas.toLowerCase().includes('laboratorium') ||
      i.jenisTugas.toLowerCase().includes('perpustakaan')
  ).length;
  const totalPembina = displayItems.filter((i) => i.jenisTugas.toLowerCase().includes('pembina')).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Drive Format Reference */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold tracking-wider uppercase">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Naskah Dinas &amp; Keputusan Kedinasan</span>
              <span className="bg-amber-500/30 text-amber-200 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30">
                Format Google Drive Master
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              SK TUGAS TERTENTU / TUGAS TAMBAHAN T.P {skHeader.tahunAjaran}
            </h1>
            <p className="text-xs text-amber-100/90 max-w-2xl leading-relaxed">
              Format baku terintegrasi Google Drive folder <strong className="text-white underline">TATA USAHA/SK</strong> dengan nama berkas master <strong className="text-amber-300">"SK Tugas Tertentu T.P 2026-2027"</strong>. Diurutkan secara hierarkis mulai dari Kepala Sekolah, Wakasek, Ka. TU, hingga Pembina.
            </p>
          </div>

          {/* Quick Year Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoSyncFromPTK}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg transition flex items-center gap-1.5"
              title="Otomatis tambahkan dari data Guru dan PTK fungsional/struktural dan urutkan mulai dari Kepala Sekolah"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Sinkron dari PTK</span>
            </button>

            <button
              onClick={handleSortHierarchy}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition flex items-center gap-1.5"
              title="Urutkan seluruh data sesuai jenjang jabatan (Kepala Sekolah -> Wakasek -> Ka TU, dst.)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-300" />
              <span>Urutkan Hierarki</span>
            </button>

            <button
              onClick={() => setIsEditHeaderModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition flex items-center gap-1.5"
              title="Konfigurasi Naskah SK"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
              <span>Parameter SK</span>
            </button>

            <button
              onClick={() => setIsDriveTemplateModalOpen(true)}
              className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-400/40 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drive TATA USAHA/SK</span>
            </button>

            <button
              onClick={() => handleSaveToDrive()}
              disabled={isSavingToDrive}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSavingToDrive ? 'animate-spin' : ''}`} />
              <span>{isSavingToDrive ? 'Menyimpan...' : 'Simpan ke Drive'}</span>
            </button>

            <button
              onClick={() => {
                setPrintTab('all');
                setIsPrintModalOpen(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg hover:shadow-amber-500/30 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Pratinjau SK</span>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-200/80">
          <div className="flex items-center gap-3">
            <span>
              No. SK: <strong className="text-white font-mono">{skHeader.noSK}</strong>
            </span>
            <span>•</span>
            <span>
              Tanggal: <strong className="text-white">{formatTanggalIndonesia(skHeader.tanggalSK)}</strong>
            </span>
            <span>•</span>
            <span>
              Penetapan: <strong className="text-white">{skHeader.tempatPenetapan || 'Unggulino'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Format Master Google Drive: "SK Tugas Tertentu T.P 2026-2027" (Terurut dari Kepala Sekolah)
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Total Personil</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {totalPersonil} <span className="text-xs font-normal text-slate-500">PTK</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">100% Ditugaskan</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Beban Ekuivalensi</div>
          <div className="text-xl font-black text-amber-700 mt-0.5">
            {totalJP} <span className="text-xs font-normal text-slate-500">JP</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Jam Perminggu</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Wakil Kepala Sekolah</div>
          <div className="text-xl font-black text-blue-700 mt-0.5">
            {totalWakasek} <span className="text-xs font-normal text-slate-500">Orang</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Kurikulum, Kesiswaan, Humas</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Wali Kelas</div>
          <div className="text-xl font-black text-indigo-700 mt-0.5">
            {totalWaliKelas} <span className="text-xs font-normal text-slate-500">Kelas</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">VII.A, VII.B, VIII, IX</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Kepala Lab &amp; Perpus</div>
          <div className="text-xl font-black text-teal-700 mt-0.5">
            {totalKepalaLabPerpus} <span className="text-xs font-normal text-slate-500">Unit</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">IPA, Komputer, Musholla</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Pembina &amp; Pengelola</div>
          <div className="text-xl font-black text-rose-700 mt-0.5">
            {totalPembina} <span className="text-xs font-normal text-slate-500">Bidang</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">OSIS, Pramuka, PMR, Seni</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama guru, NIP, atau jenis tugas tertentu..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tahun Pelajaran Selector */}
          <select
            value={selectedTahun}
            onChange={(e) => {
              setSelectedTahun(e.target.value);
              setSkHeader((prev) => ({
                ...prev,
                tahunAjaran: e.target.value,
                tentang: generateDefaultPerihalSKTugasTertentu(prev.semester, e.target.value),
              }));
            }}
            className="text-xs bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="2026/2027">T.P 2026/2027 (Aktif)</option>
            <option value="2025/2026">T.P 2025/2026</option>
          </select>

          {/* Kategori Filter */}
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Semua">Semua Tugas Tertentu</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
            <option value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</option>
            <option value="Wali Kelas">Wali Kelas</option>
            <option value="Kepala Perpustakaan">Kepala Perpustakaan</option>
            <option value="Kepala Laboratorium">Kepala Laboratorium</option>
            <option value="Pembina">Pembina OSIS / Ekskul</option>
            <option value="Operator">Operator IT / Dapodik</option>
            <option value="Tata Usaha">Tata Usaha &amp; Keuangan</option>
          </select>

          <button
            onClick={handleAutoSyncFromPTK}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center gap-1.5"
            title="Sinkron & Tambah Otomatis dari PTK"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Auto PTK</span>
          </button>

          <button
            onClick={handleSortHierarchy}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold py-2 px-3 rounded-lg shadow-xs transition flex items-center gap-1.5"
            title="Urutkan kembali berdasarkan struktur hierarki jabatan"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Urutkan Hierarki</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penetapan</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">No</th>
                <th className="py-3 px-3.5">Jenjang / Kategori</th>
                <th className="py-3 px-3.5">Nama Guru / Personil &amp; NIP</th>
                <th className="py-3 px-3.5">Jabatan Pokok</th>
                <th className="py-3 px-3.5">Tugas Tertentu / Tambahan</th>
                <th className="py-3 px-3.5 text-center">Ekuivalensi</th>
                <th className="py-3 px-3.5">Sasaran &amp; Uraian Tugas</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-28">Urutan / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data tugas tertentu yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition ${
                      getJenjangJabatanRank(item) === 1 ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3.5 whitespace-nowrap">{getHierarchyBadge(item)}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {item.namaPetugas}
                        {getJenjangJabatanRank(item) === 1 && (
                          <Award className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">NIP. {item.nip || '-'}</div>
                      <div className="text-[10px] text-slate-400">{item.pangkatGol || item.jabatanDefinitif}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700">
                      <div>{item.jabatanPokok || item.jabatanDefinitif || 'Guru Mata Pelajaran'}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80 inline-block">
                        {item.jenisTugas}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {item.ekuivalensiJp ? (
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {item.ekuivalensiJp} JP
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 max-w-sm">
                      {item.sasaranTugas && (
                        <div className="font-semibold text-slate-900 text-[11px] mb-0.5">
                          {item.sasaranTugas}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-600 line-clamp-2">{item.keterangan || '-'}</div>
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(item.id, 'up')}
                            disabled={idx === 0 || !!searchTerm || kategoriFilter !== 'Semua'}
                            className={`p-1 rounded transition ${
                              idx === 0 || !!searchTerm || kategoriFilter !== 'Semua'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-700 hover:text-amber-700 hover:bg-amber-100'
                            }`}
                            title={searchTerm || kategoriFilter !== 'Semua' ? 'Reset filter untuk mengubah urutan' : 'Pindah Ke Atas (Naikkan Urutan)'}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(item.id, 'down')}
                            disabled={idx === filtered.length - 1 || !!searchTerm || kategoriFilter !== 'Semua'}
                            className={`p-1 rounded transition ${
                              idx === filtered.length - 1 || !!searchTerm || kategoriFilter !== 'Semua'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-700 hover:text-amber-700 hover:bg-amber-100'
                            }`}
                            title={searchTerm || kategoriFilter !== 'Semua' ? 'Reset filter untuk mengubah urutan' : 'Pindah Ke Bawah (Turunkan Urutan)'}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-slate-600 hover:text-amber-600 p-1.5 rounded hover:bg-slate-100 transition"
                          title="Edit Penetapan Tugas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSkToDelete(item)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition"
                          title="Hapus Penetapan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Cetak & Pratinjau SK Kedinasan Resmi (Full-View) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-scale-up">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-400/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>Pratinjau Dokumen Resmi SK Tugas Tertentu</span>
                    <span className="bg-amber-400 text-stone-900 text-[10px] px-2 py-0.5 rounded font-black uppercase">
                      T.P {skHeader.tahunAjaran}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Sesuai master dokumen Google Drive "SK Tugas Tertentu T.P 2026-2027" (Terurut mulai dari Kepala Sekolah)
                  </p>
                </div>
              </div>

              {/* Action Buttons inside Preview */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadHtml(printTab)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 transition flex items-center gap-1.5"
                  title="Unduh Berkas HTML Resmi"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh HTML</span>
                </button>

                <button
                  onClick={() => handleSaveToDrive()}
                  disabled={isSavingToDrive}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Simpan Drive</span>
                </button>

                <button
                  onClick={() => handlePrint(printTab)}
                  disabled={isPrinting}
                  className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs px-4 py-1.5 rounded-lg shadow transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isPrinting ? 'Membuka Dialog...' : 'Cetak Dokumen'}</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode Tab Bar */}
            <div className="bg-slate-800 text-slate-300 px-6 py-2 border-b border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-400">Pilihan Format Cetak:</span>
                <button
                  onClick={() => setPrintTab('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    printTab === 'all'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Lengkap (Halaman 1 SK + Halaman 2 Lampiran)
                </button>
                <button
                  onClick={() => setPrintTab('sk_only')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    printTab === 'sk_only'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Halaman 1: SK Saja (Portrait)
                </button>
                <button
                  onClick={() => setPrintTab('lampiran_only')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    printTab === 'lampiran_only'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Halaman 2: Lampiran I Pembagian Tugas (Landscape)
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Total: <strong className="text-white">{displayItems.length} Personil PTK</strong> (Terurut dari Kepala Sekolah)
              </div>
            </div>

            {/* Live Document Preview Iframe */}
            <div className="flex-1 bg-slate-200 overflow-hidden relative p-2">
              <iframe
                title="SK Preview Frame"
                className="w-full h-full rounded-xl bg-white border border-slate-300 shadow-inner"
                srcDoc={generateSKTugasTertentuFullHtml(displayItems, skHeader, identitasSekolah, printTab)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Penetapan Tugas */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>{editingSK ? 'Edit Penetapan Tugas Tertentu' : 'Tambah Penetapan Tugas Tertentu'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Quick Select dari Guru PTK */}
              {guruPTKList.length > 0 && !editingSK && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <label className="block text-amber-900 font-bold mb-1">
                    ⚡ Pilih Cepat dari Data Guru / PTK SMPN 2 Puriala:
                  </label>
                  <select
                    onChange={(e) => handleSelectPTK(e.target.value)}
                    defaultValue=""
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Pilih Personil Guru / Staf TU --
                    </option>
                    {guruPTKList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.namaLengkap ? `${g.gelarDepan ? g.gelarDepan + ' ' : ''}${g.namaLengkap}${g.gelarBelakang ? ', ' + g.gelarBelakang : ''}` : (g as any).nama} - {g.jabatan} ({g.pangkatGolongan || (g as any).golongan || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Guru / Pegawai</label>
                  <input
                    type="text"
                    required
                    value={formData.namaPetugas || ''}
                    onChange={(e) => setFormData({ ...formData, namaPetugas: e.target.value })}
                    placeholder="Contoh: Hasnawati, S.Pd., M.Si."
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIP / NIPPPK</label>
                  <input
                    type="text"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="19750512 200212 2 003"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={formData.pangkatGol || ''}
                    onChange={(e) => setFormData({ ...formData, pangkatGol: e.target.value })}
                    placeholder="Pembina, IV/a / Ahli Pertama, IX"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jabatan Pokok</label>
                  <input
                    type="text"
                    value={formData.jabatanPokok || ''}
                    onChange={(e) => setFormData({ ...formData, jabatanPokok: e.target.value })}
                    placeholder="Guru Mata Pelajaran IPA"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Jenis Tugas Tertentu / Tambahan</label>
                  <select
                    value={formData.jenisTugas || 'Wakil Kepala Sekolah'}
                    onChange={(e) => setFormData({ ...formData, jenisTugas: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Kepala Sekolah / Penanggung Jawab Satuan Pendidikan">
                      Kepala Sekolah / Penanggung Jawab
                    </option>
                    <option value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</option>
                    <option value="Koordinator Urusan Tata Usaha">Koordinator Urusan Tata Usaha</option>
                    <option value="Kepala Perpustakaan">Kepala Perpustakaan</option>
                    <option value="Kepala Laboratorium IPA/Komputer">Kepala Laboratorium IPA/Komputer</option>
                    <option value="Kepala Laboratorium Keagamaan">Kepala Laboratorium Keagamaan (Musholla)</option>
                    <option value="Bendahara BOS">Bendahara BOSP</option>
                    <option value="Operator Dapodik / IT">Operator Dapodik / IT &amp; Proktor ANBK</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Pembina OSIS">Pembina OSIS</option>
                    <option value="Pembina Pramuka">Pembina Pramuka</option>
                    <option value="Pembina PMR / UKS">Pembina PMR / UKS</option>
                    <option value="Pembina Seni">Pembina Seni &amp; FLS2N</option>
                    <option value="Guru Piket">Guru Piket</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ekuivalensi (JP)</label>
                  <input
                    type="number"
                    value={formData.ekuivalensiJp ?? ''}
                    onChange={(e) => setFormData({ ...formData, ekuivalensiJp: Number(e.target.value) })}
                    placeholder="12"
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-emerald-800 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sasaran Penugasan (Bidang / Kelas)</label>
                <input
                  type="text"
                  value={formData.sasaranTugas || ''}
                  onChange={(e) => setFormData({ ...formData, sasaranTugas: e.target.value })}
                  placeholder="Contoh: Kelas VII.A (32 Siswa) / Bidang Kurikulum & Akademik"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Rincian Uraian Tugas &amp; Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Rincian wewenang, tanggung jawab, dan sasaran kerja..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md transition"
                >
                  Simpan Penetapan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfigurasi Naskah SK */}
      {isEditHeaderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Konfigurasi Naskah Dinas SK Tugas Tertentu</span>
              </h3>
              <button onClick={() => setIsEditHeaderModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor SK Resmi</label>
                  <input
                    type="text"
                    value={skHeader.noSK || ''}
                    onChange={(e) => setSkHeader({ ...skHeader, noSK: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Penetapan SK</label>
                  <input
                    type="date"
                    value={skHeader.tanggalSK || ''}
                    onChange={(e) => setSkHeader({ ...skHeader, tanggalSK: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Perihal / Tentang SK</label>
                <textarea
                  rows={2}
                  value={skHeader.tentang || ''}
                  onChange={(e) => setSkHeader({ ...skHeader, tentang: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={skHeader.tahunAjaran || ''}
                    onChange={(e) => setSkHeader({ ...skHeader, tahunAjaran: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempat Penetapan</label>
                  <input
                    type="text"
                    value={skHeader.tempatPenetapan || ''}
                    onChange={(e) => setSkHeader({ ...skHeader, tempatPenetapan: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEditHeaderModalOpen(false)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md transition"
                >
                  Selesai &amp; Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Berkas Google Drive TATA USAHA/SK */}
      {isDriveTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600" />
                <span>Google Drive: Folder "TATA USAHA/SK"</span>
              </h3>
              <button onClick={() => setIsDriveTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-emerald-950">
                  <div className="font-bold">Template Master Terstandarisasi</div>
                  <div>
                    Dokumen SK &amp; Lampiran I terformat otomatis sesuai berkas Google Drive master:
                    <strong className="block text-emerald-900 mt-0.5">"SK Tugas Tertentu T.P 2026-2027"</strong>
                  </div>
                </div>
              </div>

              {isLoadingDriveTemplates ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span>Memuat berkas dari Google Drive...</span>
                </div>
              ) : driveTemplates.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {driveTemplates.map((file) => (
                    <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{file.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {file.id.substring(0, 14)}...</div>
                        </div>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold px-2.5 py-1 rounded text-[11px] hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  {isGoogleConnected ? (
                    <div>
                      <p>Folder TATA USAHA/SK aktif di Google Drive.</p>
                      <button
                        onClick={loadDriveTemplates}
                        className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                      >
                        Muat Ulang Berkas Drive
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2">Google Drive belum terhubung.</p>
                      <button
                        onClick={() => {
                          setIsDriveTemplateModalOpen(false);
                          if (onConnectGoogle) onConnectGoogle();
                        }}
                        className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-500"
                      >
                        Hubungkan Google Drive
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDriveTemplateModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Penetapan */}
      {skToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Hapus Penetapan Tugas?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus penetapan tugas untuk{' '}
              <strong className="text-slate-800">{skToDelete.namaPetugas}</strong> ({skToDelete.jenisTugas})?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSkToDelete(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDelete(skToDelete.id);
                  setSkToDelete(null);
                  showToast('Penetapan tugas berhasil dihapus.', 'info');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
