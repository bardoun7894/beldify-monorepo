'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Home,
  LayoutGrid,
  Compass,
  ShoppingCart,
  User,
  LogIn,
} from 'lucide-react';

// Routes where the bottom nav is suppressed (full-screen checkout flow)
// /products/[id] — detail pages show their own buy bar; suppress the tab bar
// so both bars don't overlap. /products listing is intentionally NOT included.
const HIDDEN_ROUTES = ['/checkout'];

/** Matches /products/<anything> but NOT /products itself or /products/ */
const PRODUCT_DETAIL_RE = /^\/products\/[^/]+$/;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { state: cartState } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Compute cart count from state.items — CartContext does not expose an itemCount shortcut
  const cartCount =
    cartState?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  // Hide on checkout routes — preserve existing hide behavior
  // Also hide on PDP (/products/[id]) so the buy bar doesn't overlap
  const isHidden =
    HIDDEN_ROUTES.some((route) => pathname.startsWith(route)) ||
    PRODUCT_DETAIL_RE.test(pathname);
  if (isHidden) return null;

  // Fixed 5 tabs — AliExpress / marketplace pattern for non-technical users
  // Tabs are always in this order (RTL layout handled by start-0/end-0 + flex)
  const navItems = [
    {
      href: '/',
      label: t('navigation.home', 'الرئيسية'),
      icon: Home,
      badge: null as number | null,
    },
    {
      href: '/categories',
      label: t('navigation.categories', 'الأصناف'),
      icon: LayoutGrid,
      badge: null as number | null,
    },
    {
      href: '/community',
      label: t('navigation.openSouk', 'السوق المفتوح'),
      icon: Compass,
      badge: null as number | null,
    },
    {
      href: '/cart',
      label: t('navigation.cart', 'السلة'),
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null,
    },
    isAuthenticated
      ? {
          href: '/profile',
          label: t('navigation.account', 'حسابي'),
          icon: User,
          badge: null as number | null,
        }
      : {
          href: '/login',
          label: t('navigation.login_short', 'دخول'),
          icon: LogIn,
          badge: null as number | null,
        },
  ] as const;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-gray-200 md:hidden"
      aria-label={t('chrome.bottomNav.label', 'التنقل السفلي')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 5 equal columns — one per tab */}
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                // Minimum 48px height touch target per WCAG 2.5.5
                'flex flex-col items-center justify-center min-h-[48px] gap-0.5',
                'touch-manipulation select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30',
                'transition-colors duration-150',
                active ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon wrapper with badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-all duration-150',
                    active ? 'stroke-[2.5]' : 'stroke-[1.75]'
                  )}
                  aria-hidden="true"
                />
                {/* Active indicator: amber dot under icon */}
                {active && (
                  <span
                    className="absolute -bottom-1 start-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500"
                    aria-hidden="true"
                  />
                )}
                {/* Cart count badge */}
                {item.badge !== null && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -end-1.5',
                      'min-w-[16px] h-4 px-0.5 rounded-full',
                      'bg-amber-500 text-white text-[10px] font-bold',
                      'flex items-center justify-center',
                      'border border-white shadow-sm',
                      'leading-none'
                    )}
                    aria-label={`${item.badge} items`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label — always visible, non-technical users need text */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none mt-0.5',
                  // Clamp so 5 labels never overflow on narrow screens
                  'max-w-[72px] text-center truncate'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
