'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';
import { ArrowRightIcon, ChevronRightIcon, ClockIcon, SparklesIcon, StarIcon, TagIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/providers/ThemeProvider';

// Utility function to adjust color brightness
const adjustColorBrightness = (hex: string, percent: number): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const num = parseInt(hex, 16);
  const r = (num >> 16) + percent;
  const g = (num >> 8 & 0x00FF) + percent;
  const b = (num & 0x0000FF) + percent;
  
  // Ensure values stay within 0-255 range
  const newR = Math.max(0, Math.min(255, r));
  const newG = Math.max(0, Math.min(255, g));
  const newB = Math.max(0, Math.min(255, b));
  
  return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
};

// Mega Offer Collection type based on API response
interface MegaOfferCollection {
  id: number;
  title: string;
  description: string;
  banner_image: string;
  slug: string;
  start_date: string;
  end_date: string;
  color_theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  featured_products: FeaturedProduct[];
}

// Featured Product type
interface FeaturedProduct {
  id: number;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  price: string;
  original_price: string;
  discount_price: string | null;
  discount_percentage: number | null;
  has_discount: boolean;
  category: string;
  category_name: string | null;
  image: string | null;
  main_image: string | null;
  images: (string | null)[];
  is_custom: boolean;
  is_featured: boolean;
  is_trending: boolean;
  rating: number;
  review_count: number;
  in_stock: boolean;
  slug: string;
}

interface MegaOffersProps {
  megaOffers?: MegaOfferCollection[];
}

const MegaOffers: React.FC<MegaOffersProps> = ({ megaOffers }) => {
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [offers, setOffers] = useState<MegaOfferCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const locale = searchParams?.get('locale');
    if (locale) {
      i18n.changeLanguage(locale);
    }
  }, [searchParams, i18n]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch mega offers data
  useEffect(() => {
    const fetchMegaOffers = async () => {
      if (megaOffers && megaOffers.length > 0) {
        setOffers(megaOffers);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const locale = searchParams?.get('locale') || i18n.language || 'en';
        const response = await fetch(`/api/products/mega-offers?locale=${locale}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch mega offers');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setOffers(data.data);
        } else {
          // Use test data if API fails
          setOffers(testMegaOffers);
        }
      } catch (err) {
        console.error('Error fetching mega offers:', err);
        setError('Failed to load mega offers');
        // Use test data as fallback
        setOffers(testMegaOffers);
      } finally {
        setLoading(false);
      }
    };

    fetchMegaOffers();
  }, [megaOffers, searchParams, i18n.language]);

  if (!mounted) {
    return null;
  }

  // Test data with color themes
  const testMegaOffers: MegaOfferCollection[] = [
    {
      id: 1,
      title: "Summer Fashion Sale",
      description: "Up to 70% off on summer collection",
      banner_image: "",
      slug: "summer-fashion-sale",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      color_theme: {
        primary: 'emerald-600',
        secondary: 'emerald-700',
        accent: 'emerald-500'
      },
      featured_products: [
        {
          id: 1,
          name: "Traditional Moroccan Kaftan",
          name_ar: "قفطان مغربي تقليدي",
          description: "Beautiful handcrafted traditional kaftan",
          description_ar: "قفطان تقليدي مصنوع يدوياً",
          price: "1200",
          original_price: "2000",
          discount_price: "1200",
          discount_percentage: 40,
          has_discount: true,
          category: "Traditional Wear",
          category_name: "Traditional Wear",
          image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: true,
          rating: 4.5,
          review_count: 128,
          in_stock: true,
          slug: "traditional-moroccan-kaftan"
        },
        {
          id: 2,
          name: "Handwoven Berber Rug",
          name_ar: "سجادة بربرية منسوجة يدوياً",
          description: "Authentic handwoven Berber rug",
          description_ar: "سجادة بربرية أصلية منسوجة يدوياً",
          price: "800",
          original_price: "1200",
          discount_price: "800",
          discount_percentage: 33,
          has_discount: true,
          category: "Home Decor",
          category_name: "Home Decor",
          image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: false,
          rating: 4.8,
          review_count: 89,
          in_stock: true,
          slug: "handwoven-berber-rug"
        },
        {
          id: 3,
          name: "Moroccan Leather Bag",
          name_ar: "حقيبة جلدية مغربية",
          description: "Premium Moroccan leather handbag",
          description_ar: "حقيبة يد جلدية مغربية فاخرة",
          price: "450",
          original_price: "600",
          discount_price: "450",
          discount_percentage: 25,
          has_discount: true,
          category: "Accessories",
          category_name: "Accessories",
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: true,
          rating: 4.3,
          review_count: 67,
          in_stock: true,
          slug: "moroccan-leather-bag"
        },
        {
          id: 4,
          name: "Argan Oil Set",
          name_ar: "مجموعة زيت الأركان",
          description: "Pure Moroccan argan oil beauty set",
          description_ar: "مجموعة زيت الأركان المغربي الخالص",
          price: "180",
          original_price: "250",
          discount_price: "180",
          discount_percentage: 28,
          has_discount: true,
          category: "Beauty",
          category_name: "Beauty",
          image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: false,
          rating: 4.7,
          review_count: 156,
          in_stock: true,
          slug: "argan-oil-set"
        }
      ]
    },
    {
      id: 2,
      title: "Electronics Mega Deal",
      description: "Latest tech at unbeatable prices",
      banner_image: "",
      slug: "electronics-mega-deal",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      color_theme: {
        primary: 'purple-600',
        secondary: 'purple-700',
        accent: 'purple-500'
      },
      featured_products: [
        {
          id: 5,
          name: "Wireless Headphones",
          name_ar: "سماعات لاسلكية",
          description: "Premium wireless headphones with noise cancellation",
          description_ar: "سماعات لاسلكية فاخرة مع إلغاء الضوضاء",
          price: "299",
          original_price: "399",
          discount_price: "299",
          discount_percentage: 25,
          has_discount: true,
          category: "Electronics",
          category_name: "Electronics",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: true,
          rating: 4.6,
          review_count: 234,
          in_stock: true,
          slug: "wireless-headphones"
        },
        {
          id: 6,
          name: "Smart Watch",
          name_ar: "ساعة ذكية",
          description: "Advanced smartwatch with fitness tracking",
          description_ar: "ساعة ذكية متطورة مع تتبع اللياقة البدنية",
          price: "199",
          original_price: "299",
          discount_price: "199",
          discount_percentage: 33,
          has_discount: true,
          category: "Electronics",
          category_name: "Electronics",
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: false,
          rating: 4.4,
          review_count: 189,
          in_stock: true,
          slug: "smart-watch"
        }
      ]
    },
    {
      id: 3,
      title: "Home & Garden",
      description: "Transform your living space",
      banner_image: "",
      slug: "home-garden",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      color_theme: {
        primary: 'rose-600',
        secondary: 'rose-700',
        accent: 'rose-500'
      },
      featured_products: [
        {
          id: 7,
          name: "Indoor Plant Set",
          name_ar: "مجموعة نباتات داخلية",
          description: "Set of 3 indoor plants with planters",
          description_ar: "مجموعة من 3 نباتات داخلية مع أواني",
          price: "89",
          original_price: "120",
          discount_price: "89",
          discount_percentage: 26,
          has_discount: true,
          category: "Home & Garden",
          category_name: "Home & Garden",
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
          main_image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
          images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"],
          is_custom: false,
          is_featured: true,
          is_trending: true,
          rating: 4.5,
          review_count: 78,
          in_stock: true,
          slug: "indoor-plant-set"
        }
      ]
    }
  ];

  // Default color themes for fallback
  const defaultColorThemes = [
    { primary: 'indigo-600', secondary: 'indigo-700', accent: 'indigo-500' },
    { primary: 'emerald-600', secondary: 'emerald-700', accent: 'emerald-500' },
    { primary: 'purple-600', secondary: 'purple-700', accent: 'purple-500' },
    { primary: 'rose-600', secondary: 'rose-700', accent: 'rose-500' },
    { primary: 'amber-600', secondary: 'amber-700', accent: 'amber-500' },
    { primary: 'cyan-600', secondary: 'cyan-700', accent: 'cyan-500' },
  ];

  const getCollectionTheme = (collection: MegaOfferCollection, index: number) => {
    // If collection has a color theme, use it
    if (collection.color_theme) {
      return collection.color_theme;
    }
    // Otherwise use default Tailwind class names
    return defaultColorThemes[index % defaultColorThemes.length];
  };

  const getHexColor = (colorType: 'primary' | 'accent' | 'gray' | 'success' | 'error' | 'warning', shade: number = 500): string => {
    const fallbacks = {
      primary: '#4f46e5', 
      accent: '#f59e0b',
      gray: '#6b7280',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b'
    };

    if (!theme?.colors) {
      return fallbacks[colorType] || fallbacks.primary;
    }

    const colorGroup = theme.colors[colorType];
    if (!colorGroup) {
      return fallbacks[colorType] || fallbacks.primary;
    }

    if (typeof colorGroup === 'string') {
      return colorGroup;
    }

    if (typeof colorGroup === 'object') {
      const colorObj = colorGroup as Record<string, string>;
      const shadeKey = shade.toString();
      
      if (colorObj[shadeKey]) {
        return colorObj[shadeKey];
      }
      // Fallback to default shade if specific shade not found
      if (colorObj['DEFAULT']) {
        return colorObj['DEFAULT'];
      }
      // Fallback to 500 shade if default not found
      if (colorObj['500']) {
        return colorObj['500'];
      }
    }

    return fallbacks[colorType] || fallbacks.primary;
  };

  // Calculate days remaining for countdown
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-10 md:py-16 bg-gradient-to-b from-white via-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="text-center mb-12">
                <div className="h-8 bg-gray-200 rounded-full w-48 mx-auto mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-96 mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-64 mx-auto"></div>
              </div>
              <div className="space-y-12">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="h-40 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="bg-white rounded-2xl overflow-hidden">
                            <div className="h-48 bg-gray-200"></div>
                            <div className="p-4">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-6 bg-gray-200 rounded mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no offers, don't render anything
  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Clean Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gray-50 rounded-full">
              <TagIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">MEGA OFFERS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('megaOffers.title') || 'Special Collections'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('megaOffers.subtitle') || 'Discover amazing deals on premium products'}
            </p>
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm max-w-lg mx-auto">
                {error} - Showing sample offers for demonstration.
              </div>
            )}
          </div>

          {/* Two Separate Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* First Grid */}
            <div className="space-y-6">
              {offers.filter((_, index) => index % 2 === 0).map((collection, collectionIndex) => {
                const actualIndex = collectionIndex * 2;
                const collectionTheme = getCollectionTheme(collection, actualIndex);
                
                return (
                  <div 
                  key={collection.id} 
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border"
                  style={{ 
                    borderColor: `${getHexColor('primary')}20`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${getHexColor('primary')}60`;
                    e.currentTarget.style.boxShadow = `0 8px 25px -5px ${getHexColor('primary')}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${getHexColor('primary')}20`;
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Professional Collection Header with Backend Colors */}
                    <div 
                      className="relative px-6 py-5"
                      style={{
                        background: `linear-gradient(135deg, ${getHexColor('primary')}08, ${getHexColor('accent')}05)`,
                        borderBottom: `1px solid ${getHexColor('primary')}15`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 
                            className="text-xl font-bold mb-1"
                            style={{ color: getHexColor('primary') }}
                          >
                            {collection.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {collection.description}
                          </p>
                        </div>
                        
                        {/* Professional discount badge with backend colors */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm"
                            style={{ 
                              backgroundColor: getHexColor('accent'),
                              boxShadow: `0 2px 8px ${getHexColor('accent')}30`
                            }}
                          >
                            UP TO 70% OFF
                          </div>
                          <div 
                             className="text-xs font-medium px-2 py-1 rounded-md"
                             style={{ 
                               color: getHexColor('primary'),
                               backgroundColor: `${getHexColor('primary')}10`
                             }}
                           >
                            {getDaysRemaining(collection.end_date)} days left
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Clean Products Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {collection.featured_products?.slice(0, 4).map((product, index) => (
                        <Link 
                          href={`/products/${product.slug}?locale=${i18n.language}`}
                          key={product.id} 
                          className="group/product block"
                        >
                          <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 group-hover:border-gray-200">
                            {/* Product Image */}
                            <div className="relative h-32 md:h-40 overflow-hidden bg-gray-50">
                              <Image
                                src={product.main_image || product.image || '/placeholder-product.svg'}
                                alt={i18n.language === 'ar' ? (product.name_ar || product.name) : (product.name || product.name_ar)}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 group-hover/product:scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-product.svg';
                                }}
                              />
                              
                              {/* Professional badges with backend colors */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                  {product.has_discount && product.discount_percentage && product.discount_percentage > 0 && (
                                    <div 
                                      className="text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm"
                                      style={{ backgroundColor: getHexColor('accent') }}
                                    >
                                      -{product.discount_percentage}%
                                    </div>
                                  )}
                                  {product.is_trending && (
                                    <div 
                                       className="text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm"
                                       style={{ backgroundColor: getHexColor('accent') }}
                                     >
                                      HOT
                                    </div>
                                  )}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
                                {i18n.language === 'ar' ? (product.name_ar || product.name) : (product.name || product.name_ar)}
                              </h4>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-base">
                                    {product.price} {t('currency')}
                                  </span>
                                  {product.has_discount && product.original_price && product.original_price !== product.price && (
                                    <span className="text-sm text-gray-400 line-through">
                                      {product.original_price}
                                    </span>
                                  )}
                                </div>
                                
                                {product.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <StarIcon 
                                          key={i}
                                          className={`h-3 w-3 ${
                                            i < Math.floor(product.rating) 
                                              ? 'text-yellow-400 fill-current' 
                                              : 'text-gray-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({product.review_count})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Professional Action Section */}
                        <div 
                          className="mt-6 pt-4"
                          style={{ borderTop: `1px solid ${getHexColor('primary')}12` }}
                        >
                          <div className="flex items-center justify-between">
                            {collection.featured_products && collection.featured_products.length > 4 && (
                              <Link
                                href={`/mega-offers/${collection.slug}?locale=${i18n.language}`}
                                className="text-sm font-medium transition-colors"
                                style={{ 
                                 color: getHexColor('accent'),
                               }}
                                onMouseEnter={(e) => {
                                 e.currentTarget.style.color = getHexColor('primary');
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.color = getHexColor('accent');
                               }}
                              >
                                +{(collection.featured_products?.length || 0) - 4} more items
                              </Link>
                            )}
                            
                            <Link
                              href={`/mega-offers/${collection.slug}?locale=${i18n.language}`}
                              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-lg border"
                              style={{ 
                               backgroundColor: getHexColor('primary'),
                               borderColor: getHexColor('accent')
                             }}
                              onMouseEnter={(e) => {
                                const primaryColor = getHexColor('primary');
                                const darkerColor = adjustColorBrightness(primaryColor, -15);
                                e.currentTarget.style.backgroundColor = darkerColor;
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = getHexColor('primary');
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <span>View Collection</span>
                              <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                  </div>
                </div>
              );
            })}
            </div>
            
            {/* Second Grid */}
            <div className="space-y-6">
              {offers.filter((_, index) => index % 2 === 1).map((collection, collectionIndex) => {
                const actualIndex = collectionIndex * 2 + 1;
                const collectionTheme = getCollectionTheme(collection, actualIndex);
                
                return (
                  <div 
                    key={collection.id} 
                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border"
                    style={{ 
                      borderColor: `${getHexColor('primary')}20`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${getHexColor('primary')}60`;
                      e.currentTarget.style.boxShadow = `0 8px 25px -5px ${getHexColor('primary')}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${getHexColor('primary')}20`;
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    {/* Professional Collection Header with Backend Colors */}
                    <div 
                      className="relative px-6 py-5"
                      style={{
                         background: `linear-gradient(135deg, ${getHexColor('primary')}08, ${getHexColor('accent')}05)`,
                         borderBottom: `1px solid ${getHexColor('primary')}15`
                       }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 
                            className="text-xl font-bold mb-1"
                            style={{ color: getHexColor('primary') }}
                          >
                            {collection.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {collection.description}
                          </p>
                        </div>
                        
                        {/* Professional discount badge with backend colors */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm"
                            style={{ 
                              backgroundColor: getHexColor('accent'),
                              boxShadow: `0 2px 8px ${getHexColor('accent')}30`
                            }}
                          >
                            UP TO 70% OFF
                          </div>
                          <div 
                             className="text-xs font-medium px-2 py-1 rounded-md"
                             style={{ 
                               color: getHexColor('primary'),
                               backgroundColor: `${getHexColor('primary')}10`
                             }}
                           >
                            {getDaysRemaining(collection.end_date)} days left
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clean Products Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {collection.featured_products?.slice(0, 4).map((product, index) => (
                          <Link 
                            href={`/products/${product.slug}?locale=${i18n.language}`}
                            key={product.id} 
                            className="group/product block"
                          >
                            <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 group-hover:border-gray-200">
                              {/* Product Image */}
                              <div className="relative h-32 md:h-40 overflow-hidden bg-gray-50">
                                <Image
                                  src={product.main_image || product.image || '/placeholder-product.svg'}
                                  alt={i18n.language === 'ar' ? (product.name_ar || product.name) : (product.name || product.name_ar)}
                                  layout="fill"
                                  objectFit="cover"
                                  className="transition-transform duration-300 group-hover/product:scale-105"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-product.svg';
                                  }}
                                />
                                
                                {/* Professional badges with backend colors */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                  {product.has_discount && product.discount_percentage && product.discount_percentage > 0 && (
                                    <div 
                                      className="text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm"
                                      style={{ backgroundColor: getHexColor('accent') }}
                                    >
                                      -{product.discount_percentage}%
                                    </div>
                                  )}
                                  {product.is_trending && (
                                    <div 
                                       className="text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm"
                                       style={{ backgroundColor: getHexColor('accent') }}
                                     >
                                      HOT
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Product Info */}
                              <div className="p-4">
                                <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
                                  {i18n.language === 'ar' ? (product.name_ar || product.name) : (product.name || product.name_ar)}
                                </h4>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 text-base">
                                      {product.price} {t('currency')}
                                    </span>
                                    {product.has_discount && product.original_price && product.original_price !== product.price && (
                                      <span className="text-sm text-gray-400 line-through">
                                        {product.original_price}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {product.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <StarIcon 
                                            key={i}
                                            className={`h-3 w-3 ${
                                              i < Math.floor(product.rating) 
                                                ? 'text-yellow-400 fill-current' 
                                                : 'text-gray-200'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({product.review_count})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Professional Action Section */}
                      <div 
                        className="mt-6 pt-4"
                        style={{ borderTop: `1px solid ${getHexColor('primary')}12` }}
                      >
                        <div className="flex items-center justify-between">
                          {collection.featured_products && collection.featured_products.length > 4 && (
                            <Link
                              href={`/mega-offers/${collection.slug}?locale=${i18n.language}`}
                              className="text-sm font-medium transition-colors"
                              style={{ 
                                   color: getHexColor('accent'),
                                 }}
                              onMouseEnter={(e) => {
                                   e.currentTarget.style.color = getHexColor('primary');
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.color = getHexColor('accent');
                                 }}
                            >
                              +{(collection.featured_products?.length || 0) - 4} more items
                            </Link>
                          )}
                          
                          <Link
                            href={`/mega-offers/${collection.slug}?locale=${i18n.language}`}
                            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-lg border"
                            style={{ 
                                 backgroundColor: getHexColor('primary'),
                                 borderColor: getHexColor('accent')
                               }}
                            onMouseEnter={(e) => {
                              const primaryColor = getHexColor('primary');
                              const darkerColor = adjustColorBrightness(primaryColor, -15);
                              e.currentTarget.style.backgroundColor = darkerColor;
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = getHexColor('primary');
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <span>View Collection</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View All Collections Button - Only show if more than 4 mega offers */}
          {offers.length > 4 && (
            <div className="text-center mt-12">
              <Link
                href={`/mega-offers?locale=${i18n.language}`}
                className="group inline-flex items-center gap-3 bg-[#7c75ea] hover:bg-[#6a63d8] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>{t('megaOffers.viewAllCollections') || 'View All Collections'}</span>
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MegaOffers;
