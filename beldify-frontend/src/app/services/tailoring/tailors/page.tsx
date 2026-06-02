'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Star, MapPin, Briefcase, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import tailorService, { Tailor } from '@/services/tailorService';

/**
 * bug 10: this listing was 100% hardcoded mock data despite a working API + service.
 * It now fetches real tailors from /api/tailors and maps the PII-safe Resource fields
 * onto the existing Atlas card layout.
 */
interface TailorCard {
  id: number;
  name: string;
  specialty: string;
  location: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  featured: boolean;
}

function toCard(tailor: Tailor): TailorCard {
  return {
    id: tailor.id,
    name: tailor.business_name,
    specialty: tailor.specializations?.[0] ?? '',
    location: tailor.owner_name ?? '',
    imageUrl: tailor.profile_image || '/placeholder.png',
    rating: Number(tailor.rating) || 0,
    reviews: tailor.total_reviews ?? 0,
    featured: Boolean(tailor.is_verified),
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function TailorsPage() {
  const { t } = useTranslation();

  const [tailors, setTailors] = useState<TailorCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await tailorService.getTailors();
        const list: Tailor[] = response?.data ?? [];
        if (active) setTailors(list.map(toCard));
      } catch {
        if (active) setTailors([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const featuredTailors = tailors.filter((tailor) => tailor.featured);

  const filterLabels = [
    t('content.tailors.filterAll', 'All Tailors'),
    t('content.tailors.filterTraditional', 'Traditional'),
    t('content.tailors.filterModern', 'Modern'),
    t('content.tailors.filterWedding', 'Wedding'),
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Atlas editorial hero strip */}
      <div className="relative bg-indigo-950 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
            {t('content.tailors.eyebrow', 'Professional Services')}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('content.tailors.heroTitle', 'Expert Tailors')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-indigo-200">
            {t('content.tailors.heroSubtitle', 'Discover our network of master tailors who create bespoke garments with precision and artistry')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        {/* Filter / Search bar */}
        <div className="mb-12 rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-atlas-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 text-indigo-900 font-medium text-sm">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              {t('content.tailors.filterBy', 'Filter by:')}
            </div>
            <div className="flex flex-wrap gap-2">
              {filterLabels.map((label, i) => (
                <button
                  key={label}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    i === 0
                      ? 'bg-indigo-700 text-white shadow-atlas-sm'
                      : 'bg-white text-indigo-700 ring-1 ring-indigo-200 hover:ring-indigo-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative md:ms-auto">
              <Search className="h-4 w-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('content.tailors.searchPlaceholder', 'Search tailors...')}
                className="ps-9 pe-4 py-2.5 rounded-full text-sm text-gray-800 bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 focus:outline-none w-full md:w-64"
              />
            </div>
          </div>
        </div>

        {/* Featured Tailors */}
        {featuredTailors.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/60">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                {t('content.tailors.featured', 'Featured')}
              </span>
              <h2
                className="text-2xl font-bold text-indigo-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('content.tailors.featuredTailors', 'Featured Tailors')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredTailors.map((tailor) => (
                <div
                  key={tailor.id}
                  className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-atlas-sm overflow-hidden transition hover:-translate-y-0.5 hover:shadow-atlas-md group flex flex-col md:flex-row"
                >
                  <div className="md:w-2/5 relative overflow-hidden">
                    <Image
                      src={tailor.imageUrl || '/placeholder.png'}
                      alt={tailor.name}
                      width={300}
                      height={280}
                      className="w-full h-56 md:h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 start-3 rounded-full bg-amber-500 text-amber-950 text-xs font-bold px-2.5 py-1">
                      {t('content.tailors.featuredBadge', 'Featured')}
                    </span>
                  </div>
                  <div className="md:w-3/5 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-indigo-900 mb-2">{tailor.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <StarRating rating={tailor.rating} />
                        <span className="text-xs text-gray-500">({tailor.reviews} {t('content.tailors.reviews', 'reviews')})</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                        <Briefcase className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="font-medium text-indigo-900">{t('content.tailors.specialty', 'Specialty')}:</span>
                        {tailor.specialty}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="font-medium text-indigo-900">{t('content.tailors.location', 'Location')}:</span>
                        {tailor.location}
                      </p>
                    </div>
                    <Link
                      href={`/services/tailoring/${tailor.id}`}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold px-5 py-2.5 transition"
                    >
                      {t('content.tailors.viewProfile', 'View Profile')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tailors */}
        <div>
          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <h2
                className="text-2xl font-bold text-indigo-950"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('content.tailors.allTailors', 'All Expert Tailors')}
              </h2>
            </div>
            <div className="mt-3 h-px w-full bg-amber-200/70" aria-hidden />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 animate-pulse" />
              ))}
            </div>
          ) : tailors.length === 0 ? (
            <div className="text-center py-16 rounded-2xl ring-1 ring-amber-200/60 bg-white">
              <p className="text-gray-500 text-base">{t('content.tailors.noResults', 'No tailors found matching your criteria.')}</p>
              <button className="mt-4 rounded-full px-5 py-2.5 text-sm font-medium bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:ring-amber-400 transition">
                {t('content.tailors.clearFilters', 'Clear Filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tailors.map((tailor) => (
                <div
                  key={tailor.id}
                  className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-atlas-sm overflow-hidden transition hover:-translate-y-0.5 hover:shadow-atlas-md group flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={tailor.imageUrl || '/placeholder.png'}
                      alt={tailor.name}
                      width={400}
                      height={220}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {tailor.featured && (
                      <span className="absolute top-3 end-3 rounded-full bg-amber-500 text-amber-950 text-xs font-bold px-2.5 py-1">
                        {t('content.tailors.featuredBadge', 'Featured')}
                      </span>
                    )}
                    {/* Hover reveal CTA */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <Link
                        href={`/services/tailoring/${tailor.id}`}
                        className="bg-white/90 backdrop-blur-sm text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full shadow-atlas-md hover:bg-white transition"
                      >
                        {t('content.tailors.viewDetails', 'View Details')}
                      </Link>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">{tailor.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={tailor.rating} />
                      <span className="text-xs text-gray-500">({tailor.reviews})</span>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                        <span className="font-medium text-indigo-900">{t('content.tailors.specialty', 'Specialty')}:</span>
                        {tailor.specialty}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                        <span className="font-medium text-indigo-900">{t('content.tailors.location', 'Location')}:</span>
                        {tailor.location}
                      </p>
                    </div>
                    <div className="mt-auto pt-3 border-t border-amber-50">
                      <Link
                        href={`/services/tailoring/${tailor.id}`}
                        className="inline-flex items-center justify-center w-full gap-2 rounded-full ring-1 ring-indigo-200 text-indigo-700 text-sm font-medium py-2.5 hover:ring-indigo-400 hover:bg-indigo-50 transition"
                      >
                        {t('content.tailors.viewProfile', 'View Profile')}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-16 flex items-center justify-center gap-1">
          <a href="#" className="flex items-center justify-center h-9 w-9 rounded-full ring-1 ring-amber-200 text-indigo-700 hover:bg-amber-50 transition text-sm">
            &lsaquo;
          </a>
          {[1, 2, 3].map((page) => (
            <a
              key={page}
              href="#"
              className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-medium transition ${
                page === 1
                  ? 'bg-indigo-700 text-white'
                  : 'ring-1 ring-amber-200 text-indigo-700 hover:bg-amber-50'
              }`}
            >
              {page}
            </a>
          ))}
          <span className="text-gray-400 px-1">…</span>
          <a href="#" className="flex items-center justify-center h-9 w-9 rounded-full ring-1 ring-amber-200 text-indigo-700 hover:bg-amber-50 transition text-sm">
            &rsaquo;
          </a>
        </div>
      </div>
    </div>
  );
}
