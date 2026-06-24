import type { Metadata } from 'next';
import {
  API_ORIGIN,
  SITE_URL,
  absoluteImageUrl,
  stripHtml,
  truncate,
  formatMad,
} from '@/utils/seo';

/**
 * Server-side metadata for the (client-rendered) product page. This is what
 * makes a product link show its photo + name + price when pasted into
 * WhatsApp/Facebook — the multiplier on every Share-to-WhatsApp tap.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonical = `${SITE_URL}/products/${id}`;

  try {
    const res = await fetch(`${API_ORIGIN}/api/products/${id}/details`, {
      // Revalidate hourly — fresh enough for price/stock, cheap for crawlers.
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const json = await res.json();
    const product = json?.product ?? json?.data?.product ?? json?.data ?? json;
    if (!product?.name) throw new Error('no product');

    const price = formatMad(product.discount_price ?? product.price);
    const name: string = product.name;
    const title = price ? `${name} — ${price}` : name;

    const baseDesc = stripHtml(product.description) || 'Discover authentic Moroccan craftsmanship on Beldify.';
    const description = truncate(price ? `${price} · ${baseDesc}` : baseDesc);

    // Pick the best primary image, resolved to an absolute URL.
    const rawImage =
      product.main_image ||
      product.images?.find?.((i: any) => i?.is_primary && i?.url)?.url ||
      product.images?.find?.((i: any) => i?.url)?.url ||
      (typeof product.images?.[0] === 'string' ? product.images[0] : undefined) ||
      product.image;
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
      other: price
        ? {
            'product:price:amount': String(parseFloat(product.discount_price ?? product.price)),
            'product:price:currency': 'MAD',
          }
        : {},
    };
  } catch {
    // Network/404/shape change → fall back to a safe generic preview.
    return {
      title: 'Beldify',
      description: 'Bringing Moroccan Traditional Fashion to the Modern World',
      alternates: { canonical },
      openGraph: { type: 'website', siteName: 'Beldify', url: canonical },
    };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
