import React, { useState } from 'react';
import {
  Landmark,
  Search,
  Bell,
  UserCheck,
  RotateCw,
  Menu,
  X,
  HardDrive,
  Building,
  CheckCircle2,
  LogOut,
  LogIn,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab, IdentitasSekolah } from '../types';
import { GoogleDriveQuota } from '../services/googleDrive';

interface HeaderProps {
  identitasSekolah: IdentitasSekolah;
  activeTab: ActiveTab;
  onToggleSidebar: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onSearch: (term: string) => void;
  // Google Drive Auth props
  googleUser: any | null;
  isGoogleConnected: boolean;
  isGoogleLoading: boolean;
  driveQuota: GoogleDriveQuota | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  // Auto-sync props
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedTime?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  identitasSekolah,
  activeTab: _activeTab,
  onToggleSidebar,
  onSync,
  isSyncing,
  onSearch,
  googleUser,
  isGoogleConnected,
  isGoogleLoading,
  driveQuota,
  onConnectGoogle,
  onDisconnectGoogle,
  autoSyncStatus = 'idle',
  lastSyncedTime,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="bg-[#1b365d] text-white flex items-center justify-between px-3 md:px-5 py-2.5 shadow-md shrink-0 border-b border-slate-700/50 z-30 relative">
      {/* Mobile Toggle & Logo & Title */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-blue-200"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-md border border-white/20 shrink-0 bg-white/10 flex items-center justify-center">
          <img
            src="/simtu-icon.png"
            alt="SimTU SMP Negeri 2 Puriala Logo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // fallback to icon if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <Landmark className="w-5 h-5 text-blue-200 absolute -z-10" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm md:text-base tracking-wide leading-none text-white flex items-center gap-2">
              SimTU {identitasSekolah.namaSekolah || 'SMP NEGERI 2 PURIALA'}
            </h1>
            <span
              id="network-status-badge"
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1.5 transition-all ${
                isGoogleConnected
                  ? autoSyncStatus === 'syncing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}
              title={
                isGoogleConnected
                  ? `Otomatis tersinkron ke Google Drive: Folder TATA USAHA ${lastSyncedTime ? `(Terakhir: ${lastSyncedTime})` : ''}`
                  : 'Google Drive Terhubung'
              }
            >
              {isGoogleConnected ? (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      autoSyncStatus === 'syncing'
                        ? 'bg-amber-400 animate-spin'
                        : 'bg-emerald-400 animate-pulse'
                    }`}
                  ></span>
                  <span className="hidden sm:inline">
                    {autoSyncStatus === 'syncing'
                      ? 'Menyimpan ke Folder TATA USAHA...'
                      : 'Auto-Sync: Folder TATA USAHA'}
                  </span>
                  <span className="sm:hidden">
                    {autoSyncStatus === 'syncing' ? 'Menyimpan...' : 'Drive ON (TU)'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">Auto-Connect Google Drive Aktif</span>
                  <span className="sm:hidden">Auto-Drive</span>
                </>
              )}
            </span>
          </div>
          <p className="text-[9px] md:text-[10px] text-blue-200/80 font-medium tracking-wider uppercase mt-0.5">
            SISTEM INFORMASI PERSURATAN & ADMINISTRASI TATA USAHA • NPSN: {identitasSekolah.npsn}
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 md:mx-8 hidden sm:block relative">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-blue-200/60">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            id="global-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full pl-9 pr-8 py-1.5 bg-blue-900/40 text-white placeholder-blue-200/60 text-xs rounded-full border border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-blue-900/70 transition shadow-inner"
            placeholder="Cari Surat, NISN, NIP, Siswa, Guru, atau Berkas..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* User Controls & Google Drive Actions */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Google Drive Status / Connect Button */}
        {isGoogleConnected ? (
          <button
            onClick={onSync}
            disabled={isSyncing || autoSyncStatus === 'syncing'}
            className="text-blue-100 hover:text-white transition flex items-center gap-1.5 text-xs bg-emerald-700/60 hover:bg-emerald-600 border border-emerald-400/40 px-2.5 py-1.5 rounded-lg shadow-sm"
            title={`Database otomatis terupdate di Google Drive Folder TATA USAHA. Klik untuk cadangan manual. ${lastSyncedTime ? `(Terakhir: ${lastSyncedTime})` : ''}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing || autoSyncStatus === 'syncing' ? 'animate-spin text-amber-200' : 'text-emerald-300'}`} />
            <span className="hidden lg:inline text-[11px] font-bold">
              {isSyncing || autoSyncStatus === 'syncing' ? 'Menyimpan...' : 'TATA USAHA Sync'}
            </span>
          </button>
        ) : (
          <button
            onClick={onConnectGoogle}
            disabled={isGoogleLoading}
            className="text-white transition flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 border border-blue-400/40 px-2.5 py-1.5 rounded-lg shadow-sm font-bold"
            title="Koneksi Google Drive (Folder TATA USAHA)"
          >
            {isGoogleLoading ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-yellow-300" />
            )}
            <span className="hidden sm:inline text-[11px]">Hubungkan GDrive</span>
          </button>
        )}

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-blue-200 hover:text-white transition rounded-full hover:bg-white/10"
            title="Notifikasi Masuk"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#1b365d]">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 p-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" /> Agenda & Notifikasi TU
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                  3 Agenda
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-blue-50 hover:bg-blue-100/70 rounded-lg cursor-pointer transition border-l-2 border-blue-600">
                  <p className="font-semibold text-slate-800 text-[11px]">Penyimpanan Google Drive Aktif</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Data persuratan dan arsip dapat disinkronkan langsung ke akun Google Drive sekolah.
                  </p>
                  <span className="text-[9px] text-blue-600 font-medium">Cloud Storage Ready</span>
                </div>
                <div className="p-2 bg-amber-50 hover:bg-amber-100/70 rounded-lg cursor-pointer transition border-l-2 border-amber-500">
                  <p className="font-semibold text-slate-800 text-[11px]">SPT Dinas Workshop AI & Deep Learning</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Penugasan Guru IPA ke SMPN 1 Puriala tanggal 29-30 Agustus 2026.
                  </p>
                  <span className="text-[9px] text-amber-600 font-medium">SPPD Terbit</span>
                </div>
                <div className="p-2 bg-purple-50 hover:bg-purple-100/70 rounded-lg cursor-pointer transition border-l-2 border-purple-600">
                  <p className="font-semibold text-slate-800 text-[11px]">Penyaluran Ijazah Alumni 2025</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Register cap tiga jari dan penyerahan ijazah kepada lulusan.
                  </p>
                  <span className="text-[9px] text-purple-600 font-medium">Buku Ekspedisi Ijazah</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 border-l border-blue-400/20 pl-3 md:pl-4 hover:opacity-90 transition focus:outline-none"
          >
            {googleUser?.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt="Google Avatar"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full ring-2 ring-emerald-400/50 object-cover"
              />
            ) : (
              <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner ring-2 ring-purple-400/30">
                <UserCheck className="w-4 h-4" />
              </div>
            )}
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-white tracking-wide block leading-tight">
                {googleUser ? (googleUser.displayName || 'Akun Google') : (identitasSekolah.namaKepalaTU || 'Admin TU')}
              </span>
              <span className="text-[10px] text-blue-200/70 block leading-tight">
                {googleUser ? googleUser.email : 'Ka. Urusan Tata Usaha'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 p-3.5 text-xs">
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1.5">
                  {googleUser?.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Google Avatar"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      TU
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">
                      {googleUser?.displayName || identitasSekolah.namaKepalaTU}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {googleUser?.email || `NIP. ${identitasSekolah.nipKepalaTU}`}
                    </p>
                  </div>
                </div>
                <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {googleUser ? 'Google Drive Terhubung' : 'Akun Lokal TU'}
                </span>
              </div>

              {/* Quota & Drive Status Info */}
              {isGoogleConnected && driveQuota && (
                <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Kapasitas Google Drive:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {driveQuota.usage} / {driveQuota.limit}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Folder Arsip: <span className="font-mono text-indigo-600 font-bold">SIPEDAS_SMPN2_PURIALA_ARSIP_DIGITAL</span>
                  </div>
                </div>
              )}

              <div className="py-2 space-y-1">
                <div className="flex items-center gap-2 text-slate-600 p-1.5 bg-slate-50 rounded">
                  <Building className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">{identitasSekolah.namaSekolah}</p>
                    <p className="text-[10px] text-slate-400">{identitasSekolah.kabupaten}</p>
                  </div>
                </div>
              </div>

              {/* Connect / Disconnect Google Drive */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                {isGoogleConnected ? (
                  <button
                    onClick={() => {
                      onDisconnectGoogle();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-rose-600 hover:bg-rose-50 p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan Koneksi Google Drive</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onConnectGoogle();
                      setShowUserMenu(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Hubungkan Akun Google Drive</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
