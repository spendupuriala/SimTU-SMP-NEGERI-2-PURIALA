import React, { useState } from 'react';
import {
  UserPlus,
  Plus,
  Search,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  FileCheck,
  X,
  School,
  GraduationCap,
} from 'lucide-react';
import { IdentitasSekolah } from '../types';

export interface PPDBCalonSiswa {
  id: string;
  noPendaftaran: string;
  nisn: string;
  namaCalon: string;
  sekolahAsal: string;
  jalur: 'Zonasi' | 'Afirmasi (KIP/PKH)' | 'Prestasi Akademik' | 'Perpindahan Tugas Orang Tua';
  statusBerkas: 'Lengkap' | 'Belum Lengkap' | 'Ditolak';
  statusSeleksi: 'Diterima' | 'Proses Seleksi' | 'Cadangan' | 'Tidak Diterima';
  jarakRumahKm: number;
  nilaiRataRataSD: number;
  tanggalDaftar: string;
  noHp: string;
}

interface PPDBRaporModuleProps {
  identitasSekolah: IdentitasSekolah;
}

export const PPDBRaporModule: React.FC<PPDBRaporModuleProps> = ({ identitasSekolah }) => {
  const [activeTab, setActiveTab] = useState<'ppdb' | 'mutasi'>('ppdb');
  const [searchTerm, setSearchTerm] = useState('');
  const [jalurFilter, setJalurFilter] = useState('Semua');

  // Initial mock data for PPDB
  const [calonList, setCalonList] = useState<PPDBCalonSiswa[]>([
    {
      id: 'PPDB-01',
      noPendaftaran: 'PPDB-2026/001',
      nisn: '0123984712',
      namaCalon: 'Muh. Fathir Rahman',
      sekolahAsal: 'SDN 1 Puriala',
      jalur: 'Zonasi',
      statusBerkas: 'Lengkap',
      statusSeleksi: 'Diterima',
      jarakRumahKm: 0.8,
      nilaiRataRataSD: 88.5,
      tanggalDaftar: '2026-06-15',
      noHp: '085341239981',
    },
    {
      id: 'PPDB-02',
      noPendaftaran: 'PPDB-2026/002',
      nisn: '0128912384',
      namaCalon: 'Nabila Putri Cahyani',
      sekolahAsal: 'SDN 2 Mokaleleo',
      jalur: 'Afirmasi (KIP/PKH)',
      statusBerkas: 'Lengkap',
      statusSeleksi: 'Diterima',
      jarakRumahKm: 1.2,
      nilaiRataRataSD: 85.0,
      tanggalDaftar: '2026-06-15',
      noHp: '082199847123',
    },
    {
      id: 'PPDB-03',
      noPendaftaran: 'PPDB-2026/003',
      nisn: '0134918231',
      namaCalon: 'Gilang Ramadhan',
      sekolahAsal: 'SDN 1 Sonai',
      jalur: 'Prestasi Akademik',
      statusBerkas: 'Lengkap',
      statusSeleksi: 'Diterima',
      jarakRumahKm: 3.5,
      nilaiRataRataSD: 92.4,
      tanggalDaftar: '2026-06-16',
      noHp: '081245678901',
    },
    {
      id: 'PPDB-04',
      noPendaftaran: 'PPDB-2026/004',
      nisn: '0129841723',
      namaCalon: 'Amanda Zahra',
      sekolahAsal: 'SDN 1 Puriala',
      jalur: 'Zonasi',
      statusBerkas: 'Belum Lengkap',
      statusSeleksi: 'Proses Seleksi',
      jarakRumahKm: 1.5,
      nilaiRataRataSD: 82.0,
      tanggalDaftar: '2026-06-17',
      noHp: '085299441122',
    },
  ]);

  const [isAddCalonOpen, setIsAddCalonOpen] = useState(false);
  const [selectedForPrintForm, setSelectedForPrintForm] = useState<PPDBCalonSiswa | null>(null);

  const [formCalon, setFormCalon] = useState<Partial<PPDBCalonSiswa>>({
    noPendaftaran: `PPDB-2026/${String(calonList.length + 1).padStart(3, '0')}`,
    nisn: '',
    namaCalon: '',
    sekolahAsal: 'SDN 1 Puriala',
    jalur: 'Zonasi',
    statusBerkas: 'Lengkap',
    statusSeleksi: 'Proses Seleksi',
    jarakRumahKm: 1.0,
    nilaiRataRataSD: 85.0,
    tanggalDaftar: new Date().toISOString().split('T')[0],
    noHp: '',
  });

  const handleAddCalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCalon.namaCalon || !formCalon.nisn) return;
    const newC: PPDBCalonSiswa = {
      id: `PPDB-${Date.now()}`,
      noPendaftaran: formCalon.noPendaftaran || `PPDB-2026/${String(calonList.length + 1).padStart(3, '0')}`,
      nisn: formCalon.nisn || '',
      namaCalon: formCalon.namaCalon || '',
      sekolahAsal: formCalon.sekolahAsal || '',
      jalur: (formCalon.jalur as any) || 'Zonasi',
      statusBerkas: (formCalon.statusBerkas as any) || 'Lengkap',
      statusSeleksi: (formCalon.statusSeleksi as any) || 'Proses Seleksi',
      jarakRumahKm: Number(formCalon.jarakRumahKm) || 1,
      nilaiRataRataSD: Number(formCalon.nilaiRataRataSD) || 80,
      tanggalDaftar: formCalon.tanggalDaftar || new Date().toISOString().split('T')[0],
      noHp: formCalon.noHp || '-',
    };
    setCalonList([...calonList, newC]);
    setIsAddCalonOpen(false);
  };

  const filtered = calonList.filter((c) => {
    const matchSearch =
      c.namaCalon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nisn.includes(searchTerm) ||
      c.sekolahAsal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJalur = jalurFilter === 'Semua' || c.jalur === jalurFilter;
    return matchSearch && matchJalur;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Kesiswaan / <span className="text-slate-800 font-semibold">PPDB & Mutasi</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>PPDB & MANAJEMEN MUTASI SISWA</span>
          </h2>
        </div>

        <button
          onClick={() => {
            setFormCalon({
              noPendaftaran: `PPDB-2026/${String(calonList.length + 1).padStart(3, '0')}`,
              nisn: '',
              namaCalon: '',
              sekolahAsal: 'SDN 1 Puriala',
              jalur: 'Zonasi',
              statusBerkas: 'Lengkap',
              statusSeleksi: 'Proses Seleksi',
              jarakRumahKm: 1.0,
              nilaiRataRataSD: 85.0,
              tanggalDaftar: new Date().toISOString().split('T')[0],
              noHp: '',
            });
            setIsAddCalonOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Daftarkan Calon Siswa Baru</span>
        </button>
      </div>

      {/* Stats Cards PPDB */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Pendaftar</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{calonList.length} Siswa</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600">Diterima (Lolos)</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">
            {calonList.filter((c) => c.statusSeleksi === 'Diterima').length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600">Proses Verifikasi</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">
            {calonList.filter((c) => c.statusSeleksi === 'Proses Seleksi').length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-indigo-600">Daya Tampung (Kuota)</p>
          <p className="text-xl font-extrabold text-indigo-800 mt-1">64 Siswa (2 Rombel)</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari calon siswa, NISN, atau sekolah asal SD..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={jalurFilter}
          onChange={(e) => setJalurFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Semua">Semua Jalur PPDB</option>
          <option value="Zonasi">Zonasi</option>
          <option value="Afirmasi (KIP/PKH)">Afirmasi (KIP/PKH)</option>
          <option value="Prestasi Akademik">Prestasi Akademik</option>
          <option value="Perpindahan Tugas Orang Tua">Perpindahan Tugas Orang Tua</option>
        </select>
      </div>

      {/* Table Calon Siswa */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">No. Daftar & NISN</th>
                <th className="py-3 px-3.5">Nama Calon Siswa</th>
                <th className="py-3 px-3.5">Sekolah Asal (SD/MI)</th>
                <th className="py-3 px-3.5">Jalur & Jarak</th>
                <th className="py-3 px-3.5">Rata-Rata Rapor</th>
                <th className="py-3 px-3.5">Status Seleksi</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3.5 font-mono">
                    <div className="font-bold text-indigo-700">{item.noPendaftaran}</div>
                    <div className="text-[10px] text-slate-400">NISN: {item.nisn}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900">{item.namaCalon}</div>
                    <div className="text-[10px] text-slate-400">HP: {item.noHp}</div>
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800">{item.sekolahAsal}</td>
                  <td className="py-3 px-3.5">
                    <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                      {item.jalur}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.jarakRumahKm} km dari sekolah</div>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-800">{item.nilaiRataRataSD}</td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        item.statusSeleksi === 'Diterima'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.statusSeleksi === 'Proses Seleksi'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.statusSeleksi === 'Diterima' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.statusSeleksi}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedForPrintForm(item)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1"
                      title="Cetak Bukti Pendaftaran"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Cetak Bukti</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Calon */}
      {isAddCalonOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Pendaftaran Peserta Didik Baru (PPDB)</span>
              </h3>
              <button onClick={() => setIsAddCalonOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCalon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Pendaftaran</label>
                  <input
                    type="text"
                    required
                    value={formCalon.noPendaftaran || ''}
                    onChange={(e) => setFormCalon({ ...formCalon, noPendaftaran: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NISN Calon Siswa</label>
                  <input
                    type="text"
                    required
                    value={formCalon.nisn || ''}
                    onChange={(e) => setFormCalon({ ...formCalon, nisn: e.target.value })}
                    placeholder="012xxxxxxx"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Calon Siswa</label>
                <input
                  type="text"
                  required
                  value={formCalon.namaCalon || ''}
                  onChange={(e) => setFormCalon({ ...formCalon, namaCalon: e.target.value })}
                  placeholder="Nama sesuai Akta Kelahiran"
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sekolah Asal (SD/MI)</label>
                  <input
                    type="text"
                    required
                    value={formCalon.sekolahAsal || ''}
                    onChange={(e) => setFormCalon({ ...formCalon, sekolahAsal: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jalur Pendaftaran</label>
                  <select
                    value={formCalon.jalur || 'Zonasi'}
                    onChange={(e) => setFormCalon({ ...formCalon, jalur: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="Zonasi">Zonasi</option>
                    <option value="Afirmasi (KIP/PKH)">Afirmasi (KIP/PKH)</option>
                    <option value="Prestasi Akademik">Prestasi Akademik</option>
                    <option value="Perpindahan Tugas Orang Tua">Perpindahan Tugas Orang Tua</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jarak (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formCalon.jarakRumahKm ?? 0}
                    onChange={(e) => setFormCalon({ ...formCalon, jarakRumahKm: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rata-Rata Rapor</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formCalon.nilaiRataRataSD ?? 0}
                    onChange={(e) => setFormCalon({ ...formCalon, nilaiRataRataSD: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. HP/WA Ortu</label>
                  <input
                    type="text"
                    value={formCalon.noHp || ''}
                    onChange={(e) => setFormCalon({ ...formCalon, noHp: e.target.value })}
                    placeholder="0852xxx"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCalonOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md"
                >
                  Simpan Calon Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak Bukti PPDB */}
      {selectedForPrintForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <span className="font-extrabold text-sm uppercase text-slate-800">BUKTI TANDA TERIMA PENDAFTARAN PPDB</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Tanda Terima</span>
                </button>
                <button onClick={() => setSelectedForPrintForm(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-800 p-6 printable-document text-slate-900 font-sans text-xs">
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <p className="font-bold text-xs uppercase">PANITIA PENERIMAAN PESERTA DIDIK BARU (PPDB)</p>
                <h3 className="font-extrabold text-sm uppercase">{identitasSekolah.namaSekolah}</h3>
                <p className="text-[10px]">Tahun Pelajaran 2026/2027</p>
              </div>

              <div className="text-center my-3">
                <h4 className="font-bold underline text-xs uppercase">BUKTI REGISTRASI FORMULIR PPDB</h4>
                <p className="font-mono font-bold text-xs">No: {selectedForPrintForm.noPendaftaran}</p>
              </div>

              <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold w-36">Nama Calon Siswa</td>
                    <td className="border border-slate-800 p-1.5 font-bold">{selectedForPrintForm.namaCalon}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">NISN</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{selectedForPrintForm.nisn}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">Sekolah Asal</td>
                    <td className="border border-slate-800 p-1.5">{selectedForPrintForm.sekolahAsal}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">Jalur Pendaftaran</td>
                    <td className="border border-slate-800 p-1.5 font-bold">{selectedForPrintForm.jalur}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">Status Seleksi Awal</td>
                    <td className="border border-slate-800 p-1.5 font-bold text-emerald-800">{selectedForPrintForm.statusSeleksi}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between pt-4 text-xs">
                <div className="text-center">
                  <p>Orang Tua / Wali,</p>
                  <div className="h-12"></div>
                  <p>( .................................... )</p>
                </div>
                <div className="text-center">
                  <p>Panitia PPDB SMPN 2 Puriala,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline">{identitasSekolah.namaKepalaTU}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
