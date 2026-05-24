import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '12';
    const category_id = searchParams.get('category_id') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const color = searchParams.get('color') || '';
    const style = searchParams.get('style') || '';

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('per_page', per_page);
    if (category_id) queryParams.append('category_id', category_id);
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (color) queryParams.append('color', color);
    if (style) queryParams.append('style', style);

    const authToken = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/community/posts?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch community posts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error in GET /api/community/posts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const response = await fetch(`${API_URL}/api/v1/community/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create community post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error in POST /api/community/posts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
