import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * GET handler for fetching banners from the Laravel backend
 * 
 * @param request NextRequest object
 * @returns NextResponse with banner data
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Accept-Language header from the request
    const acceptLanguage = request.headers.get('Accept-Language') || 'en';
    
    // Get the API URL from environment variables or use a default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ;
    
    // Make request to Laravel backend
    const response = await axios.get(`${apiUrl}/api/banners`, {
      headers: {
        'Accept-Language': acceptLanguage,
        'Accept': 'application/json',
      }
    });
    
    // Return the response data
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Failed to fetch banner data' 
      },
      { status: error.response?.status || 500 }
    );
  }
}
