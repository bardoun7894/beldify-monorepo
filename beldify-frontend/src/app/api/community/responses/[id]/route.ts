import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';

// TODO: The backend does NOT have generic CRUD endpoints for responses.
// Backend response endpoints are nested under posts:
//   GET  /api/v1/community/posts/{post}/responses
//   POST /api/v1/community/posts/{post}/responses/{response}/accept
//   POST /api/v1/community/posts/{post}/responses/{response}/reject
//
// This route only has responseId from the URL (/api/community/responses/[id]).
// To call the backend accept/reject endpoints, the caller must provide postId
// in the request body since it cannot be determined from the URL structure alone.

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const responseId = params.id;
    const authToken = await getAuthToken();

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, action } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required to perform actions on responses' },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: 'action must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}/api/v1/community/posts/${postId}/responses/${responseId}/${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to ${action} response` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Error in PUT /api/community/responses/${params.id}:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
