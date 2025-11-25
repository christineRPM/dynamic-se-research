import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    // Get the API bearer token from environment variable
    const bearerToken = process.env.DYNAMIC_BEARER_TOKEN;
    
    if (!bearerToken) {
      return NextResponse.json(
        { error: 'Server configuration error: DYNAMIC_BEARER_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Get session ID from the request body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 [API Route] Revoking session:', sessionId);
    console.log('🔐 [API Route] Using server-side API key');

    // Make the request to Dynamic's API using the API bearer token
    const dynamicApiUrl = `https://app.dynamicauth.com/api/v0/sessions/${sessionId}/revoke`;
    
    const response = await fetch(dynamicApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
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


