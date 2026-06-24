import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.beldify.com';

// Static routes always included
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/categories/jewelry`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/services/tailoring`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/seller/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/faqs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE_URL}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
];

interface ApiCategory {
  slug?: string;
  id?: number;
}

interface ApiProduct {
  id: number;
  updated_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...STATIC_ROUTES];

  // ── Categories ──────────────────────────────────────────────────────────────
  try {
    const catRes = await fetch(`${API_URL}/api/categories/getAllCategories`, {
      next: { revalidate: 86400 }, // daily
    });
    if (catRes.ok) {
      const catData = await catRes.json();
      const cats: ApiCategory[] = catData?.categories ?? [];
      cats.forEach((cat) => {
        if (cat.slug) {
          entries.push({
            url: `${SITE_URL}/categories/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      });
    }
  } catch {
    // API unreachable — return static routes only
  }

  // ── Products (first ~100) ────────────────────────────────────────────────────
  try {
    const prodRes = await fetch(`${API_URL}/api/products/all?per_page=100&page=1`, {
      next: { revalidate: 86400 }, // daily
    });
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      const products: ApiProduct[] = prodData?.products ?? prodData?.data ?? [];
      products.slice(0, 100).forEach((product) => {
        if (product.id) {
          entries.push({
            url: `${SITE_URL}/products/${product.id}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      });
    }
  } catch {
    // API unreachable — return static routes only
  }

  return entries;
}
