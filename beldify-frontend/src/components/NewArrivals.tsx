// 'use client';

// import Image from 'next/image';
// import Link from 'next/link';
// import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import { fetchNewArrivals } from '@/lib/api';
// import type { Product } from '@/lib/types';

// const NewArrivals: React.FC = () => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [mounted, setMounted] = useState(false);

//   const loadProducts = useCallback(async () => {
//     try {
//       setLoading(true);
//       const data = await fetchNewArrivals();
//       setProducts(data);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load new arrivals');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     setMounted(true);
//     loadProducts();
//   }, [loadProducts]);

//   const renderedProducts = useMemo(() => {
//     return products.map((product) => (
//       <Link
//         href={`/product/${product.id}`}
//         key={product.id}
//         className="group block transform transition-all duration-300 hover:scale-[1.03]"
//       >
//         <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-[280px]">
//           {/* Image Container */}
//           <div className="absolute inset-0">
//             <div className="relative h-full w-full">
//               <Image
//                 src={product.image}
//                 alt={product.name}
//                 fill
//                 className="object-cover transform transition-transform duration-500 group-hover:scale-110"
//                 sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
//                 priority={true}
//                 unoptimized={process.env.NODE_ENV === 'development'}
//               />
//               {/* Overlay gradients */}
//               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-80" />
//               {/* New Label */}
//               <div className="absolute top-4 right-4">
//                 <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full shadow-lg">
//                   New
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="absolute bottom-0 left-0 right-0 p-6">
//             <div className="relative z-10">
//               <h3 className="text-xl font-semibold text-white mb-2 transform transition-all duration-300 group-hover:translate-y-[-3px]">
//                 {product.name}
//               </h3>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
//                     ${product.price.toFixed(2)}
//                   </span>
//                   {product.discount_price && (
//                     <span className="inline-block px-3 py-1 bg-red-500/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
//                       ${product.discount_price.toFixed(2)}
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center text-white/90 text-sm font-medium group-hover:text-white transition-colors duration-300">
//                   <span>View Details</span>
//                   <svg
//                     className="w-4 h-4 ml-1.5 transform transition-transform duration-300 group-hover:translate-x-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M13 7l5 5m0 0l-5 5m5-5H6"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Link>
//     ));
//   }, [products]);

//   // Prevent hydration issues
//   if (!mounted) {
//     return null;
//   }

//   return (
//     <section className="py-16 bg-gradient-to-b from-white to-gray-50">
//       <div className="container mx-auto px-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">New Arrivals</h2>
//             <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//               Be the first to explore our latest collection of fresh and trendy products
//             </p>
//           </div>

//           {error && <div className="text-center text-red-600 mb-8">{error}</div>}

//           {loading ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="animate-pulse">
//                   <div className="bg-gray-200 rounded-xl h-[280px]" />
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//               {renderedProducts}
//             </div>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default NewArrivals;
