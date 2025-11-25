import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to reduce WalletConnect re-initialization warnings
  // See WALLETCONNECT_ISSUE.md for details
  reactStrictMode: false,
  
  webpack: (config, { isServer }) => {
    // Handle MetaMask SDK dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Ignore specific modules that cause warnings
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    // Suppress specific warnings
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@react-native-async-storage\/async-storage'/,
      /Module not found: Can't resolve 'pino-pretty'/,
    ];

    return config;
  },
  
  // Experimental features for better compatibility
  experimental: {
    esmExternals: 'loose',
  },
  
  // Transpile packages that might cause issues
  transpilePackages: [
    '@dynamic-labs/sdk-react-core',
    '@dynamic-labs/ethereum',
    '@dynamic-labs/wagmi-connector',
  ],

  // Content Security Policy for Dynamic embedded wallets
  async headers() {
    return [
      {
        // Apply CSP to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
          }
        ]
      }
    ];
  },
};

export default nextConfig;
