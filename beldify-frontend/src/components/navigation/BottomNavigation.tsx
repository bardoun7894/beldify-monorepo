'use client';

import { useCart } from '@/contexts/CartContext'; // Import useCart
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  HeartIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
} from '@heroicons/react/24/solid';
import { useTheme } from '@/providers/ThemeProvider';
import { useWishlist } from '@/contexts/WishlistContext'; // Import useWishlist

export default function BottomNavigation() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const currentLocale = i18n.language;
  const { mode, toggleMode } = useTheme();
  const { state: cartState } = useCart(); // Get cart state
  const { wishlistItems } = useWishlist(); // Get wishlistItems from context

  // Calculate counts
  // Match desktop navbar: sum of quantities
  const cartCount = cartState?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const wishlistCount = wishlistItems?.length || 0; // Calculate wishlist count using wishlistItems

  const navigation = [
    {
      name: t('navigation.home'),
      href: `/?locale=${currentLocale}`,
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      active: pathname === '/',
    },
    {
      name: t('navigation.wishlist'),
      href: `/wishlist?locale=${currentLocale}`,
      icon: HeartIcon,
      activeIcon: HeartIconSolid,
      active: pathname === '/wishlist',
      badge: wishlistCount, // Use wishlistCount from context
    },
    {
      name: t('navigation.cart'),
      href: `/cart?locale=${currentLocale}`,
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartIconSolid,
      active: pathname === '/cart',
      badge: cartCount, // Use cartCount from context
    },
    {
      name: mode === 'dark' ? t('navigation.light_mode') : t('navigation.dark_mode'),
      onClick: toggleMode,
      icon: mode === 'dark' ? SunIcon : MoonIcon,
      activeIcon: mode === 'dark' ? SunIcon : MoonIcon,
      active: false,
    },
    {
      name: t('navigation.account'),
      href: `/account?locale=${currentLocale}`,
      icon: UserIcon,
      activeIcon: UserIconSolid,
      active: pathname === '/account',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navigation.map((item) => {
          const Icon = item.active ? item.activeIcon : item.icon;
          // Revert to dynamic Component and props
          const Component = item.href ? Link : 'button';
          const props = item.href ? { href: item.href } : { onClick: item.onClick };

          return (
            // @ts-expect-error // Use expect-error as suggested by ESLint
            <Component
              key={item.name}
              {...props}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                item.active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.name}</span>
            </Component>
          );
        })}
      </div>
    </nav>
  );
}
