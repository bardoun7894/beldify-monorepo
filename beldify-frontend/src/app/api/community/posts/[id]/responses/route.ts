import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const authToken = await getAuthToken();

    const response = await fetch(`${API_URL}/api/v1/community/posts/${postId}/responses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch responses for post ${postId}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Error in GET /api/community/posts/${params.id}/responses:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const authToken = await getAuthToken();
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const response = await fetch(`${API_URL}/api/v1/community/posts/${postId}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || `Failed to create response for post ${postId}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Error in POST /api/community/posts/${params.id}/responses:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
