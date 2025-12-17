'use client';

import { FC, useEffect, useState } from 'react';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

interface UserData {
  user: {
    id: string;
    sessions: Array<{
      id: string;
      createdAt: string;
      revokedAt: string | null;
      ipAddress?: string;
      userAgent?: string;
    }>;
    [key: string]: unknown;
  };
}

export const JWTDisplay: FC = () => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [localStorageJwt, setLocalStorageJwt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [revokingSession, setRevokingSession] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    // Get JWT from Dynamic SDK
    const token = getAuthToken();
    setJwt(token || null);

    // Extract session ID and user ID from JWT
    if (token) {
      const decoded = decodeJWT(token);
      const sid = decoded?.sid || decoded?.session_id || decoded?.jti;
      const uid = decoded?.sub || decoded?.user_id;
      setSessionId(sid || null);
      setUserId(uid || null);
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
      
      // Refresh user data to see updated sessions
      if (userId) {
        handleGetUser();
      }
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

  const handleGetUser = async () => {
    if (!userId) {
      setUserError('No user ID found in JWT');
      return;
    }

    setFetchingUser(true);
    setUserError(null);
    setUserData(null);

    try {
      const response = await fetch(`/api/get-user?userId=${userId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to get user (${response.status})`);
      }

      setUserData(data);
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'Failed to fetch user');
    } finally {
      setFetchingUser(false);
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

  // Compare current session with revoked sessions
  const currentSessionStatus = userData?.user?.sessions?.find(s => s.id === sessionId);
  const revokedSessions = userData?.user?.sessions?.filter(s => s.revokedAt !== null) || [];
  const isCurrentSessionRevoked = currentSessionStatus?.revokedAt !== null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">JWT Token & Session Management</h3>

        {/* How JWT is Obtained */}
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">📖 How JWT is Obtained</h4>
          <div className="space-y-2 text-xs text-blue-100">
            <p>
              <strong>1. Client-Side:</strong> The JWT is obtained using Dynamic SDK&apos;s <code className="bg-blue-950 px-1 rounded">getAuthToken()</code> function.
            </p>
            <p>
              <strong>2. Source:</strong> The SDK retrieves the JWT from Dynamic&apos;s authentication service after successful wallet connection or social login.
            </p>
            <p>
              <strong>3. Storage:</strong> The JWT is stored in the browser&apos;s memory and can also be found in localStorage under <code className="bg-blue-950 px-1 rounded">dynamic_authentication_token</code>.
            </p>
            <p>
              <strong>4. Contents:</strong> The JWT contains user information, session ID, environment ID, and expiration time. It&apos;s signed by Dynamic&apos;s servers and can be verified using their JWKS endpoint.
            </p>
            <p>
              <strong>5. Usage:</strong> This JWT is used to authenticate API requests and identify the current user session.
            </p>
          </div>
        </div>

        {!jwt && !localStorageJwt && (
          <p className="text-gray-400 text-sm">No JWT token found. Please authenticate first.</p>
        )}

      {/* User Lookup Section */}
      {userId && (
        <div className="mb-4 p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">👤 User Lookup & Session Comparison</h4>
          
          <div className="mb-3 p-2 bg-blue-900/30 border border-blue-500/50 rounded">
            <p className="text-xs text-blue-200 mb-1">
              💡 <strong>Get User by ID:</strong> Fetch user data including all sessions to compare revoked sessions with current session.
            </p>
            <p className="text-xs text-blue-300">
              📚 <a href="https://www.dynamic.xyz/docs/api-reference/users/get-a-user-by-id" target="_blank" className="underline">API Reference</a>
            </p>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">User ID (from JWT):</p>
            <p className="text-xs text-white font-mono break-all bg-gray-900 p-2 rounded">{userId}</p>
          </div>

          <button
            onClick={handleGetUser}
            disabled={fetchingUser || !userId}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold mb-3"
          >
            {fetchingUser ? '⏳ Fetching User...' : '🔍 Get User Data'}
          </button>

          {userError && (
            <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-xs">
              ❌ {userError}
            </div>
          )}

          {userData && (
            <div className="mt-4 space-y-3">
              {/* Current Session Status */}
              {currentSessionStatus && (
                <div className={`p-3 rounded-lg border ${
                  isCurrentSessionRevoked
                    ? 'bg-red-900/30 border-red-600/50'
                    : 'bg-green-900/30 border-green-600/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-white">Current Session Status</h5>
                    {isCurrentSessionRevoked ? (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">REVOKED</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">ACTIVE</span>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-gray-300">
                      <strong>Session ID:</strong> <span className="font-mono">{currentSessionStatus.id}</span>
                    </p>
                    <p className="text-gray-300">
                      <strong>Created:</strong> {new Date(currentSessionStatus.createdAt).toLocaleString()}
                    </p>
                    {currentSessionStatus.revokedAt && (
                      <p className="text-red-300">
                        <strong>Revoked:</strong> {new Date(currentSessionStatus.revokedAt).toLocaleString()}
                      </p>
                    )}
                    {currentSessionStatus.ipAddress && (
                      <p className="text-gray-300">
                        <strong>IP:</strong> {currentSessionStatus.ipAddress}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Revoked Sessions Comparison */}
              {revokedSessions.length > 0 && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <h5 className="text-sm font-semibold text-yellow-200 mb-2">
                    🔒 Revoked Sessions ({revokedSessions.length})
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {revokedSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-2 rounded text-xs ${
                          session.id === sessionId
                            ? 'bg-red-900/50 border border-red-600'
                            : 'bg-gray-900/50 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-white">{session.id.substring(0, 20)}...</span>
                          {session.id === sessionId && (
                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded">CURRENT</span>
                          )}
                        </div>
                        <p className="text-gray-400 mt-1">
                          Revoked: {new Date(session.revokedAt!).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full User Data */}
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                  📋 Full User Data (Click to expand)
                </summary>
                <pre className="text-xs text-white overflow-x-auto mt-2 p-2 bg-gray-950 rounded max-h-96 overflow-y-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
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
    </div>
  );
};

