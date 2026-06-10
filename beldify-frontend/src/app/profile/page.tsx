'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { User, Lock, Settings, BookUser } from 'lucide-react';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import GeneralSettings from './components/GeneralSettings';
import SecuritySettings from './components/SecuritySettings';
import PreferencesSettings from './components/PreferencesSettings';
import AddressBook from './components/AddressBook';

const tabIcons = {
  general: <User className="me-2 h-5 w-5" aria-hidden="true" />,
  security: <Lock className="me-2 h-5 w-5" aria-hidden="true" />,
  preferences: <Settings className="me-2 h-5 w-5" aria-hidden="true" />,
  addresses: <BookUser className="me-2 h-5 w-5" aria-hidden="true" />,
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
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-atlas-md border border-amber-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-full ring-2 ring-amber-200 bg-amber-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-amber-500" />
            </div>
          </div>
          <span className="text-indigo-900 font-medium text-base">{t('page.loading')}</span>
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
      case 'addresses':
        return <AddressBook />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    // MotionConfig reducedMotion="user" makes every framer animation below (avatar
    // spring, tab x-transitions, whileHover/whileTap) honour the OS setting; CSS
    // transitions are already gated by the global prefers-reduced-motion block.
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-canvas py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* ── Breadcrumbs: Home / My Account / Profile ── */}
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t('navigation.account', { ns: 'common', defaultValue: 'My Account' }) },
            { label: t('title', { defaultValue: 'Profile' }) },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl shadow-atlas-md border border-amber-100 bg-white"
        >
          {/* Amber hairline accent top */}
          <div className="h-1 w-full bg-amber-400" />

          {/* Profile hero header */}
          <div className="p-5 sm:p-7 bg-white">
            <ProfileHeader user={user} />
          </div>

          <div className="grid md:grid-cols-12">
            {/* ── Sidebar tabs ── */}
            <div className="md:col-span-3 bg-amber-50 p-4 border-e border-amber-100">
              {/* Mobile: horizontal scroll pill tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:hidden snap-x snap-mandatory">
                {(['general', 'security', 'preferences', 'addresses'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'snap-start shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-indigo-700 text-white shadow-atlas-sm'
                          : 'bg-white text-indigo-700 ring-1 ring-indigo-100 hover:ring-indigo-200',
                      ].join(' ')}
                    >
                      {tabIcons[tab]}
                      {t(`tabs.${tab}`)}
                    </button>
                  );
                })}
              </div>

              {/* Desktop: vertical sidebar */}
              <div className="hidden md:block">
                <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </div>

            {/* ── Main content ── */}
            <div className="md:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="p-5 sm:p-7"
                >
                  {/* Tab heading */}
                  <div className="mb-7">
                    <h2
                      className="flex items-center text-2xl font-bold text-indigo-900"
                      style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                    >
                      <span className="text-indigo-700">
                        {tabIcons[activeTab as keyof typeof tabIcons]}
                      </span>
                      {t(`tabs.${activeTab}`)}
                    </h2>
                    <div className="mt-2 h-0.5 w-14 rounded-full bg-amber-400" />
                  </div>

                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </MotionConfig>
  );
}
