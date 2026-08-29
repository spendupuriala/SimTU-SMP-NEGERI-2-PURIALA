import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Inbox,
  Send,
  BookMarked,
  FileSignature,
  Scroll,
  Award,
  PlaneTakeoff,
  FilePlus2,
  Contact,
  FileSpreadsheet,
  GraduationCap,
  Users2,
  FolderLock,
  HardDrive,
  Network,
  CloudUpload,
  Settings,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onClose?: () => void;
  counts?: {
    suratMasuk?: number;
    suratKeluar?: number;
    siswa?: number;
    guru?: number;
    pembuatSurat?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  onClose,
  counts,
}) => {
  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      handleClose();
    }
  };

  const navButtonClass = (tab: ActiveTab, activeColorClass: string = 'bg-blue-600 text-white') => {
    const isActive = activeTab === tab;
    return `w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 text-left ${
      isActive
        ? `${activeColorClass} shadow-sm font-semibold`
        : 'text-slate-300 hover:bg-[#1e2d4a] hover:text-white'
    }`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#162238] text-slate-300 flex flex-col justify-between overflow-y-auto shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="py-3 px-3 space-y-4">
          {/* Mobile close button & App Identity */}
          <div className="flex md:hidden justify-between items-center px-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <img
                src="/simtu-icon.png"
                alt="SimTU Logo"
                className="w-7 h-7 rounded-lg object-cover border border-white/20"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-black text-white tracking-wide">SimTU SMPN 2 PURIALA</span>
            </div>
            <button onClick={handleClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dashboard Utama */}
          <div>
            <button
              onClick={() => handleSelectTab('dashboard')}
              id="menu-dashboard"
              className={navButtonClass('dashboard')}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4 text-center shrink-0" />
                <span>Dashboard</span>
              </div>
            </button>
          </div>

          {/* Kelompok Persuratan */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Persuratan</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelectTab('surat-masuk')}
                id="menu-surat-masuk"
                className={navButtonClass('surat-masuk')}
              >
                <div className="flex items-center space-x-2.5">
                  <Inbox className="w-4 h-4 text-center text-blue-400 shrink-0" />
                  <span>Surat Masuk</span>
                </div>
                {counts?.suratMasuk !== undefined && (
                  <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded font-mono">
                    {counts.suratMasuk}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSelectTab('surat-keluar')}
                id="menu-surat-keluar"
                className={navButtonClass('surat-keluar')}
              >
                <div className="flex items-center space-x-2.5">
                  <Send className="w-4 h-4 text-center text-emerald-400 shrink-0" />
                  <span>Surat Keluar</span>
                </div>
                {counts?.suratKeluar !== undefined && (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                    {counts.suratKeluar}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSelectTab('buku-agenda')}
                id="menu-buku-agenda"
                className={navButtonClass('buku-agenda')}
              >
                <div className="flex items-center space-x-2.5">
                  <BookMarked className="w-4 h-4 text-center text-amber-400 shrink-0" />
                  <span>Buku Agenda Digital</span>
                </div>
              </button>
            </div>
          </div>

          {/* Kelompok Surat Keputusan (SK) */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Surat Keputusan (SK)</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelectTab('sk-kbm')}
                id="menu-sk-kbm"
                className={navButtonClass('sk-kbm')}
              >
                <div className="flex items-center space-x-2.5">
                  <Scroll className="w-4 h-4 text-center text-yellow-400 shrink-0" />
                  <span>SK KBM & Beban Jam</span>
                </div>
              </button>
              <button
                onClick={() => handleSelectTab('sk-tugas-tambahan')}
                id="menu-sk-tugas-tambahan"
                className={navButtonClass('sk-tugas-tambahan')}
              >
                <div className="flex items-center space-x-2.5">
                  <Award className="w-4 h-4 text-center text-amber-500 shrink-0" />
                  <span>SK Tugas Tambahan</span>
                </div>
              </button>
              <button
                onClick={() => handleSelectTab('surat-tugas')}
                id="menu-surat-tugas-dinas"
                className={navButtonClass('surat-tugas')}
              >
                <div className="flex items-center space-x-2.5">
                  <PlaneTakeoff className="w-4 h-4 text-center text-sky-400 shrink-0" />
                  <span>Surat Tugas Dinas (SPT)</span>
                </div>
              </button>
              <button
                onClick={() => handleSelectTab('pembuat-surat')}
                id="menu-pembuat-surat"
                className={navButtonClass('pembuat-surat')}
              >
                <div className="flex items-center space-x-2.5">
                  <FilePlus2 className="w-4 h-4 text-center text-blue-400 shrink-0" />
                  <span>Pembuat Surat</span>
                </div>
                {counts?.pembuatSurat !== undefined && (
                  <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded font-mono">
                    {counts.pembuatSurat}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Kelompok Kesiswaan */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Kesiswaan</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelectTab('buku-induk')}
                id="menu-buku-induk"
                className={navButtonClass('buku-induk')}
              >
                <div className="flex items-center space-x-2.5">
                  <Contact className="w-4 h-4 text-center text-purple-400 shrink-0" />
                  <span>Buku Induk Siswa</span>
                </div>
                {counts?.siswa !== undefined && (
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded font-mono">
                    {counts.siswa}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSelectTab('ppdb-rapor')}
                id="menu-ppdb-rapor"
                className={navButtonClass('ppdb-rapor')}
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-center text-indigo-400 shrink-0" />
                  <span>PPDB & Mutasi</span>
                </div>
              </button>
              <button
                onClick={() => handleSelectTab('alumni-ijazah')}
                id="menu-alumni-ijazah"
                className={navButtonClass('alumni-ijazah')}
              >
                <div className="flex items-center space-x-2.5">
                  <GraduationCap className="w-4 h-4 text-center text-pink-400 shrink-0" />
                  <span>Alumni & Buku Ijazah</span>
                </div>
              </button>
            </div>
          </div>

          {/* Kelompok Kepegawaian (PTK) */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Kepegawaian (PTK)</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelectTab('guru-ptk')}
                id="menu-data-guru"
                className={navButtonClass('guru-ptk')}
              >
                <div className="flex items-center space-x-2.5">
                  <Users2 className="w-4 h-4 text-center text-teal-400 shrink-0" />
                  <span>Data Guru & PTK</span>
                </div>
                {counts?.guru !== undefined && (
                  <span className="text-[10px] bg-teal-500/30 text-teal-200 px-1.5 py-0.2 rounded font-mono">
                    {counts.guru}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Kelompok Drive Explorer */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Drive Explorer</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSelectTab('drive-explorer')}
                id="menu-drive-explorer"
                className={navButtonClass('drive-explorer')}
              >
                <div className="flex items-center space-x-2.5">
                  <HardDrive className="w-4 h-4 text-center text-indigo-400 shrink-0" />
                  <span>SimTU Cloud Drive</span>
                </div>
              </button>
            </div>
          </div>

          {/* Pengaturan */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => handleSelectTab('pengaturan')}
              id="menu-pengaturan"
              className={navButtonClass('pengaturan')}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-center shrink-0" />
                <span className="font-semibold tracking-wider uppercase">PENGATURAN</span>
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center">
          <span className="font-mono text-[10px]">SimTU v2.6 Hybrid</span>
          <ShieldCheck className="w-4 h-4 text-emerald-500" title="Sistem Terproteksi & Terenkripsi" />
        </div>
      </aside>
    </>
  );
};
