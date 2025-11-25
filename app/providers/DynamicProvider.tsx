'use client';

import { 
  DynamicContextProvider, 
  FilterChain,
  SortWallets,
  WalletOption,
  Wallet
} from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { ZeroDevSmartWalletConnectorsWithConfig } from '@dynamic-labs/ethereum-aa';

import { Component, ReactNode, useMemo, useEffect, useState } from 'react';

// CSS Overrides for Dynamic SDK
const cssOverrides = `
  /* Add your custom CSS overrides here */
`;
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
  // Environment configuration
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '423ea0e4-81a6-4fe2-ae90-5bd1ea3dfccd';
  
  // Detect in-app browsers (simplified version matching production logic)
  const [isInApp, setIsInApp] = useState(false);
  const [isMetaMask, setIsMetaMask] = useState(false);
  const [isRabbyWallet, setIsRabbyWallet] = useState(false);
  const [isRainbowWallet, setIsRainbowWallet] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detect MetaMask in-app browser
      const metamaskDetected = !!(window as any).ethereum?.isMetaMask;
      setIsMetaMask(metamaskDetected);
      
      // Detect Rabby wallet
      const rabbyDetected = !!(window as any).ethereum?.isRabby;
      setIsRabbyWallet(rabbyDetected);
      
      // Detect Rainbow wallet
      const rainbowDetected = !!(window as any).ethereum?.isRainbow;
      setIsRainbowWallet(rainbowDetected);
      
      // Detect if in any in-app browser
      const inApp = metamaskDetected || rabbyDetected || rainbowDetected || 
                    userAgent.includes('wv') || // WebView
                    userAgent.includes('coinbasewallet');
      setIsInApp(inApp);
    }
  }, []);

  // Replicate production's getGenericInstalledWalletConnectors function
  const getGenericInstalledWalletConnectors = (
    wallets: WalletOption[]
  ): WalletOption[] => {
    let installedWallets = wallets.filter(
      (wallet) => wallet.isInstalledOnBrowser
    );

    if (installedWallets.length === 0) {
      if (isMetaMask && isInApp) {
        installedWallets = wallets.filter((wallet) =>
          wallet.key.includes('metamask')
        );
      } else {
        return wallets;
      }
    }

    // Edge case: if zerion is the only installed wallet, allow all
    if (
      installedWallets.length === 1 &&
      installedWallets[0].key.includes('zerion')
    ) {
      return wallets;
    }

    return installedWallets;
  };

  // Replicate production's walletsFilter logic
  const walletsFilter = useMemo(() => {
    if (!isInApp) {
      return SortWallets(['zerion']);
    } else if (isInApp) {
      return getGenericInstalledWalletConnectors;
    } else {
      return SortWallets(['zerion']);
    }
  }, [isInApp, isRabbyWallet, isRainbowWallet, isMetaMask]);

  // Check if Web Crypto API is available (required for Dynamic SDK on mobile)
  if (typeof window !== 'undefined') {
    const isCryptoAvailable = window.crypto && window.crypto.subtle;
    if (!isCryptoAvailable) {
      console.error('🚨 [Dynamic SDK] Web Crypto API not available');
      console.error('📱 Mobile devices require HTTPS to use crypto.subtle');
      console.error('🔗 Current URL:', window.location.href);
      console.error('📖 See MOBILE_CRYPTO_ISSUE.md for solutions');
    }
  }

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
          environmentId: environmentId,
          walletConnectors: [
            EthereumWalletConnectors,
            ZeroDevSmartWalletConnectorsWithConfig({
              bundlerProvider: 'PIMLICO' as any,
            }),
          ],
          cssOverrides: cssOverrides,
        }}
      >
        {children}
      </DynamicContextProvider>
    </DynamicErrorBoundary>
  );
} 