'use client';

import { FC, useState } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/nextjs';

export const ClerkAuthToggle: FC = () => {
  const { isSignedIn, signOut } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleToggle = () => {
    if (isSignedIn) {
      signOut();
    } else {
      setShowSignIn(true);
    }
  };

  const handleClose = () => {
    setShowSignIn(false);
    setShowSignUp(false);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
          isSignedIn
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isSignedIn ? '🔓 Sign Out (Clerk)' : '🔐 Sign In (Clerk)'}
      </button>

      {/* Sign In Modal */}
      {showSignIn && !isSignedIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Sign In with Clerk</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setShowSignUp(true);
                }}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Don&apos;t have an account? Sign up instead
              </button>
            </div>
            <SignIn
              routing="hash"
              afterSignInUrl="/"
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-transparent shadow-none',
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUp && !isSignedIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Sign Up with Clerk</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowSignUp(false);
                  setShowSignIn(true);
                }}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Already have an account? Sign in instead
              </button>
            </div>
            <SignUp
              routing="hash"
              afterSignUpUrl="/"
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-transparent shadow-none',
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};


