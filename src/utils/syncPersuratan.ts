import { SuratKeluar, SuratTugasDinas, PembuatSuratRecord, IdentitasSekolah } from '../types';

/**
 * Konversi record Surat Perintah Tugas (SPT) menjadi entri Buku Agenda Surat Keluar
 */
export function convertSuratTugasToSuratKeluar(
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah,
  existingAgenda?: string,
  existingSuratKeluarList: SuratKeluar[] = []
): SuratKeluar {
  const personilNames = (tugas.personil || [])
    .map((p) => p.nama)
    .filter(Boolean)
    .join(', ') || 'Personil Sekolah';

  // Kode klasifikasi dari field atau parsing dari noSuratTugas
  const kode = tugas.kodeKlasifikasi || tugas.noSuratTugas?.split('/')[0] || '090';

  // No Agenda otomatis jika belum ada
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
    tugas.status === 'Terbit' || tugas.status === 'Selesai Dilaksanakan'
      ? 'Sudah Dikirim'
      : 'Draf';

  return {
    id: `SK-ST-${tugas.id}`,
    noAgenda,
    noSurat: tugas.noSuratTugas,
    kodeKlasifikasi: kode,
    tanggalSurat: tugas.tanggalSurat || tugas.tanggalBerangkat || new Date().toISOString().split('T')[0],
    tujuanSurat: `${tugas.tempatTujuan} (Penugasan: ${personilNames})`,
    perihal: `Surat Perintah Tugas: ${tugas.maksudTugas}`,
    sifat: 'Penting',
    lampiran: tugas.noSPPD ? '1 Berkas (SPT & SPPD)' : '1 Lembar (SPT)',
    pengonsep: `${identitas.namaKepalaTU || 'Rustam, S.Pd.I'} (Ka TU)`,
    penandatangan: identitas.namaKepalaSekolah || 'ADRIS, S.Pd.,M.Si',
    nipPenandatangan: identitas.nipKepalaSekolah || '19710110 199412 1 0012',
    isiSuratRingkas: `Penugasan dinas ke ${tugas.tempatTujuan} selama ${tugas.lamaHari} hari (${tugas.tanggalBerangkat} s.d ${tugas.tanggalKembali}). Beban Anggaran: ${tugas.bebanAnggaran}. Dasar Penugasan: ${tugas.dasarPenugasan}`,
    statusVerifikasi: statusVerif,
    statusDrive: tugas.statusDrive || 'Tersimpan',
    lampiranNama: `SPT_${(tugas.noSuratTugas || 'tugas').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
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

  // Kode klasifikasi dari record atau parsing noSurat
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
    noSurat: surat.noSurat,
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
    statusDrive: surat.statusDrive || 'Tersimpan',
    lampiranNama: `${(surat.jenisSuratNama || 'surat').replace(/[^a-zA-Z0-9]/g, '_')}_${(subjek.nama || 'subjek').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    sumberModul: 'pembuat-surat',
    referensiId: surat.id,
  };
}

/**
 * Tambah atau perbarui satu Surat Tugas di Buku Agenda Surat Keluar
 */
export function upsertSuratTugasInSuratKeluar(
  currentSuratKeluar: SuratKeluar[],
  tugas: SuratTugasDinas,
  identitas: IdentitasSekolah
): SuratKeluar[] {
  const result = [...currentSuratKeluar];
  const idx = result.findIndex(
    (sk) => sk.referensiId === tugas.id || sk.id === `SK-ST-${tugas.id}` || (sk.sumberModul === 'surat-tugas' && sk.noSurat === tugas.noSuratTugas)
  );

  if (idx >= 0) {
    const existing = result[idx];
    const updated = convertSuratTugasToSuratKeluar(tugas, identitas, existing.noAgenda, result);
    result[idx] = { ...existing, ...updated };
  } else {
    const created = convertSuratTugasToSuratKeluar(tugas, identitas, undefined, result);
    result.unshift(created);
  }
  return result;
}

/**
 * Tambah atau perbarui satu entri Pembuat Surat di Buku Agenda Surat Keluar
 */
export function upsertPembuatSuratInSuratKeluar(
  currentSuratKeluar: SuratKeluar[],
  surat: PembuatSuratRecord,
  identitas: IdentitasSekolah
): SuratKeluar[] {
  const result = [...currentSuratKeluar];
  const idx = result.findIndex(
    (sk) => sk.referensiId === surat.id || sk.id === `SK-PS-${surat.id}` || (sk.sumberModul === 'pembuat-surat' && sk.noSurat === surat.noSurat)
  );

  if (idx >= 0) {
    const existing = result[idx];
    const updated = convertPembuatSuratToSuratKeluar(surat, identitas, existing.noAgenda, result);
    result[idx] = { ...existing, ...updated };
  } else {
    const created = convertPembuatSuratToSuratKeluar(surat, identitas, undefined, result);
    result.unshift(created);
  }
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
    (sk) => sk.referensiId !== referensiId && sk.id !== `SK-ST-${referensiId}` && sk.id !== `SK-PS-${referensiId}`
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
  const resultList = [...currentSuratKeluar];

  // 1. Sync Surat Tugas
  suratTugasList.forEach((st) => {
    const existingIndex = resultList.findIndex(
      (sk) => sk.referensiId === st.id || sk.id === `SK-ST-${st.id}` || sk.noSurat === st.noSuratTugas
    );

    if (existingIndex >= 0) {
      const existing = resultList[existingIndex];
      const updated = convertSuratTugasToSuratKeluar(st, identitas, existing.noAgenda, resultList);
      resultList[existingIndex] = { ...existing, ...updated };
    } else {
      const created = convertSuratTugasToSuratKeluar(st, identitas, undefined, resultList);
      resultList.push(created);
    }
  });

  // 2. Sync Pembuat Surat
  pembuatSuratList.forEach((ps) => {
    const existingIndex = resultList.findIndex(
      (sk) => sk.referensiId === ps.id || sk.id === `SK-PS-${ps.id}` || sk.noSurat === ps.noSurat
    );

    if (existingIndex >= 0) {
      const existing = resultList[existingIndex];
      const updated = convertPembuatSuratToSuratKeluar(ps, identitas, existing.noAgenda, resultList);
      resultList[existingIndex] = { ...existing, ...updated };
    } else {
      const created = convertPembuatSuratToSuratKeluar(ps, identitas, undefined, resultList);
      resultList.push(created);
    }
  });

  return resultList;
}
