'use client';

import { FC, useEffect, useRef } from 'react';
import { useExternalAuth, useIsLoggedIn, useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core';
import { useAuth, useUser } from '@clerk/nextjs';

/**
 * Component that automatically signs in to Dynamic when Clerk signs in
 * This runs in the background and is always mounted
 */
export const ClerkAutoSignIn: FC = () => {
  const { signInWithExternalJwt } = useExternalAuth();
  const { getToken, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const isLoggedInToDynamic = useIsLoggedIn();
  const hasAutoSignedIn = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    const autoSignInToDynamic = async () => {
      // Only auto-sign in once per Clerk session
      if (!isSignedIn || !clerkUser || !userId || hasAutoSignedIn.current || isProcessing.current) {
        return;
      }

      // Don't auto-sign in if already logged in to Dynamic
      if (isLoggedInToDynamic) {
        return;
      }

      isProcessing.current = true;
      hasAutoSignedIn.current = true;

      try {
        console.log('🔄 [ClerkAutoSignIn] Starting auto-sign in to Dynamic...');
        console.log('   Clerk User ID:', userId);

        const clerkJwt = await getToken();
        
        if (!clerkJwt) {
          throw new Error('Failed to get Clerk JWT token');
        }

        console.log('   ✅ Clerk JWT obtained');

        // Log authToken BEFORE signInWithExternalJwt
        const getAuthTokenBefore = getAuthToken();
        console.log('🔍 [ClerkAutoSignIn] BEFORE signInWithExternalJwt:');
        console.log('   getAuthToken():', getAuthTokenBefore);
        console.log('   getAuthToken() is null?', getAuthTokenBefore === null);

        // Sign in to Dynamic using Clerk's JWT
        const userProfile = await signInWithExternalJwt({
          externalUserId: userId,
          externalJwt: clerkJwt,
        });

        // Log the FULL return value from signInWithExternalJwt
        console.log('🔍 [ClerkAutoSignIn] signInWithExternalJwt RETURN VALUE:');
        console.log('   Full return:', userProfile);
        console.log('   Return type:', typeof userProfile);
        console.log('   Is null/undefined?', userProfile === null || userProfile === undefined);
        console.log('   Return keys:', userProfile ? Object.keys(userProfile) : 'N/A');
        console.log('   Return JSON:', JSON.stringify(userProfile, null, 2));

        // Log authToken AFTER signInWithExternalJwt
        const getAuthTokenAfter = getAuthToken();
        console.log('🔍 [ClerkAutoSignIn] AFTER signInWithExternalJwt:');
        console.log('   getAuthToken():', getAuthTokenAfter);
        console.log('   getAuthToken() is null?', getAuthTokenAfter === null);

        if (userProfile) {
          const profile = userProfile as unknown as { id?: string; userId?: string; wallets?: unknown[]; email?: string; [key: string]: unknown };
          console.log('   ✅ Successfully signed in to Dynamic!');
          console.log('   userProfile.id:', profile.id);
          console.log('   userProfile.userId:', profile.userId);
          console.log('   userProfile.wallets:', profile.wallets);
          console.log('   userProfile.wallets length:', profile.wallets?.length);
          console.log('   userProfile.email:', profile.email);
          
          if (getAuthTokenAfter === null) {
            console.warn('   ⚠️ WARNING: getAuthToken() returns NULL after signInWithExternalJwt');
          } else {
            console.log('   ✅ getAuthToken() returns a token');
          }
          
          // Check again after a delay
          setTimeout(() => {
            const finalGetAuthToken = getAuthToken();
            console.log('🔍 [ClerkAutoSignIn] AFTER 500ms delay:');
            console.log('   getAuthToken():', finalGetAuthToken);
            console.log('   getAuthToken() is null?', finalGetAuthToken === null);
          }, 500);
        } else {
          console.warn('   ⚠️ User profile not returned from signInWithExternalJwt');
        }
      } catch (err) {
        console.error('❌ [ClerkAutoSignIn] Error:', err);
        // Reset so it can try again
        hasAutoSignedIn.current = false;
      } finally {
        isProcessing.current = false;
      }
    };

    autoSignInToDynamic();
  }, [isSignedIn, clerkUser, userId, signInWithExternalJwt, getToken, isLoggedInToDynamic]);

  // Reset when Clerk signs out
  useEffect(() => {
    if (!isSignedIn) {
      hasAutoSignedIn.current = false;
      isProcessing.current = false;
    }
  }, [isSignedIn]);

  // This component doesn't render anything
  return null;
};

