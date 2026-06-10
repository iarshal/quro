/**
 * Firebase Configuration
 * Used for Phone Authentication (OTP verification)
 * 
 * Setup Instructions:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Go to Project Settings → General → Your Apps → Add Web App
 * 4. Copy the firebaseConfig values below
 * 5. Go to Authentication → Sign-in method → Enable "Phone"
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if we have an API key configured
let app;
let auth: any = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'dummy') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);

    // On localhost, allow Firebase test phone numbers without forcing a real SMS flow.
    if (typeof window !== 'undefined') {
      const isLocalHost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocalHost) {
        auth.settings.appVerificationDisabledForTesting = true;
      }
    }
  } catch (err) {
    console.error('Firebase init error', err);
  }
}

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
