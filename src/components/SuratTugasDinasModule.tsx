import React, { useState, useEffect } from 'react';
import {
  PlaneTakeoff,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  FileText,
  Users,
  CheckCircle2,
  X,
  MapPin,
  Calendar,
  Building,
  Download,
  Cloud,
  ExternalLink,
  RefreshCw,
  Folder,
  FileCheck,
  Check,
  Sparkles,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Tag,
  BookOpen,
  CloudDownload,
  CloudUpload,
} from 'lucide-react';
import {
  SuratTugasDinas,
  PersonilTugas,
  IdentitasSekolah,
  GuruPTK,
  KodeKlasifikasiSurat,
  SuratKeluar,
  PembuatSuratRecord,
  SKKBM,
  SKTugasTambahan,
} from '../types';
import { DEFAULT_KODE_KLASIFIKASI } from '../services/googleSheets';
import {
  generateSuratTugasFullHtml,
  downloadSuratTugasHtmlFile,
  downloadSuratTugasDocFile,
  SPTPrintMode,
  formatTanggalIndonesia,
  LOGO_KABUPATEN_KONAWE_BASE64,
  LOGO_TUT_WURI_BASE64,
  terbilangHari,
} from '../utils/skTemplates';
import { getHighestNomorUrutFromLists, getRomanMonth } from '../utils/suratTemplates';
import html2pdf from 'html2pdf.js';
import {
  findSuratTugasTemplateInDrive,
  findSPPDTemplateInDrive,
  fetchSuratFolderFiles,
  uploadDocumentAsPdfToDrive,
  GoogleDriveFile,
  fetchArsipDokumenFiles,
  saveSuratTugasDataToDrive,
  loadSuratTugasDataFromDrive,
} from '../services/googleDrive';

interface SuratTugasDinasModuleProps {
  tugasList: SuratTugasDinas[];
  suratKeluarList?: SuratKeluar[];
  pembuatSuratList?: PembuatSuratRecord[];
  skKBMList?: SKKBM[];
  skTugasTambahanList?: SKTugasTambahan[];
  onAdd: (item: SuratTugasDinas) => void;
  onUpdate: (item: SuratTugasDinas) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
  guruPTKList?: GuruPTK[];
  googleUser?: any | null;
  googleToken?: string | null;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  kodeKlasifikasiList?: KodeKlasifikasiSurat[];
  onBatchUpdate?: (newList: SuratTugasDinas[]) => void;
}

export const formatPTKDisplayName = (g: any): string => {
  if (!g) return '';
  const rawNama = (g.namaLengkap || g.nama || g.namaGuru || '').trim();
  if (!rawNama) return '';

  const gelarDepan = (g.gelarDepan || '').trim();
  const gelarBelakang = (g.gelarBelakang || '').trim();

  let namaLengkap = rawNama;
  if (rawNama && !rawNama.includes(',') && !rawNama.startsWith('Drs.') && !rawNama.startsWith('Dr.') && !rawNama.startsWith('H.')) {
    if (gelarDepan) namaLengkap = `${gelarDepan} ${namaLengkap}`;
    if (gelarBelakang) namaLengkap = `${namaLengkap}, ${gelarBelakang}`;
  }

  return namaLengkap.trim();
};

export const SuratTugasDinasModule: React.FC<SuratTugasDinasModuleProps> = ({
  tugasList,
  suratKeluarList = [],
  pembuatSuratList = [],
  skKBMList = [],
  skTugasTambahanList = [],
  onAdd,
  onUpdate,
  onDelete,
  identitasSekolah,
  guruPTKList = [],
  googleUser,
  googleToken,
  isGoogleConnected = false,
  onConnectGoogle,
  kodeKlasifikasiList = DEFAULT_KODE_KLASIFIKASI,
  onBatchUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuratTugasDinas | null>(null);
  const [suratToDelete, setSuratToDelete] = useState<SuratTugasDinas | null>(null);

  // Print & Preview State
  const [selectedForPrint, setSelectedForPrint] = useState<SuratTugasDinas | null>(null);
  const [printMode, setPrintMode] = useState<SPTPrintMode>('spt_only');

  // Google Drive Template State
  const [isDriveTemplateModalOpen, setIsDriveTemplateModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [driveSuratTugasTemplate, setDriveSuratTugasTemplate] = useState<GoogleDriveFile | null>(null);
  const [driveSPPDTemplate, setDriveSPPDTemplate] = useState<GoogleDriveFile | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Google Drive Storage Sync States
  const [isScanningDriveBerkas, setIsScanningDriveBerkas] = useState(false);
  const [isPullingDrive, setIsPullingDrive] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleAutoScanBerkas = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsScanningDriveBerkas(true);
      setSyncFeedback({ message: 'Sedang memindai folder TATA USAHA/07_ARSIP_DOKUMEN_SURAT...', type: 'info' });

      const files = await fetchArsipDokumenFiles(googleToken);
      
      let matchedCount = 0;
      const updatedList = tugasList.map((tugas) => {
        const safeNo = (tugas.noSuratTugas || '').replace(/[/\\?%*:|"<>]/g, '_');
        
        // Find by exact file ID if we already have it, or by name match
        const matchedFile = files.find(
          (f) =>
            f.id === tugas.driveFileId ||
            f.name.toLowerCase() === `SPT_${safeNo}_${(tugas.personil[0]?.nama || '').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`.toLowerCase() ||
            (safeNo && f.name.includes(safeNo))
        );

        if (matchedFile) {
          matchedCount++;
          return {
            ...tugas,
            statusDrive: 'Tersimpan' as const,
            driveFileId: matchedFile.id,
            driveWebViewLink: matchedFile.webViewLink,
            drivePath: 'TATA USAHA/07_ARSIP_DOKUMEN_SURAT',
            templateNama: 'Format Google Drive TATA USAHA/07_ARSIP_DOKUMEN_SURAT - Surat Tugas',
          };
        } else {
          return {
            ...tugas,
            statusDrive: tugas.statusDrive === 'Tersimpan' ? 'Lokal Saja' as const : tugas.statusDrive,
          };
        }
      });

      if (onBatchUpdate) {
        onBatchUpdate(updatedList);
      }

      setSyncFeedback({
        message: `Pemindaian Berkas Selesai! Menemukan ${matchedCount} berkas fisik PDF yang cocok di Drive.`,
        type: 'success',
      });
    } catch (err: any) {
      console.warn('Scan berkas error:', err);
      setSyncFeedback({ message: err?.message || 'Gagal memindai berkas di Google Drive.', type: 'error' });
    } finally {
      setIsScanningDriveBerkas(false);
    }
  };

  const handlePullFromDrive = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsPullingDrive(true);
      setSyncFeedback({ message: 'Sedang menarik data dari Google Drive...', type: 'info' });

      const data = await loadSuratTugasDataFromDrive(googleToken);
      if (data && Array.isArray(data)) {
        if (onBatchUpdate) {
          onBatchUpdate(data);
        }
        setSyncFeedback({
          message: `Berhasil menarik ${data.length} data Surat Tugas dari Google Drive!`,
          type: 'success',
        });
      } else {
        setSyncFeedback({
          message: 'Berkas rekap Surat Tugas tidak ditemukan atau kosong di Google Drive.',
          type: 'info',
        });
      }
    } catch (err: any) {
      console.error('Error pulling Surat Tugas from Drive:', err);
      setSyncFeedback({ message: err?.message || 'Gagal menarik data dari Google Drive.', type: 'error' });
    } finally {
      setIsPullingDrive(false);
    }
  };

  const handleSaveRekapToDrive = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsSyncingDrive(true);
      setSyncFeedback({ message: 'Sedang menyinkronkan data ke Google Drive...', type: 'info' });

      const success = await saveSuratTugasDataToDrive(googleToken, tugasList);
      if (success) {
        setSyncFeedback({
          message: 'Berhasil menyimpan seluruh data riwayat Surat Tugas ke Google Drive!',
          type: 'success',
        });
      } else {
        throw new Error('Gagal menulis berkas rekap ke Google Drive.');
      }
    } catch (err: any) {
      console.error('Error saving Surat Tugas to Drive:', err);
      setSyncFeedback({ message: err?.message || 'Gagal menyimpan data ke Google Drive.', type: 'error' });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const getNextNomorUrut = (): number => {
    const highest = getHighestNomorUrutFromLists(tugasList, suratKeluarList, pembuatSuratList, skKBMList, skTugasTambahanList);
    return highest > 0 ? highest + 1 : (tugasList.length + 1);
  };

  const getSptAndSppdNumbers = () => {
    const sptUrut = getNextNomorUrut();
    const sppdUrut = sptUrut + 1;
    return {
      sptNum: String(sptUrut).padStart(3, '0'),
      sppdNum: String(sppdUrut).padStart(3, '0')
    };
  };

  const generateSptSppdNumbers = (kode: string, dateStr?: string) => {
    const { sptNum, sppdNum } = getSptAndSppdNumbers();
    const date = dateStr ? new Date(dateStr) : new Date();
    const monthIndex = isNaN(date.getTime()) ? new Date().getMonth() : date.getMonth();
    const curMonthRoman = getRomanMonth(monthIndex);
    const curYear = isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();

    const cleanKode = kode || '090';

    const noSuratTugas = `${cleanKode}/${sptNum}/SMP-02/PRL/SPT/${curMonthRoman}/${curYear}`;
    const noSPPD = `${cleanKode}/${sppdNum}/SMP-02/PRL/SPPD/${curMonthRoman}/${curYear}`;

    return { noSuratTugas, noSPPD };
  };

  const initialDateStr = new Date().toISOString().split('T')[0];
  const initialNumbers = generateSptSppdNumbers('090', initialDateStr);

  const [formData, setFormData] = useState<Partial<SuratTugasDinas>>({
    kodeKlasifikasi: '090',
    noSuratTugas: initialNumbers.noSuratTugas,
    noSPPD: initialNumbers.noSPPD,
    dasarPenugasan: 'Kepentingan Dinas Operasional Sekolah dan Pembinaan Tugas Tenaga Kependidikan',
    personil: [
      {
        nama: identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
        nip: identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012',
        pangkatGol: identitasSekolah.pangkatKepsek || 'Pembina, IV/a',
        jabatan: 'Kepala Sekolah',
      },
    ],
    maksudTugas: 'Menghadiri Rapat Koordinasi Teknis Pembinaan Guru dan Tenaga Kependidikan',
    tempatTujuan: 'Dinas Pendidikan dan Kebudayaan Kab. Konawe, Unaaha',
    tanggalBerangkat: new Date().toISOString().split('T')[0],
    tanggalKembali: new Date().toISOString().split('T')[0],
    lamaHari: 1,
    alatAngkut: 'Kendaraan Dinas',
    bebanAnggaran: 'Dana BOS SMPN 2 Puriala',
    status: 'Terbit',
    tempatPenetapan: 'Unggulino',
    tanggalSurat: new Date().toISOString().split('T')[0],
    templateNama: 'Format Google Drive TATA USAHA/SURAT - Surat Tugas',
    drivePath: 'TATA USAHA/SURAT',
  });

  // Check & Fetch Google Drive Surat Folder / Surat Tugas Template on mount or token change
  useEffect(() => {
    if (googleToken && isGoogleConnected) {
      loadDriveTemplates();
    }
  }, [googleToken, isGoogleConnected]);

  const loadDriveTemplates = async () => {
    if (!googleToken) return;
    setIsLoadingDrive(true);
    try {
      const [files, template, sppdTemplate] = await Promise.all([
        fetchSuratFolderFiles(googleToken),
        findSuratTugasTemplateInDrive(googleToken),
        findSPPDTemplateInDrive(googleToken),
      ]);
      setDriveFiles(files);
      if (template) {
        setDriveSuratTugasTemplate(template);
      }
      if (sppdTemplate) {
        setDriveSPPDTemplate(sppdTemplate);
      }
    } catch (err) {
      console.warn('Error fetching Drive template for Surat Tugas & SPPD:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleKodeKlasifikasiChange = (newKode: string) => {
    const { noSuratTugas, noSPPD } = generateSptSppdNumbers(
      newKode,
      formData.tanggalSurat || formData.tanggalBerangkat || new Date().toISOString().split('T')[0]
    );
    setFormData((prev) => ({
      ...prev,
      kodeKlasifikasi: newKode,
      noSuratTugas,
      noSPPD,
    }));
  };

  const handleTanggalSuratChange = (newDate: string) => {
    const { noSuratTugas, noSPPD } = generateSptSppdNumbers(
      formData.kodeKlasifikasi || '090',
      newDate
    );
    setFormData((prev) => ({
      ...prev,
      tanggalSurat: newDate,
      noSuratTugas,
      noSPPD,
    }));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const { noSuratTugas, noSPPD } = generateSptSppdNumbers('090', todayStr);
    setFormData({
      kodeKlasifikasi: '090',
      noSuratTugas,
      noSPPD,
      dasarPenugasan: 'Kepentingan Dinas Operasional Sekolah dan Pembinaan Tugas Tenaga Kependidikan',
      personil: [
        {
          nama: identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
          nip: identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012',
          pangkatGol: identitasSekolah.pangkatKepsek || 'Pembina, IV/a',
          jabatan: 'Kepala Sekolah',
        },
      ],
      maksudTugas: '',
      tempatTujuan: 'Dinas Pendidikan dan Kebudayaan Kab. Konawe, Unaaha',
      tanggalBerangkat: todayStr,
      tanggalKembali: todayStr,
      lamaHari: 1,
      alatAngkut: 'Kendaraan Dinas',
      bebanAnggaran: 'Dana BOS SMPN 2 Puriala',
      status: 'Terbit',
      tempatPenetapan: 'Unggulino',
      tanggalSurat: todayStr,
      templateNama: 'Format Google Drive TATA USAHA/SURAT - Surat Tugas',
      drivePath: 'TATA USAHA/SURAT',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: SuratTugasDinas) => {
    setEditingItem(item);
    setFormData({
      ...item,
      kodeKlasifikasi: item.kodeKlasifikasi || item.noSuratTugas?.split('/')[0] || '090',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maksudTugas || !formData.tempatTujuan) {
      alert('Mohon lengkapi Maksud Tugas dan Tempat Tujuan penugasan dinas!');
      return;
    }

    const selectedKode = formData.kodeKlasifikasi || formData.noSuratTugas?.split('/')[0] || '090';

    if (editingItem) {
      const updatedItem: SuratTugasDinas = {
        ...editingItem,
        ...formData,
        kodeKlasifikasi: selectedKode,
        templateNama: 'Format Google Drive TATA USAHA/SURAT - Surat Tugas',
        drivePath: 'TATA USAHA/SURAT',
      } as SuratTugasDinas;
      onUpdate(updatedItem);
      setIsAddModalOpen(false);
      
      // Auto-sync to Google Drive
      await handleSaveToDrive(updatedItem);
    } else {
      const fallbackNumbers = generateSptSppdNumbers(
        selectedKode,
        formData.tanggalSurat || formData.tanggalBerangkat || new Date().toISOString().split('T')[0]
      );
      const newItem: SuratTugasDinas = {
        id: `ST-${Date.now()}`,
        kodeKlasifikasi: selectedKode,
        noSuratTugas: formData.noSuratTugas || fallbackNumbers.noSuratTugas,
        noSPPD: formData.noSPPD || fallbackNumbers.noSPPD,
        dasarPenugasan: formData.dasarPenugasan || 'Kepentingan Dinas Operasional Sekolah',
        personil:
          formData.personil && formData.personil.length > 0
            ? formData.personil
            : [
                {
                  nama: identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
                  nip: identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012',
                  pangkatGol: identitasSekolah.pangkatKepsek || 'Pembina, IV/a',
                  jabatan: 'Kepala Sekolah',
                },
              ],
        maksudTugas: formData.maksudTugas || '',
        tempatTujuan: formData.tempatTujuan || '',
        tanggalBerangkat: formData.tanggalBerangkat || new Date().toISOString().split('T')[0],
        tanggalKembali: formData.tanggalKembali || new Date().toISOString().split('T')[0],
        lamaHari: Number(formData.lamaHari) || 1,
        alatAngkut: formData.alatAngkut || 'Kendaraan Dinas',
        bebanAnggaran: formData.bebanAnggaran || 'Dana BOS SMPN 2 Puriala',
        status: (formData.status as any) || 'Terbit',
        tempatPenetapan: formData.tempatPenetapan || 'Unggulino',
        tanggalSurat: formData.tanggalSurat || formData.tanggalBerangkat || new Date().toISOString().split('T')[0],
        templateNama: 'Format Google Drive TATA USAHA/SURAT - Surat Tugas',
        drivePath: 'TATA USAHA/SURAT',
        statusDrive: 'Lokal Saja',
      };
      onAdd(newItem);
      setIsAddModalOpen(false);
      
      // Auto-sync to Google Drive
      await handleSaveToDrive(newItem);
    }
  };

  const handleAddPersonil = () => {
    const current = formData.personil || [];
    setFormData({
      ...formData,
      personil: [
        ...current,
        {
          nama: '',
          nip: '-',
          pangkatGol: 'Penata Muda, III/a',
          jabatan: 'Guru Mata Pelajaran',
        },
      ],
    });
  };

  const handleSelectPTKForPersonil = (index: number, ptkId: string) => {
    const selectedPTK = guruPTKList.find((g) => g.id === ptkId);
    if (!selectedPTK) return;

    const formattedName = formatPTKDisplayName(selectedPTK);
    const nipVal = selectedPTK.nip && selectedPTK.nip !== '-' ? selectedPTK.nip : '';
    const pangkatVal = selectedPTK.pangkatGolongan || selectedPTK.golongan || 'Penata Muda, III/a';
    const jabatanVal =
      selectedPTK.jabatan ||
      (selectedPTK.mapelUtama ? `Guru ${selectedPTK.mapelUtama}` : 'Guru Mata Pelajaran');

    const current = [...(formData.personil || [])];
    current[index] = {
      nama: formattedName,
      nip: nipVal || '-',
      pangkatGol: pangkatVal,
      jabatan: jabatanVal,
    };
    setFormData({ ...formData, personil: current });
  };

  const handleRemovePersonil = (index: number) => {
    const current = formData.personil || [];
    setFormData({
      ...formData,
      personil: current.filter((_, idx) => idx !== index),
    });
  };

  const handleUpdatePersonil = (index: number, field: keyof PersonilTugas, val: string) => {
    const current = [...(formData.personil || [])];
    current[index] = { ...current[index], [field]: val };
    setFormData({ ...formData, personil: current });
  };

  // Upload SPT document directly into Google Drive folder TATA USAHA/07_ARSIP_DOKUMEN_SURAT
  const handleSaveToDrive = async (tugas: SuratTugasDinas) => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    setIsSavingToDrive(true);
    setSaveSuccessMsg(null);
    try {
      const htmlContent = generateSuratTugasFullHtml(tugas, identitasSekolah, printMode);
      const safeNo = (tugas.noSuratTugas || 'Surat_Tugas').replace(/[/\\?%*:|"<>]/g, '_');
      const fileName = `SPT_${safeNo}_${tugas.personil[0]?.nama.replace(/[^a-zA-Z0-9]/g, '_') || 'Dinas'}.pdf`;

      // Convert HTML to PDF blob
      const pdfBlob = await html2pdf().from(htmlContent).outputPdf('blob');

      const uploaded = await uploadDocumentAsPdfToDrive(googleToken, pdfBlob, fileName);

      const updatedTugas: SuratTugasDinas = {
        ...tugas,
        statusDrive: 'Tersimpan',
        driveFileId: uploaded.id,
        driveWebViewLink: uploaded.webViewLink,
        drivePath: 'TATA USAHA/07_ARSIP_DOKUMEN_SURAT',
        templateNama: 'Format Google Drive TATA USAHA/07_ARSIP_DOKUMEN_SURAT - Surat Tugas',
      };

      onUpdate(updatedTugas);
      setSelectedForPrint(updatedTugas);
      setSaveSuccessMsg(`Berhasil disimpan ke Google Drive: TATA USAHA/07_ARSIP_DOKUMEN_SURAT/${fileName}`);
      loadDriveTemplates();
    } catch (err: any) {
      alert(`Gagal menyimpan ke Google Drive: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handlePrintDocument = (tugas: SuratTugasDinas, mode: SPTPrintMode) => {
    const html = generateSuratTugasFullHtml(tugas, identitasSekolah, mode);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
          const w = window.open('', '_blank');
          if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
            w.print();
          }
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 400);
    }
  };

  const filtered = tugasList.filter(
    (t) =>
      t.noSuratTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maksudTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tempatTujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.personil.some((p) => p.nama.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Administrasi Tata Usaha / <span className="text-slate-800 font-semibold">Surat Perintah Tugas (SPT)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-sky-600" />
            <span>SURAT PERINTAH TUGAS (SPT) & SPPD DINAS</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Drive Template Inspection Button */}
          <button
            onClick={() => setIsDriveTemplateModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold py-2.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Kelola & Cek Format Surat Tugas di Google Drive Folder TATA USAHA/SURAT"
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Format Drive: TATA USAHA/SURAT</span>
            {driveSuratTugasTemplate && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Perintah Tugas</span>
          </button>
        </div>
      </div>

      {/* GOOGLE DRIVE STORAGE SYNC BANNER */}
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
                Folder: TATA USAHA/07_ARSIP_DOKUMEN_SURAT
              </span>
              <span className="bg-white/10 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                File: "REKAP_SURAT_TUGAS_DINAS.json"
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Otomatis sinkronisasi, tarik, simpan data Surat Tugas Dinas & memverifikasi kelengkapan berkas fisik PDF di folder Drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isGoogleConnected ? (
            <>
              {/* Scan Berkas Drive Button */}
              <button
                type="button"
                onClick={handleAutoScanBerkas}
                disabled={isScanningDriveBerkas || isPullingDrive || isSyncingDrive}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold py-2 px-3 rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Pindai folder TATA USAHA/07_ARSIP_DOKUMEN_SURAT untuk sinkronisasi kelengkapan berkas surat fisik PDF"
              >
                <RefreshCw className={`w-4 h-4 ${isScanningDriveBerkas ? 'animate-spin' : ''}`} />
                <span>{isScanningDriveBerkas ? 'Memindai Drive...' : 'Pindai Berkas Drive'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromDrive}
                disabled={isPullingDrive || isSyncingDrive || isScanningDriveBerkas}
                className="bg-teal-700/80 hover:bg-teal-600 text-white text-xs font-bold py-2 px-3 rounded-xl border border-teal-500/50 shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Tarik data Surat Tugas dari berkas rekap di Drive"
              >
                <CloudDownload className={`w-4 h-4 ${isPullingDrive ? 'animate-bounce' : ''}`} />
                <span>{isPullingDrive ? 'Menarik...' : 'Tarik Data'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveRekapToDrive}
                disabled={isSyncingDrive || isPullingDrive || isScanningDriveBerkas}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Simpan seluruh data riwayat Surat Tugas ke Google Drive"
              >
                <CloudUpload className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                <span>{isSyncingDrive ? 'Menyimpan...' : 'Simpan ke Drive'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnectGoogle}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-teal-600" />
              <span>Hubungkan Akun Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync feedback notification message inside the view */}
      {syncFeedback && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : syncFeedback.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-sky-50 text-sky-800 border-sky-200'
        }`}>
          <div className="flex items-center gap-1.5">
            {syncFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <span className="font-semibold">{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Google Drive Master Template Banner Indicator */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border border-sky-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase">
                Format Resmi Standar Google Drive (TATA USAHA/SURAT)
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Berkas Master: &quot;Surat Tugas&quot;
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Seluruh pencetakan SPT & SPPD menggunakan kop resmi ganda (Logo Kab. Konawe & Tut Wuri), dasar hukum dinas, tabel personil, rincian penugasan, dan pengesahan Kepala Sekolah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isGoogleConnected ? (
            <button
              onClick={() => setIsDriveTemplateModalOpen(true)}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Buka Berkas Drive</span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Hubungkan Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor SPT, nama personil yang ditugaskan, maksud kegiatan, atau tempat tujuan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Table of Duty Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">No. SPT & SPPD</th>
                <th className="py-3 px-3.5">Personil yang Ditugaskan</th>
                <th className="py-3 px-3.5">Maksud Perjalanan Dinas</th>
                <th className="py-3 px-3.5">Tujuan & Waktu</th>
                <th className="py-3 px-3.5">Beban Anggaran</th>
                <th className="py-3 px-3.5">Format & Drive</th>
                <th className="py-3 px-3.5 text-center">Cetak & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <PlaneTakeoff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada data Surat Perintah Tugas. Klik &quot;Buat Surat Perintah Tugas&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3.5 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sky-800">{item.noSuratTugas}</span>
                        <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-semibold font-sans">
                          Kode: {item.kodeKlasifikasi || item.noSuratTugas?.split('/')[0] || '090'}
                        </span>
                      </div>
                      {item.noSPPD && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">SPPD: {item.noSPPD}</div>
                      )}
                      <div className="text-[9px] text-emerald-700 font-sans flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Tersinkron ke Buku Agenda Surat Keluar</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      {item.personil.map((p, idx) => (
                        <div key={idx} className="mb-1 last:mb-0">
                          <span className="font-bold text-slate-900">{p.nama}</span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            NIP. {p.nip || '-'} • {p.jabatan}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-2">{item.maksudTugas}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">Dasar: {item.dasarPenugasan}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" /> {item.tempatTujuan}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatTanggalIndonesia(item.tanggalBerangkat)} ({item.lamaHari} Hari)
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-[11px] font-medium text-slate-700">
                      {item.bebanAnggaran}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {item.driveWebViewLink ? (
                        <a
                          href={item.driveWebViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition"
                        >
                          <Cloud className="w-3 h-3 text-emerald-600" /> Tersimpan di Drive
                        </a>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-sky-600" /> Format &quot;Surat Tugas&quot;
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Cetak / Preview SPT Format Drive */}
                        <button
                          onClick={() => {
                            setSelectedForPrint(item);
                            setPrintMode('spt_only');
                            setSaveSuccessMsg(null);
                          }}
                          className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm transition"
                          title="Pratinjau & Cetak SPT Format Google Drive"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak SPT</span>
                        </button>

                        {/* SPPD Mode */}
                        <button
                          onClick={() => {
                            setSelectedForPrint(item);
                            setPrintMode('sppd_only');
                            setSaveSuccessMsg(null);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-md font-semibold text-[11px] flex items-center gap-1 transition"
                          title="Cetak SPPD Resmi"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>SPPD</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-slate-600 hover:text-amber-600 p-1.5 rounded hover:bg-slate-100 transition"
                          title="Edit Data"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          id={`btn-delete-surat-tugas-${item.id}`}
                          onClick={() => setSuratToDelete(item)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition"
                          title="Hapus Data Surat Tugas"
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

      {/* MODAL: Input / Edit Surat Tugas */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-sky-600" />
                <span>{editingItem ? 'Edit Surat Perintah Tugas' : 'Buat Surat Tugas Dinas (Format Google Drive)'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Kode Klasifikasi Selector - Synchronized with Surat Keluar */}
              <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sky-950 font-bold text-[11px] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-700" />
                    <span>Kode Klasifikasi Surat (Tersinkron dengan Surat Keluar)</span>
                  </label>
                  <span className="text-[10px] text-sky-800 font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-sky-300">
                    {kodeKlasifikasiList.length} Kode Tersedia
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={formData.kodeKlasifikasi || '090'}
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
                      value={formData.kodeKlasifikasi || ''}
                      onChange={(e) => handleKodeKlasifikasiChange(e.target.value)}
                      className="w-full border border-sky-300 rounded-lg p-2 bg-white font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-sky-700 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-sky-600 shrink-0" />
                  <span>Kode otomatis mengubah format awalan nomor surat dan tersinkron ke Buku Agenda Surat Keluar (Sheet 2026).</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Surat Perintah Tugas (SPT)</label>
                  <input
                    type="text"
                    required
                    value={formData.noSuratTugas}
                    onChange={(e) => setFormData({ ...formData, noSuratTugas: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor SPPD</label>
                  <input
                    type="text"
                    value={formData.noSPPD}
                    onChange={(e) => setFormData({ ...formData, noSPPD: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dasar Surat / Penugasan</label>
                <input
                  type="text"
                  required
                  value={formData.dasarPenugasan}
                  onChange={(e) => setFormData({ ...formData, dasarPenugasan: e.target.value })}
                  placeholder="Surat Kepala Dinas Pendidikan dan Kebudayaan Kab. Konawe No. 005/..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Personil Ditugaskan list with PTK Auto-Selector */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>Daftar Personil yang Ditugaskan ({formData.personil?.length || 0})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPersonil}
                    className="text-xs bg-sky-600 text-white font-bold px-2.5 py-1 rounded hover:bg-sky-700 flex items-center gap-1 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Personil
                  </button>
                </div>

                {formData.personil?.map((p, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Personil #{idx + 1}</span>
                        {guruPTKList.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-sky-800 font-semibold flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-sky-600" />
                              Pilih PTK:
                            </span>
                            <select
                              onChange={(e) => handleSelectPTKForPersonil(idx, e.target.value)}
                              defaultValue=""
                              className="text-xs border border-sky-300 rounded-lg py-1 px-2.5 bg-sky-50/60 hover:bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none max-w-xs sm:max-w-md shadow-sm transition"
                            >
                              <option value="" disabled>
                                -- Pilih Nama Guru / PTK --
                              </option>
                              {guruPTKList.map((g) => {
                                const nama = formatPTKDisplayName(g);
                                const nip = g.nip && g.nip !== '-' ? `NIP: ${g.nip}` : 'Non-NIP';
                                const role = g.jabatan || g.mapelUtama || 'Guru';
                                return (
                                  <option key={g.id} value={g.id}>
                                    {nama} • {role} ({nip})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>

                      {formData.personil && formData.personil.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePersonil(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Hapus Personil"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Nama Lengkap & Gelar"
                        value={p.nama || ''}
                        onChange={(e) => handleUpdatePersonil(idx, 'nama', e.target.value)}
                        className="border border-slate-300 rounded p-1.5 font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="NIP (Kosongkan jika bukan PNS)"
                        value={p.nip || ''}
                        onChange={(e) => handleUpdatePersonil(idx, 'nip', e.target.value)}
                        className="border border-slate-300 rounded p-1.5 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Pangkat / Golongan (misal: Penata, III/c)"
                        value={p.pangkatGol || ''}
                        onChange={(e) => handleUpdatePersonil(idx, 'pangkatGol', e.target.value)}
                        className="border border-slate-300 rounded p-1.5"
                      />
                      <input
                        type="text"
                        placeholder="Jabatan (misal: Guru Mata Pelajaran)"
                        value={p.jabatan || ''}
                        onChange={(e) => handleUpdatePersonil(idx, 'jabatan', e.target.value)}
                        className="border border-slate-300 rounded p-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Maksud Tugas / Kegiatan Dinas</label>
                <textarea
                  rows={2}
                  required
                  value={formData.maksudTugas || ''}
                  onChange={(e) => setFormData({ ...formData, maksudTugas: e.target.value })}
                  placeholder="Mengikuti Workshop Penguatan Literasi dan Numerasi Tingkat SMP se-Kabupaten Konawe..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempat Tujuan Pelaksanaan</label>
                  <input
                    type="text"
                    required
                    value={formData.tempatTujuan || ''}
                    onChange={(e) => setFormData({ ...formData, tempatTujuan: e.target.value })}
                    placeholder="Aula Dinas Pendidikan dan Kebudayaan Kab. Konawe"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Alat Angkutan yang Digunakan</label>
                  <select
                    value={formData.alatAngkut || 'Kendaraan Dinas'}
                    onChange={(e) => setFormData({ ...formData, alatAngkut: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
                  >
                    <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                    <option value="Kendaraan Umum">Kendaraan Umum</option>
                    <option value="Sepeda Motor">Sepeda Motor</option>
                    <option value="Pesawat Udara">Pesawat Udara</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tgl Berangkat</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalBerangkat || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalBerangkat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tgl Kembali</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalKembali || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalKembali: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lama Hari</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lamaHari ?? 1}
                    onChange={(e) => setFormData({ ...formData, lamaHari: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempat &amp; Tanggal Penetapan</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Unggulino"
                      value={formData.tempatPenetapan || 'Unggulino'}
                      onChange={(e) => setFormData({ ...formData, tempatPenetapan: e.target.value })}
                      className="border border-slate-300 rounded p-1.5"
                    />
                    <input
                      type="date"
                      value={formData.tanggalSurat || formData.tanggalBerangkat || ''}
                      onChange={(e) => handleTanggalSuratChange(e.target.value)}
                      className="border border-slate-300 rounded p-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pembebanan Anggaran</label>
                  <select
                    value={formData.bebanAnggaran || 'Dana BOS SMPN 2 Puriala'}
                    onChange={(e) => setFormData({ ...formData, bebanAnggaran: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="Dana BOS SMPN 2 Puriala">Dana BOS SMPN 2 Puriala</option>
                    <option value="APBD Kab. Konawe">APBD Kab. Konawe</option>
                    <option value="Instansi Pengundang">Instansi Pengundang</option>
                    <option value="Swadaya Pribadi">Swadaya Pribadi</option>
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-md"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan SPT & SPPD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Official Google Drive Template Preview & Print */}
      {selectedForPrint && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto light-scrollbar">
            {/* Top Toolbar (No-Print) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-300 mb-4 no-print bg-white p-3.5 rounded-xl shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>SURAT PERINTAH TUGAS (SPT) RESMI</span>
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Format Master: Google Drive TATA USAHA/SURAT
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Nomor: {selectedForPrint.noSuratTugas}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Print Mode Switch */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => setPrintMode('spt_only')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                      printMode === 'spt_only'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SPT Saja
                  </button>
                  <button
                    onClick={() => setPrintMode('sppd_only')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                      printMode === 'sppd_only'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SPPD (Hal 1 &amp; 2)
                  </button>
                  <button
                    onClick={() => setPrintMode('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                      printMode === 'all'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SPT + SPPD Lengkap
                  </button>
                </div>

                {/* Print Button */}
                <button
                  onClick={() => handlePrintDocument(selectedForPrint, printMode)}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {printMode === 'spt_only'
                      ? 'Cetak SPT'
                      : printMode === 'sppd_only'
                      ? 'Cetak SPPD (Hal 1 & 2)'
                      : 'Cetak SPT + SPPD'}
                  </span>
                </button>

                {/* Download Word (.doc) */}
                <button
                  onClick={() => downloadSuratTugasDocFile(selectedForPrint, identitasSekolah, printMode)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  title="Unduh Format Microsoft Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word (.doc)</span>
                </button>

                {/* Download HTML */}
                <button
                  onClick={() => downloadSuratTugasHtmlFile(selectedForPrint, identitasSekolah, printMode)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Unduh Berkas HTML Standar"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </button>

                {/* Save to Google Drive */}
                <button
                  onClick={() => handleSaveToDrive(selectedForPrint)}
                  disabled={isSavingToDrive}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  {isSavingToDrive ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan ke Drive</span>
                </button>

                <button
                  onClick={() => setSelectedForPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {saveSuccessMsg}
                </span>
                {selectedForPrint.driveWebViewLink && (
                  <a
                    href={selectedForPrint.driveWebViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <span>Buka di Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Document Frame / Canvas (Faithful to Google Drive TATA USAHA/SURAT "Surat Tugas" & "SPPD") */}
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* PAGE 1: SURAT PERINTAH TUGAS (SPT) */}
              {(printMode === 'spt_only' || printMode === 'all') && (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 text-slate-900 font-serif leading-relaxed">
                  {/* Kop Surat Resmi Ganda */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-1">
                    <img
                      src={LOGO_KABUPATEN_KONAWE_BASE64}
                      alt="Logo Konawe"
                      className="w-16 h-16 object-contain"
                    />
                    <div className="text-center flex-grow px-2">
                      <p className="font-bold text-xs uppercase tracking-wider text-black m-0">
                        PEMERINTAH KABUPATEN KONAWE
                      </p>
                      <p className="font-bold text-sm uppercase tracking-wider text-black m-0">
                        DINAS PENDIDIKAN DAN KEBUDAYAAN
                      </p>
                      <h2 className="font-extrabold text-base uppercase tracking-wide text-black m-0 mt-0.5">
                        {identitasSekolah.namaSekolah || 'SMP NEGERI 2 PURIALA'}
                      </h2>
                      <p className="text-[10px] text-slate-800 m-0 mt-0.5">
                        {identitasSekolah.alamat || 'Jl. Poros Puriala - Motaha, Desa Unggulino, Kec. Puriala, Kab. Konawe 93354'}
                      </p>
                      <p className="text-[9.5px] italic text-slate-700 m-0">
                        NPSN: {identitasSekolah.npsn || '40402500'} | Email: {identitasSekolah.email || 'spendupuriala@gmail.com'}
                      </p>
                    </div>
                    <img
                      src={LOGO_TUT_WURI_BASE64}
                      alt="Logo Tut Wuri"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="border-b border-black mb-5"></div>

                  {/* Judul & Nomor Surat */}
                  <div className="text-center mb-5">
                    <h3 className="font-bold text-sm uppercase underline tracking-wider text-black m-0">
                      SURAT PERINTAH TUGAS
                    </h3>
                    <p className="font-bold text-xs mt-0.5 text-black">
                      Nomor : {selectedForPrint.noSuratTugas}
                    </p>
                  </div>

                  {/* Dasar */}
                  <div className="grid grid-cols-[80px_10px_1fr] text-xs mb-3 text-black">
                    <span className="font-bold">Dasar</span>
                    <span>:</span>
                    <span>{selectedForPrint.dasarPenugasan}</span>
                  </div>

                  {/* Memerintahkan */}
                  <div className="text-center font-bold text-xs uppercase tracking-widest my-3 text-black">
                    MEMERINTAHKAN :
                  </div>

                  {/* Kepada */}
                  <div className="grid grid-cols-[80px_10px_1fr] text-xs mb-3 text-black">
                    <span className="font-bold">Kepada</span>
                    <span>:</span>
                    <div>
                      {selectedForPrint.personil.length > 1 ? (
                        <table className="w-full border-collapse border border-slate-700 text-xs my-1">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-700 p-1 w-8 text-center">No</th>
                              <th className="border border-slate-700 p-1">Nama Lengkap &amp; NIP</th>
                              <th className="border border-slate-700 p-1">Pangkat / Gol.</th>
                              <th className="border border-slate-700 p-1">Jabatan / Unit Kerja</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedForPrint.personil.map((p, idx) => (
                              <tr key={idx}>
                                <td className="border border-slate-700 p-1 text-center font-bold">{idx + 1}.</td>
                                <td className="border border-slate-700 p-1">
                                  <div className="font-bold">{p.nama}</div>
                                  <div className="text-[10px] font-mono">NIP. {p.nip || '-'}</div>
                                </td>
                                <td className="border border-slate-700 p-1">{p.pangkatGol || '-'}</td>
                                <td className="border border-slate-700 p-1">{p.jabatan || 'Guru'} / SMPN 2 Puriala</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="space-y-1">
                          <div className="grid grid-cols-[110px_10px_1fr]">
                            <span>1. Nama Lengkap</span>
                            <span>:</span>
                            <span className="font-bold">{selectedForPrint.personil[0]?.nama || '-'}</span>
                          </div>
                          <div className="grid grid-cols-[110px_10px_1fr]">
                            <span>2. NIP</span>
                            <span>:</span>
                            <span className="font-mono">{selectedForPrint.personil[0]?.nip || '-'}</span>
                          </div>
                          <div className="grid grid-cols-[110px_10px_1fr]">
                            <span>3. Pangkat / Gol.</span>
                            <span>:</span>
                            <span>{selectedForPrint.personil[0]?.pangkatGol || '-'}</span>
                          </div>
                          <div className="grid grid-cols-[110px_10px_1fr]">
                            <span>4. Jabatan</span>
                            <span>:</span>
                            <span>{selectedForPrint.personil[0]?.jabatan || 'Kepala Sekolah'}</span>
                          </div>
                          <div className="grid grid-cols-[110px_10px_1fr]">
                            <span>5. Unit Kerja</span>
                            <span>:</span>
                            <span>SMP Negeri 2 Puriala</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Untuk */}
                  <div className="grid grid-cols-[80px_10px_1fr] text-xs mb-4 text-black">
                    <span className="font-bold">Untuk</span>
                    <span>:</span>
                    <ol className="list-decimal pl-4 space-y-1.5 text-justify">
                      <li>{selectedForPrint.maksudTugas}</li>
                      <li>
                        Tempat Pelaksanaan Tugas : <strong>{selectedForPrint.tempatTujuan}</strong>
                      </li>
                      <li>
                        Lamanya Penugasan : <strong>{selectedForPrint.lamaHari} ({terbilangHari(selectedForPrint.lamaHari)}) hari</strong>, terhitung mulai tanggal <strong>{formatTanggalIndonesia(selectedForPrint.tanggalBerangkat)}</strong> sampai dengan <strong>{formatTanggalIndonesia(selectedForPrint.tanggalKembali)}</strong>.
                      </li>
                      <li>
                        Alat angkutan yang digunakan : <strong>{selectedForPrint.alatAngkut || 'Kendaraan Dinas'}</strong>.
                      </li>
                      <li>
                        Pembebanan Anggaran : Biaya penugasan dibebankan pada <strong>{selectedForPrint.bebanAnggaran || 'Dana BOS SMPN 2 Puriala'}</strong>.
                      </li>
                      <li>
                        Setelah selesai melaksanakan tugas, agar segera membuat dan melaporkan hasil pelaksanaan tugas secara tertulis kepada Kepala Sekolah.
                      </li>
                      <li>
                        Surat Perintah Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan dengan penuh rasa tanggung jawab dan dedikasi tinggi.
                      </li>
                    </ol>
                  </div>

                  {/* Tanda Tangan */}
                  <div className="flex justify-end pt-4 text-xs text-black">
                    <div className="text-center w-64">
                      <p>Dikeluarkan di : {selectedForPrint.tempatPenetapan || 'Unggulino'}</p>
                      <p>Pada tanggal : {formatTanggalIndonesia(selectedForPrint.tanggalSurat || selectedForPrint.tanggalBerangkat)}</p>
                      <p className="font-bold mt-1">Kepala Sekolah,</p>
                      <div className="h-16"></div>
                      <p className="font-bold underline uppercase">
                        {identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si'}
                      </p>
                      <p>{identitasSekolah.pangkatKepsek || 'Pembina, IV/a'}</p>
                      <p className="font-mono text-[11px]">NIP. {identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012'}</p>
                    </div>
                  </div>

                  {/* Tembusan */}
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-700">
                    <p className="font-bold underline mb-1">Tembusan disampaikan kepada Yth:</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Kepala Dinas Pendidikan dan Kebudayaan Kabupaten Konawe di Unaaha;</li>
                      <li>Pengawas Pembina SMP Dinas Dikbud Kabupaten Konawe;</li>
                      <li>Yang bersangkutan untuk dilaksanakan;</li>
                      <li>Arsip Sekolah.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* PAGE 2: SPPD HALAMAN 1 (LEMBAR DEPAN / MUKA) */}
              {(printMode === 'sppd_only' || printMode === 'all') && (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 text-slate-900 font-serif leading-relaxed">
                  {/* Badge Identifikasi Sheet Google Drive */}
                  <div className="bg-sky-50 border border-sky-200 text-sky-900 text-[10px] font-bold px-3 py-1 rounded-md mb-4 flex items-center justify-between font-sans">
                    <span>Google Drive: Folder TATA USAHA/SURAT/SURAT KELUAR &gt; File &quot;SPPD&quot;</span>
                    <span className="bg-sky-600 text-white px-2 py-0.5 rounded">Sheet: SPPD HAL-1 (Lembar Depan)</span>
                  </div>

                  {/* Kop Surat Resmi Ganda */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-1">
                    <img
                      src={LOGO_KABUPATEN_KONAWE_BASE64}
                      alt="Logo Konawe"
                      className="w-16 h-16 object-contain"
                    />
                    <div className="text-center flex-grow px-2">
                      <p className="font-bold text-xs uppercase tracking-wider text-black m-0">
                        PEMERINTAH KABUPATEN KONAWE
                      </p>
                      <p className="font-bold text-sm uppercase tracking-wider text-black m-0">
                        DINAS PENDIDIKAN DAN KEBUDAYAAN
                      </p>
                      <h2 className="font-extrabold text-base uppercase tracking-wide text-black m-0 mt-0.5">
                        {identitasSekolah.namaSekolah || 'SMP NEGERI 2 PURIALA'}
                      </h2>
                      <p className="text-[10px] text-slate-800 m-0 mt-0.5">
                        {identitasSekolah.alamat || 'Jl. Poros Puriala - Motaha, Desa Unggulino, Kec. Puriala, Kab. Konawe 93354'}
                      </p>
                    </div>
                    <img
                      src={LOGO_TUT_WURI_BASE64}
                      alt="Logo Tut Wuri"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="border-b border-black mb-3"></div>

                  <div className="flex justify-end text-[10px] mb-2">
                    <table>
                      <tbody>
                        <tr><td>Lembar Ke</td><td>:</td><td>I (Satu)</td></tr>
                        <tr><td>Kode No.</td><td>:</td><td>094</td></tr>
                        <tr><td>Nomor SPPD</td><td>:</td><td className="font-bold">{selectedForPrint.noSPPD || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center mb-3">
                    <h3 className="font-bold text-sm uppercase underline text-black m-0">SURAT PERINTAH PERJALANAN DINAS</h3>
                    <p className="font-bold text-xs text-black m-0">( S P P D )</p>
                  </div>

                  <table className="w-full border-collapse border border-slate-700 text-xs mb-4">
                    <tbody>
                      <tr>
                        <td className="border border-slate-700 p-1.5 w-6 text-center font-bold">1.</td>
                        <td className="border border-slate-700 p-1.5 w-52">Pejabat Berwenang yang Memberi Perintah</td>
                        <td className="border border-slate-700 p-1.5 font-bold">Kepala SMP Negeri 2 Puriala</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">2.</td>
                        <td className="border border-slate-700 p-1.5">Nama Pegawai yang Diperintahkan</td>
                        <td className="border border-slate-700 p-1.5 font-bold">
                          {selectedForPrint.personil[0]?.nama || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">3.</td>
                        <td className="border border-slate-700 p-1.5">
                          a. Pangkat dan Golongan<br />b. Jabatan / Instansi<br />c. Tingkat Biaya Perjalanan Dinas
                        </td>
                        <td className="border border-slate-700 p-1.5">
                          a. {selectedForPrint.personil[0]?.pangkatGol || '-'}<br />
                          b. {selectedForPrint.personil[0]?.jabatan || 'Guru'} / SMP Negeri 2 Puriala<br />
                          c. Tingkat C (Standar Perjalanan Dinas Daerah)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">4.</td>
                        <td className="border border-slate-700 p-1.5">Maksud Perjalanan Dinas</td>
                        <td className="border border-slate-700 p-1.5">{selectedForPrint.maksudTugas}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">5.</td>
                        <td className="border border-slate-700 p-1.5">Alat Angkutan yang Dipergunakan</td>
                        <td className="border border-slate-700 p-1.5">{selectedForPrint.alatAngkut || 'Kendaraan Dinas'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">6.</td>
                        <td className="border border-slate-700 p-1.5">a. Tempat Berangkat<br />b. Tempat Tujuan</td>
                        <td className="border border-slate-700 p-1.5">
                          a. SMP Negeri 2 Puriala (Desa Unggulino)<br />
                          b. <strong>{selectedForPrint.tempatTujuan}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">7.</td>
                        <td className="border border-slate-700 p-1.5">
                          a. Lamanya Perjalanan Dinas<br />b. Tanggal Berangkat<br />c. Tanggal Harus Kembali
                        </td>
                        <td className="border border-slate-700 p-1.5">
                          a. {selectedForPrint.lamaHari} ({terbilangHari(selectedForPrint.lamaHari)}) Hari<br />
                          b. {formatTanggalIndonesia(selectedForPrint.tanggalBerangkat)}<br />
                          c. {formatTanggalIndonesia(selectedForPrint.tanggalKembali)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">8.</td>
                        <td className="border border-slate-700 p-1.5">Pengikut / Personil Pendamping</td>
                        <td className="border border-slate-700 p-1.5">
                          {selectedForPrint.personil.length > 1 ? (
                            <ol className="list-decimal pl-4">
                              {selectedForPrint.personil.slice(1).map((p, idx) => (
                                <li key={idx}><strong>{p.nama}</strong> ({p.jabatan || 'Guru'}) - NIP: {p.nip || '-'}</li>
                              ))}
                            </ol>
                          ) : 'Tidak Ada (-)'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">9.</td>
                        <td className="border border-slate-700 p-1.5">
                          Pembebanan Anggaran<br />
                          a. Instansi<br />
                          b. Mata Anggaran / Akun
                        </td>
                        <td className="border border-slate-700 p-1.5 font-bold">
                          <br />
                          a. SMP Negeri 2 Puriala<br />
                          b. {selectedForPrint.bebanAnggaran || 'Dana BOS SMPN 2 Puriala'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-1.5 text-center font-bold">10.</td>
                        <td className="border border-slate-700 p-1.5">Keterangan Lain-lain</td>
                        <td className="border border-slate-700 p-1.5">Dasar: {selectedForPrint.dasarPenugasan}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-2 text-xs text-black">
                    <div className="text-center w-64">
                      <p>Dikeluarkan di : {selectedForPrint.tempatPenetapan || 'Unggulino'}</p>
                      <p>Pada tanggal : {formatTanggalIndonesia(selectedForPrint.tanggalSurat || selectedForPrint.tanggalBerangkat)}</p>
                      <p className="font-bold mt-1">Kepala Sekolah / Pejabat Pembuat Komitmen,</p>
                      <div className="h-14"></div>
                      <p className="font-bold underline uppercase">
                        {identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si'}
                      </p>
                      <p>{identitasSekolah.pangkatKepsek || 'Pembina, IV/a'}</p>
                      <p className="font-mono text-[11px]">NIP. {identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 3: SPPD HALAMAN 2 (LEMBAR BELAKANG / VISUM & CATATAN PENGESAHAN) */}
              {(printMode === 'sppd_only' || printMode === 'all') && (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 text-slate-900 font-serif leading-relaxed">
                  {/* Badge Identifikasi Sheet Google Drive */}
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-bold px-3 py-1 rounded-md mb-4 flex items-center justify-between font-sans">
                    <span>Google Drive: Folder TATA USAHA/SURAT/SURAT KELUAR &gt; File &quot;SPPD&quot;</span>
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded">Sheet: SPPD HAL-2 (Lembar Belakang / Visum)</span>
                  </div>

                  {/* Header Halaman 2 */}
                  <div className="flex justify-end text-[10px] mb-3 border-b border-slate-300 pb-2">
                    <table>
                      <tbody>
                        <tr><td>SPPD No.</td><td>:</td><td className="font-bold">{selectedForPrint.noSPPD || '-'}</td></tr>
                        <tr><td>Berangkat dari</td><td>:</td><td>SMP Negeri 2 Puriala</td></tr>
                        <tr><td>Ke (Tempat Tujuan)</td><td>:</td><td className="font-bold">{selectedForPrint.tempatTujuan}</td></tr>
                        <tr><td>Pada Tanggal</td><td>:</td><td>{formatTanggalIndonesia(selectedForPrint.tanggalBerangkat)}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tabel Visum Resmi */}
                  <table className="w-full border-collapse border border-slate-700 text-[11px] mb-4">
                    <tbody>
                      {/* KOLOM I & II */}
                      <tr>
                        <td className="border border-slate-700 p-2.5 w-1/2 align-top">
                          <div className="font-bold mb-1">I. Tiba di : {selectedForPrint.tempatTujuan}</div>
                          <div>Pada tanggal : {formatTanggalIndonesia(selectedForPrint.tanggalBerangkat)}</div>
                          <div className="mt-2 text-slate-600">Kepala / Pejabat yang dituju,</div>
                          <div className="h-16"></div>
                          <div className="border-b border-dotted border-slate-500 w-44"></div>
                          <div className="text-[10px] text-slate-500 mt-0.5">NIP.</div>
                        </td>
                        <td className="border border-slate-700 p-2.5 w-1/2 align-top">
                          <div className="font-bold mb-1">II. Berangkat dari : {selectedForPrint.tempatTujuan}</div>
                          <div>Ke : SMP Negeri 2 Puriala</div>
                          <div>Pada tanggal : {formatTanggalIndonesia(selectedForPrint.tanggalKembali)}</div>
                          <div className="mt-2 text-slate-600">Kepala / Pejabat yang dituju,</div>
                          <div className="h-16"></div>
                          <div className="border-b border-dotted border-slate-500 w-44"></div>
                          <div className="text-[10px] text-slate-500 mt-0.5">NIP.</div>
                        </td>
                      </tr>

                      {/* KOLOM III & IV */}
                      <tr>
                        <td className="border border-slate-700 p-2.5 w-1/2 align-top">
                          <div className="font-bold mb-1">III. Tiba di : SMP Negeri 2 Puriala</div>
                          <div>Pada tanggal : {formatTanggalIndonesia(selectedForPrint.tanggalKembali)}</div>
                          <div className="mt-2 font-bold">Kepala Sekolah,</div>
                          <div className="h-14"></div>
                          <div className="font-bold underline uppercase">{identitasSekolah.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si'}</div>
                          <div className="text-[10px]">NIP. {identitasSekolah.nipKepalaSekolah || '19710110 199412 1 0012'}</div>
                        </td>
                        <td className="border border-slate-700 p-2.5 w-1/2 align-top">
                          <div className="font-bold mb-1">IV. CATATAN LAIN-LAIN</div>
                          <div className="text-[10.5px] text-slate-700 leading-relaxed">
                            Perjalanan dinas ini dilaksanakan sesuai dengan Surat Perintah Tugas (SPT) Nomor: <strong>{selectedForPrint.noSuratTugas}</strong> dan ketentuan peraturan perundang-undangan yang berlaku.
                          </div>
                        </td>
                      </tr>

                      {/* KOLOM V */}
                      <tr>
                        <td colSpan={2} className="border border-slate-700 p-2.5 bg-slate-50 text-[10px] leading-relaxed">
                          <div className="font-bold mb-1">V. PERHATIAN :</div>
                          <div className="italic text-justify">
                            Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara mendapat rugi akibat kesalahan, kealpaan dan kelalaiannya.
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Google Drive Folder TATA USAHA/SURAT Inspection */}
      {isDriveTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" />
                <span>Google Drive: Folder TATA USAHA / SURAT &amp; SPPD</span>
              </h3>
              <button onClick={() => setIsDriveTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-slate-800 space-y-1.5">
                <div className="font-bold text-sky-950 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Struktur Folder &amp; Berkas Master Drive</span>
                </div>
                <p className="text-slate-600">
                  Folder master Google Drive:{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded text-sky-800 font-bold font-mono">
                    TATA USAHA / SURAT
                  </code>{' '}
                  dan subfolder{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded text-sky-800 font-bold font-mono">
                    TATA USAHA / SURAT / SURAT KELUAR
                  </code>
                  .
                </p>
              </div>

              {/* Status Berkas Master Surat Tugas */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>1. Berkas Master &quot;Surat Tugas&quot; (Folder TATA USAHA/SURAT):</span>
                  <button
                    onClick={loadDriveTemplates}
                    disabled={isLoadingDrive}
                    className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                    <span>Periksa Ulang</span>
                  </button>
                </div>

                {driveSuratTugasTemplate ? (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{driveSuratTugasTemplate.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Folder: TATA USAHA/SURAT • Ukuran: {driveSuratTugasTemplate.size}
                        </div>
                      </div>
                    </div>
                    {driveSuratTugasTemplate.webViewLink && (
                      <a
                        href={driveSuratTugasTemplate.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-600 text-center">
                    <FileCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <span>Format &quot;Surat Tugas&quot; aktif dan tersinkronisasi.</span>
                  </div>
                )}
              </div>

              {/* Status Berkas Master SPPD */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>2. Berkas Master &quot;SPPD&quot; (Folder TATA USAHA/SURAT/SURAT KELUAR):</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                    2 Sheet: SPPD HAL-1 &amp; SPPD HAL-2
                  </span>
                </div>

                {driveSPPDTemplate ? (
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{driveSPPDTemplate.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Folder: TATA USAHA/SURAT/SURAT KELUAR • Sheet: SPPD HAL-1 + SPPD HAL-2
                        </div>
                      </div>
                    </div>
                    {driveSPPDTemplate.webViewLink && (
                      <a
                        href={driveSPPDTemplate.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs bg-indigo-50 text-indigo-800 font-bold px-2.5 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <span>Buka di Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 text-slate-700 text-xs">
                    <div className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">Format Master SPPD Aktif:</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Struktur 2 lembar otomatis menggabungkan <strong>Sheet SPPD HAL-1</strong> (Lembar Muka 10 butir) dan <strong>Sheet SPPD HAL-2</strong> (Lembar Belakang / Visum &amp; Catatan Pengesahan).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* List of Files in TATA USAHA/SURAT */}
              {isGoogleConnected && driveFiles.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                  <div className="font-bold text-slate-800 text-[11px]">
                    Daftar Berkas Terkini di Folder TATA USAHA / SURAT ({driveFiles.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 light-scrollbar">
                    {driveFiles.map((f) => (
                      <div
                        key={f.id}
                        className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="truncate font-medium">{f.name}</span>
                        </div>
                        {f.webViewLink && (
                          <a
                            href={f.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:text-sky-800 font-semibold shrink-0 ml-2"
                          >
                            Lihat
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDriveTemplateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Surat Tugas */}
      {suratToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Hapus Surat Tugas Dinas?</h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus data Surat Perintah Tugas dan otomatis memperbarui sinkronisasi cloud.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">No. Surat Tugas:</span>
                <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px] truncate max-w-[200px]">
                  {suratToDelete.noSuratTugas}
                </span>
              </div>
              {suratToDelete.noSPPD && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500">No. SPPD:</span>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] truncate max-w-[200px]">
                    {suratToDelete.noSPPD}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Maksud Tugas:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {suratToDelete.maksudTugas}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">Tujuan:</span>
                <span className="text-slate-700 truncate max-w-[200px]">{suratToDelete.tempatTujuan}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-batal-hapus-surat-tugas"
                onClick={() => setSuratToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-konfirmasi-hapus-surat-tugas"
                onClick={() => {
                  onDelete(suratToDelete.id);
                  if (selectedForPrint?.id === suratToDelete.id) {
                    setSelectedForPrint(null);
                  }
                  setSuratToDelete(null);
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
