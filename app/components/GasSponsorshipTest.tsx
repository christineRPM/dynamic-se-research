'use client';

import { FC, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isZeroDevConnector } from '@dynamic-labs/ethereum-aa';
import { parseEther, zeroAddress } from 'viem';

export const GasSponsorshipTest: FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [amount, setAmount] = useState('0.00000000002');
  const [recipient, setRecipient] = useState('0xa9388317A1232476E9Ff7782Dd156FB73E1c4ADD');

  const sendSponsoredTransaction = async () => {
    if (!primaryWallet) {
      setResult('❌ No wallet connected');
      return;
    }

    setLoading(true);
    setResult('🔄 Preparing sponsored transaction...');

    try {
      const connector = primaryWallet.connector;

      if (!connector) {
        throw new Error('No connector found');
      }

      // Check if this is a ZeroDev connector
      if (!isZeroDevConnector(connector)) {
        setResult('❌ This wallet does not support gas sponsorship. Please use an embedded wallet.');
        setLoading(false);
        return;
      }

      setResult('🔄 Ensuring kernel client is loaded...');

      // Ensure the kernel client is loaded by calling getNetwork()
      await connector.getNetwork();

      setResult('🔄 Getting kernel client with sponsorship...');

      // Get the kernel client with sponsorship enabled
      const kernelClient = connector.getAccountAbstractionProvider({
        withSponsorship: true,
      });

      if (!kernelClient) {
        throw new Error('Failed to get kernel client');
      }

      setResult('🔄 Encoding transaction...');

      // Send a simple transaction (sending ETH to address)
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls([
          {
            to: recipient as `0x${string}`,
            value: parseEther(amount),
            data: '0x' as `0x${string}`,
          },
        ]),
      });

      setResult(`✅ Transaction sent!\n\n📝 User Operation Hash:\n${userOpHash}\n\n⏳ Waiting for confirmation...`);

      // Wait for the transaction receipt
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      setResult(
        `🎉 Transaction confirmed!\n\n` +
        `📝 User Op Hash: ${userOpHash}\n\n` +
        `🧾 Transaction Hash: ${receipt.receipt.transactionHash}\n\n` +
        `⛽ Gas Used: ${receipt.receipt.gasUsed.toString()}\n\n` +
        `✨ Gas was sponsored by ZeroDev/Pimlico!`
      );
    } catch (error) {
      console.error('Error sending sponsored transaction:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const sendBundledTransaction = async () => {
    if (!primaryWallet) {
      setResult('❌ No wallet connected');
      return;
    }

    setLoading(true);
    setResult('🔄 Preparing bundled sponsored transaction...');

    try {
      const connector = primaryWallet.connector;

      if (!connector || !isZeroDevConnector(connector)) {
        setResult('❌ This wallet does not support gas sponsorship');
        setLoading(false);
        return;
      }

      setResult('🔄 Ensuring kernel client is loaded...');
      await connector.getNetwork();

      setResult('🔄 Getting kernel client with sponsorship...');
      const kernelClient = connector.getAccountAbstractionProvider({
        withSponsorship: true,
      });

      if (!kernelClient) {
        throw new Error('Failed to get kernel client');
      }

      setResult('🔄 Encoding bundled transactions...');

      // Send multiple transactions in a single user operation
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls([
          {
            to: zeroAddress,
            value: BigInt(0),
            data: '0x' as `0x${string}`,
          },
          {
            to: zeroAddress,
            value: BigInt(0),
            data: '0x' as `0x${string}`,
          },
        ]),
      });

      setResult(`✅ Bundled transaction sent!\n\n📝 User Operation Hash:\n${userOpHash}\n\n⏳ Waiting for confirmation...`);

      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      setResult(
        `🎉 Bundled transaction confirmed!\n\n` +
        `📝 User Op Hash: ${userOpHash}\n\n` +
        `🧾 Transaction Hash: ${receipt.receipt.transactionHash}\n\n` +
        `✨ 2 transactions bundled and gas sponsored!`
      );
    } catch (error) {
      console.error('Error sending bundled transaction:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">⛽ Gas Sponsorship Test</h3>

      {!primaryWallet ? (
        <p className="text-gray-400 text-sm">Connect a wallet to test gas sponsorship</p>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded">
            <p className="text-xs text-blue-200 mb-2">
              💡 <strong>Gas Sponsorship Enabled:</strong> Gas fees are paid by ZeroDev/Pimlico paymaster.
            </p>
            <p className="text-xs text-yellow-200">
              ⚠️ <strong>Note:</strong> Gas sponsorship covers GAS FEES only, not the transaction value. To test without needing ETH, use amount &quot;0&quot;.
            </p>
          </div>

          {/* Simple Transaction Test */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Test 1: Simple Sponsored Transaction</h4>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Amount (ETH) - Use &quot;0&quot; to test gas sponsorship only</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Set to &quot;0&quot; to test without needing any ETH in wallet
              </p>
            </div>

            <button
              onClick={sendSponsoredTransaction}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
            >
              {loading ? '⏳ Processing...' : '🚀 Send Sponsored Transaction'}
            </button>
          </div>

          {/* Bundled Transaction Test */}
          <div className="space-y-3 pt-3 border-t border-gray-600">
            <h4 className="text-sm font-semibold text-white">Test 2: Bundled Sponsored Transaction</h4>
            <p className="text-xs text-gray-400">
              Send multiple transactions in a single user operation
            </p>

            <button
              onClick={sendBundledTransaction}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
            >
              {loading ? '⏳ Processing...' : '📦 Send Bundled Transaction'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-4 p-3 bg-gray-900 border border-gray-600 rounded">
              <p className="text-xs text-gray-400 mb-2">Result:</p>
              <pre className="text-xs text-white whitespace-pre-wrap break-all">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

