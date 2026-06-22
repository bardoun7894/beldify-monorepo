'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import { Shop } from '@/lib/types/shop';
import { shopService } from '@/services/shopService';
import { useParams, useRouter } from 'next/navigation';
import { getImageUrl, handleImageError } from '@/utils/imageUtils';
import { default as ProductCard } from '@/components/products/ProductCard';
import {
  Star,
  BadgeCheck,
  MapPin,
  MessageCircle,
  ArrowRight,
  Heart,
  Filter,
} from 'lucide-react';
import logger from '@/utils/consoleLogger';
import toast from '@/utils/toast';

// ─── helpers ────────────────────────────────────────────────────────────────

function yearsOnBeldify(createdAt: string | undefined): number {
  if (!createdAt) return 1;
  const created = new Date(createdAt).getFullYear();
  const now = new Date().getFullYear();
  return Math.max(1, now - created);
}

function extractCity(shop: Shop): string {
  const raw =
    (shop as any).city ||
    shop.location ||
    shop.profile?.location ||
    shop.profile?.address ||
    '';
  if (!raw) return 'Morocco';
  // Take first comma-separated segment
  return raw.split(',')[0].trim() || 'Morocco';
}

const ATELIER_IMAGES = [
  'https://pro.beldify.com/storage/categories/category_4.jpg',
  'https://pro.beldify.com/storage/categories/category_7.jpg',
  'https://pro.beldify.com/storage/categories/category_14.jpg',
  'https://pro.beldify.com/storage/categories/category_8.jpg',
];

const STATIC_ATELIERS = [
  { name: 'Maison Marrakech', subtitle: 'Contemporary Kaftans · Marrakech', slug: 'maison-marrakech' },
  { name: "L'Artisan du Cuir", subtitle: 'Fine Leather Goods · Fez', slug: 'artisan-du-cuir' },
  { name: 'Zellige Studio', subtitle: 'Handcrafted Silver · Essaouira', slug: 'zellige-studio' },
  { name: 'Atlas Weavers', subtitle: 'Berber Textiles · Atlas Mts', slug: 'atlas-weavers' },
];

const TABS = [
  { id: 'all', label: 'All Products' },
  { id: 'caftans', label: 'Caftans' },
  { id: 'mens', label: "Men's" },
  { id: 'bespoke', label: 'Bespoke' },
  { id: 'reviews', label: 'Reviews' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const FILTER_PILLS = [
  { id: 'festival', label: 'Festival ready' },
  { id: 'new', label: 'New' },
  { id: 'sale', label: 'On sale' },
  { id: 'bespoke', label: 'Bespoke only' },
];

const STATIC_REVIEWS = [
  {
    name: 'Sarah M.',
    city: 'Paris',
    initial: 'S',
    text: '"The craftsmanship is breathtaking. I ordered a caftan for my wedding, and the hand-stitching is flawless. Truly a piece of art."',
  },
  {
    name: 'James L.',
    city: 'London',
    initial: 'J',
    text: '"Incredible quality on the djellaba. The wool is soft yet structured, and the details are impeccable. The reputation is well-deserved."',
  },
  {
    name: 'Amina R.',
    city: 'Casablanca',
    initial: 'A',
    text: '"Their bespoke service was a dream. They guided me through fabric choices and measurements via message, and the final piece fits perfectly."',
  },
];

// ─── auth helper (preserved from original) ──────────────────────────────────

async function verifyAuthentication(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const sources = ['authToken', 'auth_token', 'token', 'access_token'];
  let token: string | null = null;
  for (const src of sources) {
    const found = localStorage.getItem(src);
    if (found) { token = found; break; }
  }
  if (!token) return false;
  try {
    return token.length >= 10 && token !== 'null' && token !== 'undefined';
  } catch { return false; }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const params = useParams();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  // ── follow helpers (preserved from original) ──────────────────────────────

  const checkFollowStatus = async (shopId: number) => {
    try {
      const isAuth = await verifyAuthentication();
      if (!isAuth) { setIsFollowing(false); return; }
      const res = await shopService.checkFollowing(shopId);
      if (res.error) { setIsFollowing(false); return; }
      if (res.isAuthenticated !== false) {
        setIsFollowing(res.data?.isFollowing || false);
      } else {
        setIsFollowing(false);
      }
    } catch { setIsFollowing(false); }
  };

  const handleFollow = async () => {
    if (!shop?.id || isFollowActionLoading) return;
    const isAuth = await verifyAuthentication();
    if (!isAuth) {
      toast.error(t('shops.follow.login_required'), { duration: 3000, position: 'bottom-center', id: 'auth-login-required' });
      const currentPath = window.location.pathname;
      setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`), 1500);
      return;
    }
    setIsFollowActionLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      const res = prev ? await shopService.unfollowShop(shop.id) : await shopService.followShop(shop.id);
      if (res?.error) { setIsFollowing(prev); toast.error(res.error || t('shops.follow.action_failed')); return; }
      if (res?.isAuthenticated === false) {
        setIsFollowing(prev);
        toast.error(t('shops.follow.auth_error'), { duration: 3000, id: 'auth-error' });
        setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`), 1500);
        return;
      }
      toast.success(prev ? t('shops.follow.unfollow_success') : t('shops.follow.success'), { duration: 2000, id: 'follow-success' });
      setTimeout(async () => {
        try {
          const ver = await shopService.checkFollowing(shop.id);
          if (ver.data?.isFollowing !== undefined) setIsFollowing(ver.data.isFollowing);
        } catch { /* silent */ }
      }, 1000);
    } catch { setIsFollowing(isFollowing); toast.error(t('shops.follow.action_failed')); }
    finally { setIsFollowActionLoading(false); }
  };

  // ── fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!params?.name) return;
    const fetchShop = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const storeName = decodeURIComponent(params.name as string);
        logger.log('Fetching shop with name:', storeName);
        const response = await shopService.getShopByName(storeName);
        if (response.error) { setError(t('errors.general', 'An error occurred')); return; }
        if (response.data?.store) {
          const shopData: Shop = {
            ...response.data.store,
            created_at: (response.data.store as any).created_at || new Date().toISOString(),
            updated_at: (response.data.store as any).updated_at || new Date().toISOString(),
            store_type: { id: 0, name: '', name_ar: undefined, slug: '', capabilities: [] },
            profile: {
              store_name: '',
              store_name_ar: undefined,
              store_logo: null,
              cover_image: undefined,
              description: null,
              description_ar: undefined,
              contact_email: null,
              contact_phone: null,
              website: null,
              address: undefined,
              location: undefined,
              business_hours: {},
              shipping_methods: [],
              payment_methods: [],
              return_policy: null,
              shipping_policy: null,
              is_verified: false,
              is_featured: undefined,
              status: 'suspended',
              social_media: {},
              business_categories: [],
              rating: 0,
              total_reviews: 0,
              total_sales: 0,
              store_locations: [],
            },
            status: '',
            is_active: false,
          };
          setShop(shopData);
          if (response.data.store.id) await checkFollowStatus(response.data.store.id);
        } else {
          setError(t('shops.not_found'));
        }
      } catch (err: any) {
        logger.error('Error in fetchShop:', err);
        setError(t('shops.error_message'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchShop();
  }, [params?.name, t]);

  // ── derived data ───────────────────────────────────────────────────────────

  const allProducts = shop?.products || [];
  const filteredProducts = activeTab === 'reviews'
    ? []
    : allProducts.filter((p) => {
        if (activeTab === 'all') return true;
        const cat = (p.category || p.category_name || '').toLowerCase();
        if (activeTab === 'caftans') return cat.includes('caftan') || cat.includes('kaftan');
        if (activeTab === 'mens') return cat.includes("men") || cat.includes('djellaba');
        if (activeTab === 'bespoke') return cat.includes('bespoke') || p.is_bespoke;
        return true;
      });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const rating = shop?.rating ?? shop?.profile?.rating ?? 0;
  const reviewsCount = shop?.reviews_count ?? shop?.total_reviews ?? shop?.profile?.total_reviews ?? 0;
  const productsCount = shop?.products_count ?? allProducts.length;
  const years = yearsOnBeldify(shop?.created_at);
  const isVerified = shop?.is_verified ?? shop?.profile?.is_verified ?? false;
  const city = shop ? extractCity(shop) : 'Morocco';

  const rawDescription = shop?.description ?? shop?.profile?.description ?? '';
  const descParagraphs = rawDescription
    ? rawDescription.split(/\n\n+/).filter(Boolean)
    : ['This atelier brings the finest Moroccan craftsmanship directly to you. Each piece is hand-stitched with care and precision.'];

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── loading / error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--accent))]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"
            role="status"
            aria-label={t('common.loading', 'Loading…')}
          />
          <p className="text-sm text-[hsl(var(--muted-foreground))] tracking-wide">{t('common.loading', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--accent))] gap-4 px-6">
        <div
          className="text-5xl font-bold text-[hsl(var(--primary))] font-heading"
        >
          404
        </div>
        <p className="text-xl font-semibold text-[hsl(var(--foreground))]">{error || t('shops.not_found', 'Shop not found')}</p>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">{t('shops.try_again', 'Please try again later')}</p>
        <Link
          href="/shops"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2"
        >
          {t('shops.browse', 'Browse ateliers')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const shopId = shop?.id;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[hsl(var(--accent))] min-h-screen">

      {/* ── 1. Cover Hero ──────────────────────────────────────────────────── */}
      <section className="relative h-72 sm:h-[28rem] overflow-hidden bg-[hsl(var(--indigo-950))]">
        <Image
          src={getImageUrl(shop.cover_image || shop.profile?.cover_image, '/images/hero-atelier.jpg')}
          alt={t('shop.cover_alt', 'Atelier cover — {{name}}', { name: shop.name })}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          onError={handleImageError}
        />
        {/* Indigo gradient overlay — from-[hsl(var(--indigo-950))]/85 is safe (no internal slash in arbitrary) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, hsl(246 50% 21% / 0.88) 0%, hsl(243 47% 34% / 0.45) 50%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        {/* Verified pill — top end (RTL-safe) */}
        {isVerified && (
          <div className="absolute top-6 end-6 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-900 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('shop.verified', '✓ VERIFIED BY BELDIFY')}
            </span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="max-w-7xl mx-auto px-6 pb-8">
            <span className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium block mb-3">
              {t('shop.kicker', 'ATELIER · {{city}}', { city })}
            </span>
            <h1 className="font-heading text-white text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-md">
              {shop.name}
            </h1>
            <p className="mt-2 text-indigo-100 text-base sm:text-lg max-w-xl">
              {(shop as any).tagline || t('shop.tagline_default', 'Hand-stitched caftans & traditional men\'s wear · Crafting since 1958')}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Stats Card ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 sm:-mt-16 relative z-10">
        <div className="bg-white ring-1 ring-amber-200 rounded-2xl p-6 editorial-shadow">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-amber-100">
            {/* Rating */}
            <div className="text-center px-2">
              <div className="font-heading text-3xl font-bold text-[hsl(var(--foreground))]">
                {rating > 0 ? rating.toFixed(1) : '—'}{' '}
                <span className="text-amber-500 text-2xl" aria-hidden="true">★</span>
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-[hsl(var(--accent-foreground))] font-medium">
                {reviewsCount > 0
                  ? t('shop.stats.reviews', '{{count}} reviews', { count: reviewsCount })
                  : t('shop.stats.no_reviews', 'No reviews yet')}
              </div>
            </div>
            {/* Products */}
            <div className="text-center px-2">
              <div className="font-heading text-3xl font-bold text-[hsl(var(--foreground))]">
                {productsCount || '—'}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-[hsl(var(--accent-foreground))] font-medium">
                {t('shop.stats.products', 'Products')}
              </div>
            </div>
            {/* Years */}
            <div className="text-center px-2">
              <div className="font-heading text-3xl font-bold text-[hsl(var(--foreground))]">
                {years}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-[hsl(var(--accent-foreground))] font-medium">
                {t('shop.stats.years', 'Years on Beldify')}
              </div>
            </div>
            {/* Response */}
            <div className="text-center px-2">
              <div className="font-heading text-3xl font-bold text-[hsl(var(--foreground))]">
                24h
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-[hsl(var(--accent-foreground))] font-medium">
                {t('shop.stats.response', 'Response time')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. About Section ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-start">
        {/* Left: text */}
        <div>
          <span className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-medium">
            {t('shop.about_kicker', 'OUR STORY')}
          </span>
          <h2 className="font-heading mt-3 text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
            {t('shop.about_heading', 'Inside {{name}}', { name: shop.name })}
          </h2>
          <div className="mt-6 space-y-4">
            {descParagraphs.map((para, i) => (
              <p key={i} className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                {para}
              </p>
            ))}
          </div>
          {/* Follow CTA */}
          <button
            onClick={handleFollow}
            disabled={isFollowActionLoading}
            aria-pressed={isFollowing}
            aria-label={
              isFollowActionLoading
                ? t('common.loading', 'Loading…')
                : isFollowing
                  ? t('shops.shop.following', 'Following this atelier')
                  : t('shops.shop.follow', 'Follow this atelier')
            }
            className={`mt-8 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--primary))] ${
              isFollowing
                ? 'bg-white ring-1 ring-amber-200 text-[hsl(var(--foreground))] hover:bg-amber-50'
                : 'bg-[hsl(var(--primary))] text-white hover:opacity-90'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" />
            {isFollowActionLoading
              ? t('common.loading', 'Loading…')
              : isFollowing
                ? t('shops.shop.following', 'Following')
                : t('shops.shop.follow', 'Follow Atelier')}
          </button>
        </div>

        {/* Right: 2×2 image grid */}
        <div className="grid grid-cols-2 gap-4">
          {ATELIER_IMAGES.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl ring-1 ring-amber-200 ${
                i === 1 ? 'mt-8' : i === 2 ? '-mt-8' : ''
              }`}
              style={{ aspectRatio: '4/5' }}
            >
              <Image
                src={src}
                alt={t('shop.atelier_image_alt', 'Atelier interior {{n}}', { n: i + 1 })}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
                onError={handleImageError}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Tabs strip ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-16 z-30 bg-[hsl(var(--accent))]/95 backdrop-blur border-y border-amber-200/60"
        role="tablist"
        aria-label={t('shop.tabs_label', 'Product categories')}
      >
        <div className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => { setActiveTab(tab.id); setVisibleCount(8); }}
              className={`whitespace-nowrap text-sm pb-3 -mb-px pt-3 px-2 transition font-medium focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:rounded-sm ${
                activeTab === tab.id
                  ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))] font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {t(`shop.tab.${tab.id}`, tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Filter pills + sort ─────────────────────────────────────────── */}
      {activeTab !== 'reviews' && (
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className="h-4 w-4 text-[hsl(var(--accent-foreground))] shrink-0" aria-hidden="true" />
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                onClick={() => toggleFilter(pill.id)}
                aria-pressed={activeFilters.has(pill.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition font-medium focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1 ${
                  activeFilters.has(pill.id)
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-amber-50 ring-1 ring-amber-200 text-[hsl(var(--foreground))] hover:bg-amber-100'
                }`}
              >
                {t(`shop.filter.${pill.id}`, pill.label)}
              </button>
            ))}
          </div>
          <select
            className="shrink-0 rounded-full bg-white ring-1 ring-amber-200 px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            aria-label={t('shop.sort_label', 'Sort products')}
          >
            <option value="featured">{t('shop.sort.featured', 'Featured')}</option>
            <option value="price_asc">{t('shop.sort.price_asc', 'Price: low to high')}</option>
            <option value="price_desc">{t('shop.sort.price_desc', 'Price: high to low')}</option>
            <option value="newest">{t('shop.sort.newest', 'Newest')}</option>
          </select>
        </div>
      )}

      {/* ── 6. Products grid ───────────────────────────────────────────────── */}
      {activeTab !== 'reviews' && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white ring-1 ring-amber-200 rounded-2xl editorial-shadow">
              <p className="text-[hsl(var(--muted-foreground))] text-sm">
                {t('shop.no_products_found', 'No products found in this category.')}
              </p>
            </div>
          )}

          {/* ── 7. Load more ───────────────────────────────────────────────── */}
          {visibleCount < filteredProducts.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + 8)}
                className="rounded-full bg-white ring-1 ring-[hsl(var(--primary))] text-[hsl(var(--primary))] px-8 py-3 text-sm font-semibold hover:bg-indigo-50 transition focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2"
              >
                {t('shop.load_more', 'Load more')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 8. Reviews section ────────────────────────────────────────────── */}
      <section
        id="reviews"
        className="bg-white border-y border-amber-200/60 py-16"
        aria-labelledby="reviews-heading"
      >
        <div className="max-w-7xl mx-auto px-6">
          <span className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-medium">
            {t('shop.reviews_kicker', 'WHAT SHOPPERS SAY')}
          </span>
          <h2
            id="reviews-heading"
            className="font-heading mt-3 text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]"
          >
            {t('shop.reviews_heading', 'Voices from our shoppers')}
          </h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATIC_REVIEWS.map((rev, i) => (
              <div
                key={i}
                className="bg-amber-50/60 ring-1 ring-amber-200 rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-10 w-10 rounded-full bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center text-[hsl(var(--accent-foreground))] font-semibold text-sm shrink-0"
                    aria-hidden="true"
                  >
                    {rev.initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[hsl(var(--foreground))]">{rev.name}</div>
                    <div className="flex gap-0.5 mt-0.5" aria-label="5 stars">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                      ))}
                    </div>
                  </div>
                  <span className="ms-auto text-xs text-[hsl(var(--muted-foreground))]">{rev.city}</span>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--accent-foreground))] font-medium mb-2">
                  {t('reviews.verified_buyer', 'Verified buyer')}
                </p>
                <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed italic">{rev.text}</p>
              </div>
            ))}
          </div>

          {reviewsCount > 0 && (
            <div className="mt-8 text-center">
              <a
                href="#reviews"
                className="inline-flex items-center gap-1.5 text-[hsl(var(--primary))] text-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:rounded-sm"
              >
                {t('shop.all_reviews', 'Read all {{count}} reviews', { count: reviewsCount })}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── 9. Bespoke / contact strip ────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-16"
        style={{ backgroundColor: 'hsl(var(--indigo-900))' }}
        aria-labelledby="bespoke-heading"
      >
        {/* Radial amber/indigo overlay */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, #f59e0b 0, transparent 45%), radial-gradient(circle at 80% 60%, #3b3b6d 0, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: CTA */}
          <div>
            <h2
              id="bespoke-heading"
              className="font-heading text-3xl sm:text-4xl font-bold text-white"
            >
              {t('shop.bespoke_heading', 'Have something specific in mind?')}
            </h2>
            <p className="mt-4 text-indigo-200 max-w-md leading-relaxed">
              {t(
                'shop.bespoke_sub',
                'Commission a custom piece tailored exactly to your measurements and vision, crafted with ancestral techniques.',
              )}
            </p>
            <Link
              href={shopId ? `/messages/new?shop=${shopId}` : '/contact'}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-sm font-bold text-gray-900 hover:bg-amber-300 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--indigo-900))]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('shop.message_atelier', 'Message the atelier')}
            </Link>
          </div>

          {/* Right: 3-step explainer */}
          <div className="border-t md:border-t-0 md:border-s border-white/20 pt-8 md:pt-0 md:ps-12 space-y-6">
            {[
              {
                n: '01',
                title: t('shop.step1_title', 'Send measurements'),
                desc: t('shop.step1_desc', 'Share your dimensions and design vision via direct message.'),
              },
              {
                n: '02',
                title: t('shop.step2_title', 'Confirm design'),
                desc: t('shop.step2_desc', 'Review fabric swatches and finalise the bespoke details.'),
              },
              {
                n: '03',
                title: t('shop.step3_title', 'Hand delivered'),
                desc: t('shop.step3_desc', 'Your piece is hand-stitched and delivered worldwide in 3–4 weeks.'),
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-4">
                <span className="text-2xl font-bold text-amber-400/50 leading-none shrink-0" aria-hidden="true">
                  {step.n}
                </span>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-white">{step.title}</h4>
                  <p className="mt-1 text-xs text-indigo-200 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Discover more ateliers ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="discover-heading">
        <h2
          id="discover-heading"
          className="font-heading text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] mb-8"
        >
          {t('shop.discover_more', 'Discover more ateliers')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATIC_ATELIERS.map((atelier) => (
            <Link
              key={atelier.slug}
              href={`/shops/${atelier.slug}`}
              className="group bg-white ring-1 ring-amber-200 rounded-2xl p-4 text-center hover:-translate-y-0.5 hover:shadow-md transition editorial-shadow focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2"
            >
              <div
                className="h-14 w-14 rounded-full bg-amber-100 ring-1 ring-amber-200 mx-auto mb-3 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-lg font-bold text-[hsl(var(--accent-foreground))]">
                  {atelier.name.charAt(0)}
                </span>
              </div>
              <h4 className="font-heading text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition">
                {atelier.name}
              </h4>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{atelier.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
