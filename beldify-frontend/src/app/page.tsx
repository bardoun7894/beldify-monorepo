import HomeContent from '@/components/home/HomeContent';
import { getHomeDataPayload } from './api/home/route';
import logger from '@/utils/consoleLogger';
import type { CommunityPost } from '@/types/community';
import type { HeroConfig } from '@/components/home/HeroSection';

// Revalidate every 60 seconds so the home page stays fresh without a
// full rebuild. DiscoverFeed is client-side so it refreshes per request.
export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com';

async function getHomeData() {
  try {
    // Call the data-layer function directly (no HTTP self-fetch anti-pattern).
    // getHomeDataPayload() already contains its own try/catch and returns empty-
    // array fallbacks on any backend error.
    return await getHomeDataPayload();
  } catch (error) {
    logger.error('Error fetching home data:', error);
    return {
      bestSellers: [], newArrivals: [], recommendedTailors: [],
      recommendedSellers: [], specialOffers: [],
      hero: { mode: 'brand' as const, banners: [] } satisfies HeroConfig,
    };
  }
}

type Category = {
  id: number;
  name_en: string;
  name_ar?: string;
  image: string;
  slug?: string;
  itemCount?: number;
  subCategories?: Category[];
  subcategories?: Category[];
};

async function getTopCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories/topCategories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.categories || json.data || [];
    // Flatten subcategories into a single list, cap at 8
    const flat: Category[] = [];
    for (const parent of items) {
      const subs = parent.subCategories || parent.subcategories || [];
      for (const s of subs) flat.push(s);
    }
    return flat.slice(0, 8);
  } catch (e) {
    logger.error('Failed to load top categories:', e);
    return [];
  }
}

// Open Souk — 3 most-recent OPEN community briefs for the home preview rail.
// Public endpoint, no auth. Backend returns a Laravel paginator resource
// collection: { data: [...] }. Controller honors status, hard-codes latest(),
// and paginates by `limit` (not per_page). json.data catches the envelope.
async function getOpenSoukPosts(): Promise<CommunityPost[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/community/posts?status=open&limit=3&sort=latest`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data ?? json.posts ?? json.community_posts ?? (Array.isArray(json) ? json : []);
    return Array.isArray(items) ? items.slice(0, 3) : [];
  } catch (e) {
    logger.error('Failed to load Open Souk posts:', e);
    return [];
  }
}

export default async function Home() {
  const [data, categories, openSoukPosts] = await Promise.all([
    getHomeData(),
    getTopCategories(),
    getOpenSoukPosts(),
  ]);

  // Extract hero config from payload; fall back to brand mode if missing
  const hero: HeroConfig = (data as { hero?: HeroConfig }).hero ?? { mode: 'brand', banners: [] };

    return <HomeContent categories={categories} data={data as any} openSoukPosts={openSoukPosts} hero={hero} />;
}
