import {
  DatabaseState,
  IdentitasSekolah,
  SuratMasuk,
  SuratKeluar,
  SKKBM,
  SKTugasTambahan,
  SuratTugasDinas,
  Siswa,
  PPDBPendaftar,
  AlumniIjazah,
  GuruPTK,
  DriveFolder,
  DriveFile,
} from '../types';
import {
  initialIdentitasSekolah,
  initialSuratMasuk,
  initialSuratKeluar,
  initialSKKBM,
  initialSKTugasTambahan,
  initialSuratTugasDinas,
  initialPembuatSurat,
  initialSiswa,
  initialPPDB,
  initialAlumni,
  initialPTK,
  initialDriveFolders,
  initialDriveFiles,
} from '../data/initialData';

const STORAGE_KEY = 'SIPEDAS_SMPN2_PURIALA_DB_V1';

// Build initial complete database with folder-file relations
const buildInitialDatabase = (): DatabaseState => {
  // Map files into folders
  const foldersWithFiles: DriveFolder[] = initialDriveFolders.map((folder) => {
    const folderFiles = initialDriveFiles.filter((f) => f.folderId === folder.id);
    return {
      ...folder,
      jumlahFile: folderFiles.length,
      terakhirDiubah: '2026-08-25',
      files: folderFiles,
    };
  });

  // Also convert PTK to standard format
  const mappedPTK: GuruPTK[] = initialPTK.map((p) => ({
    ...p,
    berkasDigital: (p.berkas || []).map((b) => ({
      id: b.id,
      namaFile: b.namaBerkas,
      jenisBerkas: b.kategori,
      ukuran: b.ukuranFile,
      tanggalUnggah: b.tanggalUpload,
    })),
  }));

  // Convert Alumni to standard format
  const mappedAlumni: AlumniIjazah[] = initialAlumni.map((a) => ({
    ...a,
    nomorSeriIjazah: a.noSeriIjazah,
    nomorSKL: a.noSKL,
  }));

  return {
    identitasSekolah: initialIdentitasSekolah,
    suratMasuk: initialSuratMasuk,
    suratKeluar: initialSuratKeluar,
    skKBM: initialSKKBM,
    skTugasTambahan: initialSKTugasTambahan,
    suratTugas: initialSuratTugasDinas,
    pembuatSurat: initialPembuatSurat,
    siswa: initialSiswa,
    ppdb: initialPPDB,
    alumni: mappedAlumni,
    guruPTK: mappedPTK,
    driveFolders: foldersWithFiles,
  };
};

export const saveStoredData = (data: DatabaseState, key: string = STORAGE_KEY): void => {
  try {
    // Split the data into smaller chunks to avoid localStorage quota limits
    const { identitasSekolah, suratMasuk, suratKeluar, ...rest } = data;
    localStorage.setItem(`${key}_IDENTITAS`, JSON.stringify(identitasSekolah));
    localStorage.setItem(`${key}_SURAT_MASUK`, JSON.stringify(suratMasuk));
    localStorage.setItem(`${key}_SURAT_KELUAR`, JSON.stringify(suratKeluar));
    localStorage.setItem(`${key}_REST`, JSON.stringify(rest));
  } catch (e) {
    console.error('Error saving database to localStorage', e);
  }
};

export const getStoredData = (key: string = STORAGE_KEY, fallback?: DatabaseState): DatabaseState => {
  try {
    const identitas = localStorage.getItem(`${key}_IDENTITAS`);
    const suratMasuk = localStorage.getItem(`${key}_SURAT_MASUK`);
    const suratKeluar = localStorage.getItem(`${key}_SURAT_KELUAR`);
    const restRaw = localStorage.getItem(`${key}_REST`);

    if (!identitas || !suratMasuk || !suratKeluar || !restRaw) {
      const initial = fallback || buildInitialDatabase();
      saveStoredData(initial, key);
      return initial;
    }
    
    return {
      identitasSekolah: JSON.parse(identitas),
      suratMasuk: JSON.parse(suratMasuk),
      suratKeluar: JSON.parse(suratKeluar),
      ...JSON.parse(restRaw)
    } as DatabaseState;
  } catch (e) {
    console.error('Error loading database from localStorage', e);
    return fallback || buildInitialDatabase();
  }
};

export const setStoredData = saveStoredData;

export const resetToInitialData = (): DatabaseState => {
  const initial = buildInitialDatabase();
  saveStoredData(initial);
  return initial;
};
