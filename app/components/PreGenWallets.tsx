'use client';

import { FC, useState } from 'react';

interface RequestResult {
  id: number;
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  data?: unknown;
  error?: string;
  timestamp: Date;
}

export const PreGenWallets: FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [type, setType] = useState<'email' | 'phone' | 'username'>('email');
  const [chains, setChains] = useState<string[]>(['EVM']);
  const [loading, setLoading] = useState(false);
  const [concurrentRequests, setConcurrentRequests] = useState<RequestResult[]>([]);
  const [requestCounter, setRequestCounter] = useState(0);

  const createWalletRequest = async (requestId: number): Promise<void> => {
    // Add pending request
    setConcurrentRequests(prev => [...prev, {
      id: requestId,
      status: 'pending',
      timestamp: new Date(),
    }]);

    try {
      const response = await fetch('/api/create-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          type,
          chains,
        }),
      });

      const data = await response.json();

      // Update request with result
      setConcurrentRequests(prev => prev.map(req => 
        req.id === requestId 
          ? {
              id: requestId,
              status: response.ok ? 'success' : 'error',
              statusCode: response.status,
              data: response.ok ? data : undefined,
              error: response.ok ? undefined : (data.error || data.message || `HTTP ${response.status}`),
              timestamp: req.timestamp,
            }
          : req
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      setConcurrentRequests(prev => prev.map(req => 
        req.id === requestId 
          ? {
              id: requestId,
              status: 'error',
              error: errorMessage,
              timestamp: req.timestamp,
            }
          : req
      ));
    }
  };

  const handleCreateWallet = async () => {
    if (!identifier.trim()) {
      return;
    }

    setLoading(true);
    const newRequestId = requestCounter + 1;
    setRequestCounter(newRequestId);
    
    await createWalletRequest(newRequestId);
    setLoading(false);
  };

  const handleCreateTwoSimultaneous = async () => {
    if (!identifier.trim()) {
      return;
    }

    setLoading(true);
    const requestId1 = requestCounter + 1;
    const requestId2 = requestCounter + 2;
    setRequestCounter(requestCounter + 2);

    // Fire both requests simultaneously (don't await)
    Promise.all([
      createWalletRequest(requestId1),
      createWalletRequest(requestId2),
    ]).finally(() => {
      setLoading(false);
    });
  };

  const toggleChain = (chain: string) => {
    setChains(prev => 
      prev.includes(chain) 
        ? prev.filter(c => c !== chain)
        : [...prev, chain]
    );
  };

  const handleClearForm = () => {
    setIdentifier('');
    setConcurrentRequests([]);
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">🔐 Pre-Generated Wallets</h3>

      <div className="space-y-4">
        <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded">
          <p className="text-xs text-blue-200 mb-2">
            💡 <strong>Create wallets programmatically</strong> using Dynamic&apos;s WaaS API.
          </p>
          <p className="text-xs text-yellow-200">
            ⚠️ <strong>Note:</strong> This creates wallets server-side using your API key. The wallet will be associated with the provided identifier.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Identifier</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={type === 'email' ? 'user@example.com' : type === 'phone' ? '+1234567890' : 'username'}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the {type} identifier for the wallet owner
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'email' | 'phone' | 'username')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="username">Username</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Chains</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['EVM'].map((chain) => (
                <button
                  key={chain}
                  type="button"
                  onClick={() => toggleChain(chain)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    chains.includes(chain)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {chains.includes(chain) ? '✓' : ''} {chain}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {chains.length > 0 ? chains.join(', ') : 'None'}
            </p>
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Only EVM chains are supported. SOL and COSMOS connectors are not configured.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleCreateWallet}
                disabled={loading || !identifier.trim() || chains.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
              >
                {loading ? '⏳ Creating...' : '🚀 Create Wallet'}
              </button>
              <button
                onClick={handleCreateTwoSimultaneous}
                disabled={loading || !identifier.trim() || chains.length === 0}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
              >
                {loading ? '⏳ Creating...' : '⚡ Create 2 Simultaneously'}
              </button>
            </div>
            {concurrentRequests.length > 0 && (
              <button
                onClick={handleClearForm}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                Clear Results
              </button>
            )}
          </div>
        </div>

        {/* Concurrent Requests Results */}
        {concurrentRequests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">📊 Request Results</h4>
            {concurrentRequests.map((request) => (
              <div
                key={request.id}
                className={`p-4 rounded-lg border ${
                  request.status === 'pending'
                    ? 'bg-yellow-900/30 border-yellow-600/50'
                    : request.status === 'success'
                    ? 'bg-green-900/30 border-green-600/50'
                    : 'bg-red-900/30 border-red-600/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Request #{request.id}</span>
                    {request.statusCode && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.statusCode === 200 || request.statusCode === 201
                          ? 'bg-green-700 text-green-100'
                          : request.statusCode === 409
                          ? 'bg-orange-700 text-orange-100'
                          : 'bg-red-700 text-red-100'
                      }`}>
                        HTTP {request.statusCode}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {request.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {request.status === 'pending' && (
                  <p className="text-yellow-200 text-sm">⏳ Pending...</p>
                )}

                {request.status === 'success' && request.data && (
                  <div className="space-y-2">
                    <p className="text-green-200 text-sm font-semibold">✅ Success</p>
                    {request.data.walletId && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Wallet ID</p>
                        <p className="font-mono text-white text-xs break-all bg-gray-800/50 p-2 rounded">
                          {request.data.walletId}
                        </p>
                      </div>
                    )}
                    {request.data.address && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Address</p>
                        <p className="font-mono text-white text-xs break-all bg-gray-800/50 p-2 rounded">
                          {request.data.address}
                        </p>
                      </div>
                    )}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        📋 Full Response
                      </summary>
                      <pre className="text-xs text-white overflow-x-auto mt-2 p-2 bg-gray-950 rounded">
                        {JSON.stringify(request.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {request.status === 'error' && (
                  <div>
                    <p className="text-red-200 text-sm font-semibold mb-1">❌ Error</p>
                    <p className="text-red-300 text-sm">{request.error}</p>
                    {request.statusCode === 409 && (
                      <div className="mt-2 p-2 bg-orange-900/50 border border-orange-700 rounded">
                        <p className="text-xs text-orange-200">
                          ⚠️ <strong>409 Conflict:</strong> This typically means a wallet already exists for this identifier.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

