import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { CONTABO_CONFIG } from '@/config/constants';
import logger from '@/utils/consoleLogger';
// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  try {
    // Extract the path from the search parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
    }
    
    let imageUrl: string;
    
    // If it's a full URL, use it directly
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Check if this is already a Contabo URL that includes the account ID
      if (path.includes('c7737d32901c47be91e8263ad074fd38/beldify1storage')) {
        // Use it as is (legacy, but update to colon format)
        imageUrl = path.replace('c7737d32901c47be91e8263ad074fd38/beldify1storage', 'c7737d32901c47be91e8263ad074fd38:beldify1storage');
      }
      // This is a Contabo URL but missing the account ID (direct from backend API)
      else if (path.includes('eu2.contabostorage.com/beldify1storage')) {
        // Fix the URL to include the account ID and colon
        imageUrl = path.replace(
          'eu2.contabostorage.com/beldify1storage',
          'eu2.contabostorage.com/c7737d32901c47be91e8263ad074fd38:beldify1storage'
        );
      }
      // Any other full URL
      else {
        imageUrl = path;
      }
    }
    // Block protocol-relative paths (//host/…) — startsWith('/') matches them
    // but new URL('//evil.com/x', base) resolves to https://evil.com/x (open redirect).
    else if (path.startsWith('//')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    // If it's a local path, use it directly
    else if (path.startsWith('/')) {
      return NextResponse.redirect(new URL(path, request.url));
    }
    // Otherwise, assume it's for Contabo storage
    else {
      imageUrl = `${CONTABO_CONFIG.BASE_URL}/${path}`;
    }
    
      logger.log('Proxying image from:', imageUrl);
    
    // Get authorization header if present
    const authHeader = request.headers.get('authorization');
    
    // Set up headers for the request
    const headers: Record<string, string> = {};
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Make the request with proper headers
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers
    });
    
    // Get content type from the response or infer it
    let contentType = response.headers['content-type'];
    if (!contentType) {
      if (path.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (path.endsWith('.png')) {
        contentType = 'image/png';
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else {
        contentType = 'application/octet-stream';
      }
    }
    
    // Return the image with proper content type and caching
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    });
  } catch (error: any) {
    logger.error('Error proxying image:', error.message);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
