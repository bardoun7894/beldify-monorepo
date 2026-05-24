import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';

export async function POST(req: NextRequest) {
  try {
    // Get the channel name and socket ID from the request body
    const body = await req.json();
    const { channel_name, socket_id } = body;

    if (!channel_name || !socket_id) {
      return NextResponse.json(
        { error: 'Missing channel_name or socket_id' },
        { status: 400 }
      );
    }

    // Get the auth token from the request headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Forward the request to the backend broadcasting auth endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL!;
    const response = await fetch(`${backendUrl}/broadcasting/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        channel_name,
        socket_id
      })
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Broadcasting auth failed:', { status: response.status, error });
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      );
    }

    const authData = await response.json();

    // Return the auth signature from the backend
    return NextResponse.json(authData);

  } catch (error) {
    logger.error('Broadcasting auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}