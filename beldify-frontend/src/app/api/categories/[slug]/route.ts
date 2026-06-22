import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Category slug is required' }, { status: 400 });
    }

    // Get search parameters from the request
    const searchParams = request.nextUrl.searchParams;
    
    // Forward the request to the production API with /api prefix
    const apiUrl = `${API_BASE_URL}/api/categories/${slug}`;
    logger.log('Forwarding to backend API URL:', apiUrl);
    
    // Get authorization header if present
    const authHeader = request.headers.get('authorization');
    
    // Set up headers for the backend request
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Get all the query parameters and format them for the backend request
    const queryParams = Object.fromEntries(searchParams.entries());
    logger.log('Forwarding with params:', queryParams);
    
    // Make the request using axios for better error handling
    const response = await axios.get(apiUrl, {
      headers,
      params: queryParams
    });

    logger.log('API Response Status:', response.status);
    logger.log('API Response Data Preview:', JSON.stringify(response.data).slice(0, 100) + '...');

    // Return the data from the backend
    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error in category API route:', error?.response?.data || error?.message || error);

    const status = error.response?.status || 500;

    return NextResponse.json(
      { error: 'Failed to fetch category data' },
      { status: status }
    );
  }
}
