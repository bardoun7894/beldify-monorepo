import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get('token')?.value ||
      req.cookies.get('auth_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data from the request
    const formData = await req.formData();

    // Extract fields from form data
    const recipientId = formData.get('recipient_id');
    const content = formData.get('content');
    const contentEncoding = formData.get('content_encoding');
    const postId = formData.get('post_id');

    // Decode content if base64 encoded
    let messageContent = content as string;
    if (contentEncoding === 'base64' && content) {
      try {
        // Decode base64 to UTF-8
        const binaryString = atob(content as string);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        messageContent = new TextDecoder().decode(bytes);
      } catch (error) {
        logger.error('Failed to decode base64 content:', error);
        messageContent = content as string;
      }
    }

    // Prepare the request body for the backend.
    // The buyer endpoint (/v1/buyer/messages/send) is shop-centric and requires
    // `shop_id` — on this buyer→shop route the conversation id IS the shop id, so
    // forward it as shop_id (the backend resolves the seller/recipient from it).
    // recipient_id is kept for backward compatibility / logging on the backend.
    const requestBody = {
      shop_id: recipientId,
      recipient_id: recipientId,
      content: messageContent,
      ...(postId && { post_id: postId })
    };

    // Forward the request to the backend API
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
    const response = await fetch(`${API_BASE_URL}/api/v1/buyer/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      logger.error('Backend message send failed:', { status: response.status, error });
      return NextResponse.json(
        {
          status: 'error',
          error: error.error || error.message || 'Failed to send message'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json({
      status: 'success',
      message: data.message || data
    });

  } catch (error) {
    logger.error('Message send error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}