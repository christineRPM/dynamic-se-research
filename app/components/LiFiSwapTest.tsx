'use client';

import { FC, useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isZeroDevConnector } from '@dynamic-labs/ethereum-aa';
import { getRoutes, getStepTransaction, ChainId } from '@lifi/sdk';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';

// Token definitions for Ethereum Mainnet
const MAINNET_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    chainId: 1,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    chainId: 1,
  },
];

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const LiFiSwapTest: FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [amount, setAmount] = useState('0.001');
  const [fromToken, setFromToken] = useState(MAINNET_TOKENS[0].address);
  const [toToken, setToToken] = useState(MAINNET_TOKENS[1].address);
  const [estimatedOutput, setEstimatedOutput] = useState<string>('');
  const [fetchingQuote, setFetchingQuote] = useState(false);

  // Li.Fi integrator name
  const INTEGRATOR = 'dynamic-zerodev-gasless';

  // Fetch quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!primaryWallet || !amount || parseFloat(amount) <= 0) {
        setEstimatedOutput('');
        return;
      }

      if (fromToken === toToken) {
        setEstimatedOutput('');
        return;
      }

      setFetchingQuote(true);
      try {
        const connector = primaryWallet.connector;
        if (!connector) return;
        
        const walletAddress = await connector.getAddress();
        const fromTokenData = MAINNET_TOKENS.find(t => t.address === fromToken);
        
        if (!fromTokenData) return;

        const routeRequest = {
          fromChainId: 1, // Ethereum mainnet
          fromAmount: parseUnits(amount, fromTokenData.decimals).toString(),
          fromTokenAddress: fromToken,
          toChainId: 1, // Ethereum mainnet
          toTokenAddress: toToken,
          fromAddress: walletAddress,
          options: {
            integrator: INTEGRATOR,
            slippage: 0.03, // 3% slippage tolerance
          },
        };

        const routes = await getRoutes(routeRequest);
        
        if (routes.routes.length > 0) {
          const bestRoute = routes.routes[0];
          const toTokenData = MAINNET_TOKENS.find(t => t.address === toToken);
          if (toTokenData) {
            const output = formatUnits(BigInt(bestRoute.toAmount), toTokenData.decimals);
            setEstimatedOutput(output);
          }
        } else {
          setEstimatedOutput('No route found');
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setEstimatedOutput('Error fetching quote');
      } finally {
        setFetchingQuote(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [amount, fromToken, toToken, primaryWallet]);

  const executeGaslessSwap = async () => {
    if (!primaryWallet) {
      setResult('❌ No wallet connected');
      return;
    }

    if (fromToken === toToken) {
      setResult('❌ Cannot swap same token');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setResult('❌ Please enter a valid amount');
      return;
    }

    setLoading(true);
    setResult('🔄 Preparing swap...');

    try {
      const connector = primaryWallet.connector;
      
      if (!isZeroDevConnector(connector)) {
        throw new Error('Gas sponsorship only works with embedded wallets');
      }

      // Step 1: Get wallet address
      const walletAddress = await connector.getAddress();
      const fromTokenData = MAINNET_TOKENS.find(t => t.address === fromToken);
      
      if (!fromTokenData) {
        throw new Error('Invalid from token');
      }

      setResult('🔄 Getting best route from Li.Fi...');

      // Step 2: Get route from Li.Fi
      const routeRequest = {
        fromChainId: 1, // Ethereum mainnet
        fromAmount: parseUnits(amount, fromTokenData.decimals).toString(),
        fromTokenAddress: fromToken,
        toChainId: 1, // Ethereum mainnet
        toTokenAddress: toToken,
        fromAddress: walletAddress,
        options: {
          integrator: INTEGRATOR,
          slippage: 0.03, // 3% slippage tolerance
        },
      };

      const routes = await getRoutes(routeRequest);
      
      if (!routes.routes.length) {
        throw new Error('No routes found for this swap');
      }

      const bestRoute = routes.routes[0];
      const toTokenData = MAINNET_TOKENS.find(t => t.address === toToken);
      const estimatedOutput = toTokenData 
        ? formatUnits(BigInt(bestRoute.toAmount), toTokenData.decimals)
        : 'unknown';

      setResult(
        `✅ Route found!\n` +
        `Estimated output: ${estimatedOutput} ${toTokenData?.symbol}\n\n` +
        `🔄 Preparing sponsored transaction...`
      );

      // Step 3: Get transaction data from first step
      const step = bestRoute.steps[0];
      
      setResult(
        `✅ Route found!\n` +
        `Estimated output: ${estimatedOutput} ${toTokenData?.symbol}\n\n` +
        `🔄 Getting transaction data...`
      );

      // Get the actual transaction data for the step
      const stepTransaction = await getStepTransaction(step);
      console.log('Step transaction response:', stepTransaction);
      
      if (!stepTransaction || !stepTransaction.transactionRequest) {
        console.error('Invalid step transaction:', stepTransaction);
        console.error('Original step:', step);
        throw new Error('Failed to get transaction data from Li.Fi step');
      }

      const txData = stepTransaction.transactionRequest;
      console.log('Transaction data to execute:', txData);

      // Step 4: Ensure kernel client is loaded
      setResult('🔄 Loading kernel client...');
      await connector.getNetwork();
      
      // Step 5: Get kernel client with gas sponsorship
      const kernelClient = connector.getAccountAbstractionProvider({
        withSponsorship: true,
      });

      if (!kernelClient) {
        throw new Error('Failed to get kernel client');
      }

      setResult('🔄 Executing gasless swap...');

      // Step 6: Check if approval is needed
      const calls: Array<{ to: `0x${string}`; value: bigint; data: `0x${string}` }> = [];

      // If swapping from ERC20 token (not native ETH), might need approval
      if (fromToken !== '0x0000000000000000000000000000000000000000' && step.estimate.approvalAddress) {
        setResult('🔄 Batching approval + swap...');
        
        // Add approval call
        const approvalData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [
            step.estimate.approvalAddress as `0x${string}`,
            BigInt(routeRequest.fromAmount),
          ],
        });

        calls.push({
          to: fromToken as `0x${string}`,
          value: BigInt(0),
          data: approvalData,
        });
      }

      // Add swap transaction
      calls.push({
        to: txData.to as `0x${string}`,
        value: BigInt(txData.value || '0'),
        data: txData.data as `0x${string}`,
      });

      // Step 7: Execute through kernel client for gas sponsorship
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls(calls),
      });

      setResult(
        `✅ Swap initiated!\n\n` +
        `📝 User Operation Hash:\n${userOpHash}\n\n` +
        `⏳ Waiting for confirmation...`
      );

      // Step 8: Wait for confirmation
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      const txHash = receipt.receipt.transactionHash;
      const explorerUrl = `https://etherscan.io/tx/${txHash}`;

      setResult(
        `🎉 Swap completed!\n\n` +
        `From: ${amount} ${fromTokenData.symbol}\n` +
        `To: ~${estimatedOutput} ${toTokenData?.symbol}\n\n` +
        `📝 User Op Hash:\n${userOpHash}\n\n` +
        `🧾 Transaction Hash:\n${txHash}\n\n` +
        `🔗 View on Explorer:\n${explorerUrl}\n\n` +
        `⛽ Gas Used: ${receipt.receipt.gasUsed.toString()}\n` +
        `✨ Gas was sponsored by Pimlico!`
      );

    } catch (error) {
      console.error('Error executing swap:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedFromToken = MAINNET_TOKENS.find(t => t.address === fromToken);
  const selectedToToken = MAINNET_TOKENS.find(t => t.address === toToken);

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">🔄 Li.Fi Gasless Swap</h3>

      {!primaryWallet ? (
        <p className="text-gray-400 text-sm">Connect a wallet to use gasless swaps</p>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded">
            <p className="text-xs text-blue-200">
              💡 <strong>Gasless Swaps:</strong> Li.Fi routes executed through ZeroDev with Pimlico paying ALL gas fees!
            </p>
          </div>

          {/* From Token */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">From</label>
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm mb-2"
            >
              {MAINNET_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.001"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            />
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="text-gray-400 text-xl">↓</div>
          </div>

          {/* To Token */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">To</label>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm mb-2"
            >
              {MAINNET_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>

            {estimatedOutput && (
              <div className="p-2 bg-gray-800 border border-gray-600 rounded">
                <p className="text-xs text-gray-400">Estimated output:</p>
                <p className="text-sm text-white font-medium">
                  {fetchingQuote ? 'Loading...' : `~${estimatedOutput} ${selectedToToken?.symbol}`}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={executeGaslessSwap}
            disabled={loading || !estimatedOutput || fromToken === toToken || fetchingQuote}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
          >
            {loading ? '⏳ Processing...' : '🔄 Execute Gasless Swap'}
          </button>

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

