'use client';

import { DynamicEmbeddedWidget, useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { ListConnectedWallets } from './components/ListConnectedWallets';
import { JWTDisplay } from './components/JWTDisplay';
import { GasSponsorshipTest } from './components/GasSponsorshipTest';
import { LiFiSwapTest } from './components/LiFiSwapTest';
import UserProfileSocialAccount from './components/UserProfileSocialAccount';
import UserProfileSocialAccountOptimized from './components/UserProfileSocialAccountOptimized';

export default function Home() {
  const { user, primaryWallet } = useDynamicContext();
  const isAuthenticated = useIsLoggedIn();
  const address = primaryWallet?.address;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700 flex-shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            Dynamic Embedded Wallet
          </h1>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Embedded Widget */}
          <div className="bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden lg:col-span-1">
            <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Your Wallet</h2>
            </div>
            <div className="flex-1 p-6 overflow-hidden">
              <DynamicEmbeddedWidget 
                background="default"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-gray-800 border-gray-700 flex flex-col h-full overflow-hidden lg:col-span-2">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-white mb-4">Welcome!</h2>
                <p className="text-gray-300 mb-6">
                  Connect your wallet to get started
                </p>
              </div>
            ) : (
              <>
                <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white">Account Info</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-4 pb-6">
                    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-1">User</p>
                      <p className="text-white font-medium">
                        {user?.email || user?.alias || 'Connected User'}
                      </p>
                    </div>

                    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                      <p className="font-mono text-white text-sm break-all">
                        {address || 'Not connected'}
                      </p>
                    </div>

                    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-green-400 font-medium">Connected</span>
                      </div>
                    </div>

                    {/* List Connected Wallets */}
                    <ListConnectedWallets />

                    {/* Gas Sponsorship Test */}
                    <GasSponsorshipTest />

                    {/* Li.Fi Gasless Swap */}
                    <LiFiSwapTest />

                    {/* JWT Token Display */}
                    <JWTDisplay />

                    {/* Social Account Integration - With Inline Fixes */}
                    <UserProfileSocialAccount />

                    {/* Social Account Integration - Optimized with Wrapper Hook */}
                    <UserProfileSocialAccountOptimized />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}