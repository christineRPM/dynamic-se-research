'use client';

import { FC } from 'react';

interface PackageVersion {
  name: string;
  version: string;
  description?: string;
}

const DYNAMIC_PACKAGES: PackageVersion[] = [
  { name: '@dynamic-labs/bitcoin', version: '4.47.1', description: 'Bitcoin wallet connector' },
  { name: '@dynamic-labs/cosmos', version: '4.47.1', description: 'Cosmos wallet connector' },
  { name: '@dynamic-labs/ethereum', version: '4.47.1', description: 'Ethereum (EVM) wallet connector' },
  { name: '@dynamic-labs/ethereum-aa', version: '4.47.1', description: 'Ethereum Account Abstraction support' },
  { name: '@dynamic-labs/iconic', version: '4.47.1', description: 'Icon components for UI' },
  { name: '@dynamic-labs/sdk-api', version: '0.0.815', description: 'Dynamic SDK API client' },
  { name: '@dynamic-labs/sdk-react-core', version: '4.47.1', description: 'Core React SDK package' },
  { name: '@dynamic-labs/solana', version: '4.47.1', description: 'Solana wallet connector' },
  { name: '@dynamic-labs/sui', version: '4.47.1', description: 'Sui wallet connector' },
  { name: '@dynamic-labs/types', version: '4.47.1', description: 'TypeScript type definitions' },
  { name: '@dynamic-labs/wagmi-connector', version: '4.47.1', description: 'Wagmi integration connector' },
  { name: '@dynamic-labs/zerodev-extension', version: '4.47.1', description: 'ZeroDev account abstraction extension' },
];

export const DynamicVersions: FC = () => {
  // Group packages by major version
  const corePackages = DYNAMIC_PACKAGES.filter(pkg => pkg.version.startsWith('4.'));
  const apiPackage = DYNAMIC_PACKAGES.find(pkg => pkg.name === '@dynamic-labs/sdk-api');

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">📦 Dynamic SDK Versions</h3>

      <div className="space-y-4">
        <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded">
          <p className="text-xs text-blue-200 mb-1">
            💡 <strong>SDK Version Information</strong>
          </p>
          <p className="text-xs text-blue-300">
            All Dynamic SDK packages and their installed versions
          </p>
        </div>

        {/* Core SDK Packages (v4.x.x) */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Core SDK Packages (v4.47.1)</h4>
          <div className="space-y-2">
            {corePackages.map((pkg) => (
              <div
                key={pkg.name}
                className="bg-gray-800/50 rounded p-3 border border-gray-700/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-white break-all">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-xs text-gray-400 mt-1">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-semibold rounded border border-green-600/50">
                      {pkg.version}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Package (different version) */}
        {apiPackage && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">API Package</h4>
            <div className="bg-gray-800/50 rounded p-3 border border-gray-700/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white break-all">{apiPackage.name}</p>
                  {apiPackage.description && (
                    <p className="text-xs text-gray-400 mt-1">{apiPackage.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-semibold rounded border border-yellow-600/50">
                    {apiPackage.version}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-3 bg-gray-900/50 border border-gray-600/50 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Packages</p>
              <p className="text-lg font-semibold text-white">{DYNAMIC_PACKAGES.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Core SDK Version</p>
              <p className="text-lg font-semibold text-green-400">4.47.1</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">API Version</p>
              <p className="text-lg font-semibold text-yellow-400">0.0.815</p>
            </div>
          </div>
        </div>

        {/* Update Info */}
        <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded">
          <p className="text-xs text-purple-200 mb-2">
            🔄 <strong>Latest Available:</strong> Check npm for updates
          </p>
          <p className="text-xs text-purple-300">
            Run <code className="bg-purple-950 px-1 rounded">npm view @dynamic-labs/sdk-react-core version</code> to check for the latest version
          </p>
        </div>
      </div>
    </div>
  );
};


