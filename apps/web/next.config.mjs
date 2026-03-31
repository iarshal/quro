/**
 * Quro Web App — Next.js Configuration
 * Turbopack enabled, workspace packages transpiled
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@quro/crypto', '@quro/db', '@quro/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Needed for @noble/ciphers in the browser bundle
  serverExternalPackages: [],
};

export default nextConfig;
