'use client';

import { FC, useEffect, useState, useRef } from 'react';
import { useExternalAuth, useIsLoggedIn, useDynamicContext, useIsMfaRequiredForAction, useGetMfaToken, useAuthenticatePasskeyMFA, usePromptMfaAuth } from '@dynamic-labs/sdk-react-core';
import { MFAAction } from '@dynamic-labs/sdk-api-core';
import { useAuth, useUser } from '@clerk/nextjs';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const ExternalAuth: FC = () => {
  const { signInWithExternalJwt } = useExternalAuth();
  const { getToken, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const isLoggedInToDynamic = useIsLoggedIn();
  const { user: dynamicUser, primaryWallet } = useDynamicContext();
  const isMfaRequiredForAction = useIsMfaRequiredForAction();
  const getMfaToken = useGetMfaToken();
  const authenticatePasskeyMFA = useAuthenticatePasskeyMFA();
  const promptMfaAuth = usePromptMfaAuth();
  const [dynamicToken, setDynamicToken] = useState<string | null>(null);
  const [clerkToken, setClerkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mfaRequired, setMfaRequired] = useState<boolean | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [checkingMfa, setCheckingMfa] = useState(false);
  const [authenticatingPasskey, setAuthenticatingPasskey] = useState(false);
  const hasAutoSignedIn = useRef(false);

  const addLog = (type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, entry]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Get Clerk token when user is signed in
  useEffect(() => {
    const fetchClerkToken = async () => {
      if (isSignedIn) {
        try {
          addLog('info', '📋 Step 1: Fetching Clerk JWT token...');
          const token = await getToken();
          setClerkToken(token || null);
          if (token) {
            addLog('success', '✅ Clerk JWT token retrieved successfully');
            addLog('info', `   Token preview: ${token.substring(0, 30)}...`);
          }
        } catch (err) {
          addLog('error', `❌ Error fetching Clerk token: ${err instanceof Error ? err.message : 'Unknown error'}`);
          console.error('Error fetching Clerk token:', err);
        }
      } else {
        setClerkToken(null);
        hasAutoSignedIn.current = false;
        clearLogs();
      }
    };

    fetchClerkToken();
  }, [isSignedIn, getToken]);

  // Check if we should show success message (user was auto-signed in)
  useEffect(() => {
    if (isLoggedInToDynamic && isSignedIn && clerkToken && !success) {
      const token = getAuthToken();
      if (token) {
        setDynamicToken(token);
        setSuccess(true);
        addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        addLog('info', 'ℹ️ Already authenticated to Dynamic (auto-sign in completed)');
        addLog('warning', '⚠️ NOTE: Auto-sign-in happened in ClerkAutoSignIn component');
        addLog('warning', '⚠️ To see signInWithExternalJwt logs, click the manual sign-in button below');
        addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }
  }, [isLoggedInToDynamic, isSignedIn, clerkToken, success]);

  // Check MFA requirement for signing
  const checkMfaRequirement = async () => {
    if (!isLoggedInToDynamic) {
      setMfaRequired(null);
      return;
    }

    setCheckingMfa(true);
    addLog('info', '📋 Checking if MFA is required for WalletWaasSign action...');

    try {
      const required = await isMfaRequiredForAction({
        mfaAction: MFAAction.WalletWaasSign,
      });

      setMfaRequired(required);
      
      if (required) {
        addLog('warning', '⚠️ MFA is REQUIRED for signing actions');
        // DON'T call getMfaToken() here - it consumes the token!
        // The token is automatically applied by Dynamic SDK when it exists
        addLog('info', 'ℹ️ If you have authenticated with MFA, the token is automatically applied');
      } else {
        addLog('success', '✅ MFA is NOT required for signing actions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog('error', `❌ Error checking MFA requirement: ${errorMessage}`);
      console.error('Error checking MFA requirement:', err);
    } finally {
      setCheckingMfa(false);
    }
  };

  // Auto-check MFA requirement when logged in
  useEffect(() => {
    if (isLoggedInToDynamic && mfaRequired === null) {
      checkMfaRequirement();
    }
  }, [isLoggedInToDynamic]);

  // Handle passkey authentication (following Dynamic docs pattern exactly)
  const handleAuthenticateWithPasskey = async () => {
    if (!isLoggedInToDynamic) {
      addLog('error', '❌ Please log in to Dynamic first');
      return;
    }

    setAuthenticatingPasskey(true);
    setError(null);
    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addLog('info', '🔐 Starting passkey authentication...');
    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Following Dynamic docs pattern exactly:
      // 1. Check requirement
      addLog('info', '📋 Step 1: Checking if MFA is required for WalletWaasSign...');
      const requires = await isMfaRequiredForAction({
        mfaAction: MFAAction.WalletWaasSign,
      });

      if (!requires) {
        addLog('info', 'ℹ️ No MFA required for this action');
        addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setAuthenticatingPasskey(false);
        return;
      }

      addLog('success', '✅ MFA is required for this action');

      // 2. Skip checking for existing token - getMfaToken() consumes it!
      // The token is automatically applied by Dynamic SDK when it exists
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', '📋 Step 2: Creating new MFA token...');
      addLog('warning', '⚠️ Note: We skip checking for existing tokens (getMfaToken consumes them)');

      // 3. Create token
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', '📋 Step 3: Authenticating with passkey...');
      addLog('info', '   Calling authenticatePasskeyMFA({ createMfaToken })');
      addLog('info', '   This will prompt you to use your device&apos;s biometric or security key');

      // Authenticate with passkey and create MFA token
      const token = await authenticatePasskeyMFA({
        createMfaToken: { singleUse: false }, // or true for one-time
      });

      if (token) {
        setMfaToken(token);
        addLog('success', '✅ Passkey authentication successful!');
        addLog('success', '✅ MFA token created');
        addLog('info', `   Token: ${token.substring(0, 30)}...`);
        addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        addLog('success', '🎉 Token is ready! Now perform the action that requires Action-Based MFA');
        addLog('info', '   The token will be automatically applied to subsequent requests');
        
        // Refresh MFA status
        await checkMfaRequirement();
      } else {
        throw new Error('No token returned from passkey authentication');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate with passkey';
      setError(errorMessage);
      addLog('error', `❌ Error: ${errorMessage}`);
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (errorMessage.includes('not supported') || errorMessage.includes('WebAuthn')) {
        addLog('warning', '⚠️ Passkey/WebAuthn may not be supported in this environment');
        addLog('info', '   Make sure you&apos;re using HTTPS in production');
        addLog('info', '   Passkeys require WebAuthn support');
      }
      
      console.error('Passkey authentication failed:', err);
    } finally {
      setAuthenticatingPasskey(false);
    }
  };

  // Get Dynamic token and refresh periodically (without continuous logging)
  useEffect(() => {
    const updateDynamicToken = () => {
      const token = getAuthToken();
      setDynamicToken(token || null);
      // Removed continuous logging - only log on significant changes
    };

    updateDynamicToken();
    const interval = setInterval(updateDynamicToken, 1000);
    return () => clearInterval(interval);
  }, [success, isLoggedInToDynamic]);

  const handleSignInWithClerk = async () => {
    if (!isSignedIn || !clerkUser || !userId) {
      setError('Please sign in with Clerk first');
      addLog('error', '❌ Please sign in with Clerk first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    clearLogs();
    hasAutoSignedIn.current = false;
    
    // Force sign-in even if already logged in to see the response
    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addLog('info', '🚀 Manual sign-in to Dynamic initiated...');
    addLog('info', '   (This will call signInWithExternalJwt even if already logged in)');
    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addLog('info', '🚀 Manual sign-in to Dynamic initiated...');
    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      addLog('info', '📋 Step 1: Getting Clerk JWT token...');
      const clerkJwt = await getToken();
      
      if (!clerkJwt) {
        throw new Error('Failed to get Clerk JWT token');
      }

      setClerkToken(clerkJwt);
      addLog('success', '✅ Clerk JWT token obtained');
      addLog('info', `   External User ID: ${userId}`);

      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', '📋 Step 2: Calling signInWithExternalJwt...');
      addLog('info', '   Using Dynamic&apos;s useExternalAuth hook');
      addLog('info', `   externalUserId: ${userId}`);
      addLog('info', `   externalJwt length: ${clerkJwt.length} chars`);
      
      // Log authToken BEFORE signInWithExternalJwt
      const getAuthTokenBefore = getAuthToken();
      addLog('info', `   getAuthToken() before: ${getAuthTokenBefore ? 'EXISTS' : 'NULL'}`);
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', '🔥 FIRING signInWithExternalJwt NOW...');
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const userProfile = await signInWithExternalJwt({
        externalUserId: userId,
        externalJwt: clerkJwt,
      });

      // Log the FULL RAW return value from signInWithExternalJwt ON THE PAGE
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('success', '✅ signInWithExternalJwt COMPLETED!');
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', `   Return type: ${typeof userProfile}`);
      addLog('info', `   Is null/undefined? ${userProfile === null || userProfile === undefined}`);
      addLog('info', `   Return keys: ${userProfile ? Object.keys(userProfile).join(', ') : 'N/A'}`);
      
      // Log the FULL RAW RESPONSE (not parsed)
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', '📋 FULL RAW RESPONSE FROM signInWithExternalJwt:');
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (userProfile) {
        // Log the raw object using JSON.stringify with all properties
        const rawResponse = JSON.stringify(userProfile, null, 2);
        // Split into lines and log each line
        const lines = rawResponse.split('\n');
        lines.forEach((line) => {
          addLog('info', line);
        });
      } else {
        addLog('warning', '   Response is null or undefined');
      }
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Also log the raw object reference for inspection
      addLog('info', '📋 RAW OBJECT REFERENCE (for console inspection):');
      addLog('info', '   Check browser console for: [ExternalAuth] signInWithExternalJwt RAW RESPONSE');
      console.log('🔍 [ExternalAuth] signInWithExternalJwt RAW RESPONSE:', userProfile);
      console.log('🔍 [ExternalAuth] signInWithExternalJwt RAW RESPONSE (typeof):', typeof userProfile);
      console.log('🔍 [ExternalAuth] signInWithExternalJwt RAW RESPONSE (constructor):', userProfile?.constructor?.name);
      
      // Log specific properties mentioned by customer
      if (userProfile) {
        const profile = userProfile as unknown as { id?: string; userId?: string; wallets?: unknown[]; email?: string; [key: string]: unknown };
        addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        addLog('info', '📋 EXTRACTED PROPERTIES:');
        addLog('info', `   userProfile.id: ${profile.id || 'N/A'}`);
        addLog('info', `   userProfile.userId: ${profile.userId || 'N/A'}`);
        addLog('info', `   userProfile.wallets: ${profile.wallets ? `${profile.wallets.length} wallet(s)` : 'N/A'}`);
        addLog('info', `   userProfile.email: ${profile.email || 'N/A'}`);
        
        // Log wallets array if it exists
        if (profile.wallets && Array.isArray(profile.wallets)) {
          addLog('info', '   Wallets array:');
          profile.wallets.forEach((wallet, index) => {
            addLog('info', `     Wallet ${index + 1}: ${JSON.stringify(wallet)}`);
          });
        }
      }

      // Log authToken AFTER signInWithExternalJwt
      const getAuthTokenAfter = getAuthToken();
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('info', `   getAuthToken() after: ${getAuthTokenAfter ? 'EXISTS' : 'NULL'}`);

      if (userProfile) {
        const profile = userProfile as unknown as { userId?: string; id?: string; email?: string; wallets?: unknown[]; [key: string]: unknown };
        
        addLog('success', '✅ Successfully signed in to Dynamic!');
        addLog('info', `   Return value keys: ${Object.keys(userProfile).join(', ')}`);
        addLog('info', `   Dynamic User ID: ${profile.userId || profile.id || 'N/A'}`);
        addLog('info', `   Email: ${profile.email || 'N/A'}`);
        addLog('info', `   Wallets: ${profile.wallets ? profile.wallets.length : 0}`);
        
        
        if (getAuthTokenAfter === null) {
          addLog('warning', '⚠️ WARNING: getAuthToken() returns NULL after signInWithExternalJwt');
        } else {
          addLog('success', '✅ getAuthToken() returns a token');
        }
        
        setSuccess(true);
        
        // Small delay to ensure token is available, then check again
        setTimeout(() => {
          const newToken = getAuthToken();
          setDynamicToken(newToken || null);
          
          console.log('🔍 [ExternalAuth] AFTER 500ms delay:');
          console.log('   getAuthToken():', newToken);
          console.log('   getAuthToken() is null?', newToken === null);
          
          if (newToken) {
            addLog('success', '✅ Dynamic auth token retrieved via getAuthToken()');
          } else {
            addLog('warning', '⚠️ getAuthToken() still returns null after delay');
          }
          
          addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          addLog('success', '🎉 Flow completed! You are now logged in to Dynamic.');
        }, 500);
      } else {
        throw new Error('User profile not returned from signInWithExternalJwt');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with external auth';
      setError(errorMessage);
      addLog('error', `❌ Error: ${errorMessage}`);
      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Dynamic external auth failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  const decodeJWT = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">🔐 External Auth (Clerk → Dynamic)</h3>

        {/* Flow Log - AT THE TOP */}
        {logs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">📋 Authentication Flow Log</h4>
              <button
                onClick={clearLogs}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
              >
                🗑️ Clear
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 ${getLogColor(log.type)}`}
                  >
                    <span className="flex-shrink-0">
                      {getLogIcon(log.type)}
                    </span>
                    <span className="text-gray-500 flex-shrink-0">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className="flex-1 break-words whitespace-pre-wrap">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">📖 How It Works</h4>
          <div className="space-y-2 text-xs text-blue-100">
            <p>This feature uses Clerk authentication to sign in to Dynamic:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Sign in with Clerk using the toggle next to your wallet</li>
              <li>Get the Clerk JWT token</li>
              <li>Use Dynamic&apos;s <code className="bg-blue-950 px-1 rounded">useExternalAuth</code> hook to authenticate</li>
              <li>Dynamic creates/links a user account using the Clerk JWT</li>
            </ol>
            <p className="mt-2 text-blue-200">
              <strong>Note:</strong> This requires Third-Party Auth to be configured in your Dynamic dashboard.
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Clerk Status */}
          <div className="p-3 bg-gray-800 border border-gray-600 rounded">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Clerk Status:</p>
              {isSignedIn ? (
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-semibold rounded border border-green-600/50">
                  ✅ SIGNED IN
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-semibold rounded border border-yellow-600/50">
                  ⚠️ NOT SIGNED IN
                </span>
              )}
            </div>
            {isSignedIn && clerkUser && (
              <div className="space-y-1 text-xs">
                <p className="text-gray-300">
                  <strong>User ID:</strong> <span className="font-mono text-xs">{userId?.substring(0, 20)}...</span>
                </p>
                <p className="text-gray-300">
                  <strong>Email:</strong> {clerkUser.primaryEmailAddress?.emailAddress || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Status */}
          <div className="p-3 bg-gray-800 border border-gray-600 rounded">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Dynamic Status:</p>
              {isLoggedInToDynamic ? (
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-semibold rounded border border-green-600/50">
                  ✅ LOGGED IN
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-semibold rounded border border-yellow-600/50">
                  ⚠️ NOT LOGGED IN
                </span>
              )}
            </div>
            {isLoggedInToDynamic && dynamicUser && (
              <div className="space-y-1 text-xs">
                <p className="text-gray-300">
                  <strong>User ID:</strong> <span className="font-mono text-xs">{dynamicUser.userId?.substring(0, 20)}...</span>
                </p>
                <p className="text-gray-300">
                  <strong>Email:</strong> {dynamicUser.email || dynamicUser.alias || 'N/A'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MFA Status */}
        {isLoggedInToDynamic && (
          <div className="mb-4 p-4 bg-gray-800 border border-gray-600 rounded">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">🔐 MFA Status for Signing</h4>
              <button
                onClick={checkMfaRequirement}
                disabled={checkingMfa}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
              >
                {checkingMfa ? '⏳ Checking...' : '🔄 Refresh'}
              </button>
            </div>

            {mfaRequired === null && !checkingMfa && (
              <p className="text-xs text-gray-400">Click &quot;Refresh&quot; to check MFA requirement</p>
            )}

            {checkingMfa && (
              <p className="text-xs text-yellow-400">⏳ Checking MFA requirement...</p>
            )}

            {mfaRequired === true && (
              <div className="space-y-2">
                <div className="p-2 bg-yellow-900/30 border border-yellow-600/50 rounded">
                  <p className="text-xs text-yellow-200 font-semibold mb-1">⚠️ MFA REQUIRED</p>
                  <p className="text-xs text-yellow-300">
                    Signing actions require MFA authentication. You must authenticate with MFA before performing wallet signatures.
                  </p>
                </div>
                {mfaToken ? (
                  <div className="p-2 bg-green-900/30 border border-green-600/50 rounded">
                    <p className="text-xs text-green-200 font-semibold mb-1">✅ MFA Token Available</p>
                    <p className="text-xs text-green-300">
                      You have an active MFA token. Signing actions should work.
                    </p>
                    <p className="text-xs text-green-400 mt-1 font-mono break-all">
                      Token: {mfaToken.substring(0, 30)}...
                    </p>
                  </div>
                ) : (
                  <div className="p-2 bg-orange-900/30 border border-orange-600/50 rounded">
                    <p className="text-xs text-orange-200 font-semibold mb-1">⚠️ No MFA Token</p>
                    <p className="text-xs text-orange-300 mb-2">
                      You need to authenticate with MFA before signing. Use Dynamic&apos;s MFA UI or authenticate programmatically.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                          addLog('info', '🔐 Opening Dynamic MFA UI (following Dynamic docs pattern)...');
                          addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                          
                          // Following Dynamic docs pattern exactly:
                          // 1. Check if MFA is required for the action
                          addLog('info', '📋 Step 1: Checking if MFA is required for WalletWaasSign...');
                          const isMfaRequired = await isMfaRequiredForAction({
                            mfaAction: MFAAction.WalletWaasSign,
                          });
                          
                          if (!isMfaRequired) {
                            addLog('info', 'ℹ️ MFA is not required for this action');
                            addLog('info', '   You can perform signing actions without MFA');
                            return;
                          }
                          
                          addLog('success', '✅ MFA is required for WalletWaasSign');
                          addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                          addLog('info', '📋 Step 2: Opening Dynamic UI to prompt MFA authentication...');
                          addLog('info', '   Calling: promptMfaAuth({ createMfaToken: true })');
                          addLog('info', '   This will create a single-use token for the action');
                          
                          // 2. Opens the Dynamic UI to prompt the user to authenticate with MFA
                          // The token is automatically applied to subsequent requests
                          await promptMfaAuth({ createMfaToken: true });
                          
                          addLog('success', '✅ MFA authentication completed via Dynamic UI');
                          addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                          
                          // Wait a moment for token to be stored
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          // DON'T call getMfaToken() here - it consumes the token!
                          // The token is automatically applied by Dynamic SDK
                          addLog('success', '🎉 MFA token created and automatically applied!');
                          addLog('info', '   The token will be automatically included in your next signing action');
                          addLog('info', '   You can now perform signing actions (transactions, messages, etc.)');
                          addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                          addLog('warning', '⚠️ IMPORTANT: Do not call getMfaToken() - it consumes the token!');
                          addLog('info', '   The token is automatically applied internally by Dynamic SDK');
                          
                          // Trigger a custom event to notify other components (without consuming token)
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('mfa-token-created'));
                          }
                          
                          // Update local state to show token exists (without calling getMfaToken)
                          setMfaToken('token-exists'); // Placeholder to indicate token exists
                          
                          // Refresh MFA status
                          await checkMfaRequirement();
                        } catch (err) {
                          const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate with MFA';
                          addLog('error', `❌ Error: ${errorMessage}`);
                          addLog('error', `   Error details: ${err instanceof Error ? err.stack : String(err)}`);
                          console.error('MFA UI error:', err);
                        }
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-semibold"
                    >
                      🔐 Open Dynamic MFA UI
                    </button>
                  </div>
                )}
                
                {/* Test Sign Message Button - Always visible when MFA is required */}
                <button
                  onClick={async () => {
                    if (!primaryWallet) {
                      addLog('error', '❌ No primary wallet available');
                      return;
                    }
                    
                    try {
                      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                      addLog('info', '📝 Testing signMessage: "Hello, world"');
                      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                      
                      const signature = await primaryWallet.signMessage('Hello, world');
                      
                      if (signature) {
                        addLog('success', '✅ Message signed successfully!');
                        addLog('info', `   Signature: ${signature.substring(0, 50)}...`);
                        addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                      } else {
                        addLog('warning', '⚠️ Sign message returned no signature');
                      }
                    } catch (err) {
                      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                      addLog('error', `❌ Sign message failed: ${errorMessage}`);
                      addLog('error', `   Error details: ${err instanceof Error ? err.stack : String(err)}`);
                      console.error('Sign message error:', err);
                    }
                  }}
                  disabled={!primaryWallet}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors font-semibold mt-2"
                >
                  Test: Sign Message "Hello, world"
                </button>
              </div>
            )}

            {mfaRequired === false && (
              <div className="p-2 bg-green-900/30 border border-green-600/50 rounded">
                <p className="text-xs text-green-200 font-semibold mb-1">✅ MFA NOT REQUIRED</p>
                <p className="text-xs text-green-300">
                  Signing actions do not require MFA authentication. You can sign transactions without MFA.
                </p>
              </div>
            )}

            {/* Passkey Authentication Button */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h5 className="text-xs font-semibold text-white mb-2">🔑 Authenticate with Passkey</h5>
              <p className="text-xs text-gray-400 mb-3">
                Use your device&apos;s biometric authentication (Face ID, Touch ID, Windows Hello) or security key to create an MFA token.
              </p>
              <button
                onClick={handleAuthenticateWithPasskey}
                disabled={authenticatingPasskey || !isLoggedInToDynamic}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
              >
                {authenticatingPasskey ? '⏳ Authenticating with Passkey...' : '🔐 Authenticate with Passkey'}
              </button>
              {!isLoggedInToDynamic && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Please log in to Dynamic first
                </p>
              )}
            </div>

            <div className="mt-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded">
              <p className="text-xs text-blue-200 mb-1">
                <strong>Action Checked:</strong> WalletWaasSign
              </p>
              <p className="text-xs text-blue-300">
                This checks if MFA is required for wallet signing operations (transactions, messages, etc.)
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSignInWithClerk}
          disabled={isLoading || !isSignedIn || !clerkUser || !userId}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold mb-4"
        >
          {isLoading ? '⏳ Signing in to Dynamic...' : '🔗 Sign in to Dynamic with Clerk'}
        </button>

        {!isSignedIn && (
          <div className="mb-4 p-2 bg-yellow-900/50 border border-yellow-700 rounded text-yellow-200 text-xs">
            ⚠️ Please sign in with Clerk first using the toggle next to your wallet.
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-xs">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2 bg-green-900/50 border border-green-700 rounded text-green-200 text-xs">
            ✅ Successfully signed in to Dynamic with Clerk!
          </div>
        )}

        {/* Token Display */}
        <div className="space-y-4">
          {/* Clerk Token */}
          {clerkToken && (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded">
              <h4 className="text-sm font-semibold text-white mb-2">🔑 Clerk JWT Token</h4>
              <div className="space-y-2">
                <div className="bg-gray-900 rounded p-2">
                  <p className="text-xs text-gray-400 mb-1">Token (truncated)</p>
                  <p className="font-mono text-white text-xs break-all">
                    {clerkToken.substring(0, 50)}...
                  </p>
                </div>
                {(() => {
                  const decoded = decodeJWT(clerkToken);
                  return decoded ? (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        📋 Decoded Clerk Token
                      </summary>
                      <pre className="text-xs text-white overflow-x-auto mt-2 p-2 bg-gray-950 rounded max-h-64 overflow-y-auto">
                        {JSON.stringify(decoded, null, 2)}
                      </pre>
                    </details>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* AuthToken Status */}
          <div className="p-3 bg-gray-800 border border-gray-600 rounded">
            <h4 className="text-sm font-semibold text-white mb-2">
              🔍 AuthToken Status (getAuthToken())
            </h4>
            <div className="space-y-2">
              {dynamicToken ? (
                <>
                  <div className="p-2 bg-green-900/30 border border-green-600/50 rounded">
                    <p className="text-xs text-green-200 font-semibold mb-1">✅ AUTHTOKEN EXISTS</p>
                    <div className="bg-gray-900 rounded p-2">
                      <p className="text-xs text-gray-400 mb-1">Token (truncated)</p>
                      <p className="font-mono text-white text-xs break-all">
                        {dynamicToken.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-2 bg-red-900/30 border border-red-600/50 rounded">
                  <p className="text-xs text-red-200 font-semibold mb-1">⚠️ AUTHTOKEN IS NULL</p>
                  <p className="text-xs text-red-300">
                    getAuthToken() returns null - check console logs for debugging information
                  </p>
                </div>
              )}
              <div className="p-2 bg-blue-900/20 border border-blue-700/30 rounded">
                <p className="text-xs text-blue-200">
                  <strong>Note:</strong> This shows the token from <code className="bg-blue-950 px-1 rounded">getAuthToken()</code>
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Check console logs for detailed debugging information
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Token */}
          {dynamicToken && (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded">
              <h4 className="text-sm font-semibold text-white mb-2">✅ Dynamic Auth Token (getAuthToken())</h4>
              <div className="space-y-2">
                <div className="bg-gray-900 rounded p-2">
                  <p className="text-xs text-gray-400 mb-1">Token (truncated)</p>
                  <p className="font-mono text-white text-xs break-all">
                    {dynamicToken.substring(0, 50)}...
                  </p>
                </div>
                {(() => {
                  const decoded = decodeJWT(dynamicToken);
                  return decoded ? (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        📋 Decoded Dynamic Token
                      </summary>
                      <div className="mt-2 space-y-2">
                        {decoded.sub && (
                          <div className="p-2 bg-green-900/30 border border-green-500/50 rounded">
                            <p className="text-xs text-green-300 mb-1">User ID</p>
                            <p className="text-sm text-green-100 font-mono break-all">{decoded.sub}</p>
                          </div>
                        )}
                        {decoded.exp && (
                          <div>
                            <p className="text-xs text-gray-400">Expires</p>
                            <p className="text-sm text-white">{formatTimestamp(decoded.exp)}</p>
                          </div>
                        )}
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                            📋 Full Payload
                          </summary>
                          <pre className="text-xs text-white overflow-x-auto mt-2 p-2 bg-gray-950 rounded max-h-64 overflow-y-auto">
                            {JSON.stringify(decoded, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </details>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {!clerkToken && !dynamicToken && (
            <div className="p-3 bg-gray-800 border border-gray-600 rounded text-center">
              <p className="text-xs text-gray-400">No tokens available. Sign in with Clerk first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

