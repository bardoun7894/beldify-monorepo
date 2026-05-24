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
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <nav
      aria-label={t('chrome.breadcrumbs.label', 'Breadcrumb')}
      className={cn("flex items-center text-sm text-gray-500", className)}
    >
      <ol className={cn(
        "flex items-center flex-wrap gap-1",
        isRTL && "flex-row-reverse"
      )}>
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-indigo-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">{t('navigation.home')}</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight
              className={cn(
                "h-4 w-4 mx-1 text-gray-400 flex-shrink-0",
                isRTL && "rotate-180"
              )}
            />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-indigo-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
