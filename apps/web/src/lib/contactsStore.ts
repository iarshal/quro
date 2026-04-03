/**
 * contactsStore.ts — Local IndexedDB contacts management
 * 
 * Each contact stores their unique Quro code, name, avatar.
 * All data stays on-device only.
 */

const DB_NAME = 'QuroContacts';
const DB_VERSION = 1;
const STORE_NAME = 'contacts';

export interface QuroContact {
  quroCode: string;     // Unique 8-char code (primary key)
  displayName: string;
  avatarDataUrl?: string;
  gender?: string;
  addedAt: string;       // ISO timestamp
  lastMessage?: string;
  lastMessageAt?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'quroCode' });
        store.createIndex('displayName', 'displayName', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Add a contact */
export async function addContact(contact: QuroContact): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(contact);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all contacts */
export async function getContacts(): Promise<QuroContact[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Get a single contact by code */
export async function getContact(quroCode: string): Promise<QuroContact | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(quroCode);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Remove a contact */
export async function removeContact(quroCode: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(quroCode);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Search contacts by name or code */
export async function searchContacts(query: string): Promise<QuroContact[]> {
  const all = await getContacts();
  const q = query.toLowerCase().trim();
  if (!q) return all;
  return all.filter(c =>
    c.displayName.toLowerCase().includes(q) ||
    c.quroCode.toLowerCase().includes(q)
  );
}

/** Update last message for a contact */
export async function updateLastMessage(quroCode: string, message: string): Promise<void> {
  const contact = await getContact(quroCode);
  if (!contact) return;
  contact.lastMessage = message;
  contact.lastMessageAt = new Date().toISOString();
  await addContact(contact); // put() upserts
}
