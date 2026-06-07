/**
 * Phone Authentication Utility
 * Wraps Firebase Phone Auth for easy use across the app.
 */

import { auth, RecaptchaVerifier, signInWithPhoneNumber } from './firebase';
import type { ConfirmationResult } from './firebase';

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

function resetRecaptchaContainer(containerId: string) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

function mapPhoneAuthError(error: any): string {
  switch (error?.code) {
    case 'auth/billing-not-enabled':
      return 'Firebase blocked real SMS for this project. On localhost, use a Firebase test phone number from Authentication -> Sign-in method -> Phone -> Phone numbers for testing, or enable billing for real SMS.';
    case 'auth/invalid-phone-number':
      return 'Enter a valid phone number with country code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a bit before requesting another code.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    default:
      return error?.message || 'Failed to send verification code';
  }
}

/**
 * Initialize invisible reCAPTCHA in a dedicated container.
 * Must be called before sendOTP.
 */
export function setupRecaptcha(containerId: string): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  resetRecaptchaContainer(containerId);

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — will proceed with sendOTP
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired, re-initializing...');
    },
  });
}

/**
 * Send OTP to the given phone number.
 * Phone must include country code (e.g., "+919876543210")
 */
export async function sendPhoneOTP(phoneNumber: string): Promise<boolean> {
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized. Call setupRecaptcha first.');
  }

  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return true;
  } catch (error: any) {
    console.error('Failed to send OTP:', error);
    // Reset recaptcha on failure
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
    throw new Error(mapPhoneAuthError(error));
  }
}

/**
 * Verify the OTP code entered by the user.
 * Returns the Firebase user credential on success.
 */
export async function verifyPhoneOTP(code: string): Promise<{ verified: boolean; uid?: string; phone?: string }> {
  if (!confirmationResult) {
    throw new Error('No OTP was sent. Please request a new code.');
  }

  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    return {
      verified: true,
      uid: user.uid,
      phone: user.phoneNumber || undefined,
    };
  } catch (error: any) {
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid code');
    }
    if (error.code === 'auth/code-expired') {
      throw new Error('Code expired. Please request a new one');
    }
    throw new Error(error.message || 'Verification failed');
  }
}

/**
 * Cleanup recaptcha on unmount
 */
export function cleanupRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  resetRecaptchaContainer('firebase-recaptcha-container');
  resetRecaptchaContainer('firebase-recaptcha-retrieve-container');
  confirmationResult = null;
}
