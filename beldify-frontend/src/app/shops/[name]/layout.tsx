import type { Metadata } from 'next';
import { API_ORIGIN, SITE_URL, absoluteImageUrl, stripHtml, truncate } from '@/utils/seo';

/**
 * Server-side metadata for the (client-rendered) shop/atelier page. Makes a
 * shop link show the atelier's cover + name when a seller drops it into their
 * TikTok/Instagram/WhatsApp bio — the marketplace funnel link.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name: shopParam } = await params;
  const canonical = `${SITE_URL}/shops/${shopParam}`;

  try {
    const res = await fetch(`${API_ORIGIN}/api/shops/${shopParam}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const json = await res.json();
    const store = json?.store ?? json?.data?.store ?? json?.data ?? json;
    if (!store?.name) throw new Error('no store');

    const name: string = store.name;
    const title = `${name} · Beldify`;
    const baseDesc =
      stripHtml(store.description ?? store.profile?.description) ||
      `Shop handcrafted Moroccan pieces from ${name} on Beldify.`;
    const description = truncate(baseDesc);

    const rawImage =
      store.cover_image ||
      store.profile?.cover_image ||
      store.logo ||
      store.profile?.store_logo;
    const image = absoluteImageUrl(rawImage);

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
        images: image ? [{ url: image, alt: name }] : undefined,
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      title: 'Beldify',
      description: 'Bringing Moroccan Traditional Fashion to the Modern World',
      alternates: { canonical },
      openGraph: { type: 'website', siteName: 'Beldify', url: canonical },
    };
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
