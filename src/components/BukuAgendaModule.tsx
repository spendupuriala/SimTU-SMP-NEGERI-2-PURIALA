import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Inbox,
  Send,
  Printer,
  Download,
  Calendar,
  Search,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Building2,
  FileText,
  Eye,
  X,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { SuratMasuk, SuratKeluar, IdentitasSekolah, SifatSurat } from '../types';

interface BukuAgendaModuleProps {
  suratMasuk: SuratMasuk[];
  suratKeluar: SuratKeluar[];
  identitasSekolah: IdentitasSekolah;
}

export const BukuAgendaModule: React.FC<BukuAgendaModuleProps> = ({
  suratMasuk,
  suratKeluar,
  identitasSekolah,
}) => {
  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');
  const [searchTerm, setSearchTerm] = useState('');
  const [sifatFilter, setSifatFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [bulanFilter, setBulanFilter] = useState<string>('Semua');
  const [selectedSuratMasuk, setSelectedSuratMasuk] = useState<SuratMasuk | null>(null);
  const [selectedSuratKeluar, setSelectedSuratKeluar] = useState<SuratKeluar | null>(null);
  const [exportType, setExportType] = useState<'excel' | 'csv'>('excel');

  // Filtered Surat Masuk
  const filteredSuratMasuk = useMemo(() => {
    return suratMasuk.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.noAgenda.toLowerCase().includes(q) ||
        s.noSurat.toLowerCase().includes(q) ||
        s.asalSurat.toLowerCase().includes(q) ||
        s.perihal.toLowerCase().includes(q) ||
        s.ringkasan?.toLowerCase().includes(q) ||
        (s.catatanKepsek && s.catatanKepsek.toLowerCase().includes(q)) ||
        (s.diteruskanKepada && s.diteruskanKepada.some((d) => d.toLowerCase().includes(q)));

      const matchSifat = sifatFilter === 'Semua' || s.sifat === sifatFilter;
      const matchStatus = statusFilter === 'Semua' || s.statusDisposisi === statusFilter;

      let matchBulan = true;
      if (bulanFilter !== 'Semua') {
        const dateStr = s.tanggalTerima || s.tanggalSurat;
        if (dateStr) {
          const monthNum = dateStr.split('-')[1];
          matchBulan = monthNum === bulanFilter;
        }
      }

      return matchSearch && matchSifat && matchStatus && matchBulan;
    });
  }, [suratMasuk, searchTerm, sifatFilter, statusFilter, bulanFilter]);

  // Filtered Surat Keluar
  const filteredSuratKeluar = useMemo(() => {
    return suratKeluar.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.noAgenda.toLowerCase().includes(q) ||
        s.noSurat.toLowerCase().includes(q) ||
        s.kodeKlasifikasi.toLowerCase().includes(q) ||
        s.tujuanSurat.toLowerCase().includes(q) ||
        s.perihal.toLowerCase().includes(q) ||
        s.pengonsep.toLowerCase().includes(q);

      const matchSifat = sifatFilter === 'Semua' || s.sifat === sifatFilter;
      const matchStatus = statusFilter === 'Semua' || s.statusVerifikasi === statusFilter;

      let matchBulan = true;
      if (bulanFilter !== 'Semua') {
        const dateStr = s.tanggalSurat;
        if (dateStr) {
          const monthNum = dateStr.split('-')[1];
          matchBulan = monthNum === bulanFilter;
        }
      }

      return matchSearch && matchSifat && matchStatus && matchBulan;
    });
  }, [suratKeluar, searchTerm, sifatFilter, statusFilter, bulanFilter]);

  // Helper date formatter
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1];
        const year = parts[0];
        return `${day} ${month} ${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Export to Excel (.xls HTML table XML formatted)
  const exportToExcel = (type: 'masuk' | 'keluar') => {
    const todayStr = formatIndoDate(new Date().toISOString().split('T')[0]);
    const title = type === 'masuk' ? 'BUKU AGENDA SURAT MASUK' : 'BUKU AGENDA SURAT KELUAR';
    const filename = `BUKU_AGENDA_SURAT_${type.toUpperCase()}_SMPN2_PURIALA_${new Date().getFullYear()}.xls`;

    let tableHeaders = '';
    let tableRows = '';

    if (type === 'masuk') {
      tableHeaders = `
        <tr style="background-color: #1b365d; color: #ffffff; font-weight: bold; text-align: center;">
          <th style="border: 1px solid #000; padding: 8px;">NO. URUT</th>
          <th style="border: 1px solid #000; padding: 8px;">NO. AGENDA</th>
          <th style="border: 1px solid #000; padding: 8px;">TGL TERIMA</th>
          <th style="border: 1px solid #000; padding: 8px;">NOMOR SURAT</th>
          <th style="border: 1px solid #000; padding: 8px;">TGL SURAT</th>
          <th style="border: 1px solid #000; padding: 8px;">ASAL / PENGIRIM SURAT</th>
          <th style="border: 1px solid #000; padding: 8px;">PERIHAL / ISI RINGKAS</th>
          <th style="border: 1px solid #000; padding: 8px;">SIFAT</th>
          <th style="border: 1px solid #000; padding: 8px;">DITERUSKAN KEPADA</th>
          <th style="border: 1px solid #000; padding: 8px;">DISPOSISI & INSTRUKSI KEPSEK</th>
          <th style="border: 1px solid #000; padding: 8px;">STATUS</th>
        </tr>
      `;

      tableRows = filteredSuratMasuk.map((s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center; font-weight: bold;">${s.noAgenda}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.tanggalTerima}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; font-family: monospace;">${s.noSurat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.tanggalSurat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; font-weight: 500;">${s.asalSurat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px;">${s.perihal}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.sifat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px;">${(s.diteruskanKepada || []).join(', ') || '-'}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px;">${s.catatanKepsek || s.instruksiDisposisi || '-'}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.statusDisposisi}</td>
        </tr>
      `).join('');
    } else {
      tableHeaders = `
        <tr style="background-color: #065f46; color: #ffffff; font-weight: bold; text-align: center;">
          <th style="border: 1px solid #000; padding: 8px;">NO. URUT</th>
          <th style="border: 1px solid #000; padding: 8px;">NO. AGENDA</th>
          <th style="border: 1px solid #000; padding: 8px;">KODE KLASIFIKASI</th>
          <th style="border: 1px solid #000; padding: 8px;">NOMOR SURAT</th>
          <th style="border: 1px solid #000; padding: 8px;">TGL SURAT</th>
          <th style="border: 1px solid #000; padding: 8px;">TUJUAN SURAT</th>
          <th style="border: 1px solid #000; padding: 8px;">PERIHAL / ISI POKOK</th>
          <th style="border: 1px solid #000; padding: 8px;">PENGONSEP</th>
          <th style="border: 1px solid #000; padding: 8px;">PENANDATANGAN</th>
          <th style="border: 1px solid #000; padding: 8px;">STATUS VERIFIKASI</th>
        </tr>
      `;

      tableRows = filteredSuratKeluar.map((s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center; font-weight: bold;">${s.noAgenda}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center; font-weight: bold; color: #047857;">${s.kodeKlasifikasi}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; font-family: monospace;">${s.noSurat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.tanggalSurat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; font-weight: 500;">${s.tujuanSurat}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px;">${s.perihal}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px;">${s.pengonsep}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px;">${s.penandatangan}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.statusVerifikasi}</td>
        </tr>
      `).join('');
    }

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${type === 'masuk' ? 'Agenda Surat Masuk' : 'Agenda Surat Keluar'}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          .header-title { font-size: 14pt; font-weight: bold; text-align: center; }
          .sub-title { font-size: 11pt; text-align: center; color: #334155; }
        </style>
      </head>
      <body>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="${type === 'masuk' ? 11 : 10}" class="header-title">PEMERINTAH KABUPATEN KONAWE</td>
          </tr>
          <tr>
            <td colspan="${type === 'masuk' ? 11 : 10}" class="header-title">DINAS PENDIDIKAN DAN KEBUDAYAAN</td>
          </tr>
          <tr>
            <td colspan="${type === 'masuk' ? 11 : 10}" class="header-title" style="font-size: 16pt; color: #1b365d;">${identitasSekolah.namaSekolah.toUpperCase()}</td>
          </tr>
          <tr>
            <td colspan="${type === 'masuk' ? 11 : 10}" class="sub-title">${identitasSekolah.alamatSekolah} | NPSN: ${identitasSekolah.npsn}</td>
          </tr>
          <tr>
            <td colspan="${type === 'masuk' ? 11 : 10}" style="text-align: center; font-size: 13pt; font-weight: bold; padding-top: 10px; text-decoration: underline;">
              ${title}
            </td>
          </tr>
          <tr>
            <td colspan="${type === 'masuk' ? 11 : 10}" style="text-align: center; font-size: 10pt; color: #64748b; padding-bottom: 15px;">
              Tahun Pelajaran: ${identitasSekolah.tahunPelajaranAktif} | Diekspor pada: ${todayStr}
            </td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000;">
          <thead>
            ${tableHeaders}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%; border: none;">
          <tr>
            <td colspan="4" style="text-align: center;">
              Mengetahui,<br/>
              <b>Kepala SMP Negeri 2 Puriala</b><br/><br/><br/><br/>
              <b><u>${identitasSekolah.namaKepalaSekolah}</u></b><br/>
              NIP. ${identitasSekolah.nipKepalaSekolah}
            </td>
            <td colspan="${type === 'masuk' ? 3 : 2}"></td>
            <td colspan="4" style="text-align: center;">
              Puriala, ${todayStr}<br/>
              <b>Pengelola Agenda / Ka. Tata Usaha</b><br/><br/><br/><br/>
              <b><u>${identitasSekolah.namaKepalaTU}</u></b><br/>
              NIP. ${identitasSekolah.nipKepalaTU}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to CSV with UTF-8 BOM
  const exportCSV = (type: 'masuk' | 'keluar') => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'masuk') {
      headers = [
        'No Urut',
        'No Agenda',
        'Tanggal Terima',
        'Nomor Surat',
        'Tanggal Surat',
        'Asal Surat / Pengirim',
        'Perihal / Isi Ringkas',
        'Sifat Surat',
        'Kategori',
        'Diteruskan Kepada',
        'Catatan Disposisi Kepsek',
        'Status Disposisi',
      ];
      rows = filteredSuratMasuk.map((s, idx) => [
        `"${idx + 1}"`,
        `"${s.noAgenda}"`,
        `"${s.tanggalTerima}"`,
        `"${s.noSurat}"`,
        `"${s.tanggalSurat}"`,
        `"${(s.asalSurat || '').replace(/"/g, '""')}"`,
        `"${(s.perihal || '').replace(/"/g, '""')}"`,
        `"${s.sifat}"`,
        `"${s.kategori || ''}"`,
        `"${(s.diteruskanKepada || []).join('; ')}"`,
        `"${(s.catatanKepsek || s.instruksiDisposisi || '').replace(/"/g, '""')}"`,
        `"${s.statusDisposisi}"`,
      ]);
    } else {
      headers = [
        'No Urut',
        'No Agenda',
        'Kode Klasifikasi',
        'Nomor Surat',
        'Tanggal Surat',
        'Tujuan Surat',
        'Perihal / Isi Pokok',
        'Sifat',
        'Pengonsep',
        'Penandatangan',
        'Status Verifikasi',
      ];
      rows = filteredSuratKeluar.map((s, idx) => [
        `"${idx + 1}"`,
        `"${s.noAgenda}"`,
        `"${s.kodeKlasifikasi}"`,
        `"${s.noSurat}"`,
        `"${s.tanggalSurat}"`,
        `"${(s.tujuanSurat || '').replace(/"/g, '""')}"`,
        `"${(s.perihal || '').replace(/"/g, '""')}"`,
        `"${s.sifat}"`,
        `"${(s.pengonsep || '').replace(/"/g, '""')}"`,
        `"${(s.penandatangan || '').replace(/"/g, '""')}"`,
        `"${s.statusVerifikasi}"`,
      ]);
    }

    // Include UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BUKU_AGENDA_SURAT_${type.toUpperCase()}_SMPN2_PURIALA_${new Date().getFullYear()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (type: 'masuk' | 'keluar') => {
    if (exportType === 'excel') {
      exportToExcel(type);
    } else {
      exportCSV(type);
    }
  };

  const printBukuAgenda = () => {
    window.print();
  };

  // Quick stats
  const totalMasuk = suratMasuk.length;
  const sudahDisposisiMasuk = suratMasuk.filter((s) => s.statusDisposisi === 'Sudah Disposisi' || s.statusDisposisi === 'Selesai / Tindak Lanjut').length;
  const belumDisposisiMasuk = suratMasuk.filter((s) => s.statusDisposisi === 'Belum Disposisi').length;
  const sifatPentingMasuk = suratMasuk.filter((s) => s.sifat === 'Penting' || s.sifat === 'Segera' || s.sifat === 'Sangat Segera').length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Administrasi Persuratan / <span className="text-slate-800 font-semibold">Buku Agenda Digital</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-amber-600" />
            <span>BUKU AGENDA DIGITAL PERSURATAN RESMI</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan, pengarsipan, dan rekapitulasi buku agenda resmi Surat Masuk dan Surat Keluar SMP Negeri 2 Puriala.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 no-print flex-wrap">
          {/* Format Selector Dropdown */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setExportType('excel')}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${
                exportType === 'excel' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ekspor file Excel .xls lengkap dengan format tabel resmi dan KOP"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xls)</span>
            </button>
            <button
              onClick={() => setExportType('csv')}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${
                exportType === 'csv' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ekspor format CSV murni UTF-8"
            >
              <span>CSV</span>
            </button>
          </div>

          <button
            onClick={() => handleExport(activeTab)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Ekspor seluruh data buku agenda saat ini ke spreadsheet Excel"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor {exportType === 'excel' ? 'Excel (.xls)' : 'CSV'}</span>
          </button>

          <button
            onClick={printBukuAgenda}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Cetak Buku Agenda Resmi atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Buku Agenda</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (No Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Agenda Masuk</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalMasuk} <span className="text-xs font-normal text-slate-400">Surat</span></p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Sudah Disposisi</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{sudahDisposisiMasuk} <span className="text-xs font-normal text-slate-400">Surat</span></p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Belum Disposisi</p>
            <p className="text-xl font-extrabold text-amber-700 mt-0.5">{belumDisposisiMasuk} <span className="text-xs font-normal text-slate-400">Surat</span></p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Sifat Penting / Segera</p>
            <p className="text-xl font-extrabold text-red-700 mt-0.5">{sifatPentingMasuk} <span className="text-xs font-normal text-slate-400">Surat</span></p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Selector & Filter Bar (No Print) */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between no-print">
        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('masuk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'masuk'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Buku Agenda Surat Masuk ({suratMasuk.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('keluar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'keluar'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Buku Agenda Surat Keluar ({suratKeluar.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'masuk' ? "Cari nomor agenda, asal surat, perihal..." : "Cari kode, tujuan, nomor surat..."}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sifat Filter */}
          <select
            value={sifatFilter}
            onChange={(e) => setSifatFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="Semua">Semua Sifat</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Segera">Segera</option>
            <option value="Sangat Segera">Sangat Segera</option>
            <option value="Rahasia">Rahasia</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            {activeTab === 'masuk' ? (
              <>
                <option value="Belum Disposisi">Belum Disposisi</option>
                <option value="Sudah Disposisi">Sudah Disposisi</option>
                <option value="Selesai / Tindak Lanjut">Selesai / Tindak Lanjut</option>
              </>
            ) : (
              <>
                <option value="Draf">Draf</option>
                <option value="Disetujui Kepala Sekolah">Disetujui Kepsek</option>
                <option value="Sudah Dikirim">Sudah Dikirim</option>
                <option value="Arsip">Arsip</option>
              </>
            )}
          </select>

          {/* Bulan Filter */}
          <select
            value={bulanFilter}
            onChange={(e) => setBulanFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="Semua">Semua Bulan (2026)</option>
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>

          {/* Reset filter button */}
          {(searchTerm || sifatFilter !== 'Semua' || statusFilter !== 'Semua' || bulanFilter !== 'Semua') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSifatFilter('Semua');
                setStatusFilter('Semua');
                setBulanFilter('Semua');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg border border-dashed border-slate-300 hover:bg-slate-50 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet & Data Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 printable-document">
        {/* Official Header for Print & Display */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5 font-sans">
          <div className="flex items-center justify-between text-center relative">
            <div className="w-full text-center">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-800">
                PEMERINTAH KABUPATEN KONAWE &bull; DINAS PENDIDIKAN DAN KEBUDAYAAN
              </p>
              <h3 className="font-extrabold text-base sm:text-lg uppercase text-slate-950 tracking-wide mt-0.5">
                {identitasSekolah.namaSekolah}
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {identitasSekolah.alamatSekolah} | NPSN: {identitasSekolah.npsn} | Akreditasi: {identitasSekolah.akreditasi}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-300">
                <h4 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-900 underline">
                  {activeTab === 'masuk' ? 'BUKU AGENDA SURAT MASUK' : 'BUKU AGENDA SURAT KELUAR'}
                </h4>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Tahun Pelajaran: <strong>{identitasSekolah.tahunPelajaranAktif}</strong> &bull; Total Tercatat:{' '}
                  <strong>{activeTab === 'masuk' ? filteredSuratMasuk.length : filteredSuratKeluar.length} Dokumen</strong>
                  {bulanFilter !== 'Semua' && ` (Bulan ke-${bulanFilter})`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: BUKU AGENDA SURAT MASUK */}
        {activeTab === 'masuk' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 text-slate-900 border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center uppercase text-[11px]">
                <tr className="divide-x divide-slate-800">
                  <th className="border border-slate-800 py-2.5 px-2 w-10 text-center">No</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-28 text-center">No. Agenda</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-24 text-center">Tgl Terima</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[140px] text-left">Asal Surat / Pengirim</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[150px] text-left">Nomor & Tgl Surat</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[200px] text-left">Perihal & Ringkasan</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-20 text-center">Sifat</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[160px] text-left">Disposisi & Instruksi</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-24 text-center">Status</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-16 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSuratMasuk.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic text-xs">
                      Tidak ada data agenda surat masuk yang sesuai dengan kriteria pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredSuratMasuk.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 transition divide-x divide-slate-800 align-top"
                    >
                      <td className="border border-slate-800 py-2 px-1.5 text-center font-bold font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center font-mono font-bold text-blue-900 whitespace-nowrap">
                        {s.noAgenda}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center whitespace-nowrap font-mono text-[11px]">
                        {s.tanggalTerima}
                      </td>
                      <td className="border border-slate-800 py-2 px-3 font-semibold text-slate-900">
                        <div>{s.asalSurat}</div>
                        {s.kategori && (
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">{s.kategori}</div>
                        )}
                      </td>
                      <td className="border border-slate-800 py-2 px-3">
                        <div className="font-mono font-medium text-slate-800 text-[11px]">{s.noSurat}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Tgl: {s.tanggalSurat}</div>
                      </td>
                      <td className="border border-slate-800 py-2 px-3">
                        <div className="font-medium text-slate-900 leading-snug">{s.perihal}</div>
                        {s.ringkasan && s.ringkasan !== s.perihal && (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 italic">
                            "{s.ringkasan}"
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.sifat === 'Penting'
                              ? 'bg-amber-100 text-amber-800'
                              : s.sifat === 'Segera' || s.sifat === 'Sangat Segera'
                              ? 'bg-red-100 text-red-800'
                              : s.sifat === 'Rahasia'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.sifat}
                        </span>
                      </td>
                      <td className="border border-slate-800 py-2 px-3">
                        {s.diteruskanKepada && s.diteruskanKepada.length > 0 && (
                          <div className="text-[11px] font-semibold text-blue-900 mb-0.5">
                            Kepada: {s.diteruskanKepada.join(', ')}
                          </div>
                        )}
                        {s.catatanKepsek ? (
                          <div className="text-[10px] italic text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                            "{s.catatanKepsek}"
                          </div>
                        ) : s.instruksiDisposisi ? (
                          <div className="text-[10px] text-slate-600">{s.instruksiDisposisi}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">-</div>
                        )}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            s.statusDisposisi === 'Sudah Disposisi'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.statusDisposisi === 'Selesai / Tindak Lanjut'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.statusDisposisi === 'Selesai / Tindak Lanjut' ? 'Selesai' : s.statusDisposisi}
                        </span>
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center no-print">
                        <button
                          onClick={() => setSelectedSuratMasuk(s)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Lihat Detail Agenda & Disposisi"
                        >
                          <Eye className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: BUKU AGENDA SURAT KELUAR */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 text-slate-900 border-collapse">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center uppercase text-[11px]">
                <tr className="divide-x divide-slate-800">
                  <th className="border border-slate-800 py-2.5 px-2 w-10 text-center">No</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-28 text-center">No. Agenda</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-24 text-center">Kode</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[160px] text-left">Nomor Surat Keluar</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-24 text-center">Tgl Surat</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[150px] text-left">Tujuan Surat</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[200px] text-left">Perihal / Isi Pokok</th>
                  <th className="border border-slate-800 py-2.5 px-3 min-w-[140px] text-left">Pengonsep & TTD</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-24 text-center">Status</th>
                  <th className="border border-slate-800 py-2.5 px-2 w-16 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSuratKeluar.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic text-xs">
                      Tidak ada data agenda surat keluar yang sesuai dengan kriteria pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredSuratKeluar.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 transition divide-x divide-slate-800 align-top"
                    >
                      <td className="border border-slate-800 py-2 px-1.5 text-center font-bold font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center font-mono font-bold text-emerald-900 whitespace-nowrap">
                        {s.noAgenda}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                        {s.kodeKlasifikasi}
                      </td>
                      <td className="border border-slate-800 py-2 px-3 font-mono font-bold text-slate-900 text-[11px]">
                        {s.noSurat}
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center whitespace-nowrap font-mono text-[11px]">
                        {s.tanggalSurat}
                      </td>
                      <td className="border border-slate-800 py-2 px-3 font-semibold text-slate-900">
                        {s.tujuanSurat}
                      </td>
                      <td className="border border-slate-800 py-2 px-3">
                        <div className="font-medium text-slate-900 leading-snug">{s.perihal}</div>
                        {s.isiSuratRingkas && (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                            {s.isiSuratRingkas}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-800 py-2 px-3">
                        <div className="font-semibold text-[11px] text-slate-900">{s.penandatangan}</div>
                        <div className="text-[10px] text-slate-500">Konsep: {s.pengonsep}</div>
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            s.statusVerifikasi === 'Sudah Dikirim' || s.statusVerifikasi === 'Arsip'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.statusVerifikasi === 'Disetujui Kepala Sekolah'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.statusVerifikasi}
                        </span>
                      </td>
                      <td className="border border-slate-800 py-2 px-2 text-center no-print">
                        <button
                          onClick={() => setSelectedSuratKeluar(s)}
                          className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                          title="Lihat Detail Surat Keluar"
                        >
                          <Eye className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signature Block for Print and Formal Record */}
        <div className="flex justify-between items-end pt-8 text-xs font-sans">
          <div className="text-center w-64">
            <p className="text-slate-700">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala SMP Negeri 2 Puriala</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase text-slate-950">{identitasSekolah.namaKepalaSekolah}</p>
            <p className="font-mono text-[11px] text-slate-700">NIP. {identitasSekolah.nipKepalaSekolah}</p>
          </div>

          <div className="text-center w-64">
            <p className="text-slate-700">Puriala, {formatIndoDate(new Date().toISOString().split('T')[0])}</p>
            <p className="font-bold text-slate-900">Pengelola Agenda / Ka. Tata Usaha</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase text-slate-950">{identitasSekolah.namaKepalaTU}</p>
            <p className="font-mono text-[11px] text-slate-700">NIP. {identitasSekolah.nipKepalaTU}</p>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL: SURAT MASUK */}
      {selectedSuratMasuk && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2 text-blue-800 font-extrabold text-sm uppercase">
                  <Inbox className="w-5 h-5" />
                  <span>Rincian Buku Agenda Surat Masuk</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">No. Agenda: <strong>{selectedSuratMasuk.noAgenda}</strong></p>
              </div>
              <button
                onClick={() => setSelectedSuratMasuk(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nomor Surat:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedSuratMasuk.noSurat}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Surat:</span>
                  <span className="font-medium text-slate-900">{formatIndoDate(selectedSuratMasuk.tanggalSurat)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Diterima:</span>
                  <span className="font-medium text-slate-900">{formatIndoDate(selectedSuratMasuk.tanggalTerima)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Sifat / Kategori:</span>
                  <span className="font-semibold text-slate-900">{selectedSuratMasuk.sifat} ({selectedSuratMasuk.kategori || 'Umum'})</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Asal Pengirim Surat:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedSuratMasuk.asalSurat}</p>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Perihal:</span>
                <p className="text-slate-800 font-medium mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedSuratMasuk.perihal}
                </p>
              </div>

              {selectedSuratMasuk.ringkasan && selectedSuratMasuk.ringkasan !== selectedSuratMasuk.perihal && (
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Ringkasan Isi Surat:</span>
                  <p className="text-slate-700 mt-0.5">{selectedSuratMasuk.ringkasan}</p>
                </div>
              )}

              {/* Disposisi Info */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs">Lembar Disposisi Kepala Sekolah</span>
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">
                    {selectedSuratMasuk.statusDisposisi}
                  </span>
                </div>
                {selectedSuratMasuk.diteruskanKepada && selectedSuratMasuk.diteruskanKepada.length > 0 && (
                  <div>
                    <span className="text-slate-600 block text-[11px]">Diteruskan Kepada:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSuratMasuk.diteruskanKepada.map((penerima, i) => (
                        <span key={i} className="bg-white text-blue-950 font-medium px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          {penerima}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedSuratMasuk.catatanKepsek && (
                  <div>
                    <span className="text-slate-600 block text-[11px]">Catatan / Instruksi Khusus:</span>
                    <p className="text-slate-900 italic font-medium bg-white p-2 rounded border border-blue-100 mt-0.5">
                      "{selectedSuratMasuk.catatanKepsek}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSuratMasuk(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: SURAT KELUAR */}
      {selectedSuratKeluar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase">
                  <Send className="w-5 h-5" />
                  <span>Rincian Buku Agenda Surat Keluar</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">No. Agenda: <strong>{selectedSuratKeluar.noAgenda}</strong></p>
              </div>
              <button
                onClick={() => setSelectedSuratKeluar(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nomor Surat Keluar:</span>
                  <span className="font-mono font-bold text-emerald-900">{selectedSuratKeluar.noSurat}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Kode Klasifikasi:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedSuratKeluar.kodeKlasifikasi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Surat:</span>
                  <span className="font-medium text-slate-900">{formatIndoDate(selectedSuratKeluar.tanggalSurat)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Verifikasi:</span>
                  <span className="font-semibold text-slate-900">{selectedSuratKeluar.statusVerifikasi}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Tujuan Surat:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedSuratKeluar.tujuanSurat}</p>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Perihal:</span>
                <p className="text-slate-800 font-medium mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedSuratKeluar.perihal}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Pengonsep Surat:</span>
                  <span className="font-medium text-slate-900">{selectedSuratKeluar.pengonsep}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Pejabat Penandatangan:</span>
                  <span className="font-medium text-slate-900">{selectedSuratKeluar.penandatangan}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSuratKeluar(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
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
