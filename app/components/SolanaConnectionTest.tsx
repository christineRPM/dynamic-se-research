'use client';

import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';

export function SolanaConnectionTest() {
  const { primaryWallet, user } = useDynamicContext();
  const [connectionStatus, setConnectionStatus] = useState<string>('Not checked');
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    setConnectionStatus('Checking...');

    try {
      if (!primaryWallet) {
        setConnectionStatus('❌ No primary wallet found');
        return;
      }

      // Check if it's a Solana wallet
      const isSolana = isSolanaWallet(primaryWallet);
      
      // IMPORTANT: isConnected() is now an async METHOD, not a property!
      // This was changed in Dynamic SDK v3.0.0-alpha.16
      const connected = await primaryWallet.isConnected();
      
      // Get wallet details
      const address = primaryWallet.address;
      const chain = primaryWallet.chain;
      const connectorName = primaryWallet.connector?.name;

      setConnectionStatus(`
✅ Wallet Details:
- Address: ${address}
- Chain: ${chain}
- Connector: ${connectorName}
- Is Solana: ${isSolana}
- isConnected(): ${connected}
      `.trim());
    } catch (error) {
      setConnectionStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsChecking(false);
    }
  };

  const checkAllWallets = async () => {
    setIsChecking(true);
    setConnectionStatus('Checking all wallets...');

    try {
      if (!user?.verifiedCredentials) {
        setConnectionStatus('❌ No verified credentials found');
        return;
      }

      // Check all wallets from user's verified credentials
      const results: string[] = [];
      
      for (const cred of user.verifiedCredentials) {
        if (cred.walletName) {
          results.push(`
Wallet: ${cred.walletName}
- Address: ${cred.address}
- Chain: ${cred.chain}
- Format: ${cred.format}
          `.trim());
        }
      }

      if (results.length === 0) {
        setConnectionStatus('❌ No wallets found in verified credentials');
      } else {
        setConnectionStatus(`Found ${results.length} wallet(s):\n\n${results.join('\n\n')}`);
      }
    } catch (error) {
      setConnectionStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">
        🔍 Solana Connection Test
      </h3>
      
      <p className="text-xs text-gray-400 mb-4">
        Tests wallet.isConnected() - Note: This is now an async METHOD (not a property) since SDK v3+
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check Primary Wallet'}
        </button>
        
        <button
          onClick={checkAllWallets}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check All Wallets'}
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Connection Status:</p>
        <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
          {connectionStatus}
        </pre>
      </div>

      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
        <p className="text-xs text-yellow-400">
          <strong>⚠️ Breaking Change in SDK v3+:</strong><br/>
          <code>wallet.isConnected</code> (property) → <code>await wallet.isConnected()</code> (async method)
        </p>
      </div>
    </div>
  );
}

