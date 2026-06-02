import HomeContent from '@/components/home/HomeContent';
import logger from '@/utils/consoleLogger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com';

async function getHomeData() {
  try {
    const response = await import('./api/home/route');
    const handler = response.GET;
    if (handler) {
      const result = await handler();
      return await result.json();
    }
    throw new Error('API handler not found');
  } catch (error) {
    logger.error('Error fetching home data:', error);
    return {
      bestSellers: [], newArrivals: [], recommendedTailors: [],
      recommendedSellers: [], specialOffers: [],
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
    const res = await fetch(`${API_URL}/api/categories/topCategories`, { next: { revalidate: 300 } });
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

export default async function Home() {
  const [data, categories] = await Promise.all([getHomeData(), getTopCategories()]);
  return <HomeContent categories={categories} data={data} />;
}
