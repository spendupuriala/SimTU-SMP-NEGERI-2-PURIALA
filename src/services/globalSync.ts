import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './googleAuth';

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
  try {
    const docRef = doc(db, 'system_status', 'global_sync');
    await setDoc(docRef, {
      moduleName,
      updatedBy: updatedBy || 'Pengguna SimTU',
      updatedAt: serverTimestamp(),
      actionType,
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update global sync status in Firestore:', error);
  }
}

/**
 * Subscribes to the real-time global sync document.
 */
export function subscribeToGlobalSync(callback: (data: GlobalSyncData) => void) {
  const docRef = doc(db, 'system_status', 'global_sync');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        moduleName: data.moduleName || '',
        updatedBy: data.updatedBy || 'Seseorang',
        updatedAt: data.updatedAt,
        actionType: data.actionType || 'UPDATE',
      });
    }
  }, (error) => {
    console.error('Error listening to global sync:', error);
  });
}
