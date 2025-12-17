'use client';

import { useState } from 'react';
import { DynamicEmbeddedWidget, useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { ListConnectedWallets } from './components/ListConnectedWallets';
import { JWTDisplay } from './components/JWTDisplay';
import { GasSponsorshipTest } from './components/GasSponsorshipTest';
import { LiFiSwapTest } from './components/LiFiSwapTest';
import { PreGenWallets } from './components/PreGenWallets';
import { DynamicVersions } from './components/DynamicVersions';
import { AutoRevokeSessions } from './components/AutoRevokeSessions';
import UserProfileSocialAccount from './components/UserProfileSocialAccount';
import UserProfileSocialAccountOptimized from './components/UserProfileSocialAccountOptimized';

type TabId = 'auto-revoke' | 'user-info' | 'gas-sponsorship' | 'pre-gen-wallets' | 'api-testing' | 'dynamic-version';

export default function Home() {
  const { user, primaryWallet } = useDynamicContext();
  const isAuthenticated = useIsLoggedIn();
  const address = primaryWallet?.address;
  const [activeTab, setActiveTab] = useState<TabId>('auto-revoke');

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
                <div className="flex-shrink-0 px-6 pt-6 pb-0 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Account Info</h2>
                  
                  {/* Tabs */}
                  <div className="flex gap-1 -mb-px">
                    <button
                      onClick={() => setActiveTab('auto-revoke')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'auto-revoke'
                          ? 'border-red-500 text-red-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      🔐 Auto Revoke Sessions
                    </button>
                    <button
                      onClick={() => setActiveTab('user-info')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'user-info'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      User Info
                    </button>
                    <button
                      onClick={() => setActiveTab('gas-sponsorship')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'gas-sponsorship'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      Gas Sponsorship
                    </button>
                    <button
                      onClick={() => setActiveTab('pre-gen-wallets')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'pre-gen-wallets'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      Pre Gen Wallets
                    </button>
                    <button
                      onClick={() => setActiveTab('api-testing')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'api-testing'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      API Testing
                    </button>
                    <button
                      onClick={() => setActiveTab('dynamic-version')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'dynamic-version'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      Dynamic Version
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-4 pb-6">
                    {/* Auto Revoke Sessions Tab */}
                    {activeTab === 'auto-revoke' && (
                      <AutoRevokeSessions />
                    )}

                    {/* User Info Tab */}
                    {activeTab === 'user-info' && (
                      <>
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

                        {/* Social Account Integration - With Inline Fixes */}
                        <UserProfileSocialAccount />

                        {/* Social Account Integration - Optimized with Wrapper Hook */}
                        <UserProfileSocialAccountOptimized />
                      </>
                    )}

                    {/* Gas Sponsorship Tab */}
                    {activeTab === 'gas-sponsorship' && (
                      <>
                        <GasSponsorshipTest />
                        <LiFiSwapTest />
                      </>
                    )}

                    {/* Pre Gen Wallets Tab */}
                    {activeTab === 'pre-gen-wallets' && (
                      <PreGenWallets />
                    )}

                    {/* API Testing Tab */}
                    {activeTab === 'api-testing' && (
                      <JWTDisplay />
                    )}

                    {/* Dynamic Version Tab */}
                    {activeTab === 'dynamic-version' && (
                      <DynamicVersions />
                    )}
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