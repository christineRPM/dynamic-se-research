# Console Output Quick Reference Guide

## 🎯 What You'll See in the Console

When you log in and interact with the app, you'll see detailed re-render tracking in your browser console.

---

## 📝 Console Output Format

### Basic Render Count
```
[ListConnectedWallets] Render count: 1
[UserProfileSocialAccount] Render count: 1
[UserProfileSocialAccountOptimized] Render count: 1
```
☝️ Simple counter showing how many times each component rendered

---

### Why-Did-You-Update (Collapsed View)
```
🟠 [why-did-you-update] useSocialAccounts 🔴 (5 changes)  ▶
```
☝️ Click to expand and see details

---

### Why-Did-You-Update (Expanded View)

```
🟠 [why-did-you-update] useSocialAccounts 🔴 (5 changes)
  ┌─────────────────────────────┬──────────┬───────────────┬───────────────┬──────────────────┐
  │ property                    │ type     │ from          │ to            │ changed          │
  ├─────────────────────────────┼──────────┼───────────────┼───────────────┼──────────────────┤
  │ linkSocialAccount           │ function │ ƒ anonymous   │ ƒ anonymous   │ function changed │
  │ unlinkSocialAccount         │ function │ ƒ anonymous   │ ƒ anonymous   │ function changed │
  │ isLinked                    │ function │ ƒ isLinked    │ ƒ isLinked    │ function changed │
  │ getLinkedAccountInformation │ function │ ƒ anonymous   │ ƒ anonymous   │ function changed │
  │ isProcessing                │ boolean  │ false         │ false         │ boolean changed  │
  └─────────────────────────────┴──────────┴───────────────┴───────────────┴──────────────────┘
  
  🔵 linkSocialAccount: Function reference changed (new instance created)
  🔵 unlinkSocialAccount: Function reference changed (new instance created)
  🔵 isLinked: Function reference changed (new instance created)
  🔵 getLinkedAccountInformation: Function reference changed (new instance created)
  🟢 isProcessing: false → false
```

---

## 🔍 Understanding the Output

### Table Columns:

| Column     | Meaning                                        |
|------------|------------------------------------------------|
| `property` | Name of the value that changed                 |
| `type`     | JavaScript type (function, array, object, etc) |
| `from`     | Previous value (abbreviated)                   |
| `to`       | New value (abbreviated)                        |
| `changed`  | Type of change that occurred                   |

### Color-Coded Details:

After the table, you'll see individual explanations for each change:

#### 🔵 Blue (Function Changes) - **THE PROBLEM**
```
🔵 linkSocialAccount: Function reference changed (new instance created)
```
- **What it means**: A new function instance was created
- **Why it matters**: Causes unnecessary re-renders even though the function does the same thing
- **This is the bug**: SDK should memoize these with `useCallback`
- **What to do**: Use the wrapper hook workaround

#### 🟣 Purple (Array/Object Changes) - **INVESTIGATE**
```
🟣 userWallets: array reference changed (could be same values, different reference)
```
- **What it means**: Array or object got a new reference
- **Why it matters**: JavaScript checks reference equality, not content
- **Could be OK**: If the data actually changed (e.g., added a wallet)
- **Could be bad**: If it's the same data but SDK created a new array/object

#### 🟢 Green (Value Changes) - **EXPECTED**
```
🟢 isProcessing: false → true
```
- **What it means**: A primitive value actually changed
- **Why it matters**: This is normal and expected
- **This is good**: Only happens when state legitimately updates

---

## 🎯 Real-World Examples

### Example 1: Initial Login (Expected)
```
[ListConnectedWallets] Render count: 1
[UserProfileSocialAccount] Render count: 1
[UserProfileSocialAccountOptimized] Render count: 1
```
✅ All components render once on initial mount - **GOOD**

---

### Example 2: Unoptimized Component (Problem!)
```
[UserProfileSocialAccount] Render count: 15
🟠 [why-did-you-update] useSocialAccounts 🔴 (5 changes)
  🔵 linkSocialAccount: Function reference changed (new instance created)
  🔵 unlinkSocialAccount: Function reference changed (new instance created)
  🔵 isLinked: Function reference changed (new instance created)
  🔵 getLinkedAccountInformation: Function reference changed (new instance created)
  🔵 isProcessing: Function reference changed (new instance created)
```
❌ All functions getting new references = **BAD PERFORMANCE**
- 15 renders in a short time
- All 5 function references changed
- This is the SDK bug in action

---

### Example 3: Optimized Component (Fixed!)
```
[UserProfileSocialAccountOptimized] Render count: 2
🟠 [why-did-you-update] useStableSocialAccounts 🔴 (1 change)
  🟢 isProcessing: false → true
```
✅ Only 2 renders, only value change = **GOOD PERFORMANCE**
- Functions are stable (not changing)
- Only `isProcessing` changed (actual state update)
- This is what the SDK should do

---

### Example 4: Wallet Connection (Mixed)
```
[ListConnectedWallets] Render count: 3
🟠 [why-did-you-update] ListConnectedWallets 🔴 (2 changes)
  🟣 userWallets: array reference changed (could be same values, different reference)
  🟢 userWalletsLength: 1 → 2
  🟢 firstWalletAddress: "0x123..." → "0x456..."
```
✅ This is OK - user actually connected a new wallet
- Array changed because data changed (new wallet added)
- Length increased from 1 to 2
- First wallet address changed
- **This re-render is justified**

---

## 🚨 Red Flags to Look For

### 1. **High Render Counts During Idle**
```
[UserProfileSocialAccount] Render count: 47
```
If you see high render counts when you're not doing anything = **PROBLEM**

### 2. **Constant Function Changes**
```
🔵 linkSocialAccount: Function reference changed (new instance created)
🔵 unlinkSocialAccount: Function reference changed (new instance created)
```
Repeated in every render = **PROBLEM**

### 3. **Cascading Re-renders**
```
[ListConnectedWallets] Render count: 12
[UserProfileSocialAccount] Render count: 12
[UserProfileSocialAccountOptimized] Render count: 2
```
Multiple unrelated components rendering in sync = **PROBLEM**
(Note: Optimized component doesn't have this issue)

---

## ✅ Good Patterns to See

### 1. **Low Render Counts**
```
[UserProfileSocialAccountOptimized] Render count: 3
```
Few renders = well optimized

### 2. **Only Value Changes**
```
🟢 isProcessing: false → true
```
Only primitives changing = functions are stable

### 3. **No Why-Did-You-Update Logs**
If a component doesn't show up in why-did-you-update, it means nothing changed = **PERFECT**

---

## 🎓 Interactive Testing

Try these actions and watch the console:

1. **Log in**: Watch initial renders (should all be 1)
2. **Wait 5 seconds**: Unoptimized components might keep rendering
3. **Click Connect on Social Account**: Should see isProcessing change
4. **Scroll the page**: Shouldn't cause renders (but might with unoptimized)
5. **Hover over buttons**: Shouldn't cause renders
6. **Connect a wallet**: Should see userWallets array change

---

## 📊 Performance Metrics Interpretation

### Render Count Badge Colors:
- **🟡 Yellow Badge**: Unoptimized component (expect issues)
- **🟢 Green Badge**: Optimized component (should perform well)

### What Numbers to Expect:
- **1-3 renders**: Excellent performance
- **4-10 renders**: Acceptable, room for improvement
- **11-30 renders**: Poor performance, investigate
- **30+ renders**: Critical performance issue

---

## 💡 Pro Tips

1. **Clear console before testing**: Click the 🚫 button to start fresh
2. **Use Console Filters**: Filter by `[why-did-you-update]` to focus
3. **Expand All Groups**: Cmd/Ctrl + Click to expand multiple at once
4. **Take Screenshots**: Compare before/after optimization
5. **Test on Slower Devices**: Performance issues are more visible

---

## 🐛 Reporting Issues to Dynamic Labs

If reporting this to Dynamic Labs, include:

1. SDK version: `@dynamic-labs/sdk-react-core@4.40.1`
2. Screenshot of console output showing function changes
3. Code snippet showing usage
4. Note: "Functions not memoized with useCallback"
5. This documentation as reference

---

## 📚 Additional Resources

- See `PERFORMANCE_DEBUGGING.md` for technical details
- See component files for implementation examples
- React docs: https://react.dev/reference/react/useCallback


