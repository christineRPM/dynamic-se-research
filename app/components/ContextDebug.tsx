'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect } from 'react';

/**
 * Debug component to verify Dynamic context is shared
 */
export function ContextDebug() {
  const context = useDynamicContext();
  
  useEffect(() => {
    console.log('🔍 [ContextDebug] Dynamic Context State:', {
      userId: context.user?.userId,
      email: context.user?.email,
      primaryWallet: context.primaryWallet?.address,
      environmentId: (context as any).settings?.environmentId,
      contextInstance: context,
    });
  }, [context]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded border border-gray-600 z-50 max-w-xs">
      <div className="font-bold mb-1">Context Debug</div>
      <div>User ID: {context.user?.userId?.substring(0, 20)}...</div>
      <div>Wallet: {context.primaryWallet?.address?.substring(0, 10)}...</div>
      <div className="text-gray-400 mt-1">Check console for full context</div>
    </div>
  );
}


