'use client';

import { motion } from 'framer-motion';
import { User, Lock, Settings, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LucideIcon } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const { t } = useTranslation('profile');

  const tabs: TabItem[] = [
    { id: 'general', icon: User, label: t('tabs.general') },
    { id: 'security', icon: Lock, label: t('tabs.security') },
    { id: 'preferences', icon: Settings, label: t('tabs.preferences') },
  ];

  return (
    <nav className="space-y-1" aria-label="Profile navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'group w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white text-indigo-700 shadow-atlas-sm'
                : 'text-indigo-900/70 hover:bg-white/60 hover:text-indigo-700',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-50 text-indigo-400 group-hover:bg-indigo-50 group-hover:text-indigo-600',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{tab.label}</span>
            </div>

            {isActive ? (
              <motion.div
                layoutId="activeTabIndicator"
                className="h-4 w-1 rounded-full bg-amber-500"
              />
            ) : (
              <ChevronRight
                className="h-3.5 w-3.5 text-indigo-200 group-hover:text-indigo-400 transition-colors rtl:rotate-180"
                aria-hidden="true"
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
