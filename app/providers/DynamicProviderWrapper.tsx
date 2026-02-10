'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamic import with ssr: false to prevent "window is not defined" error
// This is required for Dynamic SDK v4.30.3 which accesses localStorage during initialization
const DynamicProvider = dynamic(
  () => import('./DynamicProvider').then(mod => mod.DynamicProvider),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }
);

export function DynamicProviderWrapper({ children }: { children: ReactNode }) {
  return <DynamicProvider>{children}</DynamicProvider>;
}





