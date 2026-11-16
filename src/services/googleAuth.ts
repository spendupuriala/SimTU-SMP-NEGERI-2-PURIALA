import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  Firestore,
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose connection failure logs when offline or restricted
setLogLevel('error');

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const initFirestoreSafe = (): Firestore | null => {
  const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
        experimentalForceLongPolling: true,
      },
      databaseId
    );
  } catch (err) {
    console.warn('Primary initializeFirestore failed, falling back to getFirestore:', err);
    try {
      return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    } catch (fallbackErr) {
      console.warn('Firestore unavailable in current runtime:', fallbackErr);
      return null;
    }
  }
};

export const db: Firestore | null = initFirestoreSafe();

// Configure Google Auth Provider with Drive & Sheets scopes
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
let firebaseApiKeyExpired = false;
// Storage keys versioned to discard stale tokens from previous OAuth project configurations
const STORAGE_TOKEN_KEY = 'SIMTU_GDRIVE_ACCESS_TOKEN_V2';
const STORAGE_USER_KEY = 'SIMTU_GDRIVE_USER_DATA_V2';
const STORAGE_EXPIRY_KEY = 'SIMTU_GDRIVE_EXPIRY_V2';

// Proactively detect if Firebase Web API Key is expired so click handler can route directly to GIS OAuth without losing user gesture
const checkFirebaseApiKeyStatus = async () => {
  if (!firebaseConfig?.apiKey) {
    firebaseApiKeyExpired = true;
    return;
  }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(firebaseConfig.apiKey)}`
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = String(data?.error?.message || '');
      const reason = String(data?.error?.details?.[0]?.reason || '');
      if (
        msg.toLowerCase().includes('api key expired') ||
        reason === 'API_KEY_INVALID' ||
        msg.toLowerCase().includes('api_key_invalid')
      ) {
        firebaseApiKeyExpired = true;
      }
    }
  } catch {
    // Ignore network errors during background key check
  }
};

if (typeof window !== 'undefined') {
  checkFirebaseApiKeyStatus();
}

const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window unavailable'));
      return;
    }
    const w = window as any;
    if (w.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity Services')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'));
    document.head.appendChild(script);
  });
};

const gisGoogleSignIn = async (loginHint?: string): Promise<{ user: any; accessToken: string } | null> => {
  const clientId = (firebaseConfig as { oAuthClientId?: string }).oAuthClientId;
  if (!clientId) {
    throw new Error('Konfigurasi Google OAuth Client ID tidak ditemukan.');
  }

  let oauth2 = (window as any).google?.accounts?.oauth2;
  if (!oauth2) {
    await loadGisScript();
    oauth2 = (window as any).google?.accounts?.oauth2;
  }
  if (!oauth2) {
    throw new Error('Layanan Google Identity Services belum siap. Silakan coba lagi.');
  }

  const scopes = [...GOOGLE_DRIVE_SCOPES, 'openid', 'email', 'profile'].join(' ');

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        hint: loginHint || undefined,
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
              resolve(null);
              return;
            }
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse?.access_token;
          if (!accessToken) {
            reject(new Error('Gagal mendapatkan token akses dari Google.'));
            return;
          }

          let userProfile: any = getStoredGoogleUser() || {
            uid: 'google-oauth-user',
            email: loginHint || 'spendupuriala@gmail.com',
            displayName: 'Akun Google Sekolah',
            photoURL: '',
          };

          try {
            const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (infoRes.ok) {
              const info = await infoRes.json();
              userProfile = {
                uid: info.sub || userProfile.uid,
                email: info.email || userProfile.email,
                displayName: info.name || userProfile.displayName,
                photoURL: info.picture || '',
              };
            }
          } catch {
            // Keep fallback profile if userinfo fetch fails
          }

          cachedAccessToken = accessToken;
          persistToken(accessToken, userProfile);
          if (globalAuthSuccessCallback) {
            globalAuthSuccessCallback(userProfile, accessToken);
          }
          resolve({ user: userProfile, accessToken });
        },
        error_callback: (err: any) => {
          if (err?.type === 'popup_closed') {
            resolve(null);
            return;
          }
          if (err?.type === 'popup_failed_to_open') {
            reject(new Error('Popup login diblokir oleh peramban. Harap izinkan pop-up untuk situs ini lalu klik Hubungkan Google lagi.'));
            return;
          }
          reject(new Error(err?.message || 'Gagal membuka jendela otorisasi Google.'));
        },
      });

      tokenClient.requestAccessToken({ prompt: loginHint ? '' : 'select_account' });
    } catch (e: any) {
      reject(e);
    }
  });
};

// Registered auth listeners
let globalAuthSuccessCallback: ((user: any, token: string) => void) | null = null;
let globalAuthFailureCallback: (() => void) | null = null;

// Helper to check and retrieve a stored token candidate
export const getValidStoredToken = (): string | null => {
  try {
    const expiryRaw = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (expiryRaw && Date.now() >= Number(expiryRaw)) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      localStorage.removeItem('SIMTU_GDRIVE_CONNECTED_STATUS');
      return null;
    }
    const stored = localStorage.getItem(STORAGE_TOKEN_KEY) || sessionStorage.getItem(STORAGE_TOKEN_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
    return null;
  } catch {
    return null;
  }
};

// Check if a stored login session exists
export const hasStoredSession = (): boolean => {
  try {
    const hasToken = Boolean(getValidStoredToken());
    const hasUser = Boolean(getStoredGoogleUser());
    const isConnected = localStorage.getItem('SIMTU_GDRIVE_CONNECTED_STATUS') === 'true';
    return hasToken || hasUser || isConnected;
  } catch {
    return false;
  }
};

let cachedAccessToken: string | null = getValidStoredToken();

// Helper to save or clear token persistently
export const persistToken = (token: string | null, user?: any) => {
  cachedAccessToken = token;
  try {
    if (token) {
      const previousToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem('SIMTU_GDRIVE_CONNECTED_STATUS', 'true');
      if (previousToken !== token || !localStorage.getItem(STORAGE_EXPIRY_KEY)) {
        localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000));
      }
      if (user) {
        localStorage.setItem(
          STORAGE_USER_KEY,
          JSON.stringify({
            uid: user.uid || 'google-user',
            email: user.email || 'spendupuriala@gmail.com',
            displayName: user.displayName || 'Admin Tata Usaha',
            photoURL: user.photoURL || '',
          })
        );
      }
    } else {
      // Only clear storage on explicit logout
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      localStorage.removeItem('SIMTU_GDRIVE_CONNECTED_STATUS');
    }
  } catch (e) {
    console.warn('Storage token persist warning:', e);
  }
};

// Retrieve stored user profile if available
export const getStoredGoogleUser = (): any | null => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.email || parsed.displayName || parsed.uid)) {
        return parsed;
      }
    }
    if (localStorage.getItem('SIMTU_GDRIVE_CONNECTED_STATUS') === 'true') {
      return {
        uid: 'google-tu-user',
        email: 'spendupuriala@gmail.com',
        displayName: 'Akun Google Sekolah',
        photoURL: '',
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Verify whether an OAuth access token is still accepted by Google APIs
 */
export const verifyGoogleAccessToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const info = await res.json();
      return Boolean(info && (info.expires_in === undefined || Number(info.expires_in) > 0));
    }
    return false;
  } catch {
    // If offline or network issue, maintain true so session is not falsely invalidated
    return true;
  }
};

/**
 * Clear expired OAuth access token while preserving saved user profile for easy re-authentication
 */
export const invalidateGoogleAuth = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
    localStorage.removeItem('SIMTU_GDRIVE_CONNECTED_STATUS');
  } catch (e) {
    console.warn('Could not clear expired token from storage:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('simtu-auth-expired'));
  }
};

/**
 * Perform silent token refresh in background
 */
export const silentRefreshGoogleToken = async (): Promise<string | null> => {
  return cachedAccessToken || getValidStoredToken();
};

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User | any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) globalAuthSuccessCallback = onAuthSuccess;
  if (onAuthFailure) globalAuthFailureCallback = onAuthFailure;

  const validToken = getValidStoredToken();
  const savedUser = getStoredGoogleUser();

  // Step 1: Immediate persistent session restore on load / page refresh, then verify token validity
  if (validToken && savedUser) {
    cachedAccessToken = validToken;
    if (onAuthSuccess) {
      onAuthSuccess(savedUser, validToken);
    }
    verifyGoogleAccessToken(validToken).then((isValid) => {
      if (!isValid) {
        invalidateGoogleAuth();
      }
    });
  } else if (!hasStoredSession()) {
    if (onAuthFailure) {
      onAuthFailure();
    }
  }

  // Step 2: Listen for Firebase auth changes
  const authUnsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    const currentToken = cachedAccessToken || getValidStoredToken();
    const currentUser = getStoredGoogleUser();

    if (user) {
      const mergedUser = {
        uid: user.uid,
        email: user.email || currentUser?.email || 'spendupuriala@gmail.com',
        displayName: user.displayName || currentUser?.displayName || 'Admin Tata Usaha',
        photoURL: user.photoURL || currentUser?.photoURL || '',
      };
      if (currentToken) {
        persistToken(currentToken, mergedUser);
        if (onAuthSuccess) onAuthSuccess(mergedUser, currentToken);
      } else {
        if (onAuthSuccess) onAuthSuccess(mergedUser, '');
      }
    } else {
      // Firebase auth is null (e.g. initial reload before Firebase indexedDB is ready)
      // DO NOT clear user if localStorage has saved session!
      if (currentToken && currentUser) {
        cachedAccessToken = currentToken;
        if (onAuthSuccess) onAuthSuccess(currentUser, currentToken);
      } else if (!hasStoredSession()) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });

  return () => {
    authUnsubscribe();
  };
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User | any; accessToken: string } | null> => {
  const storedUser = getStoredGoogleUser();

  try {
    isSigningIn = true;

    // If Firebase API key is known expired, route directly to GIS OAuth synchronously in click stack
    if (firebaseApiKeyExpired) {
      return await gisGoogleSignIn(storedUser?.email);
    }

    if (storedUser?.email) {
      provider.setCustomParameters({
        login_hint: storedUser.email,
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    persistToken(cachedAccessToken, result.user);
    if (globalAuthSuccessCallback) {
      globalAuthSuccessCallback(result.user, cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    // Handle expired/invalid Firebase API key by falling back to GIS OAuth using oAuthClientId
    if (
      errorCode.includes('api-key-expired') ||
      errorCode.includes('invalid-api-key') ||
      errorMsg.includes('api-key-expired') ||
      errorMsg.includes('API key expired')
    ) {
      firebaseApiKeyExpired = true;
      console.info('Firebase Auth API key expired; switching to Google Identity Services OAuth.');
      try {
        return await gisGoogleSignIn(storedUser?.email);
      } catch (gisErr: any) {
        console.warn('GIS OAuth fallback warning:', gisErr?.message || gisErr);
        throw new Error(
          gisErr?.message ||
            'API Key Firebase kedaluwarsa. Silakan klik "Hubungkan Google" sekali lagi untuk masuk melalui Google OAuth.'
        );
      }
    }

    // Handle user closing popup or canceling sign-in cleanly without throwing error
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorMsg.includes('popup-closed-by-user') ||
      errorMsg.includes('cancelled-popup-request')
    ) {
      console.info('Google Sign-In popup ditutup oleh pengguna.');
      return null;
    }

    if (errorCode === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup diblokir oleh browser.');
      throw new Error('Popup login diblokir oleh peramban. Harap izinkan pop-up untuk situs ini.');
    }

    console.warn('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || getValidStoredToken();
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  persistToken(token);
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
  cachedAccessToken = null;
  persistToken(null);
  if (globalAuthFailureCallback) {
    globalAuthFailureCallback();
  }
};

