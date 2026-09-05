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
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (stored) {
      if (expiry) {
        const expTime = parseInt(expiry, 10);
        // If it's within the artificial 55 minutes, or within a 2-hour grace period, keep using it
        // We will let background verification handle any actual expirations smoothly
        if (Number.isFinite(expTime) && Date.now() < expTime + 120 * 60 * 1000) {
          return stored;
        }
      } else {
        return stored;
      }
    }
    return null;
  } catch {
    return null;
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
      // Set initial expiry to 55 minutes
      localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000));
      if (user) {
        localStorage.setItem(
          STORAGE_USER_KEY,
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        );
      }
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
    }
  } catch (e) {
    console.warn('Storage token persist warning:', e);
  }
};

// Retrieve stored user profile if available
export const getStoredGoogleUser = (): any | null => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Verify whether an OAuth access token is still accepted by Google APIs
 * If valid, automatically extends its local lifetime!
 */
export const verifyGoogleAccessToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const info = await res.json();
      const isValid = Boolean(info && (info.expires_in === undefined || Number(info.expires_in) > 0));
      if (isValid) {
        // Auto Renew: extend local expiration time since it is verified as active
        localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000));
      }
      return isValid;
    }
    return false;
  } catch {
    // If there is a network error, keep it true temporarily to avoid unnecessary logouts
    return true;
  }
};

/**
 * Invalidate token and notify listeners to disconnect Drive cleanly
 */
export const invalidateGoogleAuth = () => {
  cachedAccessToken = null;
  persistToken(null);
  if (globalAuthFailureCallback) {
    globalAuthFailureCallback();
  }
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

  // Step 1: Optimistic restore (Zero-flicker loading)
  if (validToken && savedUser) {
    cachedAccessToken = validToken;
    if (onAuthSuccess) {
      onAuthSuccess(savedUser, validToken);
    }
    
    // Asynchronously verify token with Google in background
    verifyGoogleAccessToken(validToken).then((isValid) => {
      if (!isValid) {
        // Token is actually invalid/expired, invalidate cleanly
        invalidateGoogleAuth();
      }
    });
  } else {
    // No saved session
    cachedAccessToken = null;
    persistToken(null);
    if (onAuthFailure) onAuthFailure();
  }

  // Periodic automatic token validator (runs every 10 minutes to auto-renew expiry)
  const validationInterval = setInterval(() => {
    const token = cachedAccessToken || getValidStoredToken();
    if (token) {
      verifyGoogleAccessToken(token).then((isValid) => {
        if (!isValid) {
          invalidateGoogleAuth();
        }
      });
    }
  }, 10 * 60 * 1000);

  const authUnsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const activeToken = cachedAccessToken || getValidStoredToken();
      if (activeToken) {
        persistToken(activeToken, user);
        if (onAuthSuccess) onAuthSuccess(user, activeToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      const activeToken = getValidStoredToken();
      const userProfile = getStoredGoogleUser();
      if (activeToken && userProfile) {
        cachedAccessToken = activeToken;
        if (onAuthSuccess) onAuthSuccess(userProfile, activeToken);
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });

  return () => {
    clearInterval(validationInterval);
    authUnsubscribe();
  };
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    persistToken(cachedAccessToken, result.user);
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
  invalidateGoogleAuth();
};

