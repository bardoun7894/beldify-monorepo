import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import { API_URL } from '@/config/constants';
import logger from '@/utils/consoleLogger';

/**
 * GET /api/community/sellers/[shopId]/stats
 *
 * Public proxy for GET /api/v1/community/sellers/{shopId}/stats.
 * Auth token forwarded when present but NOT required — the backend
 * endpoint is public.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  try {
    const authToken = await getAuthToken();

    const response = await fetch(
      `${API_URL}/api/v1/community/sellers/${shopId}/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch stats for seller ${shopId}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      `Error in GET /api/community/sellers/${shopId}/stats:`,
      error
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
