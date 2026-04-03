/**
 * statusStore.ts — Local IndexedDB status/stories management
 * 
 * Status updates expire after 24 hours.
 */

const DB_NAME = 'QuroStatus';
const DB_VERSION = 1;
const STORE_NAME = 'statuses';

export interface QuroStatus {
  id: string;
  quroCode: string; // The user who posted it
  text: string;
  imageUrl?: string;
  timestamp: string; // ISO
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function genId(): string {
  return `status_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Add a new status */
export async function addStatus(quroCode: string, text: string, imageUrl?: string): Promise<QuroStatus> {
  const status: QuroStatus = {
    id: genId(),
    quroCode,
    text,
    imageUrl,
    timestamp: new Date().toISOString(),
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(status);
    tx.oncomplete = () => resolve(status);
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all statuses (optionally filter for recent only) */
export async function getStatuses(): Promise<QuroStatus[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const now = new Date().getTime();
      const msgs: QuroStatus[] = (req.result || []).filter(s => {
        const d = new Date(s.timestamp).getTime();
        // Keep statuses from last 24 hours
        return (now - d) < 24 * 60 * 60 * 1000;
      });
      // Sort newest first
      msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(msgs);
    };
    req.onerror = () => reject(req.error);
  });
}
