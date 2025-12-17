import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 [API Route] Getting user:', userId);
    console.log('🔐 [API Route] Using server-side API key');

    // Make the request to Dynamic's API using the API bearer token
    // Reference: https://www.dynamic.xyz/docs/api-reference/users/get-a-user-by-id
    const dynamicApiUrl = `https://app.dynamicauth.com/api/v0/environments/${environmentId}/users/${userId}`;
    
    const response = await fetch(dynamicApiUrl, {
      method: 'GET',
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



