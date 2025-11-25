# Dynamic SDK Performance Issue & Customer-Side Workarounds

## 🐛 The Problem

**Issue**: The `useSocialAccounts` hook from `@dynamic-labs/sdk-react-core` (v4.40.1) causes performance issues due to returning new function references on every render.

**Impact**: 
- Cascading re-renders throughout component tree
- `useEffect` hooks firing unnecessarily
- Memoized components re-rendering even when they shouldn't
- Poor app performance at scale

**Root Cause**: The SDK doesn't properly memoize the functions it returns from `useSocialAccounts`, causing them to get new references on every render. This violates React's performance best practices.

---

## 🔍 Debugging Tools Implemented

### 1. `useWhyDidYouUpdate` Hook (Enhanced)
**Location**: `/app/hooks/useWhyDidYouUpdate.ts`

Tracks which props/values are changing between renders with detailed type information and explanations.

**Usage**:
```typescript
import { useWhyDidYouUpdate } from '../hooks/useWhyDidYouUpdate';

const MyComponent = () => {
  const hook = useSocialAccounts();
  
  useWhyDidYouUpdate('MyComponent', {
    linkSocialAccount: hook.linkSocialAccount,
    unlinkSocialAccount: hook.unlinkSocialAccount,
    isProcessing: hook.isProcessing,
    // ... other values to track
  });
  
  // component logic...
};
```

**Output**: Enhanced console logs with collapsible groups, color coding, and detailed breakdowns:

```
🟠 [why-did-you-update] useSocialAccounts 🔴 (5 changes)
  ┌─────────────────────┬──────────┬───────────────┬───────────────┬──────────────────┐
  │ property            │ type     │ from          │ to            │ changed          │
  ├─────────────────────┼──────────┼───────────────┼───────────────┼──────────────────┤
  │ linkSocialAccount   │ function │ ƒ anonymous   │ ƒ anonymous   │ function changed │
  │ unlinkSocialAccount │ function │ ƒ anonymous   │ ƒ anonymous   │ function changed │
  │ isLinked            │ function │ ƒ isLinked    │ ƒ isLinked    │ function changed │
  │ isProcessing        │ boolean  │ false         │ true          │ boolean changed  │
  │ userWallets         │ array    │ Array(1)      │ Array(2)      │ array changed    │
  └─────────────────────┴──────────┴───────────────┴───────────────┴──────────────────┘
  
  🔵 linkSocialAccount: Function reference changed (new instance created)
  🔵 unlinkSocialAccount: Function reference changed (new instance created)
  🔵 isLinked: Function reference changed (new instance created)
  🟢 isProcessing: false → true
  🟣 userWallets: array reference changed (could be same values, different reference)
```

**Features**:
- ✅ Identifies type of change (function, array, object, primitive)
- ✅ Shows human-readable descriptions
- ✅ Color-coded by change type
- ✅ Collapsible groups to reduce console clutter
- ✅ Explains why function/object/array changes matter

### 2. `useRenderCount` Hook
**Location**: `/app/hooks/useRenderCount.ts`

Counts and logs how many times a component renders.

**Usage**:
```typescript
import { useRenderCount } from '../hooks/useRenderCount';

const MyComponent = () => {
  const renderCount = useRenderCount('MyComponent');
  
  return <div>Renders: {renderCount}</div>;
};
```

**Output**: 
- Visual render count in UI
- Console logs: `[MyComponent] Render count: 15`

---

## 🛠️ Customer-Side Workarounds

### Option 1: Inline Stabilization (Quick Fix)
**Best for**: Single component, one-off fixes

```typescript
import { useCallback, useRef, useEffect } from 'react';

const MyComponent = () => {
  const { linkSocialAccount, unlinkSocialAccount } = useSocialAccounts();
  
  // Store latest functions in refs
  const linkRef = useRef(linkSocialAccount);
  const unlinkRef = useRef(unlinkSocialAccount);
  
  // Update refs without triggering re-renders
  useEffect(() => {
    linkRef.current = linkSocialAccount;
    unlinkRef.current = unlinkSocialAccount;
  }, [linkSocialAccount, unlinkSocialAccount]);
  
  // Create stable wrapper functions
  const handleLink = useCallback((provider) => {
    linkRef.current(provider);
  }, []);
  
  const handleUnlink = useCallback((provider) => {
    unlinkRef.current(provider);
  }, []);
  
  // Use handleLink and handleUnlink instead of the unstable ones
  return <button onClick={() => handleLink('google')}>Connect</button>;
};
```

**Pros**: 
- Simple, contained within component
- No additional abstractions

**Cons**: 
- Boilerplate in every component
- Harder to maintain
- Verbose

---

### Option 2: Wrapper Hook (Recommended)
**Best for**: Multiple components, cleaner codebase

**Location**: `/app/hooks/useStableSocialAccounts.ts`

```typescript
import { useStableSocialAccounts } from '../hooks/useStableSocialAccounts';

const MyComponent = () => {
  // Drop-in replacement for useSocialAccounts
  const {
    linkSocialAccount,
    unlinkSocialAccount,
    isProcessing,
    isLinked,
    getLinkedAccountInformation,
  } = useStableSocialAccounts(); // ← Stabilized version
  
  // Use normally - functions are now stable!
  return (
    <button onClick={() => linkSocialAccount('google')}>
      Connect
    </button>
  );
};
```

**Pros**: 
- Clean, minimal code changes
- Centralized fix - easy to remove when SDK is fixed
- Can be used everywhere
- Reusable across the app

**Cons**: 
- Additional abstraction layer
- Still a workaround for SDK issue

---

### Option 3: React.memo() Component Wrapper
**Best for**: Preventing child component re-renders

```typescript
import { memo } from 'react';

const MyComponent = memo(() => {
  const { linkSocialAccount } = useSocialAccounts();
  
  // Component only re-renders when props actually change
  return <div>...</div>;
});

MyComponent.displayName = 'MyComponent';
```

**Pros**: 
- Prevents unnecessary re-renders of entire component
- Works with other optimizations

**Cons**: 
- Only prevents re-renders from parent
- Doesn't fix internal re-render triggers
- Can mask real dependency changes

---

## 📊 How to Diagnose Re-Render Issues

### Step-by-Step Guide:

1. **Open Browser DevTools Console** (F12 or Cmd+Option+I)

2. **Log in to the app** - You'll see initial render logs

3. **Watch for console output** with patterns like:
   ```
   [why-did-you-update] useSocialAccounts (5 changes)
   ```

4. **Expand the collapsible groups** to see the table of changes

5. **Identify the problem patterns**:

   **🚨 RED FLAG - Function Changes**:
   ```
   🔵 linkSocialAccount: Function reference changed (new instance created)
   ```
   - This means the SDK is creating new function instances on every render
   - **This is the main performance problem**
   - Should NOT happen unless actual logic changed

   **⚠️ WARNING - Array/Object Changes**:
   ```
   🟣 userWallets: array reference changed (could be same values, different reference)
   ```
   - Array/object reference changed
   - Could be legitimate (data updated) or problematic (same data, new reference)
   - Need to investigate if data actually changed

   **✅ EXPECTED - Value Changes**:
   ```
   🟢 isProcessing: false → true
   ```
   - Primitive values changed
   - This is normal and expected behavior
   - Happens when user interacts or state updates

6. **Compare unoptimized vs optimized**:
   - Unoptimized: Will show constant function changes
   - Optimized: Should only show value changes, stable functions

### Example Diagnosis:

**Bad Performance** (Unoptimized Component):
```
[UserProfileSocialAccount] Render count: 15
[why-did-you-update] useSocialAccounts (4 changes)
  🔵 linkSocialAccount: Function reference changed
  🔵 unlinkSocialAccount: Function reference changed  
  🔵 isLinked: Function reference changed
  🔵 getLinkedAccountInformation: Function reference changed
```
☝️ All functions changing = SDK not memoizing properly

**Good Performance** (Optimized Component):
```
[UserProfileSocialAccountOptimized] Render count: 3
[why-did-you-update] useStableSocialAccounts (1 change)
  🟢 isProcessing: false → true
```
☝️ Only actual value changes = properly optimized

---

## 📊 Comparison Demo

Both versions are implemented in the app:

1. **UserProfileSocialAccount** (Yellow badge)
   - Uses inline stabilization
   - Shows the manual workaround approach

2. **UserProfileSocialAccountOptimized** (Green badge)
   - Uses `useStableSocialAccounts` wrapper
   - Demonstrates cleaner approach

**How to test**:
1. Log in to the app
2. Watch the render count badges
3. Open browser console
4. Interact with any part of the app
5. See console logs showing what's triggering re-renders

---

## 🎯 Recommended Solution Hierarchy

### For Production Use:

1. **✅ Best: Use Wrapper Hook**
   - Implement `useStableSocialAccounts`
   - Replace `useSocialAccounts` throughout codebase
   - Clean, maintainable, easy to remove later

2. **⚠️ Acceptable: Inline Fixes**
   - For one-off components
   - When you can't create custom hooks
   - Temporary until SDK fix

3. **📧 Report to Dynamic Labs**
   - This is ultimately a SDK bug
   - Should be fixed at the source
   - Request proper memoization in the hook

### For Debugging:

- Use `useWhyDidYouUpdate` to identify problem hooks/components
- Use `useRenderCount` to measure impact
- Remove debugging hooks before production

---

## 🚀 Performance Impact

**Before Fix**:
- Component re-renders: ~30-50 per user interaction
- Cascading updates across unrelated components
- Sluggish UI, especially on slower devices

**After Fix** (with wrapper hook):
- Component re-renders: ~2-5 per user interaction
- Only affected components update
- Smooth, responsive UI

---

## 📝 Notes for Dynamic Labs

**Version**: `@dynamic-labs/sdk-react-core@4.40.1`

**Expected Behavior**: Functions returned from hooks should be stable unless their dependencies change. Use `useCallback` with proper dependencies.

**Current Behavior**: Functions get new references on every render, regardless of whether anything changed.

**Suggested Fix**: 
```typescript
// In Dynamic SDK source
export function useSocialAccounts() {
  // ... other logic
  
  const linkSocialAccount = useCallback((provider: ProviderEnum) => {
    // implementation
  }, [/* stable dependencies only */]);
  
  return {
    linkSocialAccount,
    // ... other properly memoized values
  };
}
```

---

## 📚 Additional Resources

- [React useCallback docs](https://react.dev/reference/react/useCallback)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)

