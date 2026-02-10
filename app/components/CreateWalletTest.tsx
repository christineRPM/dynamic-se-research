'use client';

import { FC, useState } from 'react';
import { useDynamicWaas } from '@dynamic-labs/sdk-react-core';
import { ChainEnum } from '@dynamic-labs/sdk-api-core';

const NO_ENABLED_CHAINS_ERROR = 'NO_ENABLED_CHAINS_ERROR';
const DYNAMIC_WAAS_CONNECTOR_NOT_FOUND_ERROR = 'DYNAMIC_WAAS_CONNECTOR_NOT_FOUND_ERROR';
const INVALID_CHAINS_ERROR = 'INVALID_CHAINS_ERROR';

function isSettledResult(
  item: unknown
): item is { status: string; value?: unknown; reason?: unknown } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'status' in item &&
    (item as { status: string }).status in { fulfilled: 1, rejected: 1 }
  );
}

export const CreateWalletTest: FC = () => {
  const {
    createWalletAccount,
    dynamicWaasIsEnabled,
    getWaasWallets,
  } = useDynamicWaas();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const waasWallets = getWaasWallets();

  const runCreate = async (chainNames?: ChainEnum[]) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = chainNames
        ? await createWalletAccount(chainNames)
        : await (createWalletAccount as (chains?: ChainEnum[]) => Promise<unknown>)();
      setResult(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (message.includes(NO_ENABLED_CHAINS_ERROR)) {
        setError('No chains enabled in project settings. Enable at least one chain in the Dynamic dashboard.');
      } else if (
        message.includes(DYNAMIC_WAAS_CONNECTOR_NOT_FOUND_ERROR) ||
        message.includes('No wallet connector found')
      ) {
        setError(
          'WaaS connector missing for chain. Check Ethereum/Solana connectors and embedded wallet (v3) settings in the Dynamic dashboard.'
        );
      } else if (message.includes(INVALID_CHAINS_ERROR)) {
        setError(`Invalid chain(s): ${message}. Only enabled chains (e.g. Evm, Sol) are allowed.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Create Wallet (useDynamicWaas)</h3>

      <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded mb-4">
        <p className="text-xs text-blue-200 mb-2">
          Client-side <code className="bg-blue-950 px-1 rounded">createWalletAccount()</code> for the logged-in user.
          Uses <code className="bg-blue-950 px-1 rounded">ChainEnum.Evm</code>,{' '}
          <code className="bg-blue-950 px-1 rounded">ChainEnum.Sol</code>, and{' '}
          <code className="bg-blue-950 px-1 rounded">ChainEnum.Ton</code> (legacy <code className="bg-blue-950 px-1 rounded">ChainEnum.Eth</code> excluded).
        </p>
      </div>

      {/* State for troubleshooting */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">dynamicWaasIsEnabled:</span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              dynamicWaasIsEnabled ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}
          >
            {String(dynamicWaasIsEnabled)}
          </span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-1">Current WaaS wallets (getWaasWallets()):</span>
          {waasWallets.length === 0 ? (
            <p className="text-xs text-gray-500">None</p>
          ) : (
            <ul className="text-xs text-white space-y-1">
              {waasWallets.map((w, i) => (
                <li key={i} className="font-mono break-all">
                  {w.chain}: {w.address ?? '—'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => runCreate()}
          disabled={loading || !dynamicWaasIsEnabled}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'Create (all enabled chains)'}
        </button>
        <button
          onClick={() => runCreate([ChainEnum.Evm])}
          disabled={loading || !dynamicWaasIsEnabled}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'EVM only'}
        </button>
        <button
          onClick={() => runCreate([ChainEnum.Sol])}
          disabled={loading || !dynamicWaasIsEnabled}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'Solana only'}
        </button>
        <button
          onClick={() => runCreate([ChainEnum.Evm, ChainEnum.Sol])}
          disabled={loading || !dynamicWaasIsEnabled}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'EVM + Solana'}
        </button>
        <button
          onClick={() => runCreate([ChainEnum.Ton])}
          disabled={loading || !dynamicWaasIsEnabled}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'TON only'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600/50 rounded">
          <p className="text-sm font-semibold text-red-200 mb-1">Error</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {result !== null && (
        <div className="p-3 bg-gray-800/50 border border-gray-600/50 rounded">
          <p className="text-xs text-gray-400 mb-2">Result</p>
          {Array.isArray(result) ? (
            <div className="space-y-2">
              {result.map((item, i) => {
                if (isSettledResult(item)) {
                  return (
                    <div key={i} className="text-xs">
                      <span className="text-gray-400">[{i}] </span>
                      <span className={item.status === 'fulfilled' ? 'text-green-400' : 'text-red-400'}>
                        {item.status}
                      </span>
                      {item.status === 'fulfilled' && item.value !== undefined && (
                        <pre className="mt-1 p-2 bg-gray-950 rounded overflow-x-auto text-white">
                          {JSON.stringify(item.value, null, 2)}
                        </pre>
                      )}
                      {item.status === 'rejected' && item.reason !== undefined && (
                        <pre className="mt-1 p-2 bg-red-950/50 rounded overflow-x-auto text-red-200">
                          {typeof item.reason === 'object' ? JSON.stringify(item.reason, null, 2) : String(item.reason)}
                        </pre>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={i} className="text-xs">
                    <span className="text-gray-400">[{i}] </span>
                    <pre className="mt-1 p-2 bg-gray-950 rounded overflow-x-auto text-white">
                      {item === undefined ? 'undefined' : JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          ) : (
            <pre className="text-xs p-2 bg-gray-950 rounded overflow-x-auto text-white">
              {result === undefined ? 'undefined' : JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
