'use client';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';

const featuredBrands = [
  {
    id: 1,
    name: 'Luxury Caftan',
    image: '/images/brands/luxury-caftan.png',
    discount: '30% OFF',
    link: '/brand/luxury-caftan',
  },
  {
    id: 2,
    name: 'Royal Collection',
    image: '/images/brands/royal-collection.png',
    discount: 'Up to 40%',
    link: '/brand/royal-collection',
  },
  {
    id: 3,
    name: 'Modern Elegance',
    image: '/images/brands/modern-elegance.png',
    discount: '25% OFF',
    link: '/brand/modern-elegance',
  },
];

const featuredCategories = [
  {
    id: 1,
    name: 'Wedding Caftans',
    image: '/images/categories/wedding-caftans.png',
    startingPrice: '999',
    link: '/category/wedding-caftans',
  },
  {
    id: 2,
    name: 'Party Caftans',
    image: '/images/categories/party-caftans.png',
    startingPrice: '599',
    link: '/category/party-caftans',
  },
  {
    id: 3,
    name: 'Casual Caftans',
    image: '/images/categories/casual-caftans.png',
    startingPrice: '299',
    link: '/category/casual-caftans',
  },
];

const deals = [
  {
    id: 1,
    title: 'Flash Sale',
    description: 'Limited time offers',
    image: '/images/deals/flash-sale.png',
    link: '/deals/flash-sale',
  },
  {
    id: 2,
    title: 'New Arrivals',
    description: 'Latest collections',
    image: '/images/deals/new-arrivals.png',
    link: '/new-arrivals',
  },
];

export default function Hero() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="bg-gray-100 py-6">
      <div className="container mx-auto px-4">
        {/* Main Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
              <Image
                src="/images/banners/main-banner.jpg"
                alt="Caftan Collection"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="p-8 text-white">
                  <h1 className="text-4xl font-bold mb-2">Luxury Caftans</h1>
                  <p className="text-xl mb-4">Discover our exclusive collection</p>
                  <Link
                    href="/category/luxury-caftans"
                    className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
      </div>
    </div>
  );
}
