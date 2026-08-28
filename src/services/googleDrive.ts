import { DatabaseState } from '../types';
import { invalidateGoogleAuth } from './googleAuth';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  isFolder?: boolean;
}

export interface GoogleDriveQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
  userDisplayName?: string;
  userEmail?: string;
  userPhotoLink?: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

/**
 * Handle API response errors cleanly and detect expired auth
 */
const handleDriveResponse = async (response: Response, defaultMessage: string) => {
  if (response.status === 401) {
    invalidateGoogleAuth();
    throw new Error('AUTH_EXPIRED: Sesi Google Drive telah berakhir atau token tidak valid. Silakan hubungkan kembali.');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || '';
    if (
      msg.includes('Invalid Credentials') ||
      msg.includes('invalid authentication credentials') ||
      msg.includes('authError') ||
      msg.includes('has not been used in project') ||
      msg.includes('it is disabled')
    ) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED: Sesi Google Drive diperbarui. Silakan hubungkan kembali akun Google Anda.');
    }
    throw new Error(msg || `${defaultMessage} (${response.status})`);
  }
};

/**
 * Get Google Drive storage quota and user profile info
 */
export const getDriveQuotaAndUser = async (accessToken: string): Promise<GoogleDriveQuota> => {
  if (!accessToken) {
    throw new Error('No access token');
  }

  const response = await fetch(`${DRIVE_API_URL}/about?fields=user,storageQuota`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  await handleDriveResponse(response, 'Gagal mengambil data kuota Google Drive');

  const data = await response.json();
  const q = data.storageQuota || {};
  const u = data.user || {};

  return {
    limit: q.limit ? formatBytes(parseInt(q.limit, 10)) : 'Tak Terbatas',
    usage: q.usage ? formatBytes(parseInt(q.usage, 10)) : '0 B',
    usageInDrive: q.usageInDrive ? formatBytes(parseInt(q.usageInDrive, 10)) : '0 B',
    usageInDriveTrash: q.usageInDriveTrash ? formatBytes(parseInt(q.usageInDriveTrash, 10)) : '0 B',
    userDisplayName: u.displayName || 'Akun Google Sekolah',
    userEmail: u.emailAddress || '',
    userPhotoLink: u.photoLink || '',
  };
};

/**
 * List files and folders in Google Drive
 */
export const listGoogleDriveFiles = async (
  accessToken: string,
  folderId?: string | null,
  searchQuery?: string
): Promise<GoogleDriveFile[]> => {
  if (!accessToken) return [];

  let query = "trashed = false";

  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents)',
    orderBy: 'folder, modifiedTime desc',
    pageSize: '100',
  });

  const response = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  await handleDriveResponse(response, 'Gagal membaca berkas Google Drive');

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    ...f,
    isFolder: f.mimeType === 'application/vnd.google-apps.folder',
    size: f.size ? formatBytes(parseInt(f.size, 10)) : (f.mimeType === 'application/vnd.google-apps.folder' ? '-' : '0 B'),
  }));
};

/**
 * Find or Create the default root folder for SIPEDAS in user's Drive
 */
export const findOrCreateAppRootFolder = async (
  accessToken: string,
  folderName: string = 'SIPEDAS_SMPN2_PURIALA_ARSIP_DIGITAL'
): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  // Check if exists
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents`;
  const params = new URLSearchParams({ q: query, fields: 'files(id, name)' });

  const searchRes = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  await handleDriveResponse(searchRes, 'Gagal mencari folder aplikasi');

  const result = await searchRes.json();
  if (result.files && result.files.length > 0) {
    return result.files[0].id;
  }

  // Create folder if not found
  return createGoogleDriveFolder(accessToken, folderName);
};

/**
 * Create a folder in Google Drive
 */
export const createGoogleDriveFolder = async (
  accessToken: string,
  folderName: string,
  parentFolderId?: string | null
): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  await handleDriveResponse(response, 'Gagal membuat folder di Google Drive');

  const data = await response.json();
  return data.id;
};

/**
 * Upload a binary file / blob directly to Google Drive via multipart upload
 */
export const uploadFileToGoogleDrive = async (
  accessToken: string,
  file: File | Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream',
  parentFolderId?: string | null
): Promise<GoogleDriveFile> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const metadata: any = {
    name: fileName,
    mimeType: mimeType || 'application/octet-stream',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Read file as binary/array buffer
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  // Convert binary to base64
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartBody = metadataPart + mediaHeader + base64Data + closeDelimiter;

  const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  await handleDriveResponse(response, 'Gagal mengunggah berkas ke Google Drive');

  const data = await response.json();
  return {
    ...data,
    isFolder: false,
    size: data.size ? formatBytes(parseInt(data.size, 10)) : formatBytes(file.size),
  };
};

/**
 * Cache for Tata Usaha Folder ID to prevent unnecessary API calls
 */
let cachedTataUsahaFolderId: string | null = null;
let cachedSuratMasukFolderId: string | null = null;

/**
 * Find or Create nested folder path: TATA USAHA -> SURAT -> SURAT MASUK
 */
export const findOrCreateSuratMasukUploadFolder = async (
  accessToken: string
): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedSuratMasukFolderId) {
    return cachedSuratMasukFolderId;
  }

  try {
    // 1. Get or create root "TATA USAHA" folder
    const tataUsahaFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');

    // 2. Find or create "SURAT" folder inside "TATA USAHA"
    let suratFolderId: string | null = null;
    const querySurat = `(name = 'SURAT' or name = 'SURAT-SURAT' or name = '01_SURAT') and '${tataUsahaFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resSurat = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: querySurat, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (resSurat.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED');
    }
    if (resSurat.ok) {
      const dataSurat = await resSurat.json();
      if (dataSurat.files && dataSurat.files.length > 0) {
        suratFolderId = dataSurat.files[0].id;
      }
    }
    if (!suratFolderId) {
      suratFolderId = await createGoogleDriveFolder(accessToken, 'SURAT', tataUsahaFolderId);
    }

    // 3. Find or create "SURAT MASUK" folder inside "SURAT"
    let suratMasukFolderId: string | null = null;
    const querySM = `(name = 'SURAT MASUK' or name = '01_SURAT_MASUK' or name = 'SURAT-MASUK') and '${suratFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resSM = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: querySM, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (resSM.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED');
    }
    if (resSM.ok) {
      const dataSM = await resSM.json();
      if (dataSM.files && dataSM.files.length > 0) {
        suratMasukFolderId = dataSM.files[0].id;
      }
    }
    if (!suratMasukFolderId) {
      suratMasukFolderId = await createGoogleDriveFolder(accessToken, 'SURAT MASUK', suratFolderId);
    }

    cachedSuratMasukFolderId = suratMasukFolderId;
    return suratMasukFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning creating TATA USAHA/SURAT/SURAT MASUK folder:', error?.message || error);
    return findOrCreateTataUsahaFolder(accessToken);
  }
};

let cachedSuratFolderId: string | null = null;

/**
 * Find or Create folder path: TATA USAHA -> SURAT
 */
export const findOrCreateSuratFolder = async (accessToken: string): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedSuratFolderId) {
    return cachedSuratFolderId;
  }

  try {
    const tataUsahaFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');

    let suratFolderId: string | null = null;
    const querySurat = `(name = 'SURAT' or name = 'SURAT-SURAT' or name = '01_SURAT' or name = 'SURAT_DINAS') and '${tataUsahaFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resSurat = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: querySurat, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (resSurat.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED');
    }
    if (resSurat.ok) {
      const dataSurat = await resSurat.json();
      if (dataSurat.files && dataSurat.files.length > 0) {
        suratFolderId = dataSurat.files[0].id;
      }
    }
    if (!suratFolderId) {
      suratFolderId = await createGoogleDriveFolder(accessToken, 'SURAT', tataUsahaFolderId);
    }

    cachedSuratFolderId = suratFolderId;
    return suratFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning creating TATA USAHA/SURAT folder:', error?.message || error);
    return findOrCreateTataUsahaFolder(accessToken);
  }
};

/**
 * Fetch all files / templates present in TATA USAHA/SURAT folder
 */
export const fetchSuratFolderFiles = async (accessToken: string): Promise<GoogleDriveFile[]> => {
  if (!accessToken) return [];
  try {
    const suratFolderId = await findOrCreateSuratFolder(accessToken);
    const query = `'${suratFolderId}' in parents and trashed = false`;
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: '50',
    });

    const res = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401) {
      invalidateGoogleAuth();
      return [];
    }

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((file: any) => ({
      ...file,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      size: file.size ? formatBytes(parseInt(file.size, 10)) : '-',
    }));
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      return [];
    }
    console.warn('Could not fetch files from TATA USAHA/SURAT folder:', error?.message || error);
    return [];
  }
};

/**
 * Find master template file "Surat Tugas" in Google Drive folder TATA USAHA/SURAT (or anywhere in TATA USAHA)
 */
export const findSuratTugasTemplateInDrive = async (accessToken: string): Promise<GoogleDriveFile | null> => {
  if (!accessToken) return null;
  try {
    const suratFolderId = await findOrCreateSuratFolder(accessToken);

    // 1. Search in TATA USAHA/SURAT folder first
    const queryInSurat = `'${suratFolderId}' in parents and name contains 'Surat Tugas' and trashed = false`;
    const resInSurat = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({
        q: queryInSurat,
        fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, modifiedTime)',
        pageSize: '10',
      }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (resInSurat.ok) {
      const dataInSurat = await resInSurat.json();
      if (dataInSurat.files && dataInSurat.files.length > 0) {
        const found = dataInSurat.files[0];
        return {
          ...found,
          isFolder: found.mimeType === 'application/vnd.google-apps.folder',
          size: found.size ? formatBytes(parseInt(found.size, 10)) : '-',
        };
      }
    }

    // 2. Global search under TATA USAHA for "Surat Tugas"
    const queryGlobal = `name contains 'Surat Tugas' and trashed = false`;
    const resGlobal = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({
        q: queryGlobal,
        fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, modifiedTime)',
        pageSize: '5',
      }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (resGlobal.ok) {
      const dataGlobal = await resGlobal.json();
      if (dataGlobal.files && dataGlobal.files.length > 0) {
        const found = dataGlobal.files[0];
        return {
          ...found,
          isFolder: found.mimeType === 'application/vnd.google-apps.folder',
          size: found.size ? formatBytes(parseInt(found.size, 10)) : '-',
        };
      }
    }

    return null;
  } catch (error: any) {
    console.warn('Could not find Surat Tugas template in Drive:', error?.message || error);
    return null;
  }
};

/**
 * Upload a Surat Tugas / SPT document directly to Google Drive folder TATA USAHA/SURAT
 */
export const uploadSuratTugasDocumentToDrive = async (
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string = 'text/html'
): Promise<GoogleDriveFile> => {
  const suratFolderId = await findOrCreateSuratFolder(accessToken);
  return uploadFileToGoogleDrive(accessToken, fileBlob, fileName, mimeType, suratFolderId);
};

/**
 * Upload a Pembuat Surat generated document directly to Google Drive folder TATA USAHA/SURAT
 */
export const uploadPembuatSuratDocumentToDrive = async (
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string = 'text/html'
): Promise<GoogleDriveFile> => {
  const suratFolderId = await findOrCreateSuratFolder(accessToken);
  return uploadFileToGoogleDrive(accessToken, fileBlob, fileName, mimeType, suratFolderId);
};

let cachedSKFolderId: string | null = null;

/**
 * Find or Create folder path: TATA USAHA -> SK (or 03_SK_DAN_SPT_DINAS / SK)
 */
export const findOrCreateSKFolder = async (accessToken: string): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedSKFolderId) {
    return cachedSKFolderId;
  }

  try {
    const tataUsahaFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');

    let skFolderId: string | null = null;
    const querySK = `(name = 'SK' or name = 'SURAT KEPUTUSAN' or name = '03_SK_DAN_SPT_DINAS' or name = '03_SK' or name = 'SK_DAN_SPT_DINAS') and '${tataUsahaFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resSK = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: querySK, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (resSK.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED');
    }
    if (resSK.ok) {
      const dataSK = await resSK.json();
      if (dataSK.files && dataSK.files.length > 0) {
        skFolderId = dataSK.files[0].id;
      }
    }
    if (!skFolderId) {
      skFolderId = await createGoogleDriveFolder(accessToken, 'SK', tataUsahaFolderId);
    }

    cachedSKFolderId = skFolderId;
    return skFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning creating TATA USAHA/SK folder:', error?.message || error);
    return findOrCreateTataUsahaFolder(accessToken);
  }
};

/**
 * Fetch all files / templates present in TATA USAHA/SK folder
 */
export const fetchSKFolderFiles = async (accessToken: string): Promise<GoogleDriveFile[]> => {
  if (!accessToken) return [];
  try {
    const skFolderId = await findOrCreateSKFolder(accessToken);
    const query = `'${skFolderId}' in parents and trashed = false`;
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: '50',
    });

    const res = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401) {
      invalidateGoogleAuth();
      return [];
    }

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((file: any) => ({
      ...file,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      size: file.size ? formatBytes(parseInt(file.size, 10)) : '-',
    }));
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      return [];
    }
    console.warn('Could not fetch files from TATA USAHA/SK folder:', error?.message || error);
    return [];
  }
};

/**
 * Upload an SK KBM export file / backup directly to Google Drive folder TATA USAHA/SK
 */
export const uploadSKKBMDocumentToDrive = async (
  accessToken: string,
  fileBlob: Blob,
  fileName: string,
  mimeType: string = 'text/html'
): Promise<GoogleDriveFile> => {
  const skFolderId = await findOrCreateSKFolder(accessToken);
  return uploadFileToGoogleDrive(accessToken, fileBlob, fileName, mimeType, skFolderId);
};

/**
 * Upload an SK Tugas Tertentu / Tugas Tambahan document directly to Google Drive folder TATA USAHA/SK
 * Matches format and file name "SK Tugas Tertentu T.P 2026-2027"
 */
export const uploadSKTugasTertentuToDrive = async (
  accessToken: string,
  fileBlob: Blob,
  fileName: string = 'SK Tugas Tertentu T.P 2026-2027.html',
  mimeType: string = 'text/html'
): Promise<GoogleDriveFile> => {
  const skFolderId = await findOrCreateSKFolder(accessToken);
  return uploadFileToGoogleDrive(accessToken, fileBlob, fileName, mimeType, skFolderId);
};

/**
 * Upload a Surat Masuk scan / document directly to Google Drive folder TATA USAHA/SURAT/SURAT MASUK
 */
export const uploadSuratMasukFileToDrive = async (
  accessToken: string,
  file: File | Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<GoogleDriveFile> => {
  const targetFolderId = await findOrCreateSuratMasukUploadFolder(accessToken);
  return uploadFileToGoogleDrive(accessToken, file, fileName, mimeType, targetFolderId);
};

/**
 * Find or Create the dedicated "TATA USAHA" folder in user's Google Drive root
 */
export const findOrCreateTataUsahaFolder = async (
  accessToken: string,
  folderName: string = 'TATA USAHA'
): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedTataUsahaFolderId) {
    return cachedTataUsahaFolderId;
  }

  try {
    // Check if 'TATA USAHA' folder already exists in root or anywhere
    const query = `(name = '${folderName}' or name = 'TATA USAHA' or name = 'SIPEDAS_TATA_USAHA' or name = 'TATA USAHA SMPN 2 PURIALA') and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const params = new URLSearchParams({ q: query, fields: 'files(id, name, parents)' });

    const searchRes = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED: Token Google Drive telah kedaluwarsa.');
    }

    if (searchRes.ok) {
      const result = await searchRes.json();
      if (result.files && result.files.length > 0) {
        cachedTataUsahaFolderId = result.files[0].id;
        return result.files[0].id;
      }
    }

    // Create 'TATA USAHA' folder if not found
    const newFolderId = await createGoogleDriveFolder(accessToken, folderName);
    cachedTataUsahaFolderId = newFolderId;

    // Automatically create organized sub-folders inside TATA USAHA
    const subfolders = [
      '01_SURAT_MASUK',
      '02_SURAT_KELUAR',
      '03_SK_DAN_SPT_DINAS',
      '04_KEPEGAWAIAN_PTK',
      '05_KESISWAAN_DAN_ALUMNI',
      '06_DATABASE_DAN_BACKUP',
    ];

    for (const sub of subfolders) {
      try {
        await createGoogleDriveFolder(accessToken, sub, newFolderId);
      } catch (e) {
        console.warn(`Could not create subfolder ${sub}:`, e);
      }
    }

    return newFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning finding/creating TATA USAHA folder:', error?.message || error);
    // Fallback to general app root folder
    return findOrCreateAppRootFolder(accessToken);
  }
};

/**
 * Update an existing file content in Google Drive in-place
 */
export const updateFileInGoogleDrive = async (
  accessToken: string,
  fileId: string,
  contentBlob: Blob,
  mimeType: string = 'application/json'
): Promise<boolean> => {
  if (!accessToken || !fileId) return false;

  try {
    const arrayBuffer = await contentBlob.arrayBuffer();
    
    // Use uploadType=media on upload/drive/v3/files/{fileId}
    const response = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: arrayBuffer,
    });

    if (response.ok) {
      return true;
    }

    // If 401, invalidate auth
    if (response.status === 401) {
      invalidateGoogleAuth();
      return false;
    }

    if (response.status === 404 || response.status === 403) {
      return false;
    }

    return false;
  } catch (error: any) {
    console.warn('Warning updating file in Google Drive:', error?.message || error);
    return false;
  }
};

/**
 * Real-time Auto-Sync: Updates the master SIPEDAS database directly into Google Drive Folder "TATA USAHA"
 */
export const syncLiveDatabaseToTataUsahaFolder = async (
  accessToken: string,
  dbState: DatabaseState
): Promise<{ success: boolean; fileName: string; folderId: string; lastUpdated: string }> => {
  if (!accessToken) {
    return { success: false, fileName: '', folderId: '', lastUpdated: '' };
  }

  const folderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');
  const masterFileName = 'SIPEDAS_DATABASE_TATA_USAHA.json';
  const nowFormatted = new Date().toISOString();

  // Enriched payload with metadata
  const payload = {
    _lastSync: nowFormatted,
    _syncTarget: 'GOOGLE_DRIVE_FOLDER_TATA_USAHA',
    _version: '1.0',
    totalSuratMasuk: dbState.suratMasuk?.length || 0,
    totalSuratKeluar: dbState.suratKeluar?.length || 0,
    totalGuruPTK: dbState.guruPTK?.length || 0,
    totalSiswa: dbState.siswa?.length || 0,
    data: dbState,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // 1. Check if master file already exists in TATA USAHA folder
  const checkQuery = `name = '${masterFileName}' and '${folderId}' in parents and trashed = false`;
  const checkParams = new URLSearchParams({ q: checkQuery, fields: 'files(id, name)' });

  const searchRes = await fetch(`${DRIVE_API_URL}/files?${checkParams.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.status === 401) {
    invalidateGoogleAuth();
    throw new Error('AUTH_EXPIRED: Token Google Drive kedaluwarsa.');
  }

  let existingFileId: string | null = null;
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      existingFileId = searchData.files[0].id;
    }
  }

  // 2. If exists, update content in place; if not, upload new file
  if (existingFileId) {
    const updated = await updateFileInGoogleDrive(accessToken, existingFileId, blob, 'application/json');
    if (!updated) {
      // If patch failed, upload fresh copy
      await uploadFileToGoogleDrive(accessToken, blob, masterFileName, 'application/json', folderId);
    }
  } else {
    await uploadFileToGoogleDrive(accessToken, blob, masterFileName, 'application/json', folderId);
  }

  // 3. Also write a human-readable quick summary file
  try {
    const summaryFileName = 'RINGKASAN_DATA_TATA_USAHA.txt';
    const summaryText = `=====================================================
SIPEDAS SMPN 2 PURIALA - SINKRONISASI OTOMATIS TATA USAHA
=====================================================
Waktu Sinkronisasi : ${new Date().toLocaleString('id-ID')}
Target Folder      : Google Drive / TATA USAHA
Status             : AKTIF & TERSINKRONISASI LENGKAP

RINCIAN DATA REAL-TIME:
- Surat Masuk          : ${dbState.suratMasuk?.length || 0} Arsip
- Surat Keluar         : ${dbState.suratKeluar?.length || 0} Arsip
- Surat Tugas Dinas    : ${dbState.suratTugas?.length || 0} Arsip
- SK Pembagian Tugas   : ${dbState.skKBM?.length || 0} Dokumen
- SK Tugas Tambahan    : ${dbState.skTugasTambahan?.length || 0} Dokumen
- Data PTK / Guru      : ${dbState.guruPTK?.length || 0} Personil
- Data Peserta Didik   : ${dbState.siswa?.length || 0} Siswa
- Data Alumni          : ${dbState.alumni?.length || 0} Alumni

Semua perubahan data pada aplikasi SIPEDAS otomatis diperbarui ke folder ini.
=====================================================`;
    const summaryBlob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });

    // Check summary file
    const sumQuery = `name = '${summaryFileName}' and '${folderId}' in parents and trashed = false`;
    const sumRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: sumQuery, fields: 'files(id)' }).toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (sumRes.ok) {
      const sumData = await sumRes.json();
      if (sumData.files && sumData.files.length > 0) {
        await updateFileInGoogleDrive(accessToken, sumData.files[0].id, summaryBlob, 'text/plain');
      } else {
        await uploadFileToGoogleDrive(accessToken, summaryBlob, summaryFileName, 'text/plain', folderId);
      }
    }
  } catch (e) {
    console.warn('Could not write summary file:', e);
  }

  return {
    success: true,
    fileName: masterFileName,
    folderId,
    lastUpdated: nowFormatted,
  };
};

/**
 * Backup the entire SIPEDAS database state to Google Drive as a structured JSON file
 */
export const uploadDatabaseBackupToDrive = async (
  accessToken: string,
  dbState: DatabaseState,
  parentFolderId?: string | null
): Promise<GoogleDriveFile> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `SIPEDAS_SMPN2_PURIALA_BACKUP_${timestamp}.json`;
  const jsonContent = JSON.stringify(dbState, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });

  // Ensure root or target folder exists (Default to TATA USAHA)
  let targetFolderId = parentFolderId;
  if (!targetFolderId) {
    targetFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');
  }

  return uploadFileToGoogleDrive(accessToken, blob, fileName, 'application/json', targetFolderId);
};

/**
 * Delete a file or folder from Google Drive
 */
export const deleteGoogleDriveFile = async (
  accessToken: string,
  fileId: string
): Promise<boolean> => {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    invalidateGoogleAuth();
    throw new Error('AUTH_EXPIRED: Sesi Google Drive kedaluwarsa.');
  }

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menghapus berkas di Google Drive');
  }

  return true;
};

/**
 * Helper to format byte sizes into readable string
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

