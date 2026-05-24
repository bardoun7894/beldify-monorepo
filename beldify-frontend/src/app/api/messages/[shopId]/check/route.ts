import { NextRequest, NextResponse } from 'next/server';

// TODO: Backend route for checking new messages does not exist yet.
// Once implemented, proxy to GET {API_BASE_URL}/api/v1/buyer/messages/shops/{shopId}/check

export async function GET(request: NextRequest, { params }: { params: { shopId: string } }) {
  return NextResponse.json(
    { error: 'Not implemented — backend route does not exist yet' },
    { status: 501 }
  );
}
