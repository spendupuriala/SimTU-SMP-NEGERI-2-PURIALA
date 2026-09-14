import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Users,
  Printer,
  Download,
  Cloud,
  CloudCheck,
  RefreshCw,
  Send,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Eye,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  IdentitasSekolah,
  SKPanitiaASTS,
  SKPanitiaASTSMember,
  JabatanPanitiaASTS,
  PTK,
  SuratKeluar,
  KodeKlasifikasiSurat,
} from '../types';
import {
  findSKPanitiaASTSTemplateInDrive,
  uploadSKPanitiaASTSDocumentToDrive,
  GoogleDriveFile,
} from '../services/googleDrive';
import {
  recordSKPanitiaASTSToAgendaSuratKeluar,
  DEFAULT_KODE_KLASIFIKASI,
} from '../services/googleSheets';
import { extractNomorUrutFromNoSurat } from '../utils/suratTemplates';
import {
  TEMPLATE_DRIVE_TITLE_SK_PANITIA_ASTS,
  DAFTAR_JABATAN_PANITIA_ASTS,
  DEFAULT_MENIMBANG_SK_PANITIA_ASTS,
  DEFAULT_MENGINGAT_SK_PANITIA_ASTS,
  DEFAULT_MEMPERHATIKAN_SK_PANITIA_ASTS,
  generateNomorSuratPanitiaASTS,
  buildDefaultSusunanPanitiaASTS,
  generateSKPanitiaASTSFullHtml,
  downloadSKPanitiaASTSHtmlFile,
  printSKPanitiaASTSDirectly,
} from '../utils/skPanitiaASTSTemplates';

/**
 * Mencari nomor urut surat keluar terakhir (tertinggi).
 * Tidak memasukkan record SK ASTS ini sendiri jika sudah pernah tercatat.
 */
export const getLatestSuratKeluarNumber = (
  list: SuratKeluar[],
  currentSKId?: string,
  currentNoSK?: string,
  currentAgendaSuratId?: string
): number => {
  let highest = 0;
  if (!list || !Array.isArray(list)) return 0;

  for (const s of list) {
    if (!s) continue;
    // Lewati jika ini adalah data SK ASTS itu sendiri yang sedang diedit
    const isThisASTSSK =
      (currentAgendaSuratId && s.id === currentAgendaSuratId) ||
      (currentSKId && s.id === currentSKId) ||
      (s.id && s.id.startsWith('sk-panitia-asts')) ||
      (currentNoSK && s.noSurat === currentNoSK && s.noSurat !== '') ||
      (s.noAgenda && s.noAgenda.includes('SK-ASTS'));

    if (isThisASTSSK) {
      continue;
    }

    // 1. Ekstrak dari noAgenda (misal: "075/SK/2026", "75", "075", "75/SK")
    if (s.noAgenda) {
      const matchAgenda = String(s.noAgenda).match(/^(\d+)/);
      if (matchAgenda) {
        const num = parseInt(matchAgenda[1], 10);
        if (!isNaN(num) && num > highest && num < 1900) {
          highest = num;
        }
      }
    }

    // 2. Ekstrak dari noSurat (misal: "400.3.12.2/075/SMP-02/PRL/IX/2026" atau "400.3.5.1/75/...")
    if (s.noSurat) {
      const parts = String(s.noSurat).split('/');
      if (parts.length >= 2) {
        const matchSecond = parts[1].trim().match(/^(\d+)/);
        if (matchSecond) {
          const num = parseInt(matchSecond[1], 10);
          if (!isNaN(num) && num > highest && num < 1900) {
            highest = num;
          }
        }
      }
      const extracted = extractNomorUrutFromNoSurat(s.noSurat);
      if (extracted !== null && extracted > highest && extracted < 1900) {
        highest = extracted;
      }
    }
  }

  return highest;
};

interface SKPanitiaASTSModuleProps {
  identitasSekolah: IdentitasSekolah;
  guruPTKList?: PTK[];
  suratKeluarList?: SuratKeluar[];
  kodeKlasifikasiList?: KodeKlasifikasiSurat[];
  onAddSuratKeluar?: (surat: SuratKeluar) => void;
  googleToken?: string | null;
  googleUser?: any;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  savedSK?: SKPanitiaASTS;
  onSaveSK?: (sk: SKPanitiaASTS) => void;
}

export const SKPanitiaASTSModule: React.FC<SKPanitiaASTSModuleProps> = ({
  identitasSekolah,
  guruPTKList = [],
  suratKeluarList = [],
  kodeKlasifikasiList = DEFAULT_KODE_KLASIFIKASI,
  onAddSuratKeluar,
  googleToken,
  googleUser: _googleUser,
  isGoogleConnected = false,
  onConnectGoogle,
  savedSK,
  onSaveSK,
}) => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'panitia' | 'preview' | 'sync-info'>('form');

  // Document state
  const [tahunAjaran, setTahunAjaran] = useState<string>(savedSK?.tahunAjaran || '2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(savedSK?.semester || 'Ganjil');

  // Tracking persistence for Drive & Agenda to ensure overwrite logic
  const [tercatatDiAgenda, setTercatatDiAgenda] = useState<boolean>(savedSK?.tercatatDiAgenda || false);
  const [agendaSuratId, setAgendaSuratId] = useState<string | undefined>(savedSK?.agendaSuratId);
  const [driveFileId, setDriveFileId] = useState<string | undefined>(savedSK?.driveFileId);
  const [driveWebViewLink, setDriveWebViewLink] = useState<string | undefined>(savedSK?.driveWebViewLink);

  // Perhitungan nomor surat keluar terakhir (maksimum) dari buku agenda surat keluar
  const latestSuratKeluarNomor = React.useMemo(() => {
    return getLatestSuratKeluarNumber(
      suratKeluarList,
      savedSK?.id,
      savedSK?.noSK,
      agendaSuratId || savedSK?.agendaSuratId
    );
  }, [suratKeluarList, savedSK?.id, savedSK?.noSK, agendaSuratId, savedSK?.agendaSuratId]);

  // Nomor urut berikutnya otomatis: nomor surat keluar terakhir + 1 (misal terakhir 75 -> berikutnya 76)
  const nextNomorUrutOtomatis = latestSuratKeluarNomor > 0 ? latestSuratKeluarNomor + 1 : 76;

  const [nomorUrut, setNomorUrut] = useState<number>(() => {
    // Jika SK ini sudah tercatat sebelumnya di agenda, pertahankan nomor urut yang sudah dicatat
    if (savedSK?.tercatatDiAgenda && savedSK?.nomorUrut) {
      return savedSK.nomorUrut;
    }
    // Jika belum tercatat, nomor urut selalu menyesuaikan dengan surat keluar terakhir + 1
    return nextNomorUrutOtomatis;
  });

  const [tanggalSK, setTanggalSK] = useState<string>(savedSK?.tanggalSK || '2026-09-14');
  const [tempatPenetapan, setTempatPenetapan] = useState<string>(savedSK?.tempatPenetapan || 'Unggulino');
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState<string>(
    savedSK?.tanggalPelaksanaan || '22 s.d 27 September 2026'
  );

  // Kode Klasifikasi state (Synchronized with Surat Keluar dropdown)
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState<string>(
    savedSK?.kodeKlasifikasi || '400.3.12.2'
  );

  // Active classification list memo (guaranteeing current selected code is available)
  const activeKodeList = React.useMemo(() => {
    const list =
      kodeKlasifikasiList && kodeKlasifikasiList.length > 0
        ? kodeKlasifikasiList
        : DEFAULT_KODE_KLASIFIKASI;
    if (kodeKlasifikasi && !list.some((k) => k.kode === kodeKlasifikasi)) {
      return [
        {
          kode: kodeKlasifikasi,
          nama: 'Klasifikasi SK ASTS / Penilaian',
          kategori: 'Penilaian / Profil Sekolah',
        },
        ...list,
      ];
    }
    return list;
  }, [kodeKlasifikasiList, kodeKlasifikasi]);

  const currentKodeObj = React.useMemo(() => {
    return activeKodeList.find((k) => k.kode === kodeKlasifikasi);
  }, [activeKodeList, kodeKlasifikasi]);

  const [noSK, setNoSK] = useState<string>(() => {
    return savedSK?.noSK || generateNomorSuratPanitiaASTS(nomorUrut, tanggalSK, kodeKlasifikasi);
  });

  // Sinkronisasi otomatis nomor urut dengan surat keluar terakhir jika belum tercatat di agenda
  useEffect(() => {
    if (!tercatatDiAgenda) {
      if (nomorUrut !== nextNomorUrutOtomatis) {
        setNomorUrut(nextNomorUrutOtomatis);
        setNoSK(generateNomorSuratPanitiaASTS(nextNomorUrutOtomatis, tanggalSK, kodeKlasifikasi));
      }
    }
  }, [nextNomorUrutOtomatis, tercatatDiAgenda]);

  // Handlers for dynamic number generation
  const handleKodeKlasifikasiChange = (newKode: string) => {
    setKodeKlasifikasi(newKode);
    setNoSK(generateNomorSuratPanitiaASTS(nomorUrut, tanggalSK, newKode));
  };

  const handleNomorUrutChange = (val: number) => {
    setNomorUrut(val);
    setNoSK(generateNomorSuratPanitiaASTS(val, tanggalSK, kodeKlasifikasi));
  };

  const handleTanggalSKChange = (val: string) => {
    setTanggalSK(val);
    setNoSK(generateNomorSuratPanitiaASTS(nomorUrut, val, kodeKlasifikasi));
  };

  const handleResetNomorBaku = () => {
    const generated = generateNomorSuratPanitiaASTS(nomorUrut, tanggalSK, kodeKlasifikasi);
    setNoSK(generated);
    showNotification(`Nomor surat di-reset ke format baku: ${generated}`, 'info');
  };

  const handleSyncWithSuratKeluar = () => {
    setNomorUrut(nextNomorUrutOtomatis);
    const generated = generateNomorSuratPanitiaASTS(nextNomorUrutOtomatis, tanggalSK, kodeKlasifikasi);
    setNoSK(generated);
    showNotification(
      `Nomor urut berhasil disesuaikan dengan Surat Keluar terakhir (${latestSuratKeluarNomor}). Nomor berikutnya: ${nextNomorUrutOtomatis}`,
      'info'
    );
  };

  const [tentang, setTentang] = useState<string>(() => {
    return (
      savedSK?.tentang ||
      `PEMBENTUKAN PANITIA PELAKSANA ASESMEN TENGAH SEMESTER (ASTS) / UJIAN TENGAH SEMESTER (UTS) SEMESTER 1 (GANJIL) TAHUN PELAJARAN ${tahunAjaran}`
    );
  });

  const [menimbang, setMenimbang] = useState<string[]>(() => {
    return savedSK?.menimbang && savedSK.menimbang.length > 0
      ? savedSK.menimbang
      : DEFAULT_MENIMBANG_SK_PANITIA_ASTS(tahunAjaran, semester);
  });

  const [mengingat, setMengingat] = useState<string[]>(() => {
    return savedSK?.mengingat && savedSK.mengingat.length > 0
      ? savedSK.mengingat
      : DEFAULT_MENGINGAT_SK_PANITIA_ASTS;
  });

  const [memperhatikan, setMemperhatikan] = useState<string[]>(() => {
    return savedSK?.memperhatikan && savedSK.memperhatikan.length > 0
      ? savedSK.memperhatikan
      : DEFAULT_MEMPERHATIKAN_SK_PANITIA_ASTS(tahunAjaran);
  });

  const [susunanPanitia, setSusunanPanitia] = useState<SKPanitiaASTSMember[]>(() => {
    if (savedSK?.susunanPanitia && savedSK.susunanPanitia.length > 0) {
      return savedSK.susunanPanitia;
    }
    return buildDefaultSusunanPanitiaASTS(identitasSekolah, guruPTKList);
  });

  // Drive Template Sync State (STRICTLY READ-ONLY)
  const [isSyncingTemplate, setIsSyncingTemplate] = useState<boolean>(false);
  const [driveTemplateInfo, setDriveTemplateInfo] = useState<{
    file: GoogleDriveFile | null;
    path: string;
    status: 'idle' | 'found' | 'not_found' | 'error';
    message: string;
  }>({
    file: null,
    path: 'TATA USAHA/SK',
    status: 'idle',
    message: `Format resmi terhubung dengan templat Google Drive: "${TEMPLATE_DRIVE_TITLE_SK_PANITIA_ASTS}"`,
  });

  // Action states
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [isSendingToAgenda, setIsSendingToAgenda] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Edit / Add Panitia Modal
  const [isPanitiaModalOpen, setIsPanitiaModalOpen] = useState<boolean>(false);
  const [editingPanitia, setEditingPanitia] = useState<SKPanitiaASTSMember | null>(null);
  const [panitiaForm, setPanitiaForm] = useState<{
    nama: string;
    nip: string;
    pangkatGol: string;
    jabatanDinas: string;
    jabatanPanitia: JabatanPanitiaASTS;
    uraianTugas: string;
  }>({
    nama: '',
    nip: '',
    pangkatGol: '',
    jabatanDinas: '',
    jabatanPanitia: 'Anggota',
    uraianTugas: '',
  });

  // Toast notification helper
  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Build current SK object
  const getCurrentSK = (): SKPanitiaASTS => ({
    id: savedSK?.id || 'sk-panitia-asts-aktif',
    noSK,
    kodeKlasifikasi,
    nomorUrut,
    tahunAjaran,
    semester,
    tentang,
    tanggalSK,
    tempatPenetapan,
    tanggalPelaksanaan,
    menimbang,
    mengingat,
    memperhatikan,
    susunanPanitia,
    statusDrive: savedSK?.statusDrive || 'Lokal Saja',
    driveFileId: driveFileId || savedSK?.driveFileId,
    driveWebViewLink: driveWebViewLink || savedSK?.driveWebViewLink,
    templateNama: TEMPLATE_DRIVE_TITLE_SK_PANITIA_ASTS,
    drivePath: 'TATA USAHA/SK',
    tercatatDiAgenda,
    agendaSuratId: agendaSuratId || savedSK?.agendaSuratId,
  });

  // Trigger local save whenever key data changes
  const handleSaveLocal = () => {
    const current = getCurrentSK();
    if (onSaveSK) onSaveSK(current);
    showNotification('Perubahan parameter SK Panitia ASTS berhasil disimpan.', 'success');
  };

  /**
   * ATURAN ALUR DATA:
   * Aksi "Tarik Data Templat" / "Sinkron": HANYA BOLEH MEMBACA (read-only) struktur file templat dari Google Drive.
   * DILARANG MENIMPA, MENGUBAH, ATAU MENGIRIM DATA BARU ke Google Drive/Sheets saat sinkronisasi.
   */
  const handleTarikDataTemplat = async () => {
    if (!googleToken) {
      if (onConnectGoogle) {
        onConnectGoogle();
      } else {
        showNotification('Silakan hubungkan akun Google Drive terlebih dahulu.', 'info');
      }
      return;
    }

    try {
      setIsSyncingTemplate(true);
      showNotification('Memeriksa berkas templat di Google Drive (Read-Only)...', 'info');

      const result = await findSKPanitiaASTSTemplateInDrive(googleToken);

      setDriveTemplateInfo({
        file: result.file,
        path: result.path,
        status: result.status,
        message: result.message,
      });

      if (result.status === 'found') {
        showNotification(
          `Templat "${result.file?.name}" berhasil diverifikasi dan dibaca dari Google Drive! Format kop, konsideran, dan tabel susunan kepanitiaan disinkronkan secara read-only.`,
          'success'
        );
      } else {
        showNotification(
          'Templat tidak ditemukan di Drive. Sistem tetap menggunakan struktur resmi standar SMP Negeri 2 Puriala.',
          'info'
        );
      }
    } catch (err: any) {
      console.error('Error membaca templat Drive:', err);
      setDriveTemplateInfo({
        file: null,
        path: 'TATA USAHA/SK',
        status: 'error',
        message: `Gagal membaca templat: ${err.message}`,
      });
      showNotification(`Gagal membaca templat: ${err.message}`, 'error');
    } finally {
      setIsSyncingTemplate(false);
    }
  };

  /**
   * ATURAN ALUR DATA:
   * Tombol / Aksi "Kirim Data" / "Simpan Surat":
   * Menulis/menimpa data ke Google Sheets "BUKU_AGENDA_SURAT_KELUAR".
   * Jika sudah tercatat (Kirim Ulang), TIDAK MEMBUAT nomor/baris baru melainkan menimpa baris yang ada untuk perbaikannya.
   */
  const handleKirimKeBukuAgenda = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsSendingToAgenda(true);
      const currentSK = getCurrentSK();

      const result = await recordSKPanitiaASTSToAgendaSuratKeluar(
        googleToken,
        {
          id: currentSK.id,
          noSK: currentSK.noSK,
          nomorUrut: currentSK.nomorUrut,
          tanggalSK: currentSK.tanggalSK,
          tentang: currentSK.tentang,
          kodeKlasifikasi: currentSK.kodeKlasifikasi || kodeKlasifikasi,
          existingSuratId: agendaSuratId || currentSK.agendaSuratId || savedSK?.agendaSuratId,
          isResend: tercatatDiAgenda,
        },
        {
          namaKepalaSekolah: identitasSekolah.namaKepalaSekolah,
        }
      );

      // Tambahkan atau perbarui ke list state lokal
      if (onAddSuratKeluar && result.suratRecord) {
        onAddSuratKeluar(result.suratRecord);
      }

      setTercatatDiAgenda(true);
      setAgendaSuratId(result.suratRecord.id);

      const updatedSK: SKPanitiaASTS = {
        ...currentSK,
        tercatatDiAgenda: true,
        agendaSuratId: result.suratRecord.id,
      };
      if (onSaveSK) onSaveSK(updatedSK);

      if (tercatatDiAgenda) {
        showNotification(
          `Sukses! Data SK Panitia ASTS berhasil diperbarui di Google Sheets "BUKU_AGENDA_SURAT_KELUAR" (baris agenda ditimpa untuk perbaikan, nomor tetap: ${currentSK.nomorUrut}).`,
          'success'
        );
      } else {
        showNotification(
          `Sukses! SK Panitia ASTS nomor ${currentSK.noSK} berhasil dicatatkan ke Google Sheets "BUKU_AGENDA_SURAT_KELUAR" (Sheet "2026").`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Error kirim ke agenda surat keluar:', err);
      showNotification(`Gagal mengirim ke Buku Agenda: ${err.message}`, 'error');
    } finally {
      setIsSendingToAgenda(false);
    }
  };

  /**
   * Simpan dokumen SK ke Google Drive Folder TATA USAHA/SK
   * Jika file sudah ada, menimpa file yang sudah ada untuk diperbaharui tanpa membuat file baru.
   */
  const handleSimpanDokumenKeDrive = async () => {
    if (!googleToken) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsSavingToDrive(true);
      const currentSK = getCurrentSK();
      const html = generateSKPanitiaASTSFullHtml(currentSK, identitasSekolah);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      // Gunakan nama file templat resmi agar file yang ada di folder TATA USAHA/SK diperbarui/ditimpa
      const fileName = 'SK Panitia Asesmen Tengah Semester 2026-2027.html';

      const existingDriveId = driveFileId || currentSK.driveFileId || savedSK?.driveFileId || null;
      const uploadResult = await uploadSKPanitiaASTSDocumentToDrive(
        googleToken,
        blob,
        fileName,
        'text/html',
        existingDriveId
      );

      setDriveFileId(uploadResult.id);
      setDriveWebViewLink(uploadResult.webViewLink);

      const updatedSK: SKPanitiaASTS = {
        ...currentSK,
        statusDrive: 'Tersimpan',
        driveFileId: uploadResult.id,
        driveWebViewLink: uploadResult.webViewLink,
      };

      if (onSaveSK) onSaveSK(updatedSK);
      showNotification(
        `Dokumen SK Panitia ASTS berhasil diperbarui di Google Drive folder TATA USAHA/SK (file diperbarui/ditimpa tanpa membuat file baru)!`,
        'success'
      );
    } catch (err: any) {
      console.error('Error upload SK to Drive:', err);
      showNotification(`Gagal mengarsipkan ke Drive: ${err.message}`, 'error');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Populate committee with default staff from PTK
  const handlePopulateFromPTK = () => {
    const defaultList = buildDefaultSusunanPanitiaASTS(identitasSekolah, guruPTKList);
    setSusunanPanitia(defaultList);
    showNotification(`Susunan panitia berhasil diperbarui dengan data guru dari database PTK.`, 'success');
  };

  // Open Add Member Modal
  const handleOpenAddMember = () => {
    setEditingPanitia(null);
    setPanitiaForm({
      nama: '',
      nip: '',
      pangkatGol: '',
      jabatanDinas: 'Guru',
      jabatanPanitia: 'Anggota',
      uraianTugas: DAFTAR_JABATAN_PANITIA_ASTS.find((j) => j.jabatan === 'Anggota')?.defaultUraian || '',
    });
    setIsPanitiaModalOpen(true);
  };

  // Open Edit Member Modal
  const handleOpenEditMember = (m: SKPanitiaASTSMember) => {
    setEditingPanitia(m);
    setPanitiaForm({
      nama: m.nama,
      nip: m.nip,
      pangkatGol: m.pangkatGol || '',
      jabatanDinas: m.jabatanDinas,
      jabatanPanitia: m.jabatanPanitia,
      uraianTugas: m.uraianTugas,
    });
    setIsPanitiaModalOpen(true);
  };

  // Handle select teacher from PTK dropdown in modal
  const handleSelectPTKInModal = (ptkId: string) => {
    const ptk = guruPTKList.find((g) => g.id === ptkId);
    if (!ptk) return;

    setPanitiaForm((prev) => ({
      ...prev,
      nama: ptk.namaLengkap,
      nip: ptk.nip || '-',
      pangkatGol: ptk.pangkatGol || '-',
      jabatanDinas: ptk.jabatan || 'Guru Mata Pelajaran',
    }));
  };

  // Handle role selection in modal (auto-fill suggested duty)
  const handleRoleChangeInModal = (newRole: JabatanPanitiaASTS) => {
    const found = DAFTAR_JABATAN_PANITIA_ASTS.find((j) => j.jabatan === newRole);
    setPanitiaForm((prev) => ({
      ...prev,
      jabatanPanitia: newRole,
      uraianTugas: found ? found.defaultUraian : prev.uraianTugas,
    }));
  };

  // Save Member in Modal
  const handleSaveMemberModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panitiaForm.nama.trim()) {
      showNotification('Nama anggota panitia wajib diisi!', 'error');
      return;
    }

    if (editingPanitia) {
      setSusunanPanitia((prev) =>
        prev.map((item) =>
          item.id === editingPanitia.id
            ? {
                ...item,
                nama: panitiaForm.nama,
                nip: panitiaForm.nip,
                pangkatGol: panitiaForm.pangkatGol,
                jabatanDinas: panitiaForm.jabatanDinas,
                jabatanPanitia: panitiaForm.jabatanPanitia,
                uraianTugas: panitiaForm.uraianTugas,
              }
            : item
        )
      );
      showNotification(`Anggota ${panitiaForm.nama} berhasil diperbarui.`, 'success');
    } else {
      const newMember: SKPanitiaASTSMember = {
        id: `panitia-${Date.now()}`,
        nama: panitiaForm.nama,
        nip: panitiaForm.nip,
        pangkatGol: panitiaForm.pangkatGol,
        jabatanDinas: panitiaForm.jabatanDinas,
        jabatanPanitia: panitiaForm.jabatanPanitia,
        uraianTugas: panitiaForm.uraianTugas,
      };
      setSusunanPanitia((prev) => [...prev, newMember]);
      showNotification(`Anggota ${panitiaForm.nama} berhasil ditambahkan ke susunan panitia.`, 'success');
    }

    setIsPanitiaModalOpen(false);
  };

  // Delete Member
  const handleDeleteMember = (id: string, nama: string) => {
    setSusunanPanitia((prev) => prev.filter((p) => p.id !== id));
    showNotification(`Anggota ${nama} telah dihapus dari susunan panitia.`, 'info');
  };

  // Move Member Up/Down
  const handleMoveMember = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= susunanPanitia.length) return;

    const list = [...susunanPanitia];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;
    setSusunanPanitia(list);
  };

  const currentSK = getCurrentSK();

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm flex items-center space-x-2 animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-600'
              : notification.type === 'error'
              ? 'bg-rose-600'
              : 'bg-blue-600'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
              <FileCheck2 className="w-4 h-4" />
              <span>Surat Keputusan (SK) Resmi</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">SK Panitia ASTS / UTS</h1>
            <p className="text-slate-600 text-sm mt-1">
              Penerbitan Surat Keputusan Pembentukan Panitia Asesmen Tengah Semester (ASTS) TP {tahunAjaran} sesuai
              format baku master Google Drive dan integrasi Buku Agenda Surat Keluar.
            </p>
          </div>

          {/* QUICK TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTarikDataTemplat}
              disabled={isSyncingTemplate}
              title="Baca struktur templat dari Google Drive (Read-Only)"
              id="btn-tarik-data-templat-drive"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingTemplate ? 'animate-spin' : ''}`} />
              <span>{isSyncingTemplate ? 'Membaca Templat...' : 'Tarik Data Templat (Drive)'}</span>
            </button>

            <button
              onClick={() => printSKPanitiaASTSDirectly(currentSK, identitasSekolah)}
              title="Cetak Langsung Dokumen SK & Lampiran"
              id="btn-cetak-sk-panitia-asts"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak SK & Lampiran</span>
            </button>

            <button
              onClick={() => downloadSKPanitiaASTSHtmlFile(currentSK, identitasSekolah)}
              title="Unduh file HTML resmi siap cetak / buka di Docs"
              id="btn-unduh-sk-panitia-asts"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Dokumen</span>
            </button>

            <button
              onClick={handleKirimKeBukuAgenda}
              disabled={isSendingToAgenda}
              title={
                tercatatDiAgenda
                  ? 'Kirim ulang untuk menimpa/memperbaiki catatan agenda yang sudah ada tanpa membuat nomor atau baris baru'
                  : 'Kirim dan catat nomor SK ke Google Sheets BUKU_AGENDA_SURAT_KELUAR'
              }
              id="btn-kirim-ke-agenda-surat-keluar"
              className={`inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer ${
                tercatatDiAgenda
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Send className={`w-4 h-4 ${isSendingToAgenda ? 'animate-spin' : ''}`} />
              <span>
                {isSendingToAgenda
                  ? 'Menyimpan ke Agenda...'
                  : tercatatDiAgenda
                  ? 'Tercatat di Agenda (Kirim Ulang)'
                  : 'Kirim ke Buku Agenda'}
              </span>
            </button>

            <button
              onClick={handleSimpanDokumenKeDrive}
              disabled={isSavingToDrive}
              title="Perbarui berkas dokumen SK di folder TATA USAHA/SK di Google Drive (menimpa file yang sudah ada untuk diperbaharui tanpa membuat file baru)"
              id="btn-simpan-dokumen-drive"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 transition-colors shadow-sm cursor-pointer"
            >
              <CloudCheck className="w-4 h-4" />
              <span>{isSavingToDrive ? 'Memperbarui Drive...' : 'Simpan ke Drive'}</span>
            </button>
          </div>
        </div>

        {/* DRIVE SYNC RULE & TEMPLATE BANNER */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Aturan Alur Data (Strict Read-Only):</strong> Aksi <em>"Tarik Data Templat"</em> hanya membaca
              struktur berkas dari Google Drive tanpa menimpa data. Pengiriman baris data ke{' '}
              <strong>"BUKU_AGENDA_SURAT_KELUAR"</strong> hanya terjadi saat tombol <em>"Kirim ke Buku Agenda"</em> diklik.
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-500 shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                isGoogleConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isGoogleConnected ? '● Google Drive Terhubung' : '○ Google Drive Offline'}
            </span>
            {driveTemplateInfo.file && (
              <a
                href={driveTemplateInfo.file.webViewLink || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center space-x-1"
              >
                <span>Buka Master Template</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('form')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'form'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Parameter SK & Konsideran</span>
        </button>

        <button
          onClick={() => setActiveSubTab('panitia')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'panitia'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Susunan Panitia (Lampiran I)</span>
          <span className="bg-amber-600/30 text-xs px-1.5 py-0.5 rounded-full">
            {susunanPanitia.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('preview')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'preview'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>3. Pratinjau Dokumen Cetak</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sync-info')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'sync-info'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>4. Integrasi Drive & Buku Agenda</span>
        </button>
      </div>

      {/* TAB 1: FORM INPUT VARIABEL SESUAI ISI TEMPLAT */}
      {activeSubTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM KIRI: PARAMETER UTAMA SURAT */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Format Nomor & Identitas SK</span>
              </h3>

              {/* DROPDOWN KODE KLASIFIKASI SURAT (TERSINKRON DENGAN SURAT KELUAR) */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="select-kode-klasifikasi-sk" className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kode Klasifikasi Surat</span>
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100/80 text-amber-800 rounded-full border border-amber-200">
                    Tersinkron ({activeKodeList.length} Kode)
                  </span>
                </div>

                <select
                  id="select-kode-klasifikasi-sk"
                  value={kodeKlasifikasi}
                  onChange={(e) => handleKodeKlasifikasiChange(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm cursor-pointer"
                >
                  {activeKodeList.map((k) => (
                    <option key={k.kode} value={k.kode}>
                      {k.kode} - {k.nama} {k.kategori ? `[${k.kategori}]` : ''}
                    </option>
                  ))}
                </select>

                {currentKodeObj && (
                  <div className="text-[11px] text-amber-900 bg-white/90 rounded-lg p-2.5 border border-amber-200/70 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-amber-900 truncate">
                        {currentKodeObj.kode} &bull; {currentKodeObj.nama}
                      </span>
                      {currentKodeObj.kategori && (
                        <span className="shrink-0 text-[9.5px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-200/60">
                          {currentKodeObj.kategori}
                        </span>
                      )}
                    </div>
                    {currentKodeObj.keterangan && (
                      <p className="text-slate-600 text-[10.5px] leading-snug">
                        {currentKodeObj.keterangan}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-nomor-urut-sk" className="block text-xs font-bold text-slate-800">
                    Nomor Urut Surat
                  </label>
                  {tercatatDiAgenda ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                      Tercatat di Agenda (No. {nomorUrut})
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                      Tersinkron Surat Keluar
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="input-nomor-urut-sk"
                    type="number"
                    min={1}
                    value={nomorUrut}
                    onChange={(e) => handleNomorUrutChange(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSyncWithSuratKeluar}
                    title="Sesuaikan nomor urut dengan nomor surat keluar terakhir + 1"
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sesuaikan No. Terakhir</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <span>
                    Surat Keluar terakhir:{' '}
                    <strong className="text-slate-800 font-mono font-bold">
                      {latestSuratKeluarNomor > 0 ? `No. ${latestSuratKeluarNomor}` : 'Belum ada'}
                    </strong>
                  </span>
                  <span className="text-emerald-700 font-medium">
                    Nomor berikutnya:{' '}
                    <strong className="font-mono font-bold text-emerald-800">
                      No. {nextNomorUrutOtomatis}
                    </strong>
                  </span>
                </div>

                {tercatatDiAgenda && (
                  <p className="text-[10.5px] text-amber-800 bg-amber-50 rounded p-1.5 border border-amber-200">
                    ℹ️ SK ini sudah tercatat di agenda. Mengklik <strong>"Tercatat di Agenda (Kirim Ulang)"</strong> akan <strong>menimpa/mengganti</strong> data baris yang sudah ada, tanpa membuat nomor atau baris baru.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Format Nomor Surat (Baku)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetNomorBaku}
                    title="Generate ulang format nomor surat baku"
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Baku</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={noSK}
                  onChange={(e) => setNoSK(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
                  placeholder={`${kodeKlasifikasi}/075/SMP-02/PRL/IX/2026`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Pola Baku: <code>{kodeKlasifikasi}/[Nomor]/SMP-02/PRL/[Bulan]/[Tahun]</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Ganjil">1 (Ganjil)</option>
                    <option value="Genap">2 (Genap)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Pelajaran
                  </label>
                  <input
                    type="text"
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="2026/2027"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal SK
                  </label>
                  <input
                    type="date"
                    value={tanggalSK}
                    onChange={(e) => setTanggalSK(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempat Penetapan
                  </label>
                  <input
                    type="text"
                    value={tempatPenetapan}
                    onChange={(e) => setTempatPenetapan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Unggulino"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu / Rentang Pelaksanaan Asesmen
                </label>
                <input
                  type="text"
                  value={tanggalPelaksanaan}
                  onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="22 s.d 27 September 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perihal / Judul Penetapan SK (Tentang)
                </label>
                <textarea
                  rows={3}
                  value={tentang}
                  onChange={(e) => setTentang(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveLocal}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Simpan Perubahan Parameter
              </button>
            </div>

            {/* KOP SURAT PREVIEW BOX */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">Kop Surat Terverifikasi:</span>
              <p className="text-slate-600 leading-relaxed">
                <strong>PEMERINTAH KABUPATEN KONAWE</strong>
                <br />
                DINAS PENDIDIKAN DAN KEBUDAYAAN
                <br />
                <strong>SMP NEGERI 2 PURIALA</strong>
                <br />
                <span className="italic text-slate-500">
                  Jalan Poros Puriala - Motaha, Unggulino | Pos 93466
                </span>
              </p>
            </div>
          </div>

          {/* KOLOM KANAN: POIN KONSIDERAN (MENIMBANG, MENGINGAT, MEMPERHATIKAN) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Poin Konsiderans Surat Keputusan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuai isi baku berkas master Google Drive "SK Panitia Asesmen Tengah Semester 2026-2027".
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMenimbang(DEFAULT_MENIMBANG_SK_PANITIA_ASTS(tahunAjaran, semester));
                    setMengingat(DEFAULT_MENGINGAT_SK_PANITIA_ASTS);
                    setMemperhatikan(DEFAULT_MEMPERHATIKAN_SK_PANITIA_ASTS(tahunAjaran));
                    showNotification('Konsiderans diatur ulang ke format baku templat Google Drive.', 'info');
                  }}
                  className="text-xs text-amber-600 hover:text-amber-800 font-semibold"
                >
                  Reset ke Standar Templat
                </button>
              </div>

              {/* BUTIR MENIMBANG */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    a. Butir Menimbang (Dasar Kebutuhan Pembentukan Panitia)
                  </span>
                  <button
                    onClick={() => setMenimbang([...menimbang, ''])}
                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Butir</span>
                  </button>
                </div>
                {menimbang.map((poin, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-xs font-bold text-slate-400 mt-2 w-6 shrink-0">
                      {String.fromCharCode(97 + idx)}.
                    </span>
                    <textarea
                      rows={2}
                      value={poin}
                      onChange={(e) => {
                        const updated = [...menimbang];
                        updated[idx] = e.target.value;
                        setMenimbang(updated);
                      }}
                      className="flex-grow text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setMenimbang(menimbang.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1.5 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* BUTIR MENGINGAT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    b. Butir Mengingat (Dasar Hukum & Peraturan Perundang-undangan)
                  </span>
                  <button
                    onClick={() => setMengingat([...mengingat, ''])}
                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Dasar Hukum</span>
                  </button>
                </div>
                {mengingat.map((poin, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-xs font-bold text-slate-400 mt-2 w-6 shrink-0">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={poin}
                      onChange={(e) => {
                        const updated = [...mengingat];
                        updated[idx] = e.target.value;
                        setMengingat(updated);
                      }}
                      className="flex-grow text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setMengingat(mengingat.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1.5 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* BUTIR MEMPERHATIKAN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    c. Butir Memperhatikan (Kalender Pendidikan & Rapat Dewan Guru)
                  </span>
                  <button
                    onClick={() => setMemperhatikan([...memperhatikan, ''])}
                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Butir</span>
                  </button>
                </div>
                {memperhatikan.map((poin, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-xs font-bold text-slate-400 mt-2 w-6 shrink-0">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={poin}
                      onChange={(e) => {
                        const updated = [...memperhatikan];
                        updated[idx] = e.target.value;
                        setMemperhatikan(updated);
                      }}
                      className="flex-grow text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setMemperhatikan(memperhatikan.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1.5 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUSUNAN PANITIA (LAMPIRAN I) */}
      {activeSubTab === 'panitia' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>Lampiran I: Tabel Susunan Kepanitiaan ASTS / UTS</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                9 Posisi Kepanitiaan Baku: Penanggung Jawab, Ketua, Sekretaris, Bendahara, Perlengkapan, Penggandaan,
                Pengepakan, Konsumsi, Anggota.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePopulateFromPTK}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                title="Isi otomatis nama guru dari database PTK ke susunan panitia"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Isi Otomatis dari PTK</span>
              </button>

              <button
                onClick={handleOpenAddMember}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Anggota Panitia</span>
              </button>
            </div>
          </div>

          {/* TABEL ANGGOTA PANITIA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4">Nama Lengkap & NIP</th>
                  <th className="py-3 px-4">Jabatan Dinas</th>
                  <th className="py-3 px-4">Jabatan Dalam Panitia</th>
                  <th className="py-3 px-4">Uraian Tugas</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {susunanPanitia.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{item.nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">NIP. {item.nip || '-'}</div>
                      {item.pangkatGol && (
                        <div className="text-[10px] text-slate-400">Gol. {item.pangkatGol}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.jabatanDinas || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md font-bold text-[11px] ${
                          item.jabatanPanitia === 'Penanggung Jawab'
                            ? 'bg-purple-100 text-purple-800'
                            : item.jabatanPanitia === 'Ketua'
                            ? 'bg-blue-100 text-blue-800'
                            : item.jabatanPanitia === 'Sekretaris'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.jabatanPanitia === 'Bendahara'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.jabatanPanitia}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-xs">
                      {item.uraianTugas || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleMoveMember(index, 'up')}
                          disabled={index === 0}
                          title="Pindah ke atas"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveMember(index, 'down')}
                          disabled={index === susunanPanitia.length - 1}
                          title="Pindah ke bawah"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditMember(item)}
                          title="Edit data anggota"
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(item.id, item.nama)}
                          title="Hapus dari susunan panitia"
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveLocal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Simpan Susunan Kepanitiaan
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PRATINJAU DOKUMEN CETAK (100% PERSIS DENGAN FORMAT TEMPLAT GOOGLE DRIVE) */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              Pratinjau Dokumen Cetak format baku (Kop Surat Logo Ganda, Konsiderans, dan Lampiran Tabel Susunan Panitia).
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => printSKPanitiaASTSDirectly(currentSK, identitasSekolah)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen</span>
              </button>
              <button
                onClick={() => downloadSKPanitiaASTSHtmlFile(currentSK, identitasSekolah)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File HTML</span>
              </button>
            </div>
          </div>

          {/* RENDER DOKUMEN DALAM IFRAME / CONTAINER */}
          <div className="bg-slate-200 p-4 sm:p-8 rounded-xl border border-slate-300 flex justify-center overflow-x-auto">
            <div className="w-full max-w-[850px] shadow-2xl bg-white rounded-sm overflow-hidden">
              <iframe
                title="Preview SK Panitia ASTS"
                srcDoc={generateSKPanitiaASTSFullHtml(currentSK, identitasSekolah)}
                className="w-full min-h-[1100px] border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRASI DRIVE & BUKU AGENDA */}
      {activeSubTab === 'sync-info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-base">
              <Cloud className="w-5 h-5" />
              <span>Sinkronisasi Templat Google Drive</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Berkas templat master Google Drive:
              <br />
              <strong className="text-slate-800">"SK Panitia Asesmen Tengah Semester 2026-2027"</strong>
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Pencarian:</span>
                <span
                  className={`font-semibold ${
                    driveTemplateInfo.status === 'found'
                      ? 'text-emerald-700'
                      : driveTemplateInfo.status === 'error'
                      ? 'text-rose-600'
                      : 'text-amber-700'
                  }`}
                >
                  {driveTemplateInfo.status === 'found'
                    ? 'Ditemukan di Drive'
                    : driveTemplateInfo.status === 'error'
                    ? 'Gagal Membaca'
                    : 'Standar Sistem Aktif'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lokasi Folder:</span>
                <span className="font-mono text-slate-700">{driveTemplateInfo.path}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                {driveTemplateInfo.message}
              </p>
            </div>
            <button
              onClick={handleTarikDataTemplat}
              disabled={isSyncingTemplate}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
            >
              {isSyncingTemplate ? 'Memeriksa Berkas Drive...' : 'Tarik Data Templat (Read-Only)'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-base">
              <FileSpreadsheet className="w-5 h-5" />
              <span>Google Sheets BUKU_AGENDA_SURAT_KELUAR</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pencatatan nomor surat keputusan panitia ke dalam spreadsheet agenda resmi surat keluar tahun 2026.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Pencatatan:</span>
                <span
                  className={`font-semibold ${
                    tercatatDiAgenda ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {tercatatDiAgenda ? 'Sudah Tercatat di Sheet "2026"' : 'Belum Dikirim ke Agenda'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Spreadsheet:</span>
                <span className="font-mono text-slate-700">BUKU_AGENDA_SURAT_KELUAR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kode Klasifikasi:</span>
                <span className="font-mono text-slate-700">
                  {kodeKlasifikasi} {currentKodeObj?.nama ? `(${currentKodeObj.nama})` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={handleKirimKeBukuAgenda}
              disabled={isSendingToAgenda}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              {isSendingToAgenda ? 'Mengirimkan...' : 'Kirim Data ke Buku Agenda Surat Keluar'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT ANGGOTA PANITIA */}
      {isPanitiaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingPanitia ? 'Edit Anggota Panitia ASTS' : 'Tambah Anggota Panitia ASTS'}
              </h3>
              <button
                onClick={() => setIsPanitiaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMemberModal} className="p-6 space-y-4 text-xs">
              {/* PILIH CEPAT DARI DATABASE PTK */}
              {guruPTKList.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Cepat dari Database Guru / PTK (Opsional)
                  </label>
                  <select
                    onChange={(e) => handleSelectPTKInModal(e.target.value)}
                    defaultValue=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Pilih Guru dari Database PTK --
                    </option>
                    {guruPTKList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.namaLengkap} {g.nip ? `(NIP: ${g.nip})` : ''} - {g.jabatan || 'Guru'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={panitiaForm.nama}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Contoh: Sudirman, S.Pd."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={panitiaForm.nip}
                    onChange={(e) => setPanitiaForm({ ...panitiaForm, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="19750512 200212 1 004"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={panitiaForm.pangkatGol}
                    onChange={(e) => setPanitiaForm({ ...panitiaForm, pangkatGol: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Penata Tk. I, III/d"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan Dinas / Pokok</label>
                <input
                  type="text"
                  value={panitiaForm.jabatanDinas}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, jabatanDinas: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Guru Ahli Madya / Wakasek Kurikulum"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan dalam Kepanitiaan ASTS *
                </label>
                <select
                  value={panitiaForm.jabatanPanitia}
                  onChange={(e) => handleRoleChangeInModal(e.target.value as JabatanPanitiaASTS)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {DAFTAR_JABATAN_PANITIA_ASTS.map((j) => (
                    <option key={j.jabatan} value={j.jabatan}>
                      {j.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uraian Tugas & Tanggung Jawab
                </label>
                <textarea
                  rows={3}
                  value={panitiaForm.uraianTugas}
                  onChange={(e) => setPanitiaForm({ ...panitiaForm, uraianTugas: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPanitiaModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {editingPanitia ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
