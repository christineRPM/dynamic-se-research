'use client';

import { FC, useEffect, useState } from 'react';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface Session {
  id: string;
  createdAt: string;
  revokedAt: string | null;
  ipAddress?: string;
  userAgent?: string;
}

interface UserData {
  user: {
    id: string;
    sessions: Session[];
    [key: string]: any;
  };
}

export const AutoRevokeSessions: FC = () => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [revokedCount, setRevokedCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

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
  }, []);

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
    setRevokedCount(0);
    setTotalSessions(0);
    setUserData(null);
  };

  const revokeSession = async (sessionIdToRevoke: string): Promise<boolean> => {
    try {
      addLog('info', `Attempting to revoke session: ${sessionIdToRevoke.substring(0, 20)}...`);
      
      const response = await fetch('/api/revoke-session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionIdToRevoke }),
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
        addLog('error', `Failed to revoke session: ${errorMessage}`);
        return false;
      }

      addLog('success', `✅ Successfully revoked session: ${sessionIdToRevoke.substring(0, 20)}...`);
      return true;
    } catch (error) {
      addLog('error', `❌ Error revoking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const handleAutoRevoke = async () => {
    if (!jwt || !sessionId || !userId) {
      addLog('error', '❌ Missing JWT, session ID, or user ID. Please authenticate first.');
      return;
    }

    setIsRunning(true);
    clearLogs();
    
    addLog('info', '🚀 Starting auto-revoke process...');
    addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Step 1: Check current session
      addLog('info', '📋 Step 1: Checking current session...');
      const decoded = decodeJWT(jwt);
      if (decoded) {
        addLog('success', `✅ Current Session ID: ${sessionId}`);
        addLog('info', `   User ID: ${userId}`);
        if (decoded.exp) {
          const isExpired = decoded.exp < Date.now() / 1000;
          addLog(isExpired ? 'warning' : 'info', `   Expires: ${new Date(decoded.exp * 1000).toLocaleString()} ${isExpired ? '(EXPIRED)' : ''}`);
        }
      } else {
        addLog('error', '❌ Failed to decode JWT');
        setIsRunning(false);
        return;
      }

      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Step 2: Fetch all user sessions
      addLog('info', '📋 Step 2: Fetching all user sessions...');
      
      const userResponse = await fetch(`/api/get-user?userId=${userId}`);
      const userResponseText = await userResponse.text();

      if (!userResponse.ok) {
        let errorMessage = `HTTP ${userResponse.status}`;
        try {
          const errorJson = JSON.parse(userResponseText);
          errorMessage = errorJson.error || errorJson.message || userResponseText || userResponse.statusText;
        } catch {
          errorMessage = userResponseText || userResponse.statusText;
        }
        addLog('error', `❌ Failed to fetch user sessions: ${errorMessage}`);
        setIsRunning(false);
        return;
      }

      const userDataResponse: UserData = JSON.parse(userResponseText);
      setUserData(userDataResponse);
      
      const allSessions = userDataResponse.user?.sessions || [];
      setTotalSessions(allSessions.length);
      
      addLog('success', `✅ Found ${allSessions.length} total session(s)`);
      
      // Show session breakdown
      const activeSessions = allSessions.filter(s => s.revokedAt === null);
      const alreadyRevokedSessions = allSessions.filter(s => s.revokedAt !== null);
      
      addLog('info', `   • Active sessions: ${activeSessions.length}`);
      addLog('info', `   • Already revoked: ${alreadyRevokedSessions.length}`);

      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Step 3: Identify sessions to revoke
      addLog('info', '📋 Step 3: Identifying sessions to revoke...');
      
      const sessionsToRevoke = activeSessions.filter(s => s.id !== sessionId);
      
      if (sessionsToRevoke.length === 0) {
        addLog('success', '✅ No other active sessions found. All other sessions are already revoked or this is the only active session.');
        setIsRunning(false);
        return;
      }

      addLog('info', `📌 Found ${sessionsToRevoke.length} active session(s) to revoke (excluding current session)`);
      
      // Display sessions that will be revoked
      sessionsToRevoke.forEach((session, index) => {
        addLog('info', `   ${index + 1}. Session: ${session.id.substring(0, 20)}...`);
        addLog('info', `      Created: ${new Date(session.createdAt).toLocaleString()}`);
        if (session.ipAddress) {
          addLog('info', `      IP: ${session.ipAddress}`);
        }
      });

      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Step 4: Revoke sessions
      addLog('info', `📋 Step 4: Revoking ${sessionsToRevoke.length} session(s)...`);
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < sessionsToRevoke.length; i++) {
        const session = sessionsToRevoke[i];
        addLog('info', `\n   [${i + 1}/${sessionsToRevoke.length}] Processing session...`);
        
        const success = await revokeSession(session.id);
        
        if (success) {
          successCount++;
          setRevokedCount(successCount);
        } else {
          failCount++;
        }

        // Small delay to avoid rate limiting
        if (i < sessionsToRevoke.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      addLog('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('success', `🎉 Process completed!`);
      addLog('info', `   • Successfully revoked: ${successCount}`);
      if (failCount > 0) {
        addLog('warning', `   • Failed to revoke: ${failCount}`);
      }
      addLog('info', `   • Current session preserved: ${sessionId.substring(0, 20)}...`);

    } catch (error) {
      addLog('error', `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
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

  return (
    <div className="space-y-4">
      <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">🔐 Auto-Revoke All Sessions (Except Current)</h3>

        {/* Status Info */}
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">📖 How It Works</h4>
          <div className="space-y-2 text-xs text-blue-100">
            <p>This tool will automatically:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Extract your current session ID from the JWT token</li>
              <li>Fetch all sessions associated with your user account</li>
              <li>Identify all active sessions (excluding your current one)</li>
              <li>Revoke each of those sessions one by one</li>
              <li>Display a detailed log of the entire process</li>
            </ol>
            <p className="mt-2 text-blue-200">
              <strong>Note:</strong> Your current session will remain active and you will stay logged in.
            </p>
          </div>
        </div>

        {/* Current Session Info */}
        {sessionId && userId && (
          <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded">
            <p className="text-xs text-gray-400 mb-1">Current Session ID:</p>
            <p className="text-xs text-white font-mono break-all">{sessionId}</p>
            <p className="text-xs text-gray-400 mt-2 mb-1">User ID:</p>
            <p className="text-xs text-white font-mono break-all">{userId}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAutoRevoke}
          disabled={isRunning || !jwt || !sessionId || !userId}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors font-semibold mb-4"
        >
          {isRunning ? '⏳ Processing...' : '🚀 Start Auto-Revoke Process'}
        </button>

        {(!jwt || !sessionId || !userId) && (
          <div className="mb-4 p-2 bg-yellow-900/50 border border-yellow-700 rounded text-yellow-200 text-xs">
            ⚠️ Please authenticate first to use this feature.
          </div>
        )}

        {/* Summary Stats */}
        {(totalSessions > 0 || revokedCount > 0) && (
          <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400">Total Sessions</p>
                <p className="text-lg font-semibold text-white">{totalSessions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Revoked</p>
                <p className="text-lg font-semibold text-green-400">{revokedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Clear Logs Button */}
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            disabled={isRunning}
            className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
            🗑️ Clear Logs
          </button>
        )}

        {/* Log Display */}
        {logs.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-2">📋 Process Log</h4>
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

        {/* User Data Summary */}
        {userData && !isRunning && (
          <div className="mt-4">
            <details className="bg-gray-800 border border-gray-600 rounded p-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 mb-2">
                📊 View Full User Data
              </summary>
              <pre className="text-xs text-white overflow-x-auto mt-2 p-2 bg-gray-950 rounded max-h-64 overflow-y-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

