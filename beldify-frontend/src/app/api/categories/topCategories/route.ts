import { NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';
import { S3_CONFIG } from '@/config/constants';

// Define the expected structure for a category from the backend API
interface BackendCategory {
  id: number;
  category_name_en: string;
  category_name_ar: string;
  image: string;
  slug: string;
  parent_id: number | null;
  store_id: number;
  sub_categories?: BackendCategory[];
}

// Define the expected structure of the backend API response
interface BackendApiResponse {
  categories: BackendCategory[];
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

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
      // Handle cases where the image path might be relative to the public folder
      logger.warn(`Image path starts with '/': ${imageUrl}. Assuming it's not an S3 path.`);
    }

    return {
      ...category,
      image: imageUrl,
      // Recursively process subcategories if they exist
      sub_categories: category.sub_categories ? addBaseUrlToImages(category.sub_categories) : [],
    };
  });
};

export async function GET() {
  try {
    logger.log('Fetching top categories for homepage...');
    
    // Call the main backend API endpoint to get all categories
    const response = await api.get<BackendApiResponse>('/api/categories/getAllCategories');
    
    if (!response.data || !Array.isArray(response.data.categories)) {
       logger.error('Invalid or missing categories array from backend:', response.data);
       return NextResponse.json({ error: 'Invalid category data received from backend' }, { status: 500 });
    }

    // Add the S3 base URL to the image paths
    const categoriesWithFullUrls = addBaseUrlToImages(response.data.categories);
    
    // For top categories, we might want to limit the number or filter specific ones
    // For now, let's return all categories but this can be customized
    const topCategories = categoriesWithFullUrls.slice(0, 16); // Limit to first 16 categories
    
    logger.log(`Returning ${topCategories.length} top categories`);

    // Return the modified data in the expected format for the frontend
    return NextResponse.json({ categories: topCategories });

  } catch (error) {
    logger.error('Error fetching top categories:', error);
    if (axios.isAxiosError(error)) {
        logger.error('Axios error details:', error.response?.data || error.message);
        // Forward the status code from the backend error if available
        return NextResponse.json(
            { error: 'Failed to fetch top categories from backend', details: error.response?.data || error.message },
            { status: error.response?.status || 500 }
        );
    }
    return NextResponse.json(
        { error: 'Internal server error while fetching top categories', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
    );
  }
}
