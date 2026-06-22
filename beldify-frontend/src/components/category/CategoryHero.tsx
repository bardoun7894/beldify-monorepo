'use client';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryHeroProps {
  category: {
    id: number;
    name: string;
    category_name_en: string;
    category_name_ar: string;
    description?: string;
    image: string;
    itemCount: number;
  };
  deals?: {
    id: number;
    title: string;
    description: string;
    image: string;
    link: string;
  }[];
  featuredProducts?: {
    id: number;
    name: string;
    image: string;
    price: number;
    discount_price?: number;
    link: string;
  }[];
}

export default function CategoryHero({
  category,
  deals = [],
  featuredProducts = [],
}: CategoryHeroProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Main Banner and Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Main Banner */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
              <Image
                src={category.image || '/images/categories/default-banner.jpg'}
                alt={category.category_name_en}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="p-8 text-white">
                  <h1 className="text-4xl font-bold mb-2">{category.category_name_en}</h1>
                  {category.description && <p className="text-xl mb-4">{category.description}</p>}
                  <p className="text-lg mb-4">
                    {category.itemCount} {t('category.items')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Deals */}
          <div className="grid grid-rows-2 gap-4">
            {deals.map((deal) => (
              <Link key={deal.id} href={deal.link}>
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                  <Image src={deal.image} alt={deal.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-xl font-bold">{deal.title}</h3>
                      <p className="text-sm">{deal.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('category.featured_products')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={product.link}>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-square">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      <div className="mt-2">
                        {product.discount_price ? (
                          <>
                            <p className="text-blue-600 font-bold">
                              {t('currency')} {product.discount_price}
                            </p>
                            <p className="text-gray-500 text-sm line-through">
                              {t('currency')} {product.price}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-900 font-bold">
                            {t('currency')} {product.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
