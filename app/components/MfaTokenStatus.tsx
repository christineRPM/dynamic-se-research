'use client';

import { useEffect, useState } from 'react';
import { useIsLoggedIn, useIsMfaRequiredForAction } from '@dynamic-labs/sdk-react-core';
import { MFAAction } from '@dynamic-labs/sdk-api-core';

/**
 * Component to display MFA token status for transactions
 */
export function MfaTokenStatus() {
  const isLoggedIn = useIsLoggedIn();
  const isMfaRequiredForAction = useIsMfaRequiredForAction();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [mfaRequired, setMfaRequired] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoggedIn) {
        setHasToken(null);
        setMfaRequired(null);
        return;
      }

      setChecking(true);
      try {
        // Check if MFA is required
        const required = await isMfaRequiredForAction({
          mfaAction: MFAAction.WalletWaasSign,
        });
        setMfaRequired(required);

        // DON'T call getMfaToken() here - it consumes the token!
        // The token is automatically applied by Dynamic SDK
        // We only check if MFA is required, not if token exists
        if (required) {
          // Assume token exists if MFA was created (we track this via events)
          // Don't call getMfaToken() as it will consume the token
          setHasToken(null); // We can't check without consuming
        } else {
          setHasToken(null);
        }
      } catch (error) {
        console.error('Error checking MFA status:', error);
        setHasToken(null);
        setMfaRequired(null);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    // Only check MFA requirement, not token existence (to avoid consuming token)
    // Check less frequently since we're not consuming tokens
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn, isMfaRequiredForAction]);

  // Listen for MFA token creation events (without consuming the token)
  useEffect(() => {
    const handleMfaTokenCreated = () => {
      setHasToken(true);
    };

    window.addEventListener('mfa-token-created', handleMfaTokenCreated);
    return () => window.removeEventListener('mfa-token-created', handleMfaTokenCreated);
  }, []);

  if (!isLoggedIn || mfaRequired === null) {
    return null;
  }

  if (!mfaRequired) {
    return (
      <div className="mt-4 p-2 bg-green-900/20 border border-green-700/30 rounded text-xs">
        <p className="text-green-200">
          ✅ MFA not required for transactions
        </p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="mt-4 p-2 bg-gray-700/20 border border-gray-600/30 rounded text-xs">
        <p className="text-gray-300">Checking MFA status...</p>
      </div>
    );
  }

  if (hasToken) {
    return (
      <div className="mt-4 p-2 bg-green-900/20 border border-green-700/30 rounded text-xs">
        <p className="text-green-200 mb-1">
          ✅ MFA Token Available
        </p>
        <p className="text-green-300 text-[10px]">
          You can now perform transactions. The token will be automatically used.
        </p>
        <p className="text-green-300 text-[9px] mt-1 opacity-75">
          Note: Token is automatically applied - don't verify it (that would consume it)
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs">
      <p className="text-red-200 mb-1">
        ⚠️ MFA Token Required
      </p>
      <p className="text-red-300 mb-2">
        Go to <strong>External Auth</strong> tab and click <strong>&quot;Open Dynamic MFA UI&quot;</strong> to authenticate before sending transactions.
      </p>
      <p className="text-red-300 text-[10px]">
        Transactions will fail without an active MFA token.
      </p>
    </div>
  );
}

