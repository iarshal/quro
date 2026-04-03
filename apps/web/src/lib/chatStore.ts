/**
 * chatStore.ts — Local IndexedDB chat message storage
 * 
 * Messages stored per conversation (identified by contact quroCode).
 * All data stays on-device only.
 */

const DB_NAME = 'QuroChats';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

export interface ChatMessage {
  id: string;            // Unique message ID
  conversationId: string; // Contact's quroCode
  sender: 'me' | 'them';
  text: string;
  timestamp: string;     // ISO
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  contactCode: string;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('conversationId', 'conversationId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Generate a unique message ID */
function genId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Send a message */
export async function sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: genId(),
    conversationId,
    sender: 'me',
    text,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(msg);
    tx.oncomplete = () => resolve(msg);
    tx.onerror = () => reject(tx.error);
  });
}

/** Add a received message (for demo/simulation) */
export async function addReceivedMessage(conversationId: string, text: string): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: genId(),
    conversationId,
    sender: 'them',
    text,
    timestamp: new Date().toISOString(),
    status: 'delivered',
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(msg);
    tx.oncomplete = () => resolve(msg);
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all messages for a conversation */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const idx = tx.objectStore(STORE_NAME).index('conversationId');
    const req = idx.getAll(conversationId);
    req.onsuccess = () => {
      const msgs = (req.result || []).sort((a: ChatMessage, b: ChatMessage) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      resolve(msgs);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Get all conversations (grouped by conversationId) */
export async function getConversations(): Promise<Conversation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const msgs: ChatMessage[] = req.result || [];
      const map = new Map<string, ChatMessage[]>();
      for (const m of msgs) {
        if (!map.has(m.conversationId)) map.set(m.conversationId, []);
        map.get(m.conversationId)!.push(m);
      }
      const convos: Conversation[] = [];
      map.forEach((messages, code) => {
        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const last = messages[0];
        const unread = messages.filter(m => m.sender === 'them' && m.status !== 'read').length;
        convos.push({
          contactCode: code,
          contactName: code, // Will be enriched by the UI
          lastMessage: last.text,
          lastMessageAt: last.timestamp,
          unreadCount: unread,
        });
      });
      convos.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      resolve(convos);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Delete a conversation */
export async function deleteConversation(conversationId: string): Promise<void> {
  const msgs = await getMessages(conversationId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const m of msgs) store.delete(m.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
