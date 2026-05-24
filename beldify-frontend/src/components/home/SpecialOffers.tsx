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
    <div className="bg-amber-50/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-20 lg:max-w-none lg:py-20">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            Special Offers
          </h2>

          <div className="mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
            {offers.map((offer) => (
              <div key={offer.id} className="group relative transition hover:-translate-y-0.5 hover:shadow-md duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] rounded-2xl overflow-hidden">
                <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 sm:h-64">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    width={500}
                    height={300}
                  />
                </div>
                <h3 className="mt-6 text-sm text-amber-700 font-medium">
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
