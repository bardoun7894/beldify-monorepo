'use client';

import Link from 'next/link';

const products = [
  {
    id: 1,
    name: 'Handcrafted Kaftan',
    price: '2999 MAD',
    href: '/shop/products/handcrafted-kaftan',
    description: 'Elegant handmade kaftan with traditional embroidery',
  },
  {
    id: 2,
    name: 'Modern Djellaba',
    price: '1999 MAD',
    href: '/shop/products/modern-djellaba',
    description: 'Contemporary take on the classic Moroccan djellaba',
  },
  {
    id: 3,
    name: 'Luxury Wedding Dress',
    price: '5999 MAD',
    href: '/shop/products/luxury-wedding-dress',
    description: 'Stunning wedding dress with detailed handwork',
  },
  {
    id: 4,
    name: 'Traditional Belt',
    price: '799 MAD',
    href: '/shop/products/traditional-belt',
    description: 'Handcrafted belt with metallic embellishments',
  },
];

export default function FeaturedProducts() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Featured Products
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Discover our most popular traditional Moroccan clothing
          </p>

          <div className="mt-16 space-y-12 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-y-0">
            {products.map((product) => (
              <Link key={product.id} href={product.href} className="group">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-100 group-hover:opacity-75">
                  <div className="h-full w-full object-cover object-center" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{product.description}</p>
                <p className="mt-2 text-lg font-medium text-gray-900">{product.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
