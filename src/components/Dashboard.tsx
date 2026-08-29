import React from 'react';
import {
  Inbox,
  Send,
  Scroll,
  GraduationCap,
  Users,
  HardDrive,
  Clock,
  RotateCw,
  PlusCircle,
  FileText,
  FilePlus2,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop,
  Award,
  BookOpen,
  Cloud,
  LogIn,
} from 'lucide-react';
import { ActiveTab, DatabaseState } from '../types';
import { GoogleDriveQuota } from '../services/googleDrive';

interface DashboardProps {
  data: DatabaseState;
  onNavigate: (tab: ActiveTab) => void;
  isGoogleConnected?: boolean;
  googleUser?: any;
  driveQuota?: GoogleDriveQuota | null;
  onConnectGoogle?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onNavigate,
  isGoogleConnected,
  googleUser,
  driveQuota,
  onConnectGoogle,
}) => {
  const {
    suratMasuk,
    suratKeluar,
    skKBM,
    skTugasTambahan,
    siswa,
    guruPTK,
    driveFolders,
    alumni,
  } = data;

  const totalSM = suratMasuk.length;
  const totalSK = suratKeluar.length;
  const totalSKTerbit = skKBM.length + skTugasTambahan.length;
  const totalSiswaAktif = siswa.filter((s) => s.statusSiswa === 'Aktif').length;
  const totalPTK = guruPTK.length;
  const totalFiles = driveFolders.reduce((acc, f) => acc + (f.files ? f.files.length : 0), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Beranda / <span className="text-slate-800 font-semibold">Ikhtisar Administrasi</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5">
            DASHBOARD TATA USAHA SMPN 2 PURIALA
          </h2>
        </div>
      </div>

      {/* Welcome Banner with Official SimTU Icon */}
      <div className="bg-gradient-to-r from-[#162a45] via-[#1e3a63] to-[#254b80] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-white/30 shrink-0 bg-white/10">
            <img
              src="/simtu-icon.png"
              alt="SimTU SMP Negeri 2 Puriala App Icon"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wider">
                Aplikasi Resmi TU
              </span>
              <span className="text-slate-300 text-xs hidden sm:inline">• NPSN: 40402636</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-wide text-white mt-1">
              SimTU SMP NEGERI 2 PURIALA
            </h1>
            <p className="text-xs text-blue-100/85 mt-0.5 max-w-xl">
              Sistem Informasi Persuratan &amp; Administrasi Tata Usaha Sekolah terintegrasi Google Drive Cloud Backup.
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={() => onNavigate('pembuat-surat')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <FilePlus2 className="w-4 h-4 text-slate-950" />
            <span>Pembuat Surat</span>
          </button>
          <button
            onClick={() => onNavigate('surat-masuk')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agenda Masuk</span>
          </button>
          <button
            onClick={() => onNavigate('surat-tugas')}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl border border-white/20 shadow-sm transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>SPT Dinas</span>
          </button>
        </div>
      </div>

      {/* 6 KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Card 1: Surat Masuk */}
        <div
          onClick={() => onNavigate('surat-masuk')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold tracking-wider uppercase">
              <span className="text-base">📫</span>
              <span>TOTAL SURAT MASUK (2026)</span>
            </div>
            <Inbox className="w-4 h-4 text-blue-500 opacity-60 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-blue-900">
              {totalSM} Berkas
            </span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Disposisi Aktif
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tercatat di Agenda Masuk</span>
            <span className="font-semibold text-blue-600 group-hover:underline">Buka Berkas &rarr;</span>
          </div>
        </div>

        {/* Card 2: Surat Keluar */}
        <div
          onClick={() => onNavigate('surat-keluar')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold tracking-wider uppercase">
              <span className="text-base">📨</span>
              <span>TOTAL SURAT KELUAR RESMI</span>
            </div>
            <Send className="w-4 h-4 text-emerald-500 opacity-60 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-900">
              {totalSK} Berkas
            </span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Nomor Otomatis
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dinas, Undangan & Keterangan</span>
            <span className="font-semibold text-emerald-600 group-hover:underline">Buka Berkas &rarr;</span>
          </div>
        </div>

        {/* Card 3: SK KBM & Tugas Tambahan */}
        <div
          onClick={() => onNavigate('sk-kbm')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold tracking-wider uppercase">
              <span className="text-base">📜</span>
              <span>SK KBM & TUGAS TAMBAHAN</span>
            </div>
            <Scroll className="w-4 h-4 text-amber-500 opacity-60 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-900">
              {totalSKTerbit} SK
            </span>
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Semester Ganjil & Genap
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Distribusi Beban Ajar PTK</span>
            <span className="font-semibold text-amber-600 group-hover:underline">Buka SK &rarr;</span>
          </div>
        </div>

        {/* Card 4: Buku Induk Siswa */}
        <div
          onClick={() => onNavigate('buku-induk')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:border-sky-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold tracking-wider uppercase">
              <span className="text-base">🎓</span>
              <span>SISWA AKTIF (BUKU INDUK)</span>
            </div>
            <GraduationCap className="w-4 h-4 text-sky-500 opacity-60 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-sky-900">
              {totalSiswaAktif} Siswa
            </span>
            <span className="text-xs text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
              Kelas VII, VIII, IX
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Terintegrasi NISN & KK</span>
            <span className="font-semibold text-sky-600 group-hover:underline">Buka Siswa &rarr;</span>
          </div>
        </div>

        {/* Card 5: Guru & Tenaga Kependidikan */}
        <div
          onClick={() => onNavigate('guru-ptk')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:border-purple-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold tracking-wider uppercase">
              <span className="text-base">👥</span>
              <span>GURU & TATA USAHA (PTK)</span>
            </div>
            <Users className="w-4 h-4 text-purple-500 opacity-60 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-purple-900">
              {totalPTK} Pegawai
            </span>
            <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              PNS, PPPK & Honorer
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dapodik & Info GTK Sinkron</span>
            <span className="font-semibold text-purple-600 group-hover:underline">Buka PTK &rarr;</span>
          </div>
        </div>

        {/* Card 6: Google Drive Cloud Arsip */}
        <div
          onClick={() => onNavigate('drive-explorer')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold tracking-wider uppercase">
              <span className="text-base">☁️</span>
              <span>GOOGLE DRIVE & CLOUD ARSIP</span>
            </div>
            <HardDrive className="w-4 h-4 text-indigo-500 opacity-60 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-900">
              {isGoogleConnected ? 'Terkoneksi' : `${totalFiles} Berkas`}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                isGoogleConnected
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : 'text-indigo-600 bg-indigo-50 border-indigo-100'
              }`}
            >
              {isGoogleConnected ? 'Google Drive ON' : 'Drive Lokal'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isGoogleConnected
                ? (driveQuota ? `${driveQuota.usage} / ${driveQuota.limit}` : 'Google Workspace')
                : `${driveFolders.length} Direktori Folder`}
            </span>
            <span className="font-semibold text-indigo-600 group-hover:underline">Buka Drive &rarr;</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: AKTIVITAS PERSURATAN TERAKHIR & GOOGLE DRIVE INTEGRATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel Surat Masuk & Keluar Terkini */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Agenda Surat Menyurat Terkini (Tahun 2026)</span>
            </h3>
            <button
              onClick={() => onNavigate('buku-agenda')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              Lihat Seluruh Agenda &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nomor Surat</th>
                  <th className="py-2.5 px-3">Perihal / Pengirim</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suratMasuk.slice(0, 3).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-900 font-mono text-[11px]">
                      <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded font-bold mr-1">
                        MASUK
                      </span>
                      {item.noSurat}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 line-clamp-1">{item.perihal}</div>
                      <div className="text-[10px] text-slate-400">Dari: {item.asalSurat}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-500">
                      {item.tanggalSurat}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disposisi
                      </span>
                    </td>
                  </tr>
                ))}
                {suratKeluar.slice(0, 2).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-900 font-mono text-[11px]">
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold mr-1">
                        KELUAR
                      </span>
                      {item.noSurat}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 line-clamp-1">{item.perihal}</div>
                      <div className="text-[10px] text-slate-400">Tujuan: {item.tujuanSurat}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-500">
                      {item.tanggalSurat}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                        <CloudUpload className="w-3 h-3" /> Terbit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Mode Penyimpanan & Google Drive Hybrid */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Status Koneksi Google Drive</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Sistem beroperasi dalam mode <strong>Hybrid Local-Cloud</strong> dengan integrasi Google Drive resmi untuk pencadangan otomatis dokumen persuratan dan arsip sekolah.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>Penyimpanan Lokal:</span>
                </span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive Sekolah:</span>
                </span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    isGoogleConnected ? 'text-emerald-700' : 'text-amber-600'
                  }`}
                >
                  {isGoogleConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terhubung
                    </>
                  ) : (
                    'Belum Login'
                  )}
                </span>
              </div>
              {isGoogleConnected && driveQuota ? (
                <div className="text-[10px] text-slate-500 px-1 pt-1">
                  Akun: <strong>{googleUser?.email}</strong> ({driveQuota.usage} / {driveQuota.limit})
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 px-1 pt-1">
                  Akun: <span className="font-mono">smpnpuriala523@gmail.com</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isGoogleConnected ? (
              <button
                onClick={() => onNavigate('drive-explorer')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Buka Google Drive Explorer</span>
              </button>
            ) : (
              <button
                onClick={onConnectGoogle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Hubungkan Google Drive Sekarang</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('pengaturan')}
              className="w-full text-slate-600 hover:text-blue-700 text-[11px] font-medium py-1 text-center hover:underline flex items-center justify-center gap-1"
            >
              <span>Pengaturan & Cadangan Database</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
