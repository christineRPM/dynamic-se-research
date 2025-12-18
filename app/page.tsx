'use client';

import { useState, useEffect } from 'react';
import { DynamicEmbeddedWidget, useDynamicContext, useIsLoggedIn, useIsMfaRequiredForAction, usePromptMfaAuth } from '@dynamic-labs/sdk-react-core';
import { MFAAction } from '@dynamic-labs/sdk-api-core';
import { parseEther } from 'viem';
import { ListConnectedWallets } from './components/ListConnectedWallets';
import { JWTDisplay } from './components/JWTDisplay';
import { GasSponsorshipTest } from './components/GasSponsorshipTest';
import { LiFiSwapTest } from './components/LiFiSwapTest';
import { PreGenWallets } from './components/PreGenWallets';
import { DynamicVersions } from './components/DynamicVersions';
import { AutoRevokeSessions } from './components/AutoRevokeSessions';
import { ExternalAuth } from './components/ExternalAuth';
import { ClerkAuthToggle } from './components/ClerkAuthToggle';
import { ClerkAutoSignIn } from './components/ClerkAutoSignIn';
import UserProfileSocialAccount from './components/UserProfileSocialAccount';
import UserProfileSocialAccountOptimized from './components/UserProfileSocialAccountOptimized';
import { ContextDebug } from './components/ContextDebug';

type TabId = 'external-auth' | 'auto-revoke' | 'user-info' | 'gas-sponsorship' | 'pre-gen-wallets' | 'api-testing' | 'dynamic-version';

export default function Home() {
  const dynamicContext = useDynamicContext();
  const { user, primaryWallet } = dynamicContext;
  const isAuthenticated = useIsLoggedIn();
  const address = primaryWallet?.address;
  const [activeTab, setActiveTab] = useState<TabId>('external-auth');
  const [widgetKey, setWidgetKey] = useState<string>(user?.userId || 'default');
  const isMfaRequiredForAction = useIsMfaRequiredForAction();
  const promptMfaAuth = usePromptMfaAuth();
  const [sendingTransaction, setSendingTransaction] = useState(false);

  // Debug: Log context instance to verify it's the same
  if (typeof window !== 'undefined') {
    (window as any).__dynamicContextDebug = dynamicContext;
  }

  // Force widget remount when user changes (to pick up new MFA tokens)
  useEffect(() => {
    if (user?.userId && widgetKey !== user.userId) {
      setWidgetKey(user.userId);
    }
  }, [user?.userId, widgetKey]);

  // Listen for MFA token creation events and refresh widget
  useEffect(() => {
    const handleMfaTokenCreated = () => {
      // Force widget remount by changing key
      setWidgetKey(prev => prev + '-refresh');
      console.log('🔄 Widget refreshed due to MFA token creation');
    };

    window.addEventListener('mfa-token-created', handleMfaTokenCreated);
    return () => window.removeEventListener('mfa-token-created', handleMfaTokenCreated);
  }, []);

  // Handle sending a transaction directly from primaryWallet
  const handleSendTransaction = async () => {
    if (!primaryWallet) {
      alert('No primary wallet available');
      return;
    }

    setSendingTransaction(true);

    try {
      // Step 1: Check if MFA is required for signing actions
      const isMfaRequired = await isMfaRequiredForAction({
        mfaAction: MFAAction.WalletWaasSign,
      });

      // Step 2: If MFA is required, prompt for MFA authentication first
      if (isMfaRequired) {
        await promptMfaAuth({ createMfaToken: true });
        // Wait a moment for token to be stored
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 3: Send transaction directly from primaryWallet using sendBalance
      const recipientAddress = '0xFf70E6991834768DF8E61DB3391B2de48a241791'; // Example recipient
      const amount = '0.001'; // Amount in ETH

      // Use primaryWallet.sendBalance method
      const transaction = await primaryWallet.sendBalance({
        toAddress: recipientAddress,
        amount: amount, // Amount as string in ETH
      });

      console.log('Transaction sent!', transaction);
      // Transaction can be a string (hash) or an object
      const txHash = typeof transaction === 'string' ? transaction : (transaction as any)?.hash || 'See console for details';
      alert(`Transaction sent! Hash: ${txHash}`);
    } catch (error) {
      console.error('Send transaction error:', error);
      // Don't show alert for user cancellation
      if (error instanceof Error && !error.message.includes('User rejected') && !error.message.includes('cancelled')) {
        alert(`Transaction failed: ${error.message}`);
      }
    } finally {
      setSendingTransaction(false);
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
        {/* Auto-sign in component - always mounted */}
        <ClerkAutoSignIn />
        {/* Debug component to verify context */}
        <ContextDebug />
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Embedded Widget */}
          <div className="bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden lg:col-span-1">
            <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Your Wallet</h2>
              <ClerkAuthToggle />
            </div>
            <div className="flex-1 p-6 overflow-hidden">
              <DynamicEmbeddedWidget 
                background="default"
                key={widgetKey} // Force remount when user changes or token is created
              />
              
              {/* Test Transaction Button */}
              {isAuthenticated && (
                <div className="mt-4">
                  <button
                    onClick={handleSendTransaction}
                    disabled={!primaryWallet || sendingTransaction}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
                  >
                    {sendingTransaction ? 'Sending...' : 'Send Transaction (0.001 ETH)'}
                  </button>
                </div>
              )}
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
                      onClick={() => setActiveTab('external-auth')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'external-auth'
                          ? 'border-purple-500 text-purple-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      🔗 External Auth
                    </button>
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

                    {/* External Auth Tab */}
                    {activeTab === 'external-auth' && (
                      <ExternalAuth />
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