'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchBestSellers,
  fetchNewArrivals,
  fetchSpecialOffers,
  // fetchRecommendedTailors ,
  // fetchRecommendedSellers,
} from '@/lib/api';
import logger from '@/utils/consoleLogger';

interface BaseProduct {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface RatedProduct extends BaseProduct {
  rating: number;
  reviews: number;
}

interface NewProduct extends BaseProduct {
  isNew: boolean;
}

interface Tailor {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  image: string;
  specialties: string[];
  location: string;
  experience: string;
}

interface Seller {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  image: string;
  categories: string[];
  location: string;
  topBrands: string[];
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  color: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  items: RatedProduct[] | NewProduct[];
}

type Product = RatedProduct | NewProduct;

export default function FeaturedSections() {
  const { t } = useTranslation();
  const [bestSellers, setBestSellers] = useState<RatedProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<NewProduct[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [recommendedTailors, setRecommendedTailors] = useState<Tailor[]>([]);
  const [recommendedSellers, setRecommendedSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bestSellersData, newArrivalsData, specialOffersData] =
          await Promise.all([
            fetchBestSellers(),
            fetchNewArrivals(),
            fetchSpecialOffers(),
          ]);

        // Set default empty arrays for tailors and sellers since the API functions are commented out
        setRecommendedTailors([]);
        setRecommendedSellers([]);

        // Cast API responses to component-specific types
        setBestSellers(Array.isArray(bestSellersData) ? bestSellersData.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          rating: product.rating || 0,
          reviews: 0, // Default value since API doesn't provide review count
          image: product.main_image || product.images?.[0] || '/placeholder-product.jpg'
        })) : []);

        setNewArrivals(Array.isArray(newArrivalsData) ? newArrivalsData.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          isNew: true, // All items from new arrivals are new
          image: product.main_image || product.images?.[0] || '/placeholder-product.jpg'
        })) : []);

        // Transform special offers
        setSpecialOffers([
          {
            id: 'special-offer-1',
            title: t('featuredSections.offer1Title', 'Traditional Elegance'),
            description: t('featuredSections.offer1Description', 'Discover our finest collection of authentic Moroccan wear'),
            image: specialOffersData?.[0]?.main_image || specialOffersData?.[0]?.images?.[0] || '/placeholder-product.jpg',
            cta: t('featuredSections.offer1Cta', 'Shop Collection'),
            // Atlas Indigo dark editorial strip with amber radial bloom (DESIGN.md §6.4)
            color: 'bg-[hsl(var(--primary))]',
          },
          {
            id: 'special-offer-2',
            title: t('featuredSections.offer2Title', 'Festive Collection'),
            description: t('featuredSections.offer2Description', 'Perfect for special occasions and celebrations'),
            image: specialOffersData?.[1]?.main_image || specialOffersData?.[1]?.images?.[0] || '/placeholder-product.jpg',
            cta: t('featuredSections.offer2Cta', 'Explore Now'),
            // Sand/parchment surface (Atlas background token)
            color: 'bg-background',
          }
        ]);
      } catch (err) {
        setError(t('featuredSections.loadError', 'Failed to load featured sections. Please try again later.'));
        logger.error('Error fetching featured sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const sections: Section[] = [
    {
      id: 'best-sellers',
      title: t('featuredSections.bestSellers', 'Best Sellers'),
      description: t('featuredSections.bestSellersDesc', 'Our most popular traditional Moroccan wear'),
      items: bestSellers,
    },
    {
      id: 'new-arrivals',
      title: t('featuredSections.newArrivals', 'New Arrivals'),
      description: t('featuredSections.newArrivalsDesc', 'Latest additions to our collection'),
      items: newArrivals,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-rose-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-16 py-8">
      {/* Best Sellers and New Arrivals */}
      {sections.map((section) => (
        <section key={section.id} className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            </div>
            <Link
              href={`/products?category=${section.id}`}
              className="hidden sm:flex sm:items-center sm:text-sm sm:font-semibold sm:text-[hsl(var(--primary))] sm:hover:text-[hsl(var(--primary-container))] transition-colors duration-[220ms]"
            >
              {t('featuredSections.browseAll', 'Browse all')}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {section.items.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-background ring-1 ring-outline/20 px-6 py-12 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-atlas-primary/[0.1] ring-1 ring-atlas-primary/[0.2] mb-3">
                <Sparkles className="h-6 w-6 text-[hsl(var(--primary))]" aria-hidden="true" />
              </div>
              <h3
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('featuredSections.restocking', 'The atelier is restocking')}
              </h3>
              <p className="mt-1 text-sm text-gray-600 max-w-md mx-auto">
                {t('featuredSections.restockingDesc', 'Pieces from Tetouani and Fes ateliers are being curated. Check back shortly — or post a brief in the Open Souk and ateliers will come to you.')}
              </p>
              <Link
                href="/community/posts/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-container min-h-[44px] transition-colors duration-[220ms]"
              >
                {t('featuredSections.postBrief', 'Post a brief')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8">
              {section.items.map((product) => (
                <div key={product.id} className="group relative transition hover:-translate-y-0.5 hover:shadow-md duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] rounded-2xl overflow-hidden">
                  <div className="aspect-w-3 aspect-h-4 overflow-hidden rounded-2xl">
                    <Image
                      src={product.image}
                      alt={product.name}
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      width={300}
                      height={400}
                    />
                  </div>
                  <div className="mt-4 px-1">
                    <h3 className="text-sm font-medium text-foreground">
                      <Link href={`/products/${product.id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.name}
                      </Link>
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-gray-500">${product.price}</p>
                      {'isNew' in product && product.isNew && (
                        <span className="inline-flex items-center rounded-full bg-atlas-secondary/[0.15] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--on-secondary))] ring-1 ring-atlas-secondary/[0.3]">
                          {t('featuredSections.newBadge', 'New')}
                        </span>
                      )}
                    </div>
                    {'rating' in product && (
                      <div className="mt-1 flex items-center">
                        <div className="flex items-center">
                          {[0, 1, 2, 3, 4].map((rating) => (
                            <svg
                              key={rating}
                              className={`h-4 w-4 flex-shrink-0 ${
                                product.rating > rating ? 'text-amber-400' : 'text-gray-200'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 15.934L4.618 19.09l1.052-6.134L.34 7.934l6.157-.894L10 1.666l3.503 5.374 6.157.894-5.33 5.022 1.052 6.134L10 15.934z"
                              />
                            </svg>
                          ))}
                        </div>
                        <p className="ml-2 text-sm text-gray-500">{product.reviews} {t('featuredSections.reviews', 'reviews')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 sm:hidden">
            <Link
              href={`/products?category=${section.id}`}
              className="block text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-container))] transition-colors duration-[220ms]"
            >
              {t('featuredSections.browseAll', 'Browse all')}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </section>
      ))}

      {/* Special Offers */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-2 lg:gap-x-8">
          {specialOffers.map((offer) => (
            <div key={offer.id} className={`${offer.color} relative overflow-hidden rounded-2xl ring-1 ring-outline/20`}>
              {/* Background image — only render if a real source resolved, not the placeholder */}
              {offer.image && !offer.image.includes('placeholder-product') && (
                <div className="absolute inset-0">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover object-center opacity-60"
                    width={800}
                    height={400}
                  />
                </div>
              )}
              {/* Atlas radial overlay — amber + indigo blooms per DESIGN.md §6.4. Only on dark variant. */}
              {offer.color.includes('primary') && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, #fea619 0, transparent 45%), radial-gradient(circle at 80% 60%, #3b3b6d 0, transparent 50%)',
                  }}
                />
              )}
              <div className="relative px-6 py-16 sm:px-12 sm:py-24">
                <p
                  className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${
                    offer.color.includes('primary') ? 'text-[hsl(var(--secondary))]' : 'text-[hsl(var(--secondary))]'
                  }`}
                >
                  {t('featuredSections.editorial', 'Beldify Editorial')}
                </p>
                <h2
                  className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    offer.color.includes('primary') ? 'text-white' : 'text-foreground'
                  }`}
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {offer.title}
                </h2>
                <p
                  className={`mt-3 text-base sm:text-lg ${
                    offer.color.includes('primary') ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  {offer.description}
                </p>
                <Link
                  href={`/products?category=${offer.id}`}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--on-secondary))] hover:opacity-90 transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] min-h-[44px]"
                >
                  {offer.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Tailors Section */}
      {recommendedTailors.length > 0 && (
        <section className="mt-16 px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('featuredSections.recommendedTailors', 'Recommended Tailors')}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedTailors.map((tailor) => (
              <div key={tailor.id} className="group relative transition hover:-translate-y-0.5 hover:shadow-md duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] rounded-2xl overflow-hidden">
                <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-2xl bg-gray-100">
                  <Image
                    src={tailor.image}
                    alt={tailor.name}
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    width={400}
                    height={300}
                  />
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-lg font-medium text-foreground">{tailor.name}</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 flex-shrink-0 ${
                            i < Math.floor(tailor.rating) ? 'text-amber-400' : 'text-gray-200'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 15.934L4.618 19.09l1.052-6.134L.34 7.934l6.157-.894L10 1.666l3.503 5.374 6.157.894-5.33 5.022 1.052 6.134L10 15.934z"
                          />
                        </svg>
                      ))}
                    </div>
                    <p className="ml-2 text-sm text-gray-500">{tailor.reviews} {t('featuredSections.reviews', 'reviews')}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{tailor.location}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tailor.specialties?.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-atlas-primary/[0.08] text-[hsl(var(--primary))]"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Sellers Section */}
      {recommendedSellers.length > 0 && (
        <section className="mt-16 px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('featuredSections.recommendedSellers', 'Recommended Sellers')}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedSellers.map((seller) => (
              <div key={seller.id} className="group relative transition hover:-translate-y-0.5 hover:shadow-md duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] rounded-2xl overflow-hidden">
                <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-2xl bg-gray-100">
                  <Image
                    src={seller.image}
                    alt={seller.name}
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    width={400}
                    height={300}
                  />
                </div>
                <div className="mt-4 px-1">
                  <h3 className="text-lg font-medium text-foreground">{seller.name}</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 flex-shrink-0 ${
                            i < Math.floor(seller.rating) ? 'text-amber-400' : 'text-gray-200'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 15.934L4.618 19.09l1.052-6.134L.34 7.934l6.157-.894L10 1.666l3.503 5.374 6.157.894-5.33 5.022 1.052 6.134L10 15.934z"
                          />
                        </svg>
                      ))}
                    </div>
                    <p className="ml-2 text-sm text-gray-500">{seller.reviews} {t('featuredSections.reviews', 'reviews')}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{seller.location}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {seller.categories?.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-atlas-secondary/[0.12] text-[hsl(var(--on-secondary))]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{t('featuredSections.topBrands', 'Top Brands')}: {seller.topBrands?.join(', ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
