import { doc, setDoc, onSnapshot, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './googleAuth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.warn('Firestore Error:', JSON.stringify(errInfo));
}

async function testFirestoreConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'system_status', 'global_sync'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or unreachable; check Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export interface GlobalSyncData {
  moduleName: string;
  updatedBy: string;
  updatedAt: any;
  actionType: 'CREATE' | 'UPDATE' | 'DRIVE_SYNC';
}

/**
 * Triggers a real-time global notification across all active sessions.
 */
export async function notifyGlobalSync(
  moduleName: string,
  updatedBy: string,
  actionType: 'CREATE' | 'UPDATE' | 'DRIVE_SYNC'
) {
  if (!db) return;
  const path = 'system_status/global_sync';
  try {
    const docRef = doc(db, 'system_status', 'global_sync');
    await setDoc(
      docRef,
      {
        moduleName,
        updatedBy: updatedBy || 'Pengguna SimTU',
        updatedAt: serverTimestamp(),
        actionType,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to the real-time global sync document.
 */
export function subscribeToGlobalSync(callback: (data: GlobalSyncData) => void) {
  if (!db) {
    return () => {};
  }
  const path = 'system_status/global_sync';
  try {
    const docRef = doc(db, 'system_status', 'global_sync');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            moduleName: data.moduleName || '',
            updatedBy: data.updatedBy || 'Seseorang',
            updatedAt: data.updatedAt,
            actionType: data.actionType || 'UPDATE',
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

