import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest, { params }: { params: { shopId: string } }) {
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
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const postId = searchParams.get('post_id');

    const queryParams = new URLSearchParams({
      page,
      per_page: perPage,
      ...(postId && { post_id: postId })
    });

    const response = await axios.get(
      `${API_BASE_URL}/api/v1/buyer/messages/shops/${params.shopId}?${queryParams.toString()}`,
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
    logger.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { shopId: string } }) {
  try {
    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/v1/frontend/messages/mark-read/${messageId}`,
      { messageId },
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
    logger.error('Error marking conversation as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark conversation as read' },
      { status: error.response?.status || 500 }
    );
  }
} 