# ZeroDev + Pimlico Configuration Guide

Based on [ZeroDev's RPC documentation](https://docs.zerodev.app/meta-infra/rpcs#bundler--paymaster-rpcs)

## 🎯 Architecture Overview

```
Your App (Dynamic SDK)
    ↓
ZeroDev Smart Wallet Connectors
    ↓
ZeroDev Project (Dashboard Config)
    ↓
Pimlico Bundler/Paymaster (Auto-configured)
    ↓
Blockchain (Sepolia)
```

## ✅ Current Code Configuration

Your code is correctly set up:

```typescript
ZeroDevSmartWalletConnectorsWithConfig({
  bundlerProvider: 'PIMLICO' as any,
})
```

This tells the SDK to use Pimlico through ZeroDev's infrastructure management.

## 🔧 Required Dashboard Configuration

### 1. ZeroDev Dashboard Setup

Go to [ZeroDev Dashboard](https://dashboard.zerodev.app/):

#### Create V3 Project (Recommended for EIP-7702)
1. Click **"Create Project"**
2. Select **Sepolia** network
3. Choose **Pimlico** as bundler provider
4. In project settings:
   - **Bundler Provider**: Pimlico
   - **Paymaster**: Enable sponsorship
   - Set gas policies (spending limits, operations to sponsor)

#### Configure Pimlico Integration
1. In your ZeroDev project settings
2. Navigate to **Infrastructure**
3. Select **Pimlico** as bundler
4. Add your Pimlico API key: `pim_JZqqy7f9G46TBGfG76LP2Z`
5. ZeroDev will automatically route bundler/paymaster calls to Pimlico

#### Copy Project ID
- Your project ID looks like: `87208fc1-332a-4437-b8b7-050e8bca791d`
- This is what connects everything together

### 2. Dynamic Dashboard Setup

Go to [Dynamic Dashboard - Smart Wallets](https://app.dynamic.xyz/dashboard/smart-wallets):

1. **Enable ZeroDev**:
   - Toggle ZeroDev **ON**

2. **Add Sepolia Configuration**:
   - Find **Sepolia (11155111)** in the chains list
   - Click **"Add Project ID"**
   - Paste your ZeroDev project ID: `87208fc1-332a-4437-b8b7-050e8bca791d`
   - Click **Save**

3. **Verify Configuration**:
   - Sepolia should show a ⚡ Smart Wallet icon
   - This means gas sponsorship is enabled for this chain

## 🔍 How It Works

According to [ZeroDev's documentation](https://docs.zerodev.app/meta-infra/rpcs):

### With ZeroDev Infrastructure (Current Setup)
When you use `bundlerProvider: 'PIMLICO'`:

```
1. Your app sends transaction
   ↓
2. Dynamic SDK creates kernel client
   ↓
3. ZeroDev SDK routes to configured infrastructure
   ↓
4. Standard Ethereum calls → Public Sepolia RPC
5. Bundler operations → Pimlico bundler RPC
6. Paymaster operations → Pimlico paymaster RPC
   ↓
7. Transaction executed with gas sponsored
```

**Benefits**:
- ✅ Automatic routing to correct RPC endpoints
- ✅ No manual RPC configuration needed
- ✅ Works across all chains configured in ZeroDev
- ✅ Easy to switch providers (just change dashboard settings)

### Custom RPC Configuration (Advanced)
If you need custom RPC endpoints:

```typescript
ZeroDevSmartWalletConnectorsWithConfig({
  bundlerProvider: 'PIMLICO',
  bundlerRpc: 'https://api.pimlico.io/v2/11155111/rpc?apikey=YOUR_KEY',
  paymasterRpc: 'https://api.pimlico.io/v2/11155111/rpc?apikey=YOUR_KEY',
})
```

**Note**: We tried this but hit issues because Pimlico bundler RPC doesn't support standard Ethereum calls like `eth_getCode`. The automatic routing (dashboard config) is better.

## 🧪 Testing Checklist

### Pre-flight Checks
- [ ] ZeroDev project created for Sepolia
- [ ] Pimlico selected as bundler in ZeroDev
- [ ] Pimlico API key configured in ZeroDev
- [ ] Gas policy/paymaster configured
- [ ] ZeroDev project ID added to Dynamic dashboard for Sepolia
- [ ] Dev server restarted
- [ ] Browser cache cleared

### Test Steps
1. Open app at `http://localhost:3000`
2. Login with **embedded wallet** (email/social)
3. Scroll to **"⛽ Gas Sponsorship Test"**
4. Set amount to **"0"** (tests gas sponsorship without needing ETH)
5. Click **"🚀 Send Sponsored Transaction"**

### Expected Result
```
✅ Transaction confirmed!
📝 User Op Hash: 0x...
🧾 Transaction Hash: 0x...
⛽ Gas Used: ~21000
✨ Gas was sponsored by ZeroDev/Pimlico!
```

### Verify on Explorer
- Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
- Search for the transaction hash
- Check: "Transaction Fee: $0.00" (paid by paymaster)

## 🚨 Common Issues

### Issue 1: "Please enable chain in Dashboard"
**Cause**: ZeroDev project ID not configured in Dynamic dashboard
**Fix**: Add project ID to Dynamic dashboard for that chain

### Issue 2: "eth_getCode does not exist"
**Cause**: Custom RPC URLs pointing to bundler-only endpoint
**Fix**: Remove custom RPC URLs, let dashboard handle routing

### Issue 3: "Insufficient funds"
**Cause**: Trying to send actual ETH value
**Fix**: Set amount to "0" to test gas sponsorship only

### Issue 4: Paymaster rejection
**Cause**: Gas policy limits reached or not configured
**Fix**: Check ZeroDev dashboard → Gas Policies → Increase limits

## 📊 Supported Networks

According to [ZeroDev](https://docs.zerodev.app/), they support 30+ networks:

**Mainnets:**
- Ethereum, Polygon, Arbitrum, Optimism, Base
- Avalanche, BSC, Gnosis, and more

**Testnets:**
- Sepolia, Base Sepolia, Arbitrum Sepolia
- Polygon Amoy, Optimism Sepolia, and more

Each network needs:
1. ZeroDev project created
2. Pimlico bundler configured
3. Project ID added to Dynamic dashboard

## 🎯 Next Steps After Gas Sponsorship Works

Once gas sponsorship is confirmed working:

### 1. Li.Fi Integration
Integrate Li.Fi for cross-chain swaps with gas sponsorship:
```typescript
const executeLiFiSwap = async (route: any) => {
  const kernelClient = connector.getAccountAbstractionProvider({
    withSponsorship: true,
  });
  
  // Send Li.Fi transaction through kernel client
  const userOpHash = await kernelClient.sendUserOperation({
    callData: await kernelClient.account.encodeCalls([
      {
        to: lifiTx.to,
        value: BigInt(lifiTx.value),
        data: lifiTx.data,
      },
    ]),
  });
  
  return userOpHash;
};
```

### 2. Batch Transactions
Bundle multiple operations (approve + swap) in one transaction:
```typescript
await kernelClient.sendUserOperation({
  callData: await kernelClient.account.encodeCalls([
    approveCall,
    swapCall,
  ]),
});
```

### 3. Session Keys
Enable autonomous transactions without constant user approval

### 4. Multi-chain Support
Add more networks following the same setup pattern

## 📚 Resources

- [ZeroDev Documentation](https://docs.zerodev.app/)
- [ZeroDev RPC Guide](https://docs.zerodev.app/meta-infra/rpcs)
- [Pimlico Documentation](https://docs.pimlico.io/)
- [Dynamic Smart Wallets](https://www.dynamic.xyz/docs/smart-wallets/add-smart-wallets)
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)

---

**Status**: Configuration complete, ready for testing! 🚀

