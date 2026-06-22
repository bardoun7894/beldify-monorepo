import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import axios from 'axios';
import logger from '@/utils/consoleLogger';

// Define the expected structure for a category from the backend API
interface BackendCategory {
  id: number;
  category_name_en: string;
  category_name_ar: string;
  image: string; // This is the relative path
  slug: string;
  parent_id: number | null;
  store_id: number;
  sub_categories?: BackendCategory[]; // Assuming subcategories might exist
  // Add other properties if needed
}

// Define the expected structure of the backend API response
interface BackendApiResponse {
  categories: BackendCategory[];
  // Add other potential top-level properties if they exist
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

import { S3_CONFIG } from '@/config/constants';

const S3_BASE_URL = S3_CONFIG.BASE_URL + '/';

// Helper function to recursively add base URL to image paths
const addBaseUrlToImages = (categories: BackendCategory[]): BackendCategory[] => {
  return categories.map(category => {
    let imageUrl = category.image;
    // Prepend base URL if it's not already an absolute URL and not empty
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
       // Ensure the 'categories/' prefix exists for all relative paths
       if (!imageUrl.startsWith('categories/')) {
          // Add the 'categories/' prefix if it's missing
          imageUrl = `categories/${imageUrl}`;
       }
       // Prepend the S3 base URL
       imageUrl = `${S3_BASE_URL}${imageUrl}`;
    } else if (imageUrl && imageUrl.startsWith('/')) {
      // Handle cases where the image path might be relative to the public folder (though unlikely based on API data)
      logger.warn(`Image path starts with '/': ${imageUrl}. Assuming it's not an S3 path.`);
    }

    return {
      ...category,
      image: imageUrl, // Update the image path
      // Recursively process subcategories if they exist
      sub_categories: category.sub_categories ? addBaseUrlToImages(category.sub_categories) : [],
    };
  });
};


// Reverted GET function: Removed request parameter and header forwarding
export async function GET() {
  try {
    // Removed header forwarding logic
    // const authorizationHeader = request.headers.get('Authorization');
    // const headers: Record<string, string> = {};
    // if (authorizationHeader) { ... }

    const response = await api.get<BackendApiResponse>('/api/categories/getAllCategories');
    if (!response.data || !Array.isArray(response.data.categories)) {
       logger.error('Invalid or missing categories array from main backend:', response.data);
       return NextResponse.json({ error: 'Invalid category data received from backend' }, { status: 500 });
    }

    // Add the S3 base URL to the image paths
    const categoriesWithFullUrls = addBaseUrlToImages(response.data.categories);
    return NextResponse.json({ categories: categoriesWithFullUrls });

  } catch (error) {
    logger.error('Error fetching or processing categories:', error);
    if (axios.isAxiosError(error)) {
        return NextResponse.json(
            { error: 'Failed to fetch categories from backend' },
            { status: error.response?.status || 500 }
        );
    }
    return NextResponse.json(
        { error: 'Internal server error while fetching categories' },
        { status: 500 }
    );
  }
}
