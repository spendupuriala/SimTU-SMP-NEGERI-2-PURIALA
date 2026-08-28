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

export const getStoredData = (key: string = STORAGE_KEY, fallback?: DatabaseState): DatabaseState => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = fallback || buildInitialDatabase();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.pembuatSurat) {
      parsed.pembuatSurat = initialPembuatSurat;
    }
    return parsed as DatabaseState;
  } catch (e) {
    console.error('Error loading database from localStorage', e);
    return fallback || buildInitialDatabase();
  }
};

export const saveStoredData = (data: DatabaseState, key: string = STORAGE_KEY): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving database to localStorage', e);
  }
};

export const setStoredData = saveStoredData;

export const resetToInitialData = (): DatabaseState => {
  const initial = buildInitialDatabase();
  saveStoredData(initial);
  return initial;
};
