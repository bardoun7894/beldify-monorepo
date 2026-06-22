'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // Import Image component

// Match the interfaces from Navbar.tsx
interface FeaturedProduct {
  id: number;
  name_en: string;
  name_ar: string | null;
  image: string;
  price: string;
  discount_price: string | null;
  slug: string;
}

interface SubCategory {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
}

interface Category {
  id: number;
  name_en: string;
  name_ar: string;
  image: string;
  slug: string;
  itemCount: number;
  store_id: number;
  subCategories: SubCategory[];
  featuredProducts: FeaturedProduct[];
}

interface CategoryDropdownProps {
  categories: Category[];
  isMobile?: boolean; // Add prop to indicate mobile context
}

export default function CategoryDropdown({ categories, isMobile = false }: CategoryDropdownProps) {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);
  const [mobileActiveCategory, setMobileActiveCategory] = useState<number | null>(null); // State for mobile accordion

  const handleMouseEnterDropdown = () => {
    if (isMobile) return; // Don't handle hover on mobile
    setIsHoveringDropdown(true);
    // Set first category active only if nothing is active yet and categories exist
    if (activeCategory === null && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  };

  const handleMouseLeaveDropdown = () => {
    if (isMobile) return;
    setIsHoveringDropdown(false);
    setActiveCategory(null); // Reset active category when leaving dropdown
  };

  // Handler for individual category hover (desktop only)
  const handleMouseEnterCategory = (categoryId: number) => {
     if (isMobile) return;
     setActiveCategory(categoryId);
     setIsHoveringDropdown(true); // Keep dropdown visible
  };

  // Handler for mobile category click (accordion toggle)
  const handleMobileCategoryClick = (categoryId: number) => {
    setMobileActiveCategory(prev => prev === categoryId ? null : categoryId);
  };

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div className="space-y-1 border-b border-amber-200/60 pb-4 mb-4">
        <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
          {t('navigation.categories')}
        </h3>
        {categories.map((category) => (
          <div key={category.id}>
            <button
              onClick={() => handleMobileCategoryClick(category.id)}
              className="w-full flex justify-between items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-amber-50"
            >
              <span className="flex items-center gap-3">
                 <Image
                    src={category.image}
                    alt={(i18n.language === 'ar' || i18n.language === 'ma') ? category.name_ar : category.name_en}
                    width={24} // Keep smaller for mobile list
                    height={24}
                    className="rounded object-cover flex-shrink-0"
                  />
                 {(i18n.language === 'ar' || i18n.language === 'ma') ? category.name_ar : category.name_en}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  mobileActiveCategory === category.id ? 'rotate-180' : ''
                }`}
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {/* Subcategories for Mobile */}
            <AnimatePresence>
              {mobileActiveCategory === category.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ps-6 ms-3 border-s border-amber-200/60"
                >
                  <ul className="py-2 space-y-1">
                     {category.subCategories?.map((subcat) => (
                       <li key={subcat.id}>
                         <Link
                           href={`/category/${subcat.slug}`}
                           className="block rounded-md py-1 px-2 text-sm text-gray-700 hover:bg-amber-50"
                           // Consider adding onClick to close the main mobile menu here if needed
                         >
                           {(i18n.language === 'ar' || i18n.language === 'ma') ? subcat.name_ar : subcat.name_en}
                         </Link>
                       </li>
                     ))}
                     {/* Removed "No subcategories" message */}
                     {/* Link to main category page */}
                     <li>
                        <Link
                           href={`/categories/${category.slug}`}
                           className="block rounded-md py-1 px-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                         >
                           {t('common.viewAll')} {(i18n.language === 'ar' || i18n.language === 'ma') ? category.name_ar : category.name_en}
                         </Link>
                     </li>
                  </ul>
                  {/* Add Featured Products to Mobile Accordion */}
                  {category.featuredProducts && category.featuredProducts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-amber-200/60">
                       <h4 className="px-2 text-xs font-semibold text-amber-700 mb-2">
                        {t('navigation.featuredProducts')}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 px-2">
                        {category.featuredProducts && category.featuredProducts.slice(0, 2).map((product) => ( // Show max 2 featured on mobile
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group block text-center"
                          >
                            <div className="aspect-square w-full bg-gray-100 rounded-md overflow-hidden mb-1 shadow-sm">
                              <Image
                                src={product.image}
                                alt={(i18n.language === 'ar' || i18n.language === 'ma') ? (product.name_ar || product.name_en) : product.name_en}
                                width={80}
                                height={80}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 group-hover:text-amber-700 transition-colors truncate block">
                              {(i18n.language === 'ar' || i18n.language === 'ma') ? (product.name_ar || product.name_en) : product.name_en}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }

  // --- Desktop Layout ---
  return (
    // Add mouse enter/leave handlers to the main group div
    <div
      className="relative group"
      onMouseEnter={handleMouseEnterDropdown}
      onMouseLeave={handleMouseLeaveDropdown}
    >
      {/* Trigger Button - Applying theme colors */}
      <button className="flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-700 hover:text-indigo-700 transition-colors group-hover:text-indigo-700">
        <span>{t('navigation.categories')}</span>
        <svg
          className="w-4 h-4 transition-transform group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Desktop Dropdown Panel - Use isHoveringDropdown for visibility */}
      <AnimatePresence>
        {isHoveringDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} // Adjusted animation
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }} // Faster transition
            className="absolute top-full start-0 mt-1 w-auto max-w-[calc(100vw-2rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-6xl bg-white shadow-lg rounded-b-2xl z-50 border-t border-amber-200/60 overflow-hidden"
          >
            {/* Panel Content */}
            <div className="flex p-6 gap-6 md:gap-8">
              {/* Categories List */}
              <div className="w-full sm:w-1/3 lg:w-1/4 border-e border-amber-200/60 pe-4 lg:pe-6 flex-shrink-0">
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    className={`w-full flex items-center gap-3 text-start px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                      activeCategory === category.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium' // Use indigo for active
                        : 'hover:bg-amber-50 text-gray-700 hover:text-gray-900'
                    }`}
                    onMouseEnter={() => setActiveCategory(category.id)}
                  >
                    <Image
                      src={category.image}
                      alt={(i18n.language === 'ar' || i18n.language === 'ma') ? category.name_ar : category.name_en}
                      width={32} // Increased size from 24
                      height={32} // Increased size from 24
                      className="rounded object-cover flex-shrink-0"
                    />
                    <span className="truncate flex-1"> {/* Added flex-1 to allow truncation */}
                      {(i18n.language === 'ar' || i18n.language === 'ma') ? category.name_ar : category.name_en}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Subcategories & Featured Products - Adjusted padding, RTL support */}
          <div className="flex-1 ps-4 lg:ps-6 hidden sm:block"> {/* Hide on extra-small screens initially */}
            <AnimatePresence mode="wait">
              {activeCategory && (() => {
                const currentCategory = categories.find((cat) => cat.id === activeCategory);
                if (!currentCategory) return null;

                return (
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col lg:flex-row gap-6 lg:gap-8" // Stack until large screen
                  >
                    {/* Subcategories List */}
                    <div className="w-full lg:w-1/2">
                      <h3 className="text-sm font-semibold text-indigo-800 mb-3">
                        {t('navigation.subcategories')}
                      </h3>
                      <ul className="space-y-1 max-h-[300px] overflow-y-auto"> {/* Add scroll if list is long */}
                        {currentCategory.subCategories?.map((subcat) => (
                          <li key={subcat.id}>
                            <Link
                              href={`/category/${subcat.slug}`} // Assuming subcategories link to /category/slug
                              className="block p-2 rounded-md hover:bg-amber-50 transition-colors text-sm text-gray-700 hover:text-indigo-700"
                            >
                              {(i18n.language === 'ar' || i18n.language === 'ma') ? subcat.name_ar : subcat.name_en}
                            </Link>
                          </li>
                        ))}
                        {/* Removed "No subcategories" message */}
                      </ul>
                    </div>

                    {/* Featured Products */}
                    <div className="w-full lg:w-1/2">
                       <h3 className="text-sm font-semibold text-amber-700 mb-3">
                        {t('navigation.featuredProducts')}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 md:gap-4 max-h-[300px] overflow-y-auto"> {/* Add scroll */}
                        {currentCategory.featuredProducts && currentCategory.featuredProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`} // Link to product page
                            className="group block text-center"
                          >
                            <div className="aspect-square w-full bg-gray-100 rounded-md overflow-hidden mb-1.5 shadow-sm">
                              <Image
                                src={product.image}
                                alt={(i18n.language === 'ar' || i18n.language === 'ma') ? (product.name_ar || product.name_en || 'Product image') : (product.name_en || 'Product image')}
                                width={100}
                                height={100}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 group-hover:text-amber-700 transition-colors truncate block">
                              {(i18n.language === 'ar' || i18n.language === 'ma') ? (product.name_ar || product.name_en) : product.name_en}
                            </span>
                          </Link>
                        ))}
                         {/* Removed "No featured products" message */}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Area */}
        <div className="bg-gradient-to-r from-indigo-50 to-amber-50 p-4 rounded-b-2xl border-t border-amber-200/60">
          <div className="flex items-center justify-end">
            <Link
              href="/categories"
              className="text-sm text-indigo-700 hover:text-amber-700 font-medium transition-colors"
            >
              {t('common.viewAll')} <span aria-hidden="true" className="inline-block [dir=rtl]:rotate-180">&rarr;</span>
            </Link>
          </div>
        </div>
        {/* End Panel Content */}
       </motion.div>
      )}
     </AnimatePresence>
     {/* End Desktop Dropdown Panel */}
    </div>
  );
}
