import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({
        message: 'User ID is required',
        status: 'error'
      }, { status: 400 });
    }

    const authToken = await getAuthToken(request);

    const queryParams = new URLSearchParams();
    queryParams.append('user_id', userId);
    queryParams.append('per_page', '100');

    const response = await fetch(`${API_URL}/api/v1/community/posts?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        message: 'Failed to fetch user posts',
        status: 'error'
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    logger.error('Error fetching user posts:', error);

    return NextResponse.json({
      message: 'Failed to fetch user posts',
      status: 'error'
    }, {
      status: 500
    });
  }
}
