/**
 * faceStore.ts — IndexedDB wrapper for local face data storage
 * 
 * All face descriptors and profile data stored ONLY on the user's device.
 * No cloud, no server, no external calls.
 * 
 * Uses STRICT face matching with multi-descriptor averaging for accuracy.
 */

const DB_NAME = 'QuroFaceAuth';
const DB_VERSION = 1;
const STORE_NAME = 'faceData';
const PROFILE_KEY = 'userProfile';

export interface QuroProfile {
  displayName: string;
  gender: 'male' | 'female' | 'transgender' | 'other';
  birthday: string; // YYYY-MM-DD
  quroId: string;
  faceDescriptor: number[]; // Serialized 128-dim array
  faceDescriptors?: number[][]; // Serialized raw descriptors
  registeredAt: string; // ISO timestamp
  avatarDataUrl?: string; // Base64 snapshot from camera
}

export interface FaceMatchResult {
  accepted: boolean;
  bestDistance: number;
  averageDistance: number;
  matchedSamples: number;
  requiredMatches: number;
  sampleCount: number;
}

/** Serialize Float32Array to regular array */
export function serializeDescriptor(d: Float32Array | number[]): number[] {
  return Array.from(d);
}

/** Deserialize array back to Float32Array for face-api if needed */
export function deserializeDescriptor(d: number[]): Float32Array {
  return new Float32Array(d);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save face data + profile to IndexedDB */
export async function saveFaceData(profile: QuroProfile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(profile, PROFILE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get stored face data + profile */
export async function getFaceData(): Promise<QuroProfile | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(PROFILE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/** Check if user has already registered and verify Master Face Lockdown */
export async function hasRegistered(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const masterLock = localStorage.getItem('quro_master_face');
    if (masterLock) return true;
  }
  const data = await getFaceData();
  return data !== null;
}

/** Delete all face data */
export async function deleteFaceData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(PROFILE_KEY);
    tx.oncomplete = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('quro_master_face');
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Compare two face descriptors using Euclidean distance.
 * Lower distance = more similar faces.
 * Typical same-person distance: 0.2-0.35
 * Typical different-person distance: 0.5-1.0+
 */
export function compareFaces(stored: number[], current: number[]): number {
  if (stored.length !== current.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < stored.length; i++) {
    const diff = stored[i] - current[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Compare against multiple stored descriptors for better accuracy.
 * Returns the MINIMUM distance (best match) across all stored descriptors.
 */
export function compareFacesMulti(storedDescriptors: number[][], current: number[]): number {
  if (!storedDescriptors || storedDescriptors.length === 0) return Infinity;
  let minDist = Infinity;
  for (const stored of storedDescriptors) {
    const dist = compareFaces(stored, current);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/**
 * Average multiple descriptors for a more stable reference.
 * This reduces noise from individual captures.
 */
export function averageDescriptors(descriptors: number[][]): number[] {
  if (descriptors.length === 0) return [];
  const len = descriptors[0].length;
  const avg = new Array(len).fill(0);
  for (const d of descriptors) {
    for (let i = 0; i < len; i++) avg[i] += d[i];
  }
  for (let i = 0; i < len; i++) avg[i] /= descriptors.length;
  return avg;
}

/**
 * Primary threshold for an individual face descriptor sample.
 * Lower is stricter. 0.44-0.46 is a practical range for this device-local flow.
 */
export const FACE_MATCH_THRESHOLD = 0.45;

/**
 * Average descriptor threshold.
 * This is slightly more forgiving than the per-sample threshold because
 * averaging smooths noise but can still drift with lighting or pose changes.
 */
export const FACE_AVERAGE_MATCH_THRESHOLD = 0.5;

/**
 * Evaluate a face login using both the stored profile average descriptor and
 * multiple current samples. A login is accepted only when:
 * 1. the best current sample is within the strict threshold,
 * 2. the averaged current face is close to the stored average descriptor,
 * 3. enough current samples independently match the stored face.
 */
export function evaluateFaceMatch(
  profile: Pick<QuroProfile, 'faceDescriptor' | 'faceDescriptors'>,
  currentDescriptor: number[],
  currentDescriptors?: number[][]
): FaceMatchResult {
  const storedDescriptors =
    profile.faceDescriptors && profile.faceDescriptors.length > 0
      ? profile.faceDescriptors
      : [profile.faceDescriptor];

  const samples =
    currentDescriptors && currentDescriptors.length > 0
      ? currentDescriptors
      : [currentDescriptor];

  const bestDistance = compareFacesMulti(storedDescriptors, currentDescriptor);
  const averageCurrentDescriptor = averageDescriptors(samples);
  const averageDistance = compareFaces(profile.faceDescriptor, averageCurrentDescriptor);
  const matchedSamples = samples.filter(
    (sample) => compareFacesMulti(storedDescriptors, sample) <= FACE_MATCH_THRESHOLD
  ).length;
  const requiredMatches = samples.length >= 3 ? 2 : 1;

  return {
    accepted:
      bestDistance <= FACE_MATCH_THRESHOLD &&
      averageDistance <= FACE_AVERAGE_MATCH_THRESHOLD &&
      matchedSamples >= requiredMatches,
    bestDistance,
    averageDistance,
    matchedSamples,
    requiredMatches,
    sampleCount: samples.length,
  };
}

/** Generate a random Quro ID */
export function generateQuroId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
