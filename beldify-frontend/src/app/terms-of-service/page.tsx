'use client';

import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { API_BASE_URL } from '@/config/constants';

export default function TermsOfServicePage() {
  const { t, i18n } = useTranslation();
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
            {t('pages.termsOfService.title')}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('pages.termsOfService.title')}
          </h1>
          <p className="mt-4 text-indigo-300 text-sm">
            {t('pages.termsOfService.lastUpdated')}: {t('pages.termsOfService.lastUpdatedDate')}
          </p>
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-12 px-6 lg:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <FileText
                className="h-8 w-8 text-indigo-600 flex-shrink-0"
              />
              <h2
                className="text-2xl font-bold text-indigo-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('pages.termsOfService.userAgreement')}
              </h2>
            </div>

            <div
              className={`prose prose-indigo max-w-none ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.intro', 'Welcome to Beldify. These Terms of Service ("Terms") govern your access to and use of the Beldify website, services, and applications (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.')}
              </p>

              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.pleaseRead', 'Please read these Terms carefully before using our Services. If you do not agree to these Terms, you may not access or use the Services.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section1Title', '1. Account Registration and Requirements')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section1p1', 'To access certain features of our Services, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information and to update this information to maintain its accuracy. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section1p2', 'You must be at least 16 years of age to use our Services. If you are under the age of 18, you must have your parent or guardian\'s permission to use our Services.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section2Title', '2. User Conduct')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section2Intro', 'When using our Services, you agree not to:')}
              </p>
              <ul className="mt-3 space-y-2 text-gray-700">
                {[
                  t('content.termsOfService.conduct1', 'Violate any applicable laws or regulations'),
                  t('content.termsOfService.conduct2', 'Infringe upon the rights of others, including privacy and intellectual property rights'),
                  t('content.termsOfService.conduct3', 'Use our Services to distribute unsolicited commercial messages (spam)'),
                  t('content.termsOfService.conduct4', 'Upload or transmit viruses, malware, or other harmful code'),
                  t('content.termsOfService.conduct5', 'Attempt to gain unauthorized access to our systems or user accounts'),
                  t('content.termsOfService.conduct6', 'Interfere with or disrupt our Services or servers'),
                  t('content.termsOfService.conduct7', 'Impersonate any person or entity'),
                  t('content.termsOfService.conduct8', 'Engage in any activity that could disable, overburden, or impair the proper functioning of our Services'),
                  t('content.termsOfService.conduct9', 'Collect or harvest user information without consent'),
                  t('content.termsOfService.conduct10', 'Use our Services for any illegal or unauthorized purpose'),
                ].map((item, i) => (
                  <li key={i} className="relative ps-6 before:absolute before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-amber-500 before:start-2">
                    {item}
                  </li>
                ))}
              </ul>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section3Title', '3. Products and Orders')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section3p1', 'All product descriptions, images, and prices are subject to change without notice. We reserve the right to limit quantities, refuse orders, or discontinue products at our discretion. We make reasonable efforts to display accurate colors and descriptions, but we cannot guarantee that your device\'s display accurately reflects the actual colors of products.')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section3p2', 'When you place an order through our Services, you are making an offer to purchase the products in your cart. We reserve the right to accept or decline your offer for any reason, including product availability, errors in product information or pricing, or suspected fraudulent activity.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section4Title', '4. Seller Marketplace')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section4p1', 'Beldify provides a platform for sellers to offer their products to buyers. Sellers are independent third parties, and we are not responsible for their products, actions, or omissions. While we strive to ensure a safe and reliable marketplace, we cannot guarantee the quality, safety, or legality of products sold by third-party sellers.')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section4p2', 'For sellers using our platform, additional terms apply. Please refer to the Seller Terms available at')}{' '}
                <a href={API_BASE_URL} className="text-indigo-600 hover:text-indigo-800 underline">{API_BASE_URL}</a>{' '}
                {t('content.termsOfService.section4p2Suffix', 'for more information.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section5Title', '5. Payment and Pricing')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section5p1', 'By providing payment information, you represent and warrant that you have the legal right to use the payment method you provide. You authorize us to charge your payment method for the total amount of your order, including applicable taxes, shipping fees, and any other charges stated at checkout.')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section5p2', 'All prices are displayed in your selected currency and do not include taxes or shipping costs unless otherwise specified. We reserve the right to correct pricing errors at any time before accepting your order.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section6Title', '6. Shipping and Delivery')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section6p1', 'Shipping times and costs vary based on the delivery location, product availability, and selected shipping method. Estimated delivery dates are not guaranteed. For complete information about our shipping policies, please see our Shipping Information page.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section7Title', '7. Returns and Refunds')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section7p1', 'Our return and refund policies are outlined on our Returns page. By placing an order, you agree to these policies. We reserve the right to modify our return and refund policies at any time.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section8Title', '8. Intellectual Property Rights')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section8p1', 'The Services, including all content, features, and functionality, are owned by Beldify, its licensors, or other providers and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section8p2', 'You may not use, reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any content from our Services, except as permitted by these Terms or with our prior written consent.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section9Title', '9. User-Generated Content')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section9p1', 'By submitting content to our Services (such as reviews, comments, or posts in our community section), you grant Beldify a non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content throughout the world in any media.')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section9p2', 'You represent and warrant that your content does not violate any third-party rights, including privacy, publicity, copyright, trademark, or other intellectual property rights, and that it complies with these Terms and all applicable laws and regulations.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section10Title', '10. Limitation of Liability')}
              </h3>
              <p className="text-gray-700 leading-relaxed uppercase text-sm">
                {t('content.termsOfService.section10p1', 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, BELDIFY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section11Title', '11. Disclaimer of Warranties')}
              </h3>
              <p className="text-gray-700 leading-relaxed uppercase text-sm">
                {t('content.termsOfService.section11p1', 'THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. BELDIFY DISCLAIMS ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section12Title', '12. Indemnification')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section12p1', 'You agree to indemnify, defend, and hold harmless Beldify, its affiliates, officers, directors, employees, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys\' fees) arising out of or relating to your violation of these Terms or your use of the Services.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section13Title', '13. Governing Law')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section13p1', 'These Terms shall be governed by and construed in accordance with the laws of Morocco, without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to these Terms shall be brought exclusively in the courts located in Morocco.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section14Title', '14. Changes to These Terms')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section14p1', 'We reserve the right to modify these Terms at any time. When we make changes, we will update the "Last updated" date at the top of these Terms and, in some cases, provide additional notice. Your continued use of our Services after we post modifications to the Terms constitutes your acceptance of those changes.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section15Title', '15. Termination')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section15p1', 'We may terminate or suspend your account and access to our Services immediately, without prior notice or liability, for any reason, including, without limitation, if you breach these Terms. Upon termination, your right to use the Services will immediately cease.')}
              </p>

              <h3 className="mt-8 text-xl font-semibold text-indigo-900">
                {t('content.termsOfService.section16Title', '16. Contact Information')}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {t('content.termsOfService.section16Intro', 'If you have any questions about these Terms, please contact us at:')}
              </p>
              <address className="mt-4 not-italic text-gray-700 space-y-1">
                <p>{t('pages.termsOfService.contactEmail')}</p>
                <p>{t('pages.termsOfService.contactPhone')}</p>
                <p>{t('pages.termsOfService.contactAddress')}</p>
              </address>
            </div>

            {/* Atlas amber-50 callout panel */}
            <div className="mt-12 rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-4">
                  <FileText className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-indigo-900">
                      {t('pages.termsOfService.legalAssistance')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('pages.termsOfService.clarification')}
                    </p>
                  </div>
                </div>
                <div className="sm:ms-auto flex-shrink-0">
                  <a
                    href="/contact"
                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                  >
                    {t('pages.termsOfService.contactUs')}
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
