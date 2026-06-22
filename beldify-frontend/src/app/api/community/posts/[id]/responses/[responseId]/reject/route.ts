import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  try {
    const postId = params.id;
    const responseId = params.responseId;
    const authToken = await getAuthToken();
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${API_URL}/api/v1/community/posts/${postId}/responses/${responseId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to reject response` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Error in POST /api/community/posts/${params.id}/responses/${params.responseId}/reject:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
