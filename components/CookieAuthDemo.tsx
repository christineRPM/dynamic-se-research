'use client';

import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface CookieResult {
  success?: boolean;
  error?: string;
  details?: string;
  message?: string;
  sessionId?: string;
  user?: {
    userId?: string;
    email?: string;
    walletAddress?: string;
  };
}

interface SessionStatus {
  authenticated?: boolean;
  error?: string;
  user?: {
    userId?: string;
    email?: string;
    walletAddress?: string;
  };
  sessionId?: string;
}

export function CookieAuthDemo() {
  const { primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(false);
  const [cookieResult, setCookieResult] = useState<CookieResult | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [jwtStructure, setJwtStructure] = useState<{header: Record<string, unknown>, payload: Record<string, unknown>} | null>(null);

  const testCookieFlow = async (action: 'create' | 'verify' | 'destroy') => {
    if (action === 'create' && !primaryWallet) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    
    try {
      let token: string | null = null;
      
      if (action === 'create') {
        // Debug: Log all cookies
        console.log('🔍 All cookies:', document.cookie);
        
        // Get real JWT from Dynamic's cookie only (no localStorage for security)
        token = document.cookie
                  .split('; ')
                  .find(row => row.startsWith('DYNAMIC_JWT_TOKEN='))
                  ?.split('=')[1] || null;
        
        console.log('🔍 DYNAMIC_JWT_TOKEN found:', !!token);
        console.log('🔍 Token length:', token?.length || 0);
        
        if (!token) {
          setCookieResult({ 
            error: 'No Dynamic JWT token found', 
            details: 'Please ensure you are logged in with Dynamic. The JWT should be in the DYNAMIC_JWT_TOKEN cookie.' 
          });
          return;
        }
        
        console.log('Using real Dynamic JWT token for verification');
        
        // Decode JWT to show structure
        try {
          const [headerB64, payloadB64] = token.split('.');
          const header = JSON.parse(atob(headerB64));
          const payload = JSON.parse(atob(payloadB64));
          setJwtStructure({ header, payload });
        } catch (decodeError) {
          console.warn('Could not decode JWT:', decodeError);
        }
      }

      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, token }),
        credentials: 'include',
      });

      const result = await response.json();
      setCookieResult(result);

      // If successful, also check session status
      if (result.success && action === 'create') {
        await checkSessionStatus();
      }
      
    } catch (error) {
      setCookieResult({ 
        error: 'Request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'GET',
        credentials: 'include',
      });
      const status = await response.json();
      setSessionStatus(status);
    } catch {
      setSessionStatus({ error: 'Failed to check session status' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* How it Works */}
      <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">Complete Authentication Flow</h4>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium border border-blue-500/30">1</div>
            <div>
              <h5 className="font-medium text-white">User Authentication</h5>
              <p className="text-gray-300 text-sm">User authenticates with Dynamic, JWT stored in Dynamic&apos;s cookie</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium border border-blue-500/30">2</div>
            <div>
              <h5 className="font-medium text-white">Frontend Extracts JWT</h5>
              <p className="text-gray-300 text-sm">Frontend reads JWT from Dynamic&apos;s cookie and sends to backend for verification</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium border border-blue-500/30">3</div>
            <div>
              <h5 className="font-medium text-white">Backend JWT Verification</h5>
              <p className="text-gray-300 text-sm">Server cryptographically validates JWT using Dynamic&apos;s JWKS endpoint</p>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => testCookieFlow('create')}
            disabled={isLoading || !primaryWallet}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            {isLoading ? 'Verifying JWT...' : 'Test JWT Verification'}
          </button>
          
          {!primaryWallet && (
            <p className="text-yellow-400 text-sm text-center">
              Please connect your wallet first to test JWT verification
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {cookieResult && (
        <div className={`rounded-lg p-4 border ${
          cookieResult.error 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-green-500/10 border-green-500/30'
        }`}>
          <h4 className={`font-semibold mb-3 ${
            cookieResult.error ? 'text-red-400' : 'text-green-400'
          }`}>
            JWT Verification Result
          </h4>
          <pre className={`text-xs p-3 rounded border overflow-x-auto ${
            cookieResult.error 
              ? 'bg-red-500/5 text-red-300 border-red-500/20' 
              : 'bg-green-500/5 text-green-300 border-green-500/20'
          }`}>
            {JSON.stringify(cookieResult, null, 2)}
          </pre>
        </div>
      )}

      {sessionStatus && (
        <div className={`rounded-lg p-4 border ${
          sessionStatus.authenticated
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <h4 className={`font-semibold mb-3 ${
            sessionStatus.authenticated ? 'text-blue-400' : 'text-yellow-400'
          }`}>
            Current Session Status
          </h4>
          <pre className={`text-xs p-3 rounded border overflow-x-auto ${
            sessionStatus.authenticated
              ? 'bg-blue-500/5 text-blue-300 border-blue-500/20'
              : 'bg-yellow-500/5 text-yellow-300 border-yellow-500/20'
          }`}>
            {JSON.stringify(sessionStatus, null, 2)}
          </pre>
        </div>
              )}

        {/* JWT Structure Display */}
        {jwtStructure && (
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Real Dynamic JWT Structure</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-blue-400 font-medium mb-2">Header:</h5>
                <pre className="text-xs bg-gray-800 text-blue-300 p-3 rounded border border-blue-500/20 overflow-x-auto">
                  {JSON.stringify(jwtStructure.header, null, 2)}
                </pre>
              </div>
              <div>
                <h5 className="text-green-400 font-medium mb-2">Payload (User Info):</h5>
                <pre className="text-xs bg-gray-800 text-green-300 p-3 rounded border border-green-500/20 overflow-x-auto">
                  {JSON.stringify(jwtStructure.payload, null, 2)}
                </pre>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              This is the actual JWT structure from Dynamic - header contains algorithm & key ID, payload contains your user data
            </div>
          </div>
        )}

        {/* Configuration Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">JWT Verification Configuration</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h5 className="text-blue-300 font-medium mb-2">JWKS Configuration</h5>
            <div className="text-sm text-gray-300 space-y-1">
              <div>
                <span className="text-blue-400">Endpoint:</span>
                <span className="ml-2 font-mono bg-gray-800 px-1 rounded text-xs">auth.zurikai.com</span>
              </div>
              <div>
                <span className="text-blue-400">Algorithm:</span>
                <span className="ml-2 font-mono bg-gray-800 px-1 rounded text-xs">RS256</span>
              </div>
              <div>
                <span className="text-blue-400">Library:</span>
                <span className="ml-2">jose (industry standard)</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-green-300 font-medium mb-2">Backend API</h5>
            <div className="text-sm text-gray-300 space-y-1">
              <div>
                <span className="text-green-400">Endpoint:</span>
                <span className="ml-2 font-mono bg-gray-800 px-1 rounded text-xs">/api/verify-token</span>
              </div>
              <div>
                <span className="text-green-400">Method:</span>
                <span className="ml-2">JWKS + RSA signature</span>
              </div>
              <div>
                <span className="text-green-400">Response:</span>
                <span className="ml-2">User data + verification status</span>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
} 