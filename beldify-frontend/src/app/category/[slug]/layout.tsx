import type { Metadata } from 'next';
import { API_ORIGIN, SITE_URL, stripHtml, truncate } from '@/utils/seo';

/**
 * Server-side metadata for the (client-rendered) category page. Category landing
 * pages are a primary acquisition surface — without this they inherited the generic
 * root title and were near-invisible to crawlers / social unfurls (storefront audit
 * P1-E). Mirrors the products/[id]/layout.tsx pattern: client page + server metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `${SITE_URL}/category/${slug}`;

  try {
    const res = await fetch(`${API_ORIGIN}/api/categories/${slug}`, {
      // Revalidate hourly — category name/description rarely change; cheap for crawlers.
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const json = await res.json();
    const cat = json?.category ?? json?.data?.category ?? json?.data ?? json;
    const name: string =
      cat?.category_name_en || cat?.name_en || cat?.name || cat?.category_name_ar || cat?.name_ar;
    if (!name) throw new Error('no category');

    const title = `${name} — Beldify`;
    const baseDesc =
      stripHtml(cat?.description || cat?.category_description_en || cat?.category_description_ar) ||
      `Shop authentic Moroccan ${name.toLowerCase()} from independent ateliers on Beldify.`;
    const description = truncate(baseDesc);

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'website',
        siteName: 'Beldify',
        title,
        description,
        url: canonical,
      },
      twitter: { card: 'summary', title, description },
    };
  } catch {
    // Network/404/shape change → safe generic preview.
    return {
      title: 'Shop by category — Beldify',
      description: 'Bringing Moroccan Traditional Fashion to the Modern World',
      alternates: { canonical },
      openGraph: { type: 'website', siteName: 'Beldify', url: canonical },
    };
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
