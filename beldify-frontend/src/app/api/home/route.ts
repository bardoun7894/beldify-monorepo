import { NextResponse } from 'next/server';
import { fetchBestSellers, fetchMensProducts, fetchWomensProducts, fetchChildrensProducts, fetchMegaOffers } from '@/lib/api';
import axios from 'axios';
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

// Mock data for recommended tailors — used as error fallback only.
// Backend endpoint /api/recommended-tailors is live; mock only fires on fetch failure.
const mockRecommendedTailors = [
  {
    id: 1,
    name: 'Elite Fashion Studio',
    rating: 4.8,
    reviews: 128,
    image: '/images/placeholder-product.svg',
    specialties: ['Custom Suits', 'Traditional Wear'],
    location: 'Downtown Fashion District',
    experience: '15+ years',
  },
  {
    id: 2,
    name: 'Modern Stitch',
    rating: 4.6,
    reviews: 95,
    image: '/images/placeholder-product.svg',
    specialties: ['Wedding Attire', 'Formal Wear'],
    location: 'Westside Mall',
    experience: '10+ years',
  },
  {
    id: 3,
    name: 'Perfect Fit Tailoring',
    rating: 4.9,
    reviews: 156,
    image: '/images/placeholder-product.svg',
    specialties: ['Alterations', 'Bespoke Suits'],
    location: 'Fashion Avenue',
    experience: '20+ years',
  },
];

// Mock data for recommended sellers — used as error fallback only.
// Backend endpoint /api/recommended-sellers is live; mock only fires on fetch failure.
const mockRecommendedSellers = [
  {
    id: 1,
    name: 'Luxury Boutique',
    rating: 4.9,
    reviews: 245,
    image: '/images/placeholder-product.svg',
    categories: ['Designer Wear', 'Accessories'],
    location: 'Fashion District',
    topBrands: ['Gucci', 'Prada'],
  },
  {
    id: 2,
    name: 'Trendy Collections',
    rating: 4.7,
    reviews: 189,
    image: '/images/placeholder-product.svg',
    categories: ['Casual Wear', 'Streetwear'],
    location: 'City Center Mall',
    topBrands: ['Nike', 'Adidas'],
  },
  {
    id: 3,
    name: 'Fashion Forward',
    rating: 4.6,
    reviews: 167,
    image: '/images/placeholder-product.svg',
    categories: ['Contemporary', 'Vintage'],
    location: 'Downtown Plaza',
    topBrands: ['Zara', 'H&M'],
  },
];

// Mock data for the home page
const mockHomeData = {
  newArrivals: [
    {
      id: 5,
      name: 'Modern Takchita',
      price: 349.99,
      image: '/images/placeholder-product.svg',
      isNew: true,
    },
    {
      id: 6,
      name: 'Silk Jabador',
      price: 199.99,
      image: '/images/placeholder-product.svg',
      isNew: true,
    },
    {
      id: 7,
      name: 'Festive Caftan',
      price: 449.99,
      image: '/images/placeholder-product.svg',
      isNew: true,
    },
  ],
  mensTraditional: [
    {
      id: 10,
      name: 'Classic Kandora',
      price: 299.99,
      image: '/images/placeholder-product.svg',
      category: "Men's Kandora",
    },
    {
      id: 11,
      name: 'Embroidered Thobe',
      price: 349.99,
      image: '/images/placeholder-product.svg',
      category: "Men's Kandora",
    },
    {
      id: 12,
      name: 'Premium Bisht',
      price: 499.99,
      image: '/images/placeholder-product.svg',
      category: "Men's Kandora",
    },
  ],
  womensTraditional: [
    {
      id: 13,
      name: 'Elegant Caftan',
      price: 399.99,
      image: '/images/placeholder-product.svg',
      category: "Caftan",
    },
    {
      id: 14,
      name: 'Beaded Takchita',
      price: 449.99,
      image: '/images/placeholder-product.svg',
      category: "Caftan",
    },
    {
      id: 15,
      name: 'Silk Jalabiya',
      price: 329.99,
      image: '/images/placeholder-product.svg',
      category: "Caftan",
    },
  ],
  childrensTraditional: [
    {
      id: 16,
      name: 'Kids Kandora',
      price: 149.99,
      image: '/images/placeholder-product.svg',
      category: "Children's Wear",
    },
    {
      id: 17,
      name: 'Girls Caftan',
      price: 169.99,
      image: '/images/placeholder-product.svg',
      category: "Children's Wear",
    },
    {
      id: 18,
      name: 'Festive Children Set',
      price: 189.99,
      image: '/images/placeholder-product.svg',
      category: "Children's Wear",
    },
  ],
  specialOffers: [
    {
      id: '1',
      title: 'Wedding Collection',
      description: 'Discover our exclusive wedding wear',
      image: '/images/placeholder-product.svg',
      link: '/collections/wedding',
    },
    {
      id: '2',
      title: 'Custom Tailoring',
      description: 'Get your perfect fit with our expert tailors',
      image: '/images/placeholder-product.svg',
      link: '/services/tailoring',
    },
  ],
};

/**
 * getHomeDataPayload — returns the home page data object directly (no HTTP).
 *
 * Exported so that the Next.js server component (app/page.tsx) can call it
 * directly via import, avoiding the `await import('./api/home/route')` anti-
 * pattern that causes bundler warnings and forces a self-HTTP call on some
 * runtimes.  The GET handler below simply wraps this in NextResponse.json().
 */
export async function getHomeDataPayload() {
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

    // Fetch recommended tailors from live backend endpoint.
    // Falls back to mockRecommendedTailors on any error — backend may return
    // various shapes; we pass the raw payload through so HomeContent can render
    // whatever fields it recognises.
    const recommendedTailors = await axios
      .get(`${API_BASE_URL}/api/recommended-tailors`)
      .then((r) => {
        const items = r.data?.data ?? r.data?.tailors ?? (Array.isArray(r.data) ? r.data : []);
        return Array.isArray(items) && items.length > 0 ? items : mockRecommendedTailors;
      })
      .catch((error) => {
        logger.error('Failed to fetch recommended tailors:', error);
        return mockRecommendedTailors;
      });

    // Fetch recommended sellers from live backend endpoint.
    // Falls back to mockRecommendedSellers on any error.
    const recommendedSellers = await axios
      .get(`${API_BASE_URL}/api/recommended-sellers`)
      .then((r) => {
        const items = r.data?.data ?? r.data?.sellers ?? (Array.isArray(r.data) ? r.data : []);
        return Array.isArray(items) && items.length > 0 ? items : mockRecommendedSellers;
      })
      .catch((error) => {
        logger.error('Failed to fetch recommended sellers:', error);
        return mockRecommendedSellers;
      });

    // Create the response data
    return {
      ...mockHomeData,
      newArrivals: newArrivals.length > 0 ? newArrivals : mockHomeData.newArrivals,
      mensTraditional: mensTraditional.length > 0 ? mensTraditional : mockHomeData.mensTraditional,
      womensTraditional: womensTraditional.length > 0 ? womensTraditional : mockHomeData.womensTraditional,
      childrensTraditional: childrensTraditional.length > 0 ? childrensTraditional : mockHomeData.childrensTraditional,
      megaOffers,
      bestSellers,
      recommendedTailors,
      recommendedSellers,
    };
  } catch (error) {
    logger.error('Error building home data payload:', error);
    return {
      bestSellers: [],
      ...mockHomeData,
      recommendedTailors: mockRecommendedTailors,
      recommendedSellers: mockRecommendedSellers,
    };
  }
}

export async function GET() {
  const data = await getHomeDataPayload();
  return NextResponse.json(data);
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
