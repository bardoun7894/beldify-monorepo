'use client';

import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { FiUser, FiLock, FiSettings, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItem {
  id: string;
  icon: IconType;
  label: string;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const { t } = useTranslation('profile');

  const tabs: TabItem[] = [
    { id: 'general', icon: FiUser, label: t('tabs.general') },
    { id: 'security', icon: FiLock, label: t('tabs.security') },
    { id: 'preferences', icon: FiSettings, label: t('tabs.preferences') },
  ];

  return (
    <nav className="space-y-2" aria-label="Profile navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`group w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-2
              ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-white text-indigo-700 shadow-md border-l-4 border-amber-500 pl-3.5'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${
                isActive 
                  ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600' 
                  : 'bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-medium">{tab.label}</span>
            </div>
            {isActive ? (
              <motion.div 
                className="w-1 h-5 bg-gradient-to-b from-amber-400 to-amber-500 rounded-full"
                layoutId="activeTabIndicator"
              />
            ) : (
              <FiChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
