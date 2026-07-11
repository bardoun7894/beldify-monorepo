"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

const products = [
	{
		id: 1,
		name: "Handcrafted Kaftan",
		price: "2999 MAD",
		href: "/shop/products/handcrafted-kaftan",
		description: "Elegant handmade kaftan with traditional embroidery",
	},
	{
		id: 2,
		name: "Modern Djellaba",
		price: "1999 MAD",
		href: "/shop/products/modern-djellaba",
		description: "Contemporary take on the classic Moroccan djellaba",
	},
	{
		id: 3,
		name: "Luxury Wedding Dress",
		price: "5999 MAD",
		href: "/shop/products/luxury-wedding-dress",
		description: "Stunning wedding dress with detailed handwork",
	},
	{
		id: 4,
		name: "Traditional Belt",
		price: "799 MAD",
		href: "/shop/products/traditional-belt",
		description: "Handcrafted belt with metallic embellishments",
	},
];

export default function FeaturedProducts() {
	const { t } = useTranslation();
	return (
		<div className="bg-white">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl lg:max-w-none">
					<h2
						className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
						style={{
							fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
						}}
					>
						{t("home.featuredProducts.title", "Featured Products")}
					</h2>
					<p className="mt-4 text-lg text-gray-500">
						{t(
							"home.featuredProducts.subtitle",
							"Discover our most popular traditional Moroccan clothing",
						)}
					</p>

					<div className="mt-16 space-y-12 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-y-0">
						{products.map((product) => (
							<Link
								key={product.id}
								href={product.href}
								className="group transition hover:-translate-y-0.5 hover:shadow-md duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] rounded-2xl overflow-hidden block"
							>
								<div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-2xl bg-gray-50">
									<div className="h-full w-full object-cover object-center" />
								</div>
								<h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-[220ms]">
									{product.name}
								</h3>
								<p className="mt-1 text-sm text-gray-500">
									{product.description}
								</p>
								<p className="mt-2 text-lg font-medium text-indigo-700">
									{product.price}
								</p>
							</Link>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
