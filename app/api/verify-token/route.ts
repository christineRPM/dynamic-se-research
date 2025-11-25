import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Dynamic environment configuration
const DYNAMIC_ENVIRONMENT_ID = '82cc6c53-aaf8-41f3-8796-72116b6cc710';
const JWKS_URL = `https://auth.zurikai.com/api/v0/sdk/${DYNAMIC_ENVIRONMENT_ID}/.well-known/jwks`;

interface DynamicJWTPayload {
  sub: string; // user ID
  iss: string; // issuer (Dynamic)
  aud: string; // audience (your app)
  exp: number; // expiration
  iat: number; // issued at
  environment_id?: string; // Dynamic environment ID
  wallet_public_key?: string;
  email?: string;
  verified_credentials?: Array<{
    type: string;
    format: string;
    address: string;
    chain: string;
    wallet_name?: string;
    wallet_provider?: string;
  }>;
}

// Simple JWT verification using jose library
async function verifyDynamicJWT(token: string): Promise<{ valid: boolean; payload?: DynamicJWTPayload; error?: string }> {
  try {
    // Create JWKS client
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    
    // Verify the JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: [
        'dynamic.xyz',
        'https://app.dynamic.xyz',
        'app.dynamic.xyz',
        'auth.zurikai.com',
        `https://auth.zurikai.com`,
        `auth.zurikai.com/${DYNAMIC_ENVIRONMENT_ID}`,
        `https://auth.zurikai.com/${DYNAMIC_ENVIRONMENT_ID}`
      ],
      audience: ['http://localhost:3000', 'https://localhost:3000', 'https://www.zurikai.com'], // Match the actual audience
    });

    return { 
      valid: true, 
      payload: payload as DynamicJWTPayload 
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    let token: string | undefined;
    let action: 'verify' | 'create' | 'destroy' = 'verify';

    // Check if this is a cookie management request
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.json();
        action = body.action || 'verify';
        token = body.token;
      } catch {
        // If JSON parsing fails, fall back to Authorization header
      }
    }

    // If no token from body, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    // Handle destroy action
    if (action === 'destroy') {
      const response = NextResponse.json({
        success: true,
        message: 'Session destroyed successfully',
        action: 'destroy',
        timestamp: new Date().toISOString()
      });
      response.cookies.delete('DYNAMIC_JWT_TOKEN');
      return response;
    }

    // Verify the JWT token (only if we have one)
    if (!token) {
      return NextResponse.json(
        { error: 'No JWT token provided' },
        { status: 400 }
      );
    }

    const verification = await verifyDynamicJWT(token);
    
    if (!verification.valid) {
      return NextResponse.json(
        { 
          error: 'Token verification failed', 
          details: verification.error,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Create unified response
    const response = NextResponse.json({
      success: true,
      message: action === 'create' ? 'JWT verified successfully' : 'Token verified successfully',
      action,
      user: {
        id: verification.payload?.sub,
        walletAddress: verification.payload?.verified_credentials?.[0]?.address,
        email: verification.payload?.email,
        walletProvider: verification.payload?.verified_credentials?.[0]?.wallet_provider,
        chain: verification.payload?.verified_credentials?.[0]?.chain,
        environmentId: verification.payload?.environment_id
      },
      verification: {
        method: 'JWKS + RSA-SHA256 signature verification',
        jwksEndpoint: JWKS_URL,
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        signatureVerified: true,
        jwksVerified: true,
        issuer: verification.payload?.iss,
        audience: verification.payload?.aud
      },
      timestamp: new Date().toISOString()
    });

    // Set the Dynamic JWT token as cookie (matching cookie-auth approach)
    const cookieOptions = {
      httpOnly: process.env.NODE_ENV === 'production', // Secure in production
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
      maxAge: (verification.payload?.exp || Math.floor(Date.now() / 1000) + 86400) - Math.floor(Date.now() / 1000),
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.zurikai.com' : undefined, // Allow subdomains in production
    };
    
    response.cookies.set('DYNAMIC_JWT_TOKEN', token, cookieOptions);

    return response;

  } catch (error) {
    console.error('Error during token verification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during verification',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current session status
export async function GET(request: NextRequest) {
  try {
    const jwtCookie = request.cookies.get('DYNAMIC_JWT_TOKEN');

    if (!jwtCookie) {
      return NextResponse.json(
        { 
          authenticated: false, 
          message: 'No Dynamic JWT cookie found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Verify the Dynamic JWT from cookie
    const verification = await verifyDynamicJWT(jwtCookie.value);
    
    if (!verification.valid) {
      return NextResponse.json(
        { 
          authenticated: false, 
          message: 'Invalid JWT in cookie',
          details: verification.error,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }
    
    // JWT is valid, return session info
    const payload = verification.payload!;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = payload.exp ? payload.exp - now : 0;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        walletAddress: payload.verified_credentials?.[0]?.address,
        environmentId: payload.environment_id
      },
      session: {
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
        timeRemaining,
        issuer: payload.iss
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { 
        error: 'Error checking session status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 