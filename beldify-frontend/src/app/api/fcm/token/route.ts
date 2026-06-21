import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';

export async function POST(req: NextRequest) {
  try {
    const { fcm_token } = await req.json();
    
    if (!fcm_token) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Send to Laravel backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fcm_token })
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.text();
      logger.error('Laravel API error:', errorData);
      return NextResponse.json({ error: 'Failed to update FCM token' }, { status: 400 });
    }
  } catch (error) {
    logger.error('FCM token API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 