'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { User, Lock, Settings } from 'lucide-react';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import GeneralSettings from './components/GeneralSettings';
import SecuritySettings from './components/SecuritySettings';
import PreferencesSettings from './components/PreferencesSettings';

const tabIcons = {
  general: <User className="mr-2 h-5 w-5" />,
  security: <Lock className="mr-2 h-5 w-5" />,
  preferences: <Settings className="mr-2 h-5 w-5" />,
};

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-xl border border-amber-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-indigo-100 p-1">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-200 border-t-amber-500"></div>
              </div>
            </div>
          </div>
          <span className="text-gray-700 font-medium text-lg">{t('page.loading')}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'preferences':
        return <PreferencesSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100"
        >
          {/* Atlas amber hairline accent */}
          <div className="h-1 bg-amber-400 w-full" />

          <div className="p-6 sm:p-8">
            <ProfileHeader user={user} />
          </div>

          <div className="grid md:grid-cols-12">
            {/* Sidebar Tabs */}
            <div className="md:col-span-3 bg-amber-50 p-4 border-r border-amber-100">
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-amber-100" />

            {/* Main Content */}
            <div className="md:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 sm:p-8"
                >
                  <div className="mb-8">
                    <h2
                      className="text-2xl font-bold text-indigo-900 flex items-center"
                      style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                    >
                      <span className="text-indigo-700 mr-2">
                        {tabIcons[activeTab as keyof typeof tabIcons]}
                      </span>
                      {t(`tabs.${activeTab}`)}
                    </h2>
                    <div className="mt-2 h-0.5 w-16 bg-amber-400 rounded-full" />
                  </div>
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
