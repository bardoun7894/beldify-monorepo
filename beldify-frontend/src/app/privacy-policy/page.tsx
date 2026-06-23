'use client';

import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { intlLocale } from '@/i18n/config';

type TranslationArray = string[];

const ListItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="relative ps-6 before:absolute before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-amber-500 before:start-2">
      {children}
    </li>
  );
};

export default function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation();

  const lastUpdated = new Date('2025-05-18');
  const formattedDate = new Intl.DateTimeFormat(intlLocale(i18n.language), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(lastUpdated);

  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Atlas editorial hero strip */}
      <div className="relative bg-indigo-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, #f59e0b 0, transparent 45%), radial-gradient(circle at 85% 60%, #6366f1 0, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
            {t('pages.privacyPolicy.title')}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('pages.privacyPolicy.title')}
          </h1>
          <p className="mt-4 text-indigo-300 text-sm">
            {t('pages.privacyPolicy.lastUpdated')}: {formattedDate}
          </p>
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-12 px-6 lg:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <ShieldCheck
                className="h-8 w-8 text-indigo-600 flex-shrink-0"
              />
              <h2
                className="text-2xl font-bold text-indigo-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('pages.privacyPolicy.yourPrivacyMatters')}
              </h2>
            </div>

            <div
              className={`prose prose-indigo max-w-none ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.intro')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.infoWeCollect')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.infoWeCollectDescription')}
              </p>

              <h4 className="mt-6 text-lg font-medium text-indigo-900">
                {t('pages.privacyPolicy.sections.personalData')}
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.personalDataDescription')}
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                {(
                  t('pages.privacyPolicy.sections.personalDataItems', {
                    returnObjects: true,
                  }) as unknown as TranslationArray
                )?.map((item: string, index: number) => (
                  <ListItem key={index}>{item}</ListItem>
                ))}
              </ul>

              <h4 className="mt-6 text-lg font-medium text-indigo-900">
                {t('pages.privacyPolicy.sections.usageData')}
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.usageDataDescription')}
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                {(
                  t('pages.privacyPolicy.sections.usageDataItems', {
                    returnObjects: true,
                  }) as unknown as TranslationArray
                )?.map((item: string, index: number) => (
                  <ListItem key={index}>{item}</ListItem>
                ))}
              </ul>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.howWeUse')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.howWeUseDescription')}
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                {(
                  t('pages.privacyPolicy.sections.howWeUseItems', {
                    returnObjects: true,
                  }) as unknown as TranslationArray
                )?.map((item: string, index: number) => (
                  <ListItem key={index}>{item}</ListItem>
                ))}
              </ul>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.authServices')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.authServicesDescription')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.dataStorage')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.dataStorageDescription')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.infoSharing')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.infoSharingDescription')}
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                {(
                  t('pages.privacyPolicy.sections.infoSharingItems', {
                    returnObjects: true,
                  }) as unknown as TranslationArray
                )?.map((item: string, index: number) => (
                  <ListItem key={index}>{item}</ListItem>
                ))}
              </ul>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.cookies')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.cookiesDescription')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.yourRights')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.yourRightsDescription')}
              </p>
              <ul className="mt-4 space-y-2 text-gray-700">
                {(
                  t('pages.privacyPolicy.sections.yourRightsItems', {
                    returnObjects: true,
                  }) as unknown as TranslationArray
                )?.map((item: string, index: number) => (
                  <ListItem key={index}>{item}</ListItem>
                ))}
              </ul>
              <p className="mt-4 text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.yourRightsContact')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.childrenPrivacy')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.childrenPrivacyDescription')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.internationalTransfers')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.internationalTransfersDescription')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.changes')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.changesDescription')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('pages.privacyPolicy.sections.contactInfo')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('pages.privacyPolicy.sections.contactInfoDescription')}
              </p>
              <address className="mt-4 not-italic text-gray-700 space-y-2">
                {(
                  t('pages.privacyPolicy.sections.contactDetails', {
                    returnObjects: true,
                  }) as unknown as TranslationArray
                )?.map((item: string, index: number) => (
                  <p key={index}>{item}</p>
                ))}
              </address>
            </div>

            {/* Atlas amber-50 callout panel */}
            <div className="mt-12 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-4">
                  <ShieldCheck className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-indigo-900">
                      {t('pages.privacyPolicy.questions')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('pages.privacyPolicy.committed')}
                    </p>
                  </div>
                </div>
                <div className="sm:ms-auto flex-shrink-0">
                  <a
                    href="/contact"
                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                  >
                    {t('pages.privacyPolicy.contactUs')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
