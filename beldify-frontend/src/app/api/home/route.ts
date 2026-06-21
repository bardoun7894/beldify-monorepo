import { NextResponse } from 'next/server';
import { fetchBestSellers, fetchMensProducts, fetchWomensProducts, fetchChildrensProducts, fetchMegaOffers } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUtils';
import logger from '@/utils/consoleLogger';
// API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Helper function to transform product data
const transformProductData = (products: any[]) => {
  return products.map((product: any) => ({
    id: product.id, 
    name: product.name,
    price: parseFloat(product.price),
    image: getImageUrl(product.main_image),
    main_image: product.main_image,
    isNew: product.is_new,
    category: product.category,
    category_ar: product.category_ar,
    description: product.description,
    has_discount: product.has_discount,
    discount_price: product.discount_price ? parseFloat(product.discount_price) : null,
  }));
};

// Import fetchNewArrivals from the API library instead of defining it here
import { fetchNewArrivals as fetchNewArrivalsFromApi } from '@/lib/api';

// Function to fetch new arrivals using our API library
async function fetchNewArrivals() {
  try {
    const newArrivals = await fetchNewArrivalsFromApi();
    return newArrivals;
  } catch (error) {
    logger.error('Failed to fetch new arrivals:', error);
    return [];
  }
}

// Function to fetch men's traditional clothes
async function fetchMensTraditional() {
  try {
    // Using our API function to fetch men's products
    const mensProducts = await fetchMensProducts();
    
    // Transform the data to match the expected format
    return mensProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      image: getImageUrl(product.main_image),
      main_image: product.main_image,
      isNew: product.is_featured, // Using is_featured as a proxy for isNew
      category: product.category,
      category_ar: product.category_ar,
      description: product.description,
      has_discount: product.has_discount,
      discount_price: product.discount_price ? parseFloat(product.discount_price.toString()) : null,
    }));
  } catch (error) {
    logger.error('Failed to fetch men\'s traditional clothes:', error);
    return [];
  }
}

// Function to fetch women's traditional clothes
async function fetchWomensTraditional() {
  try {
    // Using our API function to fetch women's products
    const womensProducts = await fetchWomensProducts();
    
    // Transform the data to match the expected format
    return womensProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      image: getImageUrl(product.main_image),
      main_image: product.main_image,
      isNew: product.is_featured, // Using is_featured as a proxy for isNew
      category: product.category,
      category_ar: product.category_ar,
      description: product.description,
      has_discount: product.has_discount,
      discount_price: product.discount_price ? parseFloat(product.discount_price.toString()) : null,
    }));
  } catch (error) {
    logger.error('Failed to fetch women\'s traditional clothes:', error);
    return [];
  }
}

// Function to fetch children's traditional clothes
async function fetchChildrensTraditional() {
  try {
    // Using our API function to fetch children's products
    const childrensProducts = await fetchChildrensProducts();
    
    // Transform the data to match the expected format
    return childrensProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      image: getImageUrl(product.main_image),
      main_image: product.main_image,
      isNew: product.is_featured, // Using is_featured as a proxy for isNew
      category: product.category,
      category_ar: product.category_ar,
      description: product.description,
      has_discount: product.has_discount,
      discount_price: product.discount_price ? parseFloat(product.discount_price.toString()) : null,
    }));
  } catch (error) {
    logger.error('Failed to fetch children\'s traditional clothes:', error);
    return [];
  }
}

// Function to fetch mega offers
async function fetchMegaProductOffers() {
  try {
    // Using our API function to fetch mega offers
    const megaOffers = await fetchMegaOffers();
    
    // Transform the data to match the expected format
    return megaOffers.map(product => ({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      image: getImageUrl(product.main_image),
      main_image: product.main_image,
      isNew: product.is_featured,
      category: product.category,
      category_ar: product.category_ar,
      description: product.description,
      has_discount: product.has_discount,
      discount_price: product.discount_price ? parseFloat(product.discount_price.toString()) : null,
      original_price: product.original_price ? parseFloat(product.original_price.toString()) : null,
    }));
  } catch (error) {
    logger.error('Failed to fetch mega product offers:', error);
    return [];
  }
}

// Mock data for the home page
const mockHomeData = {
  newArrivals: [
    {
      id: 5,
      name: 'Modern Takchita',
      price: 349.99,
      image: 'https://via.placeholder.com/400x400',
      isNew: true,
    },
    {
      id: 6,
      name: 'Silk Jabador',
      price: 199.99,
      image: 'https://via.placeholder.com/400x400',
      isNew: true,
    },
    {
      id: 7,
      name: 'Festive Caftan',
      price: 449.99,
      image: 'https://via.placeholder.com/400x400',
      isNew: true,
    },
  ],
  mensTraditional: [
    {
      id: 10,
      name: 'Classic Kandora',
      price: 299.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Men's Kandora",
    },
    {
      id: 11,
      name: 'Embroidered Thobe',
      price: 349.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Men's Kandora",
    },
    {
      id: 12,
      name: 'Premium Bisht',
      price: 499.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Men's Kandora",
    },
  ],
  womensTraditional: [
    {
      id: 13,
      name: 'Elegant Caftan',
      price: 399.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Caftan",
    },
    {
      id: 14,
      name: 'Beaded Takchita',
      price: 449.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Caftan",
    },
    {
      id: 15,
      name: 'Silk Jalabiya',
      price: 329.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Caftan",
    },
  ],
  childrensTraditional: [
    {
      id: 16,
      name: 'Kids Kandora',
      price: 149.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Children's Wear",
    },
    {
      id: 17,
      name: 'Girls Caftan',
      price: 169.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Children's Wear",
    },
    {
      id: 18,
      name: 'Festive Children Set',
      price: 189.99,
      image: 'https://via.placeholder.com/400x400',
      category: "Children's Wear",
    },
  ],
  recommendedTailors: [
    {
      id: 1,
      name: 'Elite Fashion Studio',
      rating: 4.8,
      reviews: 128,
      image: 'https://via.placeholder.com/400x400',
      specialties: ['Custom Suits', 'Traditional Wear'],
      location: 'Downtown Fashion District',
      experience: '15+ years',
    },
    {
      id: 2,
      name: 'Modern Stitch',
      rating: 4.6,
      reviews: 95,
      image: 'https://via.placeholder.com/400x400',
      specialties: ['Wedding Attire', 'Formal Wear'],
      location: 'Westside Mall',
      experience: '10+ years',
    },
    {
      id: 3,
      name: 'Perfect Fit Tailoring',
      rating: 4.9,
      reviews: 156,
      image: 'https://via.placeholder.com/400x400',
      specialties: ['Alterations', 'Bespoke Suits'],
      location: 'Fashion Avenue',
      experience: '20+ years',
    },
  ],
  recommendedSellers: [
    {
      id: 1,
      name: 'Luxury Boutique',
      rating: 4.9,
      reviews: 245,
      image: 'https://via.placeholder.com/400x400',
      categories: ['Designer Wear', 'Accessories'],
      location: 'Fashion District',
      topBrands: ['Gucci', 'Prada'],
    },
    {
      id: 2,
      name: 'Trendy Collections',
      rating: 4.7,
      reviews: 189,
      image: 'https://via.placeholder.com/400x400',
      categories: ['Casual Wear', 'Streetwear'],
      location: 'City Center Mall',
      topBrands: ['Nike', 'Adidas'],
    },
    {
      id: 3,
      name: 'Fashion Forward',
      rating: 4.6,
      reviews: 167,
      image: 'https://via.placeholder.com/400x400',
      categories: ['Contemporary', 'Vintage'],
      location: 'Downtown Plaza',
      topBrands: ['Zara', 'H&M'],
    },
  ],
  specialOffers: [
    {
      id: '1',
      title: 'Wedding Collection',
      description: 'Discover our exclusive wedding wear',
      image: 'https://via.placeholder.com/800x400',
      link: '/collections/wedding',
    },
    {
      id: '2',
      title: 'Custom Tailoring',
      description: 'Get your perfect fit with our expert tailors',
      image: 'https://via.placeholder.com/800x400',
      link: '/services/tailoring',
    },
  ],
};

export async function GET() {
  try {
    logger.log('Fetching home data...');

    // Fetch best sellers from the backend with better error handling
    const bestSellersRaw = await fetchBestSellers().catch((error) => {
      logger.error('Failed to fetch best sellers:', error);
      return [];
    });

    // Direct mapping for best sellers without URL transformation
    const bestSellers = bestSellersRaw.map(product => ({
      ...product,
      image: product.main_image || (product.images && product.images[0]) || '',
    }));

    // Fetch new arrivals from the API
    const newArrivalsRaw = await fetchNewArrivals().catch((error) => {
      logger.error('Failed to fetch new arrivals:', error);
      return []; // Use empty array as fallback
    });

    // Direct mapping for new arrivals without URL transformation
    const newArrivals = newArrivalsRaw.length > 0 ? newArrivalsRaw.map(product => ({
      ...product,
      image: product.main_image || (product.images && product.images[0]) || '',
    })) : mockHomeData.newArrivals;

    // Fetch men's traditional clothes
    const mensTraditional = await fetchMensTraditional().catch((error) => {
      logger.error('Failed to fetch men\'s traditional clothes:', error);
      return mockHomeData.mensTraditional; // Use mock data as fallback
    });

    // Fetch women's traditional clothes
    const womensTraditional = await fetchWomensTraditional().catch((error) => {
      logger.error('Failed to fetch women\'s traditional clothes:', error);
      return mockHomeData.womensTraditional; // Use mock data as fallback
    });

    // Fetch children's traditional clothes
    const childrensTraditional = await fetchChildrensTraditional().catch((error) => {
      logger.error('Failed to fetch children\'s traditional clothes:', error);
      return mockHomeData.childrensTraditional; // Use mock data as fallback
    });
    
    // Fetch mega product offers
    const megaOffers = await fetchMegaProductOffers().catch((error) => {
      logger.error('Failed to fetch mega product offers:', error);
      return []; // Empty array as fallback since we don't have mock data for this yet
    });

    // Create the response data
    const responseData = {
      ...mockHomeData,
      newArrivals: newArrivals.length > 0 ? newArrivals : mockHomeData.newArrivals,
      mensTraditional: mensTraditional.length > 0 ? mensTraditional : mockHomeData.mensTraditional,
      womensTraditional: womensTraditional.length > 0 ? womensTraditional : mockHomeData.womensTraditional,
      childrensTraditional: childrensTraditional.length > 0 ? childrensTraditional : mockHomeData.childrensTraditional,
      megaOffers,
      bestSellers
    };

    // Return the response with real data (or fallback to mock data if API calls failed)
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error in home API:', error);
    // Return a more detailed error response
    return NextResponse.json(
      {
        error: 'Failed to fetch home data',
        details: error instanceof Error ? error.message : 'Unknown error',
        mockData: true,
        bestSellers: [],
        ...mockHomeData
      },
      { status: 200 } // Return 200 with mock data instead of 500
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
