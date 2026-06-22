import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lastChecked = searchParams.get('last_checked');

    const queryParams = new URLSearchParams();
    if (lastChecked) {
      queryParams.append('last_checked', lastChecked);
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/v1/buyer/messages/unread-count?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: error.response?.status || 500 }
    );
  }
} 