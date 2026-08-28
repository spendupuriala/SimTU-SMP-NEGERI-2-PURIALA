import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Award,
  Folder,
  FileText,
  X,
  UserCheck,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { GuruPTK, IdentitasSekolah } from '../types';

interface GuruPTKModuleProps {
  guruList: GuruPTK[];
  onAdd: (g: GuruPTK) => void;
  onUpdate: (g: GuruPTK) => void;
  onDelete: (id: string) => void;
  onReorder?: (newList: GuruPTK[]) => void;
  identitasSekolah: IdentitasSekolah;
}

export const GuruPTKModule: React.FC<GuruPTKModuleProps> = ({
  guruList,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  identitasSekolah,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [jenisFilter, setJenisFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruPTK | null>(null);
  const [selectedGuruDetail, setSelectedGuruDetail] = useState<GuruPTK | null>(null);
  const [selectedGuruBerkas, setSelectedGuruBerkas] = useState<GuruPTK | null>(null);
  const [guruToDelete, setGuruToDelete] = useState<GuruPTK | null>(null);

  const [formData, setFormData] = useState<Partial<GuruPTK>>({
    namaLengkap: '',
    nip: '',
    nuptk: '',
    jenisPTK: 'Guru Mapel',
    statusKepegawaian: 'PNS',
    golongan: 'Penata, III/c',
    jabatan: 'Guru Ahli Pertama',
    tmtPengangkatan: '2015-01-01',
    pendidikanTerakhir: 'S1 Pendidikan',
    jurusan: 'Pendidikan',
    statusSertifikasi: 'Sudah Sertifikasi',
    email: '',
    noHp: '',
    berkasDigital: [
      { id: '1', namaFile: 'SK_CPNS.pdf', jenisBerkas: 'SK CPNS/PNS', ukuran: '1.2 MB', tanggalUnggah: '2026-01-10' },
      { id: '2', namaFile: 'Ijazah_S1.pdf', jenisBerkas: 'Ijazah Terakhir', ukuran: '2.4 MB', tanggalUnggah: '2026-01-10' },
      { id: '3', namaFile: 'Sertifikat_Pendidik.pdf', jenisBerkas: 'Sertifikat Pendidik', ukuran: '900 KB', tanggalUnggah: '2026-01-10' },
    ],
  });

  const handleOpenAdd = () => {
    setEditingGuru(null);
    setFormData({
      namaLengkap: '',
      nip: '',
      nuptk: '',
      jenisPTK: 'Guru Mapel',
      statusKepegawaian: 'PNS',
      golongan: 'Penata, III/c',
      jabatan: 'Guru Ahli Pertama',
      tmtPengangkatan: '2015-01-01',
      pendidikanTerakhir: 'S1 Pendidikan',
      jurusan: 'Pendidikan',
      statusSertifikasi: 'Sudah Sertifikasi',
      email: '',
      noHp: '',
      berkasDigital: [
        { id: '1', namaFile: 'SK_Pangkat_Terakhir.pdf', jenisBerkas: 'SK Pangkat', ukuran: '1.4 MB', tanggalUnggah: '2026-02-01' },
      ],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: GuruPTK) => {
    setEditingGuru(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap) {
      alert('Mohon masukkan Nama Lengkap Guru/PTK!');
      return;
    }

    if (editingGuru) {
      onUpdate({ ...editingGuru, ...formData } as GuruPTK);
    } else {
      const newGuru: GuruPTK = {
        id: `PTK-${Date.now()}`,
        namaLengkap: formData.namaLengkap || '',
        nip: formData.nip || '-',
        nuptk: formData.nuptk || '-',
        jenisPTK: (formData.jenisPTK as any) || 'Guru Mapel',
        statusKepegawaian: (formData.statusKepegawaian as any) || 'PNS',
        golongan: formData.golongan || 'Penata, III/c',
        jabatan: formData.jabatan || 'Guru',
        tmtPengangkatan: formData.tmtPengangkatan || '2020-01-01',
        pendidikanTerakhir: formData.pendidikanTerakhir || 'S1',
        jurusan: formData.jurusan || 'Pendidikan',
        statusSertifikasi: (formData.statusSertifikasi as any) || 'Belum Sertifikasi',
        email: formData.email || '-',
        noHp: formData.noHp || '-',
        berkasDigital: formData.berkasDigital || [],
      };
      onAdd(newGuru);
    }
    setIsAddModalOpen(false);
  };

  const handleMoveGuru = (id: string, direction: 'up' | 'down') => {
    const currentIndex = guruList.findIndex((g) => g.id === id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === guruList.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newList = [...guruList];
    const temp = newList[currentIndex];
    newList[currentIndex] = newList[targetIndex];
    newList[targetIndex] = temp;

    if (onReorder) {
      onReorder(newList);
    }
  };

  const exportCSV = () => {
    const headers = ['Nama Lengkap', 'NIP', 'NUPTK', 'Jenis PTK', 'Status Kepegawaian', 'Golongan', 'Jabatan', 'Pendidikan', 'Sertifikasi', 'No HP'];
    const rows = guruList.map((g) => [
      `"${g.namaLengkap}"`,
      `"${g.nip}"`,
      `"${g.nuptk}"`,
      `"${g.jenisPTK}"`,
      `"${g.statusKepegawaian}"`,
      `"${g.golongan}"`,
      `"${g.jabatan}"`,
      `"${g.pendidikanTerakhir}"`,
      `"${g.statusSertifikasi}"`,
      `"${g.noHp}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_GURU_PTK_SMPN2_PURIALA_2026.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filtered = guruList.filter((g) => {
    const matchSearch =
      g.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nip.includes(searchTerm) ||
      g.nuptk.includes(searchTerm) ||
      g.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || g.statusKepegawaian === statusFilter;
    const matchJenis = jenisFilter === 'Semua' || g.jenisPTK === jenisFilter;
    return matchSearch && matchStatus && matchJenis;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Kepegawaian / <span className="text-slate-800 font-semibold">Data Guru & Tenaga Kependidikan</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>DATA GURU & PTK + BERKAS DIGITAL</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PTK</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data PTK</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Guru & Pegawai</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{guruList.length} Orang</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-teal-600">Aparatur Sipil Negara (PNS/PPPK)</p>
          <p className="text-xl font-extrabold text-teal-800 mt-1">
            {guruList.filter((g) => g.statusKepegawaian === 'PNS' || g.statusKepegawaian === 'PPPK').length} Pegawai
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600">Guru Non-ASN / Honorer</p>
          <p className="text-xl font-extrabold text-amber-800 mt-1">
            {guruList.filter((g) => g.statusKepegawaian === 'Honorer / GTT').length} Guru
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-purple-600">Guru Bersertifikasi (Gr)</p>
          <p className="text-xl font-extrabold text-purple-800 mt-1">
            {guruList.filter((g) => g.statusSertifikasi === 'Sudah Sertifikasi').length} Pendidik
          </p>
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
            placeholder="Cari nama guru, NIP, NUPTK, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Semua">Semua Status Kepegawaian</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="Honorer / GTT">Honorer / GTT</option>
          </select>
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Semua">Semua Jenis PTK</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
            <option value="Guru Mapel">Guru Mapel</option>
            <option value="Guru BK">Guru BK</option>
            <option value="Tenaga Administrasi Sekolah">Tenaga Administrasi (TU)</option>
            <option value="Penjaga / Kebersihan">Penjaga / Kebersihan</option>
          </select>
        </div>
      </div>

      {/* Table of PTK */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">No</th>
                <th className="py-3 px-3.5">Nama &amp; Gelar / NIP</th>
                <th className="py-3 px-3.5">Status &amp; Golongan</th>
                <th className="py-3 px-3.5">Jenis PTK &amp; Jabatan</th>
                <th className="py-3 px-3.5">Pendidikan Terakhir</th>
                <th className="py-3 px-3.5">Sertifikasi</th>
                <th className="py-3 px-3.5 text-center">Berkas</th>
                <th className="py-3 px-3.5 text-center w-28">Urutan / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.namaLengkap}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">NIP: {item.nip}</div>
                    {item.nuptk && item.nuptk !== '-' && (
                      <div className="text-[10px] text-slate-400 font-mono">NUPTK: {item.nuptk}</div>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                        item.statusKepegawaian === 'PNS'
                          ? 'bg-blue-100 text-blue-800'
                          : item.statusKepegawaian === 'PPPK'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.statusKepegawaian}
                    </span>
                    <div className="text-[11px] text-slate-700 font-semibold mt-0.5">{item.golongan}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-800">{item.jenisPTK}</div>
                    <div className="text-[10px] text-slate-500">{item.jabatan}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-medium text-slate-800">{item.pendidikanTerakhir}</div>
                    <div className="text-[10px] text-slate-400">{item.jurusan}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        item.statusSertifikasi === 'Sudah Sertifikasi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.statusSertifikasi === 'Sudah Sertifikasi' ? 'Tersertifikasi' : 'Belum'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <button
                      onClick={() => setSelectedGuruBerkas(item)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1"
                    >
                      <Folder className="w-3 h-3 text-amber-500" />
                      <span>{item.berkasDigital.length} Berkas</span>
                    </button>
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleMoveGuru(item.id, 'up')}
                          disabled={idx === 0 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'}
                          className={`p-1 rounded transition ${
                            idx === 0 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-700 hover:text-teal-700 hover:bg-teal-100'
                          }`}
                          title={
                            searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'
                              ? 'Reset filter & pencarian untuk mengubah urutan'
                              : 'Pindah Ke Atas (Naikkan Urutan)'
                          }
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGuru(item.id, 'down')}
                          disabled={idx === filtered.length - 1 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'}
                          className={`p-1 rounded transition ${
                            idx === filtered.length - 1 || !!searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-700 hover:text-teal-700 hover:bg-teal-100'
                          }`}
                          title={
                            searchTerm || statusFilter !== 'Semua' || jenisFilter !== 'Semua'
                              ? 'Reset filter & pencarian untuk mengubah urutan'
                              : 'Pindah Ke Bawah (Turunkan Urutan)'
                          }
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedGuruDetail(item)}
                        className="text-teal-600 hover:text-teal-800 p-1.5 rounded hover:bg-teal-50"
                        title="Biodata Pegawai"
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
                        onClick={() => setGuruToDelete(item)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition"
                        title="Hapus Data PTK"
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
      </div>

      {/* MODAL: Input / Edit PTK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>{editingGuru ? 'Edit Data PTK' : 'Tambah Guru & Tenaga Kependidikan'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap || ''}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  placeholder="Contoh: Sukrianto, S.Pd., M.Pd."
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIP / NIPPPK</label>
                  <input
                    type="text"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="19750512 200212 2 003"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NUPTK</label>
                  <input
                    type="text"
                    value={formData.nuptk || ''}
                    onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                    placeholder="8452750652200003"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jenis PTK</label>
                  <select
                    value={formData.jenisPTK || 'Guru Mapel'}
                    onChange={(e) => setFormData({ ...formData, jenisPTK: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Guru BK">Guru BK</option>
                    <option value="Tenaga Administrasi Sekolah">Tenaga Administrasi (TU)</option>
                    <option value="Penjaga / Kebersihan">Penjaga / Kebersihan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Kepegawaian</label>
                  <select
                    value={formData.statusKepegawaian || 'PNS'}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer / GTT">Honorer / GTT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pangkat & Golongan</label>
                  <input
                    type="text"
                    value={formData.golongan || ''}
                    onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                    placeholder="Pembina, IV/a"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jabatan Fungsional/Struktural</label>
                  <input
                    type="text"
                    value={formData.jabatan || ''}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Guru Ahli Madya / Kepala TU"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">TMT Pengangkatan Pertama</label>
                  <input
                    type="date"
                    value={formData.tmtPengangkatan || ''}
                    onChange={(e) => setFormData({ ...formData, tmtPengangkatan: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pendidikan Terakhir</label>
                  <input
                    type="text"
                    value={formData.pendidikanTerakhir || ''}
                    onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                    placeholder="S1 / S2"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jurusan / Program Studi</label>
                  <input
                    type="text"
                    value={formData.jurusan || ''}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    placeholder="Pendidikan Matematika"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Sertifikasi</label>
                  <select
                    value={formData.statusSertifikasi || 'Sudah Sertifikasi'}
                    onChange={(e) => setFormData({ ...formData, statusSertifikasi: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="Sudah Sertifikasi">Sudah Sertifikasi</option>
                    <option value="Belum Sertifikasi">Belum Sertifikasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="0852-xxxx-xxxx"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Aktif</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="guru@smpn2puriala.sch.id"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-md"
                >
                  Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Berkas Digital Pegawai */}
      {selectedGuruBerkas && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span>Berkas Digital Pegawai</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedGuruBerkas.namaLengkap}</p>
              </div>
              <button onClick={() => setSelectedGuruBerkas(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {selectedGuruBerkas.berkasDigital.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada berkas yang diunggah.</p>
              ) : (
                selectedGuruBerkas.berkasDigital.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <div>
                        <p className="font-bold text-slate-800">{b.jenisBerkas}</p>
                        <p className="text-[10px] text-slate-500">{b.namaFile} • {b.ukuran}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Tersimpan Cloud
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedGuruBerkas(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Biodata Pegawai */}
      {selectedGuruDetail && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <span className="font-extrabold text-sm uppercase text-slate-800">BIODATA PEGAWAI / PTK RESMI</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Biodata</span>
                </button>
                <button onClick={() => setSelectedGuruDetail(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-800 p-6 printable-document text-slate-900 font-sans text-xs">
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
                <p className="font-bold text-xs uppercase">PEMERINTAH KABUPATEN KONAWE - DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                <h3 className="font-extrabold text-base uppercase">{identitasSekolah.namaSekolah}</h3>
                <h4 className="font-bold text-xs uppercase underline mt-1">LEMBAR BIODATA PENDIDIK DAN TENAGA KEPENDIDIKAN</h4>
              </div>

              <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold w-44">Nama Lengkap & Gelar</td>
                    <td className="border border-slate-800 p-2 font-bold text-teal-950">{selectedGuruDetail.namaLengkap}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">NIP / NIPPPK</td>
                    <td className="border border-slate-800 p-2 font-mono font-bold">{selectedGuruDetail.nip}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">NUPTK</td>
                    <td className="border border-slate-800 p-2 font-mono">{selectedGuruDetail.nuptk}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Status Kepegawaian</td>
                    <td className="border border-slate-800 p-2 font-semibold">{selectedGuruDetail.statusKepegawaian} ({selectedGuruDetail.golongan})</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Jabatan / Tugas</td>
                    <td className="border border-slate-800 p-2">{selectedGuruDetail.jabatan}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Pendidikan Terakhir</td>
                    <td className="border border-slate-800 p-2">{selectedGuruDetail.pendidikanTerakhir} - {selectedGuruDetail.jurusan}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Status Sertifikasi</td>
                    <td className="border border-slate-800 p-2 font-bold">{selectedGuruDetail.statusSertifikasi}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2 font-bold">Kontak & Email</td>
                    <td className="border border-slate-800 p-2">HP: {selectedGuruDetail.noHp} | Email: {selectedGuruDetail.email}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-4 text-xs">
                <div className="text-center w-56">
                  <p>Puriala, 26 Agustus 2026</p>
                  <p className="font-semibold">Kepala SMP Negeri 2 Puriala,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{identitasSekolah.namaKepalaSekolah}</p>
                  <p className="font-mono text-[10px]">NIP. {identitasSekolah.nipKepalaSekolah}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Konfirmasi Hapus PTK */}
      {guruToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Hapus Data Guru / PTK?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data pendidik / tenaga kependidikan berikut dari database sekolah?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 mb-5 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {guruToDelete.namaLengkap}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                NIP. {guruToDelete.nip} | NUPTK: {guruToDelete.nuptk || '-'}
              </div>
              <div className="text-teal-800 font-medium text-[11px] pt-1 border-t border-slate-200/80">
                Jabatan: <strong>{guruToDelete.jabatan}</strong> ({guruToDelete.statusKepegawaian})
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGuruToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(guruToDelete.id);
                  setGuruToDelete(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
