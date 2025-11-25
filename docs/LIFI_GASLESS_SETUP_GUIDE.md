# Li.Fi Gasless Swaps with Dynamic + ZeroDev - Complete Setup Guide

## 🎯 Overview

This guide explains how to set up gasless token swaps using:
- **Dynamic SDK** - Wallet connection & management
- **ZeroDev** - Account Abstraction (AA) provider
- **Pimlico** - Gas sponsorship paymaster
- **Li.Fi SDK** - Swap routing & execution
- **NO Wagmi** - Direct SDK integration

---

## 📦 Part 1: Dynamic Provider Setup

### Step 1: Install Dependencies

```bash
npm install @dynamic-labs/sdk-react-core \
  @dynamic-labs/ethereum \
  @dynamic-labs/ethereum-aa \
  @lifi/sdk \
  viem
```

**Note:** You can install `wagmi` but **don't configure it**. It's not needed for this setup.

### Step 2: Configure Dynamic Provider

**File:** `app/providers/DynamicProvider.tsx`

```typescript
'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { ZeroDevSmartWalletConnectorsWithConfig } from '@dynamic-labs/ethereum-aa';

export function DynamicProvider({ children }: { children: React.ReactNode }) {
  // 1. Get your Dynamic Environment ID
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '';
  
  // 2. Get your ZeroDev Project ID (from ZeroDev dashboard)
  const zeroDevProjectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || '';
  
  // 3. Get your Pimlico API Key
  const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || '';

  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: environmentId,
        
        // 🔑 KEY: Add ZeroDev connector alongside Ethereum connectors
        walletConnectors: [
          EthereumWalletConnectors,
          ZeroDevSmartWalletConnectorsWithConfig({
            bundlerProvider: 'PIMLICO' as any,
            // Optional: Specify RPC URLs
            // bundlerRpc: `https://rpc.zerodev.app/api/v2/bundler/${zeroDevProjectId}?bundlerProvider=PIMLICO`,
            // paymasterRpc: `https://rpc.zerodev.app/api/v2/paymaster/${zeroDevProjectId}`,
          }),
        ],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
```

### Step 3: Environment Variables

**File:** `.env.local`

```bash
# Dynamic Configuration
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_env_id

# ZeroDev Configuration (get from dashboard.zerodev.app)
NEXT_PUBLIC_ZERODEV_PROJECT_ID=your_zerodev_project_id

# Pimlico API Key (get from dashboard.pimlico.io)
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
```

### Step 4: Wrap Your App

**File:** `app/layout.tsx`

```typescript
import { DynamicProvider } from './providers/DynamicProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DynamicProvider>
          {children}
        </DynamicProvider>
      </body>
    </html>
  );
}
```

---

## 🔄 Part 2: Li.Fi Gasless Swap Component

### Architecture Overview

```
User selects tokens & amount
    ↓
Li.Fi SDK: getRoutes() - Fetch best swap route
    ↓
Li.Fi SDK: getStepTransaction() - Get transaction data
    ↓
Dynamic Connector → getAccountAbstractionProvider({ withSponsorship: true })
    ↓
ZeroDev Kernel Client
    ↓
Batch: [Approval (if needed), Swap]
    ↓
kernelClient.sendUserOperation() - Execute with gas sponsorship
    ↓
Pimlico Paymaster pays gas ✨
    ↓
Transaction confirmed on-chain ✅
```

### Step 1: Component Imports

**File:** `app/components/LiFiSwapTest.tsx`

```typescript
'use client';

import { FC, useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isZeroDevConnector } from '@dynamic-labs/ethereum-aa';
import { getRoutes, getStepTransaction } from '@lifi/sdk';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';

// ⚠️ NO WAGMI IMPORTS!
```

**Key Points:**
- ✅ Use `useDynamicContext()` from Dynamic (not Wagmi's `useAccount()`)
- ✅ Use `isZeroDevConnector()` to check for AA support
- ✅ Use Li.Fi SDK functions directly (`getRoutes`, `getStepTransaction`)
- ✅ Use `viem` utilities for encoding/parsing

### Step 2: Token Configuration

```typescript
const MAINNET_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18,
    chainId: 1, // Ethereum mainnet
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on mainnet
    decimals: 6,
    chainId: 1,
  },
];
```

**Important:**
- ✅ Use mainnet chains (Li.Fi doesn't support testnets)
- ✅ Include correct decimals for each token
- ✅ Use `0x0000...` for native tokens (ETH, MATIC, etc.)

### Step 3: Get Wallet from Dynamic

```typescript
export const LiFiSwapTest: FC = () => {
  const { primaryWallet } = useDynamicContext();
  
  const [amount, setAmount] = useState('0.001');
  const [fromToken, setFromToken] = useState(MAINNET_TOKENS[0].address);
  const [toToken, setToToken] = useState(MAINNET_TOKENS[1].address);
  const [estimatedOutput, setEstimatedOutput] = useState('');
  
  if (!primaryWallet) {
    return <div>Connect wallet to use swaps</div>;
  }

  const connector = primaryWallet.connector;
  
  // Check if wallet supports AA
  if (!isZeroDevConnector(connector)) {
    return <div>❌ Gas sponsorship requires embedded wallet</div>;
  }
  
  // ... rest of component
}
```

### Step 4: Fetch Real-Time Quotes

```typescript
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
      const walletAddress = await connector.getAddress();
      const fromTokenData = MAINNET_TOKENS.find(t => t.address === fromToken);
      
      if (!fromTokenData) return;

      // 1. Create route request
      const routeRequest = {
        fromChainId: 1, // Ethereum mainnet
        fromAmount: parseUnits(amount, fromTokenData.decimals).toString(),
        fromTokenAddress: fromToken,
        toChainId: 1,
        toTokenAddress: toToken,
        fromAddress: walletAddress,
        options: {
          integrator: 'your-app-name',
          slippage: 0.03, // 3% slippage
        },
      };

      // 2. Get routes from Li.Fi
      const routes = await getRoutes(routeRequest);
      
      if (routes.routes.length > 0) {
        const bestRoute = routes.routes[0];
        const toTokenData = MAINNET_TOKENS.find(t => t.address === toToken);
        
        if (toTokenData) {
          const output = formatUnits(
            BigInt(bestRoute.toAmount), 
            toTokenData.decimals
          );
          setEstimatedOutput(output);
        }
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
```

**Key Points:**
- ✅ Debounce quote fetching (500ms)
- ✅ Use `connector.getAddress()` to get wallet address
- ✅ Call `getRoutes()` directly from Li.Fi SDK
- ✅ Parse amounts with correct decimals

### Step 5: Execute Gasless Swap

```typescript
const executeGaslessSwap = async () => {
  if (!primaryWallet) {
    setResult('❌ No wallet connected');
    return;
  }

  const connector = primaryWallet.connector;
  
  // Validate connector supports AA
  if (!isZeroDevConnector(connector)) {
    throw new Error('Gas sponsorship only works with embedded wallets');
  }

  setLoading(true);
  setResult('🔄 Getting best route...');

  try {
    // Step 1: Get wallet address
    const walletAddress = await connector.getAddress();
    const fromTokenData = MAINNET_TOKENS.find(t => t.address === fromToken);
    
    if (!fromTokenData) {
      throw new Error('Invalid from token');
    }

    // Step 2: Get route from Li.Fi
    const routeRequest = {
      fromChainId: 1,
      fromAmount: parseUnits(amount, fromTokenData.decimals).toString(),
      fromTokenAddress: fromToken,
      toChainId: 1,
      toTokenAddress: toToken,
      fromAddress: walletAddress,
      options: {
        integrator: 'your-app-name',
        slippage: 0.03,
      },
    };

    const routes = await getRoutes(routeRequest);
    
    if (!routes.routes.length) {
      throw new Error('No routes found for this swap');
    }

    const bestRoute = routes.routes[0];
    const step = bestRoute.steps[0];

    setResult('🔄 Getting transaction data...');

    // Step 3: Get transaction data from Li.Fi
    const stepTransaction = await getStepTransaction(step);
    
    if (!stepTransaction || !stepTransaction.transactionRequest) {
      throw new Error('Failed to get transaction data from Li.Fi');
    }

    const txData = stepTransaction.transactionRequest;

    // Step 4: Load kernel client
    setResult('🔄 Loading kernel client...');
    await connector.getNetwork(); // Ensure kernel is loaded
    
    // Step 5: Get kernel client with gas sponsorship
    const kernelClient = connector.getAccountAbstractionProvider({
      withSponsorship: true, // ✨ Enable gas sponsorship
    });

    if (!kernelClient) {
      throw new Error('Failed to get kernel client');
    }

    setResult('🔄 Preparing transaction...');

    // Step 6: Build transaction calls array
    const calls: Array<{
      to: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }> = [];

    // If swapping from ERC20, add approval
    if (fromToken !== '0x0000000000000000000000000000000000000000' 
        && step.estimate.approvalAddress) {
      
      setResult('🔄 Batching approval + swap...');
      
      // ERC20 approve function
      const approvalData = encodeFunctionData({
        abi: [{
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        }],
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

    setResult('🔄 Executing gasless swap...');

    // Step 7: Execute through kernel client (gas sponsored!)
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
```

---

## 🔑 Key Integration Points Explained

### 1. Dynamic → ZeroDev Connection

```typescript
// This is the magic connection point
const kernelClient = connector.getAccountAbstractionProvider({
  withSponsorship: true,
});
```

**What happens:**
- Dynamic's connector wraps ZeroDev's kernel client
- `withSponsorship: true` tells ZeroDev to use Pimlico paymaster
- Returns a fully configured kernel client ready for AA transactions

### 2. Li.Fi → Transaction Data

```typescript
// Get route
const routes = await getRoutes(routeRequest);

// Get executable transaction data
const stepTransaction = await getStepTransaction(routes.routes[0].steps[0]);
const txData = stepTransaction.transactionRequest;
```

**What happens:**
- Li.Fi returns the best swap route across DEXs
- `getStepTransaction()` converts route step into executable transaction
- Returns `{ to, data, value }` that can be sent on-chain

### 3. Transaction Batching

```typescript
const calls = [
  { to: tokenAddress, value: 0n, data: approvalData }, // Approval
  { to: dexAddress, value: 0n, data: swapData },       // Swap
];

await kernelClient.sendUserOperation({
  callData: await kernelClient.account.encodeCalls(calls),
});
```

**What happens:**
- Multiple transactions batched into single user operation
- Both approval and swap execute atomically
- User only signs once, waits once
- Pimlico sponsors gas for ALL batched transactions

### 4. Gas Sponsorship Flow

```
User initiates swap (no ETH needed for gas)
    ↓
kernelClient.sendUserOperation() creates user operation
    ↓
ZeroDev bundler receives user operation
    ↓
Pimlico paymaster checks gas policy
    ↓
Paymaster signs to sponsor gas ✨
    ↓
Bundler submits to chain with paymaster signature
    ↓
Transaction executes (Pimlico pays gas)
    ↓
User gets swap result (paid zero gas fees!)
```

---

## ⚠️ Critical Requirements

### 1. Embedded Wallet ONLY

```typescript
if (!isZeroDevConnector(connector)) {
  return 'Gas sponsorship requires embedded wallet';
}
```

**Why:** External wallets (MetaMask, etc.) don't support `getAccountAbstractionProvider()`.

**Solution:** Users must login with email or social (embedded wallet).

### 2. Mainnet Only

```typescript
const routeRequest = {
  fromChainId: 1, // Must be mainnet
  toChainId: 1,   // No testnets supported
};
```

**Why:** Li.Fi only supports production chains (Ethereum, Polygon, Arbitrum, etc.).

**Solution:** Use mainnet for testing (small amounts).

### 3. ZeroDev Dashboard Configuration

Required settings in ZeroDev dashboard:
- ✅ Project created for target chain (e.g., Ethereum mainnet)
- ✅ Gas policy configured (which operations to sponsor)
- ✅ Paymaster funded (deposit ETH/tokens for gas)
- ✅ Project ID added to Dynamic dashboard

### 4. Dynamic Dashboard Configuration

Required settings in Dynamic dashboard:
- ✅ Chain enabled (Settings → Chains & Networks)
- ✅ ZeroDev project ID added for that chain
- ✅ Embedded wallets enabled

---

## 🧪 Testing Checklist

### Pre-flight Checks
- [ ] Dynamic Environment ID configured
- [ ] ZeroDev Project ID configured for mainnet
- [ ] Pimlico API key configured
- [ ] ZeroDev project has gas policy set up
- [ ] ZeroDev paymaster is funded
- [ ] Dynamic dashboard has chain enabled with ZeroDev project

### Test Scenarios

#### Test 1: ETH → USDC (No Approval)
```
Amount: 0.001 ETH
From: ETH (native)
To: USDC
Expected: Single transaction, gas sponsored
```

#### Test 2: USDC → ETH (With Approval)
```
Amount: 1 USDC
From: USDC
To: ETH
Expected: Batched (approval + swap), gas sponsored
```

#### Test 3: Error Handling
```
- Try with external wallet → Should show error
- Try with zero balance → Should get route but may fail
- Try same token swap → Should prevent
```

---

## 🎯 Comparison: Your Setup vs Dynamic Docs

| Feature | Dynamic's Li.Fi Docs | Your Implementation |
|---------|---------------------|---------------------|
| **Wagmi Config** | ✅ Required (`createConfig`) | ❌ Not needed |
| **WagmiProvider** | ✅ Wrap app | ❌ Not used |
| **Li.Fi Widget** | ✅ Use widget components | ❌ Direct SDK calls |
| **Gas Sponsorship** | ❌ Not supported | ✅ **Full support** |
| **Transaction Batching** | ❌ Separate approvals | ✅ **Batched** |
| **Wallet Types** | ✅ All wallets | ⚠️ Embedded only |
| **Networks** | ✅ All chains | ⚠️ Mainnet only |

**Your implementation is MORE advanced** because it supports gas sponsorship!

---

## 🚨 Common Issues & Solutions

### Issue 1: `wallet_getCallsStatus` Error

**Cause:** Li.Fi SDK trying to use EIP-5792 methods not supported by bundler.

**Solution:** Already handled - using `getStepTransaction()` works correctly.

### Issue 2: "Embedded wallet required" Error

**Cause:** User connected with MetaMask or external wallet.

**Solution:** 
```typescript
if (!isZeroDevConnector(connector)) {
  return 'Please login with email or social (embedded wallet)';
}
```

### Issue 3: "No routes found"

**Cause:** Li.Fi doesn't support the chain or token pair.

**Solution:** Verify:
- Using mainnet (not testnet)
- Tokens exist on Li.Fi
- Sufficient liquidity for swap

### Issue 4: Transaction Fails Despite Gas Sponsorship

**Cause:** Gas sponsorship covers gas fees, NOT transaction value.

**Solution:** Ensure user has enough tokens for the swap amount.

---

## 📚 Additional Resources

- [Dynamic Documentation](https://docs.dynamic.xyz/)
- [ZeroDev Documentation](https://docs.zerodev.app/)
- [Li.Fi SDK Documentation](https://docs.li.fi/)
- [Pimlico Documentation](https://docs.pimlico.io/)

---

## ✅ Success Criteria

When everything is working:
1. ✅ User logs in with email (embedded wallet created)
2. ✅ Selects tokens (ETH ↔ USDC)
3. ✅ Sees real-time quote
4. ✅ Clicks execute
5. ✅ Approval + swap batched in single signature
6. ✅ Transaction completes with ZERO gas fees paid
7. ✅ Tokens swapped successfully

**Total user experience:** One click, one signature, zero gas fees! 🎉

