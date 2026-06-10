'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Home,
  Compass,
  ShoppingCart,
  User,
  LogIn,
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartItemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Nav stays visible for everyone (guests browse + buy-now COD).
  // It adapts: the cart is a logged-in concept here, so it only appears
  // after login; guests get a Login entry in the profile slot instead.
  const navItems = [
    {
      name: t('navigation.home', 'Home'),
      href: '/',
      icon: Home,
    },
    {
      name: t('navigation.community', 'Open Souk'),
      href: '/community',
      icon: Compass,
    },
    ...(isAuthenticated
      ? [{
          name: t('navigation.cart', 'Cart'),
          href: '/cart',
          icon: ShoppingCart,
          badge: cartItemCount > 0 ? cartItemCount : null,
        }]
      : []),
    isAuthenticated
      ? {
          name: t('navigation.profile', 'Profile'),
          href: '/profile',
          icon: User,
        }
      : {
          name: t('navigation.login', 'Login'),
          href: '/login',
          icon: LogIn,
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
      className="fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-amber-200/60 md:hidden safe-bottom"
      aria-label={t('chrome.bottomNav.label', 'Mobile bottom navigation')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const badge = 'badge' in item ? item.badge : null;

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className="flex-1 flex items-center justify-center touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30"
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
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
                  {badge && (
                    <span className="absolute -top-2 -end-2 h-5 w-5 rounded-full bg-amber-500 text-amber-950 text-xs font-semibold flex items-center justify-center shadow-sm border-2 border-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-xs mt-1.5 font-medium", active ? "text-indigo-700" : "")}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
