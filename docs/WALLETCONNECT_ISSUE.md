# WalletConnect Multiple Initialization Issue

## 🐛 The Problem

When using multiple wallet connectors (`EthereumWalletConnectors`, `SolanaWalletConnectors`, `SuiWalletConnectors`), the Dynamic SDK initializes WalletConnect Core **multiple times**, causing:

1. **Console Warnings**:
   ```
   WalletConnect Core is already initialized. This is probably a mistake 
   and can lead to unexpected behavior. Init() was called 3 times.
   ```

2. **Memory Leak Warnings**:
   ```
   MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 
   11 heartbeat_pulse listeners added.
   ```

3. **Potential Issues**:
   - Memory leaks
   - Unexpected behavior
   - Multiple WalletConnect sessions
   - Event listener conflicts

---

## 🔍 Root Cause Analysis

### What's Happening:

Each wallet connector package in the Dynamic SDK creates its own WalletConnect instance:

```typescript
settings={{
  walletConnectors: [
    EthereumWalletConnectors,    // ← Initializes WalletConnect Core #1
    SolanaWalletConnectors,      // ← Initializes WalletConnect Core #2
    SuiWalletConnectors,         // ← Initializes WalletConnect Core #3
  ],
}}
```

### Why It's a Problem:

WalletConnect Core should be a **singleton** - initialized once and shared across all connectors. The Dynamic SDK currently:

❌ **Current Behavior** (Bad):
```
Ethereum Connector → Creates WalletConnect instance
Solana Connector   → Creates WalletConnect instance
Sui Connector      → Creates WalletConnect instance
Result: 3 instances, memory leaks, conflicts
```

✅ **Expected Behavior** (Good):
```
Shared WalletConnect → Used by Ethereum Connector
                    → Used by Solana Connector
                    → Used by Sui Connector
Result: 1 instance, no leaks, clean
```

### Made Worse By:

**React Strict Mode** (Next.js default in development):
- Intentionally double-mounts components
- Each mount initializes all connectors
- 3 connectors × 2 mounts = 6 initializations!

---

## 🛠️ Customer-Side Workarounds

### Option 1: Disable React Strict Mode (Quick Fix)

**Impact**: Reduces initialization count in development

**Implementation**: Already applied in `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: false, // ← Disables double-mounting
  // ... rest of config
};
```

**Pros**:
- ✅ Reduces warnings from 6 to 3 initializations
- ✅ Less noisy console
- ✅ Simple one-line change

**Cons**:
- ⚠️ Doesn't eliminate the root cause
- ⚠️ Loses React Strict Mode benefits (catching bugs)
- ⚠️ Still have 3 WalletConnect instances

---

### Option 2: Use Only One Connector (Not Recommended)

**Impact**: Eliminates warnings but limits functionality

```typescript
settings={{
  walletConnectors: [
    EthereumWalletConnectors,  // Only use one chain
  ],
}}
```

**Pros**:
- ✅ No WalletConnect conflicts

**Cons**:
- ❌ Lose multi-chain support
- ❌ Not a real solution
- ❌ Defeats purpose of using Dynamic

---

### Option 3: Suppress Console Warnings (Not Recommended)

**Impact**: Hides warnings but doesn't fix the issue

```typescript
// In a useEffect or initialization file
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('WalletConnect Core is already initialized')) {
    return; // Suppress this warning
  }
  originalWarn(...args);
};
```

**Pros**:
- ✅ Clean console

**Cons**:
- ❌ Doesn't fix the underlying problem
- ❌ Memory leaks still occur
- ❌ Hides potentially important warnings
- ❌ Bad practice

---

## 🚨 This is a Dynamic SDK Bug

### What Dynamic Labs Needs to Fix:

1. **Create a Shared WalletConnect Singleton**:
   ```typescript
   // Dynamic SDK should have something like this internally:
   let walletConnectInstance: WalletConnectCore | null = null;
   
   export function getWalletConnectInstance() {
     if (!walletConnectInstance) {
       walletConnectInstance = new WalletConnectCore({...});
     }
     return walletConnectInstance;
   }
   ```

2. **Update Each Connector Package**:
   - `@dynamic-labs/ethereum`
   - `@dynamic-labs/solana`
   - `@dynamic-labs/sui`
   
   All should use the shared singleton instead of creating new instances.

3. **Implement Proper Cleanup**:
   ```typescript
   // When unmounting
   export function cleanupWalletConnect() {
     if (walletConnectInstance) {
       walletConnectInstance.removeAllListeners();
       walletConnectInstance = null;
     }
   }
   ```

---

## 📧 Reporting to Dynamic Labs

### Issue Template:

**Title**: WalletConnect Core Multiple Initialization with Multi-Chain Setup

**Description**:
When using multiple wallet connectors (Ethereum, Solana, Sui), each connector initializes its own WalletConnect Core instance instead of sharing a singleton. This causes:
- Multiple initialization warnings
- EventEmitter memory leak warnings  
- Potential for unexpected behavior
- 3+ WalletConnect instances running simultaneously

**Steps to Reproduce**:
1. Configure Dynamic with multiple connectors:
   ```typescript
   walletConnectors: [
     EthereumWalletConnectors,
     SolanaWalletConnectors,
     SuiWalletConnectors,
   ]
   ```
2. Open browser console
3. Load the app
4. See warnings: "WalletConnect Core is already initialized"

**Expected Behavior**:
WalletConnect Core should be initialized once as a singleton and shared across all connectors.

**Current Behavior**:
Each connector initializes its own WalletConnect Core instance.

**SDK Version**: `@dynamic-labs/sdk-react-core@4.40.1` (or your version)

**Impact**: 
- Development: Noisy console, hard to debug other issues
- Production: Potential memory leaks and unexpected behavior

**Suggested Fix**:
Implement a shared WalletConnect singleton pattern across all connector packages.

---

## 📊 Performance Impact

### Current State (With Workaround):
```
React Strict Mode: Disabled
Connector Count: 3
WalletConnect Instances: 3
Console Warnings: ~3 per page load
Memory Leak Risk: Medium
```

### Ideal State (After SDK Fix):
```
React Strict Mode: Enabled (for better dev experience)
Connector Count: 3
WalletConnect Instances: 1 (singleton)
Console Warnings: 0
Memory Leak Risk: None
```

---

## 🔗 Related Issues

This is similar to the `useSocialAccounts` performance issue documented in `PERFORMANCE_DEBUGGING.md`:
- Both are SDK-level issues
- Both require memoization/singleton patterns
- Both need customer-side workarounds until fixed
- Both should be reported to Dynamic Labs

---

## ✅ Current Status

- [x] Issue identified and documented
- [x] Customer-side workaround applied (Strict Mode disabled)
- [ ] Reported to Dynamic Labs
- [ ] SDK fix implemented by Dynamic
- [ ] Workaround can be removed

---

## 🎯 Action Items

### For Your Team:
1. ✅ Applied workaround (disabled Strict Mode)
2. 📧 Report issue to Dynamic Labs support
3. 🔄 Monitor for SDK updates that fix this
4. 🧹 Remove workaround once fixed

### For Dynamic Labs:
1. Implement WalletConnect singleton pattern
2. Update connector packages to use shared instance
3. Add proper cleanup on unmount
4. Release SDK update
5. Document multi-connector best practices

---

## 📚 Additional Resources

- [WalletConnect Docs](https://docs.walletconnect.com/)
- [Singleton Pattern](https://www.patterns.dev/posts/singleton-pattern)
- [React Strict Mode](https://react.dev/reference/react/StrictMode)
- [Node.js EventEmitter](https://nodejs.org/api/events.html#emittersetmaxlistenersn)

