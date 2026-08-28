import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  FileCheck,
  X,
  Award,
} from 'lucide-react';
import { AlumniIjazah, IdentitasSekolah } from '../types';

interface AlumniIjazahModuleProps {
  alumniList: AlumniIjazah[];
  onAdd: (item: AlumniIjazah) => void;
  onUpdate: (item: AlumniIjazah) => void;
  onDelete: (id: string) => void;
  identitasSekolah: IdentitasSekolah;
}

export const AlumniIjazahModule: React.FC<AlumniIjazahModuleProps> = ({
  alumniList,
  onAdd,
  onUpdate,
  onDelete,
  identitasSekolah,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tahunFilter, setTahunFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AlumniIjazah | null>(null);
  const [selectedForPrint, setSelectedForPrint] = useState<AlumniIjazah | null>(null);

  const [formData, setFormData] = useState<Partial<AlumniIjazah>>({
    tahunLulus: '2025',
    nisn: '',
    nis: '',
    namaLengkap: '',
    nomorSeriIjazah: 'DN-20/M-SMP/K13/24/00192',
    nomorSKL: '421.3/088/SMP.02/SKL/2025',
    tanggalPengambilan: new Date().toISOString().split('T')[0],
    namaPenerima: '',
    statusIjazah: 'Sudah Diambil',
    keterangan: 'Ijazah Asli dan SHUN diserahkan',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      tahunLulus: '2025',
      nisn: '',
      nis: '',
      namaLengkap: '',
      nomorSeriIjazah: `DN-20/M-SMP/K13/25/${String(alumniList.length + 1).padStart(5, '0')}`,
      nomorSKL: `421.3/${String(alumniList.length + 100).padStart(3, '0')}/SMP.02/SKL/2025`,
      tanggalPengambilan: new Date().toISOString().split('T')[0],
      namaPenerima: '',
      statusIjazah: 'Sudah Diambil',
      keterangan: 'Ijazah Asli diserahkan lengkap cap 3 jari',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: AlumniIjazah) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.nisn || !formData.nomorSeriIjazah) {
      alert('Mohon lengkapi Nama, NISN, dan Nomor Seri Ijazah!');
      return;
    }

    if (editingItem) {
      onUpdate({ ...editingItem, ...formData } as AlumniIjazah);
    } else {
      const newItem: AlumniIjazah = {
        id: `ALU-${Date.now()}`,
        tahunLulus: formData.tahunLulus || '2025',
        nisn: formData.nisn || '',
        nis: formData.nis || '',
        namaLengkap: formData.namaLengkap || '',
        nomorSeriIjazah: formData.nomorSeriIjazah || '',
        nomorSKL: formData.nomorSKL || '',
        tanggalPengambilan: formData.statusIjazah === 'Sudah Diambil' ? formData.tanggalPengambilan : undefined,
        namaPenerima: formData.namaPenerima || formData.namaLengkap,
        statusIjazah: (formData.statusIjazah as any) || 'Sudah Diambil',
        keterangan: formData.keterangan || '',
      };
      onAdd(newItem);
    }
    setIsAddModalOpen(false);
  };

  const exportCSV = () => {
    const headers = ['Tahun Lulus', 'NISN', 'NIS', 'Nama Lengkap', 'No Seri Ijazah', 'No SKL', 'Status Ijazah', 'Tgl Ambil', 'Penerima'];
    const rows = alumniList.map((a) => [
      `"${a.tahunLulus}"`,
      `"${a.nisn}"`,
      `"${a.nis}"`,
      `"${a.namaLengkap}"`,
      `"${a.nomorSeriIjazah}"`,
      `"${a.nomorSKL}"`,
      `"${a.statusIjazah}"`,
      `"${a.tanggalPengambilan || '-'}"`,
      `"${a.namaPenerima || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BUKU_REGISTER_IJAZAH_ALUMNI_SMPN2_PURIALA.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filtered = alumniList.filter((a) => {
    const matchSearch =
      a.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nisn.includes(searchTerm) ||
      a.nomorSeriIjazah.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTahun = tahunFilter === 'Semua' || a.tahunLulus === tahunFilter;
    const matchStatus = statusFilter === 'Semua' || a.statusIjazah === statusFilter;
    return matchSearch && matchTahun && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            Kesiswaan / <span className="text-slate-800 font-semibold">Alumni & Buku Ijazah</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rose-600" />
            <span>BUKU REGISTER IJAZAH & ALUMNI</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Register Ijazah</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Register Ijazah</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Register Ijazah</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{alumniList.length} Berkas</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600">Sudah Diserahkan (Diambil)</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">
            {alumniList.filter((a) => a.statusIjazah === 'Sudah Diambil').length} Dokumen
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-rose-600">Tersimpan di Brankas TU</p>
          <p className="text-xl font-extrabold text-rose-700 mt-1">
            {alumniList.filter((a) => a.statusIjazah === 'Belum Diambil').length} Dokumen
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
            placeholder="Cari nama alumni, NISN, atau No Seri Ijazah..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tahunFilter}
            onChange={(e) => setTahunFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="Semua">Semua Tahun Lulus</option>
            <option value="2025">Lulusan 2025</option>
            <option value="2024">Lulusan 2024</option>
            <option value="2023">Lulusan 2023</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Sudah Diambil">Sudah Diambil</option>
            <option value="Belum Diambil">Belum Diambil</option>
          </select>
        </div>
      </div>

      {/* Table of Alumni & Diplomas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Lulus & NISN</th>
                <th className="py-3 px-3.5">Nama Alumni</th>
                <th className="py-3 px-3.5">Nomor Seri Ijazah & SKL</th>
                <th className="py-3 px-3.5">Status Pengambilan</th>
                <th className="py-3 px-3.5">Penerima & Tgl Serah</th>
                <th className="py-3 px-3.5 text-center">Tanda Terima & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3.5 font-mono">
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {item.tahunLulus}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">NISN: {item.nisn}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900">{item.namaLengkap}</div>
                    <div className="text-[10px] text-slate-400 font-mono">NIS: {item.nis}</div>
                  </td>
                  <td className="py-3 px-3.5 font-mono">
                    <div className="font-bold text-slate-800 text-[11px]">{item.nomorSeriIjazah}</div>
                    <div className="text-[10px] text-slate-500">SKL: {item.nomorSKL}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        item.statusIjazah === 'Sudah Diambil'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.statusIjazah === 'Sudah Diambil' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.statusIjazah}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    {item.statusIjazah === 'Sudah Diambil' ? (
                      <div>
                        <div className="font-semibold text-slate-800">{item.namaPenerima || item.namaLengkap}</div>
                        <div className="text-[10px] text-slate-400">{item.tanggalPengambilan}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Tersimpan di Brankas</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedForPrint(item)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1"
                        title="Cetak Tanda Terima Ijazah"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Bukti</span>
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
                          if (confirm(`Hapus data ijazah alumni ${item.namaLengkap}?`)) {
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
      </div>

      {/* MODAL: Input / Edit Alumni */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-600" />
                <span>{editingItem ? 'Edit Data Ijazah' : 'Tambah Register Penyerahan Ijazah'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tahun Lulusan</label>
                  <input
                    type="text"
                    required
                    value={formData.tahunLulus || ''}
                    onChange={(e) => setFormData({ ...formData, tahunLulus: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NISN Alumni</label>
                  <input
                    type="text"
                    required
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Alumni</label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap || ''}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nomor Seri Ijazah Nasional</label>
                <input
                  type="text"
                  required
                  value={formData.nomorSeriIjazah || ''}
                  onChange={(e) => setFormData({ ...formData, nomorSeriIjazah: e.target.value })}
                  placeholder="DN-20/M-SMP/K13/25/00192"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-rose-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor SKL</label>
                  <input
                    type="text"
                    value={formData.nomorSKL || ''}
                    onChange={(e) => setFormData({ ...formData, nomorSKL: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Ijazah</label>
                  <select
                    value={formData.statusIjazah || 'Belum Diambil'}
                    onChange={(e) => setFormData({ ...formData, statusIjazah: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Sudah Diambil">Sudah Diambil</option>
                    <option value="Belum Diambil">Belum Diambil (Di Brankas)</option>
                  </select>
                </div>
              </div>

              {formData.statusIjazah === 'Sudah Diambil' && (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nama Yang Mengambil</label>
                    <input
                      type="text"
                      value={formData.namaPenerima || ''}
                      onChange={(e) => setFormData({ ...formData, namaPenerima: e.target.value })}
                      placeholder="Nama Siswa / Orang Tua"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tanggal Pengambilan</label>
                    <input
                      type="date"
                      value={formData.tanggalPengambilan || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalPengambilan: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>
              )}

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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-md"
                >
                  Simpan Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL Cetak Tanda Terima Ijazah */}
      {selectedForPrint && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto light-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 no-print">
              <span className="font-extrabold text-sm uppercase text-slate-800">TANDA TERIMA PENYERAHAN IJAZAH RESMI</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Tanda Terima</span>
                </button>
                <button onClick={() => setSelectedForPrint(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-800 p-6 printable-document text-slate-900 font-sans text-xs">
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <p className="font-bold text-xs uppercase">PEMERINTAH KABUPATEN KONAWE - DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                <h3 className="font-extrabold text-sm uppercase">{identitasSekolah.namaSekolah}</h3>
              </div>

              <div className="text-center my-3">
                <h4 className="font-bold underline text-xs uppercase">SURAT TANDA TERIMA IJAZAH & SHUN</h4>
                <p className="text-[10px] text-slate-600">Tahun Kelulusan: {selectedForPrint.tahunLulus}</p>
              </div>

              <p className="mb-3 leading-relaxed">
                Telah diserahkan Ijazah Asli Sekolah Menengah Pertama (SMP) kepada:
              </p>

              <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold w-40">Nama Siswa / Alumni</td>
                    <td className="border border-slate-800 p-1.5 font-bold">{selectedForPrint.namaLengkap}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">NISN / NIS</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{selectedForPrint.nisn} / {selectedForPrint.nis}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">Nomor Seri Ijazah</td>
                    <td className="border border-slate-800 p-1.5 font-mono font-bold">{selectedForPrint.nomorSeriIjazah}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">Tanggal Pengambilan</td>
                    <td className="border border-slate-800 p-1.5">{selectedForPrint.tanggalPengambilan || '26 Agustus 2026'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-1.5 font-bold">Nama Yang Menerima</td>
                    <td className="border border-slate-800 p-1.5 font-semibold">{selectedForPrint.namaPenerima || selectedForPrint.namaLengkap}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between pt-4 text-xs">
                <div className="text-center">
                  <p>Yang Menerima,</p>
                  <div className="h-16 flex items-center justify-center text-[10px] text-slate-400">
                    [Cap Tiga Jari Kiri]
                  </div>
                  <p className="font-bold underline uppercase">{selectedForPrint.namaPenerima || selectedForPrint.namaLengkap}</p>
                </div>
                <div className="text-center">
                  <p>Petugas Tata Usaha,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{identitasSekolah.namaKepalaTU}</p>
                  <p className="text-[10px] font-mono">NIP. {identitasSekolah.nipKepalaTU}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
