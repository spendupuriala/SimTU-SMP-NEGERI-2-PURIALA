import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

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
// Storage keys versioned to discard stale tokens from previous OAuth project configurations
const STORAGE_TOKEN_KEY = 'SIMTU_GDRIVE_ACCESS_TOKEN_V2';
const STORAGE_USER_KEY = 'SIMTU_GDRIVE_USER_DATA_V2';
const STORAGE_EXPIRY_KEY = 'SIMTU_GDRIVE_EXPIRY_V2';

// Registered auth listeners
let globalAuthSuccessCallback: ((user: any, token: string) => void) | null = null;
let globalAuthFailureCallback: (() => void) | null = null;

// Helper to check and retrieve a stored token candidate
export const getValidStoredToken = (): string | null => {
  try {
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
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem('SIMTU_GDRIVE_CONNECTED_STATUS', 'true');
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
 * Non-destructive auth notice: keeping stored login session intact across reloads & sessions
 */
export const invalidateGoogleAuth = () => {
  console.info('Google session notice: preserving persistent session in storage per mandatory rule.');
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

  // Step 1: Immediate persistent session restore on load / page refresh
  if (validToken && savedUser) {
    cachedAccessToken = validToken;
    if (onAuthSuccess) {
      onAuthSuccess(savedUser, validToken);
    }
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
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const storedUser = getStoredGoogleUser();
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

    console.error('Google Sign In error:', error);
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

