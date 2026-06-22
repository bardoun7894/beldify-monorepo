import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const shopId = params.shopId;

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    let apiUrl = `${API_BASE_URL}/api/v1/buyer/messages/shops/${shopId}`;
    if (postId) {
      apiUrl += `?postId=${postId}`;
    }

    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const shopId = params.shopId;
    const body = await request.json();

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/buyer/messages/shops/${shopId}`,
      body,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: error.response?.status || 500 }
    );
  }
}
