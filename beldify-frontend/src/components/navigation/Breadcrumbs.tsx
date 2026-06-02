'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const { t, i18n } = useTranslation();

  return (
    <nav
      aria-label={t('chrome.breadcrumbs.label', 'Breadcrumb')}
      className={cn("flex items-center text-sm text-gray-500", className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        <li>
          <Link
            href="/"
            className="flex items-center p-1 rounded-lg hover:text-indigo-700 hover:bg-amber-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t('navigation.home')}</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* ChevronRight flips automatically with RTL dir via rtl:rotate-180 */}
            <ChevronRight
              className="h-4 w-4 mx-1 text-amber-400 flex-shrink-0 rtl:rotate-180"
              aria-hidden="true"
            />
            {item.href ? (
              <Link
                href={item.href}
                className="px-1 hover:text-indigo-700 transition-colors rounded hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              >
                {item.label}
              </Link>
            ) : (
              <span className="px-1 text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
