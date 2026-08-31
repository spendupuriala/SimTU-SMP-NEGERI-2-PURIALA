import { DatabaseState, GuruPTK, Siswa } from '../types';
import { invalidateGoogleAuth, verifyGoogleAccessToken } from './googleAuth';
import { writeGuruPTKToSheet, parseGuruPTKFromRows, writeSiswaToSheet, parseSiswaFromRows } from './googleSheets';

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
let cachedSuratKeluarFolderId: string | null = null;

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
 * Find or Create folder path: TATA USAHA -> SURAT -> SURAT KELUAR (or 02_SURAT_KELUAR)
 */
export const findOrCreateSuratKeluarFolder = async (accessToken: string): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedSuratKeluarFolderId) {
    return cachedSuratKeluarFolderId;
  }

  try {
    const suratFolderId = await findOrCreateSuratFolder(accessToken);

    let suratKeluarFolderId: string | null = null;
    const querySK = `(name = 'SURAT KELUAR' or name = '02_SURAT_KELUAR' or name = 'SURAT-KELUAR' or name = 'SURAT_KELUAR') and '${suratFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
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
        suratKeluarFolderId = dataSK.files[0].id;
      }
    }

    if (!suratKeluarFolderId) {
      suratKeluarFolderId = await createGoogleDriveFolder(accessToken, 'SURAT KELUAR', suratFolderId);
    }

    cachedSuratKeluarFolderId = suratKeluarFolderId;
    return suratKeluarFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning creating TATA USAHA/SURAT/SURAT KELUAR folder:', error?.message || error);
    return findOrCreateSuratFolder(accessToken);
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
 * Fetch all files / templates present in TATA USAHA/SURAT/SURAT KELUAR folder
 */
export const fetchSuratKeluarFolderFiles = async (accessToken: string): Promise<GoogleDriveFile[]> => {
  if (!accessToken) return [];
  try {
    const suratKeluarFolderId = await findOrCreateSuratKeluarFolder(accessToken);
    const query = `'${suratKeluarFolderId}' in parents and trashed = false`;
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
    console.warn('Could not fetch files from TATA USAHA/SURAT/SURAT KELUAR folder:', error?.message || error);
    return [];
  }
};

/**
 * Find master template file "SPPD" (Sheet "SPPD HAL-1" & "SPPD HAL-2") in Google Drive folder TATA USAHA/SURAT/SURAT KELUAR
 */
export const findSPPDTemplateInDrive = async (accessToken: string): Promise<GoogleDriveFile | null> => {
  if (!accessToken) return null;
  try {
    const suratKeluarFolderId = await findOrCreateSuratKeluarFolder(accessToken);

    // 1. Search in TATA USAHA/SURAT/SURAT KELUAR folder first for "SPPD"
    const queryInSK = `'${suratKeluarFolderId}' in parents and (name = 'SPPD' or name contains 'SPPD') and trashed = false`;
    const resInSK = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({
        q: queryInSK,
        fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, iconLink, modifiedTime)',
        pageSize: '10',
      }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (resInSK.ok) {
      const dataInSK = await resInSK.json();
      if (dataInSK.files && dataInSK.files.length > 0) {
        const found = dataInSK.files[0];
        return {
          ...found,
          isFolder: found.mimeType === 'application/vnd.google-apps.folder',
          size: found.size ? formatBytes(parseInt(found.size, 10)) : '-',
        };
      }
    }

    // 2. Search in TATA USAHA/SURAT folder
    const suratFolderId = await findOrCreateSuratFolder(accessToken);
    const queryInSurat = `'${suratFolderId}' in parents and (name = 'SPPD' or name contains 'SPPD') and trashed = false`;
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

    // 3. Global search for "SPPD"
    const queryGlobal = `(name = 'SPPD' or name contains 'SPPD') and trashed = false`;
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
    console.warn('Could not find SPPD template in Drive:', error?.message || error);
    return null;
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
        // Non-critical subfolder creation
      }
    }

    return newFolderId;
  } catch (error: any) {
    if (
      error?.message?.includes('AUTH_EXPIRED') ||
      error?.message?.includes('invalid authentication credentials') ||
      error?.message?.includes('401')
    ) {
      invalidateGoogleAuth();
      throw error;
    }
    // If it is a fetch / network error, do not recurse into another failing fetch
    if (error?.name === 'TypeError' || error?.message?.includes('Failed to fetch')) {
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

  try {
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
      // Non-critical summary file error
    }

    return {
      success: true,
      fileName: masterFileName,
      folderId,
      lastUpdated: nowFormatted,
    };
  } catch (error: any) {
    if (
      error?.message?.includes('AUTH_EXPIRED') ||
      error?.message?.includes('invalid authentication credentials') ||
      error?.message?.includes('401')
    ) {
      invalidateGoogleAuth();
      throw error;
    }
    // If it's a network fetch error (e.g. Failed to fetch), verify token validity asynchronously
    if (error?.name === 'TypeError' || error?.message?.includes('Failed to fetch') || error?.message?.includes('network')) {
      verifyGoogleAccessToken(accessToken).then((isValid) => {
        if (!isValid) {
          invalidateGoogleAuth();
        }
      }).catch(() => {});
    }
    throw error;
  }
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
 * Cache for Kepegawaian PTK Folder ID
 */
let cachedPTKFolderId: string | null = null;

/**
 * Find or Create folder path: TATA USAHA -> 04_KEPEGAWAIAN_PTK
 */
export const findOrCreatePTKFolder = async (accessToken: string): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedPTKFolderId) {
    return cachedPTKFolderId;
  }

  try {
    const tataUsahaFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');

    let ptkFolderId: string | null = null;
    const queryPTK = `(name = '04_KEPEGAWAIAN_PTK' or name = 'KEPEGAWAIAN_PTK' or name = '04_KEPEGAWAIAN' or name = 'KEPEGAWAIAN' or name = 'GURU_DAN_PTK') and '${tataUsahaFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resPTK = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: queryPTK, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (resPTK.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED');
    }

    if (resPTK.ok) {
      const dataPTK = await resPTK.json();
      if (dataPTK.files && dataPTK.files.length > 0) {
        ptkFolderId = dataPTK.files[0].id;
      }
    }

    if (!ptkFolderId) {
      ptkFolderId = await createGoogleDriveFolder(accessToken, '04_KEPEGAWAIAN_PTK', tataUsahaFolderId);
    }

    cachedPTKFolderId = ptkFolderId;
    return ptkFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning creating TATA USAHA/04_KEPEGAWAIAN_PTK folder:', error?.message || error);
    return findOrCreateTataUsahaFolder(accessToken);
  }
};

/**
 * Format standard clean folder name for individual PTK
 */
export const formatGuruFolderName = (guru: { namaLengkap: string; nip?: string; nuptk?: string }): string => {
  const cleanNama = (guru.namaLengkap || 'PTK').replace(/[\\/:*?"<>|]/g, '').trim();
  let prefix = '';
  if (guru.nip && guru.nip !== '-' && guru.nip.replace(/\D/g, '').length >= 6) {
    prefix = guru.nip.trim();
  } else if (guru.nuptk && guru.nuptk !== '-' && guru.nuptk.replace(/\D/g, '').length >= 6) {
    prefix = `NUPTK-${guru.nuptk.trim()}`;
  } else {
    prefix = 'PTK';
  }
  return `${prefix} - ${cleanNama}`.slice(0, 100);
};

/**
 * Find or Create a dedicated subfolder for an individual Teacher/PTK inside TATA USAHA/04_KEPEGAWAIAN_PTK
 */
export const findOrCreateGuruSubfolder = async (
  accessToken: string,
  guru: { namaLengkap: string; nip?: string; nuptk?: string; id?: string }
): Promise<{ folderId: string; folderName: string }> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const ptkParentFolderId = await findOrCreatePTKFolder(accessToken);
  const targetFolderName = formatGuruFolderName(guru);
  const cleanNama = (guru.namaLengkap || '').replace(/[\\/:*?"<>|]/g, '').toLowerCase().trim();
  const cleanNip = (guru.nip || '').replace(/\D/g, '');

  try {
    // 1. Search for folder matching exact folder name or contains teacher name / nip
    let query = `'${ptkParentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const escapedTarget = targetFolderName.replace(/'/g, "\\'");
    const specificQuery = `${query} and name = '${escapedTarget}'`;

    const searchRes = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: specificQuery, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (searchRes.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED: Sesi Google Drive kedaluwarsa.');
    }

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return { folderId: searchData.files[0].id, folderName: searchData.files[0].name };
      }
    }

    // 2. Also check if any existing folder contains the teacher's name or NIP
    const listRes = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: query, fields: 'files(id, name)', pageSize: '100' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      const match = (listData.files || []).find((f: any) => {
        const fname = (f.name || '').toLowerCase();
        if (cleanNip && cleanNip.length >= 8 && fname.includes(cleanNip)) return true;
        if (cleanNama && cleanNama.length >= 4 && fname.includes(cleanNama)) return true;
        return false;
      });
      if (match) {
        return { folderId: match.id, folderName: match.name };
      }
    }

    // 3. Not found, create new subfolder
    const newFolderId = await createGoogleDriveFolder(accessToken, targetFolderName, ptkParentFolderId);
    return { folderId: newFolderId, folderName: targetFolderName };
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn(`Warning creating subfolder for guru ${guru.namaLengkap}:`, error?.message || error);
    return { folderId: ptkParentFolderId, folderName: '04_KEPEGAWAIAN_PTK' };
  }
};

/**
 * Upload a document (PDF or Image) to the dedicated individual teacher's folder in Google Drive
 */
export const uploadGuruBerkasToDrive = async (
  accessToken: string,
  guru: GuruPTK,
  file: File | Blob,
  fileName: string,
  mimeType: string,
  jenisBerkas: string
): Promise<{
  id: string;
  namaFile: string;
  jenisBerkas: string;
  ukuran: string;
  tanggalUnggah: string;
  driveFileId: string;
  driveWebViewLink: string;
  folderId: string;
  folderName: string;
  mimeType: string;
}> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  // 1. Get or create the individual teacher's folder in TATA USAHA/04_KEPEGAWAIAN_PTK
  const { folderId, folderName } = await findOrCreateGuruSubfolder(accessToken, guru);

  // 2. Upload file to that folder
  const uploaded = await uploadFileToGoogleDrive(accessToken, file, fileName, mimeType, folderId);

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    id: `berkas-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    namaFile: fileName,
    jenisBerkas: jenisBerkas || 'Berkas Kepegawaian',
    ukuran: uploaded.size || formatBytes(file.size),
    tanggalUnggah: todayStr,
    driveFileId: uploaded.id,
    driveWebViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    folderId,
    folderName,
    mimeType,
  };
};

/**
 * Infer berkas category from filename
 */
export function inferJenisBerkasFromFileName(fileName: string): string {
  const fn = (fileName || '').toLowerCase();
  if (fn.includes('pangkat') || fn.includes('golongan') || fn.includes('kgb')) return 'SK Pangkat / Kenaikan Golongan';
  if (fn.includes('cpns') || fn.includes('pns') || fn.includes('pppk') || fn.includes('pengangkatan')) return 'SK CPNS / PNS / PPPK';
  if (fn.includes('ijazah') || fn.includes('transkrip') || fn.includes('diploma') || fn.includes('sarjana') || fn.includes('magister')) return 'Ijazah & Transkrip Terakhir';
  if (fn.includes('serdik') || fn.includes('sertifikat pendidik') || fn.includes('sertifikasi') || fn.includes('nrg')) return 'Sertifikat Pendidik (Serdik)';
  if (fn.includes('ktp') || fn.includes('kartu keluarga') || fn.includes('kk') || fn.includes('karpeg') || fn.includes('taspen') || fn.includes('bpjs')) return 'KTP / KK / Karpeg / Kartu Taspen';
  if (fn.includes('sk pembagian') || fn.includes('tugas') || fn.includes('mutasi') || fn.includes('skbm') || fn.includes('roster')) return 'SK Pembagian Tugas / SK Mutasi';
  if (fn.includes('pelatihan') || fn.includes('diklat') || fn.includes('workshop') || fn.includes('seminar') || fn.includes('bimtek')) return 'Sertifikat Pelatihan / Diklat / Workshop';
  if (fn.includes('skp') || fn.includes('kinerja') || fn.includes('pkg') || fn.includes('penilaian')) return 'Penilaian Kinerja Guru & SKP';
  if (fn.includes('gaji') || fn.includes('berkala')) return 'Kenaikan Gaji Berkala (KGB)';
  return 'Dokumen Lainnya';
}

/**
 * Scan Google Drive folder TATA USAHA/04_KEPEGAWAIAN_PTK
 * Automatically matches subfolders with Guru & PTK names and reads files inside each folder
 * to accurately determine the count and file list of digital documents per teacher.
 */
export const scanAllGuruBerkasFromDrive = async (
  accessToken: string,
  currentGuruList: GuruPTK[]
): Promise<{
  success: boolean;
  data: GuruPTK[];
  totalFilesFound: number;
  matchedFoldersCount: number;
  folderId: string;
}> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const ptkFolderId = await findOrCreatePTKFolder(accessToken);

  // 1. Fetch all subfolders inside TATA USAHA/04_KEPEGAWAIAN_PTK
  const folderQuery = `'${ptkFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const folderRes = await fetch(
    `${DRIVE_API_URL}/files?${new URLSearchParams({
      q: folderQuery,
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: '100',
    }).toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (folderRes.status === 401) {
    invalidateGoogleAuth();
    throw new Error('AUTH_EXPIRED: Token Google Drive kedaluwarsa.');
  }

  if (!folderRes.ok) {
    throw new Error(`Gagal membaca folder 04_KEPEGAWAIAN_PTK (${folderRes.status})`);
  }

  const folderData = await folderRes.json();
  const subfolders: Array<{ id: string; name: string }> = folderData.files || [];

  if (subfolders.length === 0) {
    return {
      success: true,
      data: currentGuruList,
      totalFilesFound: 0,
      matchedFoldersCount: 0,
      folderId: ptkFolderId,
    };
  }

  // 2. Helper to clean and match names
  const cleanNameForMatch = (name: string) => {
    return (name || '')
      .toLowerCase()
      .replace(/^(drs\.|dra\.|dr\.|prof\.|h\.|hj\.|ust\.)\s*/gi, '')
      .replace(/,\s*(s\.pd|m\.pd|s\.kom|m\.kom|s\.ag|m\.ag|s\.si|m\.si|s\.t|m\.t|s\.sos|m\.ap|s\.e|m\.m|gr\.)/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();
  };

  let totalFilesFound = 0;
  let matchedFoldersCount = 0;

  // 3. For each teacher, find their matching folder and get files
  const updatedGuruList: GuruPTK[] = await Promise.all(
    currentGuruList.map(async (guru) => {
      const cleanNip = (guru.nip || '').replace(/\D/g, '');
      const cleanNama = cleanNameForMatch(guru.namaLengkap);
      const nameParts = cleanNama.split(/\s+/).filter((p) => p.length >= 3);

      // Find matching folder
      const matchedFolder = subfolders.find((f) => {
        const fName = (f.name || '').toLowerCase();
        const fCleanName = cleanNameForMatch(f.name);
        const fNip = (f.name || '').replace(/\D/g, '');

        // Match 1: NIP match (>= 8 digits)
        if (cleanNip.length >= 8 && fNip.includes(cleanNip)) {
          return true;
        }

        // Match 2: Exact cleaned name match
        if (cleanNama.length >= 4 && fCleanName.includes(cleanNama)) {
          return true;
        }

        // Match 3: Keyword name parts match (e.g. "Syarifuddin")
        if (nameParts.length > 0 && nameParts.some((part) => fName.includes(part))) {
          return true;
        }

        return false;
      });

      if (!matchedFolder) {
        return guru;
      }

      matchedFoldersCount++;

      // Fetch files inside the teacher's folder
      try {
        const fileQuery = `'${matchedFolder.id}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
        const fileRes = await fetch(
          `${DRIVE_API_URL}/files?${new URLSearchParams({
            q: fileQuery,
            fields: 'files(id, name, size, mimeType, modifiedTime, createdTime, webViewLink, thumbnailLink)',
            pageSize: '100',
            orderBy: 'modifiedTime desc',
          }).toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!fileRes.ok) {
          return guru;
        }

        const fileData = await fileRes.json();
        const driveFiles: any[] = fileData.files || [];
        totalFilesFound += driveFiles.length;

        // Convert drive files into BerkasDigitalItem array
        const scannedBerkas = driveFiles.map((df) => {
          const isPdf = df.mimeType === 'application/pdf' || df.name.toLowerCase().endsWith('.pdf');
          const isImage = df.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(df.name);
          const sizeNumber = Number(df.size) || 0;

          return {
            id: df.id,
            namaFile: df.name,
            jenisBerkas: inferJenisBerkasFromFileName(df.name),
            ukuran: sizeNumber > 0 ? formatBytes(sizeNumber) : 'File Drive',
            tanggalUnggah: df.modifiedTime ? df.modifiedTime.split('T')[0] : new Date().toISOString().split('T')[0],
            driveFileId: df.id,
            driveWebViewLink: df.webViewLink || `https://drive.google.com/file/d/${df.id}/view`,
            folderId: matchedFolder.id,
            folderName: matchedFolder.name,
            mimeType: df.mimeType || (isPdf ? 'application/pdf' : isImage ? 'image/jpeg' : 'application/octet-stream'),
          };
        });

        // Merge with any existing local-only berkas if not duplicated
        const existingLocal = (guru.berkasDigital || []).filter(
          (b) => !b.driveFileId && !scannedBerkas.some((sb) => sb.namaFile === b.namaFile)
        );

        return {
          ...guru,
          berkasDigital: [...scannedBerkas, ...existingLocal],
        };
      } catch (err) {
        console.warn(`Error scanning folder ${matchedFolder.name}:`, err);
        return guru;
      }
    })
  );

  return {
    success: true,
    data: updatedGuruList,
    totalFilesFound,
    matchedFoldersCount,
    folderId: ptkFolderId,
  };
};

/**
 * Fetch all berkas digital files inside a teacher's folder in Google Drive
 */
export const fetchGuruBerkasFiles = async (
  accessToken: string,
  folderId: string
): Promise<GoogleDriveFile[]> => {
  if (!accessToken || !folderId) return [];
  return listGoogleDriveFiles(accessToken, folderId);
};

/**
 * Save & sync Data Guru & PTK into Google Drive folder TATA USAHA/04_KEPEGAWAIAN_PTK
 * with exact file name "Data Guru & PTK" (both Google Sheets preserving templates & JSON)
 */
export const saveGuruPTKDataToDrive = async (
  accessToken: string,
  guruList: GuruPTK[]
): Promise<{ success: boolean; fileId: string; fileName: string; folderId: string; lastUpdated: string }> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const ptkFolderId = await findOrCreatePTKFolder(accessToken);
  const nowFormatted = new Date().toISOString();

  // 1. Check if a Google Spreadsheet named "Data Guru & PTK" or "DATA PTK" exists in the folder
  const checkSheetQuery = `mimeType = 'application/vnd.google-apps.spreadsheet' and (name = 'Data Guru & PTK' or name = 'DATA PTK' or name = 'DATA GURU') and '${ptkFolderId}' in parents and trashed = false`;
  try {
    const sheetSearchRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: checkSheetQuery, fields: 'files(id, name)' }).toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (sheetSearchRes.ok) {
      const sheetData = await sheetSearchRes.json();
      if (sheetData.files && sheetData.files.length > 0) {
        const sheetId = sheetData.files[0].id;
        // Non-destructive write: preserves template header styles, fonts, and borders
        await writeGuruPTKToSheet(accessToken, sheetId, guruList, 'DATA PTK');
      }
    }
  } catch (sheetErr) {
    console.warn('Could not sync to Google Spreadsheet (non-fatal, continuing to JSON):', sheetErr);
  }

  // 2. Also save/update the exact JSON file in TATA USAHA/04_KEPEGAWAIAN_PTK
  const fileName = 'Data Guru & PTK.json';
  const payload = {
    _title: 'DATA GURU & TENAGA KEPENDIDIKAN (PTK)',
    _folder: 'TATA USAHA/04_KEPEGAWAIAN_PTK',
    _fileName: 'Data Guru & PTK',
    _lastSync: nowFormatted,
    _totalPTK: guruList.length,
    _school: 'SMP NEGERI 2 PURIALA',
    guruPTK: guruList,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Check if file exists in 04_KEPEGAWAIAN_PTK folder
  const checkQuery = `(name = '${fileName}' or name = 'Data Guru & PTK' or name = 'DATA_INDUK_PTK.json') and '${ptkFolderId}' in parents and trashed = false`;
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

  let finalFileId = existingFileId;
  if (existingFileId) {
    const updated = await updateFileInGoogleDrive(accessToken, existingFileId, blob, 'application/json');
    if (!updated) {
      const up = await uploadFileToGoogleDrive(accessToken, blob, fileName, 'application/json', ptkFolderId);
      finalFileId = up.id;
    }
  } else {
    const up = await uploadFileToGoogleDrive(accessToken, blob, fileName, 'application/json', ptkFolderId);
    finalFileId = up.id;
  }

  return {
    success: true,
    fileId: finalFileId || '',
    fileName: 'Data Guru & PTK',
    folderId: ptkFolderId,
    lastUpdated: nowFormatted,
  };
};

/**
 * Load Data Guru & PTK from Google Drive folder TATA USAHA/04_KEPEGAWAIAN_PTK
 * Searches for "Data Guru & PTK" (JSON or Google Sheets / CSV)
 */
export const loadGuruPTKDataFromDrive = async (
  accessToken: string
): Promise<{ success: boolean; data: GuruPTK[]; sourceName: string; sourceFolder: string }> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const ptkFolderId = await findOrCreatePTKFolder(accessToken);

  // 1. Search inside 04_KEPEGAWAIAN_PTK folder first
  const queryInFolder = `'${ptkFolderId}' in parents and trashed = false and (name contains 'Data Guru & PTK' or name contains 'DATA GURU' or name contains 'PTK' or name contains 'DATA_INDUK_PTK')`;
  const resInFolder = await fetch(
    `${DRIVE_API_URL}/files?${new URLSearchParams({
      q: queryInFolder,
      fields: 'files(id, name, mimeType, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: '20',
    }).toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (resInFolder.status === 401) {
    invalidateGoogleAuth();
    throw new Error('AUTH_EXPIRED: Token Google Drive kedaluwarsa.');
  }

  let candidateFiles: any[] = [];
  if (resInFolder.ok) {
    candidateFiles = (await resInFolder.json()).files || [];
  }

  // 2. If nothing found in folder, search globally in Drive
  if (candidateFiles.length === 0) {
    const queryGlobal = `trashed = false and (name = 'Data Guru & PTK' or name = 'Data Guru & PTK.json' or name contains 'Data Guru & PTK')`;
    const resGlobal = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({
        q: queryGlobal,
        fields: 'files(id, name, mimeType, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: '10',
      }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (resGlobal.ok) {
      candidateFiles = (await resGlobal.json()).files || [];
    }
  }

  // Prioritize exact match "Data Guru & PTK" or "Data Guru & PTK.json"
  candidateFiles.sort((a, b) => {
    const aExact = a.name === 'Data Guru & PTK' || a.name === 'Data Guru & PTK.json' ? 1 : 0;
    const bExact = b.name === 'Data Guru & PTK' || b.name === 'Data Guru & PTK.json' ? 1 : 0;
    return bExact - aExact;
  });

  for (const file of candidateFiles) {
    // A. If it's a JSON file
    if (file.mimeType === 'application/json' || file.name.endsWith('.json')) {
      try {
        const fileContentRes = await fetch(`${DRIVE_API_URL}/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (fileContentRes.ok) {
          const parsed = await fileContentRes.json();
          const list: GuruPTK[] = parsed.guruPTK || parsed.data || (Array.isArray(parsed) ? parsed : []);
          if (Array.isArray(list) && list.length > 0) {
            return {
              success: true,
              data: list,
              sourceName: file.name,
              sourceFolder: 'TATA USAHA/04_KEPEGAWAIAN_PTK',
            };
          }
        }
      } catch (e) {
        console.warn(`Error reading json file ${file.name}:`, e);
      }
    }

    // B. If it's a Google Spreadsheet
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      try {
        const sheetMetaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${file.id}?fields=sheets(properties(sheetId,title))`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (sheetMetaRes.ok) {
          const metaData = await sheetMetaRes.json();
          const sheets = (metaData.sheets || []).map((s: any) => s.properties?.title || '');
          const targetSheet = sheets.find((t: string) => {
            const tl = t.toLowerCase();
            return (
              tl.includes('ptk') ||
              tl.includes('guru') ||
              tl.includes('data guru') ||
              tl.includes('kepegawaian') ||
              tl.includes('pendidik')
            );
          }) || sheets[0];

          if (targetSheet) {
            const valuesRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${file.id}/values/${encodeURIComponent(targetSheet)}!A1:Z500`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (valuesRes.ok) {
              const valData = await valuesRes.json();
              const rows: string[][] = valData.values || [];
              if (rows.length >= 2) {
                // Dynamic row parsing
                const headerKeywords = ['nama', 'nip', 'nuptk', 'jabatan', 'golongan', 'pangkat', 'jenis'];
                let headerRowIndex = 0;
                let maxScore = 0;
                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                  let score = 0;
                  (rows[i] || []).forEach((c) => {
                    const cl = String(c || '').toLowerCase();
                    if (headerKeywords.some((kw) => cl.includes(kw))) score++;
                  });
                  if (score > maxScore) {
                    maxScore = score;
                    headerRowIndex = i;
                  }
                }

                const headers = (rows[headerRowIndex] || []).map((h) => String(h || '').trim());
                const dataRows = rows.slice(headerRowIndex + 1);

                const findColIndex = (keywords: string[]) =>
                  headers.findIndex((h) => keywords.some((kw) => (h || '').toLowerCase().includes(kw)));

                const colNama = findColIndex(['nama lengkap', 'nama guru', 'nama']);
                const colNip = findColIndex(['nip', 'n.i.p']);
                const colNuptk = findColIndex(['nuptk', 'n.u.p.t.k']);
                const colJabatan = findColIndex(['jabatan', 'tugas']);
                const colJenisPTK = findColIndex(['jenis ptk', 'jenis']);
                const colStatus = findColIndex(['status kepegawaian', 'status']);
                const colGol = findColIndex(['golongan', 'pangkat', 'gol']);
                const colPendidikan = findColIndex(['pendidikan', 'ijazah']);
                const colJurusan = findColIndex(['jurusan', 'prodi']);
                const colSertifikasi = findColIndex(['sertifikasi']);
                const colNoHp = findColIndex(['no hp', 'telepon', 'kontak', 'wa']);
                const colEmail = findColIndex(['email']);

                const parsedList: GuruPTK[] = [];
                dataRows.forEach((r, idx) => {
                  const getV = (cIdx: number) => (cIdx >= 0 && cIdx < r.length && r[cIdx] ? String(r[cIdx]).trim() : '');
                  const rawNama = getV(colNama);
                  const rawNip = getV(colNip);
                  const rawNuptk = getV(colNuptk);

                  if (!rawNama && !rawNip && !rawNuptk) return;

                  parsedList.push({
                    id: `ptk-drive-${Date.now()}-${idx + 1}`,
                    namaLengkap: rawNama || 'Guru / PTK',
                    nip: rawNip || '-',
                    nuptk: rawNuptk || '-',
                    jabatan: getV(colJabatan) || 'Guru Mata Pelajaran',
                    jenisPTK: getV(colJenisPTK) || 'Guru Mapel',
                    statusKepegawaian: getV(colStatus) || 'PNS',
                    golongan: getV(colGol) || '-',
                    pendidikanTerakhir: getV(colPendidikan) || 'S1',
                    jurusan: getV(colJurusan) || 'Pendidikan',
                    statusSertifikasi: getV(colSertifikasi).toLowerCase().includes('sudah') ? 'Sudah Sertifikasi' : 'Belum Sertifikasi',
                    noHp: getV(colNoHp) || '-',
                    email: getV(colEmail) || '',
                    berkasDigital: [],
                  });
                });

                if (parsedList.length > 0) {
                  return {
                    success: true,
                    data: parsedList,
                    sourceName: `${file.name} (${targetSheet})`,
                    sourceFolder: 'TATA USAHA/04_KEPEGAWAIAN_PTK',
                  };
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Error reading sheet file ${file.name}:`, e);
      }
    }
  }

  throw new Error('Tidak ditemukan berkas "Data Guru & PTK" di Google Drive folder TATA USAHA/04_KEPEGAWAIAN_PTK.');
};

/**
 * Cache for Kesiswaan & Alumni Folder ID
 */
let cachedKesiswaanFolderId: string | null = null;

/**
 * Find or Create folder path: TATA USAHA -> 05_KESISWAAN_DAN_ALUMNI
 */
export const findOrCreateKesiswaanFolder = async (accessToken: string): Promise<string> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  if (cachedKesiswaanFolderId) {
    return cachedKesiswaanFolderId;
  }

  try {
    const tataUsahaFolderId = await findOrCreateTataUsahaFolder(accessToken, 'TATA USAHA');

    let kesiswaanFolderId: string | null = null;
    const queryKesiswaan = `(name = '05_KESISWAAN_DAN_ALUMNI' or name = 'KESISWAAN_DAN_ALUMNI' or name = '05_KESISWAAN' or name = 'KESISWAAN' or name = 'BUKU_INDUK_SISWA') and '${tataUsahaFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resKesiswaan = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({ q: queryKesiswaan, fields: 'files(id, name)' }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (resKesiswaan.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED');
    }

    if (resKesiswaan.ok) {
      const dataKesiswaan = await resKesiswaan.json();
      if (dataKesiswaan.files && dataKesiswaan.files.length > 0) {
        kesiswaanFolderId = dataKesiswaan.files[0].id;
      }
    }

    if (!kesiswaanFolderId) {
      kesiswaanFolderId = await createGoogleDriveFolder(accessToken, '05_KESISWAAN_DAN_ALUMNI', tataUsahaFolderId);
    }

    cachedKesiswaanFolderId = kesiswaanFolderId;
    return kesiswaanFolderId;
  } catch (error: any) {
    if (error?.message?.includes('AUTH_EXPIRED') || error?.message?.includes('invalid authentication credentials')) {
      invalidateGoogleAuth();
      throw error;
    }
    console.warn('Warning creating TATA USAHA/05_KESISWAAN_DAN_ALUMNI folder:', error?.message || error);
    return findOrCreateTataUsahaFolder(accessToken);
  }
};

/**
 * Save & sync Buku Induk Siswa data into Google Drive folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI
 * with exact file name "BUKU_INDUK_SISWA_DAN_ALUMNI" (Google Sheets preserving table structure & JSON backup)
 */
export const saveBukuIndukDataToDrive = async (
  accessToken: string,
  siswaList: Siswa[]
): Promise<{ success: boolean; fileId: string; fileName: string; folderId: string; lastUpdated: string }> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const kesiswaanFolderId = await findOrCreateKesiswaanFolder(accessToken);
  const nowFormatted = new Date().toISOString();

  // 1. Check if a Google Spreadsheet named "BUKU_INDUK_SISWA_DAN_ALUMNI" exists in the folder
  const checkSheetQuery = `mimeType = 'application/vnd.google-apps.spreadsheet' and name = 'BUKU_INDUK_SISWA_DAN_ALUMNI' and '${kesiswaanFolderId}' in parents and trashed = false`;
  let existingSheetId: string | null = null;
  let fileName = 'BUKU_INDUK_SISWA_DAN_ALUMNI';

  try {
    const sheetSearchRes = await fetch(`${DRIVE_API_URL}/files?${new URLSearchParams({ q: checkSheetQuery, fields: 'files(id, name)' }).toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (sheetSearchRes.ok) {
      const sheetData = await sheetSearchRes.json();
      if (sheetData.files && sheetData.files.length > 0) {
        existingSheetId = sheetData.files[0].id;
        fileName = sheetData.files[0].name;
      }
    }
  } catch (sheetErr) {
    console.warn('Could not sync to existing Google Spreadsheet:', sheetErr);
  }

  // If no spreadsheet exists yet, create the Google Spreadsheet named "BUKU_INDUK_SISWA_DAN_ALUMNI"
  if (!existingSheetId) {
    try {
      const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: 'BUKU_INDUK_SISWA_DAN_ALUMNI',
          },
          sheets: [
            {
              properties: {
                title: 'BUKU INDUK SISWA',
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
            },
          ],
        }),
      });

      if (createSheetRes.ok) {
        const createdSheet = await createSheetRes.json();
        existingSheetId = createdSheet.spreadsheetId;

        // Move to 05_KESISWAAN_DAN_ALUMNI folder
        await fetch(`${DRIVE_API_URL}/files/${existingSheetId}?addParents=${kesiswaanFolderId}&fields=id,parents`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else {
        const err = await createSheetRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Gagal membuat Google Spreadsheet baru untuk Buku Induk');
      }
    } catch (createErr: any) {
      throw new Error(`Gagal membuat Google Spreadsheet Buku Induk: ${createErr?.message || createErr}`);
    }
  }

  if (existingSheetId) {
    // Write 2D array data directly to sheet "BUKU INDUK SISWA"
    await writeSiswaToSheet(accessToken, existingSheetId, siswaList, 'BUKU INDUK SISWA');
  } else {
    throw new Error('Gagal menginisialisasi Google Spreadsheet Buku Induk Siswa.');
  }

  return {
    success: true,
    fileId: existingSheetId,
    fileName: fileName,
    folderId: kesiswaanFolderId,
    lastUpdated: nowFormatted,
  };
};

/**
 * Load Buku Induk Siswa from Google Drive folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI
 * Searches strictly for "BUKU_INDUK_SISWA_DAN_ALUMNI" (Google Sheets)
 */
export const loadBukuIndukDataFromDrive = async (
  accessToken: string
): Promise<{ success: boolean; data: Siswa[]; sourceName: string; sourceFolder: string }> => {
  if (!accessToken) {
    throw new Error('AUTH_EXPIRED: Token Google Drive kosong.');
  }

  const kesiswaanFolderId = await findOrCreateKesiswaanFolder(accessToken);

  // 1. Query strictly inside 05_KESISWAAN_DAN_ALUMNI folder for a spreadsheet named "BUKU_INDUK_SISWA_DAN_ALUMNI"
  const queryInFolder = `mimeType = 'application/vnd.google-apps.spreadsheet' and name = 'BUKU_INDUK_SISWA_DAN_ALUMNI' and '${kesiswaanFolderId}' in parents and trashed = false`;
  
  let targetFileId: string | null = null;
  let targetFileName = 'BUKU_INDUK_SISWA_DAN_ALUMNI';

  try {
    const resInFolder = await fetch(
      `${DRIVE_API_URL}/files?${new URLSearchParams({
        q: queryInFolder,
        fields: 'files(id, name)',
        pageSize: '1',
      }).toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (resInFolder.status === 401) {
      invalidateGoogleAuth();
      throw new Error('AUTH_EXPIRED: Token Google Drive kedaluwarsa.');
    }

    if (resInFolder.ok) {
      const data = await resInFolder.json();
      if (data.files && data.files.length > 0) {
        targetFileId = data.files[0].id;
        targetFileName = data.files[0].name;
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('AUTH_EXPIRED')) {
      throw err;
    }
    console.warn('Could not query BUKU_INDUK_SISWA_DAN_ALUMNI from folder:', err);
  }

  if (!targetFileId) {
    throw new Error(
      'Gagal menarik data: Berkas spreadsheet "BUKU_INDUK_SISWA_DAN_ALUMNI" tidak ditemukan di dalam Google Drive folder TATA USAHA/05_KESISWAAN_DAN_ALUMNI. Silakan klik "Kirim Data ke Drive" terlebih dahulu untuk membuat berkas.'
    );
  }

  // 2. Read strictly from sheet "BUKU INDUK SISWA"
  try {
    const targetSheet = 'BUKU INDUK SISWA';
    const valuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${targetFileId}/values/${encodeURIComponent(targetSheet)}!A1:Z2000`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (valuesRes.ok) {
      const valData = await valuesRes.json();
      const rows: string[][] = valData.values || [];
      if (rows.length >= 2) {
        const parsed = parseSiswaFromRows(rows);
        if (parsed.siswaList && parsed.siswaList.length > 0) {
          return {
            success: true,
            data: parsed.siswaList,
            sourceName: `${targetFileName} (${targetSheet})`,
            sourceFolder: 'TATA USAHA/05_KESISWAAN_DAN_ALUMNI',
          };
        }
      }
    } else {
      const errJson = await valuesRes.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Gagal membaca sheet "${targetSheet}".`);
    }
  } catch (e: any) {
    throw new Error(`Gagal menarik data dari sheet "BUKU INDUK SISWA": ${e.message || e}`);
  }

  throw new Error('Berkas spreadsheet "BUKU_INDUK_SISWA_DAN_ALUMNI" ditemukan, tetapi tidak berisi data siswa yang valid pada sheet "BUKU INDUK SISWA".');
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



