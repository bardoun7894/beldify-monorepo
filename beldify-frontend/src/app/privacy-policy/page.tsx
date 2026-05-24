'use client';

import { useTranslation } from 'react-i18next';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const ListItem = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  
  return (
    <li className={`relative ${isRTL ? 'pr-6' : 'pl-6'} before:absolute before:top-1/2 before:h-1 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-indigo-600 ${isRTL ? 'before:right-2' : 'before:left-2'}`}>
      {children}
    </li>
  );
};

export default function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation();
  
  // Format the last updated date based on current locale
  const lastUpdated = new Date('2025-05-18');
  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(lastUpdated);
  
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  
  return (
    <div className="bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl text-center md:text-right">
            {t('pages.privacyPolicy.title')}
          </h1>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-500 text-center md:text-right">
            {t('pages.privacyPolicy.lastUpdated')}: {formattedDate}
          </p>
          
          <div className={`mt-6 md:mt-10 prose prose-indigo prose-sm md:prose-base lg:prose-lg max-w-none ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center mb-4 md:mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ShieldCheckIcon className={`h-6 w-6 md:h-8 md:w-8 text-indigo-600 flex-shrink-0 ${isRTL ? 'ml-2 md:ml-4' : 'mr-2 md:mr-4'}`} />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t('pages.privacyPolicy.yourPrivacyMatters')}
              </h2>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.intro')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.infoWeCollect')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.infoWeCollectDescription')}
            </p>
            
            <h4 className="mt-6 text-lg font-medium text-gray-900">
              {t('pages.privacyPolicy.sections.personalData')}
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.personalDataDescription')}
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              {(t('pages.privacyPolicy.sections.personalDataItems', { returnObjects: true }) as unknown as TranslationArray)?.map((item: string, index: number) => (
                <ListItem key={index}>{item}</ListItem>
              ))}
            </ul>
            
            <h4 className="mt-6 text-lg font-medium text-gray-900">
              {t('pages.privacyPolicy.sections.usageData')}
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.usageDataDescription')}
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              {(t('pages.privacyPolicy.sections.usageDataItems', { returnObjects: true }) as unknown as TranslationArray)?.map((item: string, index: number) => (
                <ListItem key={index}>{item}</ListItem>
              ))}
            </ul>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.howWeUse')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.howWeUseDescription')}
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              {(t('pages.privacyPolicy.sections.howWeUseItems', { returnObjects: true }) as unknown as TranslationArray)?.map((item: string, index: number) => (
                <ListItem key={index}>{item}</ListItem>
              ))}
            </ul>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.authServices')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.authServicesDescription')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.dataStorage')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.dataStorageDescription')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.infoSharing')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.infoSharingDescription')}
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              {(t('pages.privacyPolicy.sections.infoSharingItems', { returnObjects: true }) as unknown as TranslationArray)?.map((item: string, index: number) => (
                <ListItem key={index}>{item}</ListItem>
              ))}
            </ul>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.cookies')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.cookiesDescription')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.yourRights')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.yourRightsDescription')}
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              {(t('pages.privacyPolicy.sections.yourRightsItems', { returnObjects: true }) as unknown as TranslationArray)?.map((item: string, index: number) => (
                <ListItem key={index}>{item}</ListItem>
              ))}
            </ul>
            <p className="mt-4 text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.yourRightsContact')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.childrenPrivacy')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.childrenPrivacyDescription')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.internationalTransfers')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.internationalTransfersDescription')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.changes')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.changesDescription')}
            </p>
            
            <h3 className="mt-8 text-xl font-semibold text-gray-900">
              {t('pages.privacyPolicy.sections.contactInfo')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {t('pages.privacyPolicy.sections.contactInfoDescription')}
            </p>
            <address className="mt-4 not-italic text-gray-700 space-y-2">
              {(t('pages.privacyPolicy.sections.contactDetails', { returnObjects: true }) as unknown as TranslationArray)?.map((item: string, index: number) => (
                <p key={index}>{item}</p>
              ))}
            </address>
          </div>
          
          <div className="mt-8 md:mt-12 rounded-md bg-indigo-50 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex">
                <ShieldCheckIcon className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-base md:text-lg font-medium text-indigo-900">
                    {t('pages.privacyPolicy.questions')}
                  </h3>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm text-indigo-700">
                    {t('pages.privacyPolicy.committed')}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:ml-6 md:mt-0">
                <a
                  href="/contact"
                  className="inline-flex w-full md:w-auto justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t('pages.privacyPolicy.contactUs')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
