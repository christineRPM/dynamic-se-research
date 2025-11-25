'use client';

import { ProviderEnum } from '@dynamic-labs/types';
import { GoogleIcon } from '@dynamic-labs/iconic';
import { useStableSocialAccounts } from '../hooks/useStableSocialAccounts';
import { memo } from 'react';

/**
 * 🚀 OPTIMIZED VERSION using useStableSocialAccounts wrapper
 * 
 * This component uses the stable wrapper hook to prevent unnecessary re-renders.
 * Much cleaner than inline fixes and can be easily replaced when Dynamic Labs fixes the SDK.
 */
const UserProfileSocialAccountOptimized = memo(() => {
  const {
    linkSocialAccount,
    unlinkSocialAccount,
    isProcessing,
    isLinked,
    getLinkedAccountInformation,
  } = useStableSocialAccounts();

  const provider = ProviderEnum.Google;
  const isGoogleLinked = isLinked(provider);
  const connectedAccountInfo = getLinkedAccountInformation(provider);

  return (
    <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">
        Social Account <span className="text-green-400 text-xs">(Optimized)</span>
      </h3>
      
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
              onClick={() => unlinkSocialAccount(provider)}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={() => linkSocialAccount(provider)}
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
});

UserProfileSocialAccountOptimized.displayName = 'UserProfileSocialAccountOptimized';

export default UserProfileSocialAccountOptimized;

