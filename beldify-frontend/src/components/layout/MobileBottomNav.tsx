'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Home,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';

interface MobileBottomNavProps {
  onSearchClick?: () => void;
}

export default function MobileBottomNav({ onSearchClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { cartItemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useMessaging();
  const { t } = useTranslation();

  const navItems = [
    {
      name: t('navigation.home', 'Home'),
      href: '/',
      icon: Home,
      iconSolid: Home,
    },
    {
      name: t('nav.search', 'Search'),
      href: '#',
      icon: Search,
      iconSolid: Search,
      onClick: onSearchClick,
    },
    {
      name: t('navigation.cart', 'Cart'),
      href: '/cart',
      icon: ShoppingCart,
      iconSolid: ShoppingCart,
      badge: cartItemCount > 0 ? cartItemCount : null,
    },
    {
      name: t('navigation.profile', 'Profile'),
      href: isAuthenticated ? '/profile' : '/login',
      icon: User,
      iconSolid: User,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 start-0 end-0 z-40 bg-white/95 backdrop-blur border-t border-amber-200/60 md:hidden safe-bottom"
      aria-label={t('chrome.bottomNav.label', 'Mobile bottom navigation')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.iconSolid : item.icon;

          const content = (
            <div className={cn(
              "flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200",
              active ? "text-indigo-700" : "text-gray-500 hover:text-indigo-700"
            )}>
              <div className="relative">
                <Icon className={cn("h-6 w-6 transition-colors duration-200", active && "stroke-[2.5]")} aria-hidden="true" />
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -bottom-1 start-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                )}
                {item.badge && (
                  <span className="absolute -top-2 -end-2 h-5 w-5 rounded-full bg-amber-500 text-amber-950 text-xs font-semibold flex items-center justify-center shadow-sm border-2 border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-xs mt-1.5 font-medium", active ? "text-indigo-700" : "")}>{item.name}</span>
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex-1 flex items-center justify-center touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30"
                aria-label={item.name}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className="flex-1 flex items-center justify-center touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30"
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
