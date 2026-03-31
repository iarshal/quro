import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: {
    default: 'Quro — Secure QR Messaging',
    template: '%s | Quro',
  },
  description:
    'Quro is a hyper-secure, QR-first messaging platform with End-to-End Encryption. Log in to any device instantly by scanning a QR code — no passwords, ever.',
  keywords: ['qr messaging', 'e2ee', 'secure chat', 'quro', 'encrypted messaging'],
  authors: [{ name: 'Quro' }],
  creator: 'Quro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quro.app',
    title: 'Quro — Secure QR Messaging',
    description: 'Log into any device by scanning a QR code. End-to-End Encrypted.',
    siteName: 'Quro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quro — Secure QR Messaging',
    description: 'Log into any device by scanning a QR code. End-to-End Encrypted.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FFA488',
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
