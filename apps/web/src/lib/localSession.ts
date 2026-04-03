/**
 * localSession.ts — Manage login sessions using localStorage
 * 
 * Tracks whether user is currently "logged in" (face verified this session).
 * All session data is purely local — never leaves the device.
 */

const SESSION_KEY = 'quro_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionData {
  quroId: string;
  displayName: string;
  loggedInAt: string;
  expiresAt: string;
}

/** Create a new local session after face verification */
export function createSession(quroId: string, displayName: string): void {
  const now = new Date();
  const session: SessionData = {
    quroId,
    displayName,
    loggedInAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_EXPIRY_MS).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Add to login history
  try {
    const rawHistory = localStorage.getItem('quro_login_history') || '[]';
    const history = JSON.parse(rawHistory);
    history.unshift({
      time: now.toISOString(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device'
    });
    // Keep last 10 logins
    localStorage.setItem('quro_login_history', JSON.stringify(history.slice(0, 10)));
  } catch {}
}

/** Get current session (null if expired or not logged in) */
export function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: SessionData = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/** Check if user is currently logged in */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/** Clear the current session (logout) */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Store chat messages locally */
export function saveChatMessages(conversationId: string, messages: any[]): void {
  localStorage.setItem(`quro_chat_${conversationId}`, JSON.stringify(messages));
}

/** Load chat messages from local storage */
export function loadChatMessages(conversationId: string): any[] {
  try {
    const raw = localStorage.getItem(`quro_chat_${conversationId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Get all conversation IDs */
export function getConversationIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('quro_chat_')) {
      ids.push(key.replace('quro_chat_', ''));
    }
  }
  return ids;
}
