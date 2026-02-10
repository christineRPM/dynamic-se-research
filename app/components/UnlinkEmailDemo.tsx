'use client';

import { useState } from 'react';
import { useDynamicContext, useUserUpdateRequest } from '@dynamic-labs/sdk-react-core';

export function UnlinkEmailDemo() {
  const { user } = useDynamicContext();
  const { unlinkUserEmail } = useUserUpdateRequest();
  const [status, setStatus] = useState<string>('');
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  // Get email credentials from verified credentials
  const emailCredentials = user?.verifiedCredentials?.filter(
    (cred) => cred.format === 'email'
  ) || [];

  const handleUnlink = async (verifiedCredentialId: string, email: string) => {
    setIsUnlinking(verifiedCredentialId);
    setStatus(`Unlinking ${email}...`);

    try {
      const updatedProfile = await unlinkUserEmail({ verifiedCredentialId });
      
      if (updatedProfile) {
        setStatus(`✅ Successfully unlinked ${email}`);
      } else {
        setStatus(`❌ Failed to unlink ${email} - no updated profile returned`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUnlinking(null);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
        <p className="text-gray-400">Please log in to manage email credentials</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">
        📧 Unlink Email Demo
      </h3>
      
      <p className="text-xs text-gray-400 mb-4">
        Uses <code className="bg-gray-800 px-1 rounded">useUserUpdateRequest().unlinkUserEmail()</code> to remove email credentials
      </p>

      {emailCredentials.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400 text-sm">No email credentials found</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {emailCredentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
            >
              <div>
                <p className="text-white font-medium">{cred.email}</p>
                <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                  ID: {cred.id}
                </p>
              </div>
              <button
                onClick={() => handleUnlink(cred.id, cred.email || 'Unknown')}
                disabled={isUnlinking === cred.id}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
              >
                {isUnlinking === cred.id ? 'Unlinking...' : 'Unlink'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Show all verified credentials for debugging */}
      <details className="mt-4">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
          View all verified credentials ({user.verifiedCredentials?.length || 0})
        </summary>
        <div className="mt-2 bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(user.verifiedCredentials, null, 2)}
          </pre>
        </div>
      </details>

      {status && (
        <div className={`mt-4 p-3 rounded-lg ${
          status.includes('✅') 
            ? 'bg-green-900/30 border border-green-600/50' 
            : status.includes('❌')
            ? 'bg-red-900/30 border border-red-600/50'
            : 'bg-blue-900/30 border border-blue-600/50'
        }`}>
          <p className="text-sm text-white">{status}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
        <p className="text-xs text-yellow-400">
          <strong>⚠️ Warning:</strong> Unlinking an email removes it from the user's verified credentials. 
          The user may need to re-verify if they want to add it back.
        </p>
      </div>
    </div>
  );
}












