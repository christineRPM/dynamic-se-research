import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the API bearer token from environment variable
    const bearerToken = process.env.DYNAMIC_BEARER_TOKEN;
    const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    
    if (!bearerToken) {
      return NextResponse.json(
        { error: 'Server configuration error: DYNAMIC_BEARER_TOKEN not configured' },
        { status: 500 }
      );
    }

    if (!environmentId) {
      return NextResponse.json(
        { error: 'Server configuration error: NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID not configured' },
        { status: 500 }
      );
    }

    // Get request body
    const body = await request.json();
    const { identifier, type, chains } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required (e.g., "email")' },
        { status: 400 }
      );
    }

    console.log('🔄 [API Route] Creating wallet:', { identifier, type, chains });
    console.log('🔐 [API Route] Using server-side API key');

    // Make the request to Dynamic's WaaS API
    const dynamicApiUrl = `https://app.dynamic.xyz/api/v0/environments/${environmentId}/waas/create`;
    
    const response = await fetch(dynamicApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        type,
        chains: chains || ['EVM'],
      }),
    });

    console.log('📡 [API Route] Dynamic API response status:', response.status);

    // Get the response body
    const responseText = await response.text();
    console.log('📦 [API Route] Dynamic API response:', responseText);

    // Parse the response if it's JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { message: responseText };
    }

    // Return the same status code and body from Dynamic's API
    return NextResponse.json(responseData, { status: response.status });

  } catch (error) {
    console.error('❌ [API Route] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


