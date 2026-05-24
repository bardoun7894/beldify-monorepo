import { NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';

// Use the same API_URL constant as in other API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET() {
  try {
    // Use the API_URL constant instead of hardcoding the URL
    const apiUrl = `${API_BASE_URL}/api/categories/header`;
    logger.log('Fetching header categories from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Cache-Control': 'max-age=3600',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error fetching header categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch header categories' },
      { status: 500 }
    );
  }
}
