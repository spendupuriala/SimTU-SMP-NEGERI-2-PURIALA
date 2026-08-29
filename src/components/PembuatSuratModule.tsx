import React, { useState, useMemo, useRef } from 'react';
import {
  FilePlus2,
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  Building2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  FileCode,
  HardDrive,
  Copy,
  Check,
  Tag,
  BookOpen,
} from 'lucide-react';
import {
  IdentitasSekolah,
  PembuatSuratRecord,
  Siswa,
  GuruPTK,
  TargetSubjekSurat,
  PenandatanganTipe,
  KodeKlasifikasiSurat,
  SuratKeluar,
  SuratTugasDinas,
} from '../types';
import { DEFAULT_KODE_KLASIFIKASI } from '../services/googleSheets';
import {
  DAFTAR_TEMPLATE_SURAT,
  JenisSuratTemplateOption,
  generateAutoNomorSurat,
  getHighestNomorUrutFromLists,
  renderSuratDocumentHTML,
  downloadSuratAsWordDoc,
  downloadSuratAsHTML,
  printSuratDocument,
} from '../utils/suratTemplates';
import { uploadPembuatSuratDocumentToDrive } from '../services/googleDrive';

interface PembuatSuratModuleProps {
  suratList?: PembuatSuratRecord[];
  suratKeluarList?: SuratKeluar[];
  suratTugasList?: SuratTugasDinas[];
  onAdd: (surat: PembuatSuratRecord) => void;
  onUpdate: (surat: PembuatSuratRecord) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
  siswaList: Siswa[];
  guruPTKList: GuruPTK[];
  googleToken?: string | null;
  googleUser?: any;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  kodeKlasifikasiList?: KodeKlasifikasiSurat[];
}

export const PembuatSuratModule: React.FC<PembuatSuratModuleProps> = ({
  suratList = [],
  suratKeluarList = [],
  suratTugasList = [],
  onAdd,
  onUpdate,
  onDelete,
  identitasSekolah,
  siswaList,
  guruPTKList,
  googleToken,
  googleUser,
  isGoogleConnected = false,
  onConnectGoogle,
  kodeKlasifikasiList = DEFAULT_KODE_KLASIFIKASI,
}) => {
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTarget, setFilterTarget] = useState<'semua' | 'siswa' | 'guru'>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'Terbit' | 'Draft'>('semua');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedSuratForPreview, setSelectedSuratForPreview] = useState<PembuatSuratRecord | null>(null);
  const [editingSuratId, setEditingSuratId] = useState<string | null>(null);
  const [suratToDelete, setSuratToDelete] = useState<PembuatSuratRecord | null>(null);

  // Form Step State (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields State
  const [formTarget, setFormTarget] = useState<TargetSubjekSurat>('siswa');
  const [formJenisId, setFormJenisId] = useState<string>('keterangan_aktif_siswa');
  const [formSearchQuery, setFormSearchQuery] = useState<string>('');
  const [formSelectedSubjek, setFormSelectedSubjek] = useState<{
    idRef?: string;
    nama: string;
    nisn?: string;
    nis?: string;
    nip?: string;
    nuptk?: string;
    pangkatGol?: string;
    jabatan?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: string;
    kelas?: string;
    namaOrtu?: string;
    pekerjaanOrtu?: string;
    alamat?: string;
    unitKerja?: string;
  }>({
    nama: '',
    alamat: 'Kecamatan Puriala, Kab. Konawe',
  });

  // Metadata & Detail Form Fields
  const [formKodeKlasifikasi, setFormKodeKlasifikasi] = useState<string>('421.3');
  const [formNoSurat, setFormNoSurat] = useState<string>('');
  const [formTanggalSurat, setFormTanggalSurat] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTempatTerbit, setFormTempatTerbit] = useState<string>('Unggulino');
  const [formPerihal, setFormPerihal] = useState<string>('Surat Keterangan Siswa Aktif Sekolah');
  const [formKeperluan, setFormKeperluan] = useState<string>('');
  const [formCatatanKhusus, setFormCatatanKhusus] = useState<string>('');

  // Dynamic Detail fields
  const [formSekolahTujuan, setFormSekolahTujuan] = useState<string>('');
  const [formAlasanPindah, setFormAlasanPindah] = useState<string>('');
  const [formNamaDokumenHilang, setFormNamaDokumenHilang] = useState<string>('Ijazah / SKL Asli');
  const [formNomorDokumenAsli, setFormNomorDokumenAsli] = useState<string>('');
  const [formTglMulaiCuti, setFormTglMulaiCuti] = useState<string>('');
  const [formTglSelesaiCuti, setFormTglSelesaiCuti] = useState<string>('');
  const [formAlasanCuti, setFormAlasanCuti] = useState<string>('');
  const [formInstansiTujuan, setFormInstansiTujuan] = useState<string>('');
  const [formProgramStudi, setFormProgramStudi] = useState<string>('');
  const [formGajiPokok, setFormGajiPokok] = useState<string>('3.500.000');
  const [formPenghasilanTotal, setFormPenghasilanTotal] = useState<string>('4.850.000');

  // Penandatangan Form Fields
  const [formPenandatanganTipe, setFormPenandatanganTipe] = useState<PenandatanganTipe>('kepala_sekolah');
  const [formPenandatanganNama, setFormPenandatanganNama] = useState<string>(identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si');
  const [formPenandatanganNip, setFormPenandatanganNip] = useState<string>(identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012');
  const [formPenandatanganPangkat, setFormPenandatanganPangkat] = useState<string>(identitasSekolah.pangkatKepsek || 'Pembina Tk. I, IV/b');

  // Async upload loading state
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Template lookup
  const selectedTemplate = useMemo(() => {
    return DAFTAR_TEMPLATE_SURAT.find((t) => t.id === formJenisId) || DAFTAR_TEMPLATE_SURAT[0];
  }, [formJenisId]);

  // Autocomplete filtered list
  const filteredSubjekList = useMemo(() => {
    const q = formSearchQuery.toLowerCase().trim();
    if (!q) {
      if (formTarget === 'siswa') return siswaList.slice(0, 8);
      return guruPTKList.slice(0, 8);
    }

    if (formTarget === 'siswa') {
      return siswaList.filter(
        (s) =>
          (s.namaLengkap || '').toLowerCase().includes(q) ||
          (s.nisn || '').includes(q) ||
          (s.nis || '').includes(q) ||
          (s.kelas || '').toLowerCase().includes(q)
      );
    } else {
      return guruPTKList.filter(
        (g) =>
          (g.namaLengkap || '').toLowerCase().includes(q) ||
          (g.nip || '').includes(q) ||
          (g.nuptk || '').includes(q) ||
          (g.mapelUtama || '').toLowerCase().includes(q) ||
          (g.jabatan || '').toLowerCase().includes(q)
      );
    }
  }, [formTarget, formSearchQuery, siswaList, guruPTKList]);

  // Filtered surat list for table
  const filteredSuratList = useMemo(() => {
    return suratList.filter((s) => {
      const matchSearch =
        searchTerm === '' ||
        s.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjekData.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.jenisSuratNama.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTarget = filterTarget === 'semua' || s.targetSubjek === filterTarget;
      const matchStatus = filterStatus === 'semua' || s.status === filterStatus;

      return matchSearch && matchTarget && matchStatus;
    });
  }, [suratList, searchTerm, filterTarget, filterStatus]);

  // Summary counts
  const stats = useMemo(() => {
    const total = suratList.length;
    const siswa = suratList.filter((s) => s.targetSubjek === 'siswa').length;
    const guru = suratList.filter((s) => s.targetSubjek === 'guru').length;
    const terbit = suratList.filter((s) => s.status === 'Terbit').length;
    const draft = suratList.filter((s) => s.status === 'Draft').length;
    return { total, siswa, guru, terbit, draft };
  }, [suratList]);

  // Helper to compute next sequential number across all modules and agendas
  const getNextNomorUrut = (): number => {
    const highest = getHighestNomorUrutFromLists(suratList, suratKeluarList, suratTugasList);
    return highest > 0 ? highest + 1 : (suratList.length + 1);
  };

  // Reset & Open Form for New Surat
  const handleOpenNewForm = (presetTarget?: TargetSubjekSurat) => {
    const target = presetTarget || 'siswa';
    const firstTemplate = DAFTAR_TEMPLATE_SURAT.find((t) => t.target === target) || DAFTAR_TEMPLATE_SURAT[0];
    const initialKode = firstTemplate.kodeKlasifikasi || '421.3';
    const nextIdx = getNextNomorUrut();
    const autoNo = generateAutoNomorSurat(initialKode, nextIdx);

    setEditingSuratId(null);
    setCurrentStep(1);
    setFormTarget(target);
    setFormJenisId(firstTemplate.id);
    setFormKodeKlasifikasi(initialKode);
    setFormSearchQuery('');
    setFormSelectedSubjek({
      nama: '',
      alamat: 'Kecamatan Puriala, Kab. Konawe',
    });
    setFormNoSurat(autoNo);
    setFormTanggalSurat(new Date().toISOString().split('T')[0]);
    setFormTempatTerbit('Unggulino');
    setFormPerihal(firstTemplate.defaultPerihal);
    setFormKeperluan(firstTemplate.defaultKeperluan);
    setFormCatatanKhusus('');
    setFormSekolahTujuan('');
    setFormAlasanPindah('');
    setFormNamaDokumenHilang('Ijazah / SKL Asli');
    setFormNomorDokumenAsli('');
    setFormTglMulaiCuti('');
    setFormTglSelesaiCuti('');
    setFormAlasanCuti('');
    setFormInstansiTujuan('');
    setFormProgramStudi('');
    setFormGajiPokok('3.500.000');
    setFormPenghasilanTotal('4.850.000');
    setFormPenandatanganTipe('kepala_sekolah');
    setFormPenandatanganNama(identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si');
    setFormPenandatanganNip(identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012');
    setFormPenandatanganPangkat(identitasSekolah.pangkatKepsek || 'Pembina Tk. I, IV/b');

    setIsFormModalOpen(true);
  };

  // Open Form for Editing existing surat
  const handleEditSurat = (surat: PembuatSuratRecord) => {
    setEditingSuratId(surat.id);
    setCurrentStep(1);
    setFormTarget(surat.targetSubjek);
    setFormJenisId(surat.jenisSuratId);
    setFormKodeKlasifikasi(surat.kodeKlasifikasi || surat.noSurat?.split('/')[0] || '421.3');
    setFormSearchQuery(surat.subjekData.nama);
    setFormSelectedSubjek({ ...surat.subjekData });
    setFormNoSurat(surat.noSurat);
    setFormTanggalSurat(surat.tanggalSurat);
    setFormTempatTerbit(surat.tempatTerbit || 'Unggulino');
    setFormPerihal(surat.perihal);
    setFormKeperluan(surat.detailSurat.keperluan || '');
    setFormCatatanKhusus(surat.detailSurat.catatanKhusus || '');
    setFormSekolahTujuan(surat.detailSurat.sekolahTujuan || '');
    setFormAlasanPindah(surat.detailSurat.alasanPindah || '');
    setFormNamaDokumenHilang(surat.detailSurat.namaDokumenHilang || 'Ijazah / SKL Asli');
    setFormNomorDokumenAsli(surat.detailSurat.nomorDokumenAsli || '');
    setFormTglMulaiCuti(surat.detailSurat.tglMulaiCuti || '');
    setFormTglSelesaiCuti(surat.detailSurat.tglSelesaiCuti || '');
    setFormAlasanCuti(surat.detailSurat.alasanCuti || '');
    setFormInstansiTujuan(surat.detailSurat.instansiTujuan || '');
    setFormProgramStudi(surat.detailSurat.programStudiKegiatan || '');
    setFormGajiPokok(surat.detailSurat.gajiPokok || '3.500.000');
    setFormPenghasilanTotal(surat.detailSurat.penghasilanTotal || '4.850.000');
    setFormPenandatanganTipe(surat.penandatangan.tipe);
    setFormPenandatanganNama(surat.penandatangan.nama);
    setFormPenandatanganNip(surat.penandatangan.nip);
    setFormPenandatanganPangkat(surat.penandatangan.pangkatGol || '');

    setIsFormModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (surat: PembuatSuratRecord) => {
    setSuratToDelete(surat);
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (!suratToDelete) return;
    const noSurat = suratToDelete.noSurat;
    const namaSubjek = suratToDelete.subjekData.nama;
    const idToDelete = suratToDelete.id;

    // Execute deletion callback
    onDelete(idToDelete);

    // Close preview modal if it was previewing the deleted item
    if (selectedSuratForPreview?.id === idToDelete) {
      setIsPreviewModalOpen(false);
      setSelectedSuratForPreview(null);
    }

    setSuratToDelete(null);
    showToast(`Dokumen surat "${noSurat}" (${namaSubjek}) berhasil dihapus dari arsip.`);
  };

  // Change Target Subjek in Step 1
  const handleSelectTarget = (target: TargetSubjekSurat) => {
    setFormTarget(target);
    const firstTemplate = DAFTAR_TEMPLATE_SURAT.find((t) => t.target === target) || DAFTAR_TEMPLATE_SURAT[0];
    const initialKode = firstTemplate.kodeKlasifikasi || '421.3';
    setFormJenisId(firstTemplate.id);
    setFormKodeKlasifikasi(initialKode);
    setFormPerihal(firstTemplate.defaultPerihal);
    setFormKeperluan(firstTemplate.defaultKeperluan);
    setFormNoSurat(generateAutoNomorSurat(initialKode, getNextNomorUrut(), formTanggalSurat));
    setFormSearchQuery('');
    setFormSelectedSubjek({
      nama: '',
      alamat: 'Kecamatan Puriala, Kab. Konawe',
    });
  };

  // Change Jenis Surat in Step 2
  const handleSelectJenis = (jenisId: string) => {
    setFormJenisId(jenisId);
    const tmpl = DAFTAR_TEMPLATE_SURAT.find((t) => t.id === jenisId);
    if (tmpl) {
      const code = tmpl.kodeKlasifikasi || '421.3';
      setFormKodeKlasifikasi(code);
      setFormPerihal(tmpl.defaultPerihal);
      setFormKeperluan(tmpl.defaultKeperluan);
      setFormNoSurat(generateAutoNomorSurat(code, getNextNomorUrut(), formTanggalSurat));
    }
  };

  // Handle classification code change
  const handleKodeKlasifikasiChange = (newKode: string) => {
    setFormKodeKlasifikasi(newKode);
    const autoNo = generateAutoNomorSurat(newKode, getNextNomorUrut(), formTanggalSurat);
    setFormNoSurat(autoNo);
  };

  // Select Subjek from Autocomplete in Step 3
  const handleSelectSiswa = (siswa: Siswa) => {
    setFormSelectedSubjek({
      idRef: siswa.id,
      nama: siswa.namaLengkap,
      nisn: siswa.nisn,
      nis: siswa.nis,
      tempatLahir: siswa.tempatLahir,
      tanggalLahir: siswa.tanggalLahir,
      jenisKelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      namaOrtu: siswa.namaAyah || siswa.namaIbu,
      pekerjaanOrtu: siswa.pekerjaanAyah || siswa.pekerjaanIbu || 'Petani / Wiraswasta',
      alamat: siswa.alamat || 'Kecamatan Puriala, Kab. Konawe',
    });
    setFormSearchQuery(siswa.namaLengkap);
  };

  const handleSelectGuru = (guru: GuruPTK) => {
    setFormSelectedSubjek({
      idRef: guru.id,
      nama: guru.namaLengkap,
      nip: guru.nip,
      nuptk: guru.nuptk,
      pangkatGol: guru.pangkatGolongan || 'Penata Muda, III/a',
      jabatan: guru.jabatan || guru.mapelUtama || 'Guru Mata Pelajaran',
      unitKerja: identitasSekolah.namaSekolah || 'SMP NEGERI 2 PURIALA',
    });
    setFormSearchQuery(guru.namaLengkap);
  };

  // Change Penandatangan option in Step 5
  const handleSelectPenandatanganTipe = (tipe: PenandatanganTipe) => {
    setFormPenandatanganTipe(tipe);
    if (tipe === 'kepala_sekolah') {
      setFormPenandatanganNama(identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si');
      setFormPenandatanganNip(identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012');
      setFormPenandatanganPangkat(identitasSekolah.pangkatKepsek || 'Pembina Tk. I, IV/b');
    } else if (tipe === 'an_kepala_sekolah_tu') {
      setFormPenandatanganNama(identitasSekolah.namaKepalaTU || 'Rustam, S.Pd.I');
      setFormPenandatanganNip(identitasSekolah.nipKepalaTU || '19790415 200801 1 014');
      setFormPenandatanganPangkat('Penata, III/c');
    } else if (tipe === 'plt_kepala_sekolah') {
      setFormPenandatanganNama(identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si');
      setFormPenandatanganNip(identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012');
      setFormPenandatanganPangkat(identitasSekolah.pangkatKepsek || 'Pembina Tk. I, IV/b');
    } else if (tipe === 'an_wakasek') {
      setFormPenandatanganNama('Sudirman, S.Pd., M.Pd');
      setFormPenandatanganNip('19750812 200003 1 004');
      setFormPenandatanganPangkat('Pembina Tk. I, IV/b');
    }
  };

  // Construct current record object from form states
  const constructRecordFromForm = (status: 'Draft' | 'Terbit'): PembuatSuratRecord => {
    const tmpl = selectedTemplate;
    const now = new Date().toISOString();

    let labelJabatan = 'Kepala Sekolah';
    if (formPenandatanganTipe === 'an_kepala_sekolah_tu') {
      labelJabatan = 'a.n. Kepala Sekolah - Ka. TU';
    } else if (formPenandatanganTipe === 'plt_kepala_sekolah') {
      labelJabatan = 'Plt. Kepala Sekolah';
    } else if (formPenandatanganTipe === 'an_wakasek') {
      labelJabatan = 'a.n. Kepala Sekolah - Wakasek';
    }

    const effectiveKode = formKodeKlasifikasi || tmpl.kodeKlasifikasi || '421.3';

    return {
      id: editingSuratId || `SURAT-GEN-${Date.now()}`,
      noSurat: formNoSurat.trim() || generateAutoNomorSurat(effectiveKode, suratList.length + 1, formTanggalSurat),
      kodeKlasifikasi: effectiveKode,
      targetSubjek: formTarget,
      jenisSuratId: formJenisId,
      jenisSuratNama: tmpl.nama,
      tanggalSurat: formTanggalSurat,
      tempatTerbit: formTempatTerbit.trim() || 'Unggulino',
      perihal: formPerihal.trim() || tmpl.defaultPerihal,
      subjekData: {
        ...formSelectedSubjek,
        nama: formSelectedSubjek.nama || formSearchQuery || 'Peserta Didik / Pendidik',
      },
      detailSurat: {
        keperluan: formKeperluan,
        catatanKhusus: formCatatanKhusus,
        sekolahTujuan: formSekolahTujuan,
        alasanPindah: formAlasanPindah,
        namaDokumenHilang: formNamaDokumenHilang,
        nomorDokumenAsli: formNomorDokumenAsli,
        tglMulaiCuti: formTglMulaiCuti,
        tglSelesaiCuti: formTglSelesaiCuti,
        alasanCuti: formAlasanCuti,
        instansiTujuan: formInstansiTujuan,
        programStudiKegiatan: formProgramStudi,
        gajiPokok: formGajiPokok,
        penghasilanTotal: formPenghasilanTotal,
      },
      penandatangan: {
        tipe: formPenandatanganTipe,
        labelJabatan,
        nama: formPenandatanganNama,
        nip: formPenandatanganNip,
        pangkatGol: formPenandatanganPangkat,
      },
      status,
      statusDrive: isGoogleConnected ? 'Menunggu Sync' : 'Lokal Saja',
      createdAt: now,
      updatedAt: now,
    };
  };

  // Actions from modal form
  const handleSaveAsDraft = () => {
    const record = constructRecordFromForm('Draft');
    if (editingSuratId) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setIsFormModalOpen(false);
    showToast('Draft surat berhasil disimpan.');
  };

  const handlePublishAndPrint = () => {
    const record = constructRecordFromForm('Terbit');
    if (editingSuratId) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setIsFormModalOpen(false);
    printSuratDocument(record, identitasSekolah);
    showToast('Surat resmi berhasil diterbitkan & siap dicetak (PDF).');
  };

  const handleOpenPreviewFromForm = () => {
    const record = constructRecordFromForm('Draft');
    setSelectedSuratForPreview(record);
    setIsPreviewModalOpen(true);
  };

  // Show temporary toast message
  const showToast = (msg: string) => {
    setSyncToastMessage(msg);
    setTimeout(() => {
      setSyncToastMessage(null);
    }, 4000);
  };

  // Upload generated letter to Google Drive
  const handleSyncToGoogleDrive = async (surat: PembuatSuratRecord) => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsUploadingToDrive(true);
      const htmlContent = renderSuratDocumentHTML(surat, identitasSekolah);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const cleanName = (surat.subjekData.nama || 'Subjek').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanJenis = (surat.jenisSuratNama || 'Surat').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${cleanJenis}_${cleanName}_SMPN2_PURIALA.html`;

      const uploaded = await uploadPembuatSuratDocumentToDrive(googleToken, blob, fileName, 'text/html');

      onUpdate({
        ...surat,
        statusDrive: 'Tersimpan',
        driveFileId: uploaded.id,
        driveWebViewLink: uploaded.webViewLink,
      });

      showToast(`Berhasil menyimpan berkas "${fileName}" ke Google Drive (TATA USAHA/SURAT).`);
    } catch (err: any) {
      showToast(`Gagal mengunggah ke Google Drive: ${err.message || err}`);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  return (
    <div className="space-y-6" id="pembuat-surat-module-root">
      {/* Toast Notification */}
      {syncToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{syncToastMessage}</span>
          <button
            onClick={() => setSyncToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Generator Dokumen Resmi & Terintegrasi Drive
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <FilePlus2 className="w-8 h-8 text-blue-400" />
              Pembuat Surat Otomatis
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Buat berbagai naskah dinas resmi untuk Siswa dan Guru/PTK secara instan dengan 5 langkah terstruktur, Kop Resmi Konawe & Tut Wuri, dan sinkronisasi otomatis ke Google Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenNewForm('siswa')}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition duration-150 text-sm"
            >
              <GraduationCap className="w-4 h-4" />
              + Surat Siswa
            </button>
            <button
              onClick={() => handleOpenNewForm('guru')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 transition duration-150 text-sm"
            >
              <Briefcase className="w-4 h-4" />
              + Surat Guru / PTK
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400">Total Dibuat</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-xs text-emerald-300">Surat Siswa</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{stats.siswa}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-xs text-indigo-300">Surat Guru / PTK</div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{stats.guru}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-xs text-sky-300">Status Terbit</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">{stats.terbit}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-xs text-amber-300">Draft Disimpan</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{stats.draft}</div>
          </div>
        </div>
      </div>

      {/* Google Drive Status Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isGoogleConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              Template Drive Master: <span className="text-blue-600 font-mono text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">TATA USAHA / SURAT</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {isGoogleConnected ? (
                <span className="text-emerald-700 font-medium">✓ Terhubung dengan Google Drive ({googleUser?.email || 'Akun Sekolah'})</span>
              ) : (
                'Google Drive belum terhubung. Hubungkan akun Google untuk sinkronisasi otomatis.'
              )}
            </div>
          </div>
        </div>

        {!isGoogleConnected && onConnectGoogle && (
          <button
            onClick={onConnectGoogle}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <CloudUpload className="w-4 h-4 text-blue-600" />
            Hubungkan Google Drive
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor surat, nama siswa, NIP/NISN, atau perihal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterTarget('semua')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filterTarget === 'semua' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Target
            </button>
            <button
              onClick={() => setFilterTarget('siswa')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filterTarget === 'siswa' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Siswa
            </button>
            <button
              onClick={() => setFilterTarget('guru')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filterTarget === 'guru' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Guru / PTK
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="semua">Semua Status</option>
            <option value="Terbit">Terbit (Resmi)</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table of Generated Letters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Daftar Arsip & Naskah Surat ({filteredSuratList.length})
          </h2>
          <button
            onClick={() => handleOpenNewForm()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            Buat Surat Baru
          </button>
        </div>

        {filteredSuratList.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <FilePlus2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Belum Ada Dokumen Surat</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Mulai membuat surat keterangan siswa aktif, mutasi, rekomendasi beasiswa, atau surat tugas PTK dengan template otomatis.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleOpenNewForm('siswa')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
              >
                + Surat Siswa
              </button>
              <button
                onClick={() => handleOpenNewForm('guru')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
              >
                + Surat Guru / PTK
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">No. Surat & Tanggal</th>
                  <th className="py-3 px-4">Jenis Surat</th>
                  <th className="py-3 px-4">Target Subjek</th>
                  <th className="py-3 px-4">Perihal / Maksud</th>
                  <th className="py-3 px-4">Penandatangan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuratList.map((surat) => {
                  const isSiswa = surat.targetSubjek === 'siswa';
                  return (
                    <tr key={surat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900 text-xs">
                          {surat.noSurat}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {surat.tanggalSurat}
                        </div>
                        <div className="text-[9px] text-emerald-700 font-sans flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Tersinkron ke Buku Agenda Surat Keluar</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">{surat.jenisSuratNama}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-semibold font-mono">
                            Kode: {surat.kodeKlasifikasi}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isSiswa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {isSiswa ? <GraduationCap className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                            {isSiswa ? 'Siswa' : 'Guru / PTK'}
                          </span>
                          <span className="font-semibold text-slate-800">{surat.subjekData.nama}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {isSiswa
                            ? `NISN: ${surat.subjekData.nisn || '-'} • Kelas ${surat.subjekData.kelas || '-'}`
                            : `NIP: ${surat.subjekData.nip || '-'} • ${surat.subjekData.jabatan || '-'}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 text-xs font-medium max-w-xs truncate" title={surat.perihal}>
                          {surat.perihal}
                        </div>
                        {surat.detailSurat.keperluan && (
                          <div className="text-slate-400 text-xs truncate max-w-xs" title={surat.detailSurat.keperluan}>
                            {surat.detailSurat.keperluan}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-slate-800">{surat.penandatangan.nama}</div>
                        <div className="text-xs text-slate-500">{surat.penandatangan.labelJabatan}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              surat.status === 'Terbit'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {surat.status === 'Terbit' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {surat.status}
                          </span>
                          {surat.statusDrive === 'Tersimpan' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <CloudUpload className="w-3 h-3" /> Drive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Doc */}
                          <button
                            onClick={() => {
                              setSelectedSuratForPreview(surat);
                              setIsPreviewModalOpen(true);
                            }}
                            title="Pratinjau Dokumen A4"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print / PDF */}
                          <button
                            onClick={() => printSuratDocument(surat, identitasSekolah)}
                            title="Cetak / Unduh PDF"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Word Export */}
                          <button
                            onClick={() => downloadSuratAsWordDoc(surat, identitasSekolah)}
                            title="Unduh Microsoft Word (.doc)"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Sync to Drive */}
                          <button
                            onClick={() => handleSyncToGoogleDrive(surat)}
                            disabled={isUploadingToDrive}
                            title="Simpan ke Google Drive (TATA USAHA/SURAT)"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition disabled:opacity-50"
                          >
                            <CloudUpload className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditSurat(surat)}
                            title="Edit Surat"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            id={`btn-delete-surat-${surat.id}`}
                            onClick={() => handleOpenDeleteModal(surat)}
                            title="Hapus Surat"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5-STEP MULTI-STEP MODAL FORM                                              */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingSuratId ? 'Edit Dokumen Surat' : 'Form Pembuat Surat Baru'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Langkah {currentStep} dari 5: {
                      currentStep === 1 ? 'Pilih Target Subjek' :
                      currentStep === 2 ? 'Pilih Jenis Surat' :
                      currentStep === 3 ? 'Cari / Masukkan Data Subjek' :
                      currentStep === 4 ? 'Isi Metadata & Detail Surat' :
                      'Penandatangan & Legalitas'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              {[
                { step: 1, label: '1. Target' },
                { step: 2, label: '2. Jenis' },
                { step: 3, label: '3. Subjek' },
                { step: 4, label: '4. Detail' },
                { step: 5, label: '5. Pengesahan' },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setCurrentStep(item.step)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                    currentStep === item.step
                      ? 'text-blue-600 font-bold'
                      : currentStep > item.step
                      ? 'text-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep === item.step
                        ? 'bg-blue-600 text-white shadow'
                        : currentStep > item.step
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentStep > item.step ? '✓' : item.step}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
              {/* ------------------------------------------------------------- */}
              {/* STEP 1: PILIH TARGET SUBJEK                                   */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Step 1: Pilih Target Subjek Surat</h4>
                    <p className="text-xs text-slate-500">Tentukan apakah surat ini ditujukan untuk Peserta Didik (Siswa) atau Tenaga Pendidik (Guru/PTK).</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label
                      onClick={() => handleSelectTarget('siswa')}
                      className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formTarget === 'siswa'
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <input
                          type="radio"
                          name="target_subjek"
                          checked={formTarget === 'siswa'}
                          onChange={() => handleSelectTarget('siswa')}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="font-bold text-slate-900 text-base">Peserta Didik (Siswa)</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Surat Keterangan Aktif, Mutasi Pindah, Berkelakuan Baik, Rekomendasi Beasiswa PIP, Pengantar Lomba, atau Kehilangan Ijazah.
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Terhubung data Buku Induk Siswa ({siswaList.length} Siswa)
                      </div>
                    </label>

                    <label
                      onClick={() => handleSelectTarget('guru')}
                      className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formTarget === 'guru'
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <input
                          type="radio"
                          name="target_subjek"
                          checked={formTarget === 'guru'}
                          onChange={() => handleSelectTarget('guru')}
                          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="font-bold text-slate-900 text-base">Guru & Tenaga Kependidikan (PTK)</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Surat Keterangan Mengajar (SKMT), Rekomendasi PPG, Izin/Cuti Dinas, Pengantar KGB, Kenaikan Pangkat, Rincian Gaji, atau Mutasi.
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Terhubung Data Personil PTK ({guruPTKList.length} Guru/PTK)
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 2: PILIH JENIS SURAT                                     */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Step 2: Pilih Jenis Surat & Template</h4>
                    <p className="text-xs text-slate-500">Pilih format jenis surat kedinasan yang terhubung ke Template Google Drive.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {DAFTAR_TEMPLATE_SURAT.filter((t) => t.target === formTarget).map((tmpl) => {
                      const isSelected = formJenisId === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => handleSelectJenis(tmpl.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="jenis_surat"
                            checked={isSelected}
                            onChange={() => handleSelectJenis(tmpl.id)}
                            className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">{tmpl.nama}</span>
                              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                Kode: {tmpl.kodeKlasifikasi}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{tmpl.deskripsi}</p>
                            <div className="flex items-center gap-1 text-[11px] text-blue-700 font-medium mt-2">
                              <CloudUpload className="w-3 h-3" />
                              Template Drive: <span className="underline">{tmpl.driveTemplateName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 3: AUTOCOMPLETE INPUT "CARI NAMA / NISN / NIP"            */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Step 3: Cari & Pilih Data {formTarget === 'siswa' ? 'Siswa (Buku Induk)' : 'Guru / PTK'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Ketik nama, NISN, NIP, atau kelas untuk mengisi seluruh formulir secara otomatis.
                    </p>
                  </div>

                  {/* Search Autocomplete Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Cari nama ${formTarget === 'siswa' ? 'siswa / NISN / Kelas' : 'guru / NIP / Mapel'}...`}
                      value={formSearchQuery}
                      onChange={(e) => {
                        setFormSearchQuery(e.target.value);
                        setFormSelectedSubjek((prev) => ({ ...prev, nama: e.target.value }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Autocomplete Quick Select Pills */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500">Hasil Pencarian Cepat:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {filteredSubjekList.map((item: any) => {
                        const isSiswa = formTarget === 'siswa';
                        const isSelected = formSelectedSubjek.idRef === item.id || formSelectedSubjek.nama === item.namaLengkap;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (isSiswa) handleSelectSiswa(item);
                              else handleSelectGuru(item);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition text-xs flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-bold">{item.namaLengkap}</div>
                              <div className="text-slate-500 mt-0.5">
                                {isSiswa ? `NISN: ${item.nisn || '-'} • Kelas ${item.kelas || '-'}` : `NIP: ${item.nip || '-'} • ${item.jabatan || item.mataPelajaran || '-'}`}
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Data Verification / Manual Adjustments */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Rincian Data Terpilih</span>
                      <span className="text-[11px] font-normal text-slate-400">Dapat disesuaikan jika diperlukan</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap & Gelar *</label>
                        <input
                          type="text"
                          value={formSelectedSubjek.nama || ''}
                          onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, nama: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {formTarget === 'siswa' ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">NISN / NIS</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.nisn || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, nisn: e.target.value })}
                              placeholder="0098765432"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Tempat & Tanggal Lahir</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={formSelectedSubjek.tempatLahir || ''}
                                onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, tempatLahir: e.target.value })}
                                placeholder="Tempat Lahir"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="date"
                                value={formSelectedSubjek.tanggalLahir || ''}
                                onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, tanggalLahir: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Tingkat / Kelas</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.kelas || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, kelas: e.target.value })}
                              placeholder="VII.A / VIII.B / IX"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Nama Orang Tua / Wali</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.namaOrtu || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, namaOrtu: e.target.value })}
                              placeholder="Nama Ayah / Ibu"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Alamat Lengkap</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.alamat || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, alamat: e.target.value })}
                              placeholder="Desa Puriala, Kec. Puriala"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">NIP / NUPTK</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.nip || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, nip: e.target.value })}
                              placeholder="19750812 200003 1 004"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Pangkat / Golongan Ruang</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.pangkatGol || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, pangkatGol: e.target.value })}
                              placeholder="Pembina Tk. I, IV/b"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Jabatan / Tugas</label>
                            <input
                              type="text"
                              value={formSelectedSubjek.jabatan || ''}
                              onChange={(e) => setFormSelectedSubjek({ ...formSelectedSubjek, jabatan: e.target.value })}
                              placeholder="Guru Matematika"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 4: FORM INPUT METADATA & DETAIL                           */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Step 4: Input Metadata & Detail Surat</h4>
                    <p className="text-xs text-slate-500">
                      Periksa kode klasifikasi, nomor surat otomatis, tanggal terbit, dan rincian khusus naskah dinas.
                    </p>
                  </div>

                  {/* Kode Klasifikasi Selector - Synchronized with Surat Keluar & Google Sheet */}
                  <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sky-950 font-bold text-[11px] flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-sky-700" />
                        <span>Kode Klasifikasi Surat (Mengikuti Surat Keluar & Google Sheet)</span>
                      </label>
                      <span className="text-[10px] text-sky-800 font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-sky-300">
                        {kodeKlasifikasiList.length} Kode Tersedia
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <select
                          value={formKodeKlasifikasi || selectedTemplate.kodeKlasifikasi || '421.3'}
                          onChange={(e) => handleKodeKlasifikasiChange(e.target.value)}
                          className="w-full border border-sky-300 rounded-lg p-2 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          {kodeKlasifikasiList.map((k) => (
                            <option key={k.kode} value={k.kode}>
                              {k.kode} - {k.nama} {k.kategori ? `(${k.kategori})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Kode Klasifikasi..."
                          value={formKodeKlasifikasi || ''}
                          onChange={(e) => handleKodeKlasifikasiChange(e.target.value)}
                          className="w-full border border-sky-300 rounded-lg p-2 bg-white font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-sky-700 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-sky-600 shrink-0" />
                      <span>Kode otomatis sinkron dengan Buku Agenda Surat Keluar (Sheet 2026).</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Surat Dinas *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formNoSurat}
                          onChange={(e) => setFormNoSurat(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setFormNoSurat(generateAutoNomorSurat(formKodeKlasifikasi || selectedTemplate.kodeKlasifikasi, suratList.length + 1, formTanggalSurat))}
                          title="Generate Nomor Baru"
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition"
                        >
                          Auto
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Surat *</label>
                      <input
                        type="date"
                        value={formTanggalSurat}
                        onChange={(e) => setFormTanggalSurat(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tempat Terbit *</label>
                      <input
                        type="text"
                        value={formTempatTerbit}
                        onChange={(e) => setFormTempatTerbit(e.target.value)}
                        placeholder="Unggulino"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Perihal / Judul Surat *</label>
                      <input
                        type="text"
                        value={formPerihal}
                        onChange={(e) => setFormPerihal(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Maksud / Keperluan Surat *</label>
                    <textarea
                      rows={2}
                      value={formKeperluan}
                      onChange={(e) => setFormKeperluan(e.target.value)}
                      placeholder="Contoh: Kelengkapan berkas administrasi Beasiswa Program Indonesia Pintar (PIP) / Persyaratan TPG"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Conditional Fields based on Letter Type */}
                  {formJenisId === 'mutasi_keluar_siswa' && (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                      <div className="text-xs font-bold text-amber-900">Rincian Khusus Mutasi Siswa</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Sekolah Tujuan *</label>
                          <input
                            type="text"
                            value={formSekolahTujuan}
                            onChange={(e) => setFormSekolahTujuan(e.target.value)}
                            placeholder="Contoh: SMP Negeri 1 Kendari"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Alasan Pindah *</label>
                          <input
                            type="text"
                            value={formAlasanPindah}
                            onChange={(e) => setFormAlasanPindah(e.target.value)}
                            placeholder="Mengikuti domisili / mutasi kerja orang tua"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formJenisId === 'kehilangan_dokumen_siswa' && (
                    <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-3">
                      <div className="text-xs font-bold text-sky-900">Rincian Dokumen yang Hilang</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Nama Dokumen</label>
                          <input
                            type="text"
                            value={formNamaDokumenHilang}
                            onChange={(e) => setFormNamaDokumenHilang(e.target.value)}
                            placeholder="Ijazah / SKL / NISN Asli"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Seri Dokumen Asli</label>
                          <input
                            type="text"
                            value={formNomorDokumenAsli}
                            onChange={(e) => setFormNomorDokumenAsli(e.target.value)}
                            placeholder="DN-20/DI-06/0012345"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formJenisId === 'izin_cuti_ptk' && (
                    <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                      <div className="text-xs font-bold text-indigo-900">Rincian Masa Cuti Pegawai</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Mulai Cuti</label>
                          <input
                            type="date"
                            value={formTglMulaiCuti}
                            onChange={(e) => setFormTglMulaiCuti(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Selesai Cuti</label>
                          <input
                            type="date"
                            value={formTglSelesaiCuti}
                            onChange={(e) => setFormTglSelesaiCuti(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Jenis / Alasan Cuti</label>
                          <input
                            type="text"
                            value={formAlasanCuti}
                            onChange={(e) => setFormAlasanCuti(e.target.value)}
                            placeholder="Cuti Tahunan / Sakit"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formJenisId === 'rekomendasi_ppg_guru' && (
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                      <div className="text-xs font-bold text-emerald-900">Rincian Tugas Belajar / PPG</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">LPTK / Universitas Penyelenggara</label>
                          <input
                            type="text"
                            value={formInstansiTujuan}
                            onChange={(e) => setFormInstansiTujuan(e.target.value)}
                            placeholder="Universitas Halu Oleo / LPTK Mitra"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Nama Program Studi / Bidang PPG</label>
                          <input
                            type="text"
                            value={formProgramStudi}
                            onChange={(e) => setFormProgramStudi(e.target.value)}
                            placeholder="Pendidikan Matematika PPG Daljab"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formJenisId === 'keterangan_penghasilan_ptk' && (
                    <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3">
                      <div className="text-xs font-bold text-teal-900">Rincian Estimasi Penghasilan</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                          <input
                            type="text"
                            value={formGajiPokok}
                            onChange={(e) => setFormGajiPokok(e.target.value)}
                            placeholder="3.500.000"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Total Penghasilan Bersih (Rp)</label>
                          <input
                            type="text"
                            value={formPenghasilanTotal}
                            onChange={(e) => setFormPenghasilanTotal(e.target.value)}
                            placeholder="4.850.000"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      value={formCatatanKhusus}
                      onChange={(e) => setFormCatatanKhusus(e.target.value)}
                      placeholder="Catatan tambahan di bagian bawah naskah jika diperlukan"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 5: DROPDOWN "PENANDATANGAN"                               */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Step 5: Penandatangan & Legalitas Dokumen</h4>
                    <p className="text-xs text-slate-500">Pilih pejabat penandatangan naskah dinas resmi SMP Negeri 2 Puriala.</p>
                  </div>

                  {/* Dropdown Penandatangan */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Jabatan Penandatangan
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { tipe: 'kepala_sekolah', label: 'Kepala Sekolah (Definitif)', desc: 'ADRIS, S.Pd.,M.Si' },
                        { tipe: 'an_kepala_sekolah_tu', label: 'a.n. Kepala Sekolah - Ka. TU', desc: 'Rustam, S.Pd.I' },
                        { tipe: 'plt_kepala_sekolah', label: 'Plt. Kepala Sekolah', desc: 'Pelaksana Tugas' },
                        { tipe: 'an_wakasek', label: 'a.n. Kepala Sekolah - Wakasek', desc: 'Sudirman, S.Pd., M.Pd' },
                      ].map((item) => (
                        <div
                          key={item.tipe}
                          onClick={() => handleSelectPenandatanganTipe(item.tipe as any)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                            formPenandatanganTipe === item.tipe
                              ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 font-bold text-blue-950'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{item.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                          </div>
                          <input
                            type="radio"
                            name="penandatangan_tipe"
                            checked={formPenandatanganTipe === item.tipe}
                            onChange={() => handleSelectPenandatanganTipe(item.tipe as any)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pejabat Details Inputs */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-700">Rincian Pejabat Penandatangan</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nama Pejabat *</label>
                        <input
                          type="text"
                          value={formPenandatanganNama}
                          onChange={(e) => setFormPenandatanganNama(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">NIP Pejabat *</label>
                        <input
                          type="text"
                          value={formPenandatanganNip}
                          onChange={(e) => setFormPenandatanganNip(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Pangkat / Golongan</label>
                        <input
                          type="text"
                          value={formPenandatanganPangkat}
                          onChange={(e) => setFormPenandatanganPangkat(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Review Card */}
                  <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <div className="font-bold">Form Siap Diterbitkan</div>
                      <div>Surat: <strong>{selectedTemplate.nama}</strong> untuk <strong>{formSelectedSubjek.nama || 'Subjek'}</strong></div>
                      <div>Nomor: <strong>{formNoSurat}</strong> • Tanggal: <strong>{formTanggalSurat}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Navigation & Output Buttons */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </button>
                )}
                {currentStep < 5 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition shadow-sm"
                  >
                    Lanjutkan
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* OUTPUT ACTION BUTTONS (As requested by user) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Tombol "Pratinjau Doc" */}
                <button
                  type="button"
                  onClick={handleOpenPreviewFromForm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition shadow-sm"
                >
                  <Eye className="w-4 h-4 text-blue-300" />
                  Pratinjau Doc
                </button>

                {/* 2. Tombol "Simpan Draft" */}
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 transition shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  Simpan Draft
                </button>

                {/* 3. Tombol "Terbit & Cetak (PDF)" */}
                <button
                  type="button"
                  onClick={handlePublishAndPrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-900/20"
                >
                  <Printer className="w-4 h-4" />
                  Terbit & Cetak (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RICH DOCUMENT PREVIEW MODAL (A4 Kop Konawe & Tut Wuri)                    */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && selectedSuratForPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full my-4 flex flex-col max-h-[95vh] overflow-hidden border border-slate-700 animate-in fade-in zoom-in-95">
            {/* Preview Toolbar */}
            <div className="px-5 py-3.5 bg-slate-950 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Pratinjau Dokumen Naskah Dinas A4
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedSuratForPreview.noSurat} • {selectedSuratForPreview.subjekData.nama}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Print PDF */}
                <button
                  onClick={() => printSuratDocument(selectedSuratForPreview, identitasSekolah)}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / PDF
                </button>

                {/* Word Export */}
                <button
                  onClick={() => downloadSuratAsWordDoc(selectedSuratForPreview, identitasSekolah)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Word (.doc)
                </button>

                {/* Google Drive Upload */}
                <button
                  onClick={() => handleSyncToGoogleDrive(selectedSuratForPreview)}
                  disabled={isUploadingToDrive}
                  className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  Simpan ke Drive
                </button>

                {/* Delete from Preview Toolbar */}
                <button
                  onClick={() => handleOpenDeleteModal(selectedSuratForPreview)}
                  title="Hapus Dokumen Surat"
                  className="inline-flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-800 flex justify-center">
              <div className="bg-white text-black p-8 sm:p-12 shadow-2xl rounded max-w-2xl w-full min-h-[297mm] font-serif border border-slate-300 scale-95 origin-top">
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderSuratDocumentHTML(selectedSuratForPreview, identitasSekolah)
                      .replace('<!DOCTYPE html>', '')
                      .replace(/<html>|<\/html>|<head>[\s\S]*<\/head>|<body>|<\/body>/g, ''),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG KONFIRMASI HAPUS DOKUMEN SURAT (AMAN & RESPONSIF)                  */}
      {/* ========================================================================= */}
      {suratToDelete && (
        <div
          id="modal-konfirmasi-hapus-surat"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Arsip Surat?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin menghapus dokumen surat ini secara permanen dari sistem?
                </p>

                <div className="mt-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Nomor Surat:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {suratToDelete.noSurat}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Target Subjek:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[180px]">
                      {suratToDelete.subjekData.nama}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Jenis Surat:</span>
                    <span className="font-medium text-slate-700 text-right">
                      {suratToDelete.jenisSuratNama}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Tanggal Terbit:</span>
                    <span className="text-slate-700">{suratToDelete.tanggalSurat}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      suratToDelete.status === 'Terbit' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {suratToDelete.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-batal-hapus-surat"
                onClick={() => setSuratToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-konfirmasi-hapus-surat"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-md shadow-red-600/20 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
