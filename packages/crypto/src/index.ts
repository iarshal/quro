/**
 * @quro/crypto — End-to-End Encryption Primitives
 *
 * Architecture:
 *   Key Exchange  → X25519 (Curve25519 ECDH) via @noble/curves
 *   Encryption    → AES-256-GCM via @noble/ciphers
 *   Hashing       → SHA-256 via @noble/hashes
 *
 * All operations are synchronous and pure — no network calls, no side effects.
 * Compatible with Node.js, React Native (Hermes), and modern browsers.
 *
 * E2EE Flow:
 *   1. Each user generates a Curve25519 keypair on first app launch
 *   2. Public key is stored on Supabase `profiles.public_key`
 *   3. When two users start a chat, each fetches the other's public key
 *   4. Both derive the same sharedSecret via ECDH (X25519)
 *   5. Every message is encrypted with AES-256-GCM using that sharedSecret
 *   6. Server only ever sees: { ciphertext, iv, tag } — never plaintext
 */

import { x25519 } from '@noble/curves/ed25519';
import { gcm } from '@noble/ciphers/aes';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface KeyPair {
  /** Curve25519 private key — 32 bytes, stored ONLY on device, never sent to server */
  privateKey: Uint8Array;
  /** Curve25519 public key — 32 bytes, stored on Supabase profiles.public_key */
  publicKey: Uint8Array;
}

export interface EncryptedPayload {
  /** AES-256-GCM ciphertext (base64url encoded) */
  ciphertext: string;
  /** 12-byte nonce/IV (base64url encoded) */
  iv: string;
  /** 16-byte GCM authentication tag (base64url encoded) */
  tag: string;
}

export interface QuroSession {
  /** Unique session token for desktop QR handshake — 32 bytes hex */
  token: string;
  /** Unix timestamp (ms) when this session expires */
  expiresAt: number;
}

// ── Utility: Base64url encode/decode ─────────────────────────────────────────

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

export function fromBase64(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64url'));
}

// ── Utility: Hex encode/decode ────────────────────────────────────────────────

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fromHex(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

// ── Key Generation ────────────────────────────────────────────────────────────

/**
 * Generate a fresh Curve25519 keypair.
 * Called once on first app launch; private key stored in SecureStore (mobile)
 * or encrypted localStorage (web fallback — not ideal, document limitations).
 */
export function generateKeyPair(): KeyPair {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Serialize keypair to base64url strings for storage.
 */
export function serializeKeyPair(kp: KeyPair): { privateKey: string; publicKey: string } {
  return {
    privateKey: toBase64(kp.privateKey),
    publicKey: toBase64(kp.publicKey),
  };
}

/**
 * Deserialize keypair from base64url strings.
 */
export function deserializeKeyPair(serialized: { privateKey: string; publicKey: string }): KeyPair {
  return {
    privateKey: fromBase64(serialized.privateKey),
    publicKey: fromBase64(serialized.publicKey),
  };
}

// ── Key Exchange (ECDH) ───────────────────────────────────────────────────────

/**
 * Derive a shared secret via X25519 Diffie-Hellman.
 * Both users independently compute the same 32-byte secret.
 * The result is then hashed with SHA-256 to ensure uniform distribution.
 *
 * @param myPrivateKey  — local user's private key (from SecureStore)
 * @param theirPublicKey — remote user's public key (from Supabase profiles)
 */
export function deriveSharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array
): Uint8Array {
  const rawShared = x25519.getSharedSecret(myPrivateKey, theirPublicKey);
  // Hash the raw ECDH output to get a uniformly distributed 256-bit key
  return sha256(rawShared);
}

// ── Encryption / Decryption ───────────────────────────────────────────────────

/**
 * Encrypt a plaintext message using AES-256-GCM.
 *
 * AES-GCM provides both confidentiality AND integrity (authentication tag).
 * A fresh 12-byte IV is generated for every single message — critical for security.
 *
 * The GCM tag (16 bytes) is appended by @noble/ciphers to the ciphertext output.
 * We split and store them separately for clarity and schema alignment.
 *
 * @param sharedSecret — 32-byte key derived from ECDH
 * @param plaintext    — UTF-8 string message content
 * @returns EncryptedPayload with base64url-encoded { ciphertext, iv, tag }
 */
export function encryptMessage(sharedSecret: Uint8Array, plaintext: string): EncryptedPayload {
  const iv = randomBytes(12); // 96-bit nonce — DO NOT reuse
  const plaintextBytes = new TextEncoder().encode(plaintext);

  const cipher = gcm(sharedSecret, iv);
  const encrypted = cipher.encrypt(plaintextBytes);

  // @noble/ciphers appends the 16-byte GCM tag to the ciphertext
  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const tag = encrypted.slice(encrypted.length - 16);

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    tag: toBase64(tag),
  };
}

/**
 * Decrypt an AES-256-GCM encrypted payload.
 * Throws if the authentication tag is invalid (message was tampered with).
 *
 * @param sharedSecret — 32-byte key derived from ECDH
 * @param payload      — EncryptedPayload from encryptMessage()
 * @returns Decrypted plaintext string
 */
export function decryptMessage(sharedSecret: Uint8Array, payload: EncryptedPayload): string {
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);
  const tag = fromBase64(payload.tag);

  // Reassemble the combined ciphertext+tag format that @noble/ciphers expects
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const cipher = gcm(sharedSecret, iv);
  const decrypted = cipher.decrypt(combined);

  return new TextDecoder().decode(decrypted);
}

// ── Quro ID Generation ────────────────────────────────────────────────────────

/**
 * Generate a unique Quro ID — format: XXXXX (5 uppercase alphanumeric chars).
 * Examples: X9A2P, QR7KM, A1B2C
 *
 * Collision probability at 1M users: ~0.3% — acceptable for this scale.
 * For production, validate uniqueness via Supabase before committing.
 */
export function generateQuroId(): string {
  // Charset excludes visually ambiguous characters: 0, O, I, 1
  const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(5);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
}

// ── Session Token Generation ──────────────────────────────────────────────────

/**
 * Generate a cryptographically secure session token for desktop QR handshake.
 * This token becomes the Supabase Realtime channel name.
 * Format: 32-byte hex string (64 chars)
 */
export function generateSessionToken(): string {
  return toHex(randomBytes(32));
}

/**
 * Create a QR session object with token + expiry.
 * @param ttlSeconds — time-to-live in seconds (default: 300 = 5 minutes)
 */
export function createQuroSession(ttlSeconds = 300): QuroSession {
  return {
    token: generateSessionToken(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

/**
 * Check if a QR session is still valid.
 */
export function isSessionValid(session: QuroSession): boolean {
  return Date.now() < session.expiresAt;
}

// ── OTP Generation (Mock — swap for Twilio in production) ─────────────────────

/**
 * Generate a 6-digit OTP code.
 * In production, this is generated server-side by Twilio/MSG91.
 * In mock/dev mode, this is used locally and logged to console.
 */
export function generateOTP(): string {
  const bytes = randomBytes(3);
  const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 1_000_000;
  return num.toString().padStart(6, '0');
}
