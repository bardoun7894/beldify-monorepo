'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchSpecialOffers } from '@/lib/api';

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  color: string;
}

export default function SpecialOffers() {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const data = await fetchSpecialOffers();
        setOffers(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load special offers');
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  if (loading) return <div>Loading special offers...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h2 className="text-2xl font-bold text-gray-900">Special Offers</h2>

          <div className="mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
            {offers.map((offer) => (
              <div key={offer.id} className="group relative">
                <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-64">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover object-center"
                    width={500}
                    height={300}
                  />
                </div>
                <h3 className="mt-6 text-sm text-gray-500">
                  <Link href={offer.cta}>
                    <span className="absolute inset-0" />
                    {offer.title}
                  </Link>
                </h3>
                <p className="text-base font-semibold text-gray-900">{offer.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
