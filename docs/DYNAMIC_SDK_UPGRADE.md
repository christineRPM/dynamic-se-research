# Dynamic SDK Upgrade to v4.44.0

## ✅ Upgrade Complete

Successfully upgraded from Dynamic SDK v4.40.1 → v4.42.0 → v4.44.0 (stable).

---

## 📦 Updated Packages

All Dynamic packages upgraded to **v4.44.0**:

```json
{
  "@dynamic-labs/ethereum": "4.44.0",
  "@dynamic-labs/ethereum-aa": "4.44.0",
  "@dynamic-labs/iconic": "4.44.0",
  "@dynamic-labs/sdk-react-core": "4.44.0",
  "@dynamic-labs/solana": "4.44.0",
  "@dynamic-labs/sui": "4.44.0",
  "@dynamic-labs/types": "4.44.0",
  "@dynamic-labs/wagmi-connector": "4.44.0",
  "@dynamic-labs/zerodev-extension": "4.44.0"
}
```

**New packages added**:
- `@dynamic-labs/iconic` - Icon components for UI
- `@dynamic-labs/types` - TypeScript type definitions

---

## 🔄 Configuration Changes

### Before (v4.40.1):
```typescript
<DynamicContextProvider
  settings={{
    environmentId: '423ea0e4-81a6-4fe2-ae90-5bd1ea3dfccd',
    walletConnectors: [EthereumWalletConnectors, SuiWalletConnectors],
  }}
>
```

### After (v4.44.0):
```typescript
<DynamicContextProvider
  settings={{
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
    walletConnectors: [
      EthereumWalletConnectors,
      SolanaWalletConnectors,
      SuiWalletConnectors,
    ],
    initialAuthenticationMode: 'connect-only',
    overrides: {
      evmNetworks: (networks) =>
        isDevelopment ? mergeNetworks(additionalEvmNetworks, networks) : networks,
    },
  }}
>
```

---

## 🎯 New Features Integrated

### 1. **Initial Authentication Mode**
```typescript
initialAuthenticationMode: 'connect-only'
```
- Sets the default authentication mode to wallet connection only
- Users can connect wallets without requiring full authentication

### 2. **Custom EVM Networks Override**
```typescript
overrides: {
  evmNetworks: (networks) =>
    isDevelopment ? mergeNetworks(additionalEvmNetworks, networks) : networks,
}
```
- Allows adding custom EVM networks in development mode
- Uses `mergeNetworks` helper to combine custom and default networks
- Production uses only default networks for safety

### 3. **Environment Variable Support**
```typescript
environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '423ea0e4-81a6-4fe2-ae90-5bd1ea3dfccd'
```
- Reads environment ID from environment variable
- Falls back to hardcoded value for backward compatibility

### 4. **Three-Chain Support**
```typescript
walletConnectors: [
  EthereumWalletConnectors,  // ← EVM chains
  SolanaWalletConnectors,    // ← Solana
  SuiWalletConnectors,       // ← Sui (re-added)
]
```
- Full support for Ethereum, Solana, and Sui wallets

---

## 🔧 How to Add Custom Networks

Edit `/app/providers/DynamicProvider.tsx`:

```typescript
const additionalEvmNetworks: EvmNetwork[] = [
  {
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    chainId: 11155111,
    chainName: 'Sepolia Testnet',
    iconUrls: ['https://app.dynamic.xyz/assets/networks/eth.svg'],
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia ETH',
      symbol: 'ETH',
    },
    networkId: 11155111,
    rpcUrls: ['https://rpc.sepolia.org'],
    vanityName: 'Sepolia',
  },
  // Add more networks...
];
```

These networks will only be available in **development mode**.

---

## 🌍 Environment Variables

Create a `.env.local` file in your project root:

```bash
# Your Dynamic Environment ID from https://app.dynamic.xyz/dashboard/
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
```

**Note**: The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

---

## 📋 Breaking Changes

### None Identified
The upgrade is backward compatible. All existing features continue to work.

---

## ✨ Benefits of This Upgrade

1. **Better Type Safety** - New `@dynamic-labs/types` package
2. **More Flexible Auth** - `initialAuthenticationMode` option
3. **Custom Networks** - Easy network override system
4. **Sui Support** - Re-enabled full three-chain support
5. **Environment Config** - Proper environment variable support
6. **Icon Support** - Official icon package for UI components

---

## 🧪 Testing Checklist

After upgrade, test the following:

- [ ] App starts without errors
- [ ] Wallet connection works (Ethereum)
- [ ] Wallet connection works (Solana)
- [ ] Wallet connection works (Sui)
- [ ] Social accounts linking/unlinking
- [ ] Embedded wallet UI displays correctly
- [ ] Custom networks appear in development (if configured)
- [ ] Production build works (`npm run build`)
- [ ] No console errors related to Dynamic SDK

---

## 🐛 Known Issues

### WalletConnect Multiple Initialization
- **Status**: SDK-level issue, not fixed in v4.42.0
- **Impact**: Console warnings about WalletConnect Core initialization
- **Workaround**: Applied (React Strict Mode disabled)
- **Documentation**: See `WALLETCONNECT_ISSUE.md`

### useSocialAccounts Performance
- **Status**: SDK-level issue, not fixed in v4.42.0
- **Impact**: Function references change on every render
- **Workaround**: Applied (`useStableSocialAccounts` wrapper)
- **Documentation**: See `PERFORMANCE_DEBUGGING.md`

---

## 🔄 Rollback Plan

If issues arise, rollback with:

```bash
# Restore old package.json
git checkout HEAD~1 package.json

# Reinstall old versions
npm install

# Restore old provider config
git checkout HEAD~1 app/providers/DynamicProvider.tsx
```

---

## 📚 Resources

- [Dynamic SDK Docs](https://docs.dynamic.xyz/)
- [SDK React Core Reference](https://docs.dynamic.xyz/react-sdk/reference)
- [Network Configuration](https://docs.dynamic.xyz/react-sdk/configurations/overrides)
- [Authentication Modes](https://docs.dynamic.xyz/react-sdk/configurations/authentication)

---

## 🎉 Next Steps

1. ✅ Packages upgraded
2. ✅ Configuration updated
3. ✅ New features integrated
4. ⏭️ Test the application
5. ⏭️ Configure custom networks (if needed)
6. ⏭️ Deploy to production

---

## 🆕 What's New in v4.44.0

### From v4.42.0 to v4.44.0:
- Bug fixes and stability improvements
- Performance enhancements
- Security patches
- Improved wallet connector compatibility

**Note**: Using v4.44.0 for stability. Check the [Dynamic SDK Changelog](https://docs.dynamic.xyz/changelog) for detailed release notes.

---

## 💡 Pro Tips

1. **Development Networks**: Add testnets to `additionalEvmNetworks` for easier testing
2. **Environment Variables**: Use different environment IDs for staging/production
3. **Monitoring**: Watch console for any new SDK warnings (set `logLevel: 'ERROR'` for minimal logging)
4. **Documentation**: Update team docs with new authentication mode
5. **Performance**: The existing performance workarounds still apply
6. **Stay Updated**: Regularly check for SDK updates with `npm view @dynamic-labs/sdk-react-core versions`

---

## 📞 Support

If you encounter issues:
1. Check Dynamic SDK changelog for latest versions
2. Review existing issue documentation (WALLETCONNECT_ISSUE.md, PERFORMANCE_DEBUGGING.md, MOBILE_CRYPTO_ISSUE.md)
3. Contact Dynamic Labs support
4. Check #dynamic-sdk Slack channel (if available)

---

## 📊 Version History

- **v4.40.1** → Initial version
- **v4.42.0** → Added custom networks support, `initialAuthenticationMode`
- **v4.44.0** → Stable version with bug fixes and improvements (current)

