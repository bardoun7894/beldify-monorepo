import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios'; 
import logger from '@/utils/consoleLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * API Route to fetch shop details from the backend
 * This route acts as a proxy to avo  id CORS issues and handle authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shopId } = await params;
  try {
    // Get authorization header from the incoming request
    const authorization = request.headers.get('authorization');
    
    // Make a request to the backend API
    const response = await axios.get(
      `${API_BASE_URL}/api/shops/${shopId}`,
      {
        headers: {
          'Accept': 'application/json',
          ...(authorization && { Authorization: authorization }),
        },
      }
    );
    
    // Return the response data
    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error fetching shop details:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: 'Failed to fetch shop details' },
      { status: error.response?.status || 500 }
    );
  }
}
