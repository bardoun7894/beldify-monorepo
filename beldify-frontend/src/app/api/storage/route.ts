import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { CONTABO_CONFIG } from '@/config/constants';
import logger from '@/utils/consoleLogger';

// Allowlist of hosts this proxy is permitted to fetch from (SSRF protection)
const ALLOWED_PROXY_HOSTS = new Set([
  'eu2.contabostorage.com',
  'beldify.com',
  'pro.beldify.com',
]);

function isAllowedProxyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
           ALLOWED_PROXY_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

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
      const accountId = CONTABO_CONFIG.ACCOUNT_ID;
      const bucket = CONTABO_CONFIG.BUCKET;
      // Check if this is already a Contabo URL that includes the account ID
      if (path.includes(`${accountId}/${bucket}`)) {
        // Use it as is (legacy, but update to colon format)
        imageUrl = path.replace(`${accountId}/${bucket}`, `${accountId}:${bucket}`);
      }
      // This is a Contabo URL but missing the account ID (direct from backend API)
      else if (path.includes(`eu2.contabostorage.com/${bucket}`)) {
        // Fix the URL to include the account ID and colon
        imageUrl = path.replace(
          `eu2.contabostorage.com/${bucket}`,
          `eu2.contabostorage.com/${accountId}:${bucket}`
        );
      }
      // Any other full URL
      else {
        imageUrl = path;
      }
    }
    // Reject protocol-relative paths (open redirect vector) and proxy local paths
    else if (path.startsWith('/')) {
      if (path.startsWith('//')) {
        return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
      }
      return NextResponse.redirect(new URL(path, request.url));
    }
    // Otherwise, assume it's for Contabo storage
    else {
      imageUrl = `${CONTABO_CONFIG.BASE_URL}/${path}`;
    }

    // Enforce allowlist before making any outbound request (SSRF protection)
    if (!isAllowedProxyUrl(imageUrl)) {
      logger.error('Blocked proxy attempt to disallowed host:', imageUrl);
      return NextResponse.json({ error: 'Forbidden: image host not allowed' }, { status: 403 });
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
