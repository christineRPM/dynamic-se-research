'use client';

import { useSocialAccounts } from '@dynamic-labs/sdk-react-core';
import { ProviderEnum } from '@dynamic-labs/types';
import { GoogleIcon } from '@dynamic-labs/iconic';
import { useCallback, useRef, useEffect } from 'react';

const UserProfileSocialAccount = () => {
  const {
    linkSocialAccount,
    unlinkSocialAccount,
    isProcessing,
    isLinked,
    getLinkedAccountInformation,
  } = useSocialAccounts();

  const provider = ProviderEnum.Google;
  const isGoogleLinked = isLinked(provider);
  const connectedAccountInfo = getLinkedAccountInformation(provider);

  // Stabilize function references with useRef
  const linkRef = useRef(linkSocialAccount);
  const unlinkRef = useRef(unlinkSocialAccount);

  useEffect(() => {
    linkRef.current = linkSocialAccount;
    unlinkRef.current = unlinkSocialAccount;
  }, [linkSocialAccount, unlinkSocialAccount]);

  // Create stable wrapper functions
  const handleLinkAccount = useCallback(() => {
    linkRef.current(provider);
  }, [provider]);

  const handleUnlinkAccount = useCallback(() => {
    unlinkRef.current(provider);
  }, [provider]);

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Social Account</h3>
      
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {isGoogleLinked && connectedAccountInfo?.avatar ? (
            <img 
              src={connectedAccountInfo.avatar} 
              alt="Google Avatar"
              className="w-12 h-12 rounded-full border-2 border-gray-600"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-full border-2 border-gray-600">
              <GoogleIcon />
            </div>
          )}
        </div>

        {/* Label */}
        <div className="flex-grow">
          <p className="text-xs text-gray-400 mb-1">Google Account</p>
          <p className="text-white text-sm">
            {connectedAccountInfo?.publicIdentifier ?? 'Not connected'}
          </p>
        </div>

        {/* Button */}
        <div className="flex-shrink-0">
          {isGoogleLinked ? (
            <button
              onClick={handleUnlinkAccount}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleLinkAccount}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileSocialAccount;

