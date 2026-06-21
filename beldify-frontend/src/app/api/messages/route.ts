import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';
import logger from '@/utils/consoleLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * API Route to fetch all conversations for the authenticated user
 * This route acts as a proxy to avoid CORS issues and handle authentication
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    let token = (await cookieStore).get('auth_token')?.value;
    
    if (!token) {
      // Try to get from Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    
    // Single buyer messaging endpoint — no cross-domain fallback
    const apiUrl = `${API_BASE_URL}/api/v1/buyer/messages/shops`;

    const response = await axios.get(apiUrl, {
      params: {
        page,
        per_page: perPage
      },
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error fetching conversations:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get token from cookies (token first to match localStorage, then auth_token as fallback)
    let token = request.cookies.get('token')?.value;

    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) {
      // Try to get from Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.error('No token found in cookies or headers');
      return NextResponse.json({ error: 'Unauthorized - Authentication required to send messages' }, { status: 401 });
    }

    const formData = await request.formData();

    // Log the form data being sent
    logger.log('Sending message with data:', {
      shop_id: formData.get('shop_id'),
      content: formData.get('content'),
      post_id: formData.get('post_id')
    });

    // Validate required fields
    if (!formData.get('shop_id')) {
      logger.error('Missing required field: shop_id');
      return NextResponse.json({ error: 'Missing shop_id' }, { status: 400 });
    }

    if (!formData.get('content')) {
      logger.error('Missing required field: content');
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Create a new FormData instance for axios
    const axiosFormData = new FormData();
    formData.forEach((value, key) => {
      if (key === 'content' && formData.get('content_encoding') === 'base64') {
        // Decode base64 content back to UTF-8
        try {
          const decodedContent = atob(value.toString());
          const utf8Content = new TextDecoder().decode(
            new Uint8Array([...decodedContent].map(char => char.charCodeAt(0)))
          );
          logger.log(`Adding decoded UTF-8 content: ${utf8Content.substring(0, 50)}...`);
          axiosFormData.append(key, utf8Content);
        } catch (error) {
          logger.error('Error decoding base64 content:', error);
          axiosFormData.append(key, value); // fallback to original
        }
      } else if (key !== 'content_encoding') {
        logger.log(`Adding to FormData: ${key} = ${value}`);
        axiosFormData.append(key, value);
      }
    });

    const response = await axios.post(`${API_BASE_URL}/api/v1/frontend/messages/send`, axiosFormData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // Don't set Content-Type for FormData - axios will set it with boundary
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    logger.log('Message sent successfully:', response.data);

    // Ensure we return the correct format
    if (response.data && response.data.status === 'success') {
      return NextResponse.json(response.data);
    }

    // If response doesn't have expected format, wrap it
    return NextResponse.json({
      status: 'success',
      message: response.data
    });
  } catch (error: any) {
    logger.error('Error sending message:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url,
      headers: error.config?.headers,
      data: error.config?.data
    });

    // Log the full axios error for debugging
    if (error.response) {
      logger.error('Backend response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      logger.error('No response received:', error.request);
    } else {
      logger.error('Request setup error:', error.message);
    }

    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send message';

    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get token from cookies (token first to match localStorage, then auth_token as fallback)
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      token = request.cookies.get('auth_token')?.value;
    }
    
    if (!token) {
      // Try to get from Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { shop_id } = body;
    
    const response = await axios.put(`${API_BASE_URL}/api/v1/frontend/messages/mark-read/${shop_id}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    logger.error('Error marking messages as read:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: error.response?.status || 500 }
    );
  }
}