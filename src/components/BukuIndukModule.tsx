import React, { useState } from 'react';
import {
  Contact,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Edit2,
  Trash2,
  Eye,
  X,
  User,
  GraduationCap,
  Home,
  Phone,
  Calendar,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Siswa, IdentitasSekolah } from '../types';
import { saveBukuIndukDataToDrive, loadBukuIndukDataFromDrive } from '../services/googleDrive';

interface BukuIndukModuleProps {
  siswaList: Siswa[];
  onAdd: (s: Siswa) => void;
  onUpdate: (s: Siswa) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
  googleToken?: string | null;
  googleUser?: any;
  isGoogleConnected?: boolean;
  isGoogleLoading?: boolean;
  onConnectGoogle?: () => void;
  onBatchUpdate?: (newList: Siswa[], mode?: 'replace' | 'merge') => void;
}

export const BukuIndukModule: React.FC<BukuIndukModuleProps> = ({
  siswaList,
  onAdd,
  onUpdate,
  onDelete,
  identitasSekolah,
  googleToken,
  googleUser,
  isGoogleConnected,
  isGoogleLoading,
  onConnectGoogle,
  onBatchUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kelasFilter, setKelasFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Aktif');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSiswaDetail, setSelectedSiswaDetail] = useState<Siswa | null>(null);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [isPrintListModalOpen, setIsPrintListModalOpen] = useState(false);
  const [printKelasOption, setPrintKelasOption] = useState<string>('Semua');

  // Sync state
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isPullingDrive, setIsPullingDrive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // -------------------------------------------------------------
  // GOOGLE DRIVE SYNC: PUSH (Kirim Data ke Drive)
  // Location: Folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI, File: BUKU_INDUK_SISWA_DAN_ALUMNI
  // -------------------------------------------------------------
  const handleSaveToDrive = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsSyncingDrive(true);
      const res = await saveBukuIndukDataToDrive(googleToken, siswaList);
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      showNotification(
        `Berhasil menyimpan ${siswaList.length} data Buku Induk Siswa ke Google Drive: Folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI (File: ${res.fileName}) tanpa merubah struktur tabel!`,
        'success'
      );
    } catch (error: any) {
      console.error('Error saving Buku Induk Siswa to Drive:', error);
      showNotification(error?.message || 'Gagal menyimpan Data Buku Induk Siswa ke Google Drive.', 'error');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE DRIVE SYNC: PULL (Tarik Data dari Drive)
  // Location: Folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI, File: BUKU_INDUK_SISWA_DAN_ALUMNI
  // -------------------------------------------------------------
  const handlePullFromDrive = async () => {
    if (!googleToken || !isGoogleConnected) {
      if (onConnectGoogle) onConnectGoogle();
      return;
    }

    try {
      setIsPullingDrive(true);
      const res = await loadBukuIndukDataFromDrive(googleToken);
      if (res.data && res.data.length > 0) {
        if (onBatchUpdate) {
          onBatchUpdate(res.data, 'replace');
        }
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);
        showNotification(
          `Berhasil menarik ${res.data.length} data Siswa dari Google Drive (${res.sourceFolder} / ${res.sourceName})!`,
          'success'
        );
      } else {
        showNotification('Tidak ada data Buku Induk Siswa yang ditemukan di file Google Drive.', 'info');
      }
    } catch (error: any) {
      console.error('Error pulling Buku Induk Siswa from Drive:', error);
      showNotification(error?.message || 'Gagal menarik data Buku Induk Siswa dari Google Drive.', 'error');
    } finally {
      setIsPullingDrive(false);
    }
  };

  React.useEffect(() => {
    const handlePullEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.moduleName === 'Buku Induk Siswa' || customEvent.detail?.moduleName === 'Kesiswaan') {
        handlePullFromDrive();
      }
    };
    window.addEventListener('simtu-pull-data', handlePullEvent);
    return () => window.removeEventListener('simtu-pull-data', handlePullEvent);
  }, [googleToken, isGoogleConnected, googleUser]);

  const [formData, setFormData] = useState<Partial<Siswa>>({
    nis: `252607${String(siswaList.length + 1).padStart(3, '0')}`,
    nisn: '',
    namaLengkap: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Puriala',
    tanggalLahir: '2012-01-01',
    kelas: 'VII.A',
    agama: 'Islam',
    namaAyah: '',
    pekerjaanAyah: 'Petani',
    namaIbu: '',
    pekerjaanIbu: 'Ibu Rumah Tangga',
    alamat: 'Desa Mokaleleo, Kec. Puriala',
    noTelpOrtu: '',
    statusSiswa: 'Aktif',
    tahunMasuk: '2025',
  });

  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setFormData({
      nis: `252607${String(siswaList.length + 1).padStart(3, '0')}`,
      nisn: '',
      namaLengkap: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Puriala',
      tanggalLahir: '2012-01-01',
      kelas: 'VII.A',
      agama: 'Islam',
      namaAyah: '',
      pekerjaanAyah: 'Petani',
      namaIbu: '',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      alamat: 'Desa Mokaleleo, Kec. Puriala',
      noTelpOrtu: '',
      statusSiswa: 'Aktif',
      tahunMasuk: '2025',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: Siswa) => {
    setEditingSiswa(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.nisn) {
      alert('Mohon isi Nama Lengkap dan NISN Siswa!');
      return;
    }

    if (editingSiswa) {
      onUpdate({ ...editingSiswa, ...formData } as Siswa);
    } else {
      const newSiswa: Siswa = {
        id: `SIS-${Date.now()}`,
        nis: formData.nis || `252607${String(siswaList.length + 1).padStart(3, '0')}`,
        nisn: formData.nisn || '',
        namaLengkap: formData.namaLengkap || '',
        jenisKelamin: (formData.jenisKelamin as any) || 'Laki-laki',
        tempatLahir: formData.tempatLahir || 'Puriala',
        tanggalLahir: formData.tanggalLahir || '2012-01-01',
        kelas: (formData.kelas as any) || 'VII.A',
        agama: (formData.agama as any) || 'Islam',
        namaAyah: formData.namaAyah || '-',
        pekerjaanAyah: formData.pekerjaanAyah || '-',
        namaIbu: formData.namaIbu || '-',
        pekerjaanIbu: formData.pekerjaanIbu || '-',
        alamat: formData.alamat || '-',
        noTelpOrtu: formData.noTelpOrtu || '-',
        statusSiswa: (formData.statusSiswa as any) || 'Aktif',
        tahunMasuk: formData.tahunMasuk || '2025',
      };
      onAdd(newSiswa);
    }
    setIsAddModalOpen(false);
  };

  const exportExcel = () => {
    try {
      const dataToExport = siswaList.map((s, idx) => ({
        'No': idx + 1,
        'NIS': s.nis,
        'NISN': s.nisn,
        'Nama Lengkap Siswa': s.namaLengkap,
        'Jenis Kelamin': s.jenisKelamin,
        'Tempat Lahir': s.tempatLahir,
        'Tanggal Lahir': s.tanggalLahir,
        'Kelas / Rombel': s.kelas,
        'Agama': s.agama,
        'Nama Ayah': s.namaAyah || '-',
        'Pekerjaan Ayah': s.pekerjaanAyah || '-',
        'Nama Ibu': s.namaIbu || '-',
        'Pekerjaan Ibu': s.pekerjaanIbu || '-',
        'Alamat Lengkap': s.alamat || '-',
        'No. HP / Telepon Ortu': s.noTelpOrtu || '-',
        'Status Siswa': s.statusSiswa || 'Aktif',
        'Tahun Masuk': s.tahunMasuk || '2025',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 15 }, // NIS
        { wch: 15 }, // NISN
        { wch: 30 }, // Nama
        { wch: 14 }, // JK
        { wch: 18 }, // Tempat Lahir
        { wch: 14 }, // Tanggal Lahir
        { wch: 14 }, // Kelas
        { wch: 12 }, // Agama
        { wch: 22 }, // Nama Ayah
        { wch: 18 }, // Pekerjaan Ayah
        { wch: 22 }, // Nama Ibu
        { wch: 18 }, // Pekerjaan Ibu
        { wch: 35 }, // Alamat
        { wch: 18 }, // No Telp
        { wch: 14 }, // Status
        { wch: 12 }, // Tahun Masuk
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Induk Siswa');
      XLSX.writeFile(workbook, `BUKU_INDUK_SISWA_SMPN2_PURIALA_${new Date().getFullYear()}.xlsx`);
      showNotification('Berhasil mengekspor Buku Induk Siswa ke format Excel (.xlsx)!', 'success');
    } catch (e: any) {
      console.error('Error exporting Excel:', e);
      showNotification('Gagal mengekspor file Excel: ' + (e?.message || e), 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['NIS', 'NISN', 'Nama Lengkap', 'JK', 'Kelas', 'TTL', 'Agama', 'Nama Ayah', 'Nama Ibu', 'Alamat', 'No Telp', 'Status'];
    const rows = siswaList.map((s) => [
      `"${s.nis}"`,
      `"${s.nisn}"`,
      `"${s.namaLengkap}"`,
      `"${s.jenisKelamin}"`,
      `"${s.kelas}"`,
      `"${s.tempatLahir}, ${s.tanggalLahir}"`,
      `"${s.agama}"`,
      `"${s.namaAyah}"`,
      `"${s.namaIbu}"`,
      `"${s.alamat}"`,
      `"${s.noTelpOrtu}"`,
      `"${s.statusSiswa}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BUKU_INDUK_SISWA_SMPN2_PURIALA_2026.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filtered = siswaList.filter((s) => {
    const matchSearch =
      s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm) ||
      s.alamat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = kelasFilter === 'Semua' || s.kelas === kelasFilter;
    const matchStatus = statusFilter === 'Semua' || s.statusSiswa === statusFilter;
    return matchSearch && matchKelas && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Kesiswaan / <span className="text-slate-800 font-semibold">Buku Induk Digital</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Contact className="w-5 h-5 text-purple-600" />
            <span>BUKU INDUK SISWA DIGITAL (DAPODIK)</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-100">
              <FileSpreadsheet className="w-3 h-3 text-purple-600" />
              Folder: TATA USAHA/05_KESISWAAN_DAN_ALUMNI
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-medium">
              File: BUKU_INDUK_SISWA_DAN_ALUMNI
            </span>
            {lastSyncTime && (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Sinkron: {lastSyncTime}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tarik Data dari Drive Button */}
          <button
            onClick={handlePullFromDrive}
            disabled={isPullingDrive || isSyncingDrive}
            title="Tarik data Buku Induk Siswa dari Google Drive (Folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI / BUKU_INDUK_SISWA_DAN_ALUMNI)"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <CloudDownload className={`w-4 h-4 text-indigo-600 ${isPullingDrive ? 'animate-bounce' : ''}`} />
            <span>{isPullingDrive ? 'Menarik Data...' : 'Tarik Data Drive'}</span>
          </button>

          {/* Kirim ke Drive Button */}
          <button
            onClick={handleSaveToDrive}
            disabled={isSyncingDrive || isPullingDrive}
            title="Kirim dan simpan data Buku Induk Siswa ke Google Drive (Folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI / BUKU_INDUK_SISWA_DAN_ALUMNI tanpa merubah struktur tabel)"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
            <span>{isSyncingDrive ? 'Menyimpan ke Drive...' : 'Kirim Data ke Drive'}</span>
          </button>

          {/* Ekspor Excel */}
          <button
            onClick={exportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Ekspor seluruh data Buku Induk Siswa ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={() => {
              setPrintKelasOption(kelasFilter);
              setIsPrintListModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Cetak Buku Induk Siswa resmi ke PDF / Dokumen Fisik"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>

          {/* Ekspor CSV */}
          <button
            onClick={exportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold py-2 px-2.5 rounded-lg shadow-xs transition flex items-center gap-1"
            title="Ekspor format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Tambah Siswa */}
          <button
            onClick={handleOpenAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
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
            placeholder="Cari nama siswa, NISN, NIS, atau nama orang tua..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Kelas:</span>
          </div>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-700"
          >
            <option value="Semua">Semua Kelas</option>
            <option value="VII.A">Kelas VII.A</option>
            <option value="VII.B">Kelas VII.B</option>
            <option value="VIII">Kelas VIII</option>
            <option value="IX">Kelas IX</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Mutasi Keluar">Mutasi Keluar</option>
            <option value="Lulus">Lulus</option>
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">NIS & NISN</th>
                <th className="py-3 px-3.5">Nama Peserta Didik</th>
                <th className="py-3 px-3.5">JK</th>
                <th className="py-3 px-3.5">Kelas</th>
                <th className="py-3 px-3.5">Tempat & Tgl Lahir</th>
                <th className="py-3 px-3.5">Nama Orang Tua</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3.5 font-mono">
                    <div className="font-bold text-purple-800">{item.nisn}</div>
                    <div className="text-[10px] text-slate-400">NIS: {item.nis}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                        {item.namaLengkap.charAt(0)}
                      </div>
                      <span>{item.namaLengkap}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pl-6.5">{item.agama}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">
                      {item.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="bg-purple-100 text-purple-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Kelas {item.kelas}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div>{item.tempatLahir}</div>
                    <div className="text-[10px] text-slate-400">{item.tanggalLahir}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-medium text-slate-800">Ayah: {item.namaAyah}</div>
                    <div className="text-[10px] text-slate-400">Ibu: {item.namaIbu}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {item.statusSiswa}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedSiswaDetail(item)}
                        className="text-purple-600 hover:text-purple-800 p-1.5 rounded hover:bg-purple-50"
                        title="Buka Lembar Buku Induk"
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
                        onClick={() => {
                          if (confirm(`Hapus data siswa ${item.namaLengkap}?`)) {
                            onDelete(item.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100"
                        title="Hapus"
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
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Menampilkan {filtered.length} siswa</span>
          <span className="font-semibold text-slate-700">Daftar Buku Induk SMPN 2 Puriala</span>
        </div>
      </div>

      {/* MODAL: Input / Edit Siswa */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2">
                <Contact className="w-5 h-5 text-purple-600" />
                <span>{editingSiswa ? 'Edit Biodata Siswa' : 'Tambah Siswa ke Buku Induk'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Induk Siswa Nasional (NISN)</label>
                  <input
                    type="text"
                    required
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="0112458901"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Induk Sekolah (NIS)</label>
                  <input
                    type="text"
                    required
                    value={formData.nis || ''}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="252607001"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Peserta Didik</label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap || ''}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  placeholder="Contoh: Aditya Pratama Putra"
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'Laki-laki'}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rombel / Kelas</label>
                  <select
                    value={formData.kelas || 'VII.A'}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800"
                  >
                    <option value="VII.A">VII.A</option>
                    <option value="VII.B">VII.B</option>
                    <option value="VIII">VIII</option>
                    <option value="IX">IX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Agama</label>
                  <select
                    value={formData.agama || 'Islam'}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Ayah Kandung</label>
                  <input
                    type="text"
                    value={formData.namaAyah || ''}
                    onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pekerjaan Ayah</label>
                  <input
                    type="text"
                    value={formData.pekerjaanAyah || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaanAyah: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Ibu Kandung</label>
                  <input
                    type="text"
                    value={formData.namaIbu || ''}
                    onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pekerjaan Ibu</label>
                  <input
                    type="text"
                    value={formData.pekerjaanIbu || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaanIbu: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Tempat Tinggal</label>
                <input
                  type="text"
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Dusun I, Desa Mokaleleo, Kec. Puriala"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. HP Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formData.noTelpOrtu || ''}
                    onChange={(e) => setFormData({ ...formData, noTelpOrtu: e.target.value })}
                    placeholder="0852-xxxx-xxxx"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Siswa</label>
                  <select
                    value={formData.statusSiswa || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, statusSiswa: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Mutasi Keluar">Mutasi Keluar</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Non-Aktif">Non-Aktif</option>
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Buku Induk Cetak */}
      {selectedSiswaDetail && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <div className="font-extrabold text-sm uppercase text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <span>LEMBAR BUKU INDUK SISWA RESMI</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Induk</span>
                </button>
                <button
                  onClick={() => setSelectedSiswaDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-800 p-6 printable-document text-slate-900 font-sans text-xs">
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <p className="font-bold text-xs uppercase">PEMERINTAH KABUPATEN KONAWE - DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                <h3 className="font-extrabold text-base uppercase">{identitasSekolah.namaSekolah}</h3>
                <h4 className="font-bold text-sm uppercase underline mt-1">LEMBAR BUKU INDUK PESERTA DIDIK</h4>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[11px]">Nomor Induk Siswa (NIS) : <strong>{selectedSiswaDetail.nis}</strong></p>
                  <p className="text-[11px] font-mono">NISN : <strong>{selectedSiswaDetail.nisn}</strong></p>
                </div>
                <div className="w-24 h-32 border border-slate-400 flex items-center justify-center text-[10px] text-slate-400 text-center p-2">
                  Pas Foto Siswa 3x4
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-800 text-[11px]">
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold w-48">1. Nama Lengkap</td>
                    <td className="border border-slate-800 p-2 font-bold text-sm text-purple-950">{selectedSiswaDetail.namaLengkap}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">2. Jenis Kelamin</td>
                    <td className="border border-slate-800 p-2">{selectedSiswaDetail.jenisKelamin}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">3. Tempat, Tanggal Lahir</td>
                    <td className="border border-slate-800 p-2">{selectedSiswaDetail.tempatLahir}, {selectedSiswaDetail.tanggalLahir}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">4. Agama</td>
                    <td className="border border-slate-800 p-2">{selectedSiswaDetail.agama}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">5. Rombel / Kelas Saat Ini</td>
                    <td className="border border-slate-800 p-2 font-bold">Kelas {selectedSiswaDetail.kelas} (Aktif)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">6. Alamat Tempat Tinggal</td>
                    <td className="border border-slate-800 p-2">{selectedSiswaDetail.alamat}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">7. Nama Orang Tua</td>
                    <td className="border border-slate-800 p-2">
                      Ayah: {selectedSiswaDetail.namaAyah} ({selectedSiswaDetail.pekerjaanAyah})<br />
                      Ibu: {selectedSiswaDetail.namaIbu} ({selectedSiswaDetail.pekerjaanIbu})
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">8. Kontak Orang Tua / Wali</td>
                    <td className="border border-slate-800 p-2">{selectedSiswaDetail.noTelpOrtu}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">9. Tahun Masuk</td>
                    <td className="border border-slate-800 p-2">{selectedSiswaDetail.tahunMasuk}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-6">
                <div className="text-center w-56">
                  <p>Puriala, 26 Agustus 2026</p>
                  <p className="font-semibold">Kepala Tata Usaha,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline uppercase">{identitasSekolah.namaKepalaTU}</p>
                  <p className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaTU}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CETAK DAFTAR BUKU INDUK SISWA (PRINT PDF / DAFTAR LENGKAP) */}
      {isPrintListModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[94vh] overflow-y-auto light-scrollbar">
            {/* Header controls (not printed) */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100 mb-4 no-print">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase text-slate-800">
                    CETAK BUKU INDUK SISWA / DAFTAR PESERTA DIDIK
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pratinjau dokumen cetak resmi &amp; ekspor PDF format standar Dapodik
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Pilih Rombel:</span>
                  <select
                    value={printKelasOption}
                    onChange={(e) => setPrintKelasOption(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Semua">Semua Kelas ({siswaList.length} Siswa)</option>
                    <option value="VII.A">Kelas VII.A ({siswaList.filter((s) => s.kelas === 'VII.A').length})</option>
                    <option value="VII.B">Kelas VII.B ({siswaList.filter((s) => s.kelas === 'VII.B').length})</option>
                    <option value="VIII">Kelas VIII ({siswaList.filter((s) => s.kelas === 'VIII').length})</option>
                    <option value="IX">Kelas IX ({siswaList.filter((s) => s.kelas === 'IX').length})</option>
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
                    BUKU INDUK PESERTA DIDIK {printKelasOption !== 'Semua' ? `(KELAS ${printKelasOption})` : ''}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-700">
                    Tahun Pelajaran 2025/2026 • Status: Aktif
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 uppercase">
                      <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-800 p-1.5 text-center w-16">NIS</th>
                      <th className="border border-slate-800 p-1.5 text-center w-20">NISN</th>
                      <th className="border border-slate-800 p-1.5 text-left">Nama Lengkap Siswa</th>
                      <th className="border border-slate-800 p-1.5 text-center w-10">L/P</th>
                      <th className="border border-slate-800 p-1.5 text-center w-12">Kelas</th>
                      <th className="border border-slate-800 p-1.5 text-left">Tempat, Tanggal Lahir</th>
                      <th className="border border-slate-800 p-1.5 text-left">Nama Orang Tua (Ayah / Ibu)</th>
                      <th className="border border-slate-800 p-1.5 text-left">Alamat Tempat Tinggal</th>
                      <th className="border border-slate-800 p-1.5 text-center w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaList
                      .filter((s) => printKelasOption === 'Semua' || s.kelas === printKelasOption)
                      .map((siswa, idx) => (
                        <tr key={siswa.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border border-slate-800 p-1.5 text-center font-medium">{idx + 1}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-mono">{siswa.nis}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-mono">{siswa.nisn}</td>
                          <td className="border border-slate-800 p-1.5 font-bold text-slate-900">{siswa.namaLengkap}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">
                            {siswa.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">{siswa.kelas}</td>
                          <td className="border border-slate-800 p-1.5">
                            {siswa.tempatLahir}, {siswa.tanggalLahir}
                          </td>
                          <td className="border border-slate-800 p-1.5">
                            {siswa.namaAyah} / {siswa.namaIbu}
                          </td>
                          <td className="border border-slate-800 p-1.5">{siswa.alamat}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-semibold">{siswa.statusSiswa}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="mt-3 flex justify-between items-center text-[10px] text-slate-700 bg-slate-50 p-2 border border-slate-300">
                <div>
                  <strong>Total Peserta Didik Terdaftar: </strong>
                  {siswaList.filter((s) => printKelasOption === 'Semua' || s.kelas === printKelasOption).length} Siswa
                </div>
                <div className="flex gap-4">
                  <span>
                    Laki-laki (L):{' '}
                    <strong>
                      {
                        siswaList
                          .filter((s) => printKelasOption === 'Semua' || s.kelas === printKelasOption)
                          .filter((s) => s.jenisKelamin === 'Laki-laki').length
                      }
                    </strong>
                  </span>
                  <span>
                    Perempuan (P):{' '}
                    <strong>
                      {
                        siswaList
                          .filter((s) => printKelasOption === 'Semua' || s.kelas === printKelasOption)
                          .filter((s) => s.jenisKelamin === 'Perempuan').length
                      }
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
                  <p className="font-semibold">Pengelola Kesiswaan / Kepala TU,</p>
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
