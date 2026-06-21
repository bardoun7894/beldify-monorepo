import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';

// TODO: The backend does NOT have a PUT /responses/{id}/status endpoint.
// Backend only supports accept/reject via:
//   POST /api/v1/community/posts/{post}/responses/{response}/accept
//   POST /api/v1/community/posts/{post}/responses/{response}/reject
//
// The caller must provide postId in the request body and status as "accepted" or "rejected".
// This route maps the status value to the corresponding accept/reject backend endpoint.

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const responseId = params.id;
    const authToken = await getAuthToken(request);

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { status, postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required to update response status' },
        { status: 400 }
      );
    }

    // Map status to backend action
    const actionMap: Record<string, string> = {
      accepted: 'accept',
      rejected: 'reject',
    };
    const action = actionMap[status];

    if (!action) {
      return NextResponse.json(
        { error: 'status must be "accepted" or "rejected"' },
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
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || `Failed to update status for response ${responseId}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Error in PUT /api/community/responses/${params.id}/status:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
