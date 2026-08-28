import React, { useState } from 'react';
import {
  Settings,
  Building2,
  UserCheck,
  Save,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Database,
  Cloud,
  FileCheck,
  HardDrive,
  LogIn,
  LogOut,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { IdentitasSekolah, DatabaseState } from '../types';
import { GoogleDriveQuota, uploadDatabaseBackupToDrive } from '../services/googleDrive';

interface PengaturanModuleProps {
  identitasSekolah: IdentitasSekolah;
  onUpdateIdentitas: (identitas: IdentitasSekolah) => void;
  onResetData: () => void;
  // Google Drive integration props
  googleUser: any | null;
  googleToken: string | null;
  isGoogleConnected: boolean;
  isGoogleLoading: boolean;
  driveQuota: GoogleDriveQuota | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  databaseState: DatabaseState;
}

export const PengaturanModule: React.FC<PengaturanModuleProps> = ({
  identitasSekolah,
  onUpdateIdentitas,
  onResetData,
  googleUser,
  googleToken,
  isGoogleConnected,
  isGoogleLoading,
  driveQuota,
  onConnectGoogle,
  onDisconnectGoogle,
  databaseState,
}) => {
  const [formData, setFormData] = useState<IdentitasSekolah>({ ...identitasSekolah });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isBackingUpGDrive, setIsBackingUpGDrive] = useState(false);
  const [gDriveBackupSuccess, setGDriveBackupSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentitas(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackupLocal = () => {
    const dataStr = localStorage.getItem('SIPEDAS_SMPN2_PURIALA_DB_V1');
    if (!dataStr) return;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BACKUP_SimTU_SMPN2_PURIALA_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupToGoogleDrive = async () => {
    if (!googleToken) {
      alert('Silakan hubungkan akun Google Drive terlebih dahulu!');
      return;
    }
    try {
      setIsBackingUpGDrive(true);
      const res = await uploadDatabaseBackupToDrive(googleToken, databaseState);
      setGDriveBackupSuccess(res.name);
      setTimeout(() => setGDriveBackupSuccess(null), 5000);
    } catch (err: any) {
      alert(`Gagal mencadangkan ke Google Drive: ${err?.message}`);
    } finally {
      setIsBackingUpGDrive(false);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.identitasSekolah) {
          localStorage.setItem('SIPEDAS_SMPN2_PURIALA_DB_V1', JSON.stringify(json));
          alert('Data berhasil dipulihkan! Halaman akan dimuat ulang.');
          window.location.reload();
        } else {
          alert('Format berkas backup tidak sesuai!');
        }
      } catch (err) {
        alert('Gagal membaca file backup JSON!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Sistem / <span className="text-slate-800 font-semibold">Pengaturan Identitas & Google Drive</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>PENGATURAN IDENTITAS & INTEGRASI GOOGLE DRIVE</span>
          </h2>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* Card 1: Integrasi Google Drive Cloud Storage */}
      <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-sm border border-blue-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-blue-100">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase">
              Integrasi Google Drive Sekolah
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              isGoogleConnected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {isGoogleConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terhubung ke Google Drive</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Belum Terhubung</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Hubungkan akun Google resmi Tata Usaha SMPN 2 Puriala untuk menyimpan salinan cadangan database, surat masuk/keluar, SK KBM, buku induk, dan berkas ijazah secara otomatis ke Google Drive.
        </p>

        {isGoogleConnected ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {googleUser?.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="Google Avatar"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    GD
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-sm text-slate-900">
                    {googleUser?.displayName || 'Akun Google Sekolah'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{googleUser?.email}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Siap sinkronisasi & pencadangan cloud
                  </p>
                </div>
              </div>

              {driveQuota && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Kapasitas Google Drive:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {driveQuota.usage} / {driveQuota.limit}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Folder Root: <span className="font-mono text-indigo-600 font-bold">SIPEDAS_SMPN2_PURIALA_ARSIP_DIGITAL</span>
                  </div>
                </div>
              )}
            </div>

            {gDriveBackupSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Basis data berhasil dicadangkan ke Google Drive sebagai <strong>{gDriveBackupSuccess}</strong>!
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBackupToGoogleDrive}
                disabled={isBackingUpGDrive}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
              >
                {isBackingUpGDrive ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Cadangkan ke Google Drive Sekarang</span>
              </button>

              <button
                type="button"
                onClick={onDisconnectGoogle}
                className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold py-2.5 px-4 rounded-lg transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Putuskan Koneksi Google Drive</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              onClick={onConnectGoogle}
              disabled={isGoogleLoading}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-3 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Menghubungkan...' : 'Hubungkan Akun Google Drive'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Card 2: Profil Satuan Pendidikan */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase">
              Identitas Resmi Sekolah & Kop Surat
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nama Satuan Pendidikan</label>
              <input
                type="text"
                required
                value={formData.namaSekolah || ''}
                onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nomor Pokok Sekolah Nasional (NPSN)</label>
              <input
                type="text"
                required
                value={formData.npsn || ''}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Alamat Lengkap</label>
              <input
                type="text"
                required
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kecamatan</label>
              <input
                type="text"
                required
                value={formData.kecamatan || ''}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                required
                value={formData.kabupaten || ''}
                onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Provinsi</label>
              <input
                type="text"
                required
                value={formData.provinsi || ''}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Kode Pos</label>
              <input
                type="text"
                value={formData.kodePos || ''}
                onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Resmi Sekolah</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.telepon || ''}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-4 pb-2 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Pejabat & Penandatangan Resmi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                required
                value={formData.namaKepalaSekolah || ''}
                onChange={(e) => setFormData({ ...formData, namaKepalaSekolah: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                required
                value={formData.nipKepalaSekolah || ''}
                onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Pangkat & Golongan Kepala Sekolah</label>
              <input
                type="text"
                value={formData.pangkatKepsek || ''}
                onChange={(e) => setFormData({ ...formData, pangkatKepsek: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nama Kepala Tata Usaha (Ka. TU)</label>
              <input
                type="text"
                required
                value={formData.namaKepalaTU || ''}
                onChange={(e) => setFormData({ ...formData, namaKepalaTU: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">NIP Kepala Tata Usaha</label>
              <input
                type="text"
                required
                value={formData.nipKepalaTU || ''}
                onChange={(e) => setFormData({ ...formData, nipKepalaTU: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas Sekolah</span>
            </button>
          </div>
        </div>
      </form>

      {/* Card 3: Manajemen Basis Data & Backup */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-900 uppercase">
            Pencadangan & Pemulihan Berkas Lokal (JSON)
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Anda juga dapat mengunduh salinan berkas cadangan offline (JSON) ke hard disk komputer atau memulihkan data dari file cadangan sebelumnya.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleBackupLocal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan Lokal (JSON)</span>
          </button>

          <label className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Pulihkan Data dari Berkas</span>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onResetData}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-4 rounded-lg transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Data ke Standar Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
