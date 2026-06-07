/**
 * api.ts — Centralized API client for the FastAPI backend
 *
 * All HTTP calls to the Python server go through here.
 * Automatically attaches Authorization bearer tokens.
 */

// Force IPv4 loopback to prevent macOS IPv6 local fetch drops
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:8000';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('quro_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session.token || null;
  } catch {
    return null;
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error("Server unreachable. Please try again in a moment.");
    }
    throw err;
  }

  if (!res.ok) {
    if (res.status === 401 && path === '/api/user/profile') {
      window.localStorage.removeItem('quro_session');
      throw new Error('401');
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API error ${res.status}`);
  }

  return res.json();
}

// ─── Auth ───────────────────────────────────────────

export interface RegisterPayload {
  face_image: string; // base64
  liveness_proof: LivenessProofPayload;
  display_name: string;
  email?: string;
  phone?: string;
  password: string;
  gender: string;
  birthday: string;
}

export interface LoginFacePayload {
  face_image: string; // base64
  liveness_proof: LivenessProofPayload;
}

export interface LivenessProofPayload {
  completed: true;
  challenges: string[];
  durationMs: number;
  createdAt: string;
}

export interface LoginPhonePasswordPayload {
  phone: string;
  password: string;
}

export interface LoginGooglePayload {
  access_token: string;
}

export interface AuthResponse {
  quro_id: string;
  session_token: string;
  display_name: string;
  avatar_url?: string;
}

export function registerUser(data: RegisterPayload) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginWithFace(data: LoginFacePayload) {
  return request<AuthResponse & { matched: boolean; distance?: number }>('/api/auth/login/face', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginWithPhonePassword(data: LoginPhonePasswordPayload) {
  return request<AuthResponse>('/api/auth/login/password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginWithGoogle(data: LoginGooglePayload) {
  return request<AuthResponse>('/api/auth/login/google', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function confirmQrLogin(qrSessionToken: string) {
  return request<{ authenticated: boolean }>('/api/auth/login/qr', {
    method: 'POST',
    body: JSON.stringify({ qr_session_token: qrSessionToken }),
  });
}

// ─── OTP Verification ───────────────────────────────

export function sendOTP(email: string, purpose: string = 'Registration') {
  return request<{ success: boolean; message: string }>('/api/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
  });
}

export function verifyOTP(email: string, code: string) {
  return request<{ success?: boolean; verified: boolean; session_token?: string; quro_id?: string; display_name?: string; avatar_url?: string }>('/api/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

// ─── User ───────────────────────────────────────────

export function getUserProfile() {
  return request<any>('/api/user/profile');
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  avatar_url?: string;
}

export function updateUserProfile(data: UpdateProfilePayload) {
  return request<any>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function updateUserPassword(password: string) {
  return request<{ updated: boolean }>('/api/user/password', {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}

export function deleteAccount() {
  return request<{ deleted: boolean }>('/api/user/delete', {
    method: 'DELETE',
  });
}

// ─── Chat ───────────────────────────────────────────

export function sendChatMessage(conversationId: string, content: string, contentType = 'text', mediaUrl?: string) {
  return request('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ conversation_id: conversationId, content, content_type: contentType, media_url: mediaUrl }),
  });
}

export function getChatMessages(conversationId: string) {
  return request<any[]>(`/api/chat/messages/${conversationId}`);
}

// ─── Status ─────────────────────────────────────────

export function postStatus(text: string, imageUrl?: string) {
  return request('/api/status/post', {
    method: 'POST',
    body: JSON.stringify({ text, image_url: imageUrl }),
  });
}

export function getStatusFeed() {
  return request<any[]>('/api/status/feed');
}
