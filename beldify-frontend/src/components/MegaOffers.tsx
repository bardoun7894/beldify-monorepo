'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Star, Tag } from 'lucide-react';
import '@/i18n/config';
import { useTheme } from '@/providers/ThemeProvider';

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

// Atlas-compliant test data — indigo-700 / amber-500 only
const TEST_MEGA_OFFERS: MegaOfferCollection[] = [
  {
    id: 1,
    title: 'Summer Fashion Sale',
    description: 'Up to 70% off on summer collection',
    banner_image: '',
    slug: 'summer-fashion-sale',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    featured_products: [
      {
        id: 1,
        name: 'Traditional Moroccan Kaftan',
        name_ar: 'قفطان مغربي تقليدي',
        description: 'Beautiful handcrafted traditional kaftan',
        description_ar: 'قفطان تقليدي مصنوع يدوياً',
        price: '1200',
        original_price: '2000',
        discount_price: '1200',
        discount_percentage: 40,
        has_discount: true,
        category: 'Traditional Wear',
        category_name: 'Traditional Wear',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
        main_image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
        images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop'],
        is_custom: false,
        is_featured: true,
        is_trending: true,
        rating: 4.5,
        review_count: 128,
        in_stock: true,
        slug: 'traditional-moroccan-kaftan'
      },
      {
        id: 2,
        name: 'Handwoven Berber Rug',
        name_ar: 'سجادة بربرية منسوجة يدوياً',
        description: 'Authentic handwoven Berber rug',
        description_ar: 'سجادة بربرية أصلية منسوجة يدوياً',
        price: '800',
        original_price: '1200',
        discount_price: '800',
        discount_percentage: 33,
        has_discount: true,
        category: 'Home Decor',
        category_name: 'Home Decor',
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
        main_image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop'],
        is_custom: false,
        is_featured: true,
        is_trending: false,
        rating: 4.8,
        review_count: 89,
        in_stock: true,
        slug: 'handwoven-berber-rug'
      },
      {
        id: 3,
        name: 'Moroccan Leather Bag',
        name_ar: 'حقيبة جلدية مغربية',
        description: 'Premium Moroccan leather handbag',
        description_ar: 'حقيبة يد جلدية مغربية فاخرة',
        price: '450',
        original_price: '600',
        discount_price: '450',
        discount_percentage: 25,
        has_discount: true,
        category: 'Accessories',
        category_name: 'Accessories',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        main_image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'],
        is_custom: false,
        is_featured: true,
        is_trending: true,
        rating: 4.3,
        review_count: 67,
        in_stock: true,
        slug: 'moroccan-leather-bag'
      },
      {
        id: 4,
        name: 'Argan Oil Set',
        name_ar: 'مجموعة زيت الأركان',
        description: 'Pure Moroccan argan oil beauty set',
        description_ar: 'مجموعة زيت الأركان المغربي الخالص',
        price: '180',
        original_price: '250',
        discount_price: '180',
        discount_percentage: 28,
        has_discount: true,
        category: 'Beauty',
        category_name: 'Beauty',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
        main_image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
        images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'],
        is_custom: false,
        is_featured: true,
        is_trending: false,
        rating: 4.7,
        review_count: 156,
        in_stock: true,
        slug: 'argan-oil-set'
      }
    ]
  },
  {
    id: 2,
    title: 'Festive Collection',
    description: 'Perfect for special occasions and celebrations',
    banner_image: '',
    slug: 'festive-collection',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    featured_products: [
      {
        id: 5,
        name: 'Embroidered Djellaba',
        name_ar: 'جلابة مطرزة',
        description: 'Handcrafted embroidered djellaba for special occasions',
        description_ar: 'جلابة مطرزة يدوياً للمناسبات الخاصة',
        price: '299',
        original_price: '399',
        discount_price: '299',
        discount_percentage: 25,
        has_discount: true,
        category: 'Traditional Wear',
        category_name: 'Traditional Wear',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        main_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
        is_custom: false,
        is_featured: true,
        is_trending: true,
        rating: 4.6,
        review_count: 234,
        in_stock: true,
        slug: 'embroidered-djellaba'
      },
      {
        id: 6,
        name: 'Moroccan Jewelry Set',
        name_ar: 'مجموعة مجوهرات مغربية',
        description: 'Traditional Moroccan silver jewelry set',
        description_ar: 'مجموعة مجوهرات فضية مغربية تقليدية',
        price: '199',
        original_price: '299',
        discount_price: '199',
        discount_percentage: 33,
        has_discount: true,
        category: 'Jewelry',
        category_name: 'Jewelry',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        main_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
        is_custom: false,
        is_featured: true,
        is_trending: false,
        rating: 4.4,
        review_count: 189,
        in_stock: true,
        slug: 'moroccan-jewelry-set'
      }
    ]
  }
];

// Atlas colors — always indigo-700 (#4338ca) + amber-500 (#f59e0b)
const ATLAS_PRIMARY = '#4338ca';
const ATLAS_ACCENT = '#f59e0b';

const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

// Shared product card — DRY extraction to eliminate duplicated grid code
function ProductCard({ product, locale }: { product: FeaturedProduct; locale: string }) {
  const { t } = useTranslation();
  const isAr = ['ar', 'ma'].includes(locale);
  const displayName = isAr ? (product.name_ar || product.name) : (product.name || product.name_ar);
  const imgSrc = product.main_image || product.image || '/placeholder-product.svg';

  return (
    <Link
      href={`/products/${product.slug}?locale=${locale}`}
      className="group/product block"
    >
      <div className="bg-white rounded-2xl overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] border border-gray-100 hover:border-indigo-100">
        {/* Product Image */}
        <div className="relative h-32 md:h-40 overflow-hidden bg-gray-50">
          <Image
            src={imgSrc}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover/product:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
            }}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.has_discount && product.discount_percentage && product.discount_percentage > 0 && (
              <span className="text-white text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-700">
                -{product.discount_percentage}%
              </span>
            )}
            {product.is_trending && (
              <span className="text-white text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500">
                {t('megaOffers.hot', 'HOT')}
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-2 leading-tight">
            {displayName}
          </h4>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-sm">
              {product.price} {t('currency')}
            </span>
            {product.has_discount && product.original_price && product.original_price !== product.price && (
              <span className="text-xs text-gray-400 line-through">
                {product.original_price}
              </span>
            )}
          </div>

          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
                />
              ))}
              <span className="text-[10px] text-gray-500 ml-0.5">({product.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Shared collection card — replaces two identical duplicated grids
function CollectionCard({ collection, locale }: { collection: MegaOfferCollection; locale: string }) {
  const { t } = useTranslation();
  const daysLeft = getDaysRemaining(collection.end_date);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] overflow-hidden border border-indigo-100 hover:border-indigo-200">
      {/* Collection Header */}
      <div className="relative px-6 py-5 bg-indigo-50/60 border-b border-indigo-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-xl font-bold text-indigo-700 mb-1 truncate"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {collection.title}
            </h3>
            <p className="text-sm text-gray-600">{collection.description}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-full text-white text-xs font-semibold bg-amber-500">
              {t('megaOffers.upTo70Off', 'UP TO 70% OFF')}
            </span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {daysLeft} {t('megaOffers.daysLeft', 'days left')}
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {collection.featured_products?.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-indigo-50 flex items-center justify-between">
          {collection.featured_products && collection.featured_products.length > 4 && (
            <span className="text-sm font-medium text-amber-600">
              +{collection.featured_products.length - 4} {t('megaOffers.moreItems', 'more items')}
            </span>
          )}
          <Link
            href={`/mega-offers/${collection.slug}?locale=${locale}`}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-full transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:shadow-md hover:-translate-y-0.5"
          >
            {t('megaOffers.viewCollection', 'View Collection')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const MegaOffers: React.FC<MegaOffersProps> = ({ megaOffers }) => {
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
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
          setOffers(TEST_MEGA_OFFERS);
        }
      } catch (err) {
        console.error('Error fetching mega offers:', err);
        setError(t('megaOffers.loadError', 'Failed to load mega offers'));
        setOffers(TEST_MEGA_OFFERS);
      } finally {
        setLoading(false);
      }
    };

    fetchMegaOffers();
  }, [megaOffers, searchParams, i18n.language, t]);

  if (!mounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto animate-pulse">
            <div className="text-center mb-12">
              <div className="h-4 bg-gray-200 rounded-full w-32 mx-auto mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-80 mx-auto mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-56 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="h-24 bg-gray-100"></div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="rounded-2xl overflow-hidden">
                        <div className="h-36 bg-gray-200"></div>
                        <div className="p-3">
                          <div className="h-3 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow + heading */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                {t('megaOffers.eyebrow', 'Special Collections')}
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('megaOffers.title', 'Mega Offers')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('megaOffers.subtitle', 'Discover amazing deals on premium products')}
            </p>
            {error && (
              <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm max-w-lg mx-auto">
                {error}
              </div>
            )}
          </div>

          {/* Two-column grid of collections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {offers.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} locale={i18n.language} />
            ))}
          </div>

          {/* View All Collections — only if > 4 offers */}
          {offers.length > 4 && (
            <div className="text-center mt-12">
              <Link
                href={`/mega-offers?locale=${i18n.language}`}
                className="group inline-flex items-center gap-3 bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>{t('megaOffers.viewAllCollections', 'View All Collections')}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MegaOffers;
