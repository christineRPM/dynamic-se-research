'use client';

import { 
  DynamicContextProvider
} from '@dynamic-labs/sdk-react-core';
import { SdkViewSectionType, SdkViewType } from "@dynamic-labs/sdk-api";
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';
import { TonWalletConnectors } from '@dynamic-labs/ton';

import { Component, ReactNode } from 'react';
import { ZeroDevSmartWalletConnectors } from '@dynamic-labs/ethereum-aa';
// Error boundary for Dynamic SDK issues
class DynamicErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Dynamic SDK Error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dynamic SDK Error Details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}


export function DynamicProvider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicErrorBoundary
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Dynamic SDK Error</h2>
            <p className="text-red-600 mb-4">There was an error loading the wallet system.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <DynamicContextProvider
        theme="dark"
        settings={{
          environmentId: "91ead9d6-45fb-4fab-946b-c93736d38c46",
          initialAuthenticationMode: 'connect-and-sign',
          walletConnectors: [
            EthereumWalletConnectors,
            SolanaWalletConnectors,
            TonWalletConnectors,
          ],
          appName: 'Dynamic SE Research',
        }}
        locale={{
          en: {
            dyn_login: {
              title: {
                all: 'Log in',
              },
            },
          },
        }}
      >
        {children}
      </DynamicContextProvider>
    </DynamicErrorBoundary>
  );
} 


