import { useSocialAccounts } from '@dynamic-labs/sdk-react-core';
import { useCallback, useRef, useEffect } from 'react';
import type { ProviderEnum } from '@dynamic-labs/types';

/**
 * 🛠️ CUSTOMER-SIDE WORKAROUND for Dynamic SDK v4.40.1
 * 
 * This wrapper hook stabilizes the function references from useSocialAccounts
 * to prevent unnecessary re-renders caused by the SDK's lack of proper memoization.
 * 
 * Problem: The SDK's useSocialAccounts returns new function instances on every render,
 * causing cascading re-renders throughout the component tree.
 * 
 * Solution: Store function references in refs and wrap them with useCallback to provide
 * stable references that can be safely used in dependency arrays and passed to children.
 * 
 * ⚠️ This is a temporary workaround. The proper fix should be implemented by Dynamic Labs.
 */
export function useStableSocialAccounts() {
  const socialAccounts = useSocialAccounts();
  
  // Store the latest functions in refs (these update without causing re-renders)
  const linkRef = useRef(socialAccounts.linkSocialAccount);
  const unlinkRef = useRef(socialAccounts.unlinkSocialAccount);
  const isLinkedRef = useRef(socialAccounts.isLinked);
  const getLinkedAccountInfoRef = useRef(socialAccounts.getLinkedAccountInformation);
  
  // Update refs when functions change (but don't trigger re-renders)
  useEffect(() => {
    linkRef.current = socialAccounts.linkSocialAccount;
    unlinkRef.current = socialAccounts.unlinkSocialAccount;
    isLinkedRef.current = socialAccounts.isLinked;
    getLinkedAccountInfoRef.current = socialAccounts.getLinkedAccountInformation;
  }, [
    socialAccounts.linkSocialAccount,
    socialAccounts.unlinkSocialAccount,
    socialAccounts.isLinked,
    socialAccounts.getLinkedAccountInformation,
  ]);
  
  // Create stable wrapper functions using useCallback
  const linkSocialAccount = useCallback((provider: ProviderEnum) => {
    return linkRef.current(provider);
  }, []);
  
  const unlinkSocialAccount = useCallback((provider: ProviderEnum) => {
    return unlinkRef.current(provider);
  }, []);
  
  const isLinked = useCallback((provider: ProviderEnum) => {
    return isLinkedRef.current(provider);
  }, []);
  
  const getLinkedAccountInformation = useCallback((provider: ProviderEnum) => {
    return getLinkedAccountInfoRef.current(provider);
  }, []);
  
  return {
    linkSocialAccount,
    unlinkSocialAccount,
    isLinked,
    getLinkedAccountInformation,
    // Pass through values that are already stable or primitive
    isProcessing: socialAccounts.isProcessing,
  };
}


