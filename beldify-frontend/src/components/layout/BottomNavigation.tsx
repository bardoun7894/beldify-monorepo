'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Grid3x3, Heart, ShoppingCart, User, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useMessaging } from '@/contexts/MessagingContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { state: cartState } = useCart();
  const { wishlistItems } = useWishlist();
  const { unreadCount } = useMessaging();

  // Calculate counts
  const cartCount = cartState?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const navigationItems = [
    {
      name: t('navigation.home', 'Home'),
      href: '/',
      icon: Home,
    },
    {
      name: t('navigation.categories', 'Categories'),
      href: '/categories',
      icon: Grid3x3,
    },
    {
      name: t('navigation.messages', 'Messages'),
      href: '/community/messages',
      icon: MessageCircle,
    },
    {
      name: t('navigation.wishlist', 'Wishlist'),
      href: '/wishlist',
      icon: Heart,
      badgeCount: wishlistCount,
    },
    {
      name: t('navigation.cart', 'Cart'),
      href: '/cart',
      icon: ShoppingCart,
      badgeCount: cartCount,
    },
    {
      name: t('navigation.profile', 'Profile'),
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 start-0 end-0 z-50 bg-white border-t border-amber-200/60 md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-700' : 'text-gray-600'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 w-4">
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-white text-[10px] font-medium items-center justify-center">
                      {item.badgeCount}
                    </span>
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
