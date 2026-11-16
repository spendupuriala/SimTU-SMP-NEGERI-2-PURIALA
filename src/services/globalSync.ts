export interface GlobalSyncData {
  moduleName: string;
  updatedBy: string;
  updatedAt: { toMillis: () => number } | null;
  actionType: 'CREATE' | 'UPDATE' | 'DRIVE_SYNC';
}

const GLOBAL_SYNC_CHANNEL = 'simtu_global_sync_channel';
const GLOBAL_SYNC_STORAGE_KEY = 'SIMTU_GLOBAL_SYNC_EVENT';

interface SerializedSyncPayload {
  moduleName: string;
  updatedBy: string;
  timestampMs: number;
  actionType: 'CREATE' | 'UPDATE' | 'DRIVE_SYNC';
}

const hydratePayload = (payload: SerializedSyncPayload): GlobalSyncData => ({
  moduleName: payload.moduleName || '',
  updatedBy: payload.updatedBy || 'Pengguna SimTU',
  updatedAt: { toMillis: () => Number(payload.timestampMs) || Date.now() },
  actionType: payload.actionType || 'UPDATE',
});

/**
 * Triggers a cross-tab notification across active browser sessions without requiring Firestore.
 */
export async function notifyGlobalSync(
  moduleName: string,
  updatedBy: string,
  actionType: 'CREATE' | 'UPDATE' | 'DRIVE_SYNC'
) {
  try {
    const payload: SerializedSyncPayload = {
      moduleName,
      updatedBy: updatedBy || 'Pengguna SimTU',
      timestampMs: Date.now(),
      actionType,
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(GLOBAL_SYNC_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GLOBAL_SYNC_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Non-blocking cross-tab sync fallback
  }
}

/**
 * Subscribes to cross-tab sync events cleanly without opening Cloud Firestore sockets.
 */
export function subscribeToGlobalSync(callback: (data: GlobalSyncData) => void) {
  let channel: BroadcastChannel | null = null;

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(GLOBAL_SYNC_CHANNEL);
      channel.onmessage = (event) => {
        if (event?.data?.moduleName) {
          callback(hydratePayload(event.data as SerializedSyncPayload));
        }
      };
    } catch {
      channel = null;
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== GLOBAL_SYNC_STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as SerializedSyncPayload;
      if (parsed && parsed.moduleName) {
        callback(hydratePayload(parsed));
      }
    } catch {
      // Ignore malformed storage payload
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
