import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: {
    default: 'Quro — Face-First Secure Messaging',
    template: '%s | Quro',
  },
  description:
    'Quro is a face-authenticated, device-local messaging platform. No passwords, no phone numbers — just your face. All data stays on your device.',
  keywords: ['face auth', 'qr messaging', 'secure chat', 'quro', 'wechat alternative', 'face verification'],
  authors: [{ name: 'Quro' }],
  creator: 'Quro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quro.app',
    title: 'Quro — Face-First Secure Messaging',
    description: 'Login with your face. Chat locally. No cloud, no passwords.',
    siteName: 'Quro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quro — Face-First Secure Messaging',
    description: 'Login with your face. Chat locally. No cloud, no passwords.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07C160',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
