import { SuratKeluar, SuratTugasDinas, PembuatSuratRecord, IdentitasSekolah } from '../types';
import { extractNomorUrutFromNoSurat } from './suratTemplates';

/**
 * Helper to generate standard agenda format dynamically based on document number.
 * Example:
 * - noSurat: "090/065/SMP.02/ST/VIII/2026" and typeCode: "ST" -> "065/ST/2026"
 * - noSurat: "094/066/SPPD/SMP.02/VIII/2026" and typeCode: "SPPD" -> "066/SPPD/2026"
 */
export function generateAgendaFromNoSurat(noSurat: string | undefined | null, typeCode: 'ST' | 'SPPD' | 'SK'): string {
  if (!noSurat) {
    return `001/${typeCode}/2026`;
  }
  const num = extractNomorUrutFromNoSurat(noSurat);
  const yearMatch = noSurat.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '2026';
  if (num !== null) {
    const padded = String(num).padStart(3, '0');
    return `${padded}/${typeCode}/${year}`;
  }
  return `001/${typeCode}/${year}`;
}

/**
 * Konversi record Surat Perintah Tugas (SPT) menjadi entri Buku Agenda Surat Keluar
 * (Dipertahankan sebagai fallback untuk kompatibilitas tipe lama jika dipanggil langsung)
 */
export function convertSuratTugasToSuratKeluar(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah,
  existingAgenda?: string,
  existingSuratKeluarList: SuratKeluar[] = []
): SuratKeluar {
  return convertSuratTugasToSuratKeluarSPT(tugas, identitas);
}

/**
 * Konversi record Surat Perintah Tugas (SPT) menjadi entri Buku Agenda Surat Keluar (SPT saja)
 */
export function convertSuratTugasToSuratKeluarSPT(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah
): SuratKeluar {
  const personilNames = (tugas.personil || [])
    .map((p) => p.nama)
    .filter(Boolean)
    .join(', ') || 'Personil Sekolah';

  const kode = tugas.kodeKlasifikasi || tugas.noSuratTugas?.split('/')[0] || '090';
  const noAgenda = generateAgendaFromNoSurat(tugas.noSuratTugas, 'ST');

  const statusVerif: SuratKeluar['statusVerifikasi'] =
    tugas.status === 'Terbit' || tugas.status === 'Selesai Dilaksanakan'
      ? 'Sudah Dikirim'
      : 'Draf';

  return {
    id: `SK-ST-${tugas.id}-SPT`,
    noAgenda,
    noSurat: tugas.noSuratTugas,
    kodeKlasifikasi: kode,
    tanggalSurat: tugas.tanggalSurat || tugas.tanggalBerangkat || new Date().toISOString().split('T')[0],
    tujuanSurat: `${tugas.tempatTujuan} (Ditugaskan: ${personilNames})`,
    perihal: `Surat Perintah Tugas (SPT): ${tugas.maksudTugas}`,
    sifat: 'Penting',
    lampiran: '1 Lembar (SPT)',
    pengonsep: `${identitas.namaKepalaTU || 'Rustam, S.Pd.I'} (Ka TU)`,
    penandatangan: identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
    nipPenandatangan: identitas.nipKepalaSekolah || '19710110 199412 1 0012',
    isiSuratRingkas: `Penugasan dinas ke ${tugas.tempatTujuan} selama ${tugas.lamaHari} hari (${tugas.tanggalBerangkat} s.d ${tugas.tanggalKembali}). Dasar: ${tugas.dasarPenugasan}`,
    statusVerifikasi: statusVerif,
    statusDrive: tugas.statusDrive || 'Lokal Saja',
    lampiranNama: `SPT_${(tugas.noSuratTugas || 'tugas').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
    sumberModul: 'surat-tugas',
    referensiId: tugas.id,
  };
}

/**
 * Konversi record Surat Perintah Tugas (SPT) menjadi entri Buku Agenda Surat Keluar (SPPD saja)
 */
export function convertSuratTugasToSuratKeluarSPPD(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah
): SuratKeluar {
  const personilNames = (tugas.personil || [])
    .map((p) => p.nama)
    .filter(Boolean)
    .join(', ') || 'Personil Sekolah';

  const kode = '094'; // SPPD standar 094
  const noAgenda = generateAgendaFromNoSurat(tugas.noSPPD, 'SPPD');

  const statusVerif: SuratKeluar['statusVerifikasi'] =
    tugas.status === 'Terbit' || tugas.status === 'Selesai Dilaksanakan'
      ? 'Sudah Dikirim'
      : 'Draf';

  return {
    id: `SK-ST-${tugas.id}-SPPD`,
    noAgenda,
    noSurat: tugas.noSPPD || `094/xxxx/SPPD/SMP.02/2026`,
    kodeKlasifikasi: kode,
    tanggalSurat: tugas.tanggalSurat || tugas.tanggalBerangkat || new Date().toISOString().split('T')[0],
    tujuanSurat: `${tugas.tempatTujuan} (Ditugaskan: ${personilNames})`,
    perihal: `Surat Perjalanan Dinas (SPPD): ${tugas.maksudTugas}`,
    sifat: 'Penting',
    lampiran: '1 Berkas (SPPD)',
    pengonsep: `${identitas.namaKepalaTU || 'Rustam, S.Pd.I'} (Ka TU)`,
    penandatangan: identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
    nipPenandatangan: identitas.nipKepalaSekolah || '19710110 199412 1 0012',
    isiSuratRingkas: `Surat Perjalanan Dinas (SPPD) ke ${tugas.tempatTujuan} selama ${tugas.lamaHari} hari (${tugas.tanggalBerangkat} s.d ${tugas.tanggalKembali}). Beban Anggaran: ${tugas.bebanAnggaran}`,
    statusVerifikasi: statusVerif,
    statusDrive: tugas.statusDrive || 'Lokal Saja',
    lampiranNama: `SPPD_${(tugas.noSPPD || 'sppd').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
    sumberModul: 'surat-tugas',
    referensiId: tugas.id,
  };
}

/**
 * Konversi record Pembuat Surat menjadi entri Buku Agenda Surat Keluar
 */
export function convertPembuatSuratToSuratKeluar(
  surat: PembuatSuratRecord,
  identitas: IdentitasSekolah,
  existingAgenda?: string,
  existingSuratKeluarList: SuratKeluar[] = []
): SuratKeluar {
  const subjek = surat.subjekData;
  const tujuanStr =
    surat.targetSubjek === 'siswa'
      ? `Siswa: ${subjek.nama} (Kelas ${subjek.kelas || '-'} / NISN ${subjek.nisn || '-'})`
      : `PTK: ${subjek.nama} (NIP: ${subjek.nip || '-'}, ${subjek.jabatan || 'Guru'})`;

  const kode = surat.kodeKlasifikasi || surat.noSurat?.split('/')[0] || '400.3.5';

  let noAgenda = existingAgenda;
  if (!noAgenda) {
    let maxNum = 0;
    existingSuratKeluarList.forEach((sk) => {
      const match = (sk.noAgenda || '').match(/^(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });
    const nextNum = String(maxNum + 1).padStart(3, '0');
    noAgenda = `${nextNum}/SK/2026`;
  }

  const statusVerif: SuratKeluar['statusVerifikasi'] =
    surat.status === 'Terbit' ? 'Sudah Dikirim' : 'Draf';

  return {
    id: `SK-PS-${surat.id}`,
    noAgenda,
    noSurat: surat.noSurat || '',
    kodeKlasifikasi: kode,
    tanggalSurat: surat.tanggalSurat || new Date().toISOString().split('T')[0],
    tujuanSurat: tujuanStr,
    perihal: `${surat.jenisSuratNama} - a.n. ${subjek.nama}`,
    sifat: 'Biasa',
    lampiran: '1 Lembar',
    pengonsep: `${identitas.namaKepalaTU || 'Rustam, S.Pd.I'} (Ka TU)`,
    penandatangan: surat.penandatangan?.nama || identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
    nipPenandatangan: surat.penandatangan?.nip || identitas.nipKepalaSekolah || '19710110 199412 1 0012',
    isiSuratRingkas: surat.perihal
      ? `${surat.perihal}. Keperluan: ${surat.detailSurat?.keperluan || '-'}`
      : `Penerbitan ${surat.jenisSuratNama}`,
    statusVerifikasi: statusVerif,
    statusDrive: surat.statusDrive || 'Lokal Saja',
    lampiranNama: `${(surat.jenisSuratNama || 'surat').replace(/[^a-zA-Z0-9]/g, '_')}_${(subjek.nama || 'subjek').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    sumberModul: 'pembuat-surat',
    referensiId: surat.id,
  };
}

/**
 * Tambah atau perbarui satu Surat Tugas di Buku Agenda Surat Keluar
 * Aturan Wajib: melanjutkan nomor urut terakhir dan diletakkan di baris paling bawah nomor surat yang ada.
 */
export function upsertSuratTugasInSuratKeluar(
  currentSuratKeluar: SuratKeluar[],
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah
): SuratKeluar[] {
  // Filter out any legacy entries for this reference ID to prevent duplicates
  let result = currentSuratKeluar.filter(
    (sk) => sk.referensiId !== tugas.id && sk.id !== `SK-ST-${tugas.id}` && sk.id !== `SK-ST-${tugas.id}-SPT` && sk.id !== `SK-ST-${tugas.id}-SPPD`
  );

  // 1. Create SPT entry and push at the bottom of the array
  if (tugas.noSuratTugas) {
    const sptRecord = convertSuratTugasToSuratKeluarSPT(tugas, identitas);
    result.push(sptRecord);
  }

  // 2. Create SPPD entry (if noSPPD is present) and push at the bottom of the array
  if (tugas.noSPPD) {
    const sppdRecord = convertSuratTugasToSuratKeluarSPPD(tugas, identitas);
    result.push(sppdRecord);
  }

  return result;
}

/**
 * Tambah atau perbarui satu entri Pembuat Surat di Buku Agenda Surat Keluar
 * Aturan Wajib: diletakkan di baris paling bawah.
 */
export function upsertPembuatSuratInSuratKeluar(
  currentSuratKeluar: SuratKeluar[],
  surat: PembuatSuratRecord,
  identitas: IdentitasSekolah
): SuratKeluar[] {
  let result = currentSuratKeluar.filter(
    (sk) => sk.referensiId !== surat.id && sk.id !== `SK-PS-${surat.id}`
  );
  const created = convertPembuatSuratToSuratKeluar(surat, identitas, undefined, result);
  result.push(created);
  return result;
}

/**
 * Hapus entri tersinkronisasi di Surat Keluar berdasarkan referensiId
 */
export function removeModuleFromSuratKeluar(
  currentSuratKeluar: SuratKeluar[],
  referensiId: string
): SuratKeluar[] {
  return currentSuratKeluar.filter(
    (sk) =>
      sk.referensiId !== referensiId &&
      sk.id !== `SK-ST-${referensiId}` &&
      sk.id !== `SK-ST-${referensiId}-SPT` &&
      sk.id !== `SK-ST-${referensiId}-SPPD` &&
      sk.id !== `SK-PS-${referensiId}`
  );
}

/**
 * Sinkronisasi seluruh Surat Tugas dan Pembuat Surat ke Surat Keluar
 */
export function syncAllModulesToSuratKeluar(
  currentSuratKeluar: SuratKeluar[],
  suratTugasList: SuratTugasDinas[],
  pembuatSuratList: PembuatSuratRecord[],
  identitas: IdentitasSekolah
): SuratKeluar[] {
  // Filter out all auto-synced entries to avoid corruption or duplicate rows
  let resultList = currentSuratKeluar.filter(
    (sk) =>
      sk.sumberModul !== 'surat-tugas' &&
      sk.sumberModul !== 'pembuat-surat' &&
      !sk.id.startsWith('SK-ST-') &&
      !sk.id.startsWith('SK-PS-')
  );

  // 1. Rebuild and push Surat Tugas (separated into SPT and SPPD)
  suratTugasList.forEach((st) => {
    if (st.noSuratTugas) {
      const spt = convertSuratTugasToSuratKeluarSPT(st, identitas);
      resultList.push(spt);
    }
    if (st.noSPPD) {
      const sppd = convertSuratTugasToSuratKeluarSPPD(st, identitas);
      resultList.push(sppd);
    }
  });

  // 2. Rebuild and push Pembuat Surat
  pembuatSuratList.forEach((ps) => {
    const created = convertPembuatSuratToSuratKeluar(ps, identitas, undefined, resultList);
    resultList.push(created);
  });

  return resultList;
}
