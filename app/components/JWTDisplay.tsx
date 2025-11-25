'use client';

import { FC, useEffect, useState } from 'react';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

export const JWTDisplay: FC = () => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [localStorageJwt, setLocalStorageJwt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [revokingSession, setRevokingSession] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  useEffect(() => {
    // Get JWT from Dynamic SDK
    const token = getAuthToken();
    setJwt(token || null);

    // Extract session ID from JWT
    if (token) {
      const decoded = decodeJWT(token);
      const sid = decoded?.sid || decoded?.session_id || decoded?.jti;
      setSessionId(sid || null);
    }

    // Try to get the Dynamic authentication token from localStorage
    if (typeof window !== 'undefined') {
      const dynamicAuthToken = localStorage.getItem('dynamic_authentication_token');
      if (dynamicAuthToken) {
        setLocalStorageJwt(dynamicAuthToken);
      }
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleRevokeSession = async () => {
    if (!sessionId) {
      setRevokeError('No session ID found in JWT');
      return;
    }

    setRevokingSession(true);
    setRevokeError(null);
    setRevokeSuccess(false);

    try {
      const response = await fetch('/api/revoke-session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error || responseText || response.statusText;
        } catch {
          errorMessage = responseText || response.statusText;
        }
        throw new Error(errorMessage);
      }

      setRevokeSuccess(true);
      setTimeout(() => setRevokeSuccess(false), 5000);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setRevokeError('Network error - CORS may be blocking the request');
      } else {
        setRevokeError(error instanceof Error ? error.message : 'Failed to revoke session');
      }
    } finally {
      setRevokingSession(false);
    }
  };

  const renderJWTInfo = (token: string, title: string) => {
    const decoded = decodeJWT(token);
    const isExpired = decoded?.exp && decoded.exp < Date.now() / 1000;

    return (
      <div className="mb-4">
        <h4 className="text-md font-semibold text-white mb-2">{title}</h4>
        
        {/* Token Display */}
        <div className="bg-gray-900 rounded p-3 mb-3">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1">Token</p>
              <p className="font-mono text-white text-xs truncate">
                {token.substring(0, 40)}...
              </p>
            </div>
            <button
              onClick={() => handleCopy(token)}
              className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Decoded Payload */}
        {decoded && (
          <div className="bg-gray-900 rounded p-3">
            <p className="text-xs text-gray-400 mb-2">Decoded Payload</p>
            <div className="space-y-2">
              {/* Session Information */}
              {(decoded.sid || decoded.session_id || decoded.jti) && (
                <div className="p-2 bg-blue-900/30 border border-blue-500/50 rounded">
                  <p className="text-xs text-blue-300 mb-1">🆔 Session ID</p>
                  <p className="text-sm text-blue-100 font-mono break-all">
                    {decoded.sid || decoded.session_id || decoded.jti}
                  </p>
                </div>
              )}
              
              {/* Session Public Key */}
              {decoded.session_public_key && (
                <div className="p-2 bg-purple-900/30 border border-purple-500/50 rounded">
                  <p className="text-xs text-purple-300 mb-1">🔑 Session Public Key</p>
                  <p className="text-sm text-purple-100 font-mono break-all">
                    {decoded.session_public_key}
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    (Cryptographic public key, NOT the session ID)
                  </p>
                </div>
              )}

              {/* User/Subject Information */}
              {(decoded.sub || decoded.user_id || decoded.verified_credentials) && (
                <div className="p-2 bg-green-900/30 border border-green-500/50 rounded">
                  <p className="text-xs text-green-300 mb-1">👤 User Information</p>
                  {decoded.sub && (
                    <div className="mb-1">
                      <span className="text-xs text-green-400">Subject: </span>
                      <span className="text-sm text-green-100 font-mono">{decoded.sub}</span>
                    </div>
                  )}
                  {decoded.user_id && (
                    <div className="mb-1">
                      <span className="text-xs text-green-400">User ID: </span>
                      <span className="text-sm text-green-100 font-mono">{decoded.user_id}</span>
                    </div>
                  )}
                  {decoded.verified_credentials && Array.isArray(decoded.verified_credentials) && (
                    <div>
                      <span className="text-xs text-green-400">Credentials: </span>
                      <span className="text-sm text-green-100">{decoded.verified_credentials.length} verified</span>
                    </div>
                  )}
                </div>
              )}

              {/* Environment/Issuer */}
              {(decoded.iss || decoded.environment_id) && (
                <div className="p-2 bg-yellow-900/30 border border-yellow-500/50 rounded">
                  <p className="text-xs text-yellow-300 mb-1">🏢 Environment</p>
                  {decoded.iss && (
                    <div className="mb-1">
                      <span className="text-xs text-yellow-400">Issuer: </span>
                      <span className="text-sm text-yellow-100">{decoded.iss}</span>
                    </div>
                  )}
                  {decoded.environment_id && (
                    <div>
                      <span className="text-xs text-yellow-400">Environment ID: </span>
                      <span className="text-sm text-yellow-100 font-mono break-all">{decoded.environment_id}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Expiration */}
              {decoded.exp && (
                <div>
                  <p className="text-xs text-gray-400">⏰ Expires</p>
                  <p className={`text-sm ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                    {formatTimestamp(decoded.exp)} {isExpired && '⚠️ (EXPIRED)'}
                  </p>
                </div>
              )}
              
              {/* Issued At */}
              {decoded.iat && (
                <div>
                  <p className="text-xs text-gray-400">📅 Issued At</p>
                  <p className="text-sm text-white">{formatTimestamp(decoded.iat)}</p>
                </div>
              )}

              {/* Full Payload */}
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                  📋 Full Payload (Click to expand)
                </summary>
                <pre className="text-xs text-white overflow-x-auto mt-2 p-2 bg-gray-950 rounded">
                  {JSON.stringify(decoded, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">JWT Token & Session Management</h3>

      {!jwt && !localStorageJwt && (
        <p className="text-gray-400 text-sm">No JWT token found. Please authenticate first.</p>
      )}

      {/* Session Revocation Controls */}
      {sessionId && jwt && (
        <div className="mb-4 p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">🔄 Session Revocation Testing</h4>
          
          <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded">
            <p className="text-xs text-yellow-200">
              ⚠️ <strong>Important:</strong> This uses the API key to revoke the session. The session ID below is extracted from your current JWT.
            </p>
          </div>
          
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">Current Session ID:</p>
            <p className="text-xs text-white font-mono break-all bg-gray-900 p-2 rounded">{sessionId}</p>
          </div>
          
          {revokeSuccess && (
            <div className="mb-3 p-2 bg-green-900/50 border border-green-700 rounded text-green-200 text-xs">
              ✅ Session revoked successfully!
            </div>
          )}
          
          {revokeError && (
            <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-xs">
              ❌ {revokeError}
            </div>
          )}

          <button
            onClick={handleRevokeSession}
            disabled={revokingSession}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold"
          >
            {revokingSession ? 'Revoking Session...' : '🔐 Revoke Session'}
          </button>
          <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500/30 rounded">
            <p className="text-xs text-blue-200">
              💡 <strong>Using API Key:</strong> The request goes through <code className="bg-blue-950 px-1 rounded">/api/revoke-session</code> which uses the server-side API key to revoke the session.
            </p>
            <p className="text-xs text-blue-300 mt-1">
              📚 <a href="https://www.dynamic.xyz/docs/api-reference/sessions/revoke-a-session" target="_blank" className="underline">API Reference</a>
            </p>
          </div>
        </div>
      )}

      {jwt && renderJWTInfo(jwt, '🔐 Dynamic SDK Token (getAuthToken)')}
      
      {localStorageJwt && localStorageJwt !== jwt && renderJWTInfo(localStorageJwt, '💾 LocalStorage Token')}

      {/* Show all localStorage keys for debugging */}
      <details className="mt-4">
        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
          🔍 Debug: All Dynamic localStorage Keys
        </summary>
        <div className="mt-2 bg-gray-900 rounded p-3">
          <pre className="text-xs text-white overflow-x-auto">
            {typeof window !== 'undefined' && 
              JSON.stringify(
                Object.keys(localStorage)
                  .filter(key => 
                    key.includes('dynamic') || 
                    key.includes('auth') || 
                    key.includes('token')
                  )
                  .reduce((acc, key) => {
                    acc[key] = localStorage.getItem(key);
                    return acc;
                  }, {} as Record<string, string | null>),
                null,
                2
              )
            }
          </pre>
        </div>
      </details>
    </div>
  );
};

