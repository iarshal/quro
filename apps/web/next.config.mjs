const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [],
    unoptimized: true,
  },
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Fix face-api.js node module resolution warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
        'node-fetch': false,
      };
    }
    return config;
  },
};

export default nextConfig;
