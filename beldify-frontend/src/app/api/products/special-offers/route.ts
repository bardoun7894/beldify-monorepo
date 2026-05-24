import { NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

// Add fallback URL to ensure API calls work even if environment variable is not set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/special-offers`);
    return NextResponse.json(response.data);
  } catch (error) {
    logger.error('Error in special offers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  return new NextResponse(null, { status: 200 });
}
