'use client';

import { FC, useEffect, useState } from 'react';
import { useUserWallets, getAuthToken } from '@dynamic-labs/sdk-react-core';
import { useRenderCount } from '../hooks/useRenderCount';
import { useWhyDidYouUpdate } from '../hooks/useWhyDidYouUpdate';

export const ListConnectedWallets: FC = () => {
  const userWallets = useUserWallets();
  const [unlinkingWalletId, setUnlinkingWalletId] = useState<string | null>(null);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  
  // 🔍 DEBUGGING: Track re-renders
  const renderCount = useRenderCount('ListConnectedWallets');
  
  // 🔍 DEBUGGING: Track what's causing re-renders
  useWhyDidYouUpdate('ListConnectedWallets', {
    userWallets,
    userWalletsLength: userWallets.length,
    firstWalletAddress: userWallets[0]?.address,
  });

  // Log the userWallets output
  useEffect(() => {
    console.log('useUserWallets output:', userWallets);
    console.log('Number of wallets:', userWallets.length);
    userWallets.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}:`, {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        connector: wallet.connector,
      });
    });
  }, [userWallets]);

  // Unlink wallet function
  const handleUnlinkWallet = async (walletId: string) => {
    setUnlinkingWalletId(walletId);
    setUnlinkError(null);

    // Get auth token from Dynamic
    const authToken = getAuthToken();
    const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

    if (!authToken) {
      setUnlinkError('No authentication token available');
      setUnlinkingWalletId(null);
      return;
    }

    if (!environmentId) {
      setUnlinkError('Environment ID not configured');
      setUnlinkingWalletId(null);
      return;
    }

    console.log('🔐 Using token:', authToken ? `${authToken.substring(0, 20)}...` : 'No token');
    console.log('🆔 Wallet ID:', walletId);
    console.log('🌍 Environment ID:', environmentId);

    try {
      const response = await fetch(
        `https://app.dynamic.xyz/api/v0/sdk/${environmentId}/verify/unlink`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId: walletId,
            verifiedCredentialId: walletId,
            primaryWalletId: walletId,
          }),
        }
      );

      console.log('📡 Response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (!response.ok) {
        throw new Error(`Failed to unlink (${response.status}): ${data.message || response.statusText}`);
      }

      console.log('✅ Wallet unlinked successfully:', data);
      
      // Optionally refresh the wallet list by triggering a re-render
      // The useUserWallets hook should automatically update
    } catch (error) {
      console.error('❌ Error unlinking wallet:', error);
      setUnlinkError(error instanceof Error ? error.message : 'Failed to unlink wallet');
    } finally {
      setUnlinkingWalletId(null);
    }
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Connected Wallets</h3>
        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
          Renders: {renderCount}
        </span>
      </div>
      {unlinkError && (
        <div className="mb-3 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          ❌ {unlinkError}
        </div>
      )}
      {userWallets.length === 0 ? (
        <p className="text-gray-400 text-sm">No wallets connected</p>
      ) : (
        <div className="space-y-2">
          {userWallets.map((wallet) => (
            <div key={wallet.id} className="bg-gray-800/50 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Wallet ID</p>
                  <p className="font-mono text-white text-xs break-all">
                    {wallet.id}
                  </p>
                </div>
                <button
                  onClick={() => handleUnlinkWallet(wallet.id)}
                  disabled={unlinkingWalletId === wallet.id}
                  className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                >
                  {unlinkingWalletId === wallet.id ? 'Unlinking...' : 'Unlink'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-1">Address</p>
              <p className="font-mono text-white text-sm break-all">
                {wallet.address}
              </p>
              {wallet.chain && (
                <>
                  <p className="text-xs text-gray-400 mt-2 mb-1">Chain</p>
                  <p className="text-white text-sm">{wallet.chain}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

