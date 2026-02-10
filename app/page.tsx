'use client';

import { useState } from 'react';
import { 
  DynamicEmbeddedWidget, 
  useDynamicContext, 
  useIsLoggedIn,
  useRefreshUser,
  useReinitialize 
} from '@dynamic-labs/sdk-react-core';
import { ListConnectedWallets } from './components/ListConnectedWallets';
import { JWTDisplay } from './components/JWTDisplay';
import { GasSponsorshipTest } from './components/GasSponsorshipTest';
import { LiFiSwapTest } from './components/LiFiSwapTest';
import { PreGenWallets } from './components/PreGenWallets';
import { DynamicVersions } from './components/DynamicVersions';
import { AutoRevokeSessions } from './components/AutoRevokeSessions';
import UserProfileSocialAccount from './components/UserProfileSocialAccount';
import UserProfileSocialAccountOptimized from './components/UserProfileSocialAccountOptimized';
import { SolanaConnectionTest } from './components/SolanaConnectionTest';
import { UnlinkEmailDemo } from './components/UnlinkEmailDemo';
import { CreateWalletTest } from './components/CreateWalletTest';

type TabId = 'auto-revoke' | 'user-info' | 'gas-sponsorship' | 'pre-gen-wallets' | 'create-wallet' | 'api-testing' | 'dynamic-version';

export default function Home() {
  const { user, primaryWallet, sdkHasLoaded } = useDynamicContext();
  const isAuthenticated = useIsLoggedIn();
  const address = primaryWallet?.address;
  const [activeTab, setActiveTab] = useState<TabId>('auto-revoke');
  
  // Hooks for testing cross-tab sync
  const refreshUser = useRefreshUser();
  const reinitialize = useReinitialize();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);

  const handleRefreshUser = async () => {
    setIsRefreshing(true);
    setSyncStatus(null);
    try {
      await refreshUser();
      setSyncStatus('✅ User refreshed successfully! Check other tabs.');
    } catch (error) {
      setSyncStatus(`❌ Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReinitialize = async () => {
    setIsReinitializing(true);
    setSyncStatus(null);
    try {
      await reinitialize();
      setSyncStatus('✅ SDK reinitialized! Check other tabs.');
    } catch (error) {
      setSyncStatus(`❌ Reinitialize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReinitializing(false);
    }
  };

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

                {/* Cross-Tab Sync Testing */}
                <div className="mt-6 w-full max-w-md">
                  <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      🔄 Cross-Tab Sync Testing
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Test that user state syncs across browser tabs. Open this page in multiple tabs, 
                      log in on one tab, then use these buttons to sync state.
                    </p>
                    
                    <div className="flex gap-3 mb-3">
                      <button
                        onClick={handleRefreshUser}
                        disabled={isRefreshing || !sdkHasLoaded}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {isRefreshing ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Refreshing...
                          </span>
                        ) : (
                          'Refresh User'
                        )}
                      </button>
                      
                      <button
                        onClick={handleReinitialize}
                        disabled={isReinitializing || !sdkHasLoaded}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {isReinitializing ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Reinitializing...
                          </span>
                        ) : (
                          'Reinitialize SDK'
                        )}
                      </button>
                    </div>

                    {syncStatus && (
                      <div className={`text-sm p-2 rounded ${
                        syncStatus.startsWith('✅') 
                          ? 'bg-green-900/50 text-green-300' 
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {syncStatus}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500 border-t border-gray-600 pt-3">
                      <p><strong>Refresh User:</strong> Syncs user state only (JWT, credentials)</p>
                      <p><strong>Reinitialize SDK:</strong> Full reset (wallets, user, SDK state)</p>
                    </div>
                  </div>
                </div>
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
                      onClick={() => setActiveTab('create-wallet')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'create-wallet'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      Create Wallet
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

                        {/* Solana Connection Test */}
                        <SolanaConnectionTest />

                        {/* Unlink Email Demo */}
                        <UnlinkEmailDemo />
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

                    {/* Create Wallet Tab */}
                    {activeTab === 'create-wallet' && (
                      <CreateWalletTest />
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