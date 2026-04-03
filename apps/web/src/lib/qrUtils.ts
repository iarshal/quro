/**
 * qrUtils.ts — QR code utilities
 * 
 * Generates personal QR codes and parses scanned QR data.
 */

import QRCode from 'qrcode';

export type QRType = 'quro_session' | 'quro_friend' | 'external_url' | 'unknown';

export interface ParsedQR {
  type: QRType;
  data: string;
  /** For quro_session: the session token */
  sessionToken?: string;
  /** For quro_friend: the Quro ID */
  quroId?: string;
  /** For external_url: the URL */
  url?: string;
}

/** Parse the raw QR code data and determine its type */
export function parseQRData(raw: string): ParsedQR {
  if (raw.startsWith('quro://session/')) {
    return {
      type: 'quro_session',
      data: raw,
      sessionToken: raw.replace('quro://session/', ''),
    };
  }
  if (raw.startsWith('quro://friend/')) {
    return {
      type: 'quro_friend',
      data: raw,
      quroId: raw.replace('quro://friend/', ''),
    };
  }
  try {
    const url = new URL(raw);
    return { type: 'external_url', data: raw, url: raw };
  } catch {
    // Not a URL
  }
  return { type: 'unknown', data: raw };
}

/** Generate a personal QR code data URL for a user */
export async function generatePersonalQR(quroId: string): Promise<string> {
  return QRCode.toDataURL(`quro://friend/${quroId}`, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 280,
    color: { dark: '#111111', light: '#FFFFFF' },
  });
}

/** Generate a desktop session QR code */
export async function generateSessionQR(sessionToken: string): Promise<string> {
  return QRCode.toDataURL(`quro://session/${sessionToken}`, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: { dark: '#111111', light: '#FFFFFF' },
  });
}
